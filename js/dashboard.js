const API_DASHBOARD = "http://localhost:8081/dashboard";

function formatarData(dataIso) {
    if (!dataIso) return null;
    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
}

function montarItemConsulta(c) {
    const tag = c.tipo === "EXAME" ? "🧪 Exame" : "🩺 Consulta";
    const dias = c.diasRestantes;
    let quando;

    if (dias === 0) quando = "Hoje";
    else if (dias === 1) quando = "Amanhã";
    else quando = `Em ${dias} dias`;

    const hora = c.horaAgendada ? ` às ${c.horaAgendada.substring(0, 5)}` : "";

    return `
        <div class="ev-consulta-item">
            <div>
                <div class="ev-consulta-titulo">${c.titulo}</div>
                <div class="ev-consulta-meta">${formatarData(c.dataAgendada)}${hora} · ${quando}</div>
            </div>
            <div class="ev-consulta-tag">${tag}</div>
        </div>
    `;
}

async function carregarDashboard() {
    try {
        const usuarioId = localStorage.getItem("usuarioId");
        const url = usuarioId
            ? `${API_DASHBOARD}?usuarioId=${usuarioId}`
            : API_DASHBOARD;

        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("Falha ao buscar dashboard");

        const dados = await resposta.json();

        // ---------- Alertas ----------
        const alertasEl = document.getElementById("ev-alertas");
        if (dados.alertas && dados.alertas.length) {
            alertasEl.style.display = "flex";
            alertasEl.innerHTML = dados.alertas
                .map(a => `<div class="ev-alerta-item">${a}</div>`)
                .join("");
        }

        // ---------- Ciclo ----------
        document.getElementById("cardFaseCiclo").innerText = dados.faseCicloAtual || "Sem dados";
        if (dados.proximaMenstruacao) {
            const dias = dados.diasParaProximaMenstruacao;
            document.getElementById("cardProximaMenstruacao").innerText =
                dias >= 0
                    ? `Próxima em ${dias} dia(s) · ${formatarData(dados.proximaMenstruacao)}`
                    : `Prevista em ${formatarData(dados.proximaMenstruacao)}`;
        } else {
            document.getElementById("cardProximaMenstruacao").innerText = "Registre seu ciclo para acompanhar";
        }

        // ---------- Sono ----------
        document.getElementById("cardMediaSono").innerText =
            dados.mediaHorasSono != null ? `${dados.mediaHorasSono}h` : "--";
        document.getElementById("cardTotalSono").innerText =
            dados.totalRegistrosSono
                ? `${dados.totalRegistrosSono} registro(s) · ${dados.ultimaQualidadeSono || ""}`
                : "Sem registros ainda";

        // ---------- Humor ----------
        document.getElementById("cardUltimoHumor").innerText = dados.ultimoHumor || "--";
        document.getElementById("cardDataHumor").innerText =
            dados.dataUltimoHumor ? formatarData(dados.dataUltimoHumor) : "Sem registros ainda";

        // ---------- Consultas ----------
        document.getElementById("cardTotalConsultas").innerText = dados.totalConsultasProximas ?? 0;

        const listaEl = document.getElementById("ev-lista-consultas");
        if (dados.proximasConsultas && dados.proximasConsultas.length) {
            listaEl.innerHTML = dados.proximasConsultas.map(montarItemConsulta).join("");
        } else {
            listaEl.innerHTML = `
                <p class="ev-vazio">
                    Nenhuma consulta ou exame agendado.
                    <a href="pages/consultas.html">Adicionar agora</a>
                </p>
            `;
        }

    } catch (erro) {
        console.error(erro);
        const listaEl = document.getElementById("ev-lista-consultas");
        if (listaEl) {
            listaEl.innerHTML = `<p class="ev-vazio">❌ Não foi possível carregar o dashboard. Verifique se o servidor está rodando.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", carregarDashboard);
