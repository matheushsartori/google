"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

interface Teacher {
    id: string;
    name: string;
    email?: string;
    phone: string;
    active: boolean;
    createdAt: string;
}

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [active, setActive] = useState(true);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/teachers");
            setTeachers(res.data);
        } catch (error) {
            toast.error("Erro ao carregar professores");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleOpenModal = (teacher?: Teacher) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setName(teacher.name);
            setEmail(teacher.email || "");
            setPhone(teacher.phone);
            setActive(teacher.active);
        } else {
            setEditingTeacher(null);
            setName("");
            setEmail("");
            setPhone("");
            setActive(true);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) {
            toast.error("Nome e telefone são obrigatórios");
            return;
        }

        try {
            if (editingTeacher) {
                await axios.put(`/api/teachers/${editingTeacher.id}`, { name, phone, email, active });
                toast.success("Professor atualizado com sucesso!");
            } else {
                await axios.post("/api/teachers", { name, phone, email, active });
                toast.success("Professor cadastrado com sucesso!");
            }
            setIsModalOpen(false);
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao salvar professor");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este professor?")) return;

        try {
            await axios.delete(`/api/teachers/${id}`);
            toast.success("Professor excluído com sucesso!");
            fetchTeachers();
        } catch (error) {
            toast.error("Erro ao excluir professor");
        }
    };

    const filteredTeachers = teachers.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.phone.includes(searchQuery)
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c10] text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Gestão de Professores" />

                <div className="px-8 py-4 bg-[#11161d] border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                            search
                        </span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Buscar por nome ou telefone..."
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-10 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Novo Professor
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                            <div className="animate-spin size-8 border-3 border-primary border-t-transparent rounded-full mr-4"></div>
                            Buscando professores...
                        </div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                            <span className="material-symbols-outlined text-6xl opacity-20">
                                school
                            </span>
                            <p>Nenhum professor cadastrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTeachers.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className="bg-[#1c222c] border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-primary/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="size-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">
                                                person
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-white italic truncate text-lg uppercase tracking-tight">
                                                    {teacher.name}
                                                </h3>
                                                <span className={`size-2 rounded-full ${teacher.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold truncate">
                                                {teacher.email || 'Sem email'}
                                            </p>
                                            <p className="text-xs text-slate-400 font-bold">
                                                {teacher.phone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                window.open(
                                                    `https://wa.me/${teacher.phone.replace(/\D/g, "")}`,
                                                    "_blank"
                                                )
                                            }
                                            className="flex-1 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all border border-emerald-500/20"
                                        >
                                            <img
                                                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                                                className="size-4 mr-2"
                                                alt="WA"
                                            />
                                            <span className="text-[10px] font-black uppercase">
                                                Chat
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(teacher)}
                                            className="size-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all border border-slate-700"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                edit
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(teacher.id)}
                                            className="size-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                delete
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
                        <div className="bg-[#161b22] border border-slate-800 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-800 bg-[#1c222c]">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {editingTeacher ? "Editar Professor" : "Novo Professor"}
                                </h3>
                                <p className="text-slate-400 text-sm font-medium">
                                    {editingTeacher
                                        ? "Atualize os dados do professor"
                                        : "Cadastre um novo professor no sistema"}
                                </p>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 text-white focus:border-primary outline-none transition-all font-bold"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        E-mail
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 text-white focus:border-primary outline-none transition-all font-bold"
                                        placeholder="Ex: joao@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Telefone (WhatsApp)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 text-white focus:border-primary outline-none transition-all font-bold"
                                        placeholder="Ex: 5511999999999"
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 p-4 bg-slate-900/50 border-2 border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-all">
                                        <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${active ? 'bg-primary border-primary text-white' : 'border-slate-700 bg-slate-900'}`}>
                                            {active && <span className="material-symbols-outlined text-[16px] font-black">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={active}
                                            onChange={(e) => setActive(e.target.checked)}
                                        />
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Professor Ativo</span>
                                            <span className="text-[8px] text-slate-500 font-bold">Determina se aparece para novos agendamentos</span>
                                        </div>
                                    </label>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 rounded-2xl border-2 border-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {editingTeacher ? "Atualizar" : "Cadastrar"}
                                        <span className="material-symbols-outlined">
                                            {editingTeacher ? "save" : "person_add"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
