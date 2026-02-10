"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

interface Court {
    id: string;
    name: string;
    color: string;
    createdAt: string;
}

const COLORS = [
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#22c55e" },
    { name: "Laranja", value: "#f97316" },
    { name: "Vermelho", value: "#ef4444" },
    { name: "Roxo", value: "#a855f7" },
    { name: "Dourado", value: "#d4af37" },
];

export default function CourtsPage() {
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3b82f6");

    const fetchCourts = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/courts");
            setCourts(res.data);
        } catch (error) {
            toast.error("Erro ao carregar quadras");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    const handleOpenModal = (court?: Court) => {
        if (court) {
            setEditingCourt(court);
            setName(court.name);
            setColor(court.color);
        } else {
            setEditingCourt(null);
            setName("");
            setColor("#3b82f6");
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !color) {
            toast.error("Nome e cor são obrigatórios");
            return;
        }

        try {
            if (editingCourt) {
                await axios.put(`/api/courts/${editingCourt.id}`, { name, color });
                toast.success("Quadra atualizada com sucesso!");
            } else {
                await axios.post("/api/courts", { name, color });
                toast.success("Quadra cadastrada com sucesso!");
            }
            setIsModalOpen(false);
            fetchCourts();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao salvar quadra");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta quadra?")) return;

        try {
            await axios.delete(`/api/courts/${id}`);
            toast.success("Quadra excluída com sucesso!");
            fetchCourts();
        } catch (error) {
            toast.error("Erro ao excluir quadra");
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c10] text-slate-200">
            <Toaster position="top-right" />
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Gestão de Quadras" />

                <div className="px-8 py-4 bg-[#11161d] border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Organize seus espaços de aula</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-10 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Nova Quadra
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                            <div className="animate-spin size-8 border-3 border-primary border-t-transparent rounded-full mr-4"></div>
                            Buscando quadras...
                        </div>
                    ) : courts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                            <span className="material-symbols-outlined text-6xl opacity-20">
                                sports_tennis
                            </span>
                            <p>Nenhuma quadra cadastrada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {courts.map((court) => (
                                <div
                                    key={court.id}
                                    className="bg-[#1c222c] border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-primary/50 transition-all group"
                                    style={{ borderLeft: `6px solid ${court.color}` }}
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="size-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center" style={{ color: court.color }}>
                                            <span className="material-symbols-outlined text-2xl">
                                                stadium
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-white italic truncate text-lg uppercase tracking-tight">
                                                {court.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: court.color }}></div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    {COLORS.find(c => c.value === court.color)?.name || 'Cor Personalizada'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(court)}
                                            className="flex-1 h-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all border border-slate-700 gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            <span className="text-[10px] font-black uppercase">Editar</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(court.id)}
                                            className="size-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
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
                                    {editingCourt ? "Editar Quadra" : "Nova Quadra"}
                                </h3>
                                <p className="text-slate-400 text-sm font-medium">
                                    {editingCourt
                                        ? "Atualize os dados da quadra"
                                        : "Cadastre uma nova quadra no sistema"}
                                </p>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Nome da Quadra
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 text-white focus:border-primary outline-none transition-all font-bold"
                                        placeholder="Ex: Quadra 01 - Coberta"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Cor de Identificação
                                    </label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                className={`size-10 rounded-xl border-2 transition-all ${color === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
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
                                        {editingCourt ? "Atualizar" : "Cadastrar"}
                                        <span className="material-symbols-outlined">
                                            {editingCourt ? "save" : "add_box"}
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
