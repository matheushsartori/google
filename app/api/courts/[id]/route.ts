import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, color } = body;

        const court = await prisma.court.update({
            where: { id },
            data: { name, color },
        });

        return NextResponse.json(court);
    } catch (error) {
        console.error("Error updating court:", error);
        return NextResponse.json({ error: "Erro ao atualizar quadra" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        await prisma.court.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting court:", error);
        return NextResponse.json({ error: "Erro ao excluir quadra" }, { status: 500 });
    }
}
