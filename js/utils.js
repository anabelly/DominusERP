/* ========================================================= */
/* DOMINUS ERP - UTILS.JS                                    */
/* ========================================================= */
/*
    FUNÇÕES UTILITÁRIAS GLOBAIS

    Este arquivo reúne pequenas funções reutilizadas
    por diversas telas do sistema.

    PRINCIPAIS RESPONSABILIDADES:
    1. Formatar valores em Real (BRL)
    2. Converter datas brasileiras para Date
    3. Converter datas para o padrão brasileiro
    4. Normalizar datas recebidas em formatos diferentes
    5. Converter horários para minutos
    6. Converter minutos para HH:MM
    7. Garantir números seguros
    8. Garantir strings seguras
    9. Disponibilizar uma função global de impressão

    IMPORTANTE:
    Apenas os comentários e a organização visual foram alterados.
    A lógica original foi preservada.
*/


/* ========================================================= */
/* 01. FUNÇÕES UTILITÁRIAS GLOBAIS                           */
/* ========================================================= */
/*
    Todas as funções deste arquivo são expostas em window
    para poderem ser utilizadas por diferentes módulos
    do Dominus ERP.
*/

/* ========================================================= */
/* 02. FORMATAÇÃO DE MOEDA - REAL BRASILEIRO                */
/* ========================================================= */
/*
    formatarMoeda(valor)

    Converte qualquer valor numérico para o formato brasileiro.

    Exemplo:
        1234.5
        →
        R$ 1.234,50

    Se o valor for vazio ou inválido por ausência,
    utiliza 0 como base.
*/

window.formatarMoeda = function (valor) {

    const v =
        Number(valor || 0);

    return v.toLocaleString(

        'pt-BR',

        {

            style:'currency',

            currency:'BRL'

        }

    );

};

/* ========================================================= */
/* 02.1 ATALHO PARA FORMATAÇÃO DE MOEDA                     */
/* ========================================================= */
/*
    moeda aponta para a mesma função formatarMoeda.

    Isso mantém compatibilidade com telas que chamam:

        moeda(valor)

    em vez de:

        formatarMoeda(valor)
*/

window.moeda =
    window.formatarMoeda;

/* ========================================================= */
/* 03. DATA BRASILEIRA -> OBJETO DATE                       */
/* ========================================================= */
/*
    dataBRparaDate(data)

    Converte uma data no formato:

        DD/MM/AAAA

    para um objeto Date do JavaScript.

    Se a data estiver vazia ou não tiver três partes,
    retorna null.
*/

window.dataBRparaDate =
function(data){

    if(!data)
        return null;

    const partes =
        data.split('/');

    if(
        partes.length !== 3
    )
        return null;

    const [

        dia,

        mes,

        ano

    ] = partes;

    return new Date(

        ano,

        mes - 1,

        dia

    );

};

/* ========================================================= */
/* 04. DATA YYYY-MM-DD -> DD/MM/AAAA                        */
/* ========================================================= */
/*
    formatarDataBR(data)

    Converte datas no formato:
        AAAA-MM-DD

    para:
        DD/MM/AAAA

    Se a data já contiver "/", ela é retornada como está.
*/

window.formatarDataBR =
function(data){

    if(!data)
        return '-';

    if(
        data.includes('/')
    )
        return data;

    const partes =
        data.split('-');

    if(
        partes.length !== 3
    )
        return data;

    const [

        ano,

        mes,

        dia

    ] = partes;

    return `${dia}/${mes}/${ano}`;

};

/* ========================================================= */
/* 05. NORMALIZAR DATA                                      */
/* ========================================================= */
/*
    normalizarData(data)

    Aceita mais de um formato de data.

    Se contiver "-":
        cria Date diretamente.

    Caso contrário:
        usa dataBRparaDate().

    Se não houver valor:
        retorna null.
*/

