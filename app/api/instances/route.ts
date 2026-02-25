import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllInstances } from "@/lib/uazapi";

export async function GET() {
    try {
        // 1. Buscar instâncias do banco local
        const localInstances = await prisma.connectionInstance.findMany();

        // 2. Sincronizar com UazAPI (busca status e token reais)
        try {
            const evoInstances = await listAllInstances();

            for (const local of localInstances) {
                const uazInst = evoInstances.find((e: any) => e.name === local.instanceId);
                if (uazInst) {
                    const isConnected = uazInst.status === "connected";
                    await prisma.connectionInstance.update({
                        where: { instanceId: local.instanceId },
                        data: {
                            status: isConnected ? "CONNECTED" : "DISCONNECTED",
                            token: uazInst.token || local.token,
                            lastSync: new Date(),
                        },
                    });
                }
            }
        } catch (syncError) {
            console.error("Erro ao sincronizar com UazAPI:", syncError);
            // Retorna dados locais mesmo se falhar
        }

        // 3. Retornar dados atualizados
        const updated = await prisma.connectionInstance.findMany();
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, systemName } = body;

        if (!name) {
            return NextResponse.json({ error: "O nome da instância é obrigatório" }, { status: 400 });
        }

        console.log(`🚀 Criando instância na UazAPI: ${name}`);

        // 1. Verificar configurações
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const apiUrl = settingsMap["UAZAPI_URL"]?.replace(/\/$/, "");
        const adminToken = settingsMap["UAZAPI_ADMIN_TOKEN"]?.trim();

        if (!apiUrl || !adminToken) {
            return NextResponse.json({
                error: "UazAPI não configurada. Configure UAZAPI_URL e UAZAPI_ADMIN_TOKEN em Ajustes."
            }, { status: 400 });
        }

        // 2. Criar instância na UazAPI
        const uazRes = await fetch(`${apiUrl}/instance/init`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "admintoken": adminToken,
            },
            body: JSON.stringify({
                name,
                systemName: systemName || name,
            }),
        });

        const uazData = await uazRes.json();

        if (!uazRes.ok) {
            console.error("❌ UazAPI create error:", uazData);
            return NextResponse.json({
                error: uazData?.message || "Erro ao criar instância na UazAPI",
                details: uazData,
            }, { status: uazRes.status });
        }

        // Token fica em data.token (nível raiz) e também em data.instance.token
        const instanceToken = uazData.token || uazData.instance?.token;

        console.log(`✅ Instância criada. Token: ${instanceToken}`);

        // 3. Configurar webhook automaticamente
        const webhookUrl = settingsMap["WEBHOOK_URL"] || "https://auto.mercestenis.com.br/api/webhook";
        try {
            await fetch(`${apiUrl}/webhook`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": instanceToken,
                },
                body: JSON.stringify({
                    enabled: true,
                    url: webhookUrl,
                    events: ["messages", "connection"],
                }),
            });
            console.log(`✅ Webhook configurado: ${webhookUrl}`);
        } catch (webhookErr) {
            console.error("⚠️ Webhook config failed (non-fatal):", webhookErr);
        }

        // 4. Salvar no banco local
        const instance = await prisma.connectionInstance.upsert({
            where: { instanceId: name },
            update: {
                name,
                instanceId: name,
                token: instanceToken,
                status: "DISCONNECTED",
                webhookStatus: "ACTIVE",
            },
            create: {
                name,
                instanceId: name,
                token: instanceToken,
                status: "DISCONNECTED",
                webhookStatus: "ACTIVE",
            },
        });

        return NextResponse.json(instance);
    } catch (error: any) {
        console.error("❌ Erro interno:", error);
        return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
    }
}
