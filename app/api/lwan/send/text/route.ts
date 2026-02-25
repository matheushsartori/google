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

export async function POST(req: Request) {
    try {
        const token = await getInstanceToken();
        if (!token) {
            return NextResponse.json({ error: "Instância não criada ou não encontrada" }, { status: 400 });
        }

        const body = await req.json();

        // Faz o repasse exato do body para a UazAPI
        const res = await fetch(`${API_URL}/send/text`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "token": token
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
