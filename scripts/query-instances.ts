import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
const prisma = new PrismaClient();

async function main() {
    const instances = await prisma.connectionInstance.findMany();
    const settings = await prisma.settings.findMany({
        where: { key: { in: ["EVOLUTION_API_URL", "EVOLUTION_API_TOKEN"] } },
    });
    const result = { instances, settings };
    writeFileSync("scripts/result.json", JSON.stringify(result, null, 2), "utf8");
    await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
