import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const instance = searchParams.get("instance");
        const event = searchParams.get("event");
        const limit = parseInt(searchParams.get("limit") || "100");

        const where: any = {};
        if (instance) where.instance = instance;
        if (event) where.event = event;

        const logs = await prisma.webhookLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("Error fetching webhook logs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.webhookLog.deleteMany({});
        return NextResponse.json({ success: true, message: "All logs cleared" });
    } catch (error: any) {
        console.error("Error clearing logs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
