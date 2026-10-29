document
  .getElementById("recuperarForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = e.submitter;
    const message = document.getElementById("mensagem");
    button.disabled = true;
    try {
      const result = await EV.json("/api/senha/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("email").value.trim(),
        }),
      });
      message.textContent = result.mensagem;
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
