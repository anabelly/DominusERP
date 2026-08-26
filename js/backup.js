/* ========================================================= */
/* DOMINUS ERP - BACKUP.JS                                   */
/* ========================================================= */
/*
    BACKUP E RESTAURAÇÃO DOS DADOS DO SISTEMA

    Este arquivo controla a tela de Backup & Restauração
    e todo o fluxo de exportação e importação dos dados
    armazenados em window.db.

    PRINCIPAIS RESPONSABILIDADES:
    1. Renderizar a tela de Backup & Restauração
    2. Gerar um arquivo JSON com os dados atuais
    3. Criar o nome do backup com a data atual
    4. Permitir selecionar um arquivo .json
    5. Ler o arquivo escolhido com FileReader
    6. Validar a estrutura básica do backup
    7. Pedir confirmação antes de substituir os dados
    8. Normalizar o Centro de Custos restaurado
    9. Reconstruir window.db com valores seguros
    10. Restaurar os contadores do sistema
    11. Salvar os dados restaurados no servidor
    12. Retornar ao Dashboard após a restauração
    13. Registrar a página "backup" no Dominus ERP

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    Nenhuma regra, campo, contador, valor ou lógica foi modificada.
*/


/* ========================================================= */
/* 01. TELA DE BACKUP E RESTAURAÇÃO                         */
/* ========================================================= */
/*
    renderBackup()

    Monta a tela com duas funções principais:

    - Fazer Backup
        exporta window.db para um arquivo JSON.

    - Restaurar Backup
        permite selecionar um arquivo JSON e substituir
        os dados atuais do sistema.
*/

window.renderBackup = function () {

    return `

<div style="
display:flex;
gap:22px;
flex-wrap:wrap;
">

    <!-- BACKUP -->

    <div class="content-card" style="
        flex:1;
        min-width:360px;
        padding:30px;
    ">

        <div style="
            font-size:32px;
            font-weight:800;
            margin-bottom:30px;
        ">

            Backup & Restauração

        </div>

        <div style="
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(320px,1fr));
            gap:22px;
        ">

            <!-- CARD BACKUP -->

            <div class="content-card" style="
                padding:26px;
            ">

                <div style="
                    font-size:16px;
                    font-weight:700;
                    margin-bottom:14px;
                ">

                    📤 Fazer Backup

                </div>

                <div style="
                    color:#6b7280;
                    margin-bottom:22px;
                    line-height:1.6;
                ">

                    Salve todos os dados do sistema
                    em um arquivo seguro.

                </div>

                <button
                    class="btn-action"
                    style="
                        background:#ef4444;
                    "
                    onclick="baixarBackup()">

                    Baixar Backup

                </button>

            </div>

            <!-- CARD RESTAURAÇÃO -->

            <div class="content-card" style="
                padding:26px;
            ">

                <div style="
                    font-size:16px;
                    font-weight:700;
                    margin-bottom:14px;
                ">

                    📥 Restaurar Backup

                </div>

                <div style="
                    color:#6b7280;
                    margin-bottom:14px;
                    line-height:1.6;
                ">

                    Selecione um arquivo
                    de backup para restaurar
                    os dados.

                </div>

                <input
                    type="file"
                    id="backup-file"
                    accept=".json"
                    style="
                        width:100%;
                        margin-bottom:18px;
                        padding:12px;
                        border:1px solid #d1d5db;
                        border-radius:10px;
                    ">

                <button
                    class="btn-action"
                    style="
                        background:#f59e0b;
                    "
                    onclick="restaurarBackup()">

                    Restaurar Dados

                </button>

            </div>

        </div>

    </div>

</div>
`;
};


/* ========================================================= */
/* 02. GERAR E BAIXAR BACKUP                                */
/* ========================================================= */
/*
    baixarBackup()

    Fluxo:
    1. transforma window.db em JSON formatado
    2. cria um Blob do tipo application/json
    3. gera uma URL temporária
    4. cria um link de download
    5. inclui a data atual no nome do arquivo
    6. dispara o download
    7. remove o link temporário
    8. libera a URL criada
*/

