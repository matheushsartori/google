/**
 * Cria instância e verifica resultado - saída para arquivo
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();
const BASE_URL = "https://sartori.uazapi.com";
const ADMIN_TOKEN = "VJsb6olEqblPMd74Y3dQoYsg4q6MXH61JEps7LpVheajTwFWHS";
const WEBHOOK_URL = "https://auto.mercestenis.com.br/api/webhook";
const INSTANCE_NAME = "merces-tenis";
const SYSTEM_NAME = "Mercês Tênis";

async function main() {
    const result: Record<string, any> = {};

    // Verificar se já existe na UazAPI
    const listRes = await fetch(`${BASE_URL}/instance/all`, {
        headers: { "admintoken": ADMIN_TOKEN },
    });
    const existing: any[] = await listRes.json();
    result.existingOnUazAPI = existing.map(i => ({ name: i.name, token: i.token, status: i.status }));

    // Verificar banco local
    const localInstances = await prisma.connectionInstance.findMany();
    result.existingOnDB = localInstances.map(i => ({ name: i.name, instanceId: i.instanceId, token: i.token, status: i.status }));

    // Se já existe com este nome na UazAPI, usar o existente
    const existingInst = existing.find(i => i.name === INSTANCE_NAME);
    let token: string;

    if (existingInst) {
        result.action = "REUSED_EXISTING";
        token = existingInst.token;
        result.token = token;
    } else {
        // Criar nova
        const createRes = await fetch(`${BASE_URL}/instance/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "admintoken": ADMIN_TOKEN },
            body: JSON.stringify({ name: INSTANCE_NAME, systemName: SYSTEM_NAME }),
        });
        const createData = await createRes.json();
        result.action = "CREATED_NEW";
        result.createStatus = createRes.status;
        result.createData = createData;
        token = createData.token;
        result.token = token;
    }

    // Configurar webhook
    if (token) {
        const webhookRes = await fetch(`${BASE_URL}/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "token": token },
            body: JSON.stringify({
                enabled: true,
                url: WEBHOOK_URL,
                events: ["messages", "connection", "messages_update"],
            }),
        });
        result.webhookStatus = webhookRes.status;
        result.webhookData = await webhookRes.json();

        // Salvar/atualizar no banco
        await prisma.connectionInstance.upsert({
            where: { instanceId: INSTANCE_NAME },
            update: { token, status: "DISCONNECTED", webhookStatus: "ACTIVE" },
            create: {
                name: INSTANCE_NAME,
                instanceId: INSTANCE_NAME,
                token,
                status: "DISCONNECTED",
                webhookStatus: "ACTIVE",
            },
        });
    }

    // Estado final
    const finalLocal = await prisma.connectionInstance.findMany();
    result.finalDB = finalLocal.map(i => ({ name: i.name, instanceId: i.instanceId, token: i.token, status: i.status, webhookStatus: i.webhookStatus }));

    const finalUaz = await fetch(`${BASE_URL}/instance/all`, { headers: { "admintoken": ADMIN_TOKEN } });
    const finalUazData: any[] = await finalUaz.json();
    result.finalUazAPI = finalUazData.map(i => ({ name: i.name, token: i.token, status: i.status }));

    writeFileSync("scripts/setup-result.json", JSON.stringify(result, null, 2), "utf8");
    await prisma.$disconnect();
    console.log("Done - check scripts/setup-result.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
