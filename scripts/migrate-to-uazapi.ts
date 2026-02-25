/**
 * Script para migrar settings da Evolution API → UazAPI
 * e configurar o webhook global
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

const UAZAPI_URL = "https://sartori.uazapi.com";
const UAZAPI_ADMIN_TOKEN = "VJsb6olEqblPMd74Y3dQoYsg4q6MXH61JEps7LpVheajTwFWHS";
const WEBHOOK_URL = "https://auto.mercestenis.com.br/api/webhook";

async function upsertSetting(key: string, value: string) {
    await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
    console.log(`  ✅ ${key} = ${value}`);
}

async function main() {
    console.log("=== ATUALIZANDO SETTINGS PARA UAZAPI ===\n");

    // Salvar configurações da UazAPI
    await upsertSetting("UAZAPI_URL", UAZAPI_URL);
    await upsertSetting("UAZAPI_ADMIN_TOKEN", UAZAPI_ADMIN_TOKEN);
    await upsertSetting("WEBHOOK_URL", WEBHOOK_URL);

    console.log("\n=== CONFIGURANDO WEBHOOK GLOBAL NA UAZAPI ===\n");

    // Configurar webhook global
    const res = await fetch(`${UAZAPI_URL}/globalwebhook`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "admintoken": UAZAPI_ADMIN_TOKEN,
        },
        body: JSON.stringify({
            url: WEBHOOK_URL,
            events: ["messages", "connection"],
            enabled: true,
        }),
    });

    const data = await res.json();
    console.log("  Status:", res.status);
    console.log("  Response:", JSON.stringify(data, null, 2));

    if (res.ok) {
        console.log("  ✅ Webhook global configurado!");
    } else {
        console.log("  ❌ Falhou ao configurar webhook global");
    }

    console.log("\n=== LISTANDO INSTÂNCIAS NA UAZAPI ===\n");

    const listRes = await fetch(`${UAZAPI_URL}/instance/all`, {
        headers: { "admintoken": UAZAPI_ADMIN_TOKEN },
    });
    const instances = await listRes.json();
    console.log("  Instâncias:", JSON.stringify(instances, null, 2));

    writeFileSync("scripts/migrate-result.json", JSON.stringify({
        settings: { UAZAPI_URL, UAZAPI_ADMIN_TOKEN, WEBHOOK_URL },
        globalWebhook: data,
        instances,
    }, null, 2), "utf8");

    console.log("\n✅ Tudo pronto! Salvo em scripts/migrate-result.json");
    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
