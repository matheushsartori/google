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

        // UazAPI retorna estrutura: { connected: bool, instance: { qrcode, paircode, status, ... }, status: { connected, jid, loggedIn } }
        // O qrcode está DENTRO de data.instance.qrcode (e já vem com prefixo data:image/png;base64,)
        console.log(`📡 UazAPI connect - keys:`, Object.keys(data || {}));

        const inst = data?.instance || {};
        const statusObj = data?.status || {};

        // Pegar qrcode de onde estiver
        let base64 = inst?.qrcode || data?.qrcode || data?.base64 || null;
        if (base64 && !base64.startsWith('data:')) {
            base64 = `data:image/png;base64,${base64}`;
        }

        const paircode = inst?.paircode || data?.paircode || null;

        const isConnected = statusObj?.connected === true ||
            statusObj?.loggedIn === true ||
            inst?.status === 'connected' ||
            data?.connected === true;

        console.log(`📡 base64 present: ${!!base64} | paircode: ${paircode} | connected: ${isConnected}`);

        return NextResponse.json({
            base64,
            pairingCode: paircode,
            code: paircode,
            status: isConnected ? 'open' : 'connecting',
            message: statusObj?.jid ? `Conectado: ${statusObj.jid}` : null,
        });
    } catch (error: any) {
        console.error("❌ Connect error:", error);
        return NextResponse.json({ error: error.message || "Failed to connect instance" }, { status: 500 });
    }
}
