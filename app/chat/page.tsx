"use client";

import { Sidebar } from "@/components/Sidebar";
import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
    time?: string; // from list api
    trialClass?: any; // linked CRM data
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0f1218] text-[#d4af37] animate-pulse">Carregando CRM...</div>}>
            <ChatContent />
        </Suspense>
    );
}

function ChatContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const leadId = searchParams.get("id");

    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [msgInput, setMsgInput] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Leads List
    const fetchLeads = useCallback(async () => {
        try {
            const res = await axios.get("/api/leads");
            setLeads(res.data);
        } catch (error) {
            console.error("Error fetching leads list:", error);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
        const interval = setInterval(fetchLeads, 10000); // Polling list every 10s
        return () => clearInterval(interval);
    }, [fetchLeads]);

    // Fetch Selected Lead
    const fetchSelectedLead = useCallback(async (id: string) => {
        setLoadingChat(true);
        try {
            const res = await axios.get(`/api/leads/${id}`);
            setSelectedLead(res.data);
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error("Error fetching lead details:", error);
            // If error, maybe clear selection or show toast
        } finally {
            setLoadingChat(false);
        }
    }, []);

    useEffect(() => {
        if (leadId) {
            fetchSelectedLead(leadId);
        } else {
            setSelectedLead(null);
        }
    }, [leadId, fetchSelectedLead]);

    // Polling active chat
    useEffect(() => {
        if (!leadId) return;
        const interval = setInterval(() => {
            axios.get(`/api/leads/${leadId}`).then(res => {
                // Determine if we need to scroll (only if at bottom?)
                // For now just update data
                setSelectedLead(prev => {
                    if (JSON.stringify(prev?.messages) !== JSON.stringify(res.data.messages)) {
                        setTimeout(() => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                            }
                        }, 100);
                        return res.data;
                    }
                    return prev;
                });
            }).catch(console.error);
        }, 3000);
        return () => clearInterval(interval);
    }, [leadId]);

    const handleSend = async () => {
        if (!msgInput.trim() || !selectedLead) return;
        const txt = msgInput;
        setMsgInput(""); // Optimistic clear

        try {
            await axios.post('/api/chat/send', {
                leadId: selectedLead.id,
                content: txt
            });

            // Refresh to see the new message
            fetchSelectedLead(selectedLead.id);

        } catch (error) {
            console.error("Failed to send", error);
            alert("Falha ao enviar mensagem. Verifique se há uma instância conectada.");
            setMsgInput(txt);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0f1218]">
            <Sidebar />

            {/* Conversation List Sidebar */}
            <div className="w-[350px] flex flex-col border-r border-[#d4af37]/10 bg-[#0f1218] relative z-10">
                <div className="p-4 border-b border-[#d4af37]/10 bg-[#0f1218]/50 backdrop-blur-md">
                    <h2 className="text-[#d4af37] text-xs font-black uppercase tracking-[0.2em] mb-4">Conversas Ativas</h2>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar lead ou telefone..."
                            className="w-full bg-[#1a202c]/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingList && leads.length === 0 ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="p-4 border-b border-slate-800/30 animate-pulse flex gap-3">
                                <div className="size-12 rounded-full bg-slate-800"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                                    <div className="h-2 w-3/4 bg-slate-800/50 rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : leads.length === 0 ? (
                        <div className="text-center p-8 text-slate-600">
                            <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                            <p className="text-xs">Nenhuma conversa iniciada.</p>
                        </div>
                    ) : (
                        leads.map(lead => (
                            <div
                                key={lead.id}
                                onClick={() => router.push(`/chat?id=${lead.id}`)}
                                className={`p-4 border-b border-[#d4af37]/5 cursor-pointer transition-all hover:bg-[#d4af37]/5 group ${leadId === lead.id ? 'bg-[#d4af37]/10 border-l-2 border-l-[#d4af37]' : 'border-l-2 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`text-sm font-bold ${leadId === lead.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{lead.name || lead.phone}</h3>
                                    <span className="text-[10px] text-slate-500 font-mono">{lead.time || '12:00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500 truncate max-w-[200px] group-hover:text-slate-400">
                                        {lead.phone}
                                    </p>
                                    {lead.status === 'NEW' && (
                                        <span className="size-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.5)] animate-pulse"></span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0e14] relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

                {!selectedLead ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 relative z-10">
                        <div className="size-24 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/20 flex items-center justify-center mb-6 animate-pulse-slow">
                            <span className="material-symbols-outlined text-5xl text-[#d4af37]">forum</span>
                        </div>
                        <h2 className="text-2xl text-white font-black uppercase tracking-tight mb-2">CRM Chat v2.0</h2>
                        <p className="text-slate-500 max-w-md text-sm">Selecione uma conversa ao lado para monitorar interações em tempo real ou intervir manualmente.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className="px-6 py-4 bg-[#0f1218]/90 backdrop-blur-md border-b border-[#d4af37]/10 flex justify-between items-center relative z-20">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a7224] p-0.5">
                                    <div className="size-full bg-[#0f1218] rounded-full flex items-center justify-center text-[#d4af37] font-bold">
                                        {selectedLead.name?.charAt(0) || selectedLead.phone?.charAt(0)}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-white text-sm font-black uppercase tracking-wide">{selectedLead.name}</h2>
                                    <p className="text-[#d4af37] text-[10px] font-mono tracking-wider">{selectedLead.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${selectedLead.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    selectedLead.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                    {selectedLead.status}
                                </div>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar" ref={scrollRef}>
                            {selectedLead.messages?.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'IA' || msg.sender === 'USER' || msg.sender === 'BOT' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.sender === 'IA' || msg.sender === 'BOT' ? 'bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-tr-sm' :
                                        msg.sender === 'USER' ? 'bg-slate-800 border border-slate-700 rounded-tr-sm' :
                                            'bg-[#1f2937] border border-slate-700/50 rounded-tl-sm'
                                        }`}>
                                        {/* Automation Label */}
                                        {(msg.sender === 'IA' || msg.sender === 'BOT') && (
                                            <div className="flex items-center gap-1.5 mb-1.5 border-b border-[#d4af37]/10 pb-1">
                                                <span className="material-symbols-outlined text-[12px] text-[#d4af37]">smart_toy</span>
                                                <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-wider">Automação</span>
                                            </div>
                                        )}

                                        {/* Human Label */}
                                        {msg.sender === 'USER' && (
                                            <div className="flex items-center gap-1.5 mb-1.5 border-b border-slate-700/50 pb-1">
                                                <span className="material-symbols-outlined text-[12px] text-blue-400">person</span>
                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Atendente</span>
                                            </div>
                                        )}

                                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <div className="flex justify-end mt-1.5 opacity-50">
                                            <span className="text-[9px] text-slate-400 font-mono">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#0f1218] border-t border-[#d4af37]/10 relative z-20">
                            <div className="flex gap-3 items-end bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 focus-within:border-[#d4af37]/30 transition-colors">
                                <button className="p-2 text-slate-500 hover:text-[#d4af37] transition-colors rounded-xl hover:bg-[#d4af37]/5">
                                    <span className="material-symbols-outlined">add_circle</span>
                                </button>
                                <textarea
                                    value={msgInput}
                                    onChange={(e) => setMsgInput(e.target.value)}
                                    placeholder="Digite uma mensagem..."
                                    className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-600 focus:ring-0 resize-none max-h-32 py-2 text-sm custom-scrollbar"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    className="p-2 bg-[#d4af37] hover:bg-[#b5952f] text-[#0f1218] rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                            <p className="text-center text-[9px] text-slate-600 mt-2 font-mono uppercase tracking-widest">
                                Intervenção manual pausa a automação por 30min
                            </p>
                        </div>
                    </>
                )}
            </main>

            {/* Right Details Panel (Optional, can be collapsible) */}
            {selectedLead && (
                <div className="w-[300px] bg-[#0f1218] border-l border-[#d4af37]/10 hidden xl:flex flex-col relative z-20">
                    <div className="p-6 border-b border-[#d4af37]/10 flex flex-col items-center text-center">
                        <div className="size-20 rounded-full bg-gradient-to-br from-[#d4af37] to-transparent p-[1px] mb-4">
                            <div className="size-full bg-[#0f1218] rounded-full flex items-center justify-center">
                                <span className="text-2xl text-white font-black">{selectedLead.name?.charAt(0)}</span>
                            </div>
                        </div>
                        <h3 className="text-white font-bold">{selectedLead.name}</h3>
                        <p className="text-slate-500 text-xs">{selectedLead.phone}</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.2em] mb-3">Pipeline</h4>
                            <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-xl p-3">
                                <span className="text-xs text-white font-bold block mb-1">{selectedLead.status}</span>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#d4af37] w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Intenção</h4>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-300 border border-slate-700">
                                {selectedLead.intent || 'Indefinido'}
                            </span>
                        </div>

                        {/* Trial Class / CRM Link */}
                        {selectedLead.trialClass && (
                            <div className="pt-4 border-t border-slate-800/50">
                                <h4 className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-3">Aula Experimental</h4>
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${selectedLead.trialClass.status === 'PENDING' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' :
                                                selectedLead.trialClass.status === 'CONFIRMED' ? 'text-primary border-primary/20 bg-primary/5' :
                                                    selectedLead.trialClass.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                                                        selectedLead.trialClass.status === 'CONVERTED' ? 'text-pink-400 border-pink-500/20 bg-pink-500/5' :
                                                            'text-red-400 border-red-500/20'
                                            }`}>
                                            {selectedLead.trialClass.status}
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">{selectedLead.trialClass.sport}</span>
                                    </div>

                                    {selectedLead.trialClass.scheduledDate ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
                                                <p className="text-[11px] font-bold text-white">
                                                    {new Date(selectedLead.trialClass.scheduledDate).toLocaleDateString('pt-BR')} às {new Date(selectedLead.trialClass.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {selectedLead.trialClass.teacher && (
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px] text-emerald-400">school</span>
                                                    <p className="text-[10px] text-slate-300 font-medium">Prof. {selectedLead.trialClass.teacher.name}</p>
                                                </div>
                                            )}
                                            {selectedLead.trialClass.court && (
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full" style={{ backgroundColor: selectedLead.trialClass.court.color }}></div>
                                                    <p className="text-[10px] text-slate-300 font-medium">{selectedLead.trialClass.court.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-500 italic">Aula ainda não agendada</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
