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
    recibos:[],
    tiposProduto:[]
};

/* ========================= */
/* URL API */
/* ========================= */

window.API_URL =

    'http://10.1.1.16:3000';

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

                recibos:
                    saved.recibos || [],

                tiposProduto:
                    saved.tiposProduto || []

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