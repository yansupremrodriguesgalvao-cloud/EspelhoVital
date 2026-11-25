// Cole aqui a URL HTTPS do seu backend no Render, sem /api no final.
const renderUrl = "https://espelhovital-back-r859.onrender.com";

const apiGroups = [
    "api", "usuarios", "ciclo", "consultas", "sono", "humor", "dashboard",
    "diario", "lembretes", "relatorios", "conta", "analise-ia", "recomendacoes", "grok"
];
const apiPaths = apiGroups.flatMap(group => [`/${group}`, `/${group}/:path*`]);

export const config = {
    framework: null,
    buildCommand: null,
    outputDirectory: ".",
    cleanUrls: false,
    rewrites: apiPaths.map(source => ({
        source,
        destination: new URL(source, renderUrl).href
    })),
    headers: apiPaths.map(source => ({
        source,
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
    }))
};
