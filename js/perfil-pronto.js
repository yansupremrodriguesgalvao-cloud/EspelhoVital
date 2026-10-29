const API_USUARIOS = EV.base + "/usuarios";

function getUsuarioId() {
  const id = localStorage.getItem("usuarioId");

  if (!id) {
    alert("Você precisa fazer login primeiro.");
    window.location.href = "pages/login.html";
    return null;
  }

  return id;
}

async function carregarPerfil() {
  await EV.ready;

  const id = getUsuarioId();
  if (!id) return;

  try {
    const resposta = await EV.fetch(`${API_USUARIOS}/${id}`);

    if (!resposta.ok) throw new Error();

    const usuario = await resposta.json();

    document.getElementById("nome").innerText = usuario.nome || "";
    document.getElementById("email").innerText = usuario.email || "";
    document.getElementById("telefone").innerText =
      usuario.telefone || "Não informado";
    document.getElementById("dataNascimento").innerText =
      usuario.dataNascimento || "Não informado";
    document.getElementById("cidade").innerText =
      usuario.cidade || "Não informado";
    document.getElementById("peso").innerText = usuario.peso ?? "--";
    document.getElementById("altura").innerText = usuario.altura ?? "--";
    document.getElementById("objetivo").innerText =
      usuario.objetivo || "Não informado";
  } catch (erro) {
    console.error(erro);
    document.getElementById("nome").innerText = "Erro ao carregar perfil";
  }
}

function editarPerfil() {
  window.location.href = "editar-perfil.html";
}

carregarPerfil();