window.normalizarData =
function(data){

    if(!data)
        return null;

    if(
        data.includes('-')
    ){

        return new Date(
            data
        );

    }

    return dataBRparaDate(
        data
    );

};

/* ========================================================= */
/* 06. HORÁRIO HH:MM -> MINUTOS                             */
/* ========================================================= */
/*
    paraMinutos(hora)

    Converte um horário no formato HH:MM
    para a quantidade total de minutos.

    Exemplo:
        07:45
        →
        465

    Retorna null quando o horário estiver vazio
    ou for igual a "-".
*/

window.paraMinutos =
function(hora){

    if(

        !hora ||

        hora === '-'

    )

        return null;

    const [

        h,

        m

    ] = hora.split(':');

    return (

        parseInt(h) * 60

        +

        parseInt(m)

    );

};

/* ========================================================= */
/* 07. MINUTOS -> HORÁRIO HH:MM                             */
/* ========================================================= */
/*
    formatarMinutos(minutos)

    Converte uma quantidade de minutos para HH:MM.

    Também preserva valores negativos.

    Exemplo:
        90
        →
        01:30

        -15
        →
        -00:15
*/

window.formatarMinutos =
function(minutos){

    const negativo =
        minutos < 0;

    minutos =
        Math.abs(minutos);

    const h =

        String(

            Math.floor(
                minutos / 60
            )

        )

        .padStart(

            2,

            '0'

        );

    const m =

        String(

            minutos % 60

        )

        .padStart(

            2,

            '0'

        );

    return `

${negativo ? '-' : ''}${h}:${m}

`;

};

/* ========================================================= */
/* 08. NÚMERO SEGURO                                        */
/* ========================================================= */
/*
    num(v)

    Tenta converter o valor recebido para Number.

    Se o resultado for NaN:
        retorna 0.

    Essa função ajuda a evitar cálculos quebrados
    por valores inválidos.
*/

window.num =
function(v){

    const n =
        Number(v);

    return isNaN(n)

        ? 0

        : n;

};

/* ========================================================= */
/* 09. STRING SEGURA                                        */
/* ========================================================= */
/*
    str(v)

    Garante que o valor retornado seja sempre uma string.

    Se v for null ou undefined:
        utiliza "".

    Depois converte o resultado com toString().
*/

window.str =
function(v){

    return (

        v ??

        ''

    ).toString();

};

/* ========================================================= */
/* 10. FORMATAÇÃO DE DATA                                   */
/* ========================================================= */
/*
    formatarData(data)

    Função semelhante a formatarDataBR().

    Converte:
        AAAA-MM-DD

    para:
        DD/MM/AAAA

    Se já estiver no formato brasileiro, retorna sem alterar.
*/

window.formatarData =
function(data){

    if(!data)
        return '-';

    if(
        data.includes('/')
    )
        return data;

    const partes =
        data.split('-');

    if(
        partes.length !== 3
    )
        return data;

    const [

        ano,

        mes,

        dia

    ] = partes;

    return `${dia}/${mes}/${ano}`;

};

/* ========================================================= */
/* 11. IMPRESSÃO GLOBAL DO ERP                              */
/* ========================================================= */
/*
    imprimirHTML(html)

    Tenta imprimir utilizando primeiro a API exposta
    pelo preload.js:

        window.api.imprimirHTML()

    Se essa API não estiver disponível,
    usa um fallback do navegador:
    - abre nova janela
    - grava o HTML
    - fecha o documento
    - chama print()

    Qualquer erro é registrado no console.
*/

window.imprimirHTML =
async function(html){

    try{

        if(

            window.api

            &&

            window.api.imprimirHTML

        ){

            await window.api
            .imprimirHTML(

                html

            );

        }

        else{

            const win =
                window.open();

            win.document.write(
                html
            );

            win.document.close();

            win.print();

        }

    }

    catch(e){

        console.error(

            'Erro impressão:',

            e

        );

    }

};