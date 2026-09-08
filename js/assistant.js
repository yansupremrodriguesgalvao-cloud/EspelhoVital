const API_SONO = "http://localhost:8081/sono";
const API_HUMOR = "http://localhost:8081/humor";
const API_CICLO = "http://localhost:8081/ciclo";

const nomeUsuario = (localStorage.getItem("usuarioNome") || "").split(" ")[0];

function sorteia(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

// ===================== BUSCA OS DADOS DA USUÁRIA (best effort) =====================
async function buscarContexto() {

    const contexto = { sono: [], humores: [], ciclo: null };

    try {
        const r = await fetch(API_SONO);
        if (r.ok) contexto.sono = await r.json();
    } catch (e) { /* segue sem dados de sono */ }

    try {
        const r = await fetch(API_HUMOR);
        if (r.ok) contexto.humores = await r.json();
    } catch (e) { /* segue sem dados de humor */ }

    try {
        const r = await fetch(API_CICLO);
        if (r.ok) {
            const lista = await r.json();
            if (lista && lista.length) contexto.ciclo = lista[lista.length - 1];
        }
    } catch (e) { /* segue sem dados de ciclo */ }

    return contexto;
}

function mediaSono(sono) {
    if (!sono.length) return null;
    const total = sono.reduce((s, i) => s + i.horas, 0);
    return total / sono.length;
}

function ultimoHumor(humores) {
    if (!humores.length) return null;
    return humores[humores.length - 1];
}

function diasParaProximaMenstruacao(ciclo) {
    if (!ciclo || !ciclo.proximaMenstruacao) return null;
    const hoje = new Date();
    const data = new Date(ciclo.proximaMenstruacao);
    return Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
}

// ===================== FRASES DE APOIO (variadas, pra não soar robótica) =====================

const aberturasCansada = [
    `Poxa, ${nomeUsuario || "amiga"}, sinto muito que você tá exausta. 💜`,
    "Nossa, cansaço assim pesa até na alma, né? Vem cá, me conta mais.",
    "Entendo... dias assim são difíceis. Respira fundo, tá aqui comigo."
];

const aberturasTriste = [
    "Sinto muito que você tá se sentindo assim. Eu tô aqui com você. 💜",
    "Que bom que você desabafou comigo. Seus sentimentos são válidos.",
    "Vem cá, me conta o que tá pesando no seu coração hoje?"
];

const aberturasFeliz = [
    "Ain, que fofo saber disso! Fico muito feliz por você 🥰",
    "Que ótima notícia! Adoro quando você tá bem 💜",
    "Isso me deixou com um sorriso enorme aqui! Conta mais?"
];

const aberturasAnsiosa = [
    "Ansiedade é osso mesmo. Respira comigo: inspira em 4, segura 4, solta em 6.",
    "Eu entendo essa sensação. Você não está sozinha nisso.",
    "Vamos com calma, uma coisa de cada vez. Tô aqui pra te ouvir."
];

const perguntasDeVolta = [
    "E o que mais você tá sentindo hoje?",
    "Quer me contar mais sobre isso?",
    "Como foi seu dia até agora?",
    "Tem algo que eu possa te ajudar a pensar sobre isso?"
];

// ===================== GERA A RESPOSTA =====================
async function gerarResposta(msgOriginal) {

    const msg = (msgOriginal || "").toLowerCase();
    const contexto = await buscarContexto();

    const media = mediaSono(contexto.sono);
    const humorRecente = ultimoHumor(contexto.humores);
    const diasCiclo = diasParaProximaMenstruacao(contexto.ciclo);

    // ---------- saudações ----------
    if (/^(oi+|ol[aá]|e a[íi]|bom dia|boa tarde|boa noite)/.test(msg.trim())) {
        return `Oi${nomeUsuario ? ", " + nomeUsuario : ""}! 💜 Que bom te ver por aqui. Como você tá se sentindo hoje?`;
    }

    // ---------- cansaço / exaustão ----------
    if (/cansad|exaust|sem energia|esgotad/.test(msg)) {
        let extra = "";
        if (media !== null) {
            extra = media < 6.5
                ? `\n\nOlhando aqui, sua média de sono tem sido de ${media.toFixed(1)}h — isso pode estar pesando bastante no seu cansaço.`
                : `\n\nSeu sono não tá tão ruim (média de ${media.toFixed(1)}h), então talvez seja mais rotina ou estresse mesmo.`;
        }
        return `${sorteia(aberturasCansada)}${extra}\n\n${sorteia(perguntasDeVolta)}`;
    }

    // ---------- tristeza ----------
    if (/trist|down|p[ée]ssim[ao]|mal( |$)|chorando|sem [aâ]nimo/.test(msg)) {
        return `${sorteia(aberturasTriste)}\n\n${sorteia(perguntasDeVolta)}`;
    }

    // ---------- ansiedade / nervosismo ----------
    if (/ansios|nervos|angusti|preocupad/.test(msg)) {
        return `${sorteia(aberturasAnsiosa)}\n\n${sorteia(perguntasDeVolta)}`;
    }

    // ---------- felicidade ----------
    if (/feliz|[oó]tim[ao]|bem demais|amei|empolgad/.test(msg)) {
        return sorteia(aberturasFeliz);
    }

    // ---------- cólica / tpm / ciclo ----------
    if (/c[oó]lica|tpm|menstrua|ciclo/.test(msg)) {
        let extra = "";
        if (diasCiclo !== null) {
            extra = diasCiclo <= 0
                ? "\n\nPelo seu ciclo, seu período deve estar chegando (ou já chegou) — capricha no autocuidado e na água quentinha 🫖"
                : `\n\nPelo seu ciclo, faltam cerca de ${diasCiclo} dia(s) pra próxima menstruação.`;
        }
        return `Cólica não é fácil, viu. Um chazinho quente, uma bolsa de água morna na barriga e descanso já ajudam bastante.${extra}\n\nComo você tá se sentindo com isso?`;
    }

    // ---------- pedido de resumo/status ----------
    if (/como estou|meu sono|meu resumo|minha semana/.test(msg)) {

        if (!contexto.sono.length && !contexto.humores.length) {
            return "Ainda não tenho muitos registros seus pra te contar como você andou. Que tal registrar seu humor ou seu sono hoje? Assim consigo te acompanhar melhor 💜";
        }

        let partes = [];

        if (media !== null) {
            partes.push(`você tem dormido em média ${media.toFixed(1)}h por noite`);
        }

        if (humorRecente) {
            partes.push(`seu último registro de humor foi "${humorRecente.estado}"`);
        }

        if (diasCiclo !== null && diasCiclo >= 0) {
            partes.push(`faltam cerca de ${diasCiclo} dia(s) pro seu próximo ciclo`);
        }

        const resumo = partes.length
            ? `Olha só, pelo que você tem registrado: ${partes.join(", ")}. `
            : "";

        return `${resumo}De um jeito geral, como você diria que tá se sentindo essa semana? Quero te entender melhor 💜`;
    }

    // ---------- agradecimento ----------
    if (/obrigad|valeu|grata/.test(msg)) {
        return "Imagina, é pra isso que eu tô aqui! Sempre que precisar desabafar, é só me chamar 💜";
    }

    // ---------- padrão: conversa aberta, como uma amiga faria ----------
    const respostasPadrao = [
        "Tô aqui, te escutando com carinho. Me conta mais sobre isso?",
        "Entendi. E como isso te fez sentir?",
        "Uhum... continua, tô prestando atenção em você.",
        "Isso importa, viu. Quer desabafar mais um pouco?"
    ];

    return sorteia(respostasPadrao);
}


// ===================== LIGAÇÃO COM A TELA =====================

function adicionarMensagem(texto, autor) {
    const chat = document.getElementById("chat");

    const bolha = document.createElement("div");
    bolha.classList.add("bolha", autor === "usuario" ? "usuario" : "assistente");
    bolha.textContent = texto;

    chat.appendChild(bolha);
    chat.scrollTop = chat.scrollHeight;

    return bolha;
}

async function enviarMensagem() {
    const input = document.getElementById("userInput");
    const msg = input.value.trim();

    if (!msg) return;

    adicionarMensagem(msg, "usuario");
    input.value = "";

    const bolhaDigitando = adicionarMensagem("digitando...", "assistente");
    bolhaDigitando.classList.add("digitando");

    try {
        const resposta = await gerarResposta(msg);

        // pequena pausa pra parecer uma conversa de verdade, não uma resposta instantânea de robô
        await new Promise(res => setTimeout(res, 500));

        bolhaDigitando.classList.remove("digitando");
        bolhaDigitando.textContent = resposta;

    } catch (erro) {
        bolhaDigitando.classList.remove("digitando");
        bolhaDigitando.textContent = "Ih, não consegui acessar seus dados agora. Será que o servidor tá rodando? De qualquer forma, tô aqui se quiser conversar 💜";
        console.error(erro);
    }

    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");

    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                enviarMensagem();
            }
        });
    }

    adicionarMensagem(
        `Oi${nomeUsuario ? ", " + nomeUsuario : ""}! 💜 Sou sua Assistente Vital. Pode conversar comigo como seria com uma amiga — me conta como você tá se sentindo hoje.`,
        "assistente"
    );
});
