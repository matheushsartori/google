import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rawTeachers = [
    { name: "Edson Martins", email: "ed.mpf@outlook.com", phones: "(41) 98523-7358 / (41) 98885-9303 / (41) 92754-676 / 4192754676" },
    { name: "Eduarda Nardi Santos", email: "enardidossantos@gmail.com", phones: "(41) 98857-0386 / 41 988570386" },
    { name: "Emanuel Ben-hur Amorim de Lima", email: "emanuel.amorim17@hotmail.com", phones: "(41) 98468-2399 / (41) 98739-3870 / 351 936 296 817" },
    { name: "Erich Augusto Grunevald", email: "erich.augusto@hotmail.com", phones: "41998332502" },
    { name: "Ernani Santos", email: "vitorjoga4@gmail.com", phones: "41 9646-3397" },
    { name: "Felipe Lopes de Almeida", email: "felipelopes19981998@hotmail.com", phones: "41996909216" },
    { name: "Filipe Paim", email: "paimfilipe@gmail.com", phones: "41 98795 0111" },
    { name: "Jonathan Santos", email: "prof.jonathantenis@gmail.com", phones: "41988074283 / 4199999999" },
    { name: "Juliana Reis de Gois", email: "julianareisgois@outlook.com", phones: "(42) 99804-5690 / 42998045690" },
    { name: "Lineu Santa Clara", email: "", phones: "41999670576" },
    { name: "Lucas Guerra", email: "hhrase@hotmail.com", phones: "(41) 99193-5942 / 41991935942" },
    { name: "Manoela Borges", email: "bgsmanoela08@gmail.com", phones: "41999650521" },
    { name: "Orlades Matos de Lima Neto", email: "orladeslima@gmail.com", phones: "(41) 99112-4488 / (55) 41991-1244 / 41991124488" },
    { name: "Rafael Santa Clara", email: "rafaelproftenis@hotmail.com", phones: "" },
    { name: "Roland Santos", email: "rolandns@hotmail.com", phones: "" },
    { name: "Stefan Lazarevic", email: "stefan_lazarevic@hotmail.com", phones: "(41) 99531-3007 / (41) 99831-3007" },
    { name: "Vinicius Da Silva Segovia", email: "vinisegovia@hotmail.com", phones: "41991335563" },
];

function cleanPhone(raw: string) {
    if (!raw) return "";
    // Get first part before "/"
    const firstPart = raw.split("/")[0].trim();
    // Remove non-digits
    return firstPart.replace(/\D/g, "");
}

async function main() {
    console.log("🚀 Iniciando cadastro de professores...");

    for (const t of rawTeachers) {
        const phone = cleanPhone(t.phones);
        if (!phone) {
            console.log(`⏩ Pulando ${t.name} (Sem telefone)`);
            continue;
        }

        console.log(`📝 Cadastrando ${t.name} (${phone})...`);
        await prisma.teacher.upsert({
            where: { phone: phone },
            update: {
                name: t.name,
                email: t.email || null,
                active: true,
            },
            create: {
                name: t.name,
                email: t.email || null,
                phone: phone,
                active: true,
            },
        });
    }

    console.log("✅ Cadastro de professores finalizado! 🚀");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
