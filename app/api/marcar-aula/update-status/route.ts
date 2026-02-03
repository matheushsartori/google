import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, status, scheduledDate, tags, archived } = body;

        const data: any = {};
        if (status !== undefined) data.status = status;
        if (scheduledDate !== undefined) data.scheduledDate = scheduledDate;
        if (tags !== undefined) data.tags = tags;
        if (archived !== undefined) data.archived = archived;

        const trialClass = await prisma.trialClass.update({
            where: { id },
            data
        });

        return NextResponse.json(trialClass);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao atualizar registro" }, { status: 500 });
    }
}
