"use client";

import { useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

const LEVELS = [
    { id: "INICIANTE", label: "Iniciante", icon: "potted_plant", color: "text-emerald-400", desc: "Nunca joguei ou estou tendo os primeiros contatos com a raquete." },
    { id: "INTERMEDIARIO", label: "Intermediário", icon: "local_fire_department", color: "text-orange-400", desc: "Já consigo trocar bolas e conheço as regras básicas do jogo." },
    { id: "AVANCADO", label: "Avançado", icon: "military_tech", color: "text-blue-400", desc: "Já jogo torneios e busco aperfeiçoamento técnico e tático." }
];

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const PERIODS = ["Manhã", "Tarde", "Noite"];

export default function PublicTrialClassPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [level, setLevel] = useState("");
    const [sport] = useState("Tênis");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [period, setPeriod] = useState("");
    const [observations, setObservations] = useState("");

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const numbers = input.replace(/\D/g, "");

        let masked = "";
        if (numbers.length > 0) {
            masked = "(" + numbers.substring(0, 2);
            if (numbers.length > 2) {
                masked += ") " + numbers.substring(2, 7);
                if (numbers.length > 7) {
                    masked += "-" + numbers.substring(7, 11);
                }
            }
        }
        setPhone(masked);
    };

    const handleSubmit = async () => {
        if (!name || !phone || !level || selectedDays.length === 0 || !period) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            await axios.post("/api/marcar-aula", {
                name,
                phone,
                email,
                cpf,
                birthDate,
                sport,
                level,
                availability: { days: selectedDays, period },
                observations
            });
            setSuccess(true);
        } catch (error) {
            toast.error("Ocorreu um erro ao enviar sua solicitação.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0f1218] flex items-center justify-center p-6 text-slate-200">
                <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-[40px] p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="size-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-5xl text-emerald-500 animate-bounce">verified</span>
                    </div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Solicitação Enviada!</h2>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        Sua aula experimental de <span className="text-primary font-bold">{sport}</span> foi solicitada. Um de nossos professores entrará em contato via WhatsApp para confirmar o horário.
                    </p>
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-3xl">
                        <p className="text-xs text-primary font-bold mb-1">⚠️ IMPORTANTE</p>
                        <p className="text-[11px] text-slate-300">Envie o comprovante de pagamento via PIX para o nosso WhatsApp para agilizar seu agendamento.</p>
                    </div>
                    <div className="pt-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Valor da Aula</p>
                        <p className="text-4xl font-black text-primary">R$ 80</p>
                    </div>
                    <button
                        onClick={() => window.location.href = "https://wa.me/41987518619"}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2"
                    >
                        Falar com Consultor
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1218] flex items-center justify-center p-4 md:p-10 text-slate-200 relative overflow-hidden">
            <Toaster position="top-right" />

            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-2xl w-full bg-[#161b22]/80 backdrop-blur-xl border border-slate-800/50 rounded-[48px] overflow-hidden shadow-2xl relative z-10">
                {/* Header Image/Branding */}
                <div className="h-56 bg-gradient-to-br from-primary to-primary-dark relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="relative z-10 text-center px-6 flex flex-col items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-2xl">
                            <img
                                src="https://mercestenis.com.br/wp-content/uploads/2026/01/LOGO-MERCES-01.webp"
                                alt="Mercês Tênis Logo"
                                className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Aula Experimental</h1>
                    </div>
                    {/* Floating ball */}
                    <div className="absolute -right-8 -bottom-8 size-40 bg-primary/30 blur-3xl rounded-full"></div>
                </div>

                <div className="p-8 md:p-12 space-y-10">
                    {/* Stepper */}
                    <div className="flex justify-between relative px-4">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700 -translate-y-1/2"></div>
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`size-10 rounded-full flex items-center justify-center text-sm font-bold relative z-10 transition-all duration-500 ${step >= s ? 'bg-primary text-white border-4 border-[#1c232d] scale-110 shadow-lg shadow-primary/30' : 'bg-slate-800 text-slate-500 border-4 border-[#1c232d]'}`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2 text-center mb-8">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Quem é o futuro atleta?</h2>
                                <p className="text-slate-400 font-medium">Insira seus dados para que possamos te identificar no sistema.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-14 bg-slate-800/50 border-2 border-slate-700 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                    <input
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        className="w-full h-14 bg-slate-800/50 border-2 border-slate-700 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                                        placeholder="(41) 99999-9999"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-14 bg-slate-800/50 border-2 border-slate-700 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                                        <input
                                            value={cpf}
                                            onChange={(e) => setCpf(e.target.value)}
                                            className="w-full h-14 bg-slate-800/50 border-2 border-slate-700 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nasc.</label>
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className="w-full h-14 bg-slate-800/50 border-2 border-slate-700 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => name && phone ? setStep(2) : toast.error("Preencha seu nome e telefone.")}
                                className="w-full bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20"
                            >
                                Próximo Passo
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Qual seu nível de Tênis?</h2>
                                <p className="text-slate-400 font-medium">Isso nos ajuda a selecionar o melhor professor para você.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {LEVELS.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => setLevel(l.id)}
                                        className={`flex items-center gap-5 p-6 rounded-3xl border transition-all text-left group ${level === l.id ? 'bg-primary/20 border-primary shadow-2xl shadow-primary/10' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'}`}
                                    >
                                        <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${level === l.id ? 'bg-primary text-white shadow-lg' : 'bg-slate-700 text-slate-400 group-hover:scale-110'}`}>
                                            <span className={`material-symbols-outlined text-3xl ${level === l.id ? 'text-white' : l.color}`}>{l.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className={`font-black uppercase italic tracking-tight ${level === l.id ? 'text-white' : 'text-slate-200'}`}>{l.label}</h4>
                                            <p className="text-xs text-slate-400 font-medium leading-tight">{l.desc}</p>
                                        </div>
                                        {level === l.id && <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => setStep(1)} className="w-full sm:flex-1 h-16 rounded-2xl border-2 border-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">Voltar</button>
                                <button
                                    onClick={() => level ? setStep(3) : toast.error("Selecione seu nível.")}
                                    className="w-full sm:flex-[2] bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/40 active:scale-95"
                                >
                                    Falta pouco!
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Disponibilidade</h2>
                                <p className="text-slate-400 font-medium">Selecione os dias e o melhor período para você.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block text-center md:text-left">Dias Preferenciais</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {DAYS.map(day => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`py-3 rounded-xl border-2 font-black uppercase tracking-widest transition-all ${selectedDays.includes(day) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                                                style={{ fontSize: '10px' }}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block text-center md:text-left">Melhor Período</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {PERIODS.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPeriod(p)}
                                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${period === p ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                                            >
                                                <span className={`material-symbols-outlined ${period === p ? 'text-white' : p === 'Manhã' ? 'text-yellow-400' : p === 'Tarde' ? 'text-orange-400' : 'text-blue-300'}`}>{p === 'Manhã' ? 'light_mode' : p === 'Tarde' ? 'wb_sunny' : 'dark_mode'}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações (Opcional)</label>
                                    <textarea
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        className="w-full h-24 bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none placeholder:text-slate-600"
                                        placeholder="Ex: Já tive contato com outros esportes de raquete..."
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => setStep(2)} className="w-full sm:flex-1 h-16 rounded-2xl border-2 border-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">Voltar</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full sm:flex-[2] bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-primary/40 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? (
                                        <div className="animate-spin size-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                    ) : (
                                        <>
                                            <span>SOLICITAR AGENDAMENTO</span>
                                            <span className="material-symbols-outlined">rocket_launch</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-8 bg-slate-900/30 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Valor da Aula</p>
                            <p className="text-xl font-black text-white italic tracking-tighter">R$ 80,00</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium text-center md:text-right max-w-[240px]">
                        Ao prosseguir, você concorda com nossas políticas de agendamento e cancelamento.
                    </p>
                </div>
            </div>

            {/* Background branding text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-white/[0.015] pointer-events-none select-none italic tracking-tighter leading-none whitespace-nowrap z-0">
                MERCESTENIS
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
                
                body {
                    font-family: 'Outfit', sans-serif;
                }
            `}</style>
        </div>
    );
}
