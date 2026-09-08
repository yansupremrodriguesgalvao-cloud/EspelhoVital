const form = document.getElementById("formCadastro");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (nome.length < 3) {
        alert("Nome inválido");
        return;
    }

    if (!email.includes("@")) {
        alert("E-mail inválido");
        return;
    }

    if (senha.length < 8) {
        alert("A senha deve possuir no mínimo 8 caracteres");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem");
        return;
    }

    const usuario = {
        nome: nome,
        email: email,
        senha: senha
    };

    try {

        const resposta = await fetch(
            "http://localhost:8081/usuarios/cadastrar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuario)
            }
        );

        const mensagem = await resposta.text();

        if (resposta.ok) {

            alert(mensagem);

            form.reset();
            window.location.href = "login.html";
        } else {

            alert("Erro: " + mensagem);
        }

    } catch (erro) {

        console.error(erro);

        alert("Erro ao conectar com o servidor.");
    }

});