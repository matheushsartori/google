import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const BASE_URL = "https://sartori.uazapi.com";

async function main() {
    // Buscar instância "merces" no banco
    const merces = await prisma.connectionInstance.findUnique({ where: { instanceId: "merces" } });

    if (!merces?.token) {
        console.log("Instância 'merces' não encontrada no banco ou sem token.");
        return;
    }

    console.log(`🗑️  Deletando "merces" da UazAPI (token: ${merces.token.slice(0, 8)}...)...`);

    // Deletar da UazAPI
    const res = await fetch(`${BASE_URL}/instance`, {
        method: "DELETE",
        headers: { "token": merces.token },
    });
    const data = await res.json();
    console.log(`  UazAPI response [${res.status}]:`, data?.response || data);

    // Deletar do banco
    await prisma.connectionInstance.delete({ where: { instanceId: "merces" } });
    console.log(`  ✅ Removida do banco local`);

    // Estado final
    const remaining = await prisma.connectionInstance.findMany();
    console.log("\nInstâncias restantes:");
    remaining.forEach(i => console.log(`  ✅ ${i.instanceId} | ${i.status} | token: ${i.token?.slice(0, 8)}`));

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
