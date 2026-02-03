"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/lib/actions";

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Tennis Court Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d2e] via-[#0f1218] to-[#1a4d2e]"></div>

            {/* Court Lines Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 border-2 border-white rounded-full"></div>
            </div>

            {/* Floating Tennis Balls */}
            <div className="absolute top-20 left-20 size-16 bg-[#d4af37]/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="absolute bottom-32 right-32 size-24 bg-[#d4af37]/10 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/3 right-20 size-20 bg-primary/10 blur-2xl rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src="https://mercestenis.com.br/wp-content/uploads/2026/01/LOGO-MERCES-01.webp"
                        alt="Mercês Tênis Logo"
                        className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Login Card */}
                <div className="bg-[#0f1218]/80 backdrop-blur-md border border-[#d4af37]/10 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-8 pb-2 text-center border-b border-transparent">
                        <h1 className="text-3xl font-black text-white mb-2 italic">Painel Administrativo</h1>
                        <p className="text-slate-400 text-sm font-medium">Sistema de Gestão Mercês Tênis</p>
                    </div>

                    {/* Form */}
                    <form action={dispatch} className="p-8 space-y-6">
                        <div className="space-y-4">
                            {errorMessage && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm backdrop-blur-sm">
                                    <AlertCircle size={20} />
                                    <span className="font-medium">{errorMessage}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                    Email de Acesso
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="admin@mercestenis.com.br"
                                        className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4af37] focus:bg-slate-900/70 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">lock</span>
                                    Senha
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" size={20} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4af37] focus:bg-slate-900/70 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-2 border-slate-700 bg-slate-900 text-[#d4af37] focus:ring-offset-0 focus:ring-2 focus:ring-[#d4af37]/50 cursor-pointer"
                                />
                                <span className="text-slate-400 group-hover:text-slate-300 transition-colors font-medium">Lembrar de mim</span>
                            </label>
                            <a href="#" className="text-[#d4af37] hover:text-[#f0c75e] font-bold transition-colors text-xs uppercase tracking-wider">
                                Esqueceu?
                            </a>
                        </div>

                        <LoginButton />
                    </form>

                    {/* Footer */}
                    <div className="p-6 bg-gradient-to-br from-[#1a4d2e]/10 to-transparent border-t border-slate-800/50 text-center">
                        <p className="text-slate-500 text-xs font-medium">
                            Precisa de ajuda? <a href="https://wa.me/5541987518619" target="_blank" className="text-[#d4af37] font-bold hover:underline">Fale no WhatsApp</a>
                        </p>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-6 text-center">
                    <p className="text-slate-600 text-xs font-medium">
                        Powered by <span className="text-[#d4af37] font-black">Mercês Tênis CRM</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#f0c75e] hover:from-[#f0c75e] hover:to-[#d4af37] text-[#0f1218] font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/20 hover:shadow-xl hover:shadow-[#d4af37]/30 hover:scale-[1.02] uppercase tracking-widest text-sm"
        >
            {pending ? (
                <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Autenticando...</span>
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined">sports_tennis</span>
                    <span>Acessar Sistema</span>
                    <ArrowRight size={20} />
                </>
            )}
        </button>
    );
}
