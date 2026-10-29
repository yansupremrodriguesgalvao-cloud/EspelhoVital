(() => {
  const F = EVFeatures,
    $ = (id) => document.getElementById(id),
    today = F.iso(new Date());
  const moods = [
    "Feliz",
    "Tranquila",
    "Animada",
    "Cansada",
    "Ansiosa",
    "Triste",
    "Irritada",
    "Sensível",
  ];
  let selected = today,
    dirty = false,
    busy = false,
    sequence = 0,
    page = 0,
    history = [],
    importKey = null,
    legacy = null;
  const choice = (name, value, label) => {
    const item = F.el("label", null, "feature-choice"),
      input = F.el("input");
    input.type = "checkbox";
    input.name = name;
    input.value = value;
    item.append(input, F.el("span", label));
    return item;
  };
  Object.entries(F.symptoms).forEach(([code, label]) =>
    $("opcoesSintomas").append(choice("sintoma", code, label)),
  );
  moods.forEach((mood) => $("opcoesHumor").append(choice("humor", mood, mood)));
  const counter = () => {
    $("contadorObservacoes").textContent =
      $("observacoesDiario").value.length + " de 2.000 caracteres";
  };
  const markDirty = () => {
    dirty = true;
    $("alteracoesDiario").textContent = "Há alterações ainda não salvas.";
    counter();
  };
  $("diarioForm").addEventListener("input", markDirty);
  $("diarioForm").addEventListener("change", markDirty);
  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  function render(data) {
    $("diarioForm").reset();
    document.querySelectorAll("[data-humor-antigo]").forEach((e) => e.remove());
    $("fluxo").value = data.fluxo;
    $("intensidadeDor").value = data.intensidadeDor ?? "";
    $("horasSono").value = data.horasSono ?? "";
    $("qualidadeSono").value = data.qualidadeSono ?? "";
    $("observacoesDiario").value = data.observacoes ?? "";
    document
      .querySelectorAll("[name=sintoma]")
      .forEach(
        (input) => (input.checked = data.sintomas.includes(input.value)),
      );
    const states = (data.humor || "")
      .split(",")
      .map((v) =>
        v.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").trim(),
      )
      .filter(Boolean);
    states.forEach((state) => {
      const input = [...document.querySelectorAll("[name=humor]")].find(
        (n) => n.value.toLocaleLowerCase() === state.toLocaleLowerCase(),
      );
      if (input) input.checked = true;
      else {
        const extra = choice("humor", state, state);
        extra.dataset.humorAntigo = "true";
        extra.querySelector("input").checked = true;
        $("opcoesHumor").append(extra);
      }
    });
    $("excluirDia").hidden = !data.registrado;
    $("diarioEstado").textContent = data.registrado
      ? "Dia registrado · você pode atualizar quando quiser"
      : data.horasSono != null || data.humor
        ? "Sono ou humor já registrados nesta data"
        : "Ainda sem registro do diário nesta data";
    $("registrarInicioCiclo").href = "ciclo.html?registro=" + selected;
    $("dataDiario").value = selected;
    $("diaSeguinte").disabled = selected >= today;
    dirty = false;
    counter();
    $("alteracoesDiario").textContent =
      "Sono e humor são sincronizados com os históricos.";
  }
  async function load(date) {
    const token = ++sequence;
    let success = false;
    selected = date;
    $("diarioForm").inert = true;
    F.status("diarioMensagem", "Carregando seu dia…");
    try {
      const data = await EV.json("/diario/" + date);
      if (token !== sequence) return;
      render(data);
      success = true;
      F.status("diarioMensagem", "");
    } catch (error) {
      if (token === sequence) {
        F.status("diarioMensagem", error.message, true);
        $("diarioEstado").textContent = "Não foi possível carregar esta data.";
      }
    } finally {
      if (token === sequence) $("diarioForm").inert = !success;
    }
    return success;
  }
  async function choose(date) {
    if (busy) return;
    if (!date || date > today || date < "1900-01-01") {
      F.status("diarioMensagem", "Escolha uma data válida, até hoje.", true);
      $("dataDiario").value = selected;
      return;
    }
    if (
      dirty &&
      !confirm("Há alterações não salvas. Deseja trocar a data e descartá-las?")
    ) {
      $("dataDiario").value = selected;
      return;
    }
    await load(date);
  }
  $("dataDiario").max = today;
  $("dataDiario").min = "1900-01-01";
  $("dataDiario").addEventListener("change", (e) => choose(e.target.value));
  for (const [id, delta] of [
    ["diaAnterior", -1],
    ["diaSeguinte", 1],
  ])
    $(id).addEventListener("click", () => {
      const date = F.date(selected);
      date.setDate(date.getDate() + delta);
      choose(F.iso(date));
    });
  $("diaHoje").addEventListener("click", () => choose(today));
  async function loadHistory(reset) {
    if (reset) {
      page = 0;
      history = [];
    }
    const start = $("historicoInicio").value,
      end = $("historicoFim").value;
    if (start > end) {
      F.status(
        "diarioMensagem",
        "O início do período deve ser anterior ao fim.",
        true,
      );
      return;
    }
    $("maisDiario").disabled = true;
    try {
      const result = await EV.json(
        "/diario?" +
          new URLSearchParams({
            inicio: start,
            fim: end,
            pagina: page,
            tamanho: 15,
          }),
      );
      history.push(...result.registros);
      $("diarioHistorico").replaceChildren();
      for (const r of history) {
        const row = F.el("article", null, "diary-history-row"),
          info = F.el("div");
        info.append(F.el("strong", F.format(r.data)));
        const parts = [];
        if (r.fluxo !== "NAO_INFORMADO")
          parts.push("Fluxo: " + F.flows[r.fluxo]);
        if (r.intensidadeDor != null)
          parts.push("Dor: " + r.intensidadeDor + "/10");
        if (r.sintomas.length)
          parts.push(r.sintomas.map((s) => F.symptoms[s]).join(", "));
        if (r.horasSono != null) parts.push(r.horasSono + " h de sono");
        if (r.humor) parts.push(r.humor);
        info.append(F.el("p", parts.join(" · ") || "Observações do dia"));
        if (r.observacoes)
          info.append(
            F.el(
              "p",
              r.observacoes.length > 120
                ? r.observacoes.slice(0, 120) + "…"
                : r.observacoes,
            ),
          );
        const edit = F.el(
          "button",
          "Consultar / editar",
          "feature-button secondary",
        );
        edit.type = "button";
        edit.addEventListener("click", async () => {
          await choose(r.data);
          $("dataDiario").scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
        row.append(info, edit);
        $("diarioHistorico").append(row);
      }
      if (!history.length)
        $("diarioHistorico").append(
          F.el("p", "Nenhum dia registrado nesse período.", "feature-empty"),
        );
      $("maisDiario").hidden = !result.temProxima;
    } catch (error) {
      F.status("diarioMensagem", error.message, true);
      if (page > 0) page--;
    } finally {
      $("maisDiario").disabled = false;
    }
  }
  $("filtroDiario").addEventListener("submit", (e) => {
    e.preventDefault();
    loadHistory(true);
  });
  $("maisDiario").addEventListener("click", () => {
    page++;
    loadHistory(false);
  });
  $("diarioForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    $("salvarDia").disabled = true;
    $("dataDiario").disabled = true;
    const hours = $("horasSono").value;
    const body = {
      fluxo: $("fluxo").value,
      intensidadeDor:
        $("intensidadeDor").value === ""
          ? null
          : Number($("intensidadeDor").value),
      sintomas: [...document.querySelectorAll("[name=sintoma]:checked")].map(
        (e) => e.value,
      ),
      humor:
        [...document.querySelectorAll("[name=humor]:checked")]
          .map((e) => e.value)
          .join(", ") || null,
      horasSono: hours === "" ? null : Number(hours),
      qualidadeSono: hours === "" ? null : $("qualidadeSono").value,
      observacoes: $("observacoesDiario").value.trim() || null,
    };
    try {
      const result = await EV.json("/diario/" + selected, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      render(result);
      if (importKey && legacy?.data === selected) {
        localStorage.removeItem(importKey);
        $("importacaoAntiga").hidden = true;
        importKey = null;
      }
      F.status(
        "diarioMensagem",
        "Seu dia foi salvo. Os registros preenchidos estão sincronizados.",
      );
      await loadHistory(true);
    } catch (error) {
      F.status("diarioMensagem", error.message, true);
    } finally {
      busy = false;
      $("salvarDia").disabled = false;
      $("dataDiario").disabled = false;
    }
  });
  $("excluirDia").addEventListener("click", async () => {
    if (
      busy ||
      !confirm(
        "Excluir este registro do diário? Os registros de sono e humor vinculados a ele também serão removidos.",
      )
    )
      return;
    busy = true;
    $("excluirDia").disabled = true;
    try {
      await EV.fetch("/diario/" + selected, { method: "DELETE" });
      dirty = false;
      await load(selected);
      await loadHistory(true);
      F.status("diarioMensagem", "Registro excluído.");
    } catch (error) {
      F.status("diarioMensagem", error.message, true);
    } finally {
      busy = false;
      $("excluirDia").disabled = false;
    }
  });
  $("importarAntigo").addEventListener("click", async () => {
    if (
      !legacy?.data ||
      legacy.data > today ||
      !/^\d{4}-\d{2}-\d{2}$/.test(legacy.data)
    ) {
      F.status(
        "diarioMensagem",
        "O registro antigo não tem uma data válida. Ele foi mantido no dispositivo.",
        true,
      );
      return;
    }
    if (
      dirty &&
      !confirm("Descartar as alterações atuais para revisar o registro antigo?")
    )
      return;
    if (!(await load(legacy.data))) return;
    $("fluxo").value =
      Object.keys(F.flows).find(
        (k) => F.flows[k].toLowerCase() === (legacy.fluxo || "").toLowerCase(),
      ) || $("fluxo").value;
    const names = (legacy.sintomas || []).join(" ").toLocaleLowerCase();
    document.querySelectorAll("[name=sintoma]").forEach((input) => {
      if (names.includes(F.symptoms[input.value].toLocaleLowerCase()))
        input.checked = true;
    });
    if (legacy.observacao)
      $("observacoesDiario").value = [
        $("observacoesDiario").value,
        legacy.observacao,
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000);
    markDirty();
    F.status(
      "diarioMensagem",
      "Revise as informações e clique em Salvar meu dia. O original só será removido do dispositivo após salvar.",
    );
  });
  EV.ready
    .then(async (user) => {
      const query = new URLSearchParams(location.search).get("data");
      if (
        query &&
        /^\d{4}-\d{2}-\d{2}$/.test(query) &&
        query <= today &&
        query >= "1900-01-01"
      )
        selected = query;
      $("historicoInicio").value = selected.slice(0, 7) + "-01";
      $("historicoFim").value = selected > today ? today : selected;
      $("historicoInicio").max = today;
      $("historicoFim").max = today;
      const key = "registroSintomas:" + user?.id;
      try {
        const old = localStorage.getItem(key);
        if (old) {
          legacy = JSON.parse(old);
          importKey = key;
          $("importacaoAntiga").hidden = false;
        }
      } catch {}
      await load(selected);
      await loadHistory(true);
      if (location.hash)
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
    })
    .catch((error) => F.status("diarioMensagem", error.message, true));
})();
