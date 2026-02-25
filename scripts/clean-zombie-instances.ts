import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    // Listar instâncias atuais
    const all = await prisma.connectionInstance.findMany();
    console.log("Instâncias no banco:");
    all.forEach(i => console.log(`  ${i.instanceId} | token: ${i.token?.slice(0, 8) || "null"} | status: ${i.status}`));

    // Deletar registros sem token (instâncias zumbi da Evolution API)
    const deleted = await prisma.connectionInstance.deleteMany({
        where: { token: null }
    });
    console.log(`\n🗑️  Removidos ${deleted.count} registro(s) sem token`);

    const remaining = await prisma.connectionInstance.findMany();
    console.log("\nInstâncias restantes:");
    remaining.forEach(i => console.log(`  ✅ ${i.instanceId} | status: ${i.status} | webhookStatus: ${i.webhookStatus}`));

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
