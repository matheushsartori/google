"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
    const [data, setData] = useState({
        stats: { total: 0, active: 0, scheduled: 0, conversion: 0 },
        recentActivity: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/api/dashboard")
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const stats = [
        { label: "Total de Leads", value: data.stats.total, icon: "group", change: data.stats.total > 0 ? "+12%" : null, color: "text-blue-500" },
        { label: "Em Atendimento", value: data.stats.active, icon: "chat", change: data.stats.active > 0 ? "+5%" : null, color: "text-emerald-500" },
        { label: "Agendamentos", value: data.stats.scheduled, icon: "event", change: data.stats.scheduled > 0 ? "+8%" : null, color: "text-purple-500" },
        { label: "Taxa de Conversão", value: `${data.stats.conversion}%`, icon: "trending_up", change: data.stats.conversion > 0 ? "+2%" : null, color: "text-orange-500" },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-slate-200 font-sans">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-y-auto">
                <Header title="Dashboard" />

                <div className="p-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Bom dia, Matheus! 👋</h2>
                        <p className="text-slate-400">Aqui está o resumo do desempenho do seu atendente virtual hoje.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-background-card p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all shadow-lg hover:shadow-xl hover:shadow-black/20 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg bg-slate-800/50 group-hover:bg-slate-800 transition-colors ${stat.color}`}>
                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                    </div>
                                    {stat.change && (
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
                                            {stat.change}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-1">{loading ? "..." : stat.value}</h3>
                                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity & Charts Placeholder */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 bg-background-card rounded-xl border border-slate-700/50 overflow-hidden">
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                                <h3 className="font-bold text-white">Últimas Atividades</h3>
                                <button className="text-primary text-sm font-bold hover:text-blue-400 transition-colors">Ver tudo</button>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {loading ? (
                                    <div className="p-6 text-center text-slate-500">Carregando...</div>
                                ) : data.recentActivity.length === 0 ? (
                                    <div className="p-6 text-center text-slate-500">Nenhuma atividade recente.</div>
                                ) : (
                                    data.recentActivity.map((activity, i) => (
                                        <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
                                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                                                <span className="material-symbols-outlined text-sm">notifications</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-white font-medium">
                                                    Lead <span className="font-bold">{activity.name || "Sem Nome"}</span> atualizado
                                                </p>
                                                <p className="text-xs text-slate-500">Status: {activity.status}</p>
                                            </div>
                                            <span className="text-xs text-slate-500">{new Date(activity.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* System Status / Quick Actions */}
                        <div className="bg-background-card rounded-xl border border-slate-700/50 p-6 flex flex-col gap-6">
                            <div>
                                <h3 className="font-bold text-white mb-4">Ações Rápidas</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-bold flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined">add_circle</span>
                                        Novo Lead
                                    </button>
                                    <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-bold flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined">settings</span>
                                        Configurar IA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
