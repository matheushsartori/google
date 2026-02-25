import { NextResponse } from "next/server";
import { connectInstance } from "@/lib/uazapi";

/**
 * GET /api/instances/[name]/connect
 * Inicia a conexão da instância e retorna QR code ou pair code
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        console.log(`🔗 Conectando instância: ${name}`);

        const data = await connectInstance(name);
        // UazAPI retorna { qrcode: "base64...", paircode: "..." }
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("❌ Connect error:", error);
        return NextResponse.json({ error: error.message || "Failed to connect instance" }, { status: 500 });
    }
}
