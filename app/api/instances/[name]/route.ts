import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        console.log(`🗑️ Tentando excluir instância: ${name}`);

        // 1. Get Evolution API Settings
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        let apiUrl = settingsMap["EVOLUTION_API_URL"];
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (apiUrl && apiToken) {
            apiUrl = apiUrl.replace(/\/$/, "");

            // Try to delete from Evolution API
            try {
                const evolutionResponse = await fetch(`${apiUrl}/instance/delete/${name}`, {
                    method: "DELETE",
                    headers: {
                        "apikey": apiToken,
                    },
                });

                if (!evolutionResponse.ok) {
                    const evoData = await evolutionResponse.json();
                    console.warn("⚠️ Aviso da Evolution API ao excluir:", evoData);
                    // We continue anyway to clear local DB even if Evolution fails (e.g. if already deleted there)
                }
            } catch (evoError) {
                console.error("❌ Erro ao conectar com Evolution API para excluir:", evoError);
            }
        }

        // 2. Remove from local DB
        await prisma.connectionInstance.deleteMany({
            where: { instanceId: name }
        });

        console.log(`✅ Instância ${name} removida com sucesso`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ Erro ao excluir instância:", error);
        return NextResponse.json({ error: error.message || "Failed to delete instance" }, { status: 500 });
    }
}
