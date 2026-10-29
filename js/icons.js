(() => {
  const paths = {
    book: '<path d="M4 3h13a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 14h16M8 7h8m-8 4h5"/>',
    file: '<path d="M14 2H5v20h14V7Zm0 0v6h5M8 12h8m-8 4h8"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    shield: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    flower:
      '<path d="M12 8C7 1 2 7 6 11c-7 3-2 10 3 6 0 8 8 8 8 0 6 3 10-4 3-6 4-5-2-10-6-4Z"/><circle cx="12" cy="12" r="2.5"/>',
    smile:
      '<circle cx="12" cy="12" r="9"/><path d="M8 14c2 3 6 3 8 0M8.5 9h.01M15.5 9h.01"/>',
    moon: '<path d="M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
    chart: '<path d="M4 3v17h17M8 15l4-5 4 3 5-7"/>',
    sparkles:
      '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
    message:
      '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z"/><path d="M7 11h10m-10 4h6"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    arrowUp: '<path d="M6 18 18 6M6 6h12v12"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    logout: '<path d="M9 21H4V3h5m5 4 5 5-5 5m-6-5h11"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  };
  const svg = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.flower}</svg>`;
  window.EVIcons = {
    svg,
    mount(root = document) {
      root.querySelectorAll("[data-icon]").forEach((element) => {
        element.innerHTML = svg(element.dataset.icon);
      });
    },
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => EVIcons.mount());
  else EVIcons.mount();
})();
