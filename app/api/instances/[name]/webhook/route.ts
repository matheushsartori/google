import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setInstanceWebhook } from "@/lib/uazapi";

/**
 * POST /api/instances/[name]/webhook
 * Configura o webhook de uma instância na UazAPI
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const body = await request.json().catch(() => ({}));

        // Webhook URL: do body, ou das settings, ou padrão
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const webhookUrl = body.url
            || settingsMap["WEBHOOK_URL"]
            || "https://auto.mercestenis.com.br/api/webhook";

        console.log(`📡 Configurando webhook para ${name}: ${webhookUrl}`);

        const result = await setInstanceWebhook(name, webhookUrl, ["messages", "connection"]);

        // Atualizar status no banco
        await prisma.connectionInstance.updateMany({
            where: { instanceId: name },
            data: { webhookStatus: "ACTIVE" },
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("❌ Webhook config error:", error);
        return NextResponse.json({ error: error.message || "Failed to configure webhook" }, { status: 500 });
    }
}
