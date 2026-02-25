import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstanceStatus } from "@/lib/uazapi";

/**
 * POST /api/instances/[name]/sync
 * Sincroniza o status de uma instância com a UazAPI
 */
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        const data = await getInstanceStatus(name);

        // UazAPI retorna:
        // { instance: { status: "connected"|"disconnected"|"connecting", token, ... }, status: { connected, jid, loggedIn } }
        const isConnected = data.status?.connected === true || data.instance?.status === "connected";

        await prisma.connectionInstance.update({
            where: { instanceId: name },
            data: {
                status: isConnected ? "CONNECTED" : "DISCONNECTED",
                token: data.instance?.token || undefined,
                lastSync: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            status: isConnected ? "CONNECTED" : "DISCONNECTED",
            rawStatus: data.instance?.status,
            jid: data.status?.jid,
        });
    } catch (error: any) {
        console.error("Error syncing instance status:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
