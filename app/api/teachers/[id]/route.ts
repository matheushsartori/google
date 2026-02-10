import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, phone, email, active } = body;

        const teacher = await prisma.teacher.update({
            where: { id },
            data: {
                name,
                phone,
                email: email !== undefined ? (email || null) : undefined,
                active: active !== undefined ? active : undefined
            },
        });

        return NextResponse.json(teacher);
    } catch (error) {
        console.error("Error updating teacher:", error);
        return NextResponse.json({ error: "Erro ao atualizar professor" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.teacher.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return NextResponse.json({ error: "Erro ao excluir professor" }, { status: 500 });
    }
}
