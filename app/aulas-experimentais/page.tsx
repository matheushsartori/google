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
    email?: string;
    cpf?: string;
    birthDate?: string;
    sport: string;
    level: string;
    availability: any;
    observations: string;
    status: string;
    scheduledDate: string | null;
    tags: string[];
    archived: boolean;
    isConverted: boolean;
    teacherId?: string;
    courtId?: string;
    teacher?: { id: string, name: string, phone: string };
    court?: { id: string, name: string, color: string };
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
    const [filterCourt, setFilterCourt] = useState("");
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReg, setSelectedReg] = useState<TrialClass | null>(null);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [selectedCourtId, setSelectedCourtId] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editCpf, setEditCpf] = useState("");
    const [editBirthDate, setEditBirthDate] = useState("");
    const [modalStatus, setModalStatus] = useState("CONFIRMED");
    const [isConverted, setIsConverted] = useState(false);

    // Automation Confirmation Modal
    const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
    const [autoModalTarget, setAutoModalTarget] = useState<TrialClass | null>(null);
    const [autoModalStage, setAutoModalStage] = useState("");
    const [autoModalTeacherId, setAutoModalTeacherId] = useState("");
    const [autoModalCourtId, setAutoModalCourtId] = useState("");
    const [autoModalDate, setAutoModalDate] = useState("");
    const [autoPreview, setAutoPreview] = useState({ student: "", teacher: "" });

    // Lookups
    const [teachers, setTeachers] = useState<any[]>([]);
    const [courts, setCourts] = useState<any[]>([]);
    const [automations, setAutomations] = useState<any[]>([]);

    const handleCpfChange = (val: string) => {
        const numbers = val.replace(/\D/g, "");
        let masked = "";
        if (numbers.length > 0) {
            masked = numbers.substring(0, 3);
            if (numbers.length > 3) masked += "." + numbers.substring(3, 6);
            if (numbers.length > 6) masked += "." + numbers.substring(6, 9);
            if (numbers.length > 9) masked += "-" + numbers.substring(9, 11);
        }
        setEditCpf(masked);
    };

    const handleBirthDateChangeMask = (val: string) => {
        const numbers = val.replace(/\D/g, "");
        let masked = "";
        if (numbers.length > 0) {
            masked = numbers.substring(0, 2);
            if (numbers.length > 2) masked += "/" + numbers.substring(2, 4);
            if (numbers.length > 4) masked += "/" + numbers.substring(4, 8);
        }
        setEditBirthDate(masked);
    };

    const fetchLookups = async () => {
        try {
            const [baseRes, teachersRes, courtsRes, automationsRes] = await Promise.all([
                axios.get("/api/marcar-aula", { params: { level: filterLevel, status: filterStatus, archived: showArchived } }),
                axios.get("/api/teachers", { params: { active: true } }),
                axios.get("/api/courts"),
                axios.get("/api/automations")
            ]);
            setRegistrations(baseRes.data);
            setTeachers(teachersRes.data);
            setCourts(courtsRes.data);
            setAutomations(automationsRes.data);
        } catch (error) {
            console.error("Error fetching lookups:", error);
        } finally {
            setLoading(false);
        }
    };

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
        fetchLookups();
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
        setModalStatus(reg.status === "PENDING" ? "CONFIRMED" : reg.status);
        if (reg.scheduledDate) {
            const d = new Date(reg.scheduledDate);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().split(' ')[0].substring(0, 5));
        } else {
            setScheduledDate("");
            setScheduledTime("");
        }
        setSelectedTeacherId(reg.teacherId || "");
        setSelectedCourtId(reg.courtId || "");
        setEditEmail(reg.email || "");
        setEditCpf(reg.cpf || "");
        setEditBirthDate(reg.birthDate || "");
        setIsConverted(reg.isConverted || reg.status === 'CONVERTED');
        setIsModalOpen(true);
    };

    const buildMessage = (text: string, reg: TrialClass, teacherId?: string, courtId?: string, date?: string) => {
        const teacher = teachers.find(t => t.id === teacherId);
        const court = courts.find(c => c.id === courtId);
        const variables = {
            "{student_name}": reg.name,
            "{student_phone}": reg.phone,
            "{teacher_name}": teacher?.name || "Professor",
            "{court_name}": court?.name || "Quadra",
            "{sport}": reg.sport,
            "{date}": date ? new Date(date).toLocaleDateString('pt-BR') : "a combinar",
            "{time}": date ? new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "a combinar"
        };
        let res = text;
        Object.entries(variables).forEach(([key, val]) => {
            res = res.replace(new RegExp(key, 'g'), val);
        });
        return res;
    };

    const sendAutomatedMessages = async (reg: TrialClass, stage: string, teacherId?: string, courtId?: string, date?: string, target: "BOTH" | "STUDENT" | "TEACHER" = "BOTH") => {
        const automation = automations.find(a => a.stage === stage);
        if (!automation || !automation.active) return;

        const teacher = teachers.find(t => t.id === teacherId);

        try {
            // Get first active connection instance
            const connectionRes = await axios.get("/api/instances");
            const instance = connectionRes.data.find((i: any) => i.status === "CONNECTED");

            if (!instance) {
                toast.error("Nenhuma instância conectada para enviar mensagens");
                return;
            }

            if ((target === "BOTH" || target === "TEACHER") && automation.teacherMsg && teacher?.phone) {
                await axios.post("/api/chat/send", {
                    instanceName: instance.name,
                    number: teacher.phone,
                    text: buildMessage(automation.teacherMsg, reg, teacherId, courtId, date),
                    automationType: "TEACHER",
                    stage: stage,
                    targetName: teacher.name
                });
                toast.success(`Mensagem enviada para o professor ${teacher.name}`);
            }

            if ((target === "BOTH" || target === "STUDENT") && automation.studentMsg && reg.phone) {
                await axios.post("/api/chat/send", {
                    instanceName: instance.name,
                    number: reg.phone,
                    text: buildMessage(automation.studentMsg, reg, teacherId, courtId, date),
                    automationType: "STUDENT",
                    stage: stage,
                    targetName: reg.name
                });
                toast.success(`Mensagem enviada para o aluno ${reg.name}`);
            }
        } catch (error) {
            console.error("Error sending automations:", error);
            toast.error("Erro ao enviar mensagens automáticas");
        }
    };

    const handleSaveSchedule = () => {
        if (!selectedReg) return;

        const data: Partial<TrialClass> = {
            status: modalStatus,
            email: editEmail,
            cpf: editCpf,
            birthDate: editBirthDate,
            isConverted: isConverted,
            teacherId: selectedTeacherId || undefined,
            courtId: selectedCourtId || undefined
        };

        let finalDate = "";
        if (scheduledDate && scheduledTime) {
            const fullDate = new Date(`${scheduledDate}T${scheduledTime}:00`);
            data.scheduledDate = fullDate.toISOString();
            finalDate = data.scheduledDate;
        } else {
            data.scheduledDate = null;
        }

        updateRegistration(selectedReg.id, data);

        // Open Automation Modal Instead of Confirm
        const automation = automations.find(a => a.stage === data.status);
        if (automation && automation.active) {
            setAutoModalTarget(selectedReg);
            setAutoModalStage(data.status!);
            setAutoModalTeacherId(selectedTeacherId);
            setAutoModalCourtId(selectedCourtId);
            setAutoModalDate(finalDate);
            setAutoPreview({
                student: buildMessage(automation.studentMsg || "", selectedReg, selectedTeacherId, selectedCourtId, finalDate),
                teacher: buildMessage(automation.teacherMsg || "", selectedReg, selectedTeacherId, selectedCourtId, finalDate)
            });
            setIsAutoModalOpen(true);
        }
    };

    const handleSaveStudentData = () => {
        if (!selectedReg) return;
        updateRegistration(selectedReg.id, {
            email: editEmail,
            cpf: editCpf,
            birthDate: editBirthDate,
            isConverted: isConverted
        });
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
            const today = regDate.toDateString() === now.toDateString();
            if (!today) return false;
        } else if (filterPeriod === "week") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            if (regDate < oneWeekAgo) return false;
        } else if (filterPeriod === "month") {
            const sameMonth = regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
            if (!sameMonth) return false;
        }

        const matchesCourt = !filterCourt || reg.courtId === filterCourt;
        if (!matchesCourt) return false;

        const matchesLevel = !filterLevel || reg.level === filterLevel;
        if (!matchesLevel) return false;

        return true;
    });

    const kanbanColumns = [
        { id: "PENDING", title: "Novos Leads", icon: "inbox", color: "text-amber-400" },
        { id: "CONFIRMED", title: "Agendados", icon: "calendar_month", color: "text-primary" },
        { id: "COMPLETED", title: "Realizados", icon: "task_alt", color: "text-emerald-400" },
        { id: "CONVERTED", title: "Fechados", icon: "stars", color: "text-pink-400" },
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
                            value={filterCourt}
                            onChange={(e) => setFilterCourt(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-white hover:border-slate-700 outline-none"
                        >
                            <option value="">Todas as Quadras</option>
                            {courts.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
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

                                            if (col.id === 'CONFIRMED' || col.id === 'COMPLETED' || col.id === 'CONVERTED') {
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
                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                            <p className="text-[10px] text-slate-500 font-bold">{reg.phone}</p>
                                                            <p className="text-[9px] text-slate-400 font-medium">{reg.sport} - {reg.level}</p>
                                                            <div className="flex gap-2 mt-1">
                                                                {reg.email && <span className="text-[8px] text-slate-600 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">mail</span> {reg.email}</span>}
                                                                {reg.cpf && <span className="text-[8px] text-slate-600 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">badge</span> {reg.cpf}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 border-y border-slate-800/50">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit bg-slate-900 border ${reg.status === 'PENDING' ? 'text-amber-400 border-amber-500/20' :
                                                        reg.status === 'CONFIRMED' ? 'text-primary border-primary/20' :
                                                            reg.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-500/20' :
                                                                'text-red-400 border-red-500/20'
                                                        }`}>
                                                        {reg.status === 'CONVERTED' ? 'FECHADO' : reg.status === 'COMPLETED' ? 'REALIZADO' : reg.status === 'CONFIRMED' ? 'AGENDADO' : reg.status === 'PENDING' ? 'PENDENTE' : 'CANCELADO'}
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
                {
                    isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
                            <div className="bg-[#161b22] border border-slate-800 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="p-8 border-b border-slate-800 bg-[#1c222c]">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {modalStatus === "COMPLETED" ? "Concluir Aula" : "Agendar Aula"}
                                    </h3>
                                    <div className="flex flex-col">
                                        <p className="text-slate-400 text-sm font-medium">Configure os detalhes da aula para <span className="text-primary font-bold">{selectedReg?.name}</span></p>
                                    </div>
                                </div>
                                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 mb-4">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Informações do Aluno</p>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-4 text-white focus:border-primary outline-none transition-all text-xs font-bold"
                                                placeholder="seu@email.com"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CPF</label>
                                                <input
                                                    value={editCpf}
                                                    onChange={(e) => handleCpfChange(e.target.value)}
                                                    className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-4 text-white focus:border-primary outline-none transition-all text-xs font-bold"
                                                    placeholder="000.000.000-00"
                                                    maxLength={14}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Nasc.</label>
                                                <input
                                                    type="text"
                                                    value={editBirthDate}
                                                    onChange={(e) => handleBirthDateChangeMask(e.target.value)}
                                                    className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-4 text-white focus:border-primary outline-none transition-all text-xs font-bold"
                                                    placeholder="DD/MM/AAAA"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveStudentData}
                                            className="w-full h-10 border border-slate-700 hover:border-primary/50 text-slate-400 hover:text-primary transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">save</span>
                                            Salvar Apenas Dados do Aluno
                                        </button>

                                        <label className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl cursor-pointer group hover:bg-emerald-500/20 transition-all mt-4">
                                            <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isConverted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 bg-slate-900'}`}>
                                                {isConverted && <span className="material-symbols-outlined text-[16px] font-black">check</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isConverted}
                                                onChange={(e) => setIsConverted(e.target.checked)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Converter em Aluno</span>
                                                <span className="text-[8px] text-slate-500 font-bold">Marque se o aluno fechou o plano</span>
                                            </div>
                                        </label>
                                    </div>

                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest ml-1 mt-6">Agendamento</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data da Aula</label>
                                            <input
                                                type="date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="w-full h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 text-white focus:border-primary outline-none transition-all font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário</label>
                                            <input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="w-full h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 text-white focus:border-primary outline-none transition-all font-bold text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Professor Responsável</label>
                                        <select
                                            value={selectedTeacherId}
                                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                                            className="w-full h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 text-white focus:border-primary outline-none transition-all font-bold text-sm appearance-none"
                                        >
                                            <option value="">Selecionar Professor...</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quadra</label>
                                        <select
                                            value={selectedCourtId}
                                            onChange={(e) => setSelectedCourtId(e.target.value)}
                                            className="w-full h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 text-white focus:border-primary outline-none transition-all font-bold text-sm appearance-none"
                                        >
                                            <option value="">Selecionar Quadra...</option>
                                            {courts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
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
                                            {modalStatus === "COMPLETED" ? "Finalizar e Salvar" : "Confirmar Agendamento"}
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Automation Confirmation Modal */}
                {
                    isAutoModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/70 animate-in fade-in duration-300">
                            <div className="bg-[#1c222c] border border-slate-800 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Disparar Automação</h3>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Etapa: <span className="text-primary">{autoModalStage}</span></p>
                                    </div>
                                    <button onClick={() => setIsAutoModalOpen(false)} className="size-10 rounded-full hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-all">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {/* Preview Student */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                            <label className="text-[10px] font-black uppercase tracking-widest">Preview Aluno</label>
                                        </div>
                                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap font-medium">
                                            {autoPreview.student || "Nenhuma mensagem configurada."}
                                        </div>
                                    </div>

                                    {/* Preview Teacher */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <span className="material-symbols-outlined text-sm">school</span>
                                            <label className="text-[10px] font-black uppercase tracking-widest">Preview Professor</label>
                                        </div>
                                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap font-medium">
                                            {autoPreview.teacher || "Nenhuma mensagem configurada."}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900/30 border-t border-slate-800">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-6">Escolha quem deve receber as mensagens agora:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <button
                                            onClick={() => { sendAutomatedMessages(autoModalTarget!, autoModalStage, autoModalTeacherId, autoModalCourtId, autoModalDate, "STUDENT"); setIsAutoModalOpen(false); }}
                                            className="h-14 bg-slate-800 hover:bg-primary/20 hover:text-primary text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-slate-700 hover:border-primary/30 flex flex-col items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xl">person</span>
                                            Apenas Aluno
                                        </button>
                                        <button
                                            onClick={() => { sendAutomatedMessages(autoModalTarget!, autoModalStage, autoModalTeacherId, autoModalCourtId, autoModalDate, "TEACHER"); setIsAutoModalOpen(false); }}
                                            className="h-14 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-slate-700 hover:border-emerald-500/30 flex flex-col items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xl">school</span>
                                            Apenas Professor
                                        </button>
                                        <button
                                            onClick={() => { sendAutomatedMessages(autoModalTarget!, autoModalStage, autoModalTeacherId, autoModalCourtId, autoModalDate, "BOTH"); setIsAutoModalOpen(false); }}
                                            className="h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-primary/20 flex flex-col items-center justify-center gap-1"
                                        >
                                            <div className="flex gap-1 items-center">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                                <span className="text-xs">+</span>
                                                <span className="material-symbols-outlined text-sm">school</span>
                                            </div>
                                            Ambos
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsAutoModalOpen(false)}
                                        className="w-full mt-4 h-10 text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Pular e não enviar nada
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}

function CalendarView({ data, onOpenReg }: { data: TrialClass[], onOpenReg: (reg: TrialClass) => void }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    // Padding for first day
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="p-4 md:p-8 h-full flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter capitalize">{monthName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cronograma de Aulas</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">
                        Hoje
                    </button>
                    <button onClick={nextMonth} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-[#11161d]/50 rounded-[40px] border border-slate-800/50 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-800/50">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                    {days.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-slate-800/10 bg-slate-900/10"></div>;

                        const dateStr = date.toISOString().split('T')[0];
                        const dayData = data.filter(d => d.scheduledDate && d.scheduledDate.startsWith(dateStr))
                            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <div key={dateStr} className={`min-h-[140px] p-2 border-b border-r border-slate-800/30 flex flex-col gap-2 transition-all hover:bg-slate-800/20 ${isToday ? 'bg-primary/5' : ''}`}>
                                <div className="flex justify-between items-center px-1">
                                    <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-slate-600'}`}>
                                        {date.getDate()}
                                    </span>
                                    {dayData.length > 0 && (
                                        <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-black">
                                            {dayData.length}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                    {dayData.map(reg => (
                                        <div
                                            key={reg.id}
                                            onClick={() => onOpenReg(reg)}
                                            className="p-1.5 rounded-lg bg-[#1c222c] border border-slate-800 text-[9px] cursor-pointer hover:border-primary transition-all group overflow-hidden"
                                        >
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-black text-white italic truncate pr-1">{reg.name.split(' ')[0]}</span>
                                                <span className="text-primary font-bold shrink-0">{new Date(reg.scheduledDate!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex gap-1 items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                {reg.court && (
                                                    <div className="size-1.5 rounded-full" style={{ backgroundColor: reg.court.color }}></div>
                                                )}
                                                <span className="text-slate-500 text-[8px] truncate">{reg.teacher?.name.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
            className={`bg-[#1c222c] border border-slate-800/80 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all group border-l-4 cursor-grab active:cursor-grabbing active:scale-95 active:rotate-1 ${reg.status === 'CONVERTED' ? 'border-l-pink-400' :
                reg.status === 'COMPLETED' ? 'border-l-emerald-400' :
                    reg.status === 'CONFIRMED' ? 'border-l-primary' :
                        reg.status === 'CANCELLED' ? 'border-l-red-400' :
                            'border-l-amber-400/50'
                }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-black text-white italic text-sm">{reg.name}</h4>
                    <div className="flex flex-col">
                        <p className="text-[10px] text-slate-500 font-bold">{reg.phone}</p>
                        {(reg.email || reg.cpf || reg.birthDate) && (
                            <div className="flex gap-2 mt-0.5">
                                {reg.email && <span className="material-symbols-outlined text-[12px] text-slate-600" title={reg.email}>mail</span>}
                                {reg.cpf && <span className="material-symbols-outlined text-[12px] text-slate-600" title={reg.cpf}>badge</span>}
                                {reg.birthDate && <span className="material-symbols-outlined text-[12px] text-slate-600 font-black" title={reg.birthDate}>cake</span>}
                            </div>
                        )}
                    </div>
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
                {(reg.teacher || reg.court) && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800 mt-1">
                        {reg.teacher && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold italic">
                                <span className="material-symbols-outlined text-[12px]">school</span>
                                {reg.teacher.name}
                            </div>
                        )}
                        {reg.court && (
                            <div className="flex items-center gap-1 text-[9px] font-black" style={{ color: reg.court.color }}>
                                <span className="material-symbols-outlined text-[12px]">sports_tennis</span>
                                {reg.court.name}
                            </div>
                        )}
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
