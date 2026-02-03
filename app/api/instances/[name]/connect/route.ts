import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        // 1. Get Evolution API Settings
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const apiUrl = settingsMap["EVOLUTION_API_URL"];
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (!apiUrl || !apiToken) {
            return NextResponse.json({ error: "Evolution API settings not configured" }, { status: 400 });
        }

        // 2. Fetch connection status/base64 QR from Evolution API
        const evolutionResponse = await fetch(`${apiUrl}/instance/connect/${name}`, {
            method: "GET",
            headers: {
                "apikey": apiToken,
            },
        });

        const evoData = await evolutionResponse.json();

        // Evolution API v2 might return base64 in different formats depending on state
        // If already connected, it might return a message
        return NextResponse.json(evoData);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to fetch connection info" }, { status: 500 });
    }
}
