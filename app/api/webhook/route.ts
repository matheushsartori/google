import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage, sendPresence } from "@/lib/uazapi";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// UazAPI (e qualquer cliente) faz um GET para validar o endpoint
export async function GET() {
    return NextResponse.json({ success: true, message: "Webhook endpoint is alive" });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("📩 Webhook Received:", JSON.stringify(body, null, 2));

        /**
         * UazAPI webhook format:
         * {
         *   event: "messages" | "connection" | "contacts" | "presence",
         *   instance: { id, token, name, ... },
         *   data: { ... }  (ou direto no body dependendo do evento)
         * }
         * 
         * Para "connection":
         * { event: "connection", instance: {...}, data: { status: "connected"|"disconnected"|"connecting", ... } }
         * 
         * Para "messages":
         * { event: "messages", instance: {...}, data: { key: { remoteJid, fromMe, id }, message: { conversation, ... }, ... } }
         */

        const event = body.event || body.type;
        const instanceInfo = body.instance;
        const instanceName = instanceInfo?.name || instanceInfo?.id || body.instanceName;
        const data = body.data || body;

        // Save webhook log
        try {
            await prisma.webhookLog.create({
                data: {
                    event: event || "UNKNOWN",
                    instance: instanceName || null,
                    data: body,
                },
            });
        } catch (logError) {
            console.error("Error saving webhook log:", logError);
        }

        // ── Connection event ──────────────────────────────────────────────────
        if (event === "connection") {
            const status = data?.status || data?.state;
            const isConnected = status === "connected" || status === "open";

            if (instanceName) {
                try {
                    await prisma.connectionInstance.updateMany({
                        where: { instanceId: instanceName },
                        data: {
                            status: isConnected ? "CONNECTED" : "DISCONNECTED",
                            lastSync: new Date(),
                        },
                    });
                    console.log(`✅ Instância ${instanceName}: ${isConnected ? "CONNECTED" : "DISCONNECTED"}`);
                } catch (dbError) {
                    console.error("Erro ao atualizar status:", dbError);
                }
            }
            return NextResponse.json({ success: true });
        }

        // ── Messages event ────────────────────────────────────────────────────
        if (event !== "messages") {
            return NextResponse.json({ success: true, message: `Ignoring event: ${event}` });
        }

        const message = data.message || data;
        const key = data.key || {};

        // Ignorar mensagens enviadas por nós
        if (key.fromMe === true) {
            return NextResponse.json({ success: true, message: "Ignoring self message" });
        }

        const remoteJid = key.remoteJid || data.remoteJid || "";

        // Ignorar grupos
        if (remoteJid.includes("@g.us")) {
            return NextResponse.json({ success: true, message: "Ignoring group message" });
        }

        const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
        const text = message.conversation
            || message.extendedTextMessage?.text
            || message.text
            || data.text
            || "";

        if (!phone || !text) {
            return NextResponse.json({ success: true, message: "No phone or text content" });
        }

        // 1. Buscar settings
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const aiEnabled = settingsMap["AI_ENABLED"] === "true";
        const flowInterval = parseInt(settingsMap["FLOW_INTERVAL"] || "5") * 1000;

        // 2. Encontrar ou criar Lead
        let lead = await prisma.lead.findUnique({ where: { phone } });
        const isNewLead = !lead;

        if (!lead) {
            lead = await prisma.lead.create({
                data: { phone, status: "NEW", activeBot: true },
            });
        }

        // 3. Salvar mensagem
        await prisma.message.create({
            data: { content: text, sender: "LEAD", leadId: lead.id },
        });

        // 4. Flow (se AI desabilitada e lead é novo)
        if (!aiEnabled && (isNewLead || lead.status === "NEW")) {
            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: "IN_PROGRESS" },
            });

            const msg1 = settingsMap["FLOW_MSG_1"] || "Olá! Seja bem-vindo ao Mercês Tênis.";
            await sendPresence(instanceName, remoteJid, "composing");
            await sleep(2000);
            await sendMessage(instanceName, phone, msg1);
            await prisma.message.create({ data: { content: msg1, sender: "BOT", leadId: lead.id } });

            await sleep(flowInterval);
            const host = request.headers.get("host") || "auto.mercestenis.com.br";
            const protocol = host.startsWith("localhost") ? "http" : "https";
            const registrationLink = `${protocol}://${host}/marcar-aula`;
            let msg2 = settingsMap["FLOW_MSG_2"] || "Aula experimental: {LINK_AULA}";
            msg2 = msg2.replace("{LINK_AULA}", registrationLink);

            await sendPresence(instanceName, remoteJid, "composing");
            await sleep(1500);
            await sendMessage(instanceName, phone, msg2);
            await prisma.message.create({ data: { content: msg2, sender: "BOT", leadId: lead.id } });

            await sleep(flowInterval);
            const msg3 = settingsMap["FLOW_MSG_3"] || "Aguardamos seu contato!";
            await sendPresence(instanceName, remoteJid, "composing");
            await sleep(1500);
            await sendMessage(instanceName, phone, msg3);
            await prisma.message.create({ data: { content: msg3, sender: "BOT", leadId: lead.id } });
        } else if (aiEnabled) {
            console.log("🤖 AI enabled - processing through AI engine...");
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
