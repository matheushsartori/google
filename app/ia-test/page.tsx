"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Send, Bot, User, Sparkles, RefreshCw, Save } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function AiTestPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [feedback, setFeedback] = useState("");
    const [refining, setRefining] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load current prompt
        axios.get("/api/settings").then(res => {
            if (res.data.AI_PROMPT) setCurrentPrompt(res.data.AI_PROMPT);
            if (res.data.AI_ENABLED) setAiEnabled(res.data.AI_ENABLED === "true");
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const newUserMessage: Message = { role: "user", content: input };
        const newMessages: Message[] = [...messages, newUserMessage];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await axios.post("/api/ai-test", { messages: newMessages });

            if (res.data.isFlow) {
                const flowMsgs = res.data.messages;
                const interval = res.data.interval * 1000; // ms

                let currentMessages = [...newMessages];

                // Add each message with delay
                for (let i = 0; i < flowMsgs.length; i++) {
                    if (i > 0) await new Promise(resolve => setTimeout(resolve, interval));
                    currentMessages = [...currentMessages, { role: "assistant", content: flowMsgs[i] }];
                    setMessages([...currentMessages]);
                }
            } else {
                setMessages([...newMessages, { role: "assistant", content: res.data.content }]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao obter resposta da IA.");
        } finally {
            setLoading(false);
        }
    };

    const refinePrompt = async () => {
        if (!feedback.trim() || refining) return;

        setRefining(true);
        try {
            const res = await axios.post("/api/ai-test", {
                messages,
                userFeedback: feedback
            });

            if (res.data.newPrompt) {
                if (confirm("IA sugeriu um novo prompt baseado no seu feedback. Deseja visualizar?")) {
                    setCurrentPrompt(res.data.newPrompt);
                    setFeedback("");
                    alert("Prompt atualizado no rascunho. Não esqueça de 'Salvar no Sistema' se gostar do resultado.");
                }
            }
        } catch (error) {
            alert("Erro ao refinar prompt.");
        } finally {
            setRefining(false);
        }
    };

    const saveToSystem = async () => {
        try {
            await axios.post("/api/settings", { AI_PROMPT: currentPrompt });
            alert("Novo prompt salvo no sistema com sucesso!");
        } catch (error) {
            alert("Erro ao salvar.");
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={aiEnabled ? "Laboratório de IA (Playground)" : "Laboratório de Fluxo (Simulação)"} />

                <div className="flex-1 flex overflow-hidden">
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col border-r border-slate-800 bg-background-dark/50">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                                        {aiEnabled ? <Bot size={48} className="text-primary" /> : <RefreshCw size={48} className="text-primary" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{aiEnabled ? "Ambiente de Testes IA" : "Simulador de Fluxo"}</h3>
                                    <p className="max-w-sm text-sm">
                                        {aiEnabled
                                            ? "Valide como a IA se comporta com o prompt atual."
                                            : "A IA está desativada. Teste aqui como o fluxo automático de mensagens será disparado."}
                                    </p>
                                    {!aiEnabled && (
                                        <button
                                            onClick={() => setMessages([])}
                                            className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-700"
                                        >
                                            Reiniciar Sequência
                                        </button>
                                    )}
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div className={`mt-1 size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-slate-700" : "bg-primary/20 text-primary"}`}>
                                            {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-slate-800/80 text-slate-100 rounded-tl-none border border-slate-700/50 shadow-sm"}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex gap-2">
                                        <div className="size-2 bg-primary/40 rounded-full animate-bounce"></div>
                                        <div className="size-2 bg-primary/60 rounded-full animate-bounce delay-75"></div>
                                        <div className="size-2 bg-primary/80 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-background-card/50 border-t border-slate-800">
                            <div className="flex gap-4">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Simule uma conversa de cliente..."
                                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="bg-primary hover:bg-primary/90 text-white p-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Prompt Engineering (Only show if AI is enabled) */}
                    {aiEnabled ? (
                        <div className="w-[450px] flex flex-col bg-sidebar-dark border-l border-slate-800 overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-8">
                                {/* Editor Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                            <Sparkles size={16} className="text-primary" />
                                            Prompt Atual
                                        </h4>
                                        <button
                                            onClick={saveToSystem}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500/20 transition-all"
                                        >
                                            <Save size={14} />
                                            Salvar no Sistema
                                        </button>
                                    </div>
                                    <textarea
                                        value={currentPrompt}
                                        onChange={(e) => setCurrentPrompt(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 min-h-[300px] leading-relaxed focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>

                                {/* Refine Section */}
                                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 shadow-inner">
                                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                        <RefreshCw size={16} className="text-orange-400" />
                                        Ajustar Inteligência
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-4 leading-normal">
                                        Diga o que você não gostou na resposta acima o que a IA deveria ter dito. Eu vou reescrever o seu prompt automaticamente.
                                    </p>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Ex: Você foi muito formal, seja mais curto e direto. Peça o nome do cliente mais cedo."
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 min-h-[100px] mb-4 outline-none focus:border-orange-500/50 transition-all italic"
                                    />
                                    <button
                                        onClick={refinePrompt}
                                        disabled={refining || messages.length === 0}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-900/20 hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        {refining ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        {refining ? "Reescrevendo Prompt..." : "Melhorar Prompt Agora"}
                                    </button>
                                </div>

                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <h5 className="text-primary text-[10px] font-black uppercase mb-1">Dica de Especialista</h5>
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                        "Bons prompts definem papeis claros. Tente começar com 'Você é o recepcionista do Clube Mercês Tênis especializado em vendas via WhatsApp'."
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-[450px] flex flex-col bg-sidebar-dark border-l border-slate-800 p-8 space-y-6">
                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">warning</span>
                                    </div>
                                    <h4 className="text-white font-black uppercase text-sm italic">IA Desativada</h4>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Como você desligou a IA nas configurações, o sistema agora opera no **Modo de Fluxo**.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Lógica do Fluxo</h5>
                                <div className="space-y-3">
                                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-primary uppercase">Mensagem 1</span>
                                            <span className="material-symbols-outlined text-slate-600 text-sm">filter_1</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 line-clamp-3 italic">Disparada no primeiro contato do lead.</p>
                                    </div>
                                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/60"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-primary/60 uppercase">Mensagem 2</span>
                                            <span className="material-symbols-outlined text-slate-600 text-sm">filter_2</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 line-clamp-3 italic">Contém o link da aula experimental.</p>
                                    </div>
                                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/30"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-primary/30 uppercase">Mensagem 3</span>
                                            <span className="material-symbols-outlined text-slate-600 text-sm">filter_3</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 line-clamp-3 italic">Fechamento e informações de PDF.</p>
                                    </div>
                                </div>
                            </div>

                            <a href="/fluxo" className="mt-auto py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all border border-slate-700 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">settings</span>
                                Editar Mensagens
                            </a>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
