/* ========================================================= */
/* DOMINUS ERP - SOBRE.JS                                    */
/* ========================================================= */
/*
    TELA SOBRE O SISTEMA

    Este arquivo renderiza as informações institucionais
    do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Exibir identidade visual do sistema
    2. Exibir a empresa
    3. Exibir o desenvolvedor
    4. Buscar e mostrar a versão instalada
    5. Registrar a página "sobre"

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    Nenhum texto, dado, imagem ou comportamento foi modificado.
*/


/* ========================================================= */
/* 01. RENDERIZAÇÃO DA TELA SOBRE                          */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderSobre */
/* Renderiza as informações institucionais e preenche a versão instalada. */
/* --------------------------------------------------------- */

window.renderSobre = function () {


    const html = `

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
                gap:24px;
                min-width:0;
            ">

                <div style="
                    width:190px;
                    min-width:190px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:16px 18px;
                    border-radius:14px;
                    background:#fffafb;
                    border:1px solid #f8d7dd;
                ">

                    <img
                        src="dominus.png"
                        alt="Dominus ERP"
                        style="
                            width:100%;
                            max-width:180px;
                            max-height:135px;
                            object-fit:contain;
                            display:block;
                            filter:drop-shadow(0 6px 14px rgba(239,35,60,.10));
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
                        Sistema de Gestão
                    </div>

                    <h1 style="
                        margin:0;
                        font-size:30px;
                        line-height:1.1;
                        font-weight:900;
                        color:#111827;
                    ">
                        Dominus ERP
                    </h1>

                    <div style="
                        margin-top:9px;
                        max-width:650px;
                        color:#6b7280;
                        font-size:14px;
                        line-height:1.65;
                    ">
                        Sistema ERP desenvolvido exclusivamente para a
                        <strong style="color:#374151;">
                            WN Comunicação Visual
                        </strong>,
                        reunindo em um único ambiente os principais processos
                        administrativos, comerciais, financeiros e operacionais.
                    </div>

                </div>

            </div>

            <div style="
                min-width:160px;
                border-left:1px solid #e5e7eb;
                padding-left:22px;
            ">

                <div style="
                    color:#9ca3af;
                    font-size:9px;
                    font-weight:900;
                    text-transform:uppercase;
                    letter-spacing:.10em;
                ">
                    Versão instalada
                </div>

                <div
                    id="versao-sistema"
                    style="
                        margin-top:6px;
                        color:#111827;
                        font-size:19px;
                        font-weight:900;
                    "
                >
                    carregando...
                </div>

            </div>

        </div>

    </div>


    <!-- INFORMAÇÕES PRINCIPAIS -->
    <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
        gap:14px;
    ">

        <div style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:14px;
            padding:18px;
        ">

            <div style="
                color:#ef233c;
                font-size:10px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            ">
                Empresa
            </div>

            <div style="
                margin-top:7px;
                font-size:16px;
                font-weight:800;
            ">
                WN Comunicação Visual
            </div>

        </div>


        <div style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:14px;
            padding:18px;
        ">

            <div style="
                color:#ef233c;
                font-size:10px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            ">
                Desenvolvedor
            </div>

            <div style="
                margin-top:7px;
                font-size:16px;
                font-weight:800;
            ">
                Luana de Souza Bianchini
            </div>

        </div>


        <div style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:14px;
            padding:18px;
        ">

            <div style="
                color:#ef233c;
                font-size:10px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            ">
                Aplicação
            </div>

            <div style="
                margin-top:7px;
                font-size:16px;
                font-weight:800;
            ">
                ERP de uso interno
            </div>

        </div>

    </div>


    <!-- SOBRE O SISTEMA -->
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
                Sobre o Dominus ERP
            </h2>

        </div>

        <div style="
            color:#6b7280;
            font-size:13px;
            line-height:1.75;
        ">
            O Dominus ERP foi estruturado para centralizar a rotina da
            WN Comunicação Visual, reduzindo controles separados e mantendo
            informações importantes da empresa em um único sistema.
            A plataforma integra áreas comerciais, administrativas,
            financeiras, operacionais e de recursos humanos.
        </div>

    </div>


    <!-- MÓDULOS -->
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
                Principais módulos
            </h2>

        </div>

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(185px,1fr));
            gap:10px;
        ">

            ${[
                'Dashboard',
                'Agenda',
                'Clientes',
                'Fornecedores',
                'Estoque',
                'Orçamentos',
                'Ordens de Serviço',
                'Fluxo Financeiro',
                'Recibos / Comprovantes',
                'Funcionários / RH',
                'Solicitações',
                'Registro de Retrabalho',
                'Pós-venda',
                'Relatórios',
                'Backup / Restauração'
            ].map(item => `

                <div style="
                    display:flex;
                    align-items:center;
                    gap:9px;
                    padding:10px 12px;
                    border-radius:10px;
                    background:#fafafa;
                    border:1px solid #eceff3;
                    color:#374151;
                    font-size:12px;
                    font-weight:700;
                ">

                    <span style="
                        width:7px;
                        height:7px;
                        min-width:7px;
                        border-radius:50%;
                        background:#ef233c;
                    "></span>

                    ${item}

                </div>

            `).join('')}

        </div>

    </div>


    <!-- DESENVOLVIMENTO -->
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
                Desenvolvimento
            </h2>

        </div>

        <div style="
            display:grid;
            grid-template-columns:1fr auto;
            gap:20px;
            align-items:center;
        ">

            <div>

                <div style="
                    color:#111827;
                    font-size:17px;
                    font-weight:900;
                ">
                    Luana de Souza Bianchini
                </div>

                <div style="
                    margin-top:6px;
                    color:#6b7280;
                    font-size:13px;
                    line-height:1.6;
                ">
                    Responsável pela criação, estruturação e evolução
                    do Dominus ERP para atender às necessidades internas
                    da WN Comunicação Visual.
                </div>

            </div>

            <div style="
                font-size:28px;
                opacity:.85;
            ">
                💻
            </div>

        </div>

    </div>


    <!-- RODAPÉ -->
    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:14px;
        flex-wrap:wrap;
        padding:4px 2px 0;
        color:#9ca3af;
        font-size:10px;
    ">

        <span>
            Dominus ERP • WN Comunicação Visual
        </span>

        <span>
            Sistema de uso interno
        </span>

    </div>

</div>

`;


    /* ===================================================== */
    /* 01.1 CARREGAR VERSÃO INSTALADA                     */
    /* ===================================================== */
    /*
        Após a criação do HTML, preenche #versao-sistema
        usando a API exposta pelo preload.js.
    */

    setTimeout(()=>{


        const campo =
            document.getElementById(
                'versao-sistema'
            );


        if(
            campo &&
            window.api?.versaoSistema
        ){

            campo.innerText =
                'v' + window.api.versaoSistema();

        }


    },100);



    return html;


};


/* ========================================================= */
/* 02. REGISTRAR PÁGINA NO SISTEMA                         */
/* ========================================================= */

registerPage(
    'sobre',
    renderSobre
);