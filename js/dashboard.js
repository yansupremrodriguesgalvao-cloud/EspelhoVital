(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseDate = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const formatDate = (s) =>
    s
      ? parseDate(s)
          .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
          .replace(".", "")
      : "";
  const clean = (s) =>
    String(s || "")
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
      .trim();
  const element = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  const icon = (name) => {
    const span = element("span");
    span.innerHTML = EVIcons.svg(name);
    return span;
  };
  let loading = false;

  function checkIn(id, done, text) {
    const mark = $(id);
    mark.classList.toggle("complete", done);
    mark.innerHTML = EVIcons.svg(done ? "check" : "plus");
    $(id + "Texto").textContent = text;
  }

  function weeklySleep(records, failed) {
    const area = $("graficoSemana");
    area.replaceChildren();
    if (failed) {
      area.append(
        element(
          "p",
          "Não foi possível carregar esta parte do resumo.",
          "week-unavailable",
        ),
      );
      $("resumoSemana").textContent = "Você pode tentar atualizar o painel.";
      return;
    }
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 6 + i);
      return d;
    });
    let count = 0;
    days.forEach((day) => {
      const values = records.filter(
        (r) => r.dataRegistro === iso(day) && Number.isFinite(r.horas),
      );
      const average = values.length
        ? values.reduce((sum, r) => sum + r.horas, 0) / values.length
        : null;
      if (average !== null) count++;
      const column = element(
        "div",
        null,
        "chart-column" + (iso(day) === iso(today) ? " is-today" : ""),
      );
      column.title =
        day.toLocaleDateString("pt-BR") +
        ": " +
        (average === null
          ? "sem registro"
          : average.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
            " horas");
      column.setAttribute("aria-label", column.title);
      column.append(
        element(
          "span",
          average === null
            ? "—"
            : average.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
                "h",
          "chart-value",
        ),
      );
      const bar = element(
        "span",
        null,
        "bar" + (average === null ? " chart-missing" : ""),
      );
      if (average !== null)
        bar.style.height =
          Math.max(4, Math.min(90, (average / 12) * 90)) + "px";
      column.append(
        bar,
        element(
          "span",
          iso(day) === iso(today)
            ? "hoje"
            : day
                .toLocaleDateString("pt-BR", { weekday: "short" })
                .replace(".", ""),
          "chart-day",
        ),
      );
      area.append(column);
    });
    $("resumoSemana").textContent = count
      ? `${count} de 7 dias com sono registrado`
      : "Seus registros vão dar forma a este espaço.";
  }

  function appointments(data) {
    const area = $("ev-lista-consultas");
    area.replaceChildren();
    $("cardTotalConsultas").textContent = data.totalConsultasProximas ?? 0;
    if (!data.proximasConsultas?.length) {
      const box = element("div", null, "empty-state");
      box.append(
        icon("calendar"),
        element("strong", "Sua agenda está tranquila."),
        element(
          "p",
          "Adicione uma consulta ou exame e acompanhe os próximos compromissos aqui.",
        ),
      );
      area.append(box);
      return;
    }
    data.proximasConsultas.slice(0, 3).forEach((c) => {
      const row = element("div", null, "appointment");
      const date = element("div", null, "appointment-date");
      const when = parseDate(c.dataAgendada);
      date.append(
        element("strong", String(when.getDate()).padStart(2, "0")),
        element(
          "small",
          when.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        ),
      );
      const info = element("div", null, "appointment-info");
      const name = element("strong", c.titulo);
      name.title = c.titulo;
      const countdown =
        c.diasRestantes === 0
          ? "Hoje"
          : c.diasRestantes === 1
            ? "Amanhã"
            : `Em ${c.diasRestantes} dias`;
      info.append(
        name,
        element(
          "p",
          countdown +
            (c.horaAgendada ? " · " + c.horaAgendada.slice(0, 5) : ""),
        ),
      );
      row.append(
        date,
        info,
        element(
          "span",
          c.tipo === "EXAME" ? "Exame" : "Consulta",
          "appointment-type",
        ),
      );
      area.append(row);
    });
  }

  function focus(data, moodDone, sleepDone) {
    const next = data.proximasConsultas?.[0];
    let title,
      text,
      label,
      href,
      note = "Um registro simples já ajuda a conhecer sua rotina.";
    if (next && next.diasRestantes <= 1) {
      title =
        next.diasRestantes === 0
          ? "Um cuidado marcado para hoje."
          : "Seu próximo cuidado está chegando.";
      text =
        next.titulo +
        (next.horaAgendada ? " · " + next.horaAgendada.slice(0, 5) : "") +
        ". Confira os detalhes e se organize com calma.";
      label = "Ver meu compromisso";
      href = "consultas";
    } else if (/atualiz/i.test(data.faseCicloAtual || "")) {
      title = "Seu ciclo segue o seu ritmo.";
      text =
        "A estimativa anterior passou. Quando a menstruação começar, registre a data real para atualizar o calendário.";
      label = "Acompanhar meu ciclo";
      href = "ciclo";
      note = "Uma previsão é uma estimativa, não uma confirmação.";
    } else if (!moodDone) {
      title = "Como você está se sentindo?";
      text =
        "Faça uma pausa para se ouvir. Um pequeno registro ajuda a perceber o que muda de um dia para o outro.";
      label = "Registrar meu humor";
      href = "diario#humor";
    } else if (!sleepDone) {
      title = "Seu descanso também merece espaço.";
      text =
        "Seu humor de hoje já está registrado. Conte como foi sua noite para completar esse olhar sobre o dia.";
      label = "Registrar meu sono";
      href = "diario#sono";
    } else {
      title = "Você já reservou um momento seu.";
      text =
        "Sono e humor registrados hoje. Explore sua trajetória com calma e observe o que faz sentido para você.";
      label = "Ver minha trajetória";
      href = "analise";
      note = "Mais cuidado, sem metas ou cobranças.";
    }
    $("focoTitulo").textContent = title;
    $("focoTexto").textContent = text;
    $("focoAcaoTexto").textContent = label;
    $("focoAcao").href =
      "pages/" +
      href.split("#")[0] +
      ".html" +
      (href.includes("#") ? "#" + href.split("#")[1] : "");
    $("focoRodape").textContent = note;
  }

  async function load() {
    if (loading) return;
    loading = true;
    $("conteudo").setAttribute("aria-busy", "true");
    $("dashboardErro").hidden = true;
    try {
      const profile = await EV.ready;
      if (profile?.nome) {
        const hour = new Date().getHours();
        $("saudacao").textContent =
          (hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite") +
          ", " +
          profile.nome.trim().split(/\s+/)[0] +
          ".";
      }
      const [summary, sleep] = await Promise.allSettled([
        EV.json("/dashboard"),
        EV.json("/sono/historico?pagina=0&tamanho=100"),
      ]);
      if (summary.status !== "fulfilled") throw summary.reason;
      const data = summary.value;
      const records = sleep.status === "fulfilled" ? sleep.value.registros : [];
      const moodDone = data.dataUltimoHumor === iso(today),
        sleepDone = records.some((r) => r.dataRegistro === iso(today));
      checkIn(
        "checkHumor",
        moodDone,
        moodDone
          ? "Registrado hoje. Como você está agora?"
          : "Registrar meu humor",
      );
      checkIn(
        "checkSono",
        sleepDone,
        sleepDone ? "Registrado hoje. Ver meu histórico" : "Registrar meu sono",
      );
      const checks = Number(moodDone) + Number(sleepDone);
      $("checkResumo").textContent =
        checks === 2
          ? "Seu check-in de hoje está completo."
          : checks === 1
            ? "Um momento de cuidado já registrado."
            : "Um dia de cada vez, no seu ritmo.";
      const phase = clean(data.faseCicloAtual);
      $("cardFaseCiclo").textContent = phase
        ? phase.replace(" — consulte o calendário", "")
        : "Conheça seu ciclo";
      if (data.proximaMenstruacaoMinima && data.proximaMenstruacaoMaxima)
        $("cardProximaMenstruacao").textContent =
          "Início possível: " +
          formatDate(data.proximaMenstruacaoMinima) +
          " a " +
          formatDate(data.proximaMenstruacaoMaxima);
      else if (data.proximaMenstruacao)
        $("cardProximaMenstruacao").textContent =
          "Próximo início estimado: " + formatDate(data.proximaMenstruacao);
      else
        $("cardProximaMenstruacao").textContent =
          "Registre o início para acompanhar as próximas estimativas.";
      $("cardMediaSono").textContent =
        data.totalRegistrosSono && data.mediaHorasSono != null
          ? Number(data.mediaHorasSono).toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            }) + " h"
          : "Ainda sem registros";
      $("cardTotalSono").textContent = data.totalRegistrosSono
        ? "Média registrada · último registro: " +
          (data.ultimaQualidadeSono || "sem classificação")
        : "Como foi sua noite? Comece com um registro.";
      const moods = clean(data.ultimoHumor)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      $("cardUltimoHumor").textContent = moods.length
        ? moods.slice(0, 2).join(" · ") +
          (moods.length > 2 ? " +" + (moods.length - 2) : "")
        : "Um momento para você";
      $("cardUltimoHumor").title = clean(data.ultimoHumor);
      $("cardDataHumor").textContent = data.dataUltimoHumor
        ? moodDone
          ? "Registrado hoje"
          : "Último registro em " + formatDate(data.dataUltimoHumor)
        : "Seu espaço para reconhecer o que sente.";
      appointments(data);
      weeklySleep(records, sleep.status !== "fulfilled");
      focus(data, moodDone, sleepDone);
    } catch (error) {
      $("dashboardErro").hidden = false;
      document
        .querySelectorAll(".metric-card h3")
        .forEach((e) => (e.textContent = "Resumo indisponível"));
      $("focoTitulo").textContent = "Seu espaço de cuidado continua aqui.";
      $("focoTexto").textContent =
        "Não foi possível carregar o resumo agora. Você pode tentar novamente ou acessar seus registros pelo menu.";
      $("ev-lista-consultas").replaceChildren(
        element("p", "Não foi possível consultar a agenda.", "muted"),
      );
      $("cardTotalConsultas").textContent = "—";
      weeklySleep([], true);
    } finally {
      loading = false;
      $("conteudo").setAttribute("aria-busy", "false");
    }
  }
  $("dataHoje").dateTime = iso(today);
  $("dataHoje").textContent = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  $("tentarNovamente").addEventListener("click", load);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load);
  else load();
})();
