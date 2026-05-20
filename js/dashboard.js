/* ========================= */
/* DASHBOARD */
/* ========================= */

registerPage('dash', function () {

    /* ======================================== */
    /* FINANCEIRO */
    /* ======================================== */

    const contasReceber =

        db.financeiro.filter(f =>

            f.tipo === 'Receber'

            ||

            f.tipoFluxo === 'receber'
        );

    const contasPagar =

        db.financeiro.filter(f =>

            f.tipo === 'Pagar'

            ||

            f.tipoFluxo === 'pagar'
        );

    const totalReceber =

        contasReceber.reduce(

            (a,b)=>

                a +
                num(b.valor),

            0
        );

    const totalPagar =

        contasPagar.reduce(

            (a,b)=>

                a +
                num(b.valor),

            0
        );

    /* ======================================== */
    /* VENDAS MENSAIS */
    /* ======================================== */

    const meses = [

        'JAN','FEV','MAR','ABR',
        'MAI','JUN','JUL','AGO',
        'SET','OUT','NOV','DEZ'
    ];

    const vendasMensais =

        Array(12).fill(0);

    contasReceber.forEach(l=>{

        const data =

            l.dataPagamento ||

            l.vencimento;

        if(!data) return;

        let d;

        if(data.includes('/')){

            d =
                normalizarData(data);

        }else{

            d =
                new Date(data);
        }

        if(
            !d ||
            isNaN(d)
        ) return;

        const mes =
            d.getMonth();

        vendasMensais[mes] +=

            num(
                l.valor
            );
    });

    const maiorVenda =

        Math.max(
            ...vendasMensais,
            1
        );

    /* ======================================== */
    /* HTML */
    /* ======================================== */

    return `

<h1 style="
margin-bottom:10px;
">

Visão Geral do Negócio

</h1>

<div class="stat-grid">

    <div class="stat-card green">

        <div class="stat-label">

            Contas a Receber

        </div>

        <div class="stat-value">

            ${formatarMoeda(
                totalReceber
            )}

        </div>

    </div>

    <div class="stat-card">

        <div class="stat-label">

            Contas a Pagar

        </div>

        <div class="stat-value">

            ${formatarMoeda(
                totalPagar
            )}

        </div>

    </div>

</div>

<div style="
display:grid;
grid-template-columns:1fr;
gap:20px;
">

<div class="content-card">

<h3 style="
margin-bottom:25px;
">

Desempenho de Vendas (Mensal)

</h3>

<div style="
display:flex;
align-items:flex-end;
justify-content:space-between;
gap:10px;
height:260px;
padding:20px 10px 10px;
background:#fafafa;
border:1px solid #e5e7eb;
border-radius:14px;
">

${vendasMensais.map(

    (valor,i)=>{

        const altura =

            valor > 0

            ?

            (
                (
                    valor /
                    maiorVenda
                ) * 180
            )

            :

            10;

        return `

<div style="
display:flex;
flex-direction:column;
align-items:center;
justify-content:flex-end;
flex:1;
height:100%;
">

<div
title="${formatarMoeda(valor)}"
style="
width:100%;
max-width:42px;
height:${altura}px;
background:
linear-gradient(
180deg,
#22c55e,
#15803d
);
border-radius:
10px 10px 0 0;
cursor:pointer;
transition:.2s;
box-shadow:
0 4px 10px
rgba(0,0,0,.08);
">
</div>

<div style="
margin-top:10px;
font-size:11px;
font-weight:700;
color:#6b7280;
">

${meses[i]}

</div>

</div>

`;
    }

).join('')}

</div>

</div>

</div>

<p style="
font-size:11px;
color:#777;
margin-top:30px;
text-align:center;
">

© 2026 Dominus ERP
- Todos os direitos reservados

</p>

`;
});