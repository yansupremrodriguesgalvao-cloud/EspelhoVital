const CHAVE_STORAGE = "cicloVitalRegistro";


const form = document.getElementById("cicloForm");

const resultadoEl = document.getElementById("resultado");

const btnRecalcular = document.getElementById("btnRecalcular");

const selectDuracao = document.getElementById("duracaoCicloSelect");

const inputOutro = document.getElementById("duracaoCicloOutro");



let dadosCiclo = null;


let mesAtual = new Date().getMonth();

let anoAtual = new Date().getFullYear();




// Mostrar campo Outro

selectDuracao.addEventListener("change", function(){


    const outro = this.value === "outro";


    inputOutro.style.display =
        outro ? "block" : "none";


    inputOutro.required = outro;


});







// Resultado

function montarHtmlResultado(resultado){


    return `

        <h3>💜 Seu ciclo</h3>


        <p>
            🌸 <strong>Próxima Menstruação:</strong>
            ${new Date(resultado.proximaMenstruacao)
            .toLocaleDateString("pt-BR")}
        </p>


        <p>
            💜 <strong>Ovulação:</strong>
            ${new Date(resultado.ovulacao)
            .toLocaleDateString("pt-BR")}
        </p>


        <p>
            🔵 <strong>Início Período Fértil:</strong>
            ${new Date(resultado.inicioPeriodoFertil)
            .toLocaleDateString("pt-BR")}
        </p>


        <p>
            🔵 <strong>Fim Período Fértil:</strong>
            ${new Date(resultado.fimPeriodoFertil)
            .toLocaleDateString("pt-BR")}
        </p>


        <p style="color:green;font-weight:bold">

            ✅ Dados salvos automaticamente

        </p>

    `;

}






// ================= CALENDÁRIO =================


function desenharCalendario(){


    const calendario =
        document.getElementById("calendario");


    if(!calendario) return;



    calendario.innerHTML = "";



    const meses = [

        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"

    ];



    document.getElementById("mesAno").innerHTML =
        meses[mesAtual] + " " + anoAtual;





    const primeiroDia =
        new Date(
            anoAtual,
            mesAtual,
            1
        ).getDay();



    const ultimoDia =
        new Date(
            anoAtual,
            mesAtual + 1,
            0
        ).getDate();





    for(let i = 0; i < primeiroDia; i++){


        calendario.innerHTML += "<div></div>";


    }






    for(let dia = 1; dia <= ultimoDia; dia++){



        const div =
            document.createElement("div");



        div.className =
            "dia normal";



        // número dentro da bolinha

        div.innerHTML = dia;




        const data =
            new Date(
                anoAtual,
                mesAtual,
                dia
            );



        data.setHours(0,0,0,0);





        if(dadosCiclo){



            const salvo =
            JSON.parse(
                localStorage.getItem(CHAVE_STORAGE)
            );



            if(salvo){


                const inicioMenstruacao =
                    new Date(
                        salvo.entrada.dataUltimaMenstruacao
                    );



                const fimMenstruacao =
                    new Date(
                        salvo.entrada.dataUltimaMenstruacao
                    );



                fimMenstruacao.setDate(

                    fimMenstruacao.getDate()
                    +
                    salvo.entrada.duracaoMenstruacao
                    -
                    1

                );



                const inicioFertil =
                    new Date(
                        dadosCiclo.inicioPeriodoFertil
                    );



                const fimFertil =
                    new Date(
                        dadosCiclo.fimPeriodoFertil
                    );



                const ovulacao =
                    new Date(
                        dadosCiclo.ovulacao
                    );



                inicioMenstruacao.setHours(0,0,0,0);

                fimMenstruacao.setHours(0,0,0,0);

                inicioFertil.setHours(0,0,0,0);

                fimFertil.setHours(0,0,0,0);

                ovulacao.setHours(0,0,0,0);




                if(
                    data >= inicioMenstruacao &&
                    data <= fimMenstruacao
                ){

                    div.classList.remove("normal");

                    div.classList.add("menstruacao");

                }



                if(
                    data >= inicioFertil &&
                    data <= fimFertil
                ){

                    div.classList.remove("normal");

                    div.classList.add("fertil");

                }



                if(
                    data.getTime() === ovulacao.getTime()
                ){

                    div.classList.remove(
                        "normal",
                        "fertil"
                    );


                    div.classList.add("ovulacao");

                }



            }

        }




        calendario.appendChild(div);


    }



}// ================= CARREGAR DADOS SALVOS =================


