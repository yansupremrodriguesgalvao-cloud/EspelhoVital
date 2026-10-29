const token = new URLSearchParams(location.hash.slice(1)).get("token");
history.replaceState(null, "", location.pathname);
document
  .getElementById("redefinirForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("mensagem");
    const button = e.submitter;
    if (
      document.getElementById("senha").value !==
      document.getElementById("confirmacao").value
    ) {
      message.textContent = "As senhas não coincidem.";
      return;
    }
    if (!token) {
      message.textContent =
        "Link inválido. Solicite outro link de recuperação.";
      return;
    }
    button.disabled = true;
    try {
      const result = await EV.json("/api/senha/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          senha: document.getElementById("senha").value,
        }),
      });
      message.textContent = result.mensagem;
      document.getElementById("redefinirForm").hidden = true;
      EV.clearUser();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
