"use client";

import { Sidebar } from "@/components/Sidebar";
import { Search, Filter, MessageCircle, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: string;
    time: string;
    intent: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/leads");
            setLeads(res.data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleCreateLead = async () => {
        const name = window.prompt("Nome do Lead:");
        if (!name) return;
        const phone = window.prompt("Telefone (Ex: +55...):");
        if (!phone) return;

        try {
            await axios.post("/api/leads", { name, phone });
            fetchLeads();
        } catch (error) {
            alert("Erro ao criar lead");
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-background-dark">
                <Header title="Gerenciar Leads">
                    <button
                        onClick={handleCreateLead}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
                    >
                        + Novo Lead
                    </button>
                </Header>

                <div className="p-8">
                    <div className="mb-8">
                        <p className="text-slate-400">Visualize e entre em contato com seus potenciais clientes.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou telefone..."
                                className="w-full bg-background-card border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-background-card border border-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors">
                            <Filter size={18} /> Filtros
                        </button>
                    </div>

                    {/* List */}
                    <div className="bg-background-card border border-slate-700/50 rounded-xl overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-slate-500">Carregando leads...</div>
                        ) : leads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                                <span className="material-symbols-outlined text-4xl opacity-50">inbox</span>
                                <p>Nenhum lead encontrado.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Nome</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Intenção</th>
                                        <th className="p-4">Última Interação</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{lead.name}</p>
                                                        <p className="text-xs text-slate-500">{lead.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${lead.status === 'Novo Lead' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                    lead.status === 'Agendado' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 text-sm">{lead.intent}</td>
                                            <td className="p-4 text-slate-500 text-sm">{lead.time} atrás</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/chat?id=${lead.id}`} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white" title="Abrir Conversa">
                                                        <MessageCircle size={18} />
                                                    </Link>
                                                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
