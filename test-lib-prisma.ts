import { prisma } from "./lib/prisma";

async function test() {
    try {
        const instances = await prisma.connectionInstance.findMany();
        console.log("Success:", instances);
    } catch (e: any) {
        console.error("Failed:", e.message);
    }
}

test();
