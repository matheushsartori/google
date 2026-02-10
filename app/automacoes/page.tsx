"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

interface Automation {
    stage: string;
    teacherMsg: string;
    studentMsg: string;
    active: boolean;
}

const STAGES = [
    { id: "PENDING", name: "Novo Lead", icon: "inbox" },
    { id: "CONFIRMED", name: "Agendado", icon: "calendar_month" },
    { id: "COMPLETED", name: "Realizado", icon: "task_alt" },
    { id: "CANCELLED", name: "Cancelado", icon: "cancel" },
];

const VARIABLES = [
    { name: "Nome do Aluno", var: "{student_name}" },
    { name: "Telefone do Aluno", var: "{student_phone}" },
    { name: "Nome do Professor", var: "{teacher_name}" },
    { name: "Nome da Quadra", var: "{court_name}" },
    { name: "Modalidade (Sport)", var: "{sport}" },
    { name: "Data da Aula", var: "{date}" },
    { name: "Horário da Aula", var: "{time}" },
];

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingStage, setSavingStage] = useState<string | null>(null);

    const fetchAutomations = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/automations");
            setAutomations(res.data);
        } catch (error) {
            toast.error("Erro ao carregar automações");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAutomations();
    }, []);

    const handleUpdate = (stage: string, field: string, value: any) => {
        setAutomations((prev) =>
            prev.map((a) => (a.stage === stage ? { ...a, [field]: value } : a))
        );
    };

    const handleSave = async (stage: string) => {
        const auto = automations.find((a) => a.stage === stage);
        if (!auto) return;

        setSavingStage(stage);
        try {
            await axios.post("/api/automations", auto);
            toast.success(`Automação de ${stage} salva!`);
        } catch (error) {
            toast.error("Erro ao salvar automação");
        } finally {
            setSavingStage(null);
        }
    };

    const insertVariable = (stage: string, field: "teacherMsg" | "studentMsg", variable: string) => {
        const auto = automations.find(a => a.stage === stage);
        if (!auto) return;
        const currentText = auto[field] || "";
        handleUpdate(stage, field, currentText + variable);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c10] text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Configuração de Automações" />

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex gap-4 items-center">
                            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">info</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Como funcionam as Variáveis?</h3>
                                <p className="text-sm text-slate-400">Você pode usar placeholders nas suas mensagens que serão substituídos automaticamente pelos dados do aluno e da aula.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin size-8 border-3 border-primary border-t-transparent rounded-full mr-4"></div>
                                Carregando configurações...
                            </div>
                        ) : (
                            STAGES.map((s) => {
                                const auto = automations.find((a) => a.stage === s.id) || {
                                    stage: s.id,
                                    teacherMsg: "",
                                    studentMsg: "",
                                    active: false,
                                };

                                return (
                                    <div key={s.id} className="bg-[#1c222c] border border-slate-800 rounded-[32px] overflow-hidden shadow-xl">
                                        <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">{s.icon}</span>
                                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Etapa: {s.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-primary transition-colors">Ativar Automação</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={auto.active}
                                                        onChange={(e) => handleUpdate(s.id, "active", e.target.checked)}
                                                        className="size-5 rounded-lg border-2 border-slate-800 bg-slate-900 checked:bg-primary appearance-none cursor-pointer transition-all"
                                                    />
                                                </label>
                                                <button
                                                    onClick={() => handleSave(s.id)}
                                                    disabled={savingStage === s.id}
                                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
                                                >
                                                    {savingStage === s.id ? "Salvando..." : "Salvar"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-8 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Teacher Message */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mensagem para o Professor</label>
                                                        <div className="flex gap-1">
                                                            {VARIABLES.slice(0, 4).map(v => (
                                                                <button
                                                                    key={v.var}
                                                                    onClick={() => insertVariable(s.id, "teacherMsg", v.var)}
                                                                    className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white px-1.5 py-0.5 rounded transition-all font-bold"
                                                                    title={v.name}
                                                                >
                                                                    {v.var}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        value={auto.teacherMsg}
                                                        onChange={(e) => handleUpdate(s.id, "teacherMsg", e.target.value)}
                                                        className="w-full h-40 bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:border-primary outline-none transition-all resize-none"
                                                        placeholder="Olá {teacher_name}, você tem uma nova aula com {student_name}..."
                                                    />
                                                </div>

                                                {/* Student Message */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mensagem para o Aluno</label>
                                                        <div className="flex gap-1">
                                                            {VARIABLES.map(v => (
                                                                <button
                                                                    key={v.var}
                                                                    onClick={() => insertVariable(s.id, "studentMsg", v.var)}
                                                                    className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white px-1.5 py-0.5 rounded transition-all font-bold"
                                                                    title={v.name}
                                                                >
                                                                    {v.var}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        value={auto.studentMsg}
                                                        onChange={(e) => handleUpdate(s.id, "studentMsg", e.target.value)}
                                                        className="w-full h-40 bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:border-primary outline-none transition-all resize-none"
                                                        placeholder="Olá {student_name}, sua aula está confirmada para {date} às {time}..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4">
                                                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Variáveis Disponíveis:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {VARIABLES.map(v => (
                                                        <span key={v.var} className="px-2 py-1 bg-slate-800 rounded text-[10px] text-primary font-bold">{v.var} : {v.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
