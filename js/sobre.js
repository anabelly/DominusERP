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
    gap:25px;
">

    <div>

        <h1 style="
            color:var(--primary);
        ">

            Sobre o Sistema

        </h1>

    </div>


    <div class="content-card">

        <div style="
            display:flex;
            gap:25px;
            align-items:center;
            flex-wrap:wrap;
        ">

            <img
                src="dominus.png"
                style="
                    width:160px;
                    object-fit:contain;
                ">


            <div>

                <h2>

                    Dominus ERP

                </h2>


                <div style="
                    color:#6b7280;
                    margin-top:8px;
                ">

                    Sistema ERP desenvolvido
                    exclusivamente para
                    WN Comunicação Visual.

                </div>

            </div>

        </div>

    </div>


    <div class="content-card">

        <h3>

            Informações

        </h3>


        <div style="
            line-height:2;
        ">


            <strong>
                Versão:
            </strong>


            <span id="versao-sistema">
                carregando...
            </span>


            <br>


            <strong>
                Desenvolvedor:
            </strong>

            Luana de Souza Bianchini


            <br>


            <strong>
                Empresa:
            </strong>

            WN Comunicação Visual


        </div>

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