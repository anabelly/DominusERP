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
            document.createElement('a');

        const data =

            new Date()
                .toISOString()
                .split('T')[0];

        link.href = url;

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

    } catch(err){

        console.error(err);

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

    leitor.onload = function(e){

        try{

            const dados =

                JSON.parse(
                    e.target.result
                );

            const confirmar =

                confirm(

`ATENÇÃO!

A restauração irá substituir TODOS os dados atuais do sistema.

Deseja continuar?`
                );

            if(
                !confirmar
            ) return;

            /* ========================= */
            /* SUBSTITUIR DB */
            /* ========================= */

            window.db = {

                funcionarios:
                    dados.funcionarios || [],

                clientes:
                    dados.clientes || [],

                fornecedores:
                    dados.fornecedores || [],

                contatos:
                    dados.contatos || [],

                produtos:
                    dados.produtos || [],

                financeiro:
                    dados.financeiro || [],

                orcamentos:
                    dados.orcamentos || [],

                recibos:
                    dados.recibos || [],

                tiposProduto:
                    dados.tiposProduto || []

            };

            save();

            alert(
                'Backup restaurado com sucesso.'
            );

            navigate('dash');

        } catch(err){

            console.error(err);

            alert(
                'Arquivo inválido ou corrompido.'
            );
        }
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