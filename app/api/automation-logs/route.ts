import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stage = searchParams.get("stage");
        const type = searchParams.get("type");
        const status = searchParams.get("status");

        const where: any = {};
        if (stage) where.stage = stage;
        if (type) where.type = type;
        if (status) where.status = status;

        const logs = await prisma.automationLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 100
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching automation logs:", error);
        return NextResponse.json({ error: "Erro ao buscar logs de automação" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.automationLog.deleteMany();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao limpar logs" }, { status: 500 });
    }
}
