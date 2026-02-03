import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage, sendPresence } from "@/lib/evolution";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("📩 Webhook Received:", JSON.stringify(body, null, 2));

        const { event, instance, data } = body;

        // Only process incoming messages (UPSERT)
        if (event !== "messages.upsert") {
            return NextResponse.json({ success: true, message: "Ignoring non-upsert event" });
        }

        const message = data.message;
        const key = data.key;

        // Ignore messages from me
        if (key.fromMe) {
            return NextResponse.json({ success: true, message: "Ignoring self message" });
        }

        const remoteJid = key.remoteJid;
        const phone = remoteJid.split("@")[0];
        const text = message.conversation || message.extendedTextMessage?.text || "";

        if (!text) {
            return NextResponse.json({ success: true, message: "No text content" });
        }

        // 1. Get Settings
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const aiEnabled = settingsMap["AI_ENABLED"] === "true";
        const flowInterval = parseInt(settingsMap["FLOW_INTERVAL"] || "5") * 1000;

        // 2. Find or Create Lead
        let lead = await prisma.lead.findUnique({
            where: { phone },
        });

        const isNewLead = !lead;

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    phone,
                    status: "NEW",
                    activeBot: true,
                },
            });
        }

        // 3. Save Message in DB
        await prisma.message.create({
            data: {
                content: text,
                sender: "LEAD",
                leadId: lead.id,
            },
        });

        // 4. Handle Flow if AI is disabled and Lead is new
        if (!aiEnabled) {
            if (isNewLead || lead.status === "NEW") {
                // Update lead status to avoid re-triggering
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: "IN_PROGRESS" },
                });

                // Start Flow Sequence
                // Msg 1
                const msg1 = settingsMap["FLOW_MSG_1"] || "Olá! Seja bem-vindo ao Mercês Tênis.";
                await sendPresence(instance, remoteJid, "composing");
                await sleep(2000); // Small initial delay
                await sendMessage(instance, remoteJid, msg1);

                await prisma.message.create({
                    data: { content: msg1, sender: "BOT", leadId: lead.id }
                });

                // Msg 2
                await sleep(flowInterval);
                const host = request.headers.get("host") || "localhost:3000";
                const protocol = host.startsWith("localhost") ? "http" : "https";
                const registrationLink = `${protocol}://${host}/marcar-aula`;
                let msg2 = settingsMap["FLOW_MSG_2"] || "Aula experimental: {LINK_AULA}";
                msg2 = msg2.replace("{LINK_AULA}", registrationLink);

                await sendPresence(instance, remoteJid, "composing");
                await sleep(1500);
                await sendMessage(instance, remoteJid, msg2);

                await prisma.message.create({
                    data: { content: msg2, sender: "BOT", leadId: lead.id }
                });

                // Msg 3
                await sleep(flowInterval);
                const msg3 = settingsMap["FLOW_MSG_3"] || "Aguardamos seu contato!";

                await sendPresence(instance, remoteJid, "composing");
                await sleep(1500);
                await sendMessage(instance, remoteJid, msg3);

                await prisma.message.create({
                    data: { content: msg3, sender: "BOT", leadId: lead.id }
                });
            }
        } else {
            // IA logic would go here
            console.log("🤖 AI is enabled. Processing message through AI engine...");
            // Placeholder: For now, AI just logs. 
            // In a real implementation, we would call OpenAI here.
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
