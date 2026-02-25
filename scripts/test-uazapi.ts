/**
 * Testa os endpoints reais da UazAPI com a autenticação correta
 */
import { writeFileSync } from "fs";

const BASE_URL = "https://sartori.uazapi.com";
const ADMIN_TOKEN = "VJsb6olEqblPMd74Y3dQoYsg4q6MXH61JEps7LpVheajTwFWHS";

async function req(method: string, path: string, body?: any, instanceToken?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (instanceToken) {
        headers["token"] = instanceToken;
    } else {
        headers["admintoken"] = ADMIN_TOKEN;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
}

async function main() {
    const results: Record<string, any> = {};

    console.log("=== ADMIN ENDPOINTS ===");

    // Listar instâncias
    console.log("\n🔍 GET /instance/all (admintoken)...");
    results.listAll = await req("GET", "/instance/all");
    console.log("  Status:", results.listAll.status);
    console.log("  Data:", JSON.stringify(results.listAll.data, null, 2).slice(0, 600));

    // Status global
    console.log("\n🔍 GET /status (admintoken)...");
    results.statusAdmin = await req("GET", "/status");
    console.log("  Status:", results.statusAdmin.status);
    console.log("  Data:", JSON.stringify(results.statusAdmin.data, null, 2).slice(0, 400));

    // Criar instância de teste
    const testName = `merces-${Date.now()}`;
    console.log(`\n🔍 POST /instance/init (admintoken) - name: ${testName}...`);
    results.createInstance = await req("POST", "/instance/init", {
        name: testName,
        systemName: "Mercês Tênis",
    });
    console.log("  Status:", results.createInstance.status);
    console.log("  Data:", JSON.stringify(results.createInstance.data, null, 2).slice(0, 600));

    // Se criou, testar endpoints de instância
    const instanceToken = results.createInstance.data?.token || results.createInstance.data?.data?.token;
    if (instanceToken) {
        console.log(`\n✅ Token da instância: ${instanceToken}`);

        // Status da instância
        console.log("\n🔍 GET /instance/status (instance token)...");
        results.instanceStatus = await req("GET", "/instance/status", undefined, instanceToken);
        console.log("  Status:", results.instanceStatus.status);
        console.log("  Data:", JSON.stringify(results.instanceStatus.data, null, 2));

        // Configurar webhook
        console.log("\n🔍 POST /webhook (instance token)...");
        results.setWebhook = await req("POST", "/webhook", {
            enabled: true,
            url: "https://auto.mercestenis.com.br/api/webhook",
            events: ["messages", "connection"],
        }, instanceToken);
        console.log("  Status:", results.setWebhook.status);
        console.log("  Data:", JSON.stringify(results.setWebhook.data, null, 2).slice(0, 400));
    }

    // Webhook global
    console.log("\n🔍 POST /globalwebhook (admintoken)...");
    results.globalWebhook = await req("POST", "/globalwebhook", {
        url: "https://auto.mercestenis.com.br/api/webhook",
        events: ["messages", "connection"],
    });
    console.log("  Status:", results.globalWebhook.status);
    console.log("  Data:", JSON.stringify(results.globalWebhook.data, null, 2).slice(0, 400));

    writeFileSync("scripts/uazapi-test.json", JSON.stringify(results, null, 2), "utf8");
    console.log("\n✅ Salvo em scripts/uazapi-test.json");
}

main().catch(console.error);
