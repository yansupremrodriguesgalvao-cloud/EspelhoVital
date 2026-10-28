
const API_CONSULTAS = "http://localhost:8081/consultas";

const form = document.getElementById("consultaForm");
const feedback = document.getElementById("feedback");
const listaProximasEl = document.getElementById("listaProximas");
const listaHistoricoEl = document.getElementById("listaHistorico");
const painelNotificacoes = document.getElementById("painelNotificacoes");
const botaoNotificacoes = document.getElementById("ativarNotificacoes");
const statusNotificacoes = document.getElementById("statusNotificacoes");

function usuarioIdAtual() {
    const id = localStorage.getItem("usuarioId");
    return id ? Number(id) : null;
}

function formatarDataHora(c) {
    if (!c.dataAgendada) return "";

    const [ano, mes, dia] = c.dataAgendada.split("-");
    let texto = `${dia}/${mes}/${ano}`;

    if (c.horaAgendada) {
        texto += ` às ${c.horaAgendada.substring(0, 5)}`;
    }

    return texto;
}

function dataLocalISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function diasAte(dataISO) {
    const hoje = new Date();
    const dataHoje = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    const [ano, mes, dia] = dataISO.split("-").map(Number);
    const dataEvento = new Date(ano, mes - 1, dia);

    return Math.round((dataEvento - dataHoje) / 86400000);
}

function chaveLembrete(c) {
    return `lembreteConsulta_${usuarioIdAtual() ?? "visitante"}_${c.id}_${c.dataAgendada}_${c.lembreteDiasAntes}`;
}

function textoLembrete(c, dias) {
    const compromisso = c.tipo === "EXAME" ? "Exame" : "Consulta";

    if (dias === 0) {
        return `${compromisso} hoje: ${c.titulo}`;
    }

    if (dias === 1) {
        return `${compromisso} amanhã: ${c.titulo}`;
    }

    return `${compromisso} em ${dias} dias: ${c.titulo}`;
}

function montarCard(c) {
    const tag = c.tipo === "EXAME" ? "🧪 Exame" : "🩺 Consulta";

    const statusClasse = c.status === "REALIZADA"
        ? "status-realizada"
        : c.status === "CANCELADA"
            ? "status-cancelada"
            : "";

    const acoes = c.status === "AGENDADA" ? `
        <div class="consulta-acoes">
            <button class="btn-realizada"
                onclick="marcarStatus(${c.id}, 'REALIZADA')">
                ✔ Realizada
            </button>
            <button class="btn-cancelar"
                onclick="marcarStatus(${c.id}, 'CANCELADA')">
                ✖ Cancelar
            </button>
            <button class="btn-excluir"
                onclick="excluirConsulta(${c.id})">
                🗑
            </button>
        </div>
    ` : `
        <div class="consulta-acoes">
            <button class="btn-excluir"
                onclick="excluirConsulta(${c.id})">
                🗑 Excluir
            </button>
        </div>
    `;

    return `
        <div class="consulta-card ${statusClasse}">
            <div class="consulta-info">
                <h3>${c.titulo}</h3>
                <p>📅 ${formatarDataHora(c)}</p>
                ${c.local ? `<p>📍 ${c.local}</p>` : ""}
                ${c.profissional ? `<p>👩‍⚕️ ${c.profissional}</p>` : ""}
                ${c.observacao ? `<p>📝 ${c.observacao}</p>` : ""}
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
                <span class="consulta-tag">${tag}</span>
                ${acoes}
            </div>
        </div>
    `;
}

function mostrarAvisos(compromissos) {
    const hoje = dataLocalISO(new Date());

    const avisos = compromissos
        .filter(c => c.status === "AGENDADA" && c.dataAgendada)
        .map(c => ({
            consulta: c,
            dias: diasAte(c.dataAgendada),
            antecedencia: Number(c.lembreteDiasAntes ?? 1)
        }))
        .filter(item =>
            item.dias >= 0 &&
            item.dias <= item.antecedencia
        );

    if (!avisos.length) {
        painelNotificacoes.innerHTML =
            `<p class="vazio">Você não tem lembretes para hoje.</p>`;
        return;
    }

    painelNotificacoes.innerHTML = avisos.map(item => `
        <div class="consulta-card">
            <div class="consulta-info">
                <strong>🔔 ${textoLembrete(item.consulta, item.dias)}</strong>
                <p>📅 ${formatarDataHora(item.consulta)}</p>
                <p>⏰ Data do aviso: ${hoje.split("-").reverse().join("/")}</p>
            </div>
        </div>
    `).join("");

    if ("Notification" in window && Notification.permission === "granted") {
        avisos.forEach(item => {
            const c = item.consulta;
            const chave = chaveLembrete(c);
            const avisoEnviado = localStorage.getItem(chave);

            if (!avisoEnviado) {
                new Notification("Espelho Vital — Lembrete", {
                    body: `${textoLembrete(c, item.dias)}\n${formatarDataHora(c)}`,
                    tag: chave
                });

                localStorage.setItem(chave, "enviado");
            }
        });
    }
}

