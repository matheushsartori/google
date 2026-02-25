"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type StatusData = { exists: boolean; status?: string; instance?: any };

export default function LwanConnectPage() {
    const [statusData, setStatusData] = useState<StatusData | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            setErrorMsg(null);
            const res = await axios.get("/api/lwan");
            setStatusData(res.data);
            if (res.data?.status === "CONNECTED") {
                setQrCode(null);
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Erro ao conectar");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Mantém a verificação apenas a cada 5 segundos (a UazAPI demora um pouco a atualizar o status da sessão)
        const interval = setInterval(() => {
            fetchStatus();

            // Só regerar o qrcode em loop se já a gente tiver acionado explicitamente via botão
            // Porém o usuário pediu pra ser via botão "Gerar QR Code", então não chamamos handleConnect aqui 
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async () => {
        setActionLoading(true);
        setStatusData(null);
        setQrCode(null);
        try {
            await axios.post("/api/lwan");
            await fetchStatus();
            setTimeout(handleConnect, 2000); // Tenta gerar QR Code logo após criar
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConnect = async () => {
        setActionLoading(true);
        try {
            const res = await axios.get("/api/lwan/connect");
            if (res.data?.base64) {
                setQrCode(res.data.base64);
            }
            if (res.data?.status === "connected") {
                await fetchStatus();
            }
        } catch (e: any) {
            setErrorMsg("Erro ao gerar QR Code");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja deletar a instância? Ela será desconectada e apagada permanentemente.")) return;
        setActionLoading(true);
        try {
            await axios.delete("/api/lwan");
            setQrCode(null);
            await fetchStatus();
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const isConnected = statusData?.status === "CONNECTED";

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-primary/30">
            <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 animate-in fade-in duration-700">
                <header className="border-b border-slate-800/60 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 text-primary mb-2">
                            <span className="material-symbols-outlined text-3xl">smart_toy</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sistema Isolado</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter italic">Lwan Tênis</h1>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">Servidor UazAPI: sartori-server.uazapi.com<br />Acesso público isolado do sistema principal.</p>
                    </div>
                    {statusData && (
                        <div className="flex items-center gap-4 bg-slate-900/50 px-5 py-3 rounded-2xl border border-slate-800">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Status</span>
                                {isConnected ? (
                                    <span className="text-sm font-black text-emerald-400">ON-LINE</span>
                                ) : statusData.exists ? (
                                    <span className="text-sm font-black text-amber-500">AGUARDANDO QR</span>
                                ) : (
                                    <span className="text-sm font-black text-slate-500">NÃO CRIADA</span>
                                )}
                            </div>
                            <div className={`size-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : statusData.exists ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}></div>
                        </div>
                    )}
                </header>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                        <span className="material-symbols-outlined">error</span>
                        {errorMsg}
                    </div>
                )}

                <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Painel Esquerdo: QR Code e Ações */}
                    <section className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                        {loading ? (
                            <div className="animate-spin size-10 border-4 border-slate-700 border-t-primary rounded-full"></div>
                        ) : !statusData?.exists ? (
                            <div className="text-center space-y-6">
                                <span className="material-symbols-outlined text-6xl text-slate-700">cloud_off</span>
                                <h2 className="text-xl font-black text-white">Instância Inativa</h2>
                                <p className="text-sm text-slate-500">A instância lwan-tenis não existe no servidor. Clique abaixo para ativá-la.</p>
                                <button
                                    onClick={handleCreate}
                                    disabled={actionLoading}
                                    className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? "Criando..." : "Criar Instância"}
                                </button>
                            </div>
                        ) : isConnected ? (
                            <div className="text-center space-y-6">
                                <div className="size-32 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-500 text-6xl">verified</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Conectado</h2>
                                    <p className="text-slate-400 text-sm mt-1">{statusData.instance?.profileName || "WhatsApp Pronto"}</p>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                    className="text-red-400 hover:text-white bg-red-400/5 hover:bg-red-500/80 border border-red-500/20 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl transition-all disabled:opacity-50"
                                >
                                    Desconectar & Excluir
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-6 w-full flex flex-col items-center">
                                {qrCode ? (
                                    <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl relative overflow-hidden group">
                                        <img src={qrCode} alt="QR Code" className="size-56" />
                                        <div className="absolute left-0 right-0 h-1 bg-primary/40 top-0 animate-[scan_3s_linear_infinite] pointer-events-none shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                ) : (
                                    <div className="size-56 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500">
                                        {actionLoading ? (
                                            <div className="animate-spin size-8 border-4 border-slate-700 border-t-primary rounded-full"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                                        )}
                                    </div>
                                )}

                                <p className="text-sm text-slate-400 font-medium max-w-xs">
                                    Aponte a câmera do WhatsApp (Dispositivos Conectados) para este código.
                                </p>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleConnect}
                                        disabled={actionLoading}
                                        className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                    >
                                        Gerar QR Code
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Resetar
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Painel Direito: Endpoints API */}
                    <section className="bg-[#0a0a0c] border border-slate-800/50 rounded-[32px] p-8">
                        <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="size-1 rounded-full bg-primary"></span> Documentação da API
                        </h3>

                        <div className="space-y-8">
                            <div>
                                <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">chat</span> Enviar Mensagem de Texto
                                </h4>
                                <div className="bg-[#050505] border border-slate-800/80 rounded-xl p-4 font-mono text-[10px] md:text-xs">
                                    <span className="text-emerald-400 font-black">POST</span> <span className="text-slate-300">/api/lwan/send/text</span>
                                    <div className="mt-3 text-slate-500">
                                        // Body<br />
                                        {"{"}<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"number"</span>: <span className="text-amber-300">"5511999999999"</span>,<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"text"</span>: <span className="text-amber-300">"Sua mensagem aqui"</span><br />
                                        {"}"}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">attach_file</span> Enviar Arquivo / Mídia
                                </h4>
                                <div className="bg-[#050505] border border-slate-800/80 rounded-xl p-4 font-mono text-[10px] md:text-xs overflow-x-auto">
                                    <span className="text-emerald-400 font-black">POST</span> <span className="text-slate-300">/api/lwan/send/media</span>
                                    <div className="mt-3 text-slate-500">
                                        // Body<br />
                                        {"{"}<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"number"</span>: <span className="text-amber-300">"5511999999999"</span>,<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"type"</span>: <span className="text-amber-300">"image"</span> <span className="text-slate-600">// image, video, document, audio</span><br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"file"</span>: <span className="text-amber-300">"https://link/foto.jpg"</span>,<br />
                                        &nbsp;&nbsp;<span className="text-blue-400">"text"</span>: <span className="text-amber-300">"Legenda (opcional)"</span><br />
                                        {"}"}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 font-medium">Você pode testar esses endpoints fazendo uma requisição via cURL, Insomnia, Postman, ou diretamente de qualquer sistema. A URL base é o seu próprio domínio onde esta página está rodando.</p>
                        </div>
                    </section>
                </main>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
}
