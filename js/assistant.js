const API = "http://localhost:8081/sono";


// ================= HUMOR ESTIMADO (MELHORADO) =================
function estimarHumor(horas) {

    if (horas <= 4.5) {
        return "😵 Muito exausto (risco de fadiga)";
    }

    if (horas < 6) {
        return "😢 Cansado e com baixa energia";
    }

    if (horas < 7) {
        return "😕 Levemente abaixo do ideal";
    }

    if (horas <= 8.5) {
        return "🙂 Equilibrado e saudável";
    }

    if (horas <= 10) {
        return "😴 Relaxado, possivelmente descansado demais";
    }

    return "⚠️ Sono excessivo (pode indicar desregulação)";
}


// ================= FUNÇÃO PRINCIPAL IA =================
async function gerarResposta(msg) {

    const res = await fetch(API);
    const dados = await res.json();

    if (!dados.length) {
        return "Ainda não tenho dados suficientes para te analisar. Registre alguns dias de sono primeiro.";
    }

    // ================= CÁLCULOS =================
    const total = dados.reduce((s, i) => s + i.horas, 0);
    const media = total / dados.length;

    const ultimo = dados[dados.length - 1];
    const penultimo = dados.length > 1 ? dados[dados.length - 2] : null;

    // tendência
    let tendencia = "sem histórico";

    if (penultimo) {
        const diff = ultimo.horas - penultimo.horas;

        if (diff >= 0.5) tendencia = "melhorando 📈";
        else if (diff <= -0.5) tendencia = "piorando 📉";
        else tendencia = "estável ➖";
    }

    const humor = estimarHumor(ultimo.horas);

    // consistência (novo upgrade)
    const variacao = dados
        .slice(-5)
        .map(d => d.horas);

    const max = Math.max(...variacao);
    const min = Math.min(...variacao);

    const consistencia =
        (max - min <= 1.5) ? "boa 🔵" :
        (max - min <= 3) ? "irregular 🟡" :
        "muito instável 🔴";

    msg = (msg || "").toLowerCase();

    // ================= BASE FIXA =================
    const base = `
📊 Média: ${media.toFixed(1)}h
📈 Último sono: ${ultimo.horas}h
🔁 Tendência: ${tendencia}
🧠 Humor estimado: ${humor}
📉 Consistência: ${consistencia}
`;

    // ================= IA (MAIS INTELIGENTE) =================

    if (msg.includes("cansado") || msg.includes("exausto")) {

        return `
Entendi — você está se sentindo cansado.

${base}

${media < 6
? "⚠️ Seu sono médio está abaixo do ideal. Isso explica a baixa energia."
: "Seu sono não está tão ruim, então o cansaço pode vir de rotina, estresse ou qualidade do sono."}
        `;
    }

    if (msg.includes("rotina")) {

        return `
Aqui vai uma análise da sua rotina de sono:

${base}

💡 Sugestão:
- Dormir entre 22:30 e 23:30
- Evitar tela 1h antes de dormir
- Manter horário fixo de acordar
- Reduzir cafeína à noite

🔵 Seu padrão está ${consistencia}
        `;
    }

    if (msg.includes("como estou") || msg.includes("meu sono")) {

        return `
Aqui está seu resumo completo:

${base}

${media >= 7 && consistencia === "boa 🔵"
? "🟢 Seu padrão está bem saudável no geral."
: media < 6
? "🔴 Seu sono precisa de atenção."
: "🟡 Seu sono está ok, mas pode melhorar consistência."
}
        `;
    }

    // ================= ALERTA AUTOMÁTICO =================
    if (media < 6) {

        return `
⚠️ ALERTA: Sono insuficiente

${base}

Impactos possíveis:
- Baixa energia
- Falta de foco
- Irritabilidade
        `;
    }

    if (media >= 9.5) {

        return `
⚠️ Sono acima do normal

${base}

Isso pode indicar:
- Cansaço acumulado
- Rotina desregulada
        `;
    }

    // ================= PADRÃO =================
    return `
Estou analisando seus padrões de sono...

${base}

Se quiser, me diga como você está se sentindo hoje que posso refinar a análise.
    `;
}