import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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

        let apiUrl = settingsMap["EVOLUTION_API_URL"];
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (!apiUrl || !apiToken) {
            return NextResponse.json({ error: "Evolution API settings not configured" }, { status: 400 });
        }

        apiUrl = apiUrl.replace(/\/$/, "");

        // 2. Call Evolution API to logout
        const evolutionResponse = await fetch(`${apiUrl}/instance/logout/${name}`, {
            method: "DELETE", // Evolution API v2 uses DELETE for logout
            headers: {
                "apikey": apiToken,
            },
        });

        const evoData = await evolutionResponse.json();

        if (!evolutionResponse.ok) {
            return NextResponse.json({ error: evoData.message || "Failed to logout" }, { status: evolutionResponse.status });
        }

        return NextResponse.json({ success: true, data: evoData });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