async function carregarListas() {
    try {
        const usuarioId = usuarioIdAtual();
        const url = usuarioId
            ? `${API_CONSULTAS}?usuarioId=${usuarioId}`
            : API_CONSULTAS;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error("Não foi possível buscar os compromissos.");
        }

        const todas = await resposta.json();

        const proximas = todas
            .filter(c => c.status === "AGENDADA")
            .sort((a, b) =>
                `${a.dataAgendada}${a.horaAgendada || ""}`.localeCompare(
                    `${b.dataAgendada}${b.horaAgendada || ""}`
                )
            );

        const historico = todas
            .filter(c => c.status !== "AGENDADA")
            .sort((a, b) => b.dataAgendada.localeCompare(a.dataAgendada));

        listaProximasEl.innerHTML = proximas.length
            ? proximas.map(montarCard).join("")
            : `<p class="vazio">Nenhum compromisso agendado.</p>`;

        listaHistoricoEl.innerHTML = historico.length
            ? historico.map(montarCard).join("")
            : `<p class="vazio">Nenhum histórico ainda.</p>`;

        mostrarAvisos(proximas);

    } catch (erro) {
        console.error(erro);
        listaProximasEl.innerHTML =
            `<p class="vazio">❌ Erro ao carregar. Verifique se o servidor está rodando.</p>`;
        listaHistoricoEl.innerHTML = "";
    }
}

async function ativarNotificacoes() {
    if (!("Notification" in window)) {
        statusNotificacoes.textContent =
            "Este navegador não oferece suporte a notificações.";
        return;
    }

    if (!window.isSecureContext) {
        statusNotificacoes.textContent =
            "Abra o site em localhost ou HTTPS para ativar notificações.";
        return;
    }

    try {
        const permissao = await Notification.requestPermission();

        if (permissao === "granted") {
            statusNotificacoes.textContent =
                "✅ Notificações do navegador ativadas!";
            await carregarListas();
        } else {
            statusNotificacoes.textContent =
                "As notificações não foram autorizadas. Você pode ativá-las nas configurações do navegador.";
        }
    } catch (erro) {
        console.error(erro);
        statusNotificacoes.textContent =
            "Não foi possível ativar as notificações.";
    }
}

async function marcarStatus(id, status) {
    try {
        const usuarioId = usuarioIdAtual();
        const url = usuarioId
            ? `${API_CONSULTAS}?usuarioId=${usuarioId}`
            : API_CONSULTAS;

        const respostaLista = await fetch(url);
        if (!respostaLista.ok) throw new Error();

        const todas = await respostaLista.json();
        const consulta = todas.find(c => c.id === id);

        if (!consulta) return;

        consulta.status = status;

        const resposta = await fetch(`${API_CONSULTAS}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(consulta)
        });

        if (!resposta.ok) throw new Error();

        await carregarListas();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível atualizar o compromisso.");
    }
}

async function excluirConsulta(id) {
    if (!confirm("Deseja realmente excluir este compromisso?")) return;

    try {
        const resposta = await fetch(`${API_CONSULTAS}/${id}`, {
            method: "DELETE"
        });

        if (!resposta.ok) throw new Error();

        await carregarListas();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir o compromisso.");
    }
}

form.addEventListener("submit", async e => {
    e.preventDefault();

    const dados = {
        tipo: document.getElementById("tipo").value,
        titulo: document.getElementById("titulo").value,
        dataAgendada: document.getElementById("dataAgendada").value,
        horaAgendada: document.getElementById("horaAgendada").value || null,
        local: document.getElementById("local").value || null,
        profissional: document.getElementById("profissional").value || null,
        observacao: document.getElementById("observacao").value || null,
        lembreteDiasAntes: Number(
            document.getElementById("lembreteDiasAntes").value
        ),
        status: "AGENDADA",
        usuarioId: usuarioIdAtual()
    };

    try {
        const resposta = await fetch(API_CONSULTAS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            const mensagem = await resposta.text();
            throw new Error(mensagem || "Falha ao salvar.");
        }

        feedback.style.color = "lightgreen";
        feedback.innerText = "✅ Compromisso salvo com sucesso!";

        form.reset();
        document.getElementById("lembreteDiasAntes").value = "1";

        await carregarListas();
    } catch (erro) {
        console.error(erro);
        feedback.style.color = "salmon";
        feedback.innerText =
            "❌ Erro ao salvar. Verifique se o servidor está rodando.";
    }
});

botaoNotificacoes.addEventListener("click", ativarNotificacoes);

if ("Notification" in window && Notification.permission === "granted") {
    statusNotificacoes.textContent = "Notificações do navegador estão ativadas.";
}

carregarListas();

// Atualiza os lembretes enquanto esta página estiver aberta.
setInterval(carregarListas, 60 * 1000);
