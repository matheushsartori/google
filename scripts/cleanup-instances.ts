/**
 * Deleta TODAS as instâncias da UazAPI e do banco local
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "https://sartori.uazapi.com";
const ADMIN_TOKEN = "VJsb6olEqblPMd74Y3dQoYsg4q6MXH61JEps7LpVheajTwFWHS";

async function main() {
    console.log("=== LIMPEZA DE INSTÂNCIAS ===\n");

    // 1. Buscar todas as instâncias na UazAPI
    console.log("📋 Buscando instâncias na UazAPI...");
    const listRes = await fetch(`${BASE_URL}/instance/all`, {
        headers: { "admintoken": ADMIN_TOKEN },
    });
    const instances: any[] = await listRes.json();
    console.log(`  Encontradas: ${instances.length} instância(s)\n`);

    // 2. Deletar cada uma na UazAPI
    for (const inst of instances) {
        console.log(`🗑️  Deletando "${inst.name}" (token: ${inst.token})...`);
        try {
            const delRes = await fetch(`${BASE_URL}/instance`, {
                method: "DELETE",
                headers: { "token": inst.token },
            });
            const delData = await delRes.json();
            console.log(`  ✅ Status ${delRes.status}:`, delData.response || delData);
        } catch (err: any) {
            console.log(`  ❌ Erro: ${err.message}`);
        }
    }

    // 3. Limpar banco local
    console.log("\n🗄️  Limpando banco local...");
    const deleted = await prisma.connectionInstance.deleteMany({});
    console.log(`  ✅ ${deleted.count} registro(s) removido(s) do banco\n`);

    // 4. Confirmar estado final
    console.log("📋 Estado final na UazAPI:");
    const finalRes = await fetch(`${BASE_URL}/instance/all`, {
        headers: { "admintoken": ADMIN_TOKEN },
    });
    const finalInstances = await finalRes.json();
    console.log(`  Instâncias restantes: ${finalInstances.length}`);
    if (finalInstances.length === 0) {
        console.log("  ✅ UazAPI está limpa!\n");
    }

    const localCount = await prisma.connectionInstance.count();
    console.log(`  Banco local: ${localCount} instância(s)\n`);
    console.log("✅ Limpeza concluída!");

    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
