(() => {
  const base = window.EV_CONFIG.apiBase.replace(/\/$/, "");
  const nativeFetch = window.fetch.bind(window);
  let csrfPromise;
  const publicPage =
    /(?:^|\/)(?:index|login|cadastro|recuperar-senha|redefinir-senha)\.html$/.test(
      location.pathname,
    ) || location.pathname.endsWith("/");
  const loginUrl = new URL(
    location.pathname.includes("/pages/") ? "login.html" : "pages/login.html",
    location.href,
  );
  function clearUser() {
    Object.keys(localStorage)
      .filter(
        (k) =>
          [
            "usuarioId",
            "usuarioNome",
            "usuarioEmail",
            "cicloVitalRegistro",
            "registroSintomas",
          ].includes(k) ||
          k.startsWith("registroSintomas:") ||
          k.startsWith("ev:aviso:"),
      )
      .forEach((k) => localStorage.removeItem(k));
  }
  async function csrf() {
    if (!csrfPromise)
      csrfPromise = nativeFetch(base + "/api/csrf", { credentials: "include" })
        .then(async (r) => {
          if (!r.ok)
            throw new Error("Não foi possível iniciar uma sessão segura.");
          return r.json();
        })
        .catch((e) => {
          csrfPromise = null;
          throw e;
        });
    return csrfPromise;
  }
  async function request(input, options = {}) {
    if (!publicPage) await ready;
    const url = new URL(
      input.startsWith("/") ? base + input : input,
      location.href,
    );
    if (url.origin !== new URL(base).origin)
      throw new Error("Destino de API inválido.");
    // The server determines ownership; legacy query parameters are unnecessary.
    url.searchParams.delete("usuarioId");
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const token = await csrf();
      headers.set(token.headerName, token.token);
    }
    const r = await nativeFetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: options.signal || AbortSignal.timeout(40000),
    });
    if (!r.ok) {
      const error = await r.json().catch(() => null);
      if (r.status === 401 && !publicPage && url.pathname !== "/api/logout") {
        clearUser();
        location.assign(loginUrl);
      }
      if (r.status === 403) csrfPromise = null;
      throw Object.assign(
        new Error(error?.mensagem || "Não foi possível concluir a operação."),
        { status: r.status },
      );
    }
    if (
      url.pathname === "/api/login" ||
      url.pathname === "/usuarios/face/login"
    ) {
      clearUser();
      const user = await r.clone().json();
      localStorage.setItem("usuarioId", user.id);
      localStorage.setItem("usuarioNome", user.nome);
      localStorage.setItem("usuarioEmail", user.email);
    }
    if (
      url.pathname === "/api/login" ||
      url.pathname === "/usuarios/face/login" ||
      url.pathname === "/api/logout"
    )
      csrfPromise = null;
    return r;
  }
  const ready = publicPage
    ? Promise.resolve(null)
    : nativeFetch(base + "/api/sessao", { credentials: "include" })
        .then(async (r) => {
          if (r.status === 401) {
            clearUser();
            location.assign(loginUrl);
            return null;
          }
          if (!r.ok) throw new Error("Não foi possível verificar a sessão.");
          const u = await r.json();
          localStorage.setItem("usuarioId", u.id);
          localStorage.setItem("usuarioNome", u.nome);
          localStorage.setItem("usuarioEmail", u.email);
          return u;
        })
        .catch(() => {
          document.addEventListener("DOMContentLoaded", () => {
            const p = document.createElement("p");
            p.setAttribute("role", "alert");
            p.textContent =
              "Não foi possível conectar ao servidor. Atualize a página para tentar novamente.";
            document.body.prepend(p);
          });
          return null;
        });
  window.EV = {
    base,
    ready,
    fetch: request,
    clearUser,
    escape(value) {
      const e = document.createElement("span");
      e.textContent = String(value ?? "");
      return e.innerHTML;
    },
    async json(input, options) {
      const r = await request(input, options);
      return r.status === 204 ? null : r.json();
    },
    async logout() {
      await request("/api/logout", { method: "POST" });
      clearUser();
      location.assign(loginUrl);
    },
  };
})();
