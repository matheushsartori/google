import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        console.log(`🔗 Configurando webhook para instância: ${name}`);

        // 1. Get Evolution API Settings
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        let apiUrl = settingsMap["EVOLUTION_API_URL"];
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (!apiUrl || !apiToken) {
            return NextResponse.json({ error: "Evolution API settings not configured" }, { status: 400 });
        }

        apiUrl = apiUrl.replace(/\/$/, "");

        // 2. Configure webhook
        const webhookUrl = "https://google-iota-tan.vercel.app/api/webhook";
        const webhookPayload = {
            enabled: true,
            url: webhookUrl,
            webhook_by_events: false,
            events: [
                "QRCODE_UPDATED",
                "CONNECTION_UPDATE",
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "SEND_MESSAGE"
            ],
            webhook_base64: false
        };

        console.log("📡 Payload do webhook:", JSON.stringify(webhookPayload, null, 2));

        const webhookResponse = await fetch(`${apiUrl}/webhook/set/${name}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": apiToken,
            },
            body: JSON.stringify(webhookPayload),
        });

        const webhookData = await webhookResponse.json();
        console.log("✅ Resposta da Evolution API:", JSON.stringify(webhookData, null, 2));

        if (!webhookResponse.ok) {
            return NextResponse.json({
                error: "Failed to configure webhook",
                details: webhookData
            }, { status: webhookResponse.status });
        }

        // 3. Update local database
        await prisma.connectionInstance.updateMany({
            where: { instanceId: name },
            data: {
                webhookStatus: "ACTIVE",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Webhook configured successfully",
            data: webhookData
        });
    } catch (error: any) {
        console.error("❌ Error configuring webhook:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
