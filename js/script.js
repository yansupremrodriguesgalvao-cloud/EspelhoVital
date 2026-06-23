const API = "http://localhost:8081/sono";

// ================= SALVAR SONO =================
async function salvarSono() {
    const horas = document.getElementById("horas").value;
    const qualidade = document.getElementById("qualidade").value;

    if (!horas) {
        alert("Informe as horas!");
        return;
    }

    const data = {
        horas: Number(horas),
        qualidade
    };

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("✔ Salvo com sucesso!");
            window.location.href = "../index.html";
        } else {
            alert("❌ Erro ao salvar");
        }

    } catch (err) {
        console.error(err);
        alert("❌ Erro de conexão");
    }
}

// ================= DASHBOARD =================
async function carregarDashboard() {

    try {
        const res = await fetch(API);
        const data = await res.json();

        const total = data.length;

        document.getElementById("totalRegistros").innerText = total;

        if (total > 0) {

            const ultimo = data[data.length - 1];

            document.getElementById("mediaSono").innerText =
                calcularMedia(data) + "h";

            document.getElementById("ultimoSono").innerText =
                ultimo.horas + "h";

            let status = "";

            if (ultimo.horas < 6) status = "⚠️ Ruim";
            else if (ultimo.horas <= 9) status = "✅ Bom";
            else status = "😴 Alto";

            document.getElementById("statusSono").innerText = status;
        }

    } catch (err) {
        console.error("Erro dashboard:", err);
    }
}

// ================= MÉDIA =================
function calcularMedia(data) {
    let total = 0;

    data.forEach(i => total += i.horas);

    return (total / data.length).toFixed(1);
}

// iniciar
carregarDashboard();