import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
    // Buscar configs do banco
    const settings = await prisma.settings.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    const apiUrl = settingsMap["EVOLUTION_API_URL"]?.replace(/\/$/, "");
    const apiToken = settingsMap["EVOLUTION_API_TOKEN"]?.trim();

    console.log("API URL:", apiUrl);
    console.log("API Token:", apiToken);

    const instanceName = `test-script-${Date.now()}`;
    const token = "my-test-token-123";

    const payload = {
        instanceName,
        token,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhook: {
            url: "https://auto.mercestenis.com.br/api/webhook",
            byEvents: false,
            base64: false,
            events: [
                "QRCODE_UPDATED",
                "CONNECTION_UPDATE",
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "SEND_MESSAGE",
            ],
        },
    };

    console.log("\n📤 Payload enviado:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(`${apiUrl}/instance/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: apiToken!,
        },
        body: JSON.stringify(payload),
    });

    const raw = await response.text();
    console.log("\n📥 HTTP Status:", response.status);
    console.log("📥 Headers:", Object.fromEntries(response.headers.entries()));

    let data: any;
    try {
        data = JSON.parse(raw);
    } catch {
        data = { raw };
    }

    console.log("\n📥 Response body:");
    console.log(JSON.stringify(data, null, 2));

    writeFileSync(
        "scripts/create-instance-result.json",
        JSON.stringify({ status: response.status, payload, response: data }, null, 2),
        "utf8"
    );
    console.log("\n✅ Salvo em scripts/create-instance-result.json");

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
