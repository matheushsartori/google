import { NextResponse } from "next/server";
import { connectInstance } from "@/lib/uazapi";

/**
 * GET /api/instances/[name]/connect
 * Inicia a conexão da instância e retorna QR code ou pair code
 * 
 * UazAPI retorna: { qrcode: "base64...", paircode: "...", status: {...} }
 * Frontend espera: { base64: "data:image/png;base64,...", pairingCode: "..." }
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        console.log(`🔗 Conectando instância: ${name}`);

        const data: any = await connectInstance(name);
        console.log(`📡 UazAPI connect response keys:`, Object.keys(data || {}));
        console.log(`📡 status:`, data?.status, `| qrcode length:`, data?.qrcode?.length, `| paircode:`, data?.paircode);

        // UazAPI retorna `qrcode` (base64 puro ou data URL) e `paircode`
        // O frontend espera `base64` e `pairingCode`
        let base64 = data?.qrcode || data?.base64 || null;
        if (base64 && !base64.startsWith('data:')) {
            base64 = `data:image/png;base64,${base64}`;
        }

        const isConnected = data?.status?.connected === true ||
            data?.status?.loggedIn === true ||
            data?.instance?.status === 'connected';

        return NextResponse.json({
            base64,
            pairingCode: data?.paircode || data?.pairingCode || null,
            code: data?.paircode || null,
            status: isConnected ? 'open' : 'connecting',
            message: data?.status?.jid ? `Conectado: ${data.status.jid}` : null,
            raw: data, // para debug
        });
    } catch (error: any) {
        console.error("❌ Connect error:", error);
        return NextResponse.json({ error: error.message || "Failed to connect instance" }, { status: 500 });
    }
}
