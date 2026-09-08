const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("mensagem");

    if (!email || !senha) {
        mensagem.innerText = "Preencha todos os campos";
        mensagem.style.color = "red";
        return;
    }

    try {
        const resposta = await fetch("http://localhost:8081/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json().catch(() => null);

        if (resposta.ok) {
            mensagem.innerText = "Login realizado com sucesso!";
            mensagem.style.color = "green";

            // Guarda o usuário logado para as próximas telas (perfil, edição, etc.)
            if (dados) {
                localStorage.setItem("usuarioId", dados.id);
                localStorage.setItem("usuarioNome", dados.nome);
                localStorage.setItem("usuarioEmail", dados.email);
            }

            setTimeout(() => {
                window.location.href = "../perfil-pronto.html";
            }, 800);

        } else {
            mensagem.innerText = (dados && dados.mensagem) || "E-mail ou senha inválidos";
            mensagem.style.color = "red";
        }

    } catch (err) {
        console.error(err);
        mensagem.innerText = "Erro no servidor";
        mensagem.style.color = "red";
    }
});

function irCadastro() {
    window.location.href = "cadastro.html";
}
