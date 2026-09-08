const API_CONSULTAS = "http://localhost:8081/consultas";

const form = document.getElementById("consultaForm");
const feedback = document.getElementById("feedback");
const listaProximasEl = document.getElementById("listaProximas");
const listaHistoricoEl = document.getElementById("listaHistorico");

function usuarioIdAtual() {
    const id = localStorage.getItem("usuarioId");
    return id ? Number(id) : null;
}

function formatarDataHora(c) {
    if (!c.dataAgendada) return "";
    const [ano, mes, dia] = c.dataAgendada.split("-");
    let texto = `${dia}/${mes}/${ano}`;
    if (c.horaAgendada) texto += ` às ${c.horaAgendada.substring(0, 5)}`;
    return texto;
}

function montarCard(c) {
    const tag = c.tipo === "EXAME" ? "🧪 Exame" : "🩺 Consulta";
    const statusClasse = c.status === "REALIZADA" ? "status-realizada"
        : c.status === "CANCELADA" ? "status-cancelada" : "";

    const acoes = c.status === "AGENDADA" ? `
        <div class="consulta-acoes">
            <button class="btn-realizada" onclick="marcarStatus(${c.id}, 'REALIZADA')">✔ Realizada</button>
            <button class="btn-cancelar" onclick="marcarStatus(${c.id}, 'CANCELADA')">✖ Cancelar</button>
            <button class="btn-excluir" onclick="excluirConsulta(${c.id})">🗑</button>
        </div>
    ` : `
        <div class="consulta-acoes">
            <button class="btn-excluir" onclick="excluirConsulta(${c.id})">🗑 Excluir</button>
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

async function carregarListas() {
    try {
        const usuarioId = usuarioIdAtual();
        const url = usuarioId ? `${API_CONSULTAS}?usuarioId=${usuarioId}` : API_CONSULTAS;

        const resposta = await fetch(url);
        const todas = await resposta.json();

        const proximas = todas.filter(c => c.status === "AGENDADA")
            .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));

        const historico = todas.filter(c => c.status !== "AGENDADA")
            .sort((a, b) => b.dataAgendada.localeCompare(a.dataAgendada));

        listaProximasEl.innerHTML = proximas.length
            ? proximas.map(montarCard).join("")
            : `<p class="vazio">Nenhum compromisso agendado.</p>`;

        listaHistoricoEl.innerHTML = historico.length
            ? historico.map(montarCard).join("")
            : `<p class="vazio">Nenhum histórico ainda.</p>`;

    } catch (erro) {
        console.error(erro);
        listaProximasEl.innerHTML = `<p class="vazio">❌ Erro ao carregar. O servidor está rodando?</p>`;
        listaHistoricoEl.innerHTML = "";
    }
}

async function marcarStatus(id, status) {
    try {
        // A API espera o objeto completo no PUT, então buscamos os dados atuais primeiro
        const resposta = await fetch(API_CONSULTAS);
        const todas = await resposta.json();
        const consulta = todas.find(c => c.id === id);

        if (!consulta) return;

        consulta.status = status;

        await fetch(`${API_CONSULTAS}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(consulta)
        });

        carregarListas();

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível atualizar o compromisso.");
    }
}

async function excluirConsulta(id) {
    if (!confirm("Deseja realmente excluir este compromisso?")) return;

    try {
        await fetch(`${API_CONSULTAS}/${id}`, { method: "DELETE" });
        carregarListas();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir o compromisso.");
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
        tipo: document.getElementById("tipo").value,
        titulo: document.getElementById("titulo").value,
        dataAgendada: document.getElementById("dataAgendada").value,
        horaAgendada: document.getElementById("horaAgendada").value || null,
        local: document.getElementById("local").value || null,
        profissional: document.getElementById("profissional").value || null,
        observacao: document.getElementById("observacao").value || null,
        lembreteDiasAntes: parseInt(document.getElementById("lembreteDiasAntes").value),
        status: "AGENDADA",
        usuarioId: usuarioIdAtual()
    };

    try {
        const resposta = await fetch(API_CONSULTAS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) throw new Error("Falha ao salvar");

        feedback.style.color = "lightgreen";
        feedback.innerText = "✅ Compromisso salvo com sucesso!";
        form.reset();
        document.getElementById("lembreteDiasAntes").value = "1";

        carregarListas();

    } catch (erro) {
        console.error(erro);
        feedback.style.color = "salmon";
        feedback.innerText = "❌ Erro ao salvar. Verifique se o servidor está rodando.";
    }
});

document.addEventListener("DOMContentLoaded", carregarListas);
