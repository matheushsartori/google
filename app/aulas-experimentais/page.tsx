"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

interface TrialClass {
    id: string;
    name: string;
    phone: string;
    sport: string;
    level: string;
    availability: any;
    observations: string;
    status: string;
    scheduledDate: string | null;
    tags: string[];
    archived: boolean;
    createdAt: string;
}

export default function TrialClassesAdminPage() {
    const [registrations, setRegistrations] = useState<TrialClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"kanban" | "list" | "calendar">("kanban");

    // Filters
    const [filterLevel, setFilterLevel] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPeriod, setFilterPeriod] = useState("all");
    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReg, setSelectedReg] = useState<TrialClass | null>(null);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/marcar-aula", {
                params: { level: filterLevel, status: filterStatus, archived: showArchived }
            });
            setRegistrations(res.data);
        } catch (error) {
            toast.error("Erro ao carregar agendamentos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, [filterLevel, filterStatus, showArchived]);

    const updateRegistration = async (id: string, data: Partial<TrialClass>, silent = false) => {
        try {
            await axios.post("/api/marcar-aula/update-status", { id, ...data });
            if (!silent) toast.success("Registro atualizado!");
            fetchRegistrations();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Erro ao atualizar registro");
            fetchRegistrations(); // Rollback on error
        }
    };

    const optimisticUpdateStatus = (id: string, newStatus: string) => {
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    };

    const handleOpenModal = (reg: TrialClass) => {
        setSelectedReg(reg);
        if (reg.scheduledDate) {
            const d = new Date(reg.scheduledDate);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().split(' ')[0].substring(0, 5));
        } else {
            setScheduledDate("");
            setScheduledTime("");
        }
        setIsModalOpen(true);
    };

    const handleSaveSchedule = () => {
        if (!selectedReg) return;

        const data: Partial<TrialClass> = { status: "CONFIRMED" };

        if (scheduledDate && scheduledTime) {
            const fullDate = new Date(`${scheduledDate}T${scheduledTime}:00`);
            data.scheduledDate = fullDate.toISOString();
        } else {
            data.scheduledDate = null;
        }

        updateRegistration(selectedReg.id, data);
    };

    const addTag = (id: string, currentTags: string[]) => {
        const tag = prompt("Digite a nova tag:");
        if (tag) {
            updateRegistration(id, { tags: [...currentTags, tag] });
        }
    };

    const removeTag = (id: string, currentTags: string[], tagToRemove: string) => {
        updateRegistration(id, { tags: currentTags.filter(t => t !== tagToRemove) });
    };

    const filteredData = registrations.filter(reg => {
        const matchesSearch = reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.phone.includes(searchQuery) ||
            reg.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        const regDate = new Date(reg.createdAt);
        const now = new Date();
        if (filterPeriod === "today") {
            return regDate.toDateString() === now.toDateString();
        } else if (filterPeriod === "week") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return regDate >= oneWeekAgo;
        } else if (filterPeriod === "month") {
            return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
        }

        return true;
    });

    const kanbanColumns = [
        { id: "PENDING", title: "Novos Leads", icon: "inbox", color: "text-amber-400" },
        { id: "CONFIRMED", title: "Agendados", icon: "calendar_month", color: "text-primary" },
        { id: "CANCELLED", title: "Cancelados", icon: "cancel", color: "text-red-400" }
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c10] text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="CRM Aulas Experimentais" />

                {/* Filters & Actions Bar */}
                <div className="px-8 py-4 bg-[#11161d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Buscar por nome, telefone ou tag..."
                            />
                        </div>
                        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                            {(["kanban", "list", "calendar"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {mode === 'kanban' ? 'Kanban' : mode === 'list' ? 'Lista' : 'Calendário'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-white hover:border-slate-700 outline-none"
                        >
                            <option value="all">Todo Período</option>
                            <option value="today">Hoje</option>
                            <option value="week">Últimos 7 dias</option>
                            <option value="month">Este Mês</option>
                        </select>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-white hover:border-slate-700 outline-none"
                        >
                            <option value="">Nível</option>
                            <option value="INICIANTE">Iniciante</option>
                            <option value="INTERMEDIARIO">Intermediário</option>
                            <option value="AVANCADO">Avançado</option>
                        </select>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${showArchived ? 'bg-slate-700 border-slate-600' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}
                        >
                            {showArchived ? "Ver Ativos" : "Arquivados"}
                        </button>
                        <button
                            onClick={fetchRegistrations}
                            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                            <div className="animate-spin size-8 border-3 border-primary border-t-transparent rounded-full mr-4"></div>
                            Processando CRM...
                        </div>
                    ) : viewMode === "kanban" ? (
                        <div className="flex h-full p-6 gap-6 min-w-[1000px]">
                            {kanbanColumns.map(col => (
                                <div
                                    key={col.id}
                                    className={`flex-1 flex flex-col min-w-[300px] bg-[#11161d]/50 rounded-[32px] border transition-all duration-300 ${dragOverCol === col.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-800/50'}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverCol(col.id);
                                    }}
                                    onDragLeave={() => setDragOverCol(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverCol(null);
                                        if (draggedId) {
                                            const reg = registrations.find(r => r.id === draggedId);
                                            if (!reg) return;

                                            // Optimistic Update
                                            optimisticUpdateStatus(draggedId, col.id);

                                            if (col.id === 'CONFIRMED') {
                                                handleOpenModal({ ...reg, status: col.id });
                                            } else {
                                                updateRegistration(draggedId, { status: col.id }, true);
                                            }
                                        }
                                    }}
                                >
                                    <div className="p-5 flex items-center justify-between border-b border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined ${col.color}`}>{col.icon}</span>
                                            <h3 className="font-black text-white italic uppercase tracking-tighter">{col.title}</h3>
                                        </div>
                                        <span className="bg-slate-800 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-400">
                                            {filteredData.filter(r => r.status === col.id).length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                        {filteredData.filter(r => r.status === col.id).map(reg => (
                                            <KanbanCard
                                                key={reg.id}
                                                reg={reg}
                                                onArchive={() => updateRegistration(reg.id, { archived: !reg.archived })}
                                                onUpdate={(data) => updateRegistration(reg.id, data)}
                                                onSetDate={() => handleOpenModal(reg)}
                                                onAddTag={() => addTag(reg.id, reg.tags)}
                                                onRemoveTag={(tag) => removeTag(reg.id, reg.tags, tag)}
                                                onDragStart={() => setDraggedId(reg.id)}
                                                onDragEnd={() => setDraggedId(null)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="p-8">
                            <table className="w-full text-left border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        <th className="px-6 py-4">Lead / Modalidade</th>
                                        <th className="px-6 py-4">Status / Tags</th>
                                        <th className="px-6 py-4">Agendamento</th>
                                        <th className="px-6 py-4">Data Registro</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(reg => (
                                        <tr key={reg.id} className="bg-[#1c222c] hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-5 rounded-l-2xl border-y border-l border-slate-800/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-primary border border-slate-700">
                                                        <span className="material-symbols-outlined text-xl">person</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white italic truncate">{reg.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold">{reg.sport} - {reg.level}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 border-y border-slate-800/50">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit bg-slate-900 border ${reg.status === 'PENDING' ? 'text-amber-400 border-amber-500/20' : reg.status === 'CONFIRMED' ? 'text-primary border-primary/20' : 'text-red-400 border-red-500/20'}`}>
                                                        {reg.status}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {reg.tags.map(t => (
                                                            <span key={t} className="text-[8px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">#{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 border-y border-slate-800/50">
                                                {reg.scheduledDate ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-white font-bold">{new Date(reg.scheduledDate).toLocaleDateString('pt-BR')}</span>
                                                        <span className="text-[10px] text-slate-500">{new Date(reg.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-600 font-bold">Não agendado</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 border-y border-slate-800/50">
                                                <span className="text-[10px] text-slate-400 font-bold">{new Date(reg.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </td>
                                            <td className="px-6 py-5 rounded-r-2xl border-y border-r border-slate-800/50 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => window.open(`https://wa.me/${reg.phone.replace(/\D/g, '')}`, '_blank')}
                                                        className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all border border-emerald-500/20"
                                                    >
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="size-4" alt="WA" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateRegistration(reg.id, { archived: !reg.archived })}
                                                        className="size-8 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all border border-slate-700"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">{reg.archived ? 'unarchive' : 'archive'}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <CalendarView data={filteredData} onOpenReg={handleOpenModal} />
                    )}
                </div>

                {/* Scheduling Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
                        <div className="bg-[#161b22] border border-slate-800 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-800 bg-[#1c222c]">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Agendar Aula</h3>
                                <p className="text-slate-400 text-sm font-medium">Defina data e hora para <span className="text-primary font-bold">{selectedReg?.name}</span></p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data da Aula</label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 text-white focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário</label>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 text-white focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Preferencia</span>
                                        <span className="text-xs font-bold text-slate-300">{selectedReg?.availability?.days?.join(", ")}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Periodo</span>
                                        <span className="text-xs font-bold text-primary block uppercase">{selectedReg?.availability?.period}</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 rounded-2xl border-2 border-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveSchedule}
                                        className="flex-[2] h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        Confirmar Agendamento
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function CalendarView({ data, onOpenReg }: { data: TrialClass[], onOpenReg: (reg: TrialClass) => void }) {
    // Basic week view or day sorting
    const scheduledOnly = data.filter(d => d.scheduledDate).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Cronograma de Aulas</h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <div className="size-2 rounded-full bg-primary"></div> Agendada
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scheduledOnly.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
                            <p className="text-slate-500 font-medium">Nenhuma aula agendada para exibição no cronograma.</p>
                        </div>
                    ) : scheduledOnly.map(reg => (
                        <div key={reg.id} className="bg-[#1c222c] border border-slate-800 rounded-3xl overflow-hidden shadow-lg group hover:border-primary transition-all">
                            <div className="p-4 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
                                <span className="text-[10px] font-black text-primary uppercase">{new Date(reg.scheduledDate!).toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                                <span className="text-sm font-black text-white italic">{new Date(reg.scheduledDate!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <h4 className="font-black text-white italic">{reg.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{reg.level} - {reg.sport}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.open(`https://wa.me/${reg.phone.replace(/\D/g, '')}`, '_blank')}
                                        className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all"
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="size-4" alt="WA" />
                                    </button>
                                    <button
                                        onClick={() => onOpenReg(reg)}
                                        className="flex-1 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase transition-all"
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function KanbanCard({ reg, onArchive, onUpdate, onSetDate, onAddTag, onRemoveTag, onDragStart, onDragEnd }: {
    reg: TrialClass,
    onArchive: () => void,
    onUpdate: (data: Partial<TrialClass>) => void,
    onSetDate: () => void,
    onAddTag: () => void,
    onRemoveTag: (tag: string) => void,
    onDragStart: () => void,
    onDragEnd: () => void
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="bg-[#1c222c] border border-slate-800/80 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all group border-l-4 border-l-primary/30 cursor-grab active:cursor-grabbing active:scale-95 active:rotate-1"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-black text-white italic text-sm">{reg.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{reg.phone}</p>
                </div>
                <div className="flex gap-1 opactiy-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onArchive} className="p-1 hover:bg-slate-700 rounded text-slate-500"><span className="material-symbols-outlined text-sm">archive</span></button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded bg-slate-900 border ${reg.level === 'INICIANTE' ? 'text-emerald-400 border-emerald-500/10' : 'text-primary border-primary/10'}`}>
                    {reg.level}
                </span>
                <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-900 border text-slate-400 border-slate-800">
                    {reg.sport}
                </span>
                {reg.tags.map(t => (
                    <span key={t} onClick={() => onRemoveTag(t)} className="text-[8px] bg-primary/10 px-2 py-0.5 rounded text-primary font-bold cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center gap-1">
                        #{t}
                    </span>
                ))}
                <button onClick={onAddTag} className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 hover:text-white transition-all">+</button>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span className="text-[10px] font-medium">{reg.availability?.days?.join(", ")} - {reg.availability?.period}</span>
                </div>
                {reg.scheduledDate && (
                    <div className="flex items-center gap-2 text-emerald-400">
                        <span className="material-symbols-outlined text-[14px]">event_available</span>
                        <span className="text-[10px] font-black">Marcada: {new Date(reg.scheduledDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => window.open(`https://wa.me/${reg.phone.replace(/\D/g, '')}`, '_blank')}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white h-9 rounded-xl flex items-center justify-center transition-all border border-emerald-500/20"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="size-4" alt="WA" />
                </button>
                <button
                    onClick={onSetDate}
                    className="flex-[2] bg-primary/10 hover:bg-primary text-primary hover:text-white h-9 rounded-xl flex items-center justify-center transition-all border border-primary/20 text-[10px] font-black uppercase"
                >
                    {reg.scheduledDate ? "Alterar" : "Agendar"}
                </button>
                {reg.status !== 'CANCELLED' && (
                    <button
                        onClick={() => onUpdate({ status: 'CANCELLED' })}
                        className="size-9 bg-red-400/10 hover:bg-red-400 text-red-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-400/20"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}
            </div>

            <div className="mt-4 flex justify-between items-center text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                <span>Criado: {new Date(reg.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
}
