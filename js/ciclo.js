(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let data = null;
  let editing = null;
  let quickSaving = false;
  let undoId = null;
  const iso = (d) =>
    [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  const date = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const add = (s, n) => {
    const d = date(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const format = (s) => date(s).toLocaleDateString("pt-BR");
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const inRange = (s, a, b) => a && b && s >= a && s <= b;
  function describe(s) {
    if (!data) return { cls: "", text: "Sem dados para esta data." };
    if (s > data.limitePrevisao)
      return {
        cls: "",
        text: "Previsões disponíveis até " + format(data.limitePrevisao) + ".",
      };
    const real = data.registros.find((r) =>
      inRange(s, r.inicio, add(r.inicio, r.duracaoMenstruacao - 1)),
    );
    if (real)
      return {
        cls: "menstruacao",
        text: "Menstruação registrada. Início em " + format(real.inicio) + ".",
      };
    // Forecasts only start after the last confirmed start; never fill missing historical cycles as facts.
    for (const p of data.previsoes) {
      if (data.irregular) {
        if (inRange(s, p.inicioMaisCedo, p.inicioMaisTarde))
          return {
            cls: "incerta",
            text:
              "Faixa de início possível: " +
              format(p.inicioMaisCedo) +
              " a " +
              format(p.inicioMaisTarde) +
              ". Estimativa incerta, não é registro de sangramento.",
          };
      } else {
        if (inRange(s, p.inicio, p.fim))
          return {
            cls: "prevista",
            text: "Menstruação estimada. Registre a data real quando começar.",
          };
        if (s === p.ovulacao)
          return {
            cls: "ovulacao",
            text: "Ovulação estimada; não confirmada.",
          };
        if (inRange(s, p.inicioPeriodoFertil, p.fimPeriodoFertil))
          return {
            cls: "fertil",
            text: "Período fértil estimado; não use esta previsão para evitar gravidez.",
          };
      }
    }
    return {
      cls: "",
      text:
        s > data.limitePrevisao
          ? "Previsões disponíveis até " + format(data.limitePrevisao) + "."
          : "Sem registro de menstruação nesta data.",
    };
  }
  function month(y, m) {
    const panel = el("section", null, "month-panel");
    const first = new Date(y, m, 1);
    panel.append(
      el(
        "h3",
        first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      ),
    );
    const grid = el("div", null, "month-grid");
    for (const d of ["D", "S", "T", "Q", "Q", "S", "S"])
      grid.append(el("span", d, "week-label"));
    for (let i = 0; i < first.getDay(); i++) grid.append(el("span", ""));
    for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) {
      const d = new Date(y, m, day),
        s = iso(d),
        info = describe(s),
        button = el(
          "button",
          day,
          "dia " + info.cls + (s === iso(today) ? " hoje" : ""),
        );
      button.type = "button";
      button.dataset.date = s;
      if (data?.registros.some((record) => record.inicio === s)) {
        button.classList.add("inicio-confirmado");
        button.title = "Primeiro dia registrado. " + info.text;
      }
      button.title = info.text;
      button.setAttribute("aria-label", format(s) + ". " + info.text);
      if (s === iso(today)) button.setAttribute("aria-current", "date");
      button.addEventListener("click", () => detail(s));
      grid.append(button);
    }
    panel.append(grid);
    return panel;
  }
  function render() {
    const annual = $("visao").value === "ano";
    $("mesAno").textContent = annual
      ? String(view.getFullYear())
      : view.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    $("calendarios").classList.toggle("anual", annual);
    $("calendarios").replaceChildren(
      ...(annual
        ? Array.from({ length: 12 }, (_, m) => month(view.getFullYear(), m))
        : [month(view.getFullYear(), view.getMonth())]),
    );
  }
  function detail(s) {
    if (quickSaving) return;
    const history = data?.registros || [];
    const existing = history.find((record) =>
      inRange(
        s,
        record.inicio,
        add(record.inicio, record.duracaoMenstruacao - 1),
      ),
    );
    const future = s > iso(today);
    const period = [...history].reverse().find((r) => r.inicio <= s);
    const canEnd = !future && Boolean(period);
    $("fimPeriodo").hidden = !canEnd;
    if (canEnd) {
      const next = history.find((r) => r.inicio > period.inicio);
      $("ultimoDiaSangramento").min = period.inicio;
      $("ultimoDiaSangramento").max = next ? add(next.inicio, -1) : iso(today);
      $("ultimoDiaSangramento").value = period.fimMenstruacao || s;
      $("ajudaFim").textContent =
        "Período iniciado em " +
        format(period.inicio) +
        (period.fimMenstruacao
          ? ". Fim registrado em " +
            format(period.fimMenstruacao) +
            ". Você pode corrigir a data."
          : ". Informe o último dia de sangramento, mesmo que tenha durado menos ou mais que o previsto.");
      $("registrarFimDia").textContent = period.fimMenstruacao
        ? "Atualizar fim da menstruação"
        : "Minha menstruação terminou";
      $("registrarFimDia").onclick = () => quickEnd(period);
    }
    $("dataDetalhe").textContent = format(s);
    $("descricaoDia").textContent = describe(s).text;
    $("erroDia").textContent = "";
    $("configuracaoDia").textContent = "";
    $("registrarDia").onclick = null;
    $("editarPeriodoDia").onclick = null;
    $("registrarDia").hidden = future || Boolean(existing) || !data;
    $("editarPeriodoDia").hidden = !existing;
    $("fecharDetalhe").textContent = existing || future ? "Fechar" : "Cancelar";
    if (!data) {
      $("tituloDia").textContent = "Calendário indisponível";
      $("descricaoDia").textContent =
        "Atualize a página para carregar seus registros antes de marcar uma nova data.";
    } else if (existing) {
      $("tituloDia").textContent =
        existing.inicio === s
          ? "Início já registrado"
          : "Este dia pertence a um período registrado";
      $("configuracaoDia").textContent =
        "Esse período começou em " +
        format(existing.inicio) +
        ". Para corrigir a data ou a duração, use Editar este período.";
      $("editarPeriodoDia").onclick = () => {
        $("detalheDia").close();
        open(existing);
      };
    } else if (future) {
      $("tituloDia").textContent = "Previsão para este dia";
      $("configuracaoDia").textContent =
        "Marque o início apenas quando a menstruação realmente começar.";
    } else if (!history.length) {
      $("tituloDia").textContent = "Vamos conhecer seu ciclo?";
      $("registrarDia").textContent = "Fazer primeiro registro";
      $("descricaoDia").textContent =
        "Informe as características do seu ciclo uma única vez. Nas próximas menstruações, será só tocar na data e confirmar.";
      $("registrarDia").onclick = () => {
        $("detalheDia").close();
        open(null, s);
      };
    } else {
      $("tituloDia").textContent = "Sua menstruação começou?";
      $("descricaoDia").textContent =
        "Confirme o primeiro dia real do sangramento. O calendário será atualizado a partir desta data.";
      $("registrarDia").textContent = "Minha menstruação começou neste dia";
      $("configuracaoDia").textContent =
        "Usaremos as informações que você já registrou, inclusive sobre ciclos irregulares. Você não precisa preencher tudo novamente.";
      $("registrarDia").onclick = () => quickStart(s);
    }
    if (!$("detalheDia").open) $("detalheDia").showModal();
  }
  async function quickEnd(period) {
    if (quickSaving || !$("ultimoDiaSangramento").reportValidity()) return;
    quickSaving = true;
    const controls = [
      "registrarFimDia",
      "registrarDia",
      "editarPeriodoDia",
      "fecharDetalhe",
      "ultimoDiaSangramento",
    ];
    controls.forEach((id) => ($(id).disabled = true));
    $("erroDia").textContent = "";
    try {
      const calendar = await EV.json("/ciclo/" + period.id + "/fim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: $("ultimoDiaSangramento").value }),
      });
      update(calendar);
      clearUndo();
      $("detalheDia").close();
      $("statusCiclo").textContent =
        "Fim registrado! O calendário foi atualizado com a duração real deste período. Para corrigir, toque na data novamente.";
    } catch (error) {
      $("erroDia").textContent = error.status
        ? error.message
        : "Não foi possível salvar. Confira sua conexão e tente novamente.";
    } finally {
      quickSaving = false;
      controls.forEach((id) => ($(id).disabled = false));
    }
  }
  function clearUndo() {
    undoId = null;
    $("desfazerInicio").hidden = true;
  }
  async function quickStart(s) {
    if (quickSaving) return;
    quickSaving = true;
    $("registrarDia").disabled = true;
    $("fecharDetalhe").disabled = true;
    $("erroDia").textContent = "";
    $("registrarDia").textContent = "Atualizando seu calendário…";
    try {
      const result = await EV.json("/ciclo/inicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: s }),
      });
      update(result.calendario);
      clearUndo();
      if (result.criado) {
        undoId = result.registroId;
        $("desfazerInicio").hidden = false;
      }
      $("registroSection").hidden = true;
      $("detalheDia").close();
      $("statusCiclo").textContent = result.criado
        ? "Pronto! Início registrado em " +
          format(s) +
          ". Seu calendário se adaptou à nova data."
        : "Esse início já estava registrado. O calendário foi atualizado sem duplicar o registro.";
      const url = new URL(location.href);
      url.searchParams.delete("registro");
      history.replaceState(null, "", url);
    } catch (error) {
      $("erroDia").textContent = error.status
        ? error.message
        : "Não foi possível registrar agora. Confira sua conexão e tente novamente.";
    } finally {
      quickSaving = false;
      $("registrarDia").disabled = false;
      $("fecharDetalhe").disabled = false;
      $("registrarDia").textContent = "Minha menstruação começou neste dia";
    }
  }
  function irregular() {
    const enabled = $("irregular").value === "true";
    $("faixaIrregular").hidden = !enabled;
    $("duracaoMinima").required = enabled;
    $("duracaoMaxima").required = enabled;
  }
  function open(record = null, s = iso(today)) {
    clearUndo();
    editing = record?.id ?? null;
    $("cicloForm").reset();
    $("dataUltimaMenstruacao").value = record?.inicio ?? s;
    $("duracaoMenstruacao").value = record?.duracaoMenstruacao ?? 5;
    $("duracaoCiclo").value =
      record?.duracaoCiclo ?? data?.duracaoEstimada ?? 28;
    $("irregular").value = String(
      record?.irregular ?? data?.irregular ?? false,
    );
    $("duracaoMinima").value =
      record?.duracaoMinima ?? data?.duracaoMinima ?? 24;
    $("duracaoMaxima").value =
      record?.duracaoMaxima ?? data?.duracaoMaxima ?? 40;
    irregular();
    $("tituloFormulario").textContent = editing
      ? "Editar menstruação registrada"
      : "Registrar menstruação";
    $("registroSection").hidden = false;
    $("dataUltimaMenstruacao").focus();
  }
  async function load() {
    update(await EV.json("/ciclo/calendario"));
  }
  function update(calendar) {
    data = calendar;
    const hasHistory = Boolean(data.registros.length);
    const periodToday = data.registros.some((record) =>
      inRange(
        iso(today),
        record.inicio,
        add(record.inicio, record.duracaoMenstruacao - 1),
      ),
    );
    $("novoRegistro").textContent = !hasHistory
      ? "Fazer primeiro registro"
      : periodToday
        ? "Ver meu período"
        : "Minha menstruação começou hoje";
    $("ajustarCiclo").hidden = !hasHistory;
    $("ajudaRegistro").textContent = hasHistory
      ? "Toque na data para registrar o início ou o fim da menstruação. Informe o último dia de sangramento e o calendário se ajusta à duração real."
      : "Faça seu primeiro registro para salvar as características do ciclo. Depois, será só tocar na data em que a menstruação começar.";
    $("totalCiclos").textContent = data.registros.length;
    $("intervaloCiclo").textContent = !data.registros.length
      ? "Sem dados"
      : data.irregular
        ? data.duracaoMinima + " a " + data.duracaoMaxima + " dias"
        : data.duracaoEstimada + " dias";
    const next = data.previsoes.find((p) => p.inicioMaisTarde >= iso(today));
    $("proximoInicio").textContent = next
      ? data.irregular
        ? format(next.inicioMaisCedo) + " a " + format(next.inicioMaisTarde)
        : format(next.inicio)
      : "Sem estimativa";
    $("avisoCiclo").textContent =
      data.aviso +
      (data.intervalosObservados
        ? " Baseado em " +
          data.intervalosObservados +
          " intervalo(s) recente(s)."
        : " Ainda sem intervalos históricos completos.");
    $("atualizacaoPendente").hidden = !data.atualizacaoPendente;
    const rows = [...data.registros].reverse().map((r) => {
      const row = el("div", null, "history-row");
      const text = el("div", null, "history-text");
      text.append(
        el("strong", format(r.inicio)),
        el(
          "p",
          r.duracaoMenstruacao +
            (r.fimMenstruacao
              ? " dia(s) · fim em " + format(r.fimMenstruacao) + " · "
              : " dia(s) previstos · fim ainda não informado · ") +
            (r.irregular
              ? "ciclo informado como irregular"
              : "ciclo informado como regular"),
        ),
      );
      const edit = el("button", "Editar", "secundario");
      edit.addEventListener("click", () => open(r));
      const remove = el("button", "Excluir", "secundario");
      remove.addEventListener("click", async () => {
        if (!confirm("Excluir este registro e recalcular as previsões?"))
          return;
        remove.disabled = true;
        try {
          await EV.fetch("/ciclo/" + r.id, { method: "DELETE" });
          clearUndo();
          await load();
        } catch (e) {
          $("statusCiclo").textContent = e.message;
        } finally {
          remove.disabled = false;
        }
      });
      row.append(text, edit, remove);
      return row;
    });
    $("historicoCiclos").replaceChildren(...rows);
    if (!rows.length)
      $("historicoCiclos").append(el("p", "Nenhuma menstruação registrada."));
    render();
    document.dispatchEvent(new Event("ev:cycle-updated"));
  }
  $("dataUltimaMenstruacao").max = iso(today);
  $("novoRegistro").addEventListener("click", () =>
    data?.registros.length ? detail(iso(today)) : open(),
  );
  $("ajustarCiclo").addEventListener("click", () => {
    const latest = data?.registros.at(-1);
    if (latest) open(latest);
  });
  $("desfazerInicio").addEventListener("click", async () => {
    if (undoId == null) return;
    $("desfazerInicio").disabled = true;
    let removed = false;
    try {
      await EV.fetch("/ciclo/" + undoId, { method: "DELETE" });
      removed = true;
      clearUndo();
      await load();
      $("statusCiclo").textContent =
        "Registro desfeito. As previsões anteriores foram restauradas.";
    } catch (error) {
      $("statusCiclo").textContent = removed
        ? "Registro desfeito. Atualize a página para carregar o calendário."
        : error.message;
    } finally {
      $("desfazerInicio").disabled = false;
    }
  });
  $("cancelarRegistro").addEventListener("click", () => {
    $("registroSection").hidden = true;
  });
  $("irregular").addEventListener("change", irregular);
  $("fecharDetalhe").addEventListener("click", () => $("detalheDia").close());
  $("detalheDia").addEventListener("cancel", (event) => {
    if (quickSaving) event.preventDefault();
  });
  for (const [id, step] of [
    ["mesAnterior", -1],
    ["proximoMes", 1],
  ])
    $(id).addEventListener("click", () => {
      view = new Date(
        view.getFullYear() + ($("visao").value === "ano" ? step : 0),
        view.getMonth() + ($("visao").value === "ano" ? 0 : step),
        1,
      );
      render();
    });
  $("hoje").addEventListener("click", () => {
    view = new Date(today.getFullYear(), today.getMonth(), 1);
    render();
  });
  $("visao").addEventListener("change", render);
  $("cicloForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const irregular = $("irregular").value === "true";
    const body = {
      dataUltimaMenstruacao: $("dataUltimaMenstruacao").value,
      duracaoMenstruacao: Number($("duracaoMenstruacao").value),
      duracaoCiclo: Number($("duracaoCiclo").value),
      irregular,
      duracaoMinima: irregular ? Number($("duracaoMinima").value) : null,
      duracaoMaxima: irregular ? Number($("duracaoMaxima").value) : null,
    };
    $("salvarRegistro").disabled = true;
    $("statusCiclo").textContent = "";
    try {
      await EV.json(editing ? "/ciclo/" + editing : "/ciclo/calcular", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      $("registroSection").hidden = true;
      await load();
      $("statusCiclo").textContent =
        "Registro salvo. As previsões foram atualizadas.";
    } catch (e) {
      $("statusCiclo").textContent = e.message;
    } finally {
      $("salvarRegistro").disabled = false;
    }
  });
  EV.ready
    .then(async () => {
      await load();
      const record = new URLSearchParams(location.search).get("registro");
      if (record && /^\d{4}-\d{2}-\d{2}$/.test(record) && record <= iso(today))
        data.registros.length ? detail(record) : open(null, record);
    })
    .catch((e) => {
      $("statusCiclo").textContent = e.message;
      render();
    });
})();
