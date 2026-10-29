const API = EV.base + "";

const CORES_HUMOR = [
  "#7c3aed",
  "#c084fc",
  "#3b82f6",
  "#22c55e",
  "#facc15",
  "#f97316",
  "#ef4444",
  "#ec4899",
];

function escapar(texto) {
  const d = document.createElement("div");
  d.textContent = texto ?? "";
  return d.innerHTML;
}

function avaliarSono(media) {
  if (media < 6) return "🔴 Crítico";
  if (media < 7) return "🟡 Abaixo do ideal";
  if (media <= 8.5) return "🟢 Saudável";
  return "⚠️ Excesso de sono";
}

async function buscar(caminho) {
  const resposta = await EV.fetch(`${API}${caminho}`);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} em ${caminho}`);
  return resposta.json();
}

function montarGraficoSono(registros) {
  const canvas = document.getElementById("graficoSono");
  if (!canvas || !registros.length) return;

  const categorias = ["Excelente", "Boa", "Regular", "Ruim"];
  const contagem = Object.fromEntries(categorias.map((c) => [c, 0]));

  registros.forEach((r) => {
    if (contagem[r.qualidade] !== undefined) contagem[r.qualidade]++;
  });

  const total = registros.length;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: categorias,
      datasets: [
        {
          label: "Registros de sono",
          data: categorias.map((c) => contagem[c]),
          backgroundColor: ["#22c55e", "#3b82f6", "#facc15", "#ef4444"],
          borderRadius: 8,
          maxBarThickness: 40,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.raw} registros (${((ctx.raw / total) * 100).toFixed(1)}%)`,
          },
        },
      },
      scales: {
        x: { ticks: { color: "#ffffff" }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0, color: "#ffffff" } },
      },
      animation: { duration: 900, easing: "easeOutQuart" },
    },
  });
}

function montarGraficoHumor(distribuicao) {
  const canvas = document.getElementById("graficoHumor");
  if (!canvas) return;

  const labels = Object.keys(distribuicao);
  if (!labels.length) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: Object.values(distribuicao),
          backgroundColor: labels.map(
            (_, i) => CORES_HUMOR[i % CORES_HUMOR.length],
          ),
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#ffffff" } } },
    },
  });
}

async function carregarAnalise() {
  const [ia, sono] = await Promise.allSettled([
    buscar("/analise-ia"),
    buscar("/sono"),
  ]);

  const insightsEl = document.getElementById("listaInsights");

  // ---- Dados de sono (estatísticas e gráfico) ----
  if (sono.status === "fulfilled") {
    const registros = sono.value;
    const total = registros.length;
    const media =
      total > 0 ? registros.reduce((s, r) => s + r.horas, 0) / total : null;

    document.getElementById("totalRegistros").textContent = total;
    document.getElementById("mediaSono").textContent =
      media != null ? `${media.toFixed(1)}h` : "--";
    document.getElementById("statusSono").textContent =
      media != null ? avaliarSono(media) : "--";

    montarGraficoSono(registros);
  }

  // ---- Análise inteligente (insights, humor) ----
  if (ia.status === "fulfilled") {
    const dados = ia.value;

    document.getElementById("percentualRuim").textContent =
      dados.percentualNoitesRuins != null
        ? `${dados.percentualNoitesRuins}%`
        : "0%";
    document.getElementById("totalHumor").textContent =
      dados.totalRegistrosHumor ?? 0;

    const insights = dados.insights || [];
    insightsEl.innerHTML = insights.length
      ? insights
          .map((t) => `<p style="margin-bottom:10px;">${escapar(t)}</p>`)
          .join("")
      : "<p>Sem insights disponíveis ainda.</p>";

    montarGraficoHumor(dados.distribuicaoHumor || {});
  } else {
    console.error(ia.reason);
    insightsEl.innerHTML =
      "<p>❌ Não foi possível carregar a análise. O servidor está rodando?</p>";
  }
}

document.addEventListener("DOMContentLoaded", carregarAnalise);
