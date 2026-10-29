(() => {
  const F = EVFeatures,
    $ = (id) => document.getElementById(id),
    today = F.iso(new Date());
  let busy = false;
  $("relatorioFim").value = today;
  $("relatorioInicio").value = today.slice(0, 7) + "-01";
  $("relatorioInicio").max = today;
  $("relatorioFim").max = today;
  const sections = {
    DIARIO: ["Diário", "diario"],
    SONO: ["Sono", "sono"],
    HUMOR: ["Humor", "humor"],
    CICLO: ["Ciclos", "ciclos"],
    CONSULTAS: ["Consultas", "consultas"],
  };
  function query() {
    const start = $("relatorioInicio").value,
      end = $("relatorioFim").value,
      chosen = [...document.querySelectorAll("[name=secao]:checked")].map(
        (e) => e.value,
      );
    if (!$("relatorioForm").reportValidity()) return null;
    if (!chosen.length) throw new Error("Escolha ao menos uma seção.");
    if (start > end) throw new Error("O início deve ser anterior ao fim.");
    if ((F.date(end) - F.date(start)) / 86400000 > 365)
      throw new Error("Selecione até 366 dias.");
    return new URLSearchParams({
      inicio: start,
      fim: end,
      secoes: chosen.join(","),
    });
  }
  async function run(pdf) {
    if (busy) return;
    let params;
    try {
      params = query();
      if (!params) return;
    } catch (e) {
      F.status("relatorioMensagem", e.message, true);
      return;
    }
    busy = true;
    $("baixarPdf").disabled = true;
    $("preverRelatorio").disabled = true;
    F.status(
      "relatorioMensagem",
      pdf ? "Preparando seu PDF…" : "Conferindo os registros…",
    );
    try {
      if (pdf) {
        const response = await EV.fetch("/relatorios/resumo.pdf?" + params);
        F.download(
          await response.blob(),
          "espelho-vital-" +
            params.get("inicio") +
            "-" +
            params.get("fim") +
            ".pdf",
        );
        F.status("relatorioMensagem", "Seu PDF está pronto para salvar.");
      } else {
        const data = await EV.json("/relatorios/resumo?" + params);
        $("relatorioContagens").replaceChildren();
        $("relatorioDetalhes").replaceChildren();
        $("periodoResumo").textContent =
          data.nome +
          " · " +
          F.format(data.inicio) +
          " a " +
          F.format(data.fim);
        data.secoes.forEach((code) => {
          const [label, key] = sections[code],
            count = data[key].length,
            card = F.el("div");
          card.append(F.el("strong", count), F.el("span", label));
          $("relatorioContagens").append(card);
        });
        if (data.diario.length) {
          const section = F.el("div", null, "feature-note");
          section.append(F.el("strong", "Últimos dias do período"));
          data.diario.slice(-5).forEach((entry) => {
            const details = [
              F.format(entry.data),
              entry.fluxo !== "NAO_INFORMADO"
                ? "Fluxo: " + F.flows[entry.fluxo]
                : null,
              entry.intensidadeDor != null
                ? "Dor: " + entry.intensidadeDor + "/10"
                : null,
              entry.humor,
            ].filter(Boolean);
            section.append(F.el("p", details.join(" · ")));
          });
          $("relatorioDetalhes").append(section);
        }
        $("relatorioPreview").hidden = false;
        F.status(
          "relatorioMensagem",
          "Confira as quantidades. O PDF inclui todos os registros das seções escolhidas, dentro do período.",
        );
      }
    } catch (e) {
      F.status("relatorioMensagem", e.message, true);
    } finally {
      busy = false;
      $("baixarPdf").disabled = false;
      $("preverRelatorio").disabled = false;
    }
  }
  $("relatorioForm").addEventListener("submit", (e) => {
    e.preventDefault();
    run(false);
  });
  $("baixarPdf").addEventListener("click", () => run(true));
  $("relatorioForm").addEventListener("change", () => {
    $("relatorioPreview").hidden = true;
    F.status("relatorioMensagem", "");
  });
})();
