const form = document.getElementById("recuperarForm");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const mensagem = document.getElementById("mensagem");

    if (!email) {
        mensagem.style.color = "red";
        mensagem.innerText = "Digite um e-mail válido";
        return;
    }

    // Ainda não existe envio de e-mail real no back-end.
    // Por enquanto só confirma visualmente pra usuária.
    mensagem.style.color = "green";
    mensagem.innerText = "Se esse e-mail estiver cadastrado, você receberá instruções em breve.";

    form.reset();
});
