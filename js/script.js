const API = "http://localhost:8081/sono";

// ================= UTIL =================
function estimarHumor(horas) {
    if (horas < 5) return "😢 Muito cansado / irritado";
    if (horas < 6.5) return "😕 Levemente cansado";
    if (horas <= 8.5) return "🙂 Bem / equilibrado";
    return "😴 Sonolento, mas relaxado";
}

function calcularMedia(dados) {
    if (!dados.length) return 0;
    const total = dados.reduce((s, i) => s + i.horas, 0);
    return total / dados.length;
}

function calcularTendencia(dados) {
    if (dados.length < 2) return "sem histórico";

    const ultimo = dados.at(-1).horas;
    const penultimo = dados.at(-2).horas;

    const diff = ultimo - penultimo;

    if (Math.abs(diff) < 0.3) return "estável ➖";
    if (diff > 0) return "melhorando 📈";
    return "piorando 📉";
}

// ================= SCORE IA =================
function calcularScore(dados) {
    const media = calcularMedia(dados);
    const ultimo = dados.at(-1)?.horas || 0;

    let score = 100;

    // média ideal
    if (media < 5.5) score -= 40;
    else if (media < 6.5) score -= 20;
    else if (media > 9) score -= 15;

    // última noite
    if (ultimo < 5) score -= 25;
    else if (ultimo < 6) score -= 10;

    // instabilidade (variação)
    let variacao = 0;

    for (let i = 1; i < dados.length; i++) {
        variacao += Math.abs(dados[i].horas - dados[i - 1].horas);
    }

    const instabilidade = variacao / Math.max(1, dados.length - 1);

    if (instabilidade > 2) score -= 20;
    else if (instabilidade > 1) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
}

// ================= IA PRINCIPAL =================
function gerarIA(ultimo, dados, media, tendencia) {

    const humor = estimarHumor(ultimo.horas);
    const score = calcularScore(dados);

    const base = `
📊 Média: ${media.toFixed(1)}h
📈 Último: ${ultimo.horas}h
🔁 Tendência: ${tendencia}
🧠 Humor: ${humor}
⭐ Score: ${score}/100
`;

    if (dados.length < 2) {
        return `🧠 Ainda aprendendo seus padrões...

${base}

Continue registrando para análise mais precisa.`;
    }

    if (score < 40) {
        return `🚨 ALERTA CRÍTICO

${base}

Seu sono está muito irregular e pode afetar foco, memória e humor.`;
    }

    if (score < 60) {
        return `⚠️ SONO RUIM

${base}

Seu padrão precisa de mais estabilidade.`;
    }

    if (score < 80) {
        return `🟡 SONO OK

${base}

Você está funcional, mas pode melhorar consistência.`;
    }

    return `🟢 SONO EXCELENTE

${base}

Seu padrão está muito saudável. Continue assim.`;
}

// ================= SALVAR =================
async function salvarSono() {

    const horas = Number(document.getElementById("horas").value);
    const qualidade = document.getElementById("qualidade").value;

    if (!horas || horas <= 0) {
        alert("Informe horas válidas!");
        return;
    }

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ horas, qualidade })
        });

        if (!res.ok) throw new Error();

        alert("✔ Registro salvo!");
        window.location.href = "../index.html";

    } catch (err) {
        console.error(err);
        alert("❌ Erro de conexão");
    }
}

// ================= DASHBOARD =================
async function carregarDashboard() {

    try {
        const res = await fetch(API);
        const dados = await res.json();

        const totalEl = document.getElementById("totalRegistros");
        const mediaEl = document.getElementById("mediaSono");
        const ultimoEl = document.getElementById("ultimoSono");
        const statusEl = document.getElementById("statusSono");
        const iaEl = document.getElementById("iaResposta");

        if (!dados.length) {
            totalEl.innerText = "0";
            iaEl.innerText = "🧠 Faça seu primeiro registro para análise.";
            return;
        }

        const ultimo = dados.at(-1);
        const media = calcularMedia(dados);
        const tendencia = calcularTendencia(dados);

        // UI
        totalEl.innerText = dados.length;
        mediaEl.innerText = media.toFixed(1) + "h";
        ultimoEl.innerText = ultimo.horas + "h";

        statusEl.innerText =
            ultimo.horas < 6 ? "⚠️ Ruim" :
            ultimo.horas <= 9 ? "✅ Bom" :
            "😴 Alto";

        // IA
        iaEl.innerText = gerarIA(ultimo, dados, media, tendencia);

    } catch (err) {
        console.error("Erro dashboard:", err);
    }
}

// ================= INIT =================
if (document.getElementById("totalRegistros")) {
    carregarDashboard();
}