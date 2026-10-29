(() => {
  const state = new Map();
  window.EVHistory = {
    async render(containerId, resource, kind, reset = false) {
      const area = document.getElementById(containerId);
      if (!area) return;
      if (reset) state.delete(containerId);
      let current = state.get(containerId) || { page: 0, items: [] };
      try {
        const data = await EV.json(
          "/" + resource + "/historico?pagina=" + current.page + "&tamanho=20",
        );
        current.items.push(...data.registros);
        state.set(containerId, current);
        area.replaceChildren();
        for (const r of current.items) {
          const card = document.createElement(kind === "humor" ? "li" : "div");
          card.className = "card";
          const title = document.createElement("strong");
          title.textContent = kind === "humor" ? r.estado : r.horas + " horas";
          const text = document.createElement("p");
          text.textContent =
            kind === "humor" ? r.observacao || "" : "Qualidade: " + r.qualidade;
          const date = document.createElement("small");
          date.textContent = r.dataRegistro
            ? r.dataRegistro.split("-").reverse().join("/")
            : "";
          card.append(title, text, date);
          area.append(card);
        }
        if (!current.items.length) {
          const p = document.createElement("p");
          p.textContent = "Nenhum registro encontrado.";
          area.append(p);
        }
        if (data.temProxima) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = "Carregar mais";
          button.addEventListener("click", () => {
            button.disabled = true;
            current.page++;
            EVHistory.render(containerId, resource, kind);
          });
          area.append(button);
        }
      } catch (e) {
        const p = document.createElement("p");
        p.textContent = e.message;
        area.append(p);
      }
    },
  };
})();
