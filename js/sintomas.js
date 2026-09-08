const CHAVE_SINTOMAS = "registroSintomas";

const formSintomas = document.getElementById("sintomasForm");
const mensagem = document.getElementById("mensagem");

// Verifica se já existe um registro válido (últimas 24h)
(function verificarRegistro() {

    const salvo = localStorage.getItem(CHAVE_SINTOMAS);

    if (!salvo) return;

    const registro = JSON.parse(salvo);

    const agora = Date.now();

    const passou24Horas =
        agora - registro.dataHora > 24 * 60 * 60 * 1000;

    if (passou24Horas) {

        localStorage.removeItem(CHAVE_SINTOMAS);

        return;
    }

    // Ainda não passou 24 horas
    formSintomas.style.display = "none";

    mensagem.innerHTML = `
        <div style="
            background:#F3E8FF;
            color:#6D28D9;
            padding:18px;
            border-radius:15px;
            text-align:center;
            font-weight:bold;
        ">
            🌸 Você já registrou seus sintomas hoje.<br><br>
            Um novo registro ficará disponível em até 24 horas.
        </div>
    `;

})();

formSintomas.addEventListener("submit", function (e) {

    e.preventDefault();

    let sintomas = [];

    document
        .querySelectorAll(".sintoma-card input:checked")
        .forEach(item => {
            sintomas.push(item.value);
        });

    const fluxo = document.querySelector(
        "input[name='fluxo']:checked"
    );

    const registro = {

        data: document.getElementById("dataSintoma").value,

        sintomas: sintomas,

        observacao:
            document.getElementById("observacao").value,

        fluxo: fluxo ? fluxo.value : "",

        // horário atual
        dataHora: Date.now()

    };

    localStorage.setItem(
        CHAVE_SINTOMAS,
        JSON.stringify(registro)
    );

    formSintomas.style.display = "none";

    mensagem.innerHTML = `
        <div style="
            background:#E9FBEA;
            color:#2E7D32;
            padding:18px;
            border-radius:15px;
            text-align:center;
            font-weight:bold;
        ">
            ✅ Registro salvo com sucesso! 🌸<br><br>
            Você poderá registrar novamente daqui a 24 horas.
        </div>
    `;

});
