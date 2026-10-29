(() => {
  const iso = (date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  const date = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const status = (id, text, error = false) => {
    const node = document.getElementById(id);
    node.textContent = text;
    node.classList.toggle("error", error);
  };
  const download = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const link = el("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const symptoms = {
    COLICA: "Cólica",
    DOR_CABECA: "Dor de cabeça",
    INCHACO: "Inchaço",
    SENSIBILIDADE_MAMAS: "Sensibilidade nas mamas",
    CANSACO: "Cansaço",
    NAUSEA: "Náusea",
    ACNE: "Acne",
    DOR_LOMBAR: "Dor lombar",
    ALTERACAO_APETITE: "Alteração de apetite",
    TONTURA: "Tontura",
    ALTERACAO_INTESTINAL: "Alteração intestinal",
    OUTRO: "Outro",
  };
  const flows = {
    NAO_INFORMADO: "Não informado",
    SEM_FLUXO: "Sem fluxo",
    ESCAPE: "Escape",
    LEVE: "Leve",
    MODERADO: "Moderado",
    INTENSO: "Intenso",
  };
  window.EVFeatures = {
    iso,
    date,
    el,
    status,
    download,
    symptoms,
    flows,
    format: (value) => date(value).toLocaleDateString("pt-BR"),
  };
})();
