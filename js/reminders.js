(() => {
  let config = null,
    polling = false,
    timer = null;
  const root = location.pathname.includes("/pages/") ? "../" : "";
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  function ensureBell() {
    const header = document.querySelector(".header-tools");
    if (!header || document.getElementById("lembreteBotao")) return;
    const wrapper = el("div", null, "reminder-wrapper"),
      button = el("button", null, "reminder-bell");
    button.id = "lembreteBotao";
    button.type = "button";
    button.setAttribute("aria-label", "Meus lembretes");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = EVIcons.svg("bell");
    const badge = el("b", "");
    badge.id = "lembreteQuantidade";
    badge.hidden = true;
    button.append(badge);
    const panel = el("section", null, "reminder-popover");
    panel.id = "lembretePainel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Meus lembretes");
    button.setAttribute("aria-controls", panel.id);
    wrapper.append(button, panel);
    header.prepend(wrapper);
    button.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
        button.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
  }
  function render(notices) {
    const panel = document.getElementById("lembretePainel"),
      badge = document.getElementById("lembreteQuantidade");
    if (!panel) return;
    badge.hidden = !notices.length;
    badge.textContent = notices.length;
    panel.replaceChildren(el("h2", "Seus lembretes"));
    if (!notices.length)
      panel.append(
        el(
          "p",
          config?.preferencias.ativo
            ? "Nenhum lembrete pendente neste momento."
            : "Seus lembretes estão pausados.",
          "feature-muted",
        ),
      );
    for (const n of notices) {
      const item = el("article", null, "reminder-item");
      item.append(el("strong", n.titulo), el("p", n.descricao));
      const actions = el("div", null, "feature-actions"),
        link = el("a", "Abrir");
      link.href = root + n.caminho;
      const read = el("button", "Dispensar hoje");
      read.type = "button";
      read.addEventListener("click", async () => {
        read.disabled = true;
        try {
          await EV.fetch("/lembretes/lido", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chave: n.chave }),
          });
          await poll();
        } catch (error) {
          item.append(el("p", error.message));
          read.disabled = false;
        }
      });
      actions.append(link, read);
      item.append(actions);
      panel.append(item);
    }
    const settings = el("a", "Configurar lembretes");
    settings.href = root + "pages/minha-conta.html#lembretes";
    panel.append(settings);
  }
  function notify(notices) {
    if (
      !config?.preferencias.ativo ||
      !config.preferencias.navegadorAtivo ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    const user = localStorage.getItem("usuarioId"),
      zone = config.preferencias.fusoHorario,
      date = new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    for (const n of notices) {
      const key = "ev:aviso:" + user + ":" + date + ":" + n.chave;
      try {
        if (localStorage.getItem(key)) continue;
        const notification = new Notification("Seu momento de cuidado", {
          body: n.descricao,
          tag: key,
          icon: root + "assets/logo.png",
        });
        localStorage.setItem(key, "1");
        notification.onclick = () => {
          window.focus();
          location.assign(root + n.caminho);
          notification.close();
        };
      } catch {}
    }
    // Keep only a small local deduplication ledger. No health observations are stored here.
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith("ev:aviso:" + user + ":"))
      .sort();
    keys
      .slice(0, Math.max(0, keys.length - 100))
      .forEach((k) => localStorage.removeItem(k));
  }
  async function poll() {
    if (polling) return;
    polling = true;
    try {
      if (!config) config = await EV.json("/lembretes/config");
      const notices = config.preferencias.ativo
        ? await EV.json("/lembretes/hoje")
        : [];
      ensureBell();
      render(notices);
      notify(notices);
    } catch {
      const panel = document.getElementById("lembretePainel");
      if (panel) {
        panel.replaceChildren(
          el(
            "p",
            "Não foi possível consultar os lembretes agora.",
            "feature-muted",
          ),
        );
      }
    } finally {
      polling = false;
    }
  }
  document.addEventListener("ev:reminders-updated", () => {
    config = null;
    poll();
  });
  EV.ready.then((user) => {
    if (!user) return;
    ensureBell();
    poll();
    timer = setInterval(poll, 60000);
  });
  window.addEventListener("pagehide", () => clearInterval(timer));
})();
