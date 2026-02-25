/**
 * Script para explorar a API da UazAPI e descobrir todos os endpoints
 */
import { writeFileSync } from "fs";

const BASE_URL = "https://sartori.uazapi.com";
const TOKEN = "VJsb6olEqblPMd74Y3dQoYsg4q6MXH61JEps7LpVheajTwFWHS";

const headers = {
    "Content-Type": "application/json",
    "token": TOKEN,
    "Authorization": `Bearer ${TOKEN}`,
};

async function req(method: string, path: string, body?: any) {
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

    // 1. Listar instâncias
    console.log("🔍 GET /instances ...");
    results.listInstances = await req("GET", "/instances");
    console.log("  Status:", results.listInstances.status);
    console.log("  Data:", JSON.stringify(results.listInstances.data, null, 2).slice(0, 500));

    // 2. Tentar endpoint admin/instâncias
    console.log("\n🔍 GET /admin/instances ...");
    results.adminInstances = await req("GET", "/admin/instances");
    console.log("  Status:", results.adminInstances.status);

    // 3. Tentar GET /instance
    console.log("\n🔍 GET /instance ...");
    results.instance = await req("GET", "/instance");
    console.log("  Status:", results.instance.status);

    // 4. Tentar criar instância
    console.log("\n🔍 POST /instance/create ...");
    results.createInstance = await req("POST", "/instance/create", {
        instanceName: "test-uaz-001",
        webhook: "https://auto.mercestenis.com.br/api/webhook",
    });
    console.log("  Status:", results.createInstance.status);
    console.log("  Data:", JSON.stringify(results.createInstance.data, null, 2).slice(0, 500));

    // 5. Tentar endpoint de criar sem nesting
    console.log("\n🔍 POST /instances ...");
    results.postInstances = await req("POST", "/instances", {
        name: "test-uaz-001",
        webhook: "https://auto.mercestenis.com.br/api/webhook",
    });
    console.log("  Status:", results.postInstances.status);
    console.log("  Data:", JSON.stringify(results.postInstances.data, null, 2).slice(0, 300));

    // 6. Status/info geral
    console.log("\n🔍 GET /status ...");
    results.status = await req("GET", "/status");
    console.log("  Status:", results.status.status);

    console.log("\n🔍 GET /info ...");
    results.info = await req("GET", "/info");
    console.log("  Status:", results.info.status);

    // 7. Tentar endpoints comuns de WhatsApp API
    for (const path of ["/", "/health", "/ping", "/api", "/api/instances", "/manager/instances"]) {
        const r = await req("GET", path);
        results[`GET_${path}`] = { status: r.status, preview: JSON.stringify(r.data).slice(0, 200) };
        console.log(`\n🔍 GET ${path} → ${r.status}`);
        if (r.status === 200) console.log("  ", JSON.stringify(r.data).slice(0, 300));
    }

    writeFileSync("scripts/uazapi-explore.json", JSON.stringify(results, null, 2), "utf8");
    console.log("\n✅ Salvo em scripts/uazapi-explore.json");
}

main().catch(console.error);
