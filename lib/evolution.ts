import axios from "axios";
import { prisma } from "./prisma";

export async function sendMessage(instanceName: string, remoteJid: string, text: string) {
    try {
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const apiUrl = settingsMap["EVOLUTION_API_URL"]?.replace(/\/$/, "");
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (!apiUrl || !apiToken) {
            throw new Error("Evolution API settings not configured");
        }

        const res = await axios.post(`${apiUrl}/message/sendText/${instanceName}`, {
            number: remoteJid,
            text: text,
            linkPreview: true
        }, {
            headers: {
                "apikey": apiToken,
                "Content-Type": "application/json"
            }
        });

        return res.data;
    } catch (error: any) {
        console.error("Error sending message via Evolution:", error.response?.data || error.message);
        throw error;
    }
}

export async function sendPresence(instanceName: string, remoteJid: string, presence: "composing" | "available") {
    try {
        const settings = await prisma.settings.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const apiUrl = settingsMap["EVOLUTION_API_URL"]?.replace(/\/$/, "");
        const apiToken = settingsMap["EVOLUTION_API_TOKEN"];

        if (!apiUrl || !apiToken) return;

        await axios.post(`${apiUrl}/chat/retrivePresence/${instanceName}`, {
            number: remoteJid,
            presence: presence
        }, {
            headers: {
                "apikey": apiToken,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        // Ignore presence errors
    }
}
