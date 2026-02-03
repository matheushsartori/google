"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/lib/actions";

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
            <div className="w-full max-w-md bg-background-card border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">

                {/* Header / Logo */}
                <div className="p-8 pb-0 text-center">
                    <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-4">
                        <span className="font-bold text-primary text-2xl">M</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
                    <p className="text-slate-400 text-sm">Acesse o painel do Merces Bot</p>
                </div>

                {/* Form */}
                <form action={dispatch} className="p-8 space-y-6">
                    <div className="space-y-4">
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle size={18} />
                                {errorMessage}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="admin@mercestenis.com.br"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-offset-background-dark" />
                            <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Lembrar de mim</span>
                        </label>
                        <a href="#" className="text-primary hover:text-blue-400 font-medium transition-colors">Esqueceu a senha?</a>
                    </div>

                    <LoginButton />
                </form>

                {/* Footer */}
                <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 text-center">
                    <p className="text-slate-500 text-xs">
                        Não tem uma conta? <a href="#" className="text-white font-bold hover:underline">Fale com o suporte</a>
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
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? (
                <span>Entrando...</span>
            ) : (
                <>
                    <span>Acessar Painel</span>
                    <ArrowRight size={18} />
                </>
            )}
        </button>
    );
}
