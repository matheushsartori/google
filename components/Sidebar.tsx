"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";

export function Sidebar() {
    const pathname = usePathname();
    const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

    const isActive = (path: string) => {
        if (path === "/" && pathname !== "/") return "hover:bg-slate-800 text-slate-400 hover:text-white";
        return pathname?.startsWith(path)
            ? "bg-primary/10 text-primary border border-primary/20"
            : "hover:bg-slate-800 text-slate-400 hover:text-white";
    };

    const toggleSubmenu = (id: string) => {
        setOpenSubmenus(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const NavLink = ({ href, icon, label, badge, status }: any) => (
        <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group mb-0.5 ${isActive(href)}`}>
            <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:opacity-100">{icon}</span>
            <p className="text-[13px] font-semibold flex-1">{label}</p>
            {badge && (
                <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black tracking-tighter">{badge}</span>
            )}
            {status && (
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
            )}
        </Link>
    );

    const SubmenuHeader = ({ id, icon, label }: any) => {
        const isOpen = openSubmenus.includes(id);
        return (
            <div
                onClick={() => toggleSubmenu(id)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white cursor-pointer transition-all mb-0.5 group"
            >
                <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:opacity-100">{icon}</span>
                <p className="text-[13px] font-black uppercase tracking-widest flex-1">{label}</p>
                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
        );
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-[#0f1218] border-r border-[#d4af37]/10 flex flex-col justify-between p-4 h-screen z-50 overflow-hidden">
            <div className="flex flex-col gap-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 py-4">
                    <img
                        src="https://mercestenis.com.br/wp-content/uploads/2026/01/LOGO-MERCES-01.webp"
                        alt="Mercês Tênis Logo"
                        className="h-10 w-auto object-contain drop-shadow-md"
                    />
                    <div className="flex flex-col">
                        <h1 className="text-white text-sm font-bold leading-none uppercase tracking-wider">Mercês Tênis</h1>
                        <p className="text-slate-500 text-[9px] font-medium leading-normal mt-0.5">Painel de Controle</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 ml-3">Principal</p>
                    <NavLink href="/" icon="dashboard" label="Dashboard" />
                    <NavLink href="/chat" icon="chat" label="Monitoramento" />
                    <NavLink href="/fluxo" icon="account_tree" label="Fluxo de Conversa" />

                    <div className="my-3 h-px bg-slate-800/50 mx-2"></div>

                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 ml-3">Comercial</p>
                    <NavLink href="/leads" icon="person_search" label="Gestão de Leads" />
                    <NavLink href="/aulas-experimentais" icon="history_edu" label="CRM Aulas Exp." />

                    <div className="my-3 h-px bg-slate-800/50 mx-2"></div>

                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 ml-3">Inteligência</p>
                    <NavLink href="/ia-config" icon="psychology" label="Configuração IA" />
                    <NavLink href="/ia-test" icon="biotech" label="Laboratório" badge="TESTE" />

                    <div className="my-3 h-px bg-slate-800/50 mx-2"></div>

                    <SubmenuHeader id="management" icon="manufacturing" label="Gerenciamento" />
                    {openSubmenus.includes("management") && (
                        <div className="pl-4 flex flex-col gap-0.5 animate-in slide-in-from-top-2 duration-300">
                            <NavLink href="/professores" icon="school" label="Professores" />
                            <NavLink href="/quadras" icon="sports_tennis" label="Quadras" />
                            <NavLink href="/automacoes" icon="bolt" label="Automações" />
                            <NavLink href="/instances" icon="terminal" label="Instâncias" status="online" />
                        </div>
                    )}

                    <div className="my-3 h-px bg-slate-800/50 mx-2"></div>

                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 ml-3">Sistema</p>
                    <NavLink href="/logs" icon="description" label="Logs de Atividade" />
                    <NavLink href="/settings" icon="settings" label="Configurações" />
                </nav>
            </div>

            {/* Footer / Status */}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/50 mt-4">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl h-10 bg-red-500/5 hover:bg-red-500/20 text-red-500 text-[12px] font-black uppercase tracking-widest transition-all border border-red-500/10"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sair
                </button>
            </div>
        </aside>
    );
}
