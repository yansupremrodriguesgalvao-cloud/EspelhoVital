(() => {
  const F = EVFeatures,
    $ = (id) => document.getElementById(id);
  let pending = null,
    working = false;
  function tab(name) {
    const reminder = name !== "privacidade";
    $("painelLembretes").hidden = !reminder;
    $("painelPrivacidade").hidden = reminder;
    for (const [id, active] of [
      ["tabLembretes", reminder],
      ["tabPrivacidade", !reminder],
    ]) {
      $(id).setAttribute("aria-selected", String(active));
      $(id).tabIndex = active ? 0 : -1;
    }
    history.replaceState(
      null,
      "",
      "#" + (reminder ? "lembretes" : "privacidade"),
    );
  }
  $("tabLembretes").addEventListener("click", () => tab("lembretes"));
  $("tabPrivacidade").addEventListener("click", () => tab("privacidade"));
  document.querySelector("[role=tablist]").addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const target =
        e.key === "Home"
          ? "lembretes"
          : e.key === "End"
            ? "privacidade"
            : $("painelLembretes").hidden
              ? "lembretes"
              : "privacidade";
      tab(target);
      $(target === "lembretes" ? "tabLembretes" : "tabPrivacidade").focus();
    }
  });
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  days.forEach((label, i) => {
    const wrapper = F.el("label", null, "feature-choice"),
      input = F.el("input");
    input.type = "checkbox";
    input.name = "diaSemana";
    input.value = i + 1;
    wrapper.append(input, F.el("span", label));
    $("diasSemanaLembrete").append(wrapper);
  });
  const zones = [
    ...new Set([
      "America/Sao_Paulo",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(Intl.supportedValuesOf
        ? Intl.supportedValuesOf("timeZone")
        : ["UTC"]),
    ]),
  ].filter(Boolean);
  zones.forEach((zone) => {
    const option = F.el("option", zone.replaceAll("_", " "));
    option.value = zone;
    $("fusoLembrete").append(option);
  });
  const permission = () => {
    $("permissaoMensagem").textContent = !("Notification" in window)
      ? "Este navegador não oferece notificações."
      : Notification.permission === "granted"
        ? "Notificações permitidas neste navegador."
        : Notification.permission === "denied"
          ? "Notificações bloqueadas. Você pode liberar nas configurações do navegador."
          : "A permissão será solicitada apenas ao clicar no botão.";
  };
  $("permitirNotificacoes").addEventListener("click", async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      if (result === "granted") $("navegadorLembrete").checked = true;
    }
    permission();
  });
  async function loadPreferences() {
    const config = await EV.json("/lembretes/config"),
      p = config.preferencias;
    for (const [id, key] of [
      ["lembretesAtivos", "ativo"],
      ["lembreteDiario", "diario"],
      ["lembreteSono", "sono"],
      ["lembreteConsultas", "consultas"],
      ["lembreteCiclo", "ciclo"],
      ["navegadorLembrete", "navegadorAtivo"],
      ["emailLembrete", "emailAtivo"],
    ])
      $(id).checked = p[key];
    $("horarioLembrete").value = p.horario.slice(0, 5);
    $("fusoLembrete").value = p.fusoHorario;
    $("diasConsulta").value = p.antecedenciaConsulta;
    $("diasCiclo").value = p.antecedenciaCiclo;
    document
      .querySelectorAll("[name=diaSemana]")
      .forEach((e) => (e.checked = p.diasSemana.includes(Number(e.value))));
    $("emailLembrete").disabled = !config.emailDisponivel;
    $("emailDisponibilidade").textContent = config.emailDisponivel
      ? "Um resumo discreto por dia, mesmo com o site fechado."
      : "Envio por e-mail indisponível: o servidor ainda precisa de configuração SMTP.";
    permission();
  }
  $("lembretesForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const selected = [
      ...document.querySelectorAll("[name=diaSemana]:checked"),
    ].map((e) => Number(e.value));
    if (!selected.length) {
      F.status(
        "lembretesMensagem",
        "Escolha pelo menos um dia da semana.",
        true,
      );
      return;
    }
    if (
      $("navegadorLembrete").checked &&
      (!("Notification" in window) || Notification.permission !== "granted")
    ) {
      F.status(
        "lembretesMensagem",
        "Permita as notificações ou desmarque essa opção.",
        true,
      );
      return;
    }
    const body = {
      ativo: $("lembretesAtivos").checked,
      diario: $("lembreteDiario").checked,
      sono: $("lembreteSono").checked,
      consultas: $("lembreteConsultas").checked,
      ciclo: $("lembreteCiclo").checked,
      navegadorAtivo: $("navegadorLembrete").checked,
      emailAtivo: $("emailLembrete").checked,
      horario: $("horarioLembrete").value,
      fusoHorario: $("fusoLembrete").value,
      diasSemana: selected,
      antecedenciaConsulta: Number($("diasConsulta").value),
      antecedenciaCiclo: Number($("diasCiclo").value),
    };
    $("salvarLembretes").disabled = true;
    try {
      await EV.json("/lembretes/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      F.status(
        "lembretesMensagem",
        body.ativo
          ? "Preferências salvas. Você pode pausar quando quiser."
          : "Preferências salvas. Seus lembretes estão pausados.",
      );
      document.dispatchEvent(new Event("ev:reminders-updated"));
    } catch (error) {
      F.status("lembretesMensagem", error.message, true);
    } finally {
      $("salvarLembretes").disabled = false;
    }
  });
  async function privacy() {
    const data = await EV.json("/conta/privacidade");
    $("privacidadeContagens").replaceChildren();
    const labels = {
      diario: "dias no diário",
      sono: "registros de sono",
      humor: "registros de humor",
      ciclos: "inícios menstruais",
      consultas: "consultas e exames",
    };
    const singular = {
      diario: "dia no diário",
      sono: "registro de sono",
      humor: "registro de humor",
      ciclos: "início menstrual",
      consultas: "consulta ou exame",
    };
    Object.entries(data.registros).forEach(([key, value]) => {
      const span = F.el("span");
      span.append(
        F.el("strong", value),
        " " + (value === 1 ? singular[key] : labels[key]),
      );
      $("privacidadeContagens").append(span);
    });
    $("biometriaEstado").textContent = data.biometriaCadastrada
      ? "Há um descritor facial vinculado à sua conta."
      : "Você não tem cadastro facial.";
    $("excluirBiometria").disabled = !data.biometriaCadastrada;
  }
  const actions = {
    export: {
      title: "Baixar meus dados",
      description:
        "O arquivo contém suas informações pessoais. Ele não inclui senha ou tokens.",
      label: "Baixar JSON",
    },
    face: {
      title: "Excluir cadastro facial",
      description:
        "Seu descritor será removido. O acesso por e-mail e senha continua disponível.",
      label: "Excluir cadastro facial",
    },
    health: {
      title: "Apagar registros de saúde",
      description:
        "Remove diário, sono, humor, ciclos, consultas e histórico de lembretes. Mantém conta, perfil e cadastro facial. Os lembretes serão pausados.",
      phrase: "APAGAR MEUS REGISTROS",
      label: "Apagar registros",
    },
    account: {
      title: "Excluir minha conta",
      description:
        "A conta e todos os dados vinculados serão removidos permanentemente. Esta ação não pode ser desfeita.",
      phrase: "EXCLUIR MINHA CONTA",
      label: "Excluir conta permanentemente",
    },
  };
  for (const [id, action] of [
    ["exportarDados", "export"],
    ["excluirBiometria", "face"],
    ["apagarRegistros", "health"],
    ["excluirConta", "account"],
  ])
    $(id).addEventListener("click", () => {
      pending = action;
      const data = actions[action];
      $("confirmacaoForm").reset();
      $("confirmacaoTitulo").textContent = data.title;
      $("confirmacaoDescricao").textContent = data.description;
      $("fraseGrupo").hidden = !data.phrase;
      $("frasePrivacidade").required = Boolean(data.phrase);
      $("fraseRotulo").textContent = data.phrase
        ? "Digite: " + data.phrase
        : "";
      $("executarPrivacidade").textContent = data.label;
      $("executarPrivacidade").classList.toggle(
        "danger",
        action === "account" || action === "health",
      );
      F.status("confirmacaoMensagem", "");
      $("confirmarPrivacidade").showModal();
      $("senhaPrivacidade").focus();
    });
  $("cancelarPrivacidade").addEventListener("click", () => {
    if (!working) $("confirmarPrivacidade").close();
  });
  $("confirmarPrivacidade").addEventListener("close", () => {
    $("senhaPrivacidade").value = "";
    $("frasePrivacidade").value = "";
    pending = null;
  });
  $("confirmarPrivacidade").addEventListener("cancel", (e) => {
    if (working) e.preventDefault();
  });
  $("confirmacaoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!pending || working) return;
    const action = pending,
      data = actions[action],
      password = $("senhaPrivacidade").value;
    if (data.phrase && $("frasePrivacidade").value !== data.phrase) {
      F.status(
        "confirmacaoMensagem",
        "Digite a frase de confirmação exatamente como indicada.",
        true,
      );
      return;
    }
    working = true;
    $("executarPrivacidade").disabled = true;
    $("cancelarPrivacidade").disabled = true;
    try {
      if (action === "export") {
        const response = await EV.fetch("/conta/exportar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senha: password,
            incluirBiometria: $("exportarBiometria").checked,
          }),
        });
        F.download(
          await response.blob(),
          "espelho-vital-meus-dados-" + F.iso(new Date()) + ".json",
        );
      } else {
        await EV.fetch(
          action === "account"
            ? "/conta"
            : action === "health"
              ? "/conta/dados"
              : "/conta/biometria",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senha: password,
              confirmacao: data.phrase || null,
            }),
          },
        );
      }
      $("confirmarPrivacidade").close();
      if (action === "account") {
        EV.clearUser();
        location.assign("login.html");
        return;
      }
      if (action === "health") {
        const owner = localStorage.getItem("usuarioId");
        Object.keys(localStorage)
          .filter(
            (k) =>
              k === "registroSintomas:" + owner ||
              k.startsWith("ev:aviso:" + owner + ":"),
          )
          .forEach((k) => localStorage.removeItem(k));
        await loadPreferences();
        document.dispatchEvent(new Event("ev:reminders-updated"));
      }
      await privacy();
      F.status(
        "privacidadeMensagem",
        action === "export"
          ? "Sua cópia está pronta para salvar."
          : action === "face"
            ? "Cadastro facial excluído."
            : "Registros apagados e lembretes pausados.",
      );
    } catch (error) {
      F.status("confirmacaoMensagem", error.message, true);
    } finally {
      working = false;
      $("executarPrivacidade").disabled = false;
      $("cancelarPrivacidade").disabled = false;
    }
  });
  tab(location.hash === "#privacidade" ? "privacidade" : "lembretes");
  $("lembretesForm").inert = true;
  EV.ready.then(async () => {
    const results = await Promise.allSettled([loadPreferences(), privacy()]);
    if (results[0].status === "rejected")
      F.status("lembretesMensagem", results[0].reason.message, true);
    else $("lembretesForm").inert = false;
    if (results[1].status === "rejected")
      F.status("privacidadeMensagem", results[1].reason.message, true);
  });
})();
