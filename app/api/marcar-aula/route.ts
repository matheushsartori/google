import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Force recompile to pick up new Prisma Client

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, cpf, birthDate, level, availability, observations, sport } = body;

        if (!name || !phone || !level || !availability) {
            return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
        }

        const trialClass = await prisma.trialClass.create({
            data: {
                name,
                phone,
                email,
                cpf,
                birthDate,
                sport: sport || "Tênis",
                level,
                availability,
                observations,
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, id: trialClass.id });
    } catch (error: any) {
        console.error("Error creating trial class registration:", error);
        return NextResponse.json({ error: "Erro ao processar agendamento" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const level = searchParams.get("level");
        const status = searchParams.get("status");
        const archived = searchParams.get("archived") === "true";

        const where: any = { archived };

        if (level) where.level = level;
        if (status) where.status = status;

        const results = await prisma.trialClass.findMany({
            where,
            include: {
                teacher: true,
                court: true
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
    }
}

