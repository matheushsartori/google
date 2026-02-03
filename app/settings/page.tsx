"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        EVOLUTION_API_URL: "",
        EVOLUTION_API_TOKEN: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get("/api/settings")
            .then(res => {
                setSettings({
                    EVOLUTION_API_URL: res.data.EVOLUTION_API_URL || "",
                    EVOLUTION_API_TOKEN: res.data.EVOLUTION_API_TOKEN || "",
                });
            })
            .catch(err => {
                console.error(err);
                toast.error("Erro ao carregar configurações");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post("/api/settings", settings);
            toast.success("Configurações salvas com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-background-dark">
                <Header title="Configurações do Sistema" />

                <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest">
                        <span>Dashboard</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                        <span className="text-primary">Configurações</span>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">api</span>
                            </div>
                            <div>
                                <h2 className="text-white text-xl font-bold">Evolution API</h2>
                                <p className="text-slate-400 text-sm">Configure as credenciais de acesso à sua instância do Evolution API.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="h-10 bg-slate-700/50 rounded-lg w-full"></div>
                                <div className="h-10 bg-slate-700/50 rounded-lg w-full"></div>
                                <div className="h-12 bg-primary/20 rounded-xl w-32 ml-auto"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">URL da API</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">link</span>
                                        <input
                                            type="url"
                                            value={settings.EVOLUTION_API_URL}
                                            onChange={(e) => setSettings({ ...settings, EVOLUTION_API_URL: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            placeholder="https://sua-instancia.evolution-api.com"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 ml-1 italic">Exemplo: https://api.meudominio.com.br (sem a barra no final)</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Global API Token</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">key</span>
                                        <input
                                            type="password"
                                            value={settings.EVOLUTION_API_TOKEN}
                                            onChange={(e) => setSettings({ ...settings, EVOLUTION_API_TOKEN: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                                            placeholder="Seu Global API Token"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 ml-1 italic">Encontrado no arquivo .env ou dashboard da Evolution API (API_KEY)</p>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full"></div>
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm">save</span>
                                                Salvar Configurações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex gap-4">
                        <div className="size-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                            <h4 className="text-orange-400 font-bold text-sm mb-1">Aviso Importante</h4>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Certifique-se de que a URL e o Token estão corretos. Sem essas configurações, o sistema não conseguirá se comunicar com o WhatsApp e as automações não funcionarão.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
