/* ========================= */
/* ESTRUTURA PADRÃO */
/* CENTRO DE CUSTOS */
/* ========================= */

window.criarEstruturaPadraoCentroCustos =
function () {

    return {

        /* ========================= */
        /* ENDEREÇO DE ORIGEM */
        /* ========================= */

        enderecoOrigem: {

            logradouro:
                'Rua Paissandu',

            numero:
                '25',

            bairro:
                'Parque dos Eucaliptos',

            cidade:
                'Gravataí',

            uf:
                'RS',

            cep:
                '94130-380'

        },

        /* ========================= */
        /* COMBUSTÍVEIS */
        /* ========================= */

        combustiveis: [],

        /* ========================= */
        /* VEÍCULOS */
        /* ========================= */

        veiculos: [],

        /* ========================= */
        /* EQUIPAMENTOS PRÓPRIOS */
        /* ========================= */

        equipamentos: [],

        /* ========================= */
        /* MÃO DE OBRA */
        /* ========================= */

        maoDeObra: {

            horasMensais:
                220,

            encargosPercentual:
                0

        },

        /* ========================= */
        /* PRECIFICAÇÃO */
        /* ========================= */

        parametros: {

            desperdicioPercentual:
                0,

            administrativoPercentual:
                0,

            margemLucroPercentual:
                0,

            metodoMargem:
                'acrescimo'

        }

    };

};


/* ========================= */
/* NORMALIZAR CENTRO CUSTOS */
/* ========================= */

/*
    Essa função é importante
    para bancos antigos.

    Se o banco ainda não tiver
    Centro de Custos, ela cria.

    Se futuramente adicionarmos
    novos campos, ela preserva
    os dados antigos e acrescenta
    os campos que estiverem faltando.
*/

window.normalizarCentroCustos =
function (
    dados = {}
) {

    const padrao =
        criarEstruturaPadraoCentroCustos();

    return {

        enderecoOrigem: {

            ...padrao.enderecoOrigem,

            ...(
                dados.enderecoOrigem
                || {}
            )

        },

        combustiveis:

            Array.isArray(
                dados.combustiveis
            )

            ? dados.combustiveis

            : [],

        veiculos:

            Array.isArray(
                dados.veiculos
            )

            ? dados.veiculos

            : [],

        equipamentos:

            Array.isArray(
                dados.equipamentos
            )

            ? dados.equipamentos

            : [],

        maoDeObra: {

            ...padrao.maoDeObra,

            ...(
                dados.maoDeObra
                || {}
            )

        },

        parametros: {

            ...padrao.parametros,

            ...(
                dados.parametros
                || {}
            )

        }

    };

};


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

    /* ========================= */
    /* CENTRO DE CUSTOS */
    /* ========================= */

    centroCustos:
        criarEstruturaPadraoCentroCustos(),

    /* ========================= */
    /* SEQUÊNCIAS */
    /* ========================= */

    ultimoRecibo:0,

    ultimoOrcamento:3687,

    ultimaOS:0

};


/* ========================= */
/* URL API */
/* ========================= */

window.API_URL =

    'http://DESKTOP-FN92I64:3000';


/* ========================= */
/* LOAD */
/* ========================= */

window.loadDB =
async function(){

    try{

        const saved =

            await fetch(

                `${API_URL}/db`

            )

            .then(

                r =>
                    r.json()

            );


        if(saved){

            window.db = {

                funcionarios:

                    saved.funcionarios
                    || [],


                clientes:

                    saved.clientes
                    || [],


                fornecedores:

                    saved.fornecedores
                    || [],


                contatos:

                    saved.contatos
                    || [],


                produtos:

                    saved.produtos
                    || [],


                financeiro:

                    saved.financeiro
                    || [],


                orcamentos:

                    saved.orcamentos
                    || [],


                ordensServico:

                    saved.ordensServico
                    || [],


                recibos:

                    saved.recibos
                    || [],


                tiposProduto:

                    saved.tiposProduto
                    || [],


                /* ========================= */
                /* CENTRO DE CUSTOS */
                /* ========================= */

                centroCustos:

                    normalizarCentroCustos(

                        saved.centroCustos
                        || {}

                    ),


                /* ========================= */
                /* SEQUÊNCIAS */
                /* ========================= */

                ultimoRecibo:

                    saved.ultimoRecibo
                    || 0,


                ultimoOrcamento:

                    saved.ultimoOrcamento
                    || 3687,


                ultimaOS:

                    saved.ultimaOS
                    || 0

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

window.saveDB =
async function(){

    try{

        await fetch(

            `${API_URL}/db`,

            {

                method:
                    'POST',

                headers:{

                    'Content-Type':
                        'application/json'

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

window.save =
async function(){

    await saveDB();

};