import React from "react";

interface HeaderProps {
    title: string;
    children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
    return (
        <header className="flex items-center justify-between border-b border-slate-800 bg-background-dark px-8 py-4 sticky top-0 z-10 h-[80px]">
            <div className="flex items-center gap-4">
                <h2 className="text-white text-xl font-bold tracking-tight">{title}</h2>
            </div>

            <div className="flex flex-1 justify-end items-center gap-6">
                {children}

                {/* Vertical Divider */}
                <div className="h-10 w-px bg-slate-800 mx-2"></div>

                {/* Admin Profile */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-white leading-none">Administrador</span>
                        <span className="text-[10px] text-slate-500 leading-normal">Evolution Admin</span>
                    </div>
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-slate-700 bg-slate-700"></div>
                </div>
            </div>
        </header>
    );
}
