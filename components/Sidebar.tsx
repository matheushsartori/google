"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";

export function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/" && pathname !== "/") return "hover:bg-slate-800 text-slate-400 hover:text-white";
        return pathname?.startsWith(path)
            ? "bg-primary/10 text-primary border border-primary/20"
            : "hover:bg-slate-800 text-slate-400 hover:text-white";
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-sidebar-dark border-r border-slate-800 flex flex-col justify-between p-4 h-screen">
            <div className="flex flex-col gap-8">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-primary rounded-lg p-2 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">sports_tennis</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold leading-none uppercase tracking-wider">Mercês Tênis</h1>
                        <p className="text-slate-500 text-[10px] font-medium leading-normal">EVOLUTION API PANEL</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1">
                    <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/")}`}>
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        <p className="text-sm font-semibold">Início</p>
                    </Link>

                    <Link href="/fluxo" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/fluxo")}`}>
                        <span className="material-symbols-outlined text-[20px]">account_tree</span>
                        <p className="text-sm font-semibold">Fluxo</p>
                    </Link>

                    <Link href="/aulas-experimentais" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/aulas-experimentais")}`}>
                        <span className="material-symbols-outlined text-[20px]">history_edu</span>
                        <p className="text-sm font-semibold">Aulas Exp.</p>
                    </Link>

                    <Link href="/instances" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/instances")}`}>
                        <span className="material-symbols-outlined text-[20px]">terminal</span>
                        <p className="text-sm font-semibold">Instâncias</p>
                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    </Link>

                    <Link href="/leads" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/leads")}`}>
                        <span className="material-symbols-outlined text-[20px]">person_search</span>
                        <p className="text-sm font-semibold">Leads</p>
                    </Link>

                    <Link href="/chat" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/chat")}`}>
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                        <p className="text-sm font-semibold">Monitoramento</p>
                    </Link>

                    <Link href="/ia-config" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/ia-config")}`}>
                        <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                        <p className="text-sm font-semibold">IA</p>
                    </Link>

                    <Link href="/ia-test" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/ia-test")}`}>
                        <span className="material-symbols-outlined text-[20px]">biotech</span>
                        <p className="text-sm font-semibold">Laboratório</p>
                        <div className="ml-auto flex items-center">
                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black">TESTE</span>
                        </div>
                    </Link>

                    {/* Temporarily disabled - Prisma client issue
                    <Link href="/logs" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/logs")}`}>
                        <span className="material-symbols-outlined text-[20px]">description</span>
                        <p className="text-sm font-semibold">Logs</p>
                    </Link>
                    */}

                    <Link href="/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${isActive("/settings")}`}>
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                        <p className="text-sm font-semibold">Configurações</p>
                    </Link>
                </nav>
            </div>

            {/* Footer / Status */}
            <div className="flex flex-col gap-4">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-2">API Status</p>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white">Evolution API</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Online</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[94%]"></div>
                    </div>
                </div>

                <button className="flex w-full items-center justify-center gap-2 rounded-lg h-11 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">sync</span>
                    <span className="truncate">Sync API</span>
                </button>

                <button
                    onClick={() => logout()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg h-11 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-sm font-bold transition-all border border-red-500/20"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span className="truncate">Sair da Conta</span>
                </button>
            </div>
        </aside>
    );
}