function exibirResultadoSalvo(){


    const salvo =
        localStorage.getItem(CHAVE_STORAGE);



    if(!salvo){

        desenharCalendario();

        return false;

    }



    const dados =
        JSON.parse(salvo);



    dadosCiclo =
        dados.resultado;



    form.style.display = "none";


    resultadoEl.style.display = "block";


    btnRecalcular.style.display = "block";



    resultadoEl.innerHTML =
        montarHtmlResultado(
            dados.resultado
        );



    desenharCalendario();



    return true;


}





// Executa quando abrir a página

exibirResultadoSalvo();







// ================= NOVO REGISTRO =================



btnRecalcular.addEventListener(
"click",
function(){


    localStorage.removeItem(
        CHAVE_STORAGE
    );



    resultadoEl.style.display =
        "none";



    btnRecalcular.style.display =
        "none";



    form.style.display =
        "block";



    form.reset();



    inputOutro.style.display =
        "none";



    dadosCiclo = null;



    desenharCalendario();



});








// ================= TROCA DE MÊS =================



document
.getElementById("mesAnterior")
.addEventListener(
"click",
function(){


    mesAtual--;



    if(mesAtual < 0){


        mesAtual = 11;


        anoAtual--;


    }



    desenharCalendario();



});







document
.getElementById("proximoMes")
.addEventListener(
"click",
function(){


    mesAtual++;



    if(mesAtual > 11){


        mesAtual = 0;


        anoAtual++;


    }



    desenharCalendario();



});









// ================= ENVIO DO FORMULÁRIO =================



form.addEventListener(
"submit",
async function(e){


    e.preventDefault();





    const duracaoCiclo =

        selectDuracao.value === "outro"

        ?

        parseInt(inputOutro.value)

        :

        parseInt(selectDuracao.value);







    const dados = {



        dataUltimaMenstruacao:

        document
        .getElementById(
            "dataUltimaMenstruacao"
        )
        .value,




        duracaoCiclo:
        duracaoCiclo,




        duracaoMenstruacao:

        parseInt(

            document
            .getElementById(
                "duracaoMenstruacao"
            )
            .value

        ),

        usuarioId:

        (function(){
            const id = localStorage.getItem("usuarioId");
            return id ? Number(id) : null;
        })()

    };








    try{



        const resposta =
        await fetch(

            "http://localhost:8081/ciclo/calcular",

            {


                method:"POST",


                headers:{


                    "Content-Type":
                    "application/json"


                },


                body:

                JSON.stringify(dados)



            }

        );







        if(!resposta.ok){


            throw new Error(
                "Erro no servidor"
            );


        }






        const resultado =
            await resposta.json();






        localStorage.setItem(

            CHAVE_STORAGE,

            JSON.stringify({

                entrada:dados,

                resultado:resultado

            })

        );







        dadosCiclo =
            resultado;






        form.style.display =
            "none";



        resultadoEl.style.display =
            "block";



        btnRecalcular.style.display =
            "block";





        resultadoEl.innerHTML =
            montarHtmlResultado(
                resultado
            );






        desenharCalendario();





    }

    catch(error){





        resultadoEl.style.display =
            "block";



        resultadoEl.innerHTML = `

            <p style="color:red;text-align:center">

                ❌ Erro ao conectar com o servidor.

            </p>

        `;



        console.error(error);



    }

});