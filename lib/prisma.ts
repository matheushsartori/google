import { PrismaClient } from "@prisma/client";
// Reload signal 5 - AutomationLog model added

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: ["query"],
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
