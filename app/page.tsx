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
        <div className="flex h-screen overflow-hidden bg-[#0f1218] text-slate-200 font-sans">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-y-auto relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat z-0"></div>

                <div className="relative z-10">
                    <Header title="Dashboard" />

                    <div className="p-8">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Bom dia, Matheus! 👋</h2>
                            <p className="text-slate-400">Aqui está o resumo do desempenho do seu atendente virtual hoje.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="bg-[#0f1218]/80 p-6 rounded-2xl border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-all shadow-lg hover:shadow-[#d4af37]/5 group backdrop-blur-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl bg-slate-900/50 group-hover:bg-[#d4af37]/10 transition-colors ${stat.color} group-hover:text-[#d4af37]`}>
                                            <span className="material-symbols-outlined">{stat.icon}</span>
                                        </div>
                                        {stat.change && (
                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                                                <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
                                                {stat.change}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left">{loading ? "..." : stat.value}</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity & Charts Placeholder */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Recent Activity */}
                            <div className="lg:col-span-2 bg-[#0f1218]/80 rounded-2xl border border-[#d4af37]/10 overflow-hidden backdrop-blur-sm shadow-xl">
                                <div className="p-6 border-b border-[#d4af37]/10 flex justify-between items-center bg-[#0f1218]/50">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#d4af37] animate-pulse"></span>
                                        Últimas Atividades
                                    </h3>
                                    <button className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest hover:text-[#b5952f] transition-colors border border-[#d4af37]/20 px-3 py-1 rounded-lg hover:bg-[#d4af37]/10">Ver tudo</button>
                                </div>
                                <div className="divide-y divide-[#d4af37]/5">
                                    {loading ? (
                                        <div className="p-12 text-center text-slate-500 animate-pulse">Carregando atividades...</div>
                                    ) : data.recentActivity.length === 0 ? (
                                        <div className="p-12 text-center flex flex-col items-center gap-4">
                                            <div className="size-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
                                                <span className="material-symbols-outlined text-3xl">history</span>
                                            </div>
                                            <p className="text-slate-500 text-sm">Nenhuma atividade recente encontrada.</p>
                                        </div>
                                    ) : (
                                        data.recentActivity.map((activity, i) => (
                                            <div key={i} className="p-4 flex items-center gap-4 hover:bg-[#d4af37]/5 transition-colors cursor-pointer group">
                                                <div className="p-2 rounded-full bg-slate-900 text-slate-400 group-hover:text-[#d4af37] group-hover:bg-[#d4af37]/10 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">notifications</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-white font-medium group-hover:text-[#d4af37] transition-colors">
                                                        Lead <span className="font-bold">{activity.name || "Sem Nome"}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-mono">Status: {activity.status}</p>
                                                </div>
                                                <span className="text-[10px] text-slate-600 font-mono group-hover:text-slate-400">{new Date(activity.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* System Status / Quick Actions */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-[#d4af37] to-[#8a7224] rounded-2xl p-1 shadow-lg shadow-[#d4af37]/10">
                                    <div className="bg-[#0f1218] rounded-xl p-6 h-full">
                                        <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#d4af37]">bolt</span>
                                            Ações Rápidas
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="p-4 rounded-xl bg-slate-900 hover:bg-[#d4af37]/10 border border-slate-800 hover:border-[#d4af37]/30 text-slate-300 hover:text-[#d4af37] transition-all text-xs font-bold flex flex-col items-center gap-3 group">
                                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add_circle</span>
                                                NOVO LEAD
                                            </button>
                                            <button className="p-4 rounded-xl bg-slate-900 hover:bg-[#d4af37]/10 border border-slate-800 hover:border-[#d4af37]/30 text-slate-300 hover:text-[#d4af37] transition-all text-xs font-bold flex flex-col items-center gap-3 group">
                                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">tune</span>
                                                IA CONFIG
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0f1218]/80 rounded-2xl border border-[#d4af37]/10 p-6 backdrop-blur-sm">
                                    <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">Status do Sistema</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 text-xs font-bold">API CONNECTION</span>
                                            <span className="text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">ONLINE</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 text-xs font-bold">DATABASE</span>
                                            <span className="text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">CONNECTED</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 text-xs font-bold">WEBHOOKS</span>
                                            <span className="text-[#d4af37] text-[10px] font-black bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">PROCESSING</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
