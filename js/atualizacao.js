/* ========================= */
/* TELA ATUALIZAÇÃO */
/* ========================= */

window.renderAtualizacao =
function(){

    return `

<div style="
    display:flex;
    flex-direction:column;
    gap:25px;
">

    <div>

        <h1 style="
            color:var(--primary);
            margin-bottom:10px;
        ">
            Atualização do Sistema
        </h1>

        <div style="
            color:#6b7280;
        ">
            Verifique novas versões do Dominus ERP.
        </div>

    </div>

    <div class="content-card">

        <h3>
            Versão instalada
        </h3>

        <div style="
            font-size:18px;
            font-weight:700;
            margin-top:10px;
        ">

            v1.0.0

        </div>

    </div>

    <div class="content-card">

        <h3>
            Atualizações
        </h3>

        <p style="
            color:#6b7280;
            line-height:1.8;
        ">

            Clique abaixo para verificar
            novas versões disponíveis.

        </p>

        <button
            class="btn-action"
            onclick="verificarAtualizacao()">

            🔍 Verificar Atualizações

        </button>

        <div
            id="update-status"

            style="
                margin-top:20px;
                color:#444;
                line-height:1.8;
            ">

        </div>

    </div>

</div>

`;
};

/* ========================= */
/* VERIFICAR UPDATE */
/* ========================= */

window.verificarAtualizacao =
async function () {

    try {

        alert(

            'Verificando atualizações...'

        );

        const resultado =

            await window.api
            .checkUpdate();

        if (

            !resultado.ok

        ){

            alert(

                'Erro: ' +

                resultado.erro

            );

            return;

        }

        if (

            !resultado.update

        ){

            alert(

                'Você já possui a versão mais recente.'

            );

            return;

        }

        const confirmar =

            confirm(

                `Nova versão disponível: v${resultado.versao}

Deseja instalar agora?`

            );

        if (

            !confirmar

        ) return;

        await window.api
            .installUpdate();

    }

    catch(err){

        console.error(err);

        alert(

            'Erro ao verificar atualização.'

        );

    }

};

/* ========================= */
/* INSTALAR UPDATE */
/* ========================= */

window.instalarAtualizacao =
async function(){

    try{

        alert(

            'O sistema será fechado para aplicar a atualização.'

        );

        await window.api
        .installUpdate();

    }

    catch(err){

        console.error(err);

        alert(

            'Erro ao instalar atualização.'

        );

    }

};

/* ========================= */
/* REGISTRAR */
/* ========================= */

registerPage(

    'atualizacao',

    renderAtualizacao

);