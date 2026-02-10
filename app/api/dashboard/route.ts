import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Leads stats
        const totalLeads = await prisma.lead.count();
        const activeLeads = await prisma.lead.count({
            where: { status: { notIn: ["SCHEDULED", "ARCHIVED"] } }
        });

        // CRM (TrialClass) stats
        const totalCRM = await prisma.trialClass.count();
        const scheduledCRM = await prisma.trialClass.count({
            where: { status: "CONFIRMED" }
        });
        const completedCRM = await prisma.trialClass.count({
            where: { status: "COMPLETED" }
        });
        const convertedCRM = await prisma.trialClass.count({
            where: { isConverted: true }
        });

        // Combined activity
        const recentLeads = await prisma.lead.findMany({
            take: 3,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, status: true, updatedAt: true }
        });

        const recentCRM = await prisma.trialClass.findMany({
            take: 3,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, status: true, updatedAt: true }
        });

        const recentActivity = [...recentLeads, ...recentCRM]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);

        return NextResponse.json({
            stats: {
                total: totalLeads + totalCRM,
                active: activeLeads + (totalCRM - completedCRM - convertedCRM),
                scheduled: scheduledCRM,
                completed: completedCRM,
                converted: convertedCRM,
                conversion: totalCRM > 0 ? Math.round((convertedCRM / totalCRM) * 100) : 0
            },
            recentActivity
        });
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
