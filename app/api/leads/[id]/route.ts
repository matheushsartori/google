import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        // Try to find a related TrialClass or CRM data
        const cleanPhone = lead.phone.replace(/\D/g, '').replace(/^55/, '');

        // Find trial classes where the cleaned phone matches
        const trialClasses = await prisma.trialClass.findMany({
            where: {
                archived: false
            },
            include: {
                teacher: true,
                court: true
            }
        });

        // Simple match: check if the digits match (ignoring 55 prefix if present in lead and potential mask in trial)
        const matchedTrialClass = trialClasses.find((tc: any) => {
            const tcClean = tc.phone.replace(/\D/g, '').replace(/^55/, '');
            return tcClean === cleanPhone;
        });

        return NextResponse.json({
            ...lead,
            trialClass: matchedTrialClass || null
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
    }
}
