(() => {
  let sequence = 0;
  async function load() {
    const token = ++sequence,
      area = document.getElementById("variacoesConteudo");
    if (!area) return;
    try {
      const data = await EV.json("/ciclo/variacoes");
      if (token !== sequence) return;
      area.replaceChildren();
      const el = (tag, text, cls) => {
          const n = document.createElement(tag);
          if (text != null) n.textContent = text;
          if (cls) n.className = cls;
          return n;
        },
        format = (s) => s.split("-").reverse().join("/");
      area.append(el("p", data.observacao, "feature-muted"));
      if (!data.intervalos.length) {
        area.append(
          el(
            "p",
            "Registre ao menos dois inícios menstruais para visualizar o intervalo real entre eles.",
            "feature-empty",
          ),
        );
        return;
      }
      const summary = el("div", null, "variation-summary");
      for (const [label, value] of [
        ["Média", data.mediaDias],
        ["Menor", data.menorIntervalo],
        ["Maior", data.maiorIntervalo],
        ["Amplitude observada", data.variacaoDias],
      ]) {
        const span = el("span");
        span.append(
          label + ": ",
          el("strong", Number(value).toLocaleString("pt-BR") + " dias"),
        );
        summary.append(span);
      }
      area.append(summary);
      const last = data.intervalos.slice(-12),
        max = Math.max(...last.map((v) => v.dias)),
        chart = el("div", null, "variation-chart");
      chart.setAttribute("aria-label", "Últimos doze intervalos registrados");
      for (const item of last) {
        const col = el("div", null, "variation-column");
        col.title =
          format(item.inicio) +
          " a " +
          format(item.proximoInicio) +
          ": " +
          item.dias +
          " dias";
        const bar = el("span", null, "variation-bar");
        bar.style.height = Math.max(5, (item.dias / max) * 110) + "px";
        col.append(
          el("strong", item.dias + " d"),
          bar,
          el("span", format(item.proximoInicio).slice(0, 5)),
        );
        chart.append(col);
      }
      area.append(chart);
      const details = el("details"),
        caption = el("summary", "Ver todos os intervalos");
      details.append(caption);
      const wrap = el("div", null, "feature-table-wrap"),
        table = el("table", null, "feature-table"),
        thead = el("thead"),
        tr = el("tr");
      for (const label of ["Início", "Próximo início", "Intervalo"])
        tr.append(el("th", label));
      thead.append(tr);
      table.append(thead);
      const body = el("tbody");
      [...data.intervalos].reverse().forEach((item) => {
        const row = el("tr");
        row.append(
          el("td", format(item.inicio)),
          el("td", format(item.proximoInicio)),
          el("td", item.dias + " dias"),
        );
        body.append(row);
      });
      table.append(body);
      wrap.append(table);
      details.append(wrap);
      area.append(details);
    } catch (error) {
      area.textContent = error.message;
    }
  }
  document.addEventListener("ev:cycle-updated", load);
})();
