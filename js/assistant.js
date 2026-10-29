function adicionarMensagem(texto, autor) {
  const chat = document.getElementById("chat");
  const bubble = document.createElement("div");
  bubble.className =
    "bolha " + (autor === "usuario" ? "usuario" : "assistente");
  bubble.textContent = texto;
  chat.append(bubble);
  chat.scrollTop = chat.scrollHeight;
  return bubble;
}
let enviando = false;
async function enviarMensagem() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text || enviando) return;
  if (text.length > 4000) {
    adicionarMensagem("Use até 4.000 caracteres por mensagem.", "assistente");
    return;
  }
  enviando = true;
  adicionarMensagem(text, "usuario");
  input.value = "";
  const bubble = adicionarMensagem("Preparando resposta…", "assistente");
  try {
    const result = await EV.json("/grok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: text }),
    });
    bubble.textContent = result.resposta;
  } catch (e) {
    bubble.textContent = e.message;
  } finally {
    enviando = false;
    document.getElementById("chat").scrollTop =
      document.getElementById("chat").scrollHeight;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userInput").maxLength = 4000;
  document.getElementById("userInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });
  adicionarMensagem(
    "Olá! Sou a Assistente Vital. Como posso ajudar hoje? Minhas respostas são informativas e não substituem uma avaliação profissional.",
    "assistente",
  );
});
