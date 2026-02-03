import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Fetch real stats
        const totalLeads = await prisma.lead.count();
        const activeLeads = await prisma.lead.count({
            where: { status: { not: "SCHEDULED" } } // Approximation
        });
        const scheduled = await prisma.lead.count({
            where: { status: "SCHEDULED" }
        });

        // Fetch recent activity (last 5 updated leads)
        const recentLeads = await prisma.lead.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                updatedAt: true
            }
        });

        return NextResponse.json({
            stats: {
                total: totalLeads,
                active: activeLeads,
                scheduled: scheduled,
                conversion: totalLeads > 0 ? Math.round((scheduled / totalLeads) * 100) : 0
            },
            recentActivity: recentLeads
        });
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
