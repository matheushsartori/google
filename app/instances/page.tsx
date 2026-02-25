"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

interface Instance {
    id: string;
    name: string;
    instanceId: string;
    status: string;
    version: string;
    type: string;
    lastSync: string;
    webhookStatus: string;
}

interface ConnectionData {
    base64?: string;
    code?: string;
    pairingCode?: string;
    status?: string;
    message?: string;
}

export default function InstancesPage() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState("");
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [connectionData, setConnectionData] = useState<ConnectionData | null>(null);
    const [loadingQR, setLoadingQR] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [qrTimer, setQrTimer] = useState(40);

    const fetchInstances = async () => {
        try {
            const res = await axios.get("/api/instances");
            const data = res.data;
            setInstances(data);

            // If we have instances and none selected, or if the selected one is not in the list anymore
            if (data.length > 0 && (!selectedId || !data.find((i: Instance) => i.instanceId === selectedId))) {
                setSelectedId(data[0].instanceId);
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar instâncias");
        } finally {
            setLoading(false);
        }
    };

    const fetchConnectionInfo = useCallback(async (instanceName: string) => {
        setLoadingQR(true);
        try {
            const res = await axios.get(`/api/instances/${instanceName}/connect`);
            setConnectionData(res.data);

            if (res.data.base64) {
                setQrTimer(40);
            }

            // If the API says it's connected, sync to database
            if (res.data.status === "open" || res.data.instance?.state === "open") {
                try {
                    await axios.post(`/api/instances/${instanceName}/sync`);
                    // Refresh instances list to show updated status
                    await fetchInstances();
                    toast.success("WhatsApp conectado com sucesso!");
                } catch (syncError) {
                    console.error("Error syncing status:", syncError);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingQR(false);
        }
    }, []);

    useEffect(() => {
        fetchInstances();
    }, []);

    useEffect(() => {
        if (selectedId) {
            setConnectionData(null);
            fetchConnectionInfo(selectedId);

            // Auto refresh QR if not connected
            const selected = instances.find(i => i.instanceId === selectedId);
            if (selected && selected.status !== 'CONNECTED') {
                const interval = setInterval(() => fetchConnectionInfo(selectedId), 20000);
                return () => clearInterval(interval);
            }
        }
    }, [selectedId, fetchConnectionInfo, instances]);

    const selectedInstance = instances.find(i => i.instanceId === selectedId);

    useEffect(() => {
        if (qrTimer <= 0 || !connectionData?.base64 || loadingQR || selectedInstance?.status === 'CONNECTED') return;

        const timeout = setTimeout(() => {
            setQrTimer(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [qrTimer, connectionData, loadingQR, selectedInstance]);
    const filteredInstances = instances.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.instanceId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInstanceName) return;

        setCreating(true);
        try {
            const res = await axios.post("/api/instances", {
                name: newInstanceName,
            });
            toast.success("Instância criada com sucesso!");
            setNewInstanceName("");
            setIsModalOpen(false);
            fetchInstances();
            setSelectedId(res.data.instanceId);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Erro ao criar instância.");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteInstance = async (instanceName: string) => {
        if (!confirm(`Tem certeza que deseja excluir a instância "${instanceName}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setDeleting(true);
        try {
            await axios.delete(`/api/instances/${instanceName}`);
            toast.success("Instância excluída com sucesso!");
            setSelectedId(null);
            fetchInstances();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Erro ao excluir instância.");
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = async (instanceName: string) => {
        if (!confirm("Deseja realmente desconectar esta instância?")) return;

        setActionLoading(true);
        try {
            await axios.post(`/api/instances/${instanceName}/logout`);
            toast.success("Instância desconectada!");
            fetchInstances();
            fetchConnectionInfo(instanceName);
        } catch (error: any) {
            toast.error("Erro ao desconectar");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestart = async (instanceName: string) => {
        setActionLoading(true);
        try {
            await axios.post(`/api/instances/${instanceName}/restart`);
            toast.success("Instância reiniciada!");
            fetchInstances();
        } catch (error: any) {
            toast.error("Erro ao reiniciar");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSyncStatus = async (instanceName: string) => {
        setActionLoading(true);
        try {
            const res = await axios.post(`/api/instances/${instanceName}/sync`);

            if (res.data.success) {
                toast.success(`Status atualizado: ${res.data.status}`);
                await fetchInstances();
                await fetchConnectionInfo(instanceName);
            } else {
                toast.error("Erro ao sincronizar status");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Erro ao sincronizar status");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePairingCode = async (instanceName: string) => {
        const phone = prompt("Digite o número do WhatsApp (ex: 5511999999999):");
        if (!phone) return;

        setActionLoading(true);
        try {
            // UazAPI: envia o phone no corpo do connect para gerar pair code
            const res = await axios.get(`/api/instances/${instanceName}/connect?phone=${phone}`);
            if (res.data.paircode || res.data.code) {
                const code = res.data.paircode || res.data.code;
                alert(`Seu código de pareamento é: ${code}`);
            } else {
                toast.error("Erro ao gerar código de pareamento");
            }
        } catch (error: any) {
            toast.error("Erro ao solicitar código de pareamento");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenDocs = () => {
        window.open("https://sartori.uazapi.com/docs", "_blank");
    };

    const isModalOpenVisible = isModalOpen; // Dummy line to help replacement

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden bg-background-dark">
                <Header title="Instâncias de Conexão">
                    <div className="relative max-w-xs w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
                        <input
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Procurar instância..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Header>

                <div className="flex-1 flex overflow-hidden">
                    {/* List Column */}
                    <div className="w-80 border-r border-[#d4af37]/10 flex flex-col bg-[#0f1218]">
                        <div className="p-4 flex justify-between items-center bg-[#0f1218]/50 backdrop-blur-md sticky top-0 z-10">
                            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Instâncias Ativas</h3>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="size-8 rounded-lg bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center transition-all border border-[#d4af37]/20 group"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform">add</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-20 bg-slate-800/20 rounded-xl animate-pulse mb-2"></div>
                                ))
                            ) : filteredInstances.length === 0 ? (
                                <div className="text-center py-20 px-4">
                                    <div className="size-16 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/30">
                                        <span className="material-symbols-outlined text-slate-600 text-2xl">dns</span>
                                    </div>
                                    <p className="text-slate-500 text-xs font-medium">Nenhuma instância encontrada</p>
                                </div>
                            ) : (
                                filteredInstances.map((inst) => (
                                    <button
                                        key={inst.instanceId}
                                        onClick={() => setSelectedId(inst.instanceId)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border group relative overflow-hidden mb-2 ${selectedId === inst.instanceId
                                            ? "bg-[#d4af37]/10 border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                            : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700 hover:translate-x-1"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1 relative z-10">
                                            <span className={`text-sm font-bold ${selectedId === inst.instanceId ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                                                {inst.name}
                                            </span>
                                            <div className={`size-2 rounded-full ring-2 ring-black/20 ${inst.status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500/50'}`}></div>
                                        </div>
                                        <div className="flex items-center justify-between relative z-10">
                                            <p className="text-[10px] text-slate-500 font-mono truncate uppercase tracking-widest group-hover:text-slate-400">ID: {inst.instanceId}</p>
                                            <span className="material-symbols-outlined text-[16px] text-slate-600 group-hover:text-[#d4af37] transition-colors">chevron_right</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail Column */}
                    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f1218] via-[#0f1218] to-[#1a4d2e]/10">
                        {!selectedInstance ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="size-32 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/10 flex items-center justify-center text-[#d4af37] mb-8 relative animate-pulse-slow">
                                    <div className="absolute inset-0 bg-[#d4af37]/5 blur-3xl rounded-full"></div>
                                    <span className="material-symbols-outlined text-5xl relative z-10 opacity-80">hub</span>
                                </div>
                                <h3 className="text-white text-3xl font-black mb-3 tracking-tighter italic uppercase">Gerenciamento</h3>
                                <p className="text-slate-500 mb-8 max-w-sm font-medium leading-relaxed text-sm">
                                    Selecione uma instância para visualizar status, escanear QR Code ou gerenciar configurações.
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-[#d4af37] hover:bg-[#b5952f] text-[#0f1218] px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add</span>
                                    Nova Conexão
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Top Navigation/Breadcrumb */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-0.5 shadow-lg shadow-primary/10">
                                            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-3xl">sensors</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-0.5">
                                                <h2 className="text-white text-2xl font-black tracking-tight uppercase italic">{selectedInstance.name}</h2>
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${selectedInstance.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                    <div className={`size-1.5 rounded-full ${selectedInstance.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                    {selectedInstance.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Token: {selectedInstance.instanceId}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => fetchConnectionInfo(selectedInstance.instanceId)}
                                            className="h-11 px-5 bg-slate-800/40 hover:bg-slate-700/60 text-white rounded-xl text-sm font-bold border border-slate-700/50 transition-all flex items-center gap-2"
                                        >
                                            <span className={`material-symbols-outlined text-lg ${loadingQR ? 'animate-spin' : ''}`}>refresh</span>
                                            Atualizar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteInstance(selectedInstance.instanceId)}
                                            disabled={deleting}
                                            className="h-11 px-5 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm font-bold border border-red-500/20 transition-all flex items-center gap-2 group disabled:opacity-50"
                                        >
                                            <span className={`material-symbols-outlined text-lg group-hover:rotate-12 transition-transform ${deleting ? 'animate-spin' : ''}`}>
                                                {deleting ? 'refresh' : 'delete_forever'}
                                            </span>
                                            {deleting ? 'Excluindo...' : 'Excluir'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* Stats Card */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-[#0f1218]/80 border border-[#d4af37]/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-[#d4af37]/20 transition-colors">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <span className="material-symbols-outlined text-6xl text-[#d4af37]">settings_input_component</span>
                                            </div>
                                            <h4 className="text-slate-500 font-black text-[10px] mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="size-1 bg-[#d4af37] rounded-full"></span>
                                                Informações Técnicas
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-3 border-b border-slate-700/30">
                                                    <span className="text-slate-400 text-sm font-medium">Engine</span>
                                                    <span className="text-[#d4af37] text-sm font-black italic">UazAPI</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-700/30">
                                                    <span className="text-slate-400 text-sm font-medium">Provider</span>
                                                    <span className="text-white text-sm font-bold">WhatsApp (UazAPI)</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-700/30">
                                                    <span className="text-slate-400 text-sm font-medium">Webhooks</span>
                                                    <span className={`${selectedInstance.webhookStatus === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800 border-slate-700'} text-[10px] font-black uppercase px-2 py-1 rounded border`}>
                                                        {selectedInstance.webhookStatus === 'ACTIVE' ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-3">
                                                    <span className="text-slate-400 text-sm font-medium">Uptime</span>
                                                    <span className="text-[#d4af37] text-sm font-black">99.9%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#0f1218]/80 border border-[#d4af37]/10 rounded-3xl p-6 shadow-xl">
                                            <h4 className="text-slate-500 font-black text-[10px] mb-4 uppercase tracking-[0.2em]">Painel de Controle</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => handleSyncStatus(selectedInstance.instanceId)}
                                                    disabled={actionLoading}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/50 hover:bg-[#d4af37]/10 border border-slate-700/50 hover:border-[#d4af37]/30 transition-all group disabled:opacity-50"
                                                >
                                                    <span className={`material-symbols-outlined text-slate-400 group-hover:text-[#d4af37] group-hover:scale-110 transition-all ${actionLoading ? 'animate-spin' : ''}`}>sync</span>
                                                    <span className="text-[9px] text-white font-black uppercase tracking-widest">{actionLoading ? '...' : 'Att'}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRestart(selectedInstance.instanceId)}
                                                    disabled={actionLoading}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/50 hover:bg-[#d4af37]/10 border border-slate-700/50 hover:border-[#d4af37]/30 transition-all group disabled:opacity-50"
                                                >
                                                    <span className={`material-symbols-outlined text-slate-400 group-hover:text-[#d4af37] group-hover:scale-110 transition-all ${actionLoading ? 'animate-spin' : ''}`}>restart_alt</span>
                                                    <span className="text-[9px] text-white font-black uppercase tracking-widest">{actionLoading ? '...' : 'Reset'}</span>
                                                </button>
                                                <button
                                                    onClick={handleOpenDocs}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/50 hover:bg-[#d4af37]/10 border border-slate-700/50 hover:border-[#d4af37]/30 transition-all group"
                                                >
                                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-[#d4af37] group-hover:scale-110 transition-all">code</span>
                                                    <span className="text-[9px] text-white font-black uppercase tracking-widest">Docs</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code Card */}
                                    <div className="lg:col-span-3">
                                        <div className="bg-[#0b0e14] border border-slate-800/50 rounded-[32px] p-10 h-full flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
                                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                                            <div className="mb-10 relative z-10">
                                                <h3 className="text-white text-3xl font-black mb-3 tracking-tighter">
                                                    {selectedInstance.status === 'CONNECTED' ? 'SINCROIZADO' : 'AUTENTICAR'}
                                                </h3>
                                                <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">
                                                    {selectedInstance.status === 'CONNECTED'
                                                        ? 'O dispositivo está conectado via WebSocket e pronto para processar automações.'
                                                        : 'Aponte a câmera do WhatsApp para o código abaixo para vincular sua conta.'}
                                                </p>
                                            </div>

                                            {selectedInstance.status !== 'CONNECTED' ? (
                                                <div className="relative group/qr">
                                                    <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity"></div>

                                                    <div className="bg-white p-6 rounded-[24px] shadow-2xl relative z-10">
                                                        {loadingQR ? (
                                                            <div className="w-56 h-56 bg-slate-50 flex flex-col items-center justify-center rounded-xl">
                                                                <div className="animate-spin size-10 border-4 border-primary/30 border-t-primary rounded-full mb-4"></div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerando Código...</span>
                                                            </div>
                                                        ) : connectionData?.base64 ? (
                                                            <div className="relative overflow-hidden rounded-xl bg-slate-50">
                                                                <img
                                                                    src={connectionData.base64}
                                                                    alt="QR Code"
                                                                    className="w-56 h-56"
                                                                />
                                                                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                                                                <div className="absolute left-0 right-0 h-1 bg-primary/40 top-0 animate-scan pointer-events-none shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-56 h-56 bg-slate-50 flex flex-col items-center justify-center rounded-xl text-slate-300">
                                                                <span className="material-symbols-outlined text-6xl mb-2">qr_code_2</span>
                                                                <span className="text-[8px] font-black uppercase tracking-widest px-4">Aguardando resposta da UazAPI...</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!loadingQR && connectionData?.base64 && (
                                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-[9px] font-black rounded-full shadow-lg shadow-primary/30 uppercase tracking-[0.2em] whitespace-nowrap z-20">
                                                            Expira em {qrTimer}s
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="size-64 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center relative shadow-inner">
                                                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-[ping_3s_infinite]"></div>
                                                    <div className="absolute inset-4 rounded-full border border-emerald-400/10 animate-[ping_2s_infinite]"></div>
                                                    <div className="relative z-10 flex flex-col items-center">
                                                        <span className="material-symbols-outlined text-emerald-500 text-8xl drop-shadow-lg">verified</span>
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-2">Ativado</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-14 flex gap-4 w-full max-w-sm relative z-10">
                                                <button
                                                    onClick={() => selectedInstance.status === 'CONNECTED' ? handleLogout(selectedInstance.instanceId) : handlePairingCode(selectedInstance.instanceId)}
                                                    disabled={actionLoading}
                                                    className="flex-1 flex items-center justify-center gap-2 h-14 bg-white text-slate-900 hover:scale-105 active:scale-95 rounded-2xl text-[10px] font-black transition-all shadow-xl uppercase tracking-[0.1em] whitespace-nowrap px-4 disabled:opacity-50"
                                                >
                                                    {selectedInstance.status === 'CONNECTED' ? 'Desconectar Dispositivo' : 'Vincular com Código'}
                                                </button>
                                                <button
                                                    className="h-14 w-14 flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-2xl transition-all border border-[#25D366]/20 shadow-lg shadow-[#25D366]/5 group"
                                                    title="WhatsApp Status"
                                                >
                                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.551 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Background Text Overlay */}
                                            <div className="absolute bottom-[-10px] right-[-10px] text-[100px] font-black text-white/[0.03] select-none pointer-events-none italic tracking-tighter group-hover:text-white/[0.05] transition-colors leading-none">
                                                WHATSAPP
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Logs Section */}
                                <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between bg-black/20">
                                        <div className="flex items-center gap-3">
                                            <div className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                            <h4 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Console Log — UazAPI Engine</h4>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="size-2.5 rounded-full bg-slate-800"></div>
                                            <div className="size-2.5 rounded-full bg-slate-800"></div>
                                            <div className="size-2.5 rounded-full bg-slate-800"></div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-[#080a0f] font-mono text-[11px] h-40 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-2 opacity-80">
                                            <div className="flex gap-4 items-start">
                                                <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                <span className="text-blue-500 font-bold shrink-0">[SYSTEM]</span>
                                                <span className="text-slate-500 italic">Initialized UazAPI handler for instance...</span>
                                            </div>
                                            <div className="flex gap-4 items-start">
                                                <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                <span className="text-emerald-500 font-bold shrink-0">[QUERY]</span>
                                                <span className="text-slate-400">Fetching instance "{selectedInstance.name}" current state from cluster node 01.</span>
                                            </div>
                                            {connectionData?.message && (
                                                <div className="flex gap-4 items-start">
                                                    <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                    <span className="text-amber-500 font-bold shrink-0">[HOOK]</span>
                                                    <span className="text-slate-400">{connectionData.message}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-4 items-start">
                                                <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                <span className="text-primary font-bold shrink-0">[AUTH]</span>
                                                <span className="text-slate-500">Awaiting QR scan callback... (polling status every 20s)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Instance Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[#0f1218] border border-slate-800 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40">
                                <div>
                                    <h3 className="text-white text-2xl font-black italic uppercase italic tracking-tighter">Nova Instância</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">UazAPI Engine  Token gerado automaticamente</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-2xl bg-slate-800/50 text-slate-400 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleCreateInstance} className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <div className="size-1 bg-primary rounded-full"></div>
                                        Identificador Único
                                    </label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] group-focus-within:text-primary transition-colors">badge</span>
                                        <input
                                            autoFocus
                                            className="w-full bg-slate-900/50 border border-slate-800/80 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all font-bold"
                                            placeholder="Ex: VENDAS_DIRECT"
                                            value={newInstanceName}
                                            onChange={(e) => setNewInstanceName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 ml-1">
                                        <p className="text-[9px] text-slate-600 font-medium">Recomendado: Use apenas letras, números e underscores.</p>
                                    </div>
                                </div>

                                {/* Info UazAPI */}
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20">
                                    <span className="material-symbols-outlined text-[#d4af37] text-xl shrink-0 mt-0.5">info</span>
                                    <div>
                                        <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest mb-1">Token automático</p>
                                        <p className="text-slate-500 text-xs leading-relaxed">O token será gerado automaticamente pelo servidor UazAPI. Após criar, conecte escaneando o QR Code.</p>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all font-black uppercase text-[10px] tracking-widest border border-transparent hover:border-slate-700/50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-[1.5] bg-primary hover:scale-[1.02] active:scale-95 text-white px-8 h-14 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em]"
                                    >
                                        {creating ? (
                                            <>
                                                <div className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full"></div>
                                                Processando...
                                            </>
                                        ) : (
                                            <>
                                                <span>Criar Agora</span>
                                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
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
