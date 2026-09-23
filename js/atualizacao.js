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
    gap:18px;
    max-width:1180px;
    margin:0 auto;
    color:#111827;
">

    <!-- CABEÇALHO -->
    <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:18px;
        padding:26px 28px;
        position:relative;
        overflow:hidden;
    ">

        <div style="
            position:absolute;
            left:0;
            top:0;
            bottom:0;
            width:5px;
            background:#ef233c;
        "></div>

        <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:28px;
            flex-wrap:wrap;
        ">

            <div style="
                display:flex;
                align-items:center;
                gap:22px;
                min-width:0;
            ">

                <div style="
                    width:115px;
                    min-width:115px;
                    height:92px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:10px 14px;
                    border-radius:14px;
                    background:#fffafb;
                    border:1px solid #f8d7dd;
                ">

                    <img
                        src="dominus.png"
                        alt="Dominus ERP"
                        style="
                            width:100%;
                            max-width:100px;
                            max-height:75px;
                            object-fit:contain;
                            display:block;
                        "
                    >

                </div>

                <div style="min-width:0;">

                    <div style="
                        color:#ef233c;
                        font-size:11px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.12em;
                        margin-bottom:6px;
                    ">
                        Sistema
                    </div>

                    <h1 style="
                        margin:0;
                        font-size:30px;
                        line-height:1.1;
                        font-weight:900;
                        color:#111827;
                    ">
                        Atualização do Dominus ERP
                    </h1>

                    <div style="
                        margin-top:9px;
                        max-width:650px;
                        color:#6b7280;
                        font-size:14px;
                        line-height:1.65;
                    ">
                        Verifique se existe uma versão mais recente do sistema
                        e mantenha o Dominus ERP atualizado com as últimas
                        melhorias e correções disponíveis.
                    </div>

                </div>

            </div>

        </div>

    </div>


    <!-- RESUMO -->
    <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
        gap:14px;
    ">

        <!-- VERSÃO INSTALADA -->
        <div style="
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:20px 22px;
        ">

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
            ">

                <div>

                    <div style="
                        color:#9ca3af;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.09em;
                    ">
                        Versão instalada
                    </div>

                    <div style="
                        margin-top:7px;
                        color:#111827;
                        font-size:23px;
                        font-weight:900;
                    ">

                        <span id="versao-instalada">
                            Carregando...
                        </span>

                    </div>

                </div>

                <div style="
                    width:46px;
                    height:46px;
                    min-width:46px;
                    border-radius:13px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#fff1f2;
                    border:1px solid #fecdd3;
                    font-size:21px;
                ">
                    ⚙️
                </div>

            </div>

        </div>


        <!-- STATUS DO SISTEMA -->
        <div style="
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:20px 22px;
        ">

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
            ">

                <div>

                    <div style="
                        color:#9ca3af;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.09em;
                    ">
                        Atualizações
                    </div>

                    <div style="
                        margin-top:7px;
                        color:#111827;
                        font-size:16px;
                        font-weight:800;
                    ">
                        Verificação manual
                    </div>

                    <div style="
                        margin-top:4px;
                        color:#6b7280;
                        font-size:11px;
                    ">
                        Consulte quando desejar.
                    </div>

                </div>

                <div style="
                    width:46px;
                    height:46px;
                    min-width:46px;
                    border-radius:13px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    font-size:21px;
                ">
                    🔄
                </div>

            </div>

        </div>

    </div>


    <!-- AÇÃO DE ATUALIZAÇÃO -->
    <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:24px;
    ">

        <div style="
            display:flex;
            align-items:center;
            gap:10px;
            margin-bottom:12px;
        ">

            <div style="
                width:4px;
                height:20px;
                border-radius:999px;
                background:#ef233c;
            "></div>

            <h2 style="
                margin:0;
                font-size:18px;
                font-weight:900;
                color:#111827;
            ">
                Verificar atualizações
            </h2>

        </div>

        <div style="
            color:#6b7280;
            font-size:13px;
            line-height:1.7;
            max-width:760px;
        ">
            Ao iniciar a verificação, o Dominus ERP consultará se existe
            uma versão mais recente disponível. Caso uma nova versão seja
            encontrada, você poderá confirmar o download e a instalação.
        </div>


        <div style="
            margin-top:18px;
            display:flex;
            align-items:center;
            gap:14px;
            flex-wrap:wrap;
        ">

            <button
                class="btn-action"
                onclick="verificarAtualizacao()"
                style="
                    background:#ef233c;
                    color:#ffffff;
                    border:1px solid #ef233c;
                    padding:10px 16px;
                    border-radius:9px;
                    font-weight:800;
                    cursor:pointer;
                "
            >
                🔍 Verificar Atualizações
            </button>

            <div style="
                color:#9ca3af;
                font-size:11px;
                line-height:1.5;
            ">
                O sistema avisará antes de baixar e instalar qualquer nova versão.
            </div>

        </div>


        <!-- ÁREA DE STATUS -->
        <div
            id="update-status"
            style="
                margin-top:20px;
                color:#475569;
                line-height:1.7;
                font-size:12px;
            "
        ></div>

    </div>


    <!-- COMO FUNCIONA -->
    <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:22px 24px;
    ">

        <div style="
            display:flex;
            align-items:center;
            gap:10px;
            margin-bottom:16px;
        ">

            <div style="
                width:4px;
                height:20px;
                border-radius:999px;
                background:#ef233c;
            "></div>

            <h2 style="
                margin:0;
                font-size:18px;
                font-weight:900;
                color:#111827;
            ">
                Como funciona
            </h2>

        </div>

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
            gap:12px;
        ">

            <div style="
                padding:15px;
                border-radius:12px;
                background:#fafafa;
                border:1px solid #eceff3;
            ">

                <div style="
                    color:#ef233c;
                    font-size:10px;
                    font-weight:900;
                ">
                    01
                </div>

                <div style="
                    margin-top:5px;
                    font-size:13px;
                    font-weight:800;
                    color:#111827;
                ">
                    Verificação
                </div>

                <div style="
                    margin-top:5px;
                    color:#6b7280;
                    font-size:11px;
                    line-height:1.5;
                ">
                    O sistema consulta se existe uma versão mais recente.
                </div>

            </div>


            <div style="
                padding:15px;
                border-radius:12px;
                background:#fafafa;
                border:1px solid #eceff3;
            ">

                <div style="
                    color:#ef233c;
                    font-size:10px;
                    font-weight:900;
                ">
                    02
                </div>

                <div style="
                    margin-top:5px;
                    font-size:13px;
                    font-weight:800;
                    color:#111827;
                ">
                    Confirmação
                </div>

                <div style="
                    margin-top:5px;
                    color:#6b7280;
                    font-size:11px;
                    line-height:1.5;
                ">
                    Uma nova versão só será baixada após sua confirmação.
                </div>

            </div>


            <div style="
                padding:15px;
                border-radius:12px;
                background:#fafafa;
                border:1px solid #eceff3;
            ">

                <div style="
                    color:#ef233c;
                    font-size:10px;
                    font-weight:900;
                ">
                    03
                </div>

                <div style="
                    margin-top:5px;
                    font-size:13px;
                    font-weight:800;
                    color:#111827;
                ">
                    Instalação
                </div>

                <div style="
                    margin-top:5px;
                    color:#6b7280;
                    font-size:11px;
                    line-height:1.5;
                ">
                    O Dominus baixa a atualização e inicia a instalação.
                </div>

            </div>

        </div>

    </div>


    <!-- AVISO -->
    <div style="
        display:flex;
        align-items:flex-start;
        gap:10px;
        padding:14px 16px;
        border-radius:12px;
        background:#fffafb;
        border:1px solid #f8d7dd;
        color:#6b7280;
        font-size:11px;
        line-height:1.6;
    ">

        <span style="font-size:17px;">ℹ️</span>

        <span>
            Durante uma instalação, o sistema poderá ser fechado
            automaticamente para concluir a atualização.
        </span>

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