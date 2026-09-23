/* ========================================================= */
/* DOMINUS ERP - DB.JS                                       */
/* ========================================================= */
/*
    ESTRUTURA, CARREGAMENTO E SALVAMENTO DO BANCO DO FRONTEND

    Este arquivo mantém a estrutura principal de dados usada
    pelas telas do Dominus ERP e faz a comunicação com a API
    definida no main.js.

    PRINCIPAIS RESPONSABILIDADES:
    1. Criar a estrutura padrão do Centro de Custos
    2. Normalizar Centro de Custos de bancos antigos
    3. Criar a estrutura inicial de window.db
    4. Definir o endereço da API do sistema
    5. Carregar o banco através de GET /db
    6. Preservar valores padrão durante o carregamento
    7. Salvar o banco através de POST /db
    8. Persistir Agenda e configurações de notificações
    9. Persistir usuários adicionais e permissões
    10. Disponibilizar o atalho global save()

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    Nenhuma regra, valor, endereço, campo ou lógica foi modificada.
*/


/* ========================================================= */
/* 01. ESTRUTURA PADRÃO DO CENTRO DE CUSTOS                 */
/* ========================================================= */
/*
    criarEstruturaPadraoCentroCustos()

    Cria o objeto-base utilizado pelo Centro de Custos.

    Essa estrutura serve tanto para um banco novo quanto
    como referência para completar bancos antigos.
*/

