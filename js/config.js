const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

window.EV_CONFIG = {
    apiBase: isLocal
        ? `http://${window.location.hostname}:8081`
        : window.location.origin
};
