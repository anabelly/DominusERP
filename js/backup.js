/* ========================= */
/* BACKUP & RESTAURAÇÃO */
/* ========================= */

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


/* ========================= */
/* BAIXAR BACKUP */
/* ========================= */

window.baixarBackup = function () {

    try {

        const dados =

            JSON.stringify(
                window.db,
                null,
                2
            );

        const blob =

            new Blob(
                [dados],
                {
                    type:
                    'application/json'
                }
            );

        const url =

            URL.createObjectURL(
                blob
            );

        const link =

            document.createElement(
                'a'
            );

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


/* ========================= */
/* RESTAURAR BACKUP */
/* ========================= */

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


    const arquivo =

        input.files[0];


    const leitor =

        new FileReader();


    leitor.onload =

        async function(e){

        try{

            const dados =

                JSON.parse(
                    e.target.result
                );


            /* ========================= */
            /* VALIDAR ESTRUTURA */
            /* ========================= */

            if (
                !dados ||
                typeof dados !== 'object' ||
                Array.isArray(dados)
            ) {

                throw new Error(
                    'Estrutura de backup inválida.'
                );

            }


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


            /* ========================= */
            /* CENTRO DE CUSTOS */
            /* ========================= */

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


            /* ========================= */
            /* SUBSTITUIR DB */
            /* ========================= */

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


                /* ========================= */
                /* CENTRO DE CUSTOS */
                /* ========================= */

                centroCustos:

                    centroCustosRestaurado,


                /* ========================= */
                /* CONTADORES */
                /* ========================= */

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


            /* ========================= */
            /* SALVAR NO SERVIDOR */
            /* ========================= */

            await save();


            alert(
                'Backup restaurado com sucesso.'
            );


            /* ========================= */
            /* VOLTAR AO DASHBOARD */
            /* ========================= */

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


    /* ========================= */
    /* ERRO AO LER ARQUIVO */
    /* ========================= */

    leitor.onerror =

        function(err){

            console.error(
                err
            );

            alert(
                'Não foi possível ler o arquivo de backup.'
            );

        };


    leitor.readAsText(
        arquivo
    );

};


/* ========================= */
/* REGISTRAR PÁGINA */
/* ========================= */

registerPage(
    'backup',
    renderBackup
);