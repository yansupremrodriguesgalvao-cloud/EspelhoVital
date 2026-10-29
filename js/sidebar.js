(() => {
  const root = location.pathname.includes("/pages/") ? "../" : "";
  const page = location.pathname.split("/").pop();
  const items = [
    ["perfil-pronto.html", "home", "Visão geral", ["perfil-pronto.html"]],
    [
      "pages/diario.html",
      "book",
      "Meu diário",
      ["diario.html", "sintomas.html"],
    ],
    [
      "pages/ciclo.html",
      "flower",
      "Ciclo menstrual",
      ["ciclo.html", "historico-menstrual.html"],
    ],
    ["pages/humor.html", "smile", "Como me sinto", ["humor.html"]],
    ["pages/sono.html", "moon", "Meu sono", ["sono.html", "historico.html"]],
    [
      "pages/consultas.html",
      "calendar",
      "Consultas e exames",
      ["consultas.html"],
    ],
    ["pages/analise.html", "chart", "Minha trajetória", ["analise.html"]],
    [
      "pages/recomendacoes.html",
      "sparkles",
      "Recomendações",
      ["recomendacoes.html"],
    ],
    ["pages/assistant.html", "message", "Assistente Vital", ["assistant.html"]],
    [
      "pages/relatorio.html",
      "file",
      "Resumo para consulta",
      ["relatorio.html"],
    ],
  ];
  function mount() {
    const icons = EVIcons.svg;
    const links = items
      .map(
        ([href, icon, label, pages], i) =>
          (i === 6
            ? '<div class="ev-section-title secondary">ENTENDER E CUIDAR</div>'
            : "") +
          `<a href="${root + href}" ${pages.includes(page) ? 'class="ev-active" aria-current="page"' : ""}><span class="ev-icon">${icons(icon)}</span><span>${label}</span></a>`,
      )
      .join("");
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<button id="ev-sidebar-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="ev-sidebar">${icons("menu")}</button><div id="ev-sidebar-overlay"></div><aside id="ev-sidebar" aria-label="Menu principal"><a class="ev-brand" href="${root}perfil-pronto.html"><img src="${root}assets/logo.png" alt=""><span><strong>Espelho Vital</strong><small>CUIDADO QUE CONECTA</small></span></a><nav aria-label="Navegação"><div class="ev-section-title">MEU ACOMPANHAMENTO</div>${links}</nav><div class="ev-sidebar-note">${icons("flower")}<strong>O seu ritmo importa.</strong>Um espaço para se conhecer e cuidar de você, um dia de cada vez.</div><div class="ev-user"><a class="ev-avatar" id="ev-avatar" href="${root}perfil-detalhes.html" aria-label="Abrir meu perfil">${icons("user")}</a><a class="ev-user-info" style="text-decoration:none;color:inherit" href="${root}pages/minha-conta.html"><div class="ev-user-name" id="ev-user-name">Minha conta</div><span class="ev-user-link">Conta e privacidade</span></a><button class="ev-logout" id="ev-logout-btn" aria-label="Sair da conta" title="Sair da conta">${icons("logout")}</button></div></aside>`,
    );
    document.body.classList.add("ev-has-sidebar");
    const toggle = document.getElementById("ev-sidebar-toggle"),
      sidebar = document.getElementById("ev-sidebar");
    function close() {
      sidebar.classList.remove("ev-open");
      document.body.classList.remove("ev-sidebar-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      toggle.innerHTML = icons("menu");
    }
    toggle.addEventListener("click", () => {
      if (sidebar.classList.contains("ev-open")) {
        close();
        return;
      }
      sidebar.classList.add("ev-open");
      document.body.classList.add("ev-sidebar-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fechar menu");
      toggle.innerHTML = icons("close");
    });
    document
      .getElementById("ev-sidebar-overlay")
      .addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("ev-open")) {
        close();
        toggle.focus();
      }
    });
    matchMedia("(min-width:801px)").addEventListener("change", (e) => {
      if (e.matches) close();
    });
    document
      .getElementById("ev-logout-btn")
      .addEventListener("click", async (e) => {
        e.currentTarget.disabled = true;
        try {
          await EV.logout();
        } catch (error) {
          e.target.closest("button").disabled = false;
          alert(error.message);
        }
      });
    EV.ready.then((user) => {
      const name =
        user?.nome || localStorage.getItem("usuarioNome") || "Minha conta";
      document.getElementById("ev-user-name").textContent = name;
      document.getElementById("ev-avatar").textContent = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
