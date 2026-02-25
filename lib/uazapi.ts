/**
 * UazAPI Client
 * 
 * Documentação: https://docs.uazapi.com
 * 
 * Autenticação:
 *  - Endpoints de admin (criar/listar instâncias, webhook global): header `admintoken`
 *  - Endpoints de instância (enviar msg, status, webhook por instância): header `token` (token da instância)
 */

import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UazInstance {
    id: string;
    token: string;
    name: string;
    systemName: string;
    status: "connected" | "disconnected" | "connecting";
    profileName: string;
    profilePicUrl: string;
    owner: string;
    isBusiness: boolean;
    created: string;
    updated: string;
}

export interface UazConnectionStatus {
    connected: boolean;
    jid: string | null;
    loggedIn: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSettings() {
    const settings = await prisma.settings.findMany();
    const map = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    const apiUrl = map["UAZAPI_URL"]?.replace(/\/$/, "");
    const adminToken = map["UAZAPI_ADMIN_TOKEN"]?.trim();

    if (!apiUrl || !adminToken) {
        throw new Error("UazAPI não configurada. Configure UAZAPI_URL e UAZAPI_ADMIN_TOKEN em Ajustes.");
    }

    return { apiUrl, adminToken };
}

/** Busca o token de uma instância pelo nome no banco local */
async function getInstanceToken(instanceName: string): Promise<string> {
    const instance = await prisma.connectionInstance.findUnique({
        where: { instanceId: instanceName },
    });
    if (!instance?.token) {
        throw new Error(`Token da instância "${instanceName}" não encontrado no banco. Sincronize a instância primeiro.`);
    }
    return instance.token;
}

async function adminRequest(method: string, path: string, body?: any) {
    const { apiUrl, adminToken } = await getSettings();
    const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "admintoken": adminToken,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
        console.error(`❌ UazAPI Admin [${method} ${path}]:`, data);
        throw new Error(`UazAPI error ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function instanceRequest(method: string, path: string, instanceToken: string, body?: any) {
    const { apiUrl } = await getSettings();
    const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
        console.error(`❌ UazAPI Instance [${method} ${path}]:`, data);
        throw new Error(`UazAPI error ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

/** Cria uma nova instância. Retorna o token da instância. */
export async function createInstance(name: string, systemName?: string): Promise<{ token: string; instance: UazInstance }> {
    const data = await adminRequest("POST", "/instance/init", {
        name,
        systemName: systemName || name,
    });
    return {
        token: data.token,
        instance: data.instance,
    };
}

/** Lista todas as instâncias no servidor UazAPI */
export async function listAllInstances(): Promise<UazInstance[]> {
    const data = await adminRequest("GET", "/instance/all");
    return Array.isArray(data) ? data : [];
}

/** Configura o webhook global (para todas as instâncias) */
export async function setGlobalWebhook(url: string, events: string[] = ["messages", "connection"]) {
    return adminRequest("POST", "/globalwebhook", { url, events, enabled: true });
}

// ─── Instance Endpoints ───────────────────────────────────────────────────────

/** Verifica o status de conexão de uma instância */
export async function getInstanceStatus(instanceName: string): Promise<{ instance: UazInstance; status: UazConnectionStatus }> {
    const token = await getInstanceToken(instanceName);
    return instanceRequest("GET", "/instance/status", token);
}

/** Inicia a conexão (gera QR code ou pair code) */
export async function connectInstance(instanceName: string): Promise<{ qrcode?: string; paircode?: string }> {
    const token = await getInstanceToken(instanceName);
    return instanceRequest("POST", "/instance/connect", token);
}

/** Desconecta uma instância do WhatsApp (logout) */
export async function disconnectInstance(instanceName: string) {
    const token = await getInstanceToken(instanceName);
    return instanceRequest("POST", "/instance/disconnect", token);
}

/** Deleta uma instância permanentemente do servidor */
export async function deleteInstance(instanceName: string) {
    const token = await getInstanceToken(instanceName);
    return instanceRequest("DELETE", "/instance", token);
}

/** Configura o webhook de uma instância específica */
export async function setInstanceWebhook(instanceName: string, webhookUrl: string, events: string[] = ["messages", "connection"]) {
    const token = await getInstanceToken(instanceName);
    return instanceRequest("POST", "/webhook", token, {
        enabled: true,
        url: webhookUrl,
        events,
    });
}

// ─── Message Endpoints ────────────────────────────────────────────────────────

/**
 * Envia mensagem de texto.
 * @param instanceName - nome da instância no banco local
 * @param number - número no formato internacional (ex: 5541999990000)
 * @param text - texto da mensagem
 */
export async function sendMessage(instanceName: string, number: string, text: string) {
    try {
        const token = await getInstanceToken(instanceName);
        // UazAPI aceita número puro (sem @s.whatsapp.net)
        const cleanNumber = number.replace("@s.whatsapp.net", "").replace("@c.us", "");

        return instanceRequest("POST", "/send/text", token, {
            number: cleanNumber,
            text,
        });
    } catch (error: any) {
        console.error("❌ UazAPI sendMessage error:", error.message);
        throw error;
    }
}

/**
 * Envia indicador de presença (digitando, gravando áudio).
 * Endpoint: POST /message/presence
 * Tipos: composing | recording | paused
 */
export async function sendPresence(
    instanceName: string,
    number: string,
    presence: "composing" | "recording" | "paused" | string = "composing"
) {
    try {
        const token = await getInstanceToken(instanceName);
        const cleanNumber = number.replace("@s.whatsapp.net", "").replace("@c.us", "");
        const uazPresence = presence === "recording" ? "recording" :
            presence === "paused" ? "paused" : "composing";
        await instanceRequest("POST", "/message/presence", token, {
            number: cleanNumber,
            presence: uazPresence,
            delay: 3000,
        });
    } catch (_error) {
        // Ignorar erros de presence — não críticos
    }
}
