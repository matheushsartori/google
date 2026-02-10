"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { toast, Toaster } from "react-hot-toast";

interface WebhookLog {
    id: string;
    event: string;
    instance: string | null;
    data: any;
    createdAt: string;
}

interface AutomationLog {
    id: string;
    type: string;
    stage: string;
    targetPhone: string;
    targetName: string;
    message: string;
    status: string;
    error: string | null;
    requestData: any;
    responseData: any;
    instanceName: string | null;
    createdAt: string;
}

export default function WebhookLogsPage() {
    const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
    const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWebhookLog, setSelectedWebhookLog] = useState<WebhookLog | null>(null);
    const [selectedAutoLog, setSelectedAutoLog] = useState<AutomationLog | null>(null);
    const [activeTab, setActiveTab] = useState<"webhook" | "automation">("automation");
    const [filterEvent, setFilterEvent] = useState("");
    const [filterInstance, setFilterInstance] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchLogs = async () => {
        try {
            if (activeTab === "webhook") {
                const params = new URLSearchParams();
                if (filterEvent) params.append("event", filterEvent);
                if (filterInstance) params.append("instance", filterInstance);

                const res = await axios.get(`/api/webhook-logs?${params.toString()}`);
                setWebhookLogs(res.data);
            } else {
                const res = await axios.get("/api/automation-logs");
                setAutomationLogs(res.data);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        const typeLabel = activeTab === "webhook" ? "logs de webhooks" : "logs de automação";
        if (!confirm(`Tem certeza que deseja limpar todos os ${typeLabel}?`)) return;

        try {
            const endpoint = activeTab === "webhook" ? "/api/webhook-logs" : "/api/automation-logs";
            await axios.delete(endpoint);
            toast.success("Logs limpos com sucesso!");
            fetchLogs();
        } catch (error) {
            toast.error("Erro ao limpar logs");
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchLogs();
    }, [filterEvent, filterInstance, activeTab]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchLogs();
        }, 5000);

        return () => clearInterval(interval);
    }, [autoRefresh, filterEvent, filterInstance, activeTab]);

    const eventColors: Record<string, string> = {
        "QRCODE_UPDATED": "bg-blue-500/10 text-blue-400 border-blue-500/30",
        "CONNECTION_UPDATE": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        "MESSAGES_UPSERT": "bg-purple-500/10 text-purple-400 border-purple-500/30",
        "MESSAGES_UPDATE": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
        "SEND_MESSAGE": "bg-pink-500/10 text-pink-400 border-pink-500/30",
    };

    const uniqueEvents = Array.from(new Set(webhookLogs.map(log => log.event)));
    const uniqueInstances = Array.from(new Set(webhookLogs.map(log => log.instance).filter(Boolean)));

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c10] text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Central de Logs">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-800 text-primary"
                            />
                            <span className="text-slate-400">Auto-refresh (5s)</span>
                        </label>
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Atualizar
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Limpar
                        </button>
                    </div>
                </Header>

                <div className="px-8 pt-6">
                    <div className="flex bg-[#11161d] p-1 rounded-2xl border border-slate-800 w-fit">
                        <button
                            onClick={() => setActiveTab("automation")}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "automation" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Automações
                        </button>
                        <button
                            onClick={() => setActiveTab("webhook")}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "webhook" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Webhooks
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 space-y-6">
                    {activeTab === "webhook" ? (
                        <>
                            {/* Webhook Filters */}
                            <div className="bg-[#11161d] border border-slate-800 rounded-3xl p-6">
                                <h3 className="text-white font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">filter_alt</span>
                                    Filtros de Webhook
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={filterEvent}
                                        onChange={(e) => setFilterEvent(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs font-bold outline-none focus:border-primary"
                                    >
                                        <option value="">Todos os eventos</option>
                                        {uniqueEvents.map(event => (
                                            <option key={event} value={event}>{event}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterInstance}
                                        onChange={(e) => setFilterInstance(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs font-bold outline-none focus:border-primary"
                                    >
                                        <option value="">Todas as instâncias</option>
                                        {uniqueInstances.map(instance => (
                                            <option key={instance} value={instance || ""}>{instance}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Webhook Logs List */}
                            <div className="bg-[#11161d] border border-slate-800 rounded-3xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <h3 className="text-white font-black italic uppercase tracking-tighter flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">list</span>
                                        Logs Recebidos ({webhookLogs.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {webhookLogs.length === 0 ? (
                                        <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhum log de webhook</div>
                                    ) : webhookLogs.map((log) => (
                                        <div key={log.id} onClick={() => setSelectedWebhookLog(log)} className="p-4 hover:bg-slate-800/30 cursor-pointer transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${eventColors[log.event] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                                                    {log.event}
                                                </span>
                                                <span className="text-xs text-slate-500 font-bold">{log.instance || "N/A"}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-600 font-black uppercase">{new Date(log.createdAt).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Automation Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-[#11161d] border border-slate-800 rounded-3xl p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Enviado</p>
                                    <p className="text-3xl font-black text-white italic">{automationLogs.length}</p>
                                </div>
                                <div className="bg-[#11161d] border border-slate-800 rounded-3xl p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sucesso</p>
                                    <p className="text-3xl font-black text-emerald-400 italic">{automationLogs.filter(l => l.status === "SENT").length}</p>
                                </div>
                                <div className="bg-[#11161d] border border-slate-800 rounded-3xl p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Erros</p>
                                    <p className="text-3xl font-black text-red-400 italic">{automationLogs.filter(l => l.status === "ERROR").length}</p>
                                </div>
                                <div className="bg-[#11161d] border border-slate-800 rounded-3xl p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Sucesso</p>
                                    <p className="text-3xl font-black text-primary italic">
                                        {automationLogs.length > 0 ? Math.round((automationLogs.filter(l => l.status === "SENT").length / automationLogs.length) * 100) : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Automation Logs List */}
                            <div className="bg-[#11161d] border border-slate-800 rounded-3xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <h3 className="text-white font-black italic uppercase tracking-tighter flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">robot_2</span>
                                        Histórico de Disparos
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                                <th className="px-6 py-4">Destinatário</th>
                                                <th className="px-6 py-4">Etapa/Tipo</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Data</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {automationLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhuma automação registrada</td>
                                                </tr>
                                            ) : automationLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white italic">{log.targetName}</span>
                                                            <span className="text-[10px] text-slate-500 font-bold">{log.targetPhone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-black text-slate-400 uppercase">{log.stage}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.type === 'STUDENT' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                {log.type === 'STUDENT' ? 'ALUNO' : 'PROFESSOR'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${log.status === 'SENT' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            <span className={`size-1.5 rounded-full ${log.status === 'SENT' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                                            {log.status === 'SENT' ? 'Enviado' : 'Erro'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] text-slate-500 font-bold uppercase">
                                                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => setSelectedAutoLog(log)} className="size-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-primary transition-all flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Webhook Log Detail Modal */}
            {selectedWebhookLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setSelectedWebhookLog(null)}>
                    <div className="bg-[#11161d] border border-slate-800 rounded-[40px] max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">code</span>
                                Detalhes do Webhook
                            </h3>
                            <button onClick={() => setSelectedWebhookLog(null)} className="size-10 rounded-full hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined font-black">close</span>
                            </button>
                        </div>
                        <div className="p-8 overflow-auto max-h-[calc(80vh-100px)] custom-scrollbar">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Evento</div>
                                        <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-widest ${eventColors[selectedWebhookLog.event] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                                            {selectedWebhookLog.event}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Instância</div>
                                        <div className="text-white text-xs font-black italic">{selectedWebhookLog.instance || "N/A"}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 ml-1">Payload Completo</div>
                                    <pre className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-[11px] text-slate-400 overflow-x-auto font-mono custom-scrollbar">
                                        {JSON.stringify(selectedWebhookLog.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Automation Log Detail Modal */}
            {selectedAutoLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setSelectedAutoLog(null)}>
                    <div className="bg-[#11161d] border border-slate-800 rounded-[40px] max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">robot_2</span>
                                Detalhes da Automação
                            </h3>
                            <button onClick={() => setSelectedAutoLog(null)} className="size-10 rounded-full hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined font-black">close</span>
                            </button>
                        </div>
                        <div className="p-8 overflow-auto max-h-[calc(80vh-100px)] custom-scrollbar">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Destinatário</p>
                                        <p className="text-sm font-black text-white italic">{selectedAutoLog.targetName}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{selectedAutoLog.targetPhone}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${selectedAutoLog.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {selectedAutoLog.status === 'SENT' ? 'ENVIADO' : 'ERRO'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-900/30 rounded-3xl border border-slate-800">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">message</span>
                                        Mensagem Enviada
                                    </p>
                                    <div className="text-xs text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                                        {selectedAutoLog.message}
                                    </div>
                                </div>

                                {selectedAutoLog.error && (
                                    <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Erro do Sistema</p>
                                        <div className="text-xs text-red-300 font-mono">
                                            {selectedAutoLog.error}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Request Enviada</p>
                                        <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] text-slate-400 overflow-x-auto font-mono custom-scrollbar max-h-40">
                                            {JSON.stringify(selectedAutoLog.requestData, null, 2)}
                                        </pre>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Retorno da API</p>
                                        <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] text-slate-400 overflow-x-auto font-mono custom-scrollbar max-h-40">
                                            {JSON.stringify(selectedAutoLog.responseData, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                    <span>Instância: {selectedAutoLog.instanceName || "Desconhecida"}</span>
                                    <span>{new Date(selectedAutoLog.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
