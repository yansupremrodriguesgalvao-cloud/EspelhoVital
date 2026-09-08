(function () {

    // Detecta se a página está dentro de /pages/ para montar os links corretamente
    const dentroDePages = window.location.pathname.includes("/pages/");
    const raiz = dentroDePages ? "../" : "";

    const nomeUsuario = localStorage.getItem("usuarioNome") || "Usuária";
    const inicial = nomeUsuario.trim().charAt(0).toUpperCase() || "U";

    const paginaAtual = window.location.pathname.split("/").pop();

    const itensMenu = [
        { href: raiz + "perfil-pronto.html", icon: "🏠", label: "Início", match: ["perfil-pronto.html"] },
        { href: raiz + "pages/ciclo.html", icon: "🌸", label: "Ciclo Menstrual", match: ["ciclo.html", "historico-menstrual.html"] },
        { href: raiz + "pages/humor.html", icon: "😊", label: "Registro de Humor", match: ["humor.html"] },
        { href: raiz + "pages/sono.html", icon: "😴", label: "Registro de Sono", match: ["sono.html", "historico.html"] },
        { href: raiz + "pages/consultas.html", icon: "🩺", label: "Consultas e Exames", match: ["consultas.html"] },
        { href: raiz + "pages/analise.html", icon: "📊", label: "Análise de Sono", match: ["analise.html"] },
        { href: raiz + "pages/analise-ia.html", icon: "🤖", label: "Análise Inteligente", match: ["analise-ia.html"] },
        { href: raiz + "pages/graficos.html", icon: "📈", label: "Gráficos", match: ["graficos.html"] },
        { href: raiz + "pages/recomendacoes.html", icon: "💡", label: "Recomendações de Sono", match: ["recomendacoes.html"] },
        { href: raiz + "pages/recomendacoes-personalizadas.html", icon: "✨", label: "Recomendações Personalizadas", match: ["recomendacoes-personalizadas.html"] },
        { href: raiz + "pages/assistant.html", icon: "🧠", label: "Assistente Vital", match: ["assistant.html"] }
    ];

    const linksHtml = itensMenu.map(item => {
        const ativo = item.match.includes(paginaAtual) ? " ev-active" : "";
        return `<a href="${item.href}" class="${ativo.trim()}">
                    <span class="ev-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>`;
    }).join("");

    const sidebarHtml = `
        <button id="ev-sidebar-toggle" aria-label="Abrir menu">☰</button>
        <div id="ev-sidebar-overlay"></div>
        <aside id="ev-sidebar">
            <div class="ev-brand">
                <img src="${raiz}assets/logo.png" alt="Espelho Vital">
                <span>Espelho Vital</span>
            </div>

            <div class="ev-user">
                <div class="ev-avatar">${inicial}</div>
                <div class="ev-user-info">
                    <div class="ev-user-name">${nomeUsuario}</div>
                    <a class="ev-user-link" href="${raiz}perfil-detalhes.html">Ver perfil</a>
                </div>
            </div>

            <nav>
                <div class="ev-section-title">Funcionalidades</div>
                ${linksHtml}
            </nav>

            <div class="ev-footer">
                <button class="ev-logout" id="ev-logout-btn">
                    <span>🚪</span> Sair da conta
                </button>
            </div>
        </aside>
    `;

    document.addEventListener("DOMContentLoaded", function () {
        document.body.insertAdjacentHTML("afterbegin", sidebarHtml);
        document.body.classList.add("ev-has-sidebar");

        const toggle = document.getElementById("ev-sidebar-toggle");
        const overlay = document.getElementById("ev-sidebar-overlay");
        const sidebar = document.getElementById("ev-sidebar");

        function fecharMenu() {
            sidebar.classList.remove("ev-open");
            document.body.classList.remove("ev-sidebar-open");
        }

        toggle.addEventListener("click", function () {
            sidebar.classList.toggle("ev-open");
            document.body.classList.toggle("ev-sidebar-open");
        });

        overlay.addEventListener("click", fecharMenu);

        document.getElementById("ev-logout-btn").addEventListener("click", function () {
            localStorage.removeItem("usuarioId");
            localStorage.removeItem("usuarioNome");
            localStorage.removeItem("usuarioEmail");
            window.location.href = raiz + "pages/login.html";
        });
    });

})();
