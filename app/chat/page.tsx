"use client";

import { Sidebar } from "@/components/Sidebar";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface Message {
    id: string;
    content: string;
    sender: string;
    createdAt: string;
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: string;
    intent: string;
    updatedAt: string;
    messages: Message[];
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background-dark text-white">Carregando...</div>}>
            <ChatContent />
        </Suspense>
    );
}

function ChatContent() {
    const searchParams = useSearchParams();
    const leadId = searchParams.get("id");
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (leadId) {
            axios.get(`/api/leads/${leadId}`)
                .then(res => setLead(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [leadId]);

    const messages = lead?.messages || [];
    const lastInteraction = lead?.updatedAt ? new Date(lead.updatedAt).toLocaleTimeString() : "---";

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden bg-background-dark">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-slate-800 bg-[#0a0f14] px-8 py-4 z-10">
                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400" onClick={() => window.history.back()}>
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-white text-lg font-bold tracking-tight">Monitoramento de Chat</h2>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${lead ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {lead ? `IA Ativa e Respondendo para ${lead.name}` : "Selecione um lead para monitorar"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {lead && (
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-orange-900/20">
                                <span className="material-symbols-outlined text-sm">pause</span>
                                Pausar Automação para {lead.name.split(' ')[0]}
                            </button>
                        )}
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-white leading-none">Administrador</span>
                                <span className="text-[10px] text-slate-500 leading-normal">Evolution Admin</span>
                            </div>
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-slate-700 bg-slate-700"></div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Chat Area */}
                    <section className="flex-1 flex flex-col bg-wa-dark border-r border-slate-800">
                        {!lead ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <span className="material-symbols-outlined text-slate-700 text-8xl mb-4">forum</span>
                                <h3 className="text-white text-xl font-bold mb-2">Monitoramento em Tempo Real</h3>
                                <p className="text-slate-500 max-w-sm">Selecione um lead na lista de prospecção para visualizar a conversa e intervir se necessário.</p>
                            </div>
                        ) : (
                            <>
                                {/* Contact Header */}
                                <div className="px-6 py-3 bg-[#202c33] flex items-center justify-between border-b border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{lead.name}</span>
                                            <span className="text-[11px] text-slate-400">{lead.phone}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <span className="material-symbols-outlined cursor-pointer hover:text-white">search</span>
                                        <span className="material-symbols-outlined cursor-pointer hover:text-white">more_vert</span>
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-10">
                                    <div className="flex justify-center">
                                        <span className="bg-[#182229] text-[11px] text-slate-400 px-3 py-1 rounded-lg uppercase font-semibold tracking-wider border border-slate-700/50">
                                            {messages.length > 0 ? "Histórico de Conversa" : "Iniciando Conversa..."}
                                        </span>
                                    </div>

                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'IA' || msg.sender === 'USER' ? 'items-end w-full' : 'items-start max-w-[70%]'}`}>
                                            <div className={`${msg.sender === 'IA' || msg.sender === 'USER' ? 'bg-chat-bubble-sent' : 'bg-chat-bubble-received'} text-slate-100 p-3 rounded-lg ${msg.sender === 'IA' || msg.sender === 'USER' ? 'rounded-tr-none' : 'rounded-tl-none'} relative shadow-sm`}>
                                                {msg.sender === 'IA' && (
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="material-symbols-outlined text-[14px] text-emerald-300">smart_toy</span>
                                                        <span className="text-[10px] font-bold text-emerald-300 uppercase">IA Resposta</span>
                                                    </div>
                                                )}
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {(msg.sender === 'IA' || msg.sender === 'USER') && (
                                                        <span className="material-symbols-outlined text-[16px] text-sky-400">done_all</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-[#202c33] flex items-center gap-4">
                                    <button className="text-slate-400 hover:text-white">
                                        <span className="material-symbols-outlined">mood</span>
                                    </button>
                                    <button className="text-slate-400 hover:text-white">
                                        <span className="material-symbols-outlined">attach_file</span>
                                    </button>
                                    <div className="flex-1">
                                        <input className="w-full bg-[#2a3942] border-none rounded-lg py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-primary placeholder:text-slate-500 outline-none" placeholder="Intervir no chat (isso pausará a IA automaticamente)..." type="text" />
                                    </div>
                                    <button className="bg-primary text-white size-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition-all">
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </section>

                    {/* Right Sidebar: Lead Info */}
                    <section className="w-[400px] bg-[#171e27] p-6 flex flex-col gap-6 overflow-y-auto chat-scroll border-l border-slate-800">
                        {!lead ? (
                            <div className="h-full flex items-center justify-center text-slate-600 text-sm font-bold uppercase tracking-widest text-center">
                                Detalhes do Lead
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-800">
                                    <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center text-white text-2xl font-bold border-2 border-primary/30">
                                        {lead.name.charAt(0)}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white text-lg font-bold leading-tight">{lead.name}</h3>
                                        <p className="text-slate-500 text-xs mt-1">{lead.phone}</p>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                                            {lead.status}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tighter">
                                            {lead.intent}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Informações do Lead</h4>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">ID do Lead</span>
                                            <span className="text-sm text-white font-medium">{lead.id}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Última Interação</span>
                                            <span className="text-sm text-white font-medium">{lastInteraction}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Status do Pipeline</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${lead.status === 'Agendado' ? 'bg-emerald-500 w-full' : 'bg-primary w-1/2'}`}></div>
                                                </div>
                                                <span className="text-xs text-slate-400 font-bold">{lead.status === 'Agendado' ? '100%' : '50%'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-800">
                                    <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Ações Rápidas</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700/50">
                                            <span className="material-symbols-outlined text-[18px]">label</span>
                                            Adicionar Tag
                                        </button>
                                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700/50">
                                            <span className="material-symbols-outlined text-[18px]">person_off</span>
                                            Blacklist Lead
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6">
                                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 rounded-lg text-xs font-bold transition-all">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Excluir Conversa
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
