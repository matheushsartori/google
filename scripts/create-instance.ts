/**
 * Cria uma instância nova e configura webhook
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "https://sartori.uazapi.com";
const ADMIN_TOKEN = "VJsb6olEqblPMd74Y3dQoYsg4q6MXH61JEps7LpVheajTwFWHS";
const WEBHOOK_URL = "https://auto.mercestenis.com.br/api/webhook";

// ← Nome da instância que quiser
const INSTANCE_NAME = "merces-tenis";
const SYSTEM_NAME = "Mercês Tênis";

async function main() {
    console.log(`=== CRIANDO INSTÂNCIA: ${INSTANCE_NAME} ===\n`);

    // 1. Criar na UazAPI
    console.log("🚀 Criando instância na UazAPI...");
    const createRes = await fetch(`${BASE_URL}/instance/init`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "admintoken": ADMIN_TOKEN,
        },
        body: JSON.stringify({ name: INSTANCE_NAME, systemName: SYSTEM_NAME }),
    });

    const createData = await createRes.json();
    console.log(`  Status: ${createRes.status}`);

    if (!createRes.ok) {
        console.error("  ❌ Erro ao criar instância:", createData);
        process.exit(1);
    }

    const token = createData.token;
    const instanceId = createData.instance?.id;
    console.log(`  ✅ Instância criada!`);
    console.log(`  Nome:  ${INSTANCE_NAME}`);
    console.log(`  Token: ${token}`);
    console.log(`  ID:    ${instanceId}\n`);

    // 2. Configurar webhook
    console.log("📡 Configurando webhook...");
    const webhookRes = await fetch(`${BASE_URL}/webhook`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": token,
        },
        body: JSON.stringify({
            enabled: true,
            url: WEBHOOK_URL,
            events: ["messages", "connection", "messages_update"],
        }),
    });

    const webhookData = await webhookRes.json();
    console.log(`  Status: ${webhookRes.status}`);
    if (webhookRes.ok) {
        console.log(`  ✅ Webhook configurado: ${WEBHOOK_URL}\n`);
    } else {
        console.log(`  ⚠️ Webhook error:`, webhookData);
    }

    // 3. Salvar no banco
    console.log("🗄️  Salvando no banco local...");
    const instance = await prisma.connectionInstance.upsert({
        where: { instanceId: INSTANCE_NAME },
        update: {
            name: INSTANCE_NAME,
            token: token,
            status: "DISCONNECTED",
            webhookStatus: "ACTIVE",
        },
        create: {
            name: INSTANCE_NAME,
            instanceId: INSTANCE_NAME,
            token: token,
            status: "DISCONNECTED",
            webhookStatus: "ACTIVE",
        },
    });

    console.log(`  ✅ Salvo! ID no banco: ${instance.id}\n`);
    console.log("=== RESUMO ===");
    console.log(`  Nome:        ${INSTANCE_NAME}`);
    console.log(`  Token:       ${token}`);
    console.log(`  Webhook:     ${WEBHOOK_URL}`);
    console.log(`  Status:      DISCONNECTED (aguardando QR Code)`);
    console.log("\n✅ Pronto! Agora conecte pelo painel escaneando o QR Code.");

    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
