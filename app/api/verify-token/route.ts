import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
    try {
        const { provider, token } = await request.json();

        if (!token) {
            return NextResponse.json({ success: false, message: "Token não fornecido." });
        }

        if (provider === "openai") {
            try {
                // Try a simple models list check for OpenAI
                await axios.get("https://api.openai.com/v1/models", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                return NextResponse.json({ success: true, message: "Token OpenAI válido!" });
            } catch (error: any) {
                const status = error.response?.status;
                if (status === 401) return NextResponse.json({ success: false, message: "Token OpenAI inválido ou expirado." });
                return NextResponse.json({ success: false, message: `Erro na OpenAI: ${error.message}` });
            }
        }

        if (provider === "anthropic") {
            try {
                // Try a simple request for Anthropic
                await axios.post("https://api.anthropic.com/v1/messages",
                    {
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1,
                        messages: [{ role: "user", content: "hi" }]
                    },
                    {
                        headers: {
                            "x-api-key": token,
                            "anthropic-version": "2023-06-01",
                            "Content-Type": "application/json"
                        }
                    });
                return NextResponse.json({ success: true, message: "Token Anthropic válido!" });
            } catch (error: any) {
                const status = error.response?.status;
                if (status === 401) return NextResponse.json({ success: false, message: "Token Anthropic inválido ou expirado." });
                return NextResponse.json({ success: false, message: `Erro na Anthropic: ${error.message}` });
            }
        }

        return NextResponse.json({ success: false, message: "Provedor desconhecido." });

    } catch (error: any) {
        console.error("Token verification error:", error);
        return NextResponse.json({ success: false, message: "Erro interno ao verificar token." }, { status: 500 });
    }
}
