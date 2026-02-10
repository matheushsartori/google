import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const automations = await prisma.automation.findMany();
        // Ensure all stages exist
        const stages = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
        const results = stages.map(stage => {
            return automations.find((a: any) => a.stage === stage) || { stage, teacherMsg: "", studentMsg: "", active: false };
        });
        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar automações" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { stage, teacherMsg, studentMsg, active } = body;

        const automation = await prisma.automation.upsert({
            where: { stage },
            update: { teacherMsg, studentMsg, active },
            create: { stage, teacherMsg, studentMsg, active },
        });

        return NextResponse.json(automation);
    } catch (error) {
        console.error("Error saving automation:", error);
        return NextResponse.json({ error: "Erro ao salvar automação" }, { status: 500 });
    }
}
