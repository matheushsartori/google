"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

export default function FlowPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [msg1, setMsg1] = useState("");
    const [msg2, setMsg2] = useState("");
    const [msg3, setMsg3] = useState("");
    const [interval, setIntervalVal] = useState("5");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get("/api/settings");
                const data = res.data;

                setMsg1(data.FLOW_MSG_1 || "🎾 Olá! O Mercês Tênis agradece seu contato 😊\n\nPara locações avulsas de quadras de Tênis e Beach Tennis, basta acessar o link abaixo e fazer sua reserva:\n👉 https://letzplay.me/mercestenis/location");
                setMsg2(data.FLOW_MSG_2 || "🏫 A Aula experimental de tênis  ou beach tennis custa r$ 80,00.\nPara agendar sua aula experimental:\n1️⃣ Envie por aqui o comprovante de pagamento via\n💰 Chave PIX: 41 98751-8619\n2. Preencha o formulário do link {LINK_AULA}.  Receba a data e hora da sua aula teste pelo WhatsApp em até 24 hs no máximo. \n\n📚 Valores das aulas (plano anual)\n🎾 Tênis: a partir de R$ 340 — 1x por semana\n🏖️ Beach Tennis: R$ 280 — 1x por semana");
                setMsg3(data.FLOW_MSG_3 || "📄 Para conferir todos os valores, planos e regulamento, acesse o link ou solicite o PDF informativo");
                setIntervalVal(data.FLOW_INTERVAL || "5");
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        try {
            await axios.post("/api/settings", {
                FLOW_MSG_1: msg1,
                FLOW_MSG_2: msg2,
                FLOW_MSG_3: msg3,
                FLOW_INTERVAL: interval
            });
            toast.success("Fluxo salvo com sucesso!");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Erro ao salvar fluxo.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Configuração do Fluxo Automático" />

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
                        Carregando configurações...
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter">Motor de Automação</h3>
                                <p className="text-slate-400 text-sm font-medium">Configure a sequência de mensagens que serão enviadas para novos leads quando a IA estiver desativada.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:col-span-2 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                            <span className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">1</span>
                                            Primeira Mensagem (Boas-vindas)
                                        </div>
                                        <textarea
                                            value={msg1}
                                            onChange={(e) => setMsg1(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none min-h-[120px] resize-none transition-all"
                                            placeholder="Digite a mensagem de boas-vindas..."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                            <span className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">2</span>
                                            Segunda Mensagem (Aula Experimental)
                                        </div>
                                        <textarea
                                            value={msg2}
                                            onChange={(e) => setMsg2(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none min-h-[150px] resize-none transition-all"
                                            placeholder="Digite a mensagem sobre a aula experimental..."
                                        />
                                        <p className="text-[10px] text-slate-500 italic">Use <span className="text-primary font-bold">{`{LINK_AULA}`}</span> para inserir automaticamente o link da página que criaremos.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                            <span className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">3</span>
                                            Terceira Mensagem (PDF/Informações Extras)
                                        </div>
                                        <textarea
                                            value={msg3}
                                            onChange={(e) => setMsg3(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none min-h-[100px] resize-none transition-all"
                                            placeholder="Digite a mensagem de encerramento ou apresentação do PDF..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-xl">timer</span>
                                            Intervalo
                                        </h4>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo entre mensagens (segundos)</label>
                                            <input
                                                type="number"
                                                value={interval}
                                                onChange={(e) => setIntervalVal(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none font-bold"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Este tempo será respeitado entre o envio de cada balão de mensagem para simular digitação humana.</p>
                                    </div>

                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-primary font-bold text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xl">info</span>
                                            Dica
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                            O fluxo automático é disparado apenas uma vez para cada lead novo. Se o lead já existir na base, o sistema não reenviará a sequência.
                                        </p>
                                    </div>

                                    <button
                                        onClick={saveSettings}
                                        disabled={saving}
                                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{saving ? 'refresh' : 'save'}</span>
                                        {saving ? "Salvando..." : "Salvar Configurações"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}
