import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const courts = await prisma.court.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(courts);
    } catch (error) {
        console.error("Error fetching courts:", error);
        return NextResponse.json({ error: "Erro ao buscar quadras" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, color } = body;

        if (!name || !color) {
            return NextResponse.json({ error: "Nome e cor são obrigatórios" }, { status: 400 });
        }

        const court = await prisma.court.create({
            data: { name, color },
        });

        return NextResponse.json(court);
    } catch (error) {
        console.error("Error creating court:", error);
        return NextResponse.json({ error: "Erro ao criar quadra" }, { status: 500 });
    }
}
