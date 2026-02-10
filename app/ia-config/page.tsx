"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AiConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // State
    // ...
    // ...
    const verifyToken = async () => {
        if (!token) {
            alert("Por favor, insira um token primeiro.");
            return;
        }

        setVerifying(true);
        try {
            const res = await axios.post("/api/verify-token", { provider, token });
            if (res.data.success) {
                alert("✅ " + res.data.message);
            } else {
                alert("❌ " + res.data.message);
            }
        } catch (error) {
            console.error("Verification failed", error);
            alert("Erro ao conectar com o servidor de verificação.");
        } finally {
            setVerifying(false);
        }
    };
    const [provider, setProvider] = useState("openai");
    const [token, setToken] = useState("");
    const [personality, setPersonality] = useState("");
    const [letzyLink, setLetzyLink] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [aiEnabled, setAiEnabled] = useState(true);

    // Objective State
    const [experimentalClassActive, setExperimentalClassActive] = useState(true);
    const [experimentalClassData, setExperimentalClassData] = useState({
        name: true,
        phone: true,
        level: true,
        availability: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get("/api/settings");
                const data = res.data;

                if (data.AI_PROVIDER) setProvider(data.AI_PROVIDER);
                if (data.AI_TOKEN) setToken(data.AI_TOKEN);
                if (data.AI_PROMPT) setPersonality(data.AI_PROMPT);
                if (data.LINKS_LETZPLAY) setLetzyLink(data.LINKS_LETZPLAY);
                if (data.LINKS_PIX) setPixKey(data.LINKS_PIX);
                if (data.AI_ENABLED) setAiEnabled(data.AI_ENABLED === "true");

                if (data.OBJ_EXP_ACTIVE) setExperimentalClassActive(data.OBJ_EXP_ACTIVE === "true");
                if (data.OBJ_EXP_DATA) {
                    try {
                        setExperimentalClassData(JSON.parse(data.OBJ_EXP_DATA));
                    } catch (e) { console.error("Error parsing objective data JSON", e); }
                }

            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        try {
            await axios.post("/api/settings", {
                AI_PROVIDER: provider,
                AI_TOKEN: token,
                AI_PROMPT: personality,
                LINKS_LETZPLAY: letzyLink,
                LINKS_PIX: pixKey,
                AI_ENABLED: String(aiEnabled),
                OBJ_EXP_ACTIVE: String(experimentalClassActive),
                OBJ_EXP_DATA: JSON.stringify(experimentalClassData)
            });
            alert("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    const toggleDataPoint = (key: keyof typeof experimentalClassData) => {
        setExperimentalClassData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header title="Configuração do Agente">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end pr-4 border-r border-slate-800">
                            <span className="text-xs font-bold text-white">Status do Motor</span>
                            <span className="text-[10px] text-emerald-500">
                                {token ? "Conectado" : "Aguardando Token"}
                            </span>
                        </div>
                    </div>
                </Header>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">Carregando configurações...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
                            <div className="col-span-12">
                                <div className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${aiEnabled ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-xl flex items-center justify-center transition-colors ${aiEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                            <span className="material-symbols-outlined text-2xl">{aiEnabled ? 'psychology' : 'psychology_alt'}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-tight text-lg">Inteligência Artificial</h3>
                                            <p className="text-slate-500 text-xs font-medium">
                                                {aiEnabled
                                                    ? "A IA está ATIVA e respondendo aos leads usando os parâmetros abaixo."
                                                    : "A IA está DESATIVADA. O sistema utilizará o fluxo automático pré-configurado."}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-125 mr-4">
                                        <input
                                            type="checkbox"
                                            checked={aiEnabled}
                                            onChange={(e) => setAiEnabled(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Left Column: Config */}
                            <div className="col-span-12 lg:col-span-7 space-y-6">
                                {/* AI Credentials Details */}
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 space-y-4">
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">key</span>
                                        Credenciais da IA
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Provedor</label>
                                            <select
                                                value={provider}
                                                onChange={(e) => setProvider(e.target.value)}
                                                className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:ring-primary outline-none"
                                            >
                                                <option value="openai">OpenAI (GPT-4o / GPT-3.5)</option>
                                                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Token</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">lock</span>
                                                    <input
                                                        value={token}
                                                        onChange={(e) => setToken(e.target.value)}
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 text-sm text-white focus:ring-primary outline-none"
                                                        type="password"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <button
                                                    onClick={verifyToken}
                                                    disabled={verifying}
                                                    className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-600/30 rounded-lg text-xs font-bold transition-all whitespace-nowrap disabled:opacity-50"
                                                >
                                                    {verifying ? "Verificando..." : "Verificar"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 mb-2">
                                    <h3 className="text-white text-2xl font-black">Prompt e Contexto</h3>
                                    <p className="text-slate-400 text-sm">Defina como a IA deve se comportar com seus clientes.</p>
                                </div>

                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personalidade & Instruções</label>
                                        <textarea
                                            value={personality}
                                            onChange={(e) => setPersonality(e.target.value)}
                                            className="w-full bg-slate-900/50 border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-primary focus:border-primary min-h-[250px] resize-none p-4 leading-relaxed outline-none border"
                                            placeholder="Ex: Você é o atendente virtual do Mercês Tênis. Seja cordial e ajude com agendamentos..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Link LetzPlay</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">link</span>
                                                <input
                                                    value={letzyLink}
                                                    onChange={(e) => setLetzyLink(e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 text-sm text-white focus:ring-primary outline-none"
                                                    type="text"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chave PIX</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">payments</span>
                                                <input
                                                    value={pixKey}
                                                    onChange={(e) => setPixKey(e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 text-sm text-white focus:ring-primary outline-none"
                                                    type="text"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Intent & Data Collection Section (Restored) */}
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-white font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">model_training</span>
                                            Treinamento de Objetivos
                                        </h4>
                                    </div>
                                    <p className="text-slate-400 text-xs">
                                        Defina quais dados a IA deve obrigatoriamente coletar quando identificar um objetivo específico.
                                    </p>

                                    {/* Objective Card: Aula Experimental */}
                                    <div className={`bg-slate-900/50 border border-slate-700 rounded-lg p-4 ${!experimentalClassActive ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-white uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded border border-primary/20 text-primary">Aula Experimental</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={experimentalClassActive}
                                                    onChange={(e) => setExperimentalClassActive(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Dados Obrigatórios para Coleta</label>
                                                <p className="text-[10px] text-slate-500 mb-2">A IA não finalizará o atendimento até ter esses dados.</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                                                        <input type="checkbox" checked={experimentalClassData.name} onChange={() => toggleDataPoint('name')} className="accent-primary" /> Nome Completo
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                                                        <input type="checkbox" checked={experimentalClassData.phone} onChange={() => toggleDataPoint('phone')} className="accent-primary" /> Telefone (WhatsApp)
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                                                        <input type="checkbox" checked={experimentalClassData.level} onChange={() => toggleDataPoint('level')} className="accent-primary" /> Nível de Experiência
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                                                        <input type="checkbox" checked={experimentalClassData.availability} onChange={() => toggleDataPoint('availability')} className="accent-primary" /> Disponibilidade de Horário
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objective Card: Locação de Quadra (Example) */}
                                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 opacity-75">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Locação de Quadra</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-slate-500">Ative para configurar a coleta de dados específica para locações.</p>
                                    </div>
                                </div>

                                <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-6">
                                    <h4 className="text-white font-bold mb-4">Configurações Avançadas</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-200 font-medium">Tempo de Resposta</span>
                                                <span className="text-[11px] text-slate-500">Delay simulado para parecer humano</span>
                                            </div>
                                            <select className="bg-slate-900 border border-slate-700 rounded-md text-xs text-white px-3 py-1.5 focus:ring-primary outline-none">
                                                <option>Imediato</option>
                                                <option selected>3-5 segundos</option>
                                                <option>10-15 segundos</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-200 font-medium">Auto-Atendimento</span>
                                                <span className="text-[11px] text-slate-500">Iniciar conversa automaticamente</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Preview */}
                            <div className="col-span-12 lg:col-span-5 flex flex-col h-full">
                                <div className="flex flex-col gap-1 mb-2">
                                    <h3 className="text-white text-2xl font-black">Visualização</h3>
                                    <p className="text-slate-400 text-sm">Preview em tempo real da IA no WhatsApp.</p>
                                </div>
                                {/* Phone Simulator */}
                                <div className="flex-1 min-h-[600px] rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col bg-wa-dark relative">
                                    {/* Header WA */}
                                    <div className="bg-wa-panel px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-500 flex items-center justify-center text-white">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-200">Cliente (Lead)</span>
                                                <span className="text-[10px] text-slate-400">online</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-slate-400">
                                            <span className="material-symbols-outlined text-xl">videocam</span>
                                            <span className="material-symbols-outlined text-xl">call</span>
                                            <span className="material-symbols-outlined text-xl">more_vert</span>
                                        </div>
                                    </div>

                                    {/* Chat Body */}
                                    <div className="flex-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat p-4 space-y-4 overflow-y-auto custom-scrollbar">
                                        {/* Message 1 */}
                                        <div className="flex justify-start">
                                            <div className="bg-wa-bubble-other p-2.5 rounded-lg rounded-tl-none max-w-[80%] shadow-sm relative">
                                                <p className="text-sm text-slate-200">Olá! Gostaria de saber se tem horário disponível para hoje às 19h.</p>
                                                <span className="text-[10px] text-slate-400 float-right mt-1 ml-4">14:30</span>
                                            </div>
                                        </div>

                                        {/* Message 2 */}
                                        <div className="flex justify-end">
                                            <div className="bg-wa-bubble p-2.5 rounded-lg rounded-tr-none max-w-[80%] shadow-sm relative">
                                                <p className="text-sm text-white">Olá! 🎾 Tudo bem? Vou verificar agora mesmo para você no nosso sistema!</p>
                                                <p className="text-sm text-white mt-2">Você pode conferir a disponibilidade em tempo real e já garantir sua reserva por este link: <span className="underline">{letzyLink || "..."}</span></p>
                                                <p className="text-sm text-white mt-2">Precisa de algo mais? 😉</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] text-emerald-200/70">14:31</span>
                                                    <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Message 3 */}
                                        <div className="flex justify-start">
                                            <div className="bg-wa-bubble-other p-2.5 rounded-lg rounded-tl-none max-w-[80%] shadow-sm relative">
                                                <p className="text-sm text-slate-200">Consigo pagar por PIX?</p>
                                                <span className="text-[10px] text-slate-400 float-right mt-1 ml-4">14:32</span>
                                            </div>
                                        </div>

                                        {/* Message 4 */}
                                        <div className="flex justify-end">
                                            <div className="bg-wa-bubble p-2.5 rounded-lg rounded-tr-none max-w-[80%] shadow-sm relative">
                                                <p className="text-sm text-white">Com certeza! 🎾 Para agilizar, você pode realizar o PIX para a nossa chave oficial:</p>
                                                <p className="text-sm text-white font-bold mt-1">{pixKey || "..."}</p>
                                                <p className="text-sm text-white mt-1">Após o pagamento, é só me enviar o comprovante por aqui mesmo. Até logo!</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] text-emerald-200/70">14:32</span>
                                                    <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer WA */}
                                    <div className="bg-wa-panel px-4 py-2 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">mood</span>
                                        <span className="material-symbols-outlined text-slate-400">attach_file</span>
                                        <div className="flex-1 bg-slate-700/50 rounded-lg px-4 py-2 text-slate-400 text-sm">
                                            Digite uma mensagem
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400">mic</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <footer className="p-6 border-t border-slate-800 flex justify-between items-center bg-background-dark/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">history</span>
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold">Última alteração</p>
                            <p className="text-slate-500 text-xs">Há 2 horas por Administrador</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition-all">Descartar</button>
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className={`px-8 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {saving ? "Salvando..." : "Publicar Alterações"}
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
}
