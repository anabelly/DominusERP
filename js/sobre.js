/* ========================= */
/* SOBRE */
/* ========================= */

window.renderSobre = function () {

    return `

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
                src="logo.png"
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

            v1.0.0

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
};

/* ========================= */
/* REGISTRAR */
/* ========================= */

registerPage(
    'sobre',
    renderSobre
);