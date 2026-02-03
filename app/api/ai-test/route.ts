import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(request: Request) {
    try {
        const { messages, userFeedback } = await request.json();

        // Fetch settings
        const settings = await prisma.settings.findMany();
        const config = settings.reduce((acc: any, s: { key: string; value: string }) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        console.log("Config loaded in AI Test:", config);

        const provider = config.AI_PROVIDER || "openai";
        const token = config.AI_TOKEN;
        const systemPrompt = config.AI_PROMPT || "Você é um assistente útil.";

        if (!token && config.AI_ENABLED !== "false") {
            return NextResponse.json({ error: "Token da IA não configurado." }, { status: 400 });
        }

        const aiEnabled = config.AI_ENABLED !== "false";

        // If IA is disabled, simulate the Flow
        if (!aiEnabled) {
            const userMessages = messages.filter((m: any) => m.role === "user");

            // On first message, return everything to simulate the full flow
            if (userMessages.length === 1) {
                const defaultMsg1 = "🎾 Olá! O Mercês Tênis agradece seu contato 😊\n\nPara locações avulsas de quadras de Tênis e Beach Tennis, basta acessar o link abaixo e fazer sua reserva:\n👉 https://letzplay.me/mercestenis/location";
                const defaultMsg2 = "🏫 Aula experimental\nPara agendar sua aula experimental:\n1️⃣ Preencha seus dados no link: {LINK_AULA}\n2️⃣ Envie por aqui o comprovante de pagamento via PIX:\n💰 Chave PIX: 41 98751-8619\n\n📚 Valores das aulas (plano anual)\n🎾 Tênis: a partir de R$ 340 — 1x por semana\n🏖️ Beach Tennis: R$ 280 — 1x por semana";
                const defaultMsg3 = "📄 Para conferir todos os valores, planos e regulamento to te enviando aqui abaixo o nosso pdf";

                const msgs = [
                    config.FLOW_MSG_1 || defaultMsg1,
                    config.FLOW_MSG_2 || defaultMsg2,
                    config.FLOW_MSG_3 || defaultMsg3
                ].map(m => m.replace("{LINK_AULA}", `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/marcar-aula`));

                return NextResponse.json({
                    isFlow: true,
                    messages: msgs,
                    interval: parseInt(config.FLOW_INTERVAL || "5")
                });
            }

            // For subsequent messages, just return a generic response or nothing
            return NextResponse.json({
                role: "assistant",
                content: "O fluxo automático já foi disparado. Em um cenário real, você agora estaria aguardando atendimento humano."
            });
        }

        // If userFeedback is present, it's a request to REWRITE the prompt
        if (userFeedback) {
            const conversationHistory = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

            let promptRewritePayload;
            if (provider === "openai") {
                promptRewritePayload = {
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "Você é um especialista em engenharia de prompt. Sua tarefa é reescrever o prompt do sistema para melhorar as respostas da IA com base no feedback do usuário e no histórico da conversa. Retorne APENAS o novo prompt reescrito, sem explicações." },
                        { role: "user", content: `Prompt Atual: ${systemPrompt}\n\nHistórico da Conversa:\n${conversationHistory}\n\nFeedback do Usuário: ${userFeedback}\n\nReescreva o prompt para atender ao feedback.` }
                    ]
                };
            }

            try {
                const response = await axios.post("https://api.openai.com/v1/chat/completions", promptRewritePayload, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const newPrompt = response.data.choices[0].message.content;
                return NextResponse.json({ newPrompt });
            } catch (err) {
                return NextResponse.json({ error: "Erro ao refinar prompt." }, { status: 500 });
            }
        }

        // Standard Chat Completion
        if (provider === "openai") {
            const response = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ]
            }, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            return NextResponse.json(response.data.choices[0].message);
        }

        if (provider === "anthropic") {
            const response = await axios.post("https://api.anthropic.com/v1/messages", {
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: systemPrompt,
                messages: messages
            }, {
                headers: {
                    "x-api-key": token,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
            });

            return NextResponse.json({
                role: "assistant",
                content: response.data.content[0].text
            });
        }

        return NextResponse.json({ error: "Provedor não suportado." }, { status: 400 });

    } catch (error: any) {
        console.error("AI Test Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Falha na comunicação com a IA." }, { status: 500 });
    }
}
