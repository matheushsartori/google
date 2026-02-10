import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, status, scheduledDate, tags, archived, teacherId, courtId, email, cpf, birthDate, isConverted } = body;

        const data: any = {};
        if (status !== undefined) data.status = status;
        if (scheduledDate !== undefined) data.scheduledDate = scheduledDate;
        if (tags !== undefined) data.tags = tags;
        if (archived !== undefined) data.archived = archived;
        if (teacherId !== undefined) data.teacherId = teacherId;
        if (courtId !== undefined) data.courtId = courtId;
        if (email !== undefined) data.email = email;
        if (cpf !== undefined) data.cpf = cpf;
        if (birthDate !== undefined) data.birthDate = birthDate;
        if (isConverted !== undefined) data.isConverted = isConverted;

        const trialClass = await prisma.trialClass.update({
            where: { id },
            data
        });

        return NextResponse.json(trialClass);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao atualizar registro" }, { status: 500 });
    }
}
