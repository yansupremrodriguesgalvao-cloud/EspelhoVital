const form = document.getElementById("consultaForm");
const feedback = document.getElementById("feedback");
function node(tag, text, className) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function card(c) {
  const root = node("div", null, "consulta-card");
  const info = node("div", null, "consulta-info");
  info.append(
    node("h3", c.titulo),
    node(
      "p",
      c.dataAgendada.split("-").reverse().join("/") +
        (c.horaAgendada ? " às " + c.horaAgendada.slice(0, 5) : ""),
    ),
  );
  for (const field of ["local", "profissional", "observacao"])
    if (c[field]) info.append(node("p", c[field]));
  root.append(
    info,
    node("span", c.tipo === "EXAME" ? "Exame" : "Consulta", "consulta-tag"),
  );
  const actions = node("div", null, "consulta-acoes");
  for (const [label, status] of [
    ["Realizada", "REALIZADA"],
    ["Cancelar", "CANCELADA"],
    ["Excluir", null],
  ]) {
    if (status && c.status !== "AGENDADA") continue;
    const button = node("button", label);
    button.type = "button";
    button.addEventListener("click", async () => {
      if (!status && !confirm("Excluir este compromisso?")) return;
      button.disabled = true;
      try {
        await EV.fetch("/consultas/" + c.id + (status ? "/status" : ""), {
          method: status ? "PATCH" : "DELETE",
          headers: { "Content-Type": "application/json" },
          ...(status ? { body: JSON.stringify({ status }) } : {}),
        });
        await carregarListas();
      } catch (e) {
        feedback.textContent = e.message;
      } finally {
        button.disabled = false;
      }
    });
    actions.append(button);
  }
  root.append(actions);
  return root;
}
async function carregarListas() {
  try {
    await EV.ready;
    const all = await EV.json("/consultas");
    for (const [id, scheduled] of [
      ["listaProximas", true],
      ["listaHistorico", false],
    ]) {
      const list = document.getElementById(id);
      const items = all.filter((c) => (c.status === "AGENDADA") === scheduled);
      list.replaceChildren(...items.map(card));
      if (!items.length)
        list.append(
          node(
            "p",
            scheduled
              ? "Nenhum compromisso agendado."
              : "Nenhum histórico ainda.",
            "vazio",
          ),
        );
    }
  } catch (e) {
    feedback.textContent = e.message;
  }
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.submitter;
  button.disabled = true;
  const data = {};
  for (const key of [
    "tipo",
    "titulo",
    "dataAgendada",
    "horaAgendada",
    "local",
    "profissional",
    "observacao",
  ])
    data[key] = document.getElementById(key).value || null;
  data.lembreteDiasAntes = Number(
    document.getElementById("lembreteDiasAntes").value,
  );
  data.status = "AGENDADA";
  try {
    await EV.json("/consultas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    feedback.textContent = "Compromisso salvo.";
    form.reset();
    await carregarListas();
  } catch (e) {
    feedback.textContent = e.message;
  } finally {
    button.disabled = false;
  }
});
document.addEventListener("DOMContentLoaded", carregarListas);
