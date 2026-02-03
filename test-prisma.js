const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.trialClass.findMany({ where: { archived: false } });
        console.log('SUCCESS:', res.length, 'records');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
