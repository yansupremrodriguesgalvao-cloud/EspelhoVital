async function carregarAnaliseIA() {

    try {

        const resposta = await fetch("http://localhost:8081/analise-ia");
        const dados = await resposta.json();

        document.getElementById("mediaSono").innerText =
            dados.mediaHorasSono != null ? `${dados.mediaHorasSono}h` : "--";

        document.getElementById("percentualRuim").innerText =
            dados.percentualNoitesRuins != null ? `${dados.percentualNoitesRuins}%` : "0%";

        document.getElementById("totalHumor").innerText = dados.totalRegistrosHumor ?? 0;

        const insightsEl = document.getElementById("listaInsights");
        const insights = dados.insights || [];

        insightsEl.innerHTML = insights.length
            ? insights.map(texto => `<p style="margin-bottom:10px;">${texto}</p>`).join("")
            : "<p>Sem insights disponíveis ainda.</p>";

        montarGraficoHumor(dados.distribuicaoHumor || {});

    } catch (erro) {

        console.error(erro);

        document.getElementById("listaInsights").innerHTML =
            "<p>❌ Não foi possível carregar a análise. O servidor está rodando?</p>";
    }
}

function montarGraficoHumor(distribuicao) {

    const canvas = document.getElementById("graficoHumor");
    if (!canvas) return;

    const labels = Object.keys(distribuicao);
    const valores = Object.values(distribuicao);

    if (!labels.length) return;

    const cores = [
        "#7c3aed", "#c084fc", "#3b82f6", "#22c55e",
        "#facc15", "#f97316", "#ef4444", "#ec4899"
    ];

    new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: labels.map((_, i) => cores[i % cores.length])
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", carregarAnaliseIA);
