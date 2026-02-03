import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/evolution";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { leadId, content } = body;

        if (!leadId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Lead
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        // 2. Get Active Instance
        // We prioritize instances that are CONNECTED.
        const instance = await prisma.connectionInstance.findFirst({
            where: { status: "CONNECTED" },
        });

        if (!instance) {
            return NextResponse.json({ error: "No active WhatsApp instance found" }, { status: 503 });
        }

        // 3. Send Message via Evolution API
        // Assuming lead.phone is a clean number (e.g., 5511999999999). 
        // Evolution API endpoint /message/sendText/{instance} usually expects 'number' which can be raw number.
        await sendMessage(instance.instanceId, lead.phone, content);

        // 4. Save to Database
        const message = await prisma.message.create({
            data: {
                content,
                sender: "USER",
                leadId: lead.id,
            },
        });

        // 5. Update Lead Status (Optional, maybe set to IN_PROGRESS if NEW)
        if (lead.status === "NEW") {
            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: "IN_PROGRESS" },
            });
        }

        return NextResponse.json(message);
    } catch (error: any) {
        console.error("Failed to send message:", error);
        return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
    }
}
