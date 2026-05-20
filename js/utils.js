/* ========================= */
/* UTILS - FUNÇÕES GLOBAIS */
/* ========================= */

/* ========================= */
/* MOEDA (BRL) */
/* ========================= */

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

window.moeda =
    window.formatarMoeda;

/* ========================= */
/* DATA BR -> JS */
/* ========================= */

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

/* ========================= */
/* DATE -> BR */
/* ========================= */

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

/* ========================= */
/* NORMALIZAR DATA */
/* ========================= */

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

/* ========================= */
/* TIME -> MINUTOS */
/* ========================= */

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

/* ========================= */
/* MINUTOS -> TIME */
/* ========================= */

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

/* ========================= */
/* SAFE NUMBER */
/* ========================= */

window.num =
function(v){

    const n =
        Number(v);

    return isNaN(n)

        ? 0

        : n;

};

/* ========================= */
/* STRING SAFE */
/* ========================= */

window.str =
function(v){

    return (

        v ??

        ''

    ).toString();

};

/* ========================= */
/* FORMATAR DATA */
/* ========================= */

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

/* ========================= */
/* IMPRESSÃO GLOBAL ERP */
/* ========================= */

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