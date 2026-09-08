const API_USUARIOS = "http://localhost:8081/usuarios";

function getUsuarioId() {
    const id = localStorage.getItem("usuarioId");

    if (!id) {
        alert("Você precisa fazer login primeiro.");
        window.location.href = "pages/login.html";
        return null;
    }

    return id;
}

async function preencherFormulario() {

    const id = getUsuarioId();
    if (!id) return;

    try {
        const resposta = await fetch(`${API_USUARIOS}/${id}`);
        if (!resposta.ok) return;

        const usuario = await resposta.json();

        document.getElementById("nome").value = usuario.nome || "";
        document.getElementById("email").value = usuario.email || "";
        document.getElementById("telefone").value = usuario.telefone || "";
        document.getElementById("dataNascimento").value = usuario.dataNascimento || "";
        document.getElementById("cidade").value = usuario.cidade || "";
        document.getElementById("peso").value = usuario.peso ?? "";
        document.getElementById("altura").value = usuario.altura ?? "";

        if (usuario.objetivo) {
            document.getElementById("objetivo").value = usuario.objetivo;
        }

    } catch (erro) {
        console.error("Erro ao carregar dados atuais:", erro);
    }
}

document.getElementById("perfilForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = getUsuarioId();
    if (!id) return;

    const usuario = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        telefone: document.getElementById("telefone").value,
        dataNascimento: document.getElementById("dataNascimento").value,
        cidade: document.getElementById("cidade").value,
        peso: document.getElementById("peso").value ? Number(document.getElementById("peso").value) : null,
        altura: document.getElementById("altura").value ? Number(document.getElementById("altura").value) : null,
        objetivo: document.getElementById("objetivo").value
    };

    try {
        const resposta = await fetch(`${API_USUARIOS}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        });

        if (!resposta.ok) {
            throw new Error("Erro ao atualizar");
        }

        alert("Perfil atualizado com sucesso!");
        window.location.href = "perfil-detalhes.html";

    } catch (error) {
        console.error(error);
        alert("Erro ao conectar com servidor.");
    }
});

preencherFormulario();