window.criarEstruturaPadraoCentroCustos =
function () {

    return {

        /* ===================================================== */
        /* 01.1 ENDEREÇO DE ORIGEM                              */
        /* ===================================================== */
        /*
            Endereço padrão usado como ponto de partida para
            cálculos de deslocamento e rotas do sistema.
        */

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

        /* ===================================================== */
        /* 01.2 COMBUSTÍVEIS                                    */
        /* ===================================================== */
        /*
            Lista de combustíveis cadastrados no Centro de Custos.
        */

        combustiveis: [],

        /* ===================================================== */
        /* 01.3 VEÍCULOS                                        */
        /* ===================================================== */
        /*
            Lista de veículos cadastrados para cálculo de custos
            e deslocamentos.
        */

        veiculos: [],

        /* ===================================================== */
        /* 01.4 EQUIPAMENTOS PRÓPRIOS                           */
        /* ===================================================== */
        /*
            Lista de equipamentos próprios cadastrados no sistema.
        */

        equipamentos: [],

        /* ===================================================== */
        /* 01.5 MÃO DE OBRA                                     */
        /* ===================================================== */
        /*
            Parâmetros gerais utilizados no cálculo da mão de obra.

            horasMensais:
                base mensal utilizada pelo sistema.

            encargosPercentual:
                percentual adicional configurável.
        */

        maoDeObra: {

            horasMensais:
                220,

            encargosPercentual:
                0

        },

        /* ===================================================== */
        /* 01.6 PARÂMETROS DE PRECIFICAÇÃO                      */
        /* ===================================================== */
        /*
            Configurações utilizadas nos cálculos de preço:

            - desperdício
            - administrativo
            - margem de lucro
            - método de aplicação da margem
        */

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


/* ========================================================= */
/* 02. NORMALIZAR CENTRO DE CUSTOS                           */
/* ========================================================= */
/*
    normalizarCentroCustos(dados)

    Função de compatibilidade para bancos antigos.

    Ela:
    - cria campos que estiverem faltando
    - preserva dados já cadastrados
    - garante arrays válidos
    - mescla configurações antigas com a estrutura padrão
*/

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


/* ========================================================= */
/* 03. BANCO CENTRAL DO FRONTEND                             */
/* ========================================================= */
/*
    window.db concentra os dados utilizados pelas telas.

    O objeto começa com coleções vazias e valores padrão.
    Depois, loadDB() substitui esses dados pelo conteúdo
    carregado da API.
*/

window.db = {

    funcionarios:[],

    /*
        USUÁRIOS / LOGINS DO SISTEMA

        O usuário administrador master continua sendo fixo:
            login: admin
            senha: admin

        Ele não precisa ficar gravado aqui.

        Este array armazena somente os usuários adicionais
        cadastrados pela tela "Cadastro de Logins".
    */

    usuariosSistema:[],

    /*
        Lista global de cargos da empresa.

        Este campo precisa fazer parte do banco central para que
        cargos cadastrados/excluídos continuem iguais depois de:
        - fechar e abrir o sistema;
        - trocar de tela;
        - executar o auto refresh.
    */
    cargosFuncionario:[
        'Produção',
        'Administrativo',
        'Gerência',
        'Auxiliar'
    ],

    clientes:[],

    fornecedores:[],

    contatos:[],

    produtos:[],

    financeiro:[],

    orcamentos:[],

    ordensServico:[],

    /*
        SOLICITAÇÕES INTERNAS DE MATERIAIS

        Cada registro guarda todo o ciclo do pedido:
        - quem solicitou;
        - data/hora da solicitação;
        - material, quantidade e finalidade;
        - status Pendente, Entregue ou Negado;
        - quem atendeu/negou;
        - data/hora do atendimento;
        - justificativa quando negado.
    */
    solicitacoes:[],

    /* Recados e ocorrências internas. */
    recadosOcorrencias:[],

    /* Registros de retrabalho vinculados à operação/comercial. */
    retrabalhos:[],

    /* Acompanhamentos administrativos de pós-venda. */
    posVendas:[],

    recibos:[],

    tiposProduto:[],

    /*
        UNIFORMES E EPIs

        Mantém produtos, estoque e movimentações do módulo de RH.
        Este campo precisa fazer parte da estrutura central do banco
        para não desaparecer quando loadDB() reconstruir window.db.
    */
    uniformesEPI:{
        versao:1,
        inicializadoPlanilhaV2:false,
        produtos:[],
        movimentacoes:[]
    },

    /*
        AGENDA

        Os compromissos precisam fazer parte da estrutura central
        do banco. Sem isso, o loadDB() reconstruía window.db sem
        agenda[], fazendo compromissos cadastrados e realizados
        desaparecerem depois de um refresh da aplicação.
    */

    agenda:[],

    /*
        Configurações auxiliares da Agenda.

        financeiroOk:
            guarda os avisos financeiros já tratados pela
            central de notificações.
    */

    agendaConfig:{

        financeiroOk:{}

    },

    /*
        Histórico das notas fiscais XML já importadas.
        Necessário para impedir importações duplicadas
        mesmo depois de fechar e abrir o sistema novamente.
    */
    xmlImportados:[],

    /*
        Calendário de feriados utilizado pelo controle de ponto.

        overrides:
            alterações/exclusões feitas sobre feriados automáticos.

        adicionais:
            feriados cadastrados manualmente pela empresa.
    */
    feriadosPontoEmpresa:{

        versao:1,

        overrides:[],

        adicionais:[]

    },

    /* ===================================================== */
    /* 03.1 CENTRO DE CUSTOS                                */
    /* ===================================================== */
    /*
        Inicializa Centro de Custos usando a estrutura padrão.
    */

    centroCustos:
        criarEstruturaPadraoCentroCustos(),

    /* ===================================================== */
    /* 03.2 SEQUÊNCIAS / CONTADORES                         */
    /* ===================================================== */
    /*
        Guarda os últimos números usados por registros
        numerados do sistema.
    */

    ultimoRecibo:0,

    ultimoOrcamento:3687,

    ultimaOS:0,

    /* Último número utilizado no código SOL-0001, SOL-0002... */
    ultimaSolicitacao:0

};


/* ========================================================= */
/* 04. ENDEREÇO DA API                                      */
/* ========================================================= */
/*
    API_URL define onde o frontend encontra o servidor Express.

    O endereço foi mantido exatamente como no arquivo enviado.
*/

window.API_URL =

    'http://DESKTOP-FN92I64:3000';


/* ========================================================= */
/* 05. CARREGAR BANCO DA API                                */
/* ========================================================= */
/*
    loadDB()

    Faz uma requisição GET para:

        ${API_URL}/db

    Depois reconstrói window.db com os dados recebidos.

    Campos ausentes recebem valores padrão para evitar
    que bancos antigos quebrem telas mais novas.
*/

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


                /*
                    USUÁRIOS / LOGINS

                    Todos os computadores utilizam o mesmo banco
                    central. Portanto, os logins adicionais também
                    ficam disponíveis para todas as instalações.
                */

                usuariosSistema:

                    Array.isArray(
                        saved.usuariosSistema
                    )
                    ?
                    saved.usuariosSistema
                    :
                    [],


                /*
                    CARGOS

                    Antes este campo não era reconstruído pelo loadDB().
                    Por isso:
                    - cargo excluído voltava;
                    - cargo novo desaparecia.

                    Agora a lista salva no banco é carregada novamente.
                */

                cargosFuncionario:

                    Array.isArray(
                        saved.cargosFuncionario
                    )
                    ?
                    saved.cargosFuncionario
                    :
                    [
                        'Produção',
                        'Administrativo',
                        'Gerência',
                        'Auxiliar'
                    ],


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


                /*
                    SOLICITAÇÕES

                    Bancos criados antes deste módulo não possuem
                    solicitacoes. Nesse caso iniciamos uma lista vazia
                    sem alterar nenhum dado já existente.
                */
                solicitacoes:

                    Array.isArray(
                        saved.solicitacoes
                    )
                    ?
                    saved.solicitacoes
                    :
                    [],


                recadosOcorrencias:

                    Array.isArray(saved.recadosOcorrencias)
                    ? saved.recadosOcorrencias
                    : [],

                retrabalhos:

                    Array.isArray(saved.retrabalhos)
                    ? saved.retrabalhos
                    : [],

                posVendas:

                    Array.isArray(saved.posVendas)
                    ? saved.posVendas
                    : [],


                recibos:

                    saved.recibos
                    || [],


                tiposProduto:

                    saved.tiposProduto
                    || [],


                /*
                    UNIFORMES E EPIs

                    O módulo salva db.uniformesEPI junto com o restante
                    do banco. Aqui precisamos reconstruir esse campo ao
                    carregar a API; caso contrário, as movimentações são
                    descartadas no próximo loadDB().
                */

                uniformesEPI:

                    (
                        saved.uniformesEPI
                        &&
                        typeof saved.uniformesEPI === 'object'
                        &&
                        !Array.isArray(saved.uniformesEPI)
                    )
                    ?
                    {
                        versao:
                            saved.uniformesEPI.versao
                            || 1,

                        inicializadoPlanilhaV2:
                            !!saved.uniformesEPI.inicializadoPlanilhaV2,

                        produtos:
                            Array.isArray(saved.uniformesEPI.produtos)
                            ? saved.uniformesEPI.produtos
                            : [],

                        movimentacoes:
                            Array.isArray(saved.uniformesEPI.movimentacoes)
                            ? saved.uniformesEPI.movimentacoes
                            : []
                    }
                    :
                    {
                        versao:1,
                        inicializadoPlanilhaV2:false,
                        produtos:[],
                        movimentacoes:[]
                    },


                /*
                    AGENDA

                    Antes estes campos não eram reconstruídos pelo
                    loadDB(). O conteúdo até podia ser enviado ao
                    servidor pelo save(), mas ao recarregar o banco
                    a tela recebia uma nova window.db sem agenda.

                    Agora compromissos Agendados e Realizados
                    permanecem registrados normalmente.
                */

                agenda:

                    (
                        Array.isArray(
                            saved.agenda
                        )
                        ?
                        saved.agenda
                        :
                        []
                    )
                    .map(
                        item => {

                            /*
                                Compromissos criados antes do sistema
                                multiusuário pertenciam ao único login
                                existente: o administrador master.

                                Novos compromissos recebem usuarioId
                                diretamente pela Agenda.
                            */

                            if (
                                !item
                                ||
                                typeof item !== 'object'
                            ) {

                                return item;
                            }

                            if (
                                !item.usuarioId
                            ) {

                                return {

                                    ...item,

                                    usuarioId:
                                        'master-admin',

                                    responsavel:
                                        'admin'
                                };
                            }

                            return item;
                        }
                    ),


                agendaConfig:

                    (
                        saved.agendaConfig
                        &&
                        typeof saved.agendaConfig === 'object'
                        &&
                        !Array.isArray(
                            saved.agendaConfig
                        )
                    )
                    ?
                    {
                        ...saved.agendaConfig,

                        financeiroOk:

                            (
                                saved.agendaConfig.financeiroOk
                                &&
                                typeof saved.agendaConfig.financeiroOk === 'object'
                                &&
                                !Array.isArray(
                                    saved.agendaConfig.financeiroOk
                                )
                            )
                            ?
                            saved.agendaConfig.financeiroOk
                            :
                            {}
                    }
                    :
                    {
                        financeiroOk:{}
                    },


                /*
                    Mantém o histórico de XMLs importados ao
                    recarregar o banco da API.
                */

                xmlImportados:

                    saved.xmlImportados
                    || [],


                /*
                    Calendário dos feriados do ponto.
                    Preserva alterações, exclusões e cadastros manuais.
                */

                feriadosPontoEmpresa:

                    (
                        saved.feriadosPontoEmpresa
                        &&
                        typeof saved.feriadosPontoEmpresa === 'object'
                    )
                    ?
                    {
                        versao:
                            1,

                        overrides:
                            Array.isArray(
                                saved.feriadosPontoEmpresa.overrides
                            )
                            ?
                            saved.feriadosPontoEmpresa.overrides
                            :
                            [],

                        adicionais:
                            Array.isArray(
                                saved.feriadosPontoEmpresa.adicionais
                            )
                            ?
                            saved.feriadosPontoEmpresa.adicionais
                            :
                            []
                    }
                    :
                    {
                        versao:
                            1,

                        overrides:
                            [],

                        adicionais:
                            []
                    },


                /* ===================================================== */
                /* 03.1 CENTRO DE CUSTOS                                */
                /* ===================================================== */
                /*
                    Inicializa Centro de Custos usando a estrutura padrão.
                */

                centroCustos:

                    normalizarCentroCustos(

                        saved.centroCustos
                        || {}

                    ),


                /* ===================================================== */
                /* 03.2 SEQUÊNCIAS / CONTADORES                         */
                /* ===================================================== */
                /*
                    Guarda os últimos números usados por registros
                    numerados do sistema.
                */

                ultimoRecibo:

                    saved.ultimoRecibo
                    || 0,


                ultimoOrcamento:

                    saved.ultimoOrcamento
                    || 3687,


                ultimaOS:

                    saved.ultimaOS
                    || 0,


                /* Sequência própria das solicitações internas. */
                ultimaSolicitacao:

                    saved.ultimaSolicitacao
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


/* ========================================================= */
/* 06. SALVAR BANCO NA API                                  */
/* ========================================================= */
/*
    saveDB()

    Envia window.db completo para:

        POST ${API_URL}/db

    O conteúdo é convertido para JSON antes do envio.
*/

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


/* ========================================================= */
/* 07. ATALHO GLOBAL PARA SALVAR                             */
/* ========================================================= */
/*
    save()

    Atalho simples que chama saveDB().

    Diversas telas podem usar apenas:

        save()

    sem precisar chamar saveDB() diretamente.
*/

window.save =
async function(){

    await saveDB();

};