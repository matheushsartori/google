import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const instances = await prisma.connectionInstance.findMany();
        return NextResponse.json(instances);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, token, integration } = body;

        console.log(`🚀 Tentando criar instância: ${name}`);

        if (!name) {
            return NextResponse.json({ error: "O nome da instância é obrigatório" }, { status: 400 });
        }

        // 1. Get Evolution API Settings
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        let apiUrl = settingsMap["EVOLUTION_API_URL"];
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (!apiUrl || !apiToken) {
            return NextResponse.json({ error: "Configurações da Evolution API não encontradas. Configure em Ajustes primeiro." }, { status: 400 });
        }

        // Sanitize URL (remover barra no final se existir)
        apiUrl = apiUrl.replace(/\/$/, "");

        // 2. Create instance on Evolution API
        // Include webhook configuration directly in the creation payload
        const payload = {
            instanceName: name,
            token: token || "22",
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
            webhook: {
                url: "https://google-iota-tan.vercel.app/api/webhook",
                byEvents: false,
                base64: false,
                events: [
                    "QRCODE_UPDATED",
                    "CONNECTION_UPDATE",
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE",
                    "SEND_MESSAGE"
                ]
            }
        };

        console.log("🚀 Enviando para Evolution API:", JSON.stringify(payload, null, 2));

        try {
            const evolutionResponse = await fetch(`${apiUrl}/instance/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": apiToken,
                },
                body: JSON.stringify(payload),
            });

            const evoData = await evolutionResponse.json();

            if (!evolutionResponse.ok) {
                console.error("❌ Resposta de erro da Evolution API:", JSON.stringify(evoData, null, 2));
                return NextResponse.json({
                    error: evoData.response?.message?.[0] || evoData.message || "Erro retornado pela Evolution API",
                    details: evoData
                }, { status: evolutionResponse.status });
            }

            console.log("✅ Instância criada na Evolution API com sucesso");
            console.log("✅ Webhook configurado automaticamente na criação");

            // 3. Save to local DB (using instanceName as instanceId)
            const instance = await prisma.connectionInstance.upsert({
                where: { instanceId: name },
                update: {
                    name: name,
                    instanceId: name,
                    token: token || "22",
                    status: "DISCONNECTED",
                    webhookStatus: "ACTIVE",
                },
                create: {
                    name: name,
                    instanceId: name,
                    token: token || "22",
                    status: "DISCONNECTED",
                    webhookStatus: "ACTIVE",
                },
            });

            return NextResponse.json(instance);
        } catch (fetchError: any) {
            console.error("❌ Erro de conexão com a Evolution API:", fetchError);
            return NextResponse.json({
                error: "Não foi possível conectar à Evolution API. Verifique se a URL está correta e a API está online.",
                details: fetchError.message
            }, { status: 502 });
        }
    } catch (error: any) {
        console.error("❌ Erro interno:", error);
        return NextResponse.json({ error: error.message || "Erro interno ao processar requisição" }, { status: 500 });
    }
}


