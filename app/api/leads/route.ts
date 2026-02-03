import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const leads = await prisma.lead.findMany({
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Map to UI format
        const formattedLeads = leads.map(lead => {
            const lastMsg = lead.messages[0];
            const lastInteraction = lastMsg ? lastMsg.createdAt : lead.updatedAt;

            // Calculate relative time string (simplified)
            const diffInMinutes = Math.floor((new Date().getTime() - new Date(lastInteraction).getTime()) / 60000);
            let timeString = "agora";
            if (diffInMinutes > 0 && diffInMinutes < 60) timeString = `${diffInMinutes} min`;
            else if (diffInMinutes >= 60 && diffInMinutes < 1440) timeString = `${Math.floor(diffInMinutes / 60)}h`;
            else if (diffInMinutes >= 1440) timeString = `${Math.floor(diffInMinutes / 1440)}d`;

            return {
                id: lead.id,
                name: lead.name || "Sem Nome",
                phone: lead.phone,
                status: lead.status === "NEW" ? "Novo Lead" :
                    lead.status === "IN_PROGRESS" ? "Em Atendimento" :
                        lead.status === "SCHEDULED" ? "Agendado" : lead.status,
                time: timeString,
                intent: lead.intent === "EXPERIMENTAL_CLASS" ? "Aula Experimental" :
                    lead.intent === "RESERVATION" ? "Reserva" :
                        lead.intent ? lead.intent : "Desconhecido"
            };
        });

        return NextResponse.json(formattedLeads);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Expected: { name, phone }

        const lead = await prisma.lead.create({
            data: {
                name: body.name,
                phone: body.phone,
                status: "NEW",
                intent: "INFO"
            }
        });

        return NextResponse.json(lead);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }
}
