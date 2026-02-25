import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteInstance } from "@/lib/uazapi";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        console.log(`🗑️ Deletando instância: ${name}`);

        // 1. Deletar na UazAPI
        try {
            await deleteInstance(name);
            console.log(`✅ Instância ${name} deletada na UazAPI`);
        } catch (uazErr: any) {
            console.warn("⚠️ UazAPI delete error (continuando para limpar banco):", uazErr.message);
        }

        // 2. Remover do banco local
        await prisma.connectionInstance.deleteMany({ where: { instanceId: name } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ Erro ao excluir instância:", error);
        return NextResponse.json({ error: error.message || "Failed to delete instance" }, { status: 500 });
    }
}
