/* ========================================================= */
/* DOMINUS ERP - ATUALIZACAO.JS                              */
/* ========================================================= */
/*
    TELA E FLUXO DE ATUALIZAÇÃO DO SISTEMA

    Este arquivo controla a tela de Atualização do Dominus ERP
    e a comunicação com o Electron para verificar e instalar
    novas versões do sistema.

    PRINCIPAIS RESPONSABILIDADES:
    1. Renderizar a tela de atualização
    2. Exibir a versão instalada
    3. Solicitar verificação de nova versão
    4. Tratar erros da verificação
    5. Avisar quando o sistema já está atualizado
    6. Confirmar com o usuário antes do download
    7. Solicitar instalação da atualização
    8. Tratar erros de instalação
    9. Registrar a página "atualizacao" no sistema

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    A lógica original foi preservada.
*/


/* ========================================================= */
/* 01. RENDERIZAÇÃO DA TELA DE ATUALIZAÇÃO                  */
/* ========================================================= */
/*
    renderAtualizacao()

    Monta o HTML da tela responsável por:
    - mostrar o título da seção
    - exibir a versão instalada
    - disponibilizar o botão de verificação
    - reservar a área de status da atualização

    O valor de #versao-instalada é preenchido depois
    pelo app.js quando a página "atualizacao" é aberta.
*/

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

    <span id="versao-instalada">

        Carregando...

    </span>

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

/* ========================================================= */
/* 02. VERIFICAR E INSTALAR ATUALIZAÇÕES                    */
/* ========================================================= */
/*
    verificarAtualizacao()

    Fluxo:
    1. informa que a verificação começou
    2. chama window.api.checkUpdate()
    3. trata erro de consulta
    4. informa quando já existe a versão mais recente
    5. mostra a nova versão encontrada
    6. pede confirmação ao usuário
    7. chama window.api.installUpdate()
    8. trata eventual erro de instalação

    As funções window.api.* são expostas pelo preload.js.
*/

window.verificarAtualizacao =

async function(){

    try{

        /* ================================================= */
        /* 02.1 AVISAR INÍCIO DA VERIFICAÇÃO                 */
        /* ================================================= */

        alert(

            'Verificando atualizações...'

        );

        /* ================================================= */
        /* 02.2 CONSULTAR ELECTRON-UPDATER                    */
        /* ================================================= */
        /*
            checkUpdate() chama o processo principal,
            que consulta se existe versão mais nova.
        */

        const resultado =

            await window.api
            .checkUpdate();

        /* ================================================= */
        /* 02.3 TRATAR ERRO NA VERIFICAÇÃO                    */
        /* ================================================= */

        if(

            !resultado.ok

        ){

            alert(

                'Erro: ' +

                resultado.erro

            );

            return;

        }

        /* ================================================= */
        /* 02.4 SISTEMA JÁ ESTÁ ATUALIZADO                    */
        /* ================================================= */

        if(

            !resultado.update

        ){

            alert(

                'Você já possui a versão mais recente.'

            );

            return;

        }

        /* ================================================= */
        /* 02.5 CONFIRMAR DOWNLOAD E INSTALAÇÃO               */
        /* ================================================= */
        /*
            Mostra ao usuário a versão encontrada antes
            de iniciar o download.
        */

        const confirmar =

            confirm(

`Nova versão disponível:

v${resultado.versao}

Deseja baixar e instalar agora?`

            );

        if(

            !confirmar

        ){

            return;

        }

        /* ================================================= */
        /* 02.6 AVISAR INÍCIO DO DOWNLOAD                     */
        /* ================================================= */

        alert(

            'Baixando atualização...\n\nO sistema será fechado automaticamente.'

        );

        /* ================================================= */
        /* 02.7 SOLICITAR INSTALAÇÃO                          */
        /* ================================================= */
        /*
            installUpdate() inicia o download pelo
            electron-updater e instala ao terminar.
        */

        const instalar =

            await window.api
            .installUpdate();

        /* ================================================= */
        /* 02.8 TRATAR ERRO DE INSTALAÇÃO                     */
        /* ================================================= */

        if(

            !instalar.ok

        ){

            alert(

                'Erro na instalação:\n' +

                instalar.erro

            );

        }

    }

    catch(err){

        console.error(

            err

        );

        alert(

            'Erro ao verificar atualização.'

        );

    }

};


/* ========================================================= */
/* 03. REGISTRAR PÁGINA NO DOMINUS                          */
/* ========================================================= */
/*
    Registra a página com o nome:

        atualizacao

    Assim, navigate('atualizacao') consegue renderizar
    esta tela dentro do view-port.
*/

registerPage(

    'atualizacao',

    renderAtualizacao

);