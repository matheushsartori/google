import { NextResponse } from "next/server";

const API_URL = "https://sartori-server.uazapi.com";
const ADMIN_TOKEN = "rR4btNLEqBPY4kQFNh6OhgqW7VvRVqog1qMzCOW4TnSntKS2jF";
const INSTANCE_NAME = "lwan-tenis";

// Função utilitária para buscar o token real
async function getInstanceToken() {
    const res = await fetch(`${API_URL}/instance/all`, {
        headers: { "admintoken": ADMIN_TOKEN },
        cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    const instance = (Array.isArray(data) ? data : data?.value || []).find((i: any) => i.name === INSTANCE_NAME);
    return instance?.token || null;
}

export async function GET() {
    try {
        const token = await getInstanceToken();
        if (!token) return NextResponse.json({ exists: false });

        const res = await fetch(`${API_URL}/instance/status`, {
            headers: { "token": token },
            cache: 'no-store'
        });
        const data = await res.json();

        const isConnected = data?.data?.connected || false;

        return NextResponse.json({
            exists: true,
            status: isConnected ? "CONNECTED" : "DISCONNECTED",
            instance: data?.data
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const token = await getInstanceToken();
        if (token) {
            return NextResponse.json({ success: true, message: "Já existe" });
        }

        const res = await fetch(`${API_URL}/instance/init`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "admintoken": ADMIN_TOKEN
            },
            body: JSON.stringify({ name: INSTANCE_NAME, systemName: "Lwan Tenis Public" })
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const token = await getInstanceToken();
        if (!token) return NextResponse.json({ success: true, message: "Já não existe" });

        const res = await fetch(`${API_URL}/instance`, {
            method: "DELETE",
            headers: { "token": token }
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
