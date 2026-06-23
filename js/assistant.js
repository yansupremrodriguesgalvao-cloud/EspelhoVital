const API = "http://localhost:8081/sono";

async function enviarMensagem(){

    let input = document.getElementById("userInput");
    let msg = input.value;

    if(!msg) return;

    adicionarChat("Você", msg);

    let resposta = await gerarResposta(msg);

    adicionarChat("Assistente", resposta);

    input.value = "";
}

function adicionarChat(nome, texto){

    let chat = document.getElementById("chat");

    chat.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
            <strong>${nome}:</strong> ${texto}
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;
}

// 🧠 CÉREBRO DO ASSISTENTE
async function gerarResposta(msg){

    let res = await fetch(API);
    let dados = await res.json();

    let media = 0;
    dados.forEach(i => media += i.horas);
    media = dados.length ? media/dados.length : 0;

    msg = msg.toLowerCase();

    // regras simples (MAS MUITO EFETIVAS)

    if(msg.includes("cansado") || msg.includes("sono ruim")){
        return `Você tem dormido em média ${media.toFixed(1)}h. Quer uma rotina leve pra melhorar seu sono?`;
    }

    if(msg.includes("rotina")){
        return `Posso montar uma rotina assim:
- Dormir 22:30
- Evitar tela 1h antes
- Acordar fixo todos os dias`;
    }

    if(media < 6){
        return "Seu padrão de sono está baixo. Recomendo prioridade em descanso.";
    }

    if(media <= 9){
        return "Seu sono está dentro do ideal. Quer melhorar ainda mais sua energia?";
    }

    return "Me conte mais sobre como você está se sentindo.";
}