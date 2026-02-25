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

    if (!apiUrl || !apiToken) {
        console.error("Configurações não encontradas no banco!");
        process.exit(1);
    }

    // Buscar instâncias na Evolution API
    const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: "GET",
        headers: {
            "apikey": apiToken,
            "Content-Type": "application/json",
        },
    });

    const raw = await response.text();
    console.log("HTTP Status:", response.status);

    let data: any;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        data = raw;
    }

    writeFileSync("scripts/evo-instances.json", JSON.stringify(data, null, 2), "utf8");
    console.log("Salvo em scripts/evo-instances.json");

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
