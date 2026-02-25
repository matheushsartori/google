import { NextResponse } from "next/server";

const API_URL = "https://sartori-server.uazapi.com";
const ADMIN_TOKEN = "rR4btNLEqBPY4kQFNh6OhgqW7VvRVqog1qMzCOW4TnSntKS2jF";
const INSTANCE_NAME = "lwan-tenis";

async function getInstanceToken() {
    const res = await fetch(`${API_URL}/instance/all`, {
        headers: { "admintoken": ADMIN_TOKEN },
        cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    const instance = data?.value?.find((i: any) => i.name === INSTANCE_NAME);
    return instance?.token || null;
}

export async function GET() {
    try {
        const token = await getInstanceToken();
        if (!token) return NextResponse.json({ error: "Instância não existe" }, { status: 404 });

        const res = await fetch(`${API_URL}/instance/connect`, {
            method: "POST",
            headers: { "token": token }
        });

        const data = await res.json();

        const inst = data?.instance || {};
        const statusObj = data?.status || {};

        let base64 = inst?.qrcode || data?.qrcode || data?.base64 || null;
        if (base64 && !base64.startsWith('data:')) {
            base64 = `data:image/png;base64,${base64}`;
        }

        const isConnected = statusObj?.connected === true ||
            statusObj?.loggedIn === true ||
            inst?.status === 'connected' ||
            data?.connected === true;

        return NextResponse.json({
            base64,
            pairingCode: inst?.paircode || data?.paircode || null,
            status: isConnected ? "connected" : "connecting",
            message: statusObj?.jid ? `Conectado: ${statusObj.jid}` : null,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
