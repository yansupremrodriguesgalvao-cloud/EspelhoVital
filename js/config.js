
window.EV_CONFIG = {
  // Local: backend na porta 8081. Produção: backend no Render.
  apiBase: ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    ? location.protocol + "//" + location.hostname + ":8081"
    : "https://espelhovital-back-j616.onrender.com",
};
