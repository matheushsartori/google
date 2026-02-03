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

        // 2. Fetch instance status from Evolution API
        const evolutionResponse = await fetch(`${apiUrl}/instance/fetchInstances?instanceName=${name}`, {
            method: "GET",
            headers: {
                "apikey": apiToken,
            },
        });

        if (!evolutionResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch instance status from Evolution API" }, { status: evolutionResponse.status });
        }

        const evoData = await evolutionResponse.json();

        // Evolution API returns an array, find our instance
        const instanceData = Array.isArray(evoData) ? evoData.find((i: any) => i.instance?.instanceName === name) : evoData;

        if (!instanceData) {
            return NextResponse.json({ error: "Instance not found in Evolution API" }, { status: 404 });
        }

        // Determine status
        const connectionStatus = instanceData.instance?.state || instanceData.state || "close";
        const isConnected = connectionStatus === "open";

        // 3. Update local database
        await prisma.connectionInstance.update({
            where: { instanceId: name },
            data: {
                status: isConnected ? "CONNECTED" : "DISCONNECTED",
                lastSync: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            status: isConnected ? "CONNECTED" : "DISCONNECTED",
            rawStatus: connectionStatus
        });
    } catch (error: any) {
        console.error("Error syncing instance status:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
