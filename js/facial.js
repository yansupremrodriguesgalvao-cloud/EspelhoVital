const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
const API_USUARIOS = "http://localhost:8081/usuarios";

const video = document.getElementById("video");
const overlayMsg = document.getElementById("facialOverlayMsg");
const btnCapturar = document.getElementById("btnCapturar");
const feedback = document.getElementById("facialFeedback");

async function ligarCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    } catch (erro) {
        console.error(erro);
        overlayMsg.textContent = "❌ Não consegui acessar sua câmera. Verifique as permissões do navegador.";
    }
}

async function iniciar() {
    if (typeof faceapi === "undefined") {
        overlayMsg.textContent = "❌ Não foi possível carregar a biblioteca de reconhecimento facial. Verifique sua conexão com a internet.";
        return;
    }

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        await ligarCamera();

        overlayMsg.classList.add("oculto");
        btnCapturar.disabled = false;

    } catch (erro) {
        console.error(erro);
        overlayMsg.textContent = "❌ Não foi possível carregar os modelos de reconhecimento facial. Verifique sua conexão com a internet.";
    }
}

/** Detecta o rosto no frame atual e retorna o descritor (128 números), ou null se não achar rosto. */
async function capturarDescritor() {
    const deteccao = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!deteccao) return null;

    return Array.from(deteccao.descriptor);
}

if (btnCapturar) {
    btnCapturar.addEventListener("click", async () => {

        const usuarioId = localStorage.getItem("usuarioId");

        if (!usuarioId) {
            feedback.style.color = "salmon";
            feedback.innerText = "Você precisa estar logada para cadastrar seu rosto.";
            return;
        }

        feedback.style.color = "";
        feedback.innerText = "🔎 Procurando seu rosto na câmera...";
        btnCapturar.disabled = true;

        const descritor = await capturarDescritor();

        if (!descritor) {
            feedback.style.color = "salmon";
            feedback.innerText = "😕 Não encontrei um rosto nítido. Aproxime-se da câmera, com boa iluminação, e tente de novo.";
            btnCapturar.disabled = false;
            return;
        }

        try {
            const resposta = await fetch(`${API_USUARIOS}/face/cadastrar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuarioId: Number(usuarioId), descritor })
            });

            if (!resposta.ok) throw new Error("Falha ao salvar");

            feedback.style.color = "lightgreen";
            feedback.innerText = "✅ Rosto cadastrado! Agora você já pode entrar com reconhecimento facial na tela de login.";

        } catch (erro) {
            console.error(erro);
            feedback.style.color = "salmon";
            feedback.innerText = "❌ Erro ao salvar seu rosto. Verifique se o servidor está rodando.";
        }

        btnCapturar.disabled = false;
    });
}

document.addEventListener("DOMContentLoaded", iniciar);