window.baixarBackup = function () {

    try {

        /* ================================================= */
        /* 02.1 SERIALIZAR O BANCO ATUAL                      */
        /* ================================================= */

        const dados =

            JSON.stringify(
                window.db,
                null,
                2
            );

        /* ================================================= */
        /* 02.2 CRIAR ARQUIVO JSON EM MEMÓRIA                 */
        /* ================================================= */

        const blob =

            new Blob(
                [dados],
                {
                    type:
                    'application/json'
                }
            );

        /* ================================================= */
        /* 02.3 GERAR URL TEMPORÁRIA PARA DOWNLOAD            */
        /* ================================================= */

        const url =

            URL.createObjectURL(
                blob
            );

        /* ================================================= */
        /* 02.4 CRIAR LINK TEMPORÁRIO                         */
        /* ================================================= */

        const link =

            document.createElement(
                'a'
            );

        /* ================================================= */
        /* 02.5 GERAR DATA PARA O NOME DO ARQUIVO             */
        /* ================================================= */

        const data =

            new Date()
                .toISOString()
                .split('T')[0];

        link.href =
            url;

        link.download =

            `dominus_backup_${data}.json`;

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(
            url
        );

        alert(
            'Backup gerado com sucesso.'
        );

    }

    catch(err){

        console.error(
            err
        );

        alert(
            'Erro ao gerar backup.'
        );

    }

};


/* ========================================================= */
/* 03. RESTAURAR BACKUP                                     */
/* ========================================================= */
/*
    restaurarBackup()

    Lê o arquivo escolhido pelo usuário e, depois
    de validar e confirmar a operação, reconstrói window.db.

    A restauração substitui os dados atuais.
*/

