const MODEL_URL_LOGIN = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
const API_LOGIN_FACIAL = "http://localhost:8081/usuarios/face/login";

const btnAbrirFacial = document.getElementById("btnAbrirFacial");
const facialLoginBox = document.getElementById("facialLoginBox");
const videoLogin = document.getElementById("video");
const overlayMsgLogin = document.getElementById("facialOverlayMsg");
const btnCapturarLogin = document.getElementById("btnCapturarLogin");
const feedbackLogin = document.getElementById("facialFeedback");

let modelosCarregados = false;

async function carregarModelosLogin() {
    if (modelosCarregados) return true;

    if (typeof faceapi === "undefined") {
        overlayMsgLogin.textContent = "❌ Não foi possível carregar a biblioteca de reconhecimento facial.";
        return false;
    }

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL_LOGIN),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL_LOGIN),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL_LOGIN)
        ]);
        modelosCarregados = true;
        return true;
    } catch (erro) {
        console.error(erro);
        overlayMsgLogin.textContent = "❌ Não foi possível carregar os modelos. Verifique sua conexão com a internet.";
        return false;
    }
}

async function ligarCameraLogin() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoLogin.srcObject = stream;
    } catch (erro) {
        console.error(erro);
        overlayMsgLogin.textContent = "❌ Não consegui acessar sua câmera. Verifique as permissões do navegador.";
    }
}

if (btnAbrirFacial) {
    btnAbrirFacial.addEventListener("click", async () => {

        const abrindo = facialLoginBox.style.display === "none";
        facialLoginBox.style.display = abrindo ? "block" : "none";

        if (!abrindo) return;

        overlayMsgLogin.classList.remove("oculto");
        overlayMsgLogin.textContent = "⏳ Carregando modelos de reconhecimento...";
        btnCapturarLogin.disabled = true;

        const ok = await carregarModelosLogin();
        if (!ok) return;

        await ligarCameraLogin();

        overlayMsgLogin.classList.add("oculto");
        btnCapturarLogin.disabled = false;
    });
}

if (btnCapturarLogin) {
    btnCapturarLogin.addEventListener("click", async () => {

        feedbackLogin.style.color = "";
        feedbackLogin.innerText = "🔎 Procurando seu rosto...";
        btnCapturarLogin.disabled = true;

        const deteccao = await faceapi
            .detectSingleFace(videoLogin, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!deteccao) {
            feedbackLogin.style.color = "salmon";
            feedbackLogin.innerText = "😕 Não encontrei um rosto nítido. Aproxime-se da câmera e tente de novo.";
            btnCapturarLogin.disabled = false;
            return;
        }

        const descritor = Array.from(deteccao.descriptor);

        try {
            const resposta = await fetch(API_LOGIN_FACIAL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ descritor })
            });

            const dados = await resposta.json().catch(() => null);

            if (resposta.ok && dados) {
                feedbackLogin.style.color = "lightgreen";
                feedbackLogin.innerText = "✅ Rosto reconhecido! Entrando...";

                localStorage.setItem("usuarioId", dados.id);
                localStorage.setItem("usuarioNome", dados.nome);
                localStorage.setItem("usuarioEmail", dados.email);

                // Encerra a câmera antes de sair da tela
                if (videoLogin.srcObject) {
                    videoLogin.srcObject.getTracks().forEach(t => t.stop());
                }

                setTimeout(() => {
                    window.location.href = "../perfil-pronto.html";
                }, 600);

            } else {
                feedbackLogin.style.color = "salmon";
                feedbackLogin.innerText = (dados && dados.mensagem) || "Rosto não reconhecido. Tente novamente ou use e-mail e senha.";
                btnCapturarLogin.disabled = false;
            }

        } catch (erro) {
            console.error(erro);
            feedbackLogin.style.color = "salmon";
            feedbackLogin.innerText = "❌ Erro ao conectar com o servidor.";
            btnCapturarLogin.disabled = false;
        }
    });
}
