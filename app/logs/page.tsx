"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { toast, Toaster } from "react-hot-toast";

interface WebhookLog {
    id: string;
    event: string;
    instance: string | null;
    data: any;
    createdAt: string;
}

export default function WebhookLogsPage() {
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
    const [filterEvent, setFilterEvent] = useState("");
    const [filterInstance, setFilterInstance] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (filterEvent) params.append("event", filterEvent);
            if (filterInstance) params.append("instance", filterInstance);

            const res = await axios.get(`/api/webhook-logs?${params.toString()}`);
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm("Tem certeza que deseja limpar todos os logs?")) return;

        try {
            await axios.delete("/api/webhook-logs");
            toast.success("Logs limpos com sucesso!");
            fetchLogs();
        } catch (error) {
            toast.error("Erro ao limpar logs");
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterEvent, filterInstance]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchLogs();
        }, 3000);

        return () => clearInterval(interval);
    }, [autoRefresh, filterEvent, filterInstance]);

    const eventColors: Record<string, string> = {
        "QRCODE_UPDATED": "bg-blue-500/10 text-blue-400 border-blue-500/30",
        "CONNECTION_UPDATE": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        "MESSAGES_UPSERT": "bg-purple-500/10 text-purple-400 border-purple-500/30",
        "MESSAGES_UPDATE": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
        "SEND_MESSAGE": "bg-pink-500/10 text-pink-400 border-pink-500/30",
    };

    const uniqueEvents = Array.from(new Set(logs.map(log => log.event)));
    const uniqueInstances = Array.from(new Set(logs.map(log => log.instance).filter(Boolean)));

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Logs de Webhooks">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-800 text-primary"
                            />
                            <span className="text-slate-400">Auto-refresh (3s)</span>
                        </label>
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Atualizar
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Limpar Logs
                        </button>
                    </div>
                </Header>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Filters */}
                    <div className="bg-background-card border border-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">filter_alt</span>
                            Filtros
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Evento</label>
                                <select
                                    value={filterEvent}
                                    onChange={(e) => setFilterEvent(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white"
                                >
                                    <option value="">Todos os eventos</option>
                                    {uniqueEvents.map(event => (
                                        <option key={event} value={event}>{event}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Instância</label>
                                <select
                                    value={filterInstance}
                                    onChange={(e) => setFilterInstance(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white"
                                >
                                    <option value="">Todas as instâncias</option>
                                    {uniqueInstances.map(instance => (
                                        <option key={instance} value={instance || ""}>{instance}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-background-card border border-slate-700/50 rounded-2xl p-6">
                            <div className="text-slate-400 text-sm font-medium mb-1">Total de Logs</div>
                            <div className="text-3xl font-black text-white">{logs.length}</div>
                        </div>
                        <div className="bg-background-card border border-slate-700/50 rounded-2xl p-6">
                            <div className="text-slate-400 text-sm font-medium mb-1">Eventos Únicos</div>
                            <div className="text-3xl font-black text-primary">{uniqueEvents.length}</div>
                        </div>
                        <div className="bg-background-card border border-slate-700/50 rounded-2xl p-6">
                            <div className="text-slate-400 text-sm font-medium mb-1">Instâncias</div>
                            <div className="text-3xl font-black text-emerald-400">{uniqueInstances.length}</div>
                        </div>
                        <div className="bg-background-card border border-slate-700/50 rounded-2xl p-6">
                            <div className="text-slate-400 text-sm font-medium mb-1">Último Log</div>
                            <div className="text-sm font-bold text-white">
                                {logs[0] ? new Date(logs[0].createdAt).toLocaleTimeString() : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Logs List */}
                    <div className="bg-background-card border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700/50">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">list</span>
                                Logs Recebidos ({logs.length})
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                                <p className="mt-2">Carregando logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl">inbox</span>
                                <p className="mt-2">Nenhum log encontrado</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="p-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${eventColors[log.event] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                                                        {log.event}
                                                    </span>
                                                    {log.instance && (
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            {log.instance}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="bg-background-card border border-slate-700/50 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">code</span>
                                Detalhes do Webhook
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-auto max-h-[calc(80vh-100px)]">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Evento</div>
                                    <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border ${eventColors[selectedLog.event] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                                        {selectedLog.event}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Instância</div>
                                    <div className="text-white font-mono">{selectedLog.instance || "N/A"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Data/Hora</div>
                                    <div className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Payload Completo</div>
                                    <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                                        {JSON.stringify(selectedLog.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
