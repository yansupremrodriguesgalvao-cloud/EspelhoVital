window.EV_CONFIG = {
  // Local: backend na porta 8081. Vercel: rotas encaminhadas pelo vercel.json.
  apiBase: ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    ? location.protocol + "//" + location.hostname + ":8081"
    : location.origin,
};