window.restaurarBackup = function () {

    const input =

        document.getElementById(
            'backup-file'
        );


    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        alert(
            'Selecione um arquivo.'
        );

        return;

    }


    /* ===================================================== */
    /* 03.0.1 ARQUIVO SELECIONADO                             */
    /* ===================================================== */

    const arquivo =

        input.files[0];


    /* ===================================================== */
    /* 03.0.2 PREPARAR FILEREADER                             */
    /* ===================================================== */

    const leitor =

        new FileReader();


    /* ===================================================== */
    /* 03.0.3 PROCESSAR CONTEÚDO LIDO                         */
    /* ===================================================== */

    leitor.onload =

        async function(e){

        try{

            const dados =

                JSON.parse(
                    e.target.result
                );


            /* ===================================================== */
            /* 03.1 VALIDAR ESTRUTURA DO ARQUIVO                    */
            /* ===================================================== */
            /*
                O conteúdo precisa ser um objeto JSON válido.

                Valores vazios, tipos incorretos ou arrays no nível
                principal são rejeitados.
            */

            if (
                !dados ||
                typeof dados !== 'object' ||
                Array.isArray(dados)
            ) {

                throw new Error(
                    'Estrutura de backup inválida.'
                );

            }


            /* ================================================= */
            /* 03.1.1 CONFIRMAR SUBSTITUIÇÃO DOS DADOS            */
            /* ================================================= */
            /*
                A restauração é destrutiva para o banco atual,
                por isso exige confirmação explícita.
            */

            const confirmar =

                confirm(

`ATENÇÃO!

A restauração irá substituir TODOS os dados atuais do sistema.

Deseja continuar?`

                );


            if(
                !confirmar
            ){

                return;

            }


            /* ===================================================== */
            /* 03.2 NORMALIZAR CENTRO DE CUSTOS                     */
            /* ===================================================== */
            /*
                Quando normalizarCentroCustos() estiver disponível,
                utiliza a função para completar campos ausentes e
                preservar compatibilidade com estruturas anteriores.
            */

            let centroCustosRestaurado;


            if (

                typeof window
                .normalizarCentroCustos
                ===
                'function'

            ) {

                centroCustosRestaurado =

                    window
                    .normalizarCentroCustos(

                        dados.centroCustos
                        || {}

                    );

            }

            else {

                centroCustosRestaurado =

                    dados.centroCustos
                    || {};

            }


            /* ===================================================== */
            /* 03.3 RECONSTRUIR WINDOW.DB                            */
            /* ===================================================== */
            /*
                Substitui o banco em memória pelos dados restaurados.

                As coleções são validadas com Array.isArray()
                antes de serem usadas.
            */

            window.db = {


                funcionarios:

                    Array.isArray(
                        dados.funcionarios
                    )

                    ? dados.funcionarios

                    : [],


                clientes:

                    Array.isArray(
                        dados.clientes
                    )

                    ? dados.clientes

                    : [],


                fornecedores:

                    Array.isArray(
                        dados.fornecedores
                    )

                    ? dados.fornecedores

                    : [],


                contatos:

                    Array.isArray(
                        dados.contatos
                    )

                    ? dados.contatos

                    : [],


                produtos:

                    Array.isArray(
                        dados.produtos
                    )

                    ? dados.produtos

                    : [],


                financeiro:

                    Array.isArray(
                        dados.financeiro
                    )

                    ? dados.financeiro

                    : [],
                                    orcamentos:

                    Array.isArray(
                        dados.orcamentos
                    )

                    ? dados.orcamentos

                    : [],


                ordensServico:

                    Array.isArray(
                        dados.ordensServico
                    )

                    ? dados.ordensServico

                    : [],


                recibos:

                    Array.isArray(
                        dados.recibos
                    )

                    ? dados.recibos

                    : [],


                tiposProduto:

                    Array.isArray(
                        dados.tiposProduto
                    )

                    ? dados.tiposProduto

                    : [],


                /* ===================================================== */
                /* 03.3.1 INSERIR CENTRO DE CUSTOS RESTAURADO           */
                /* ===================================================== */
                /*
                    Usa o objeto centroCustosRestaurado que já passou
                    pela normalização realizada anteriormente.
                */
                /* ===================================================== */
                /*
                    Quando normalizarCentroCustos() estiver disponível,
                    utiliza a função para completar campos ausentes e
                    preservar compatibilidade com estruturas anteriores.
                */

                centroCustos:

                    centroCustosRestaurado,


                /* ===================================================== */
                /* 03.4 RESTAURAR CONTADORES                            */
                /* ===================================================== */
                /*
                    Recupera:
                    - ultimoRecibo
                    - ultimoOrcamento
                    - ultimaOS

                    Caso algum valor não seja numérico, utiliza o
                    valor padrão definido no código original.
                */

                ultimoRecibo:

                    Number.isFinite(
                        Number(
                            dados.ultimoRecibo
                        )
                    )

                    ? Number(
                        dados.ultimoRecibo
                    )

                    : 0,


                ultimoOrcamento:

                    Number.isFinite(
                        Number(
                            dados.ultimoOrcamento
                        )
                    )

                    ? Number(
                        dados.ultimoOrcamento
                    )

                    : 3687,


                ultimaOS:

                    Number.isFinite(
                        Number(
                            dados.ultimaOS
                        )
                    )

                    ? Number(
                        dados.ultimaOS
                    )

                    : 0

            };


            /* ===================================================== */
            /* 03.5 SALVAR RESTAURAÇÃO NO SERVIDOR                  */
            /* ===================================================== */
            /*
                Depois de reconstruir window.db, chama save()
                para persistir os dados restaurados.
            */

            await save();


            alert(
                'Backup restaurado com sucesso.'
            );


            /* ===================================================== */
            /* 03.6 VOLTAR AO DASHBOARD                             */
            /* ===================================================== */
            /*
                Após a restauração bem-sucedida, navega para
                a página principal sem recarregar o banco novamente.
            */

            await navigate(
                'dash',
                false
            );

        }

        catch(err){

            console.error(
                err
            );

            alert(
                'Arquivo inválido ou corrompido.'
            );

        }

    };


    /* ===================================================== */
    /* 03.7 ERRO DE LEITURA DO ARQUIVO                      */
    /* ===================================================== */
    /*
        Trata falhas do FileReader e informa que o arquivo
        de backup não pôde ser lido.
    */

    leitor.onerror =

        function(err){

            console.error(
                err
            );

            alert(
                'Não foi possível ler o arquivo de backup.'
            );

        };


    /* ===================================================== */
    /* 03.8 INICIAR LEITURA DO ARQUIVO                       */
    /* ===================================================== */

    leitor.readAsText(
        arquivo
    );

};


/* ========================================================= */
/* 04. REGISTRAR PÁGINA NO SISTEMA                          */
/* ========================================================= */
/*
    Registra a tela com o nome:

        backup

    Assim, navigate('backup') consegue renderizar
    esta página dentro do view-port.
*/

registerPage(
    'backup',
    renderBackup
);