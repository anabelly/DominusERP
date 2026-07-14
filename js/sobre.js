/* ========================= */
/* SOBRE */
/* ========================= */

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


/* ========================= */
/* REGISTRAR */
/* ========================= */

registerPage(
    'sobre',
    renderSobre
);