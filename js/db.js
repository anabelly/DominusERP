/* ========================= */
/* DB CENTRALIZADO */
/* ========================= */

window.db = {

    funcionarios:[],
    clientes:[],
    fornecedores:[],
    contatos:[],
    produtos:[],
    financeiro:[],
    orcamentos:[],
    ordensServico:[],
    recibos:[],
    tiposProduto:[],
    ultimoRecibo:0,
    ultimoOrcamento:3687,
    ultimaOS:0
};

/* ========================= */
/* URL API */
/* ========================= */

window.API_URL =

    'http://10.1.1.17:3000';

/* ========================= */
/* LOAD */
/* ========================= */

window.loadDB = async function(){

    try{

        const saved =

            await fetch(

                `${API_URL}/db`

            )

            .then(

                r=>r.json()

            );

        if(saved){

         window.db = {

    funcionarios:
        saved.funcionarios || [],

    clientes:
        saved.clientes || [],

    fornecedores:
        saved.fornecedores || [],

    contatos:
        saved.contatos || [],

    produtos:
        saved.produtos || [],

    financeiro:
        saved.financeiro || [],

    orcamentos:
        saved.orcamentos || [],

    ordensServico:
        saved.ordensServico || [],

    recibos:
        saved.recibos || [],

    tiposProduto:
        saved.tiposProduto || [],

    ultimoRecibo:
        saved.ultimoRecibo || 0,

    ultimoOrcamento:
        saved.ultimoOrcamento || 3687,

    ultimaOS:
        saved.ultimaOS || 0

};

        }

    }

    catch(e){

        console.error(

            'Erro carregar DB:',

            e

        );

    }

};

/* ========================= */
/* SAVE */
/* ========================= */

window.saveDB = async function(){

    try{

        await fetch(

            `${API_URL}/db`,

            {

                method:'POST',

                headers:{

                    'Content-Type':'application/json'

                },

                body:

                    JSON.stringify(

                        window.db

                    )

            }

        );

    }

    catch(e){

        console.error(

            'Erro salvar DB:',

            e

        );

    }

};

/* ========================= */
/* ATALHO */
/* ========================= */

window.save = async function(){

    await saveDB();

};