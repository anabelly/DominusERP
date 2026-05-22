/* ========================= */
/* RELATÓRIOS */
/* ========================= */

window.renderRelatorios = function () {

    let html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:25px;
">

    <!-- TOPO -->

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        flex-wrap:wrap;
        gap:15px;
    ">

        <div>

            <div style="
                font-size:28px;
                font-weight:700;
            ">
                Relatórios Gerenciais
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Financeiro • Estoque • DRE
            </div>

        </div>

    </div>

    <!-- GRID -->

    <div style="
        display:grid;
        grid-template-columns:
            repeat(auto-fit,minmax(280px,1fr));
        gap:20px;
    ">

        ${cardRelatorio(
            '💵',
            'Fluxo de Caixa',
            'Entradas e saídas por período',
            'fluxo'
        )}

        ${cardRelatorio(
            '💸',
            'Contas a Pagar',
            'Pendentes, abertas e vencidas',
            'pagar'
        )}

        ${cardRelatorio(
            '💰',
            'Contas a Receber',
            'Pendentes, abertas e vencidas',
            'receber'
        )}

        ${cardRelatorio(
            '✅',
            'Contas Pagas',
            'Pagamentos realizados',
            'pagas'
        )}

        ${cardRelatorio(
            '🏦',
            'Contas Recebidas',
            'Recebimentos realizados',
            'recebidas'
        )}

        ${cardRelatorio(
            '📦',
            'Giro de Estoque',
            'Compras e movimentação',
            'estoque'
        )}

        ${cardRelatorio(
            '📋',
            'Tipo de Conta',
            'Consulta por categoria',
            'tipo'
        )}

        ${cardRelatorio(
            '📊',
            'DRE',
            'Demonstrativo completo',
            'dre'
        )}

    </div>

</div>
`;

    return html;
};

/* ========================= */
/* CARD */
/* ========================= */

window.cardRelatorio = function (
    emoji,
    titulo,
    subtitulo,
    tipo
) {

    return `

<div class="content-card" style="
    cursor:pointer;
    transition:.2s;
" onclick="abrirRelatorio('${tipo}')">

    <div style="
        font-size:40px;
        margin-bottom:15px;
    ">
        ${emoji}
    </div>

    <div style="
        font-size:20px;
        font-weight:700;
        margin-bottom:10px;
    ">
        ${titulo}
    </div>

    <div style="
        color:#6b7280;
        line-height:1.5;
    ">
        ${subtitulo}
    </div>

</div>
`;
};

/* ========================= */
/* ABRIR RELATÓRIO */
/* ========================= */

window.abrirRelatorio = function (tipo) {

    let extraCampo = '';

    if (tipo === 'tipo') {

        const tipos = [

            "Advogado",
            "Água e Saneamento",
            "Alarme/Segurança",
            "Aluguel",
            "Bonificação/Gratificação",
            "Cartão",
            "Comissão",
            "Contabilidade",
            "Despesa Veículos",
            "Energia Elétrica",
            "Internet/Telefone",
            "IPTU",
            "IPVA/Licenciamento",
            "Limpeza/Manutenção",
            "Marketing/Anúncios",
            "Matéria Prima/Estoque",
            "Multa Veículos",
            "Outros",
            "Plano de Saúde",
            "Pró-Labore",
            "Salários",
            "Seguros",
            "Simples Nacional/Impostos",
            "Software/ERP"

        ];

        extraCampo = `

<div>

    <label>

        Tipo da Conta

    </label>

    <select id="relatorio-tipo-conta">

        <option value="">

            Selecione

        </option>

        ${tipos.map(t => `

            <option value="${t}">

                ${t}

            </option>

        `).join('')}

    </select>

</div>

`;
    }

    const html = `

<div style="
    display:grid;
    grid-template-columns:
        repeat(auto-fit,minmax(220px,1fr));
    gap:18px;
">

    <div>

        <label>

            Data Inicial

        </label>

        <input
            type="date"
            id="relatorio-inicio">

    </div>

    <div>

        <label>

            Data Final

        </label>

        <input
            type="date"
            id="relatorio-fim">

    </div>

    ${extraCampo}

</div>

<div
    id="resultado-relatorio"
    style="
        margin-top:30px;
    ">
</div>

`;

    configModal({

        title:'Gerar Relatório',

        body:html,

        size:'large',

        confirmText:'Gerar',

        onConfirm(){

            gerarRelatorio(tipo);

        }

    });

};

/* ========================= */
/* CABEÇALHO IMPRESSÃO */
/* ========================= */

window.getCabecalhoRelatorio = function (

    titulo

){

    return `

<div id="print-area">

    <div style="
        text-align:center;
        margin-bottom:35px;
    ">

        <img
            src="logo.png"
            style="
                width:110px;
                height:auto;
                object-fit:contain;
                margin-bottom:15px;
            "
        >

        <div style="
            font-size:34px;
            font-weight:800;
        ">

            DOMINUS ERP

        </div>

        <div style="
            color:#6b7280;
            margin-top:6px;
        ">

            ${titulo}

        </div>

    </div>

`;

};

/* ========================= */
/* CARD KPI RELATÓRIOS */
/* ========================= */

window.cardIndicadorRelatorio =
function(

    titulo,
    valor,
    cor='#111827'

){

    return `

<div class="report-card">

    <div style="
        color:#6b7280;
        font-size:14px;
        margin-bottom:10px;
    ">

        ${titulo}

    </div>

    <div style="
        font-size:30px;
        font-weight:800;
        color:${cor};
    ">

        ${valor}

    </div>

</div>

`;
};

/* ========================= */
/* TABELA PADRÃO */
/* ========================= */

window.tabelaProfissionalRelatorio =
function(

    colunas,
    linhas

){

    return `

<div style="
    border:1px solid #e5e7eb;
    border-radius:20px;
    overflow:hidden;
    background:#fff;
">

<table>

<thead>

<tr>

${colunas.map(c=>

`<th>${c}</th>`

).join('')}

</tr>

</thead>

<tbody>

${linhas}

</tbody>

</table>

</div>

`;
};

/* ========================= */
/* GERAR RELATÓRIO */
/* ========================= */

window.gerarRelatorio = function(tipo){

    switch(tipo){

        case 'fluxo':
            gerarFluxoCaixa();
            break;

        case 'pagar':
            gerarContasPagar();
            break;

        case 'receber':
            gerarContasReceber();
            break;

        case 'pagas':
            gerarContasPagas();
            break;

        case 'recebidas':
            gerarContasRecebidas();
            break;

        case 'estoque':
            gerarGiroEstoque();
            break;

        case 'tipo':
            gerarTipoConta();
            break;

        case 'dre':
            gerarDRE();
            break;
    }
};

/* ========================= */
/* FILTRO PERÍODO */
/* ========================= */

window.filtrarPeriodoRelatorio = function(

    lista,
    campo='vencimento'

){

    const inicio =
        document.getElementById(
            'relatorio-inicio'
        ).value;

    const fim =
        document.getElementById(
            'relatorio-fim'
        ).value;

    return lista.filter(item=>{

        const data =
            item[campo];

        if(!data) return false;

        if(
            inicio &&
            data < inicio
        ){
            return false;
        }

        if(
            fim &&
            data > fim
        ){
            return false;
        }

        return true;
    });
};

/* ========================= */
/* FLUXO DE CAIXA PREMIUM */
/* ========================= */

window.gerarFluxoCaixa =
function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    let entradas = 0;
    let saidas = 0;

    dados.forEach(l=>{

        if(
            l.tipo === 'Receber'
        ){

            entradas +=
                Number(
                    l.valor || 0
                );
        }

        if(
            l.tipo === 'Pagar'
        ){

            saidas +=
                Number(
                    l.valor || 0
                );
        }

    });

    const saldo =
        entradas - saidas;

    let html =
        getCabecalhoRelatorio(
            'FLUXO DE CAIXA'
        );

    html += `

<div style="
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(240px,1fr));
gap:22px;
margin-bottom:35px;
">

${cardIndicadorRelatorio(

    'ENTRADAS',

    formatarMoeda(
        entradas
    ),

    '#16a34a'

)}

${cardIndicadorRelatorio(

    'SAÍDAS',

    formatarMoeda(
        saidas
    ),

    '#dc2626'

)}

${cardIndicadorRelatorio(

    'SALDO',

    formatarMoeda(
        saldo
    ),

    saldo >=0
        ? '#2563eb'
        : '#dc2626'

)}

</div>
`;

    let linhas='';

    dados.forEach(l=>{

        linhas += `

<tr>

<td>
${formatarData(
    l.vencimento
)}
</td>

<td>
${l.descricao||'-'}
</td>

<td>
${l.tipo||'-'}
</td>

<td>
${l.nome||'-'}
</td>

<td>
${formatarMoeda(
    l.valor||0
)}
</td>

</tr>
`;
    });

    html +=
        tabelaProfissionalRelatorio(

            [

                'Data',

                'Descrição',

                'Tipo',

                'Nome',

                'Valor'

            ],

            linhas

        );

    html += `

<div style="
margin-top:35px;
text-align:right;
">

<button
class="btn-action"
onclick="imprimirRelatorio()">

🖨 Imprimir

</button>

</div>

`;

    html +=
        getRodapeRelatorio();

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
};
/* ========================= */
/* CONTAS A PAGAR */
/* ========================= */

window.gerarContasPagar = function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    dados = dados.filter(l=>{

        if(
            l.tipo !== 'Pagar'
        ){
            return false;
        }

        return(

            l.status !== 'Pago'
        );
    });

    renderTabelaRelatorioFinanceiro(
        'CONTAS A PAGAR',
        dados
    );
};

/* ========================= */
/* CONTAS A RECEBER */
/* ========================= */

window.gerarContasReceber = function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    dados = dados.filter(l=>{

        if(
            l.tipo !== 'Receber'
        ){
            return false;
        }

        return(

            l.status !== 'Recebido'
        );
    });

    renderTabelaRelatorioFinanceiro(
        'CONTAS A RECEBER',
        dados
    );
};

/* ========================= */
/* TABELA FINANCEIRO PREMIUM */
/* ========================= */

window.renderTabelaRelatorioFinanceiro =
function(

    titulo,
    dados

){

    let total = 0;

    dados.forEach(l=>{

        total +=
            Number(
                l.valor || 0
            );

    });

    let html =
        getCabecalhoRelatorio(
            titulo
        );

    html += `

<div style="
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(260px,1fr));
gap:22px;
margin-bottom:35px;
">

${cardIndicadorRelatorio(

    'TOTAL GERAL',

    formatarMoeda(total),

    '#2563eb'

)}

${cardIndicadorRelatorio(

    'LANÇAMENTOS',

    dados.length,

    '#111827'

)}

</div>
`;

    let linhas='';

    if(
        dados.length===0
    ){

        linhas += `

<tr>

<td colspan="5" style="
padding:35px;
text-align:center;
">

Nenhum registro encontrado

</td>

</tr>
`;
    }

    dados.forEach(l=>{

        linhas += `

<tr>

<td>

${formatarData(
    l.vencimento
)}

</td>

<td>

${l.descricao||'-'}

</td>

<td>

${l.nome||'-'}

</td>

<td>

${l.status||'-'}

</td>

<td>

${formatarMoeda(
    l.valor||0
)}

</td>

</tr>
`;
    });

    html +=
        tabelaProfissionalRelatorio(

            [

                'Vencimento',

                'Descrição',

                'Nome',

                'Status',

                'Valor'

            ],

            linhas

        );

    html += `

<div style="
margin-top:35px;
text-align:right;
">

<button
class="btn-action"
onclick="imprimirRelatorio()">

🖨 Imprimir

</button>

</div>

`;

    html +=
        getRodapeRelatorio();

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
};

/* ========================= */
/* CONTAS PAGAS */
/* ========================= */

window.gerarContasPagas = function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    dados = dados.filter(l=>

        l.tipo === 'Pagar' &&

        l.status === 'Pago'

    );

    renderTabelaRelatorioFinanceiro(
        'CONTAS PAGAS',
        dados
    );
};

/* ========================= */
/* CONTAS RECEBIDAS */
/* ========================= */

window.gerarContasRecebidas = function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    dados = dados.filter(l=>

        l.tipo === 'Receber' &&

        l.status === 'Recebido'

    );

    renderTabelaRelatorioFinanceiro(
        'CONTAS RECEBIDAS',
        dados
    );
};

/* ========================= */
/* ESTOQUE PREMIUM */
/* ========================= */

window.gerarGiroEstoque =
function(){

    let dados =
        filtrarPeriodoRelatorio(

            db.produtos,

            'dataCadastro'

        );

    let total=0;

    dados.forEach(p=>{

        total +=
            Number(
                p.valor||0
            );

    });

    let html =
        getCabecalhoRelatorio(
            'GIRO DE ESTOQUE'
        );

    html += `

<div style="
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(240px,1fr));
gap:22px;
margin-bottom:35px;
">

${cardIndicadorRelatorio(

    'PRODUTOS',

    dados.length,

    '#111827'

)}

${cardIndicadorRelatorio(

    'TOTAL COMPRADO',

    formatarMoeda(
        total
    ),

    '#2563eb'

)}

</div>
`;

    let linhas='';

    dados.forEach(p=>{

        linhas += `

<tr>

<td>

${p.codigo||'-'}

</td>

<td>

${p.descricao||'-'}

</td>

<td>

${p.fornecedor||'-'}

</td>

<td>

${formatarData(

    p.dataCadastro
        ?.split('T')[0]

)}

</td>

<td>

${formatarMoeda(

    p.valor||0

)}

</td>

<td>

${p.quantidade||0}

</td>

</tr>
`;
    });

    html +=
        tabelaProfissionalRelatorio(

            [

                'Código',

                'Produto',

                'Fornecedor',

                'Compra',

                'Valor',

                'Qtd'

            ],

            linhas

        );

    html += `

<div style="
margin-top:35px;
text-align:right;
">

<button
class="btn-action"
onclick="imprimirRelatorio()">

🖨 Imprimir

</button>

</div>

`;

    html +=
        getRodapeRelatorio();

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
};
/* ========================= */
/* TIPO CONTA PREMIUM */
/* ========================= */

window.gerarTipoConta =
function(){

    const tipoConta =

        document.getElementById(
            'relatorio-tipo-conta'
        ).value;

    if(!tipoConta){

        alert(
            'Selecione um tipo.'
        );

        return;
    }

    let dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    dados =
        dados.filter(l=>

            l.tipoConta ===
            tipoConta

        );

    let total=0;

    dados.forEach(l=>{

        total +=
            Number(
                l.valor||0
            );

    });

    let html =
        getCabecalhoRelatorio(

            tipoConta
        );

    html += `

<div style="
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(240px,1fr));
gap:22px;
margin-bottom:35px;
">

${cardIndicadorRelatorio(

    'TIPO CONTA',

    tipoConta,

    '#111827'

)}

${cardIndicadorRelatorio(

    'TOTAL',

    formatarMoeda(
        total
    ),

    '#2563eb'

)}

</div>
`;

    let linhas='';

    dados.forEach(l=>{

        linhas += `

<tr>

<td>

${formatarData(
    l.vencimento
)}

</td>

<td>

${l.descricao||'-'}

</td>

<td>

${l.tipo||'-'}

</td>

<td>

${l.status||'-'}

</td>

<td>

${formatarMoeda(
    l.valor||0
)}

</td>

</tr>
`;
    });

    html +=
        tabelaProfissionalRelatorio(

            [

                'Data',

                'Descrição',

                'Tipo',

                'Status',

                'Valor'

            ],

            linhas

        );

    html += `

<div style="
margin-top:35px;
text-align:right;
">

<button
class="btn-action"
onclick="imprimirRelatorio()">

🖨 Imprimir

</button>

</div>

`;

    html +=
        getRodapeRelatorio();

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
};
/* ========================= */
/* DRE */
/* ========================= */

window.gerarDRE = function(){

    const dados =
        filtrarPeriodoRelatorio(
            db.financeiro
        );

    const receitas =
        dados.filter(l=>
            l.tipo==='Receber' &&
            l.status==='Recebido'
        );

    const despesas =
        dados.filter(l=>
            l.tipo==='Pagar' &&
            l.status==='Pago'
        );

    const receitaBruta =
        receitas.reduce(
            (a,b)=>
                a +
                Number(b.valor||0),
            0
        );

    const impostos =
        despesas
        .filter(f=>
            (f.tipoConta||'')
            .toLowerCase()
            .includes('imposto')
        )
        .reduce(
            (a,b)=>
                a +
                Number(b.valor||0),
            0
        );

    const custos =
        despesas
        .filter(f=>
            (f.tipoConta||'')
            .toLowerCase()
            .includes('estoque')
        )
        .reduce(
            (a,b)=>
                a +
                Number(b.valor||0),
            0
        );

    const despesasOperacionais =
        despesas
        .filter(f=>{

            const tipo =
                (f.tipoConta||'')
                .toLowerCase();

            return(

                !tipo.includes('imposto')

                &&

                !tipo.includes('estoque')

            );

        })

        .reduce(
            (a,b)=>
                a +
                Number(b.valor||0),
            0
        );

    const receitaLiquida =
        receitaBruta -
        impostos;

    const lucroBruto =
        receitaLiquida -
        custos;

    const resultadoOperacional =
        lucroBruto -
        despesasOperacionais;

    const lucroLiquido =
        resultadoOperacional;

    const margem =

        receitaBruta > 0

        ?

        (
            (
                lucroLiquido /
                receitaBruta
            ) * 100
        ).toFixed(1)

        :

        0;

    const cor =
        lucroLiquido >= 0
            ? '#16a34a'
            : '#dc2626';

    const textoAnalise =

        lucroLiquido >= 0

        ?

        `Lucro de ${formatarMoeda(lucroLiquido)} no período.`

        :

        `Prejuízo de ${formatarMoeda(Math.abs(lucroLiquido))} no período.`;

    let html =
        getCabecalhoRelatorio(
            'DRE PROFISSIONAL'
        );

    html += `

<div style="
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
margin-bottom:10px;
">

<div class="report-card" style="
padding:10px 14px;
">

<div style="
font-size:12px;
margin-bottom:4px;
">

Receita Bruta

</div>

<div style="
font-size:17px;
font-weight:800;
color:#16a34a;
">

${formatarMoeda(
    receitaBruta
)}

</div>

</div>

<div class="report-card" style="
padding:10px 14px;
">

<div style="
font-size:12px;
margin-bottom:4px;
">

Lucro Líquido

</div>

<div style="
font-size:17px;
font-weight:800;
color:${cor};
">

${formatarMoeda(
    lucroLiquido
)}

</div>

</div>

</div>

<table style="
margin-top:4px;
font-size:13px;
line-height:1.1;
">

<thead>

<tr>

<th style="
padding:7px;
font-size:12px;
">

DESCRIÇÃO

</th>

<th style="
padding:7px;
font-size:12px;
">

VALOR

</th>

</tr>

</thead>

<tbody>

<tr>

<td style="padding:6px 10px;">
<strong>Receita Bruta</strong>
</td>

<td style="
padding:6px 10px;
color:#16a34a;
">
${formatarMoeda(receitaBruta)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
(-) Impostos / Deduções
</td>

<td style="
padding:6px 10px;
color:#dc2626;
">
${formatarMoeda(impostos)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
<strong>Receita Líquida</strong>
</td>

<td style="padding:6px 10px;">
${formatarMoeda(receitaLiquida)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
(-) Custos (CMV / Estoque)
</td>

<td style="
padding:6px 10px;
color:#dc2626;
">
${formatarMoeda(custos)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
<strong>Lucro Bruto</strong>
</td>

<td style="padding:6px 10px;">
${formatarMoeda(lucroBruto)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
(-) Despesas Operacionais
</td>

<td style="
padding:6px 10px;
color:#dc2626;
">
${formatarMoeda(despesasOperacionais)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
<strong>Resultado Operacional</strong>
</td>

<td style="padding:6px 10px;">
${formatarMoeda(resultadoOperacional)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
<strong>Lucro Líquido</strong>
</td>

<td style="
padding:6px 10px;
font-weight:800;
color:${cor};
">
${formatarMoeda(lucroLiquido)}
</td>

</tr>

<tr>

<td style="padding:6px 10px;">
<strong>Margem de Lucro</strong>
</td>

<td style="padding:6px 10px;">
${margem}%
</td>

</tr>

</tbody>

</table>

<h2 style="
margin-top:10px;
margin-bottom:6px;
font-size:18px;
">

Resultado Mensal

</h2>

<div style="
height:10px;
background:${cor};
border-radius:999px;
margin-bottom:10px;
"></div>

<div class="report-card" style="
padding:10px 12px;
page-break-inside:avoid;
">

<div style="
font-size:14px;
font-weight:800;
margin-bottom:4px;
">

Análise do Período

</div>

<div style="
font-size:12px;
line-height:1.25;
">

${textoAnalise}

</div>

</div>

<div style="
margin-top:6px;
text-align:right;
">

<button
class="btn-action"
onclick="imprimirRelatorio()">

🖨 IMPRIMIR DRE

</button>

</div>

<div style="
margin-top:6px;
page-break-inside:avoid;
">

${getRodapeRelatorio()}

</div>
`;

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
};

/* ========================= */
/* LOGO EMPRESA */
/* ========================= */

window.logoRelatorio = function(){

    return `

<img
    src="logo.png"
    style="
        width:95px;
        height:auto;
        object-fit:contain;
    "
>

`;

};
/* ========================= */
/* CABEÇALHO PROFISSIONAL */
/* ========================= */

window.getCabecalhoRelatorio =
function(titulo){

    const inicio =
        document.getElementById(
            'relatorio-inicio'
        )?.value || '-';

    const fim =
        document.getElementById(
            'relatorio-fim'
        )?.value || '-';

    return `

<div id="print-area">

<div class="report-container">

    <div class="report-header">

        <div class="report-header-left">

            ${logoRelatorio()}

        </div>

        <div class="report-header-right">

            <div class="report-title">

                ${titulo}

            </div>

            <div class="report-meta">

                <div>

                    <strong>Período:</strong>

                    ${inicio} até ${fim}

                </div>

                <div>

                    <strong>Gerado em:</strong>

                    ${new Date()
                        .toLocaleString(
                            'pt-BR'
                        )}

                </div>

            </div>

        </div>

    </div>

`;
};

/* ========================= */
/* RODAPÉ PROFISSIONAL */
/* ========================= */

window.getRodapeRelatorio =
function(){

    return `

<div class="report-footer">

    <div class="assinatura-box">

        <div class="assinatura-line"></div>

        <div class="assinatura-text">

            Responsável

        </div>

    </div>

    <div class="assinatura-box">

        <div class="assinatura-line"></div>

        <div class="assinatura-text">

            Diretoria / Gestão

        </div>

    </div>

</div>

</div>

</div>
`;
};
/* ========================= */
/* IMPRIMIR PROFISSIONAL */
/* ========================= */

window.imprimirRelatorio =
async function(){

    const conteudo =

        document.getElementById(
            'print-area'
        )?.innerHTML;

    if(!conteudo) return;

   /* ========================= */
/* LOGO ABSOLUTA */
/* ========================= */

const logo =

    `file:///${window.location.pathname
        .replace(
            /\/[^\/]*$/,
            '/logo.png'
        )}`;

/* ========================= */
/* CORRIGE CAMINHOS */
/* ========================= */

const conteudoCorrigido =

    conteudo

    .replaceAll(
        './logo.png',
        logo
    )

    .replaceAll(
        'logo.png',
        logo
    );
    /* ========================= */
    /* HTML FINAL */
    /* ========================= */

    const html = `

<html>

<head>

<title>

Relatório

</title>

<style>

${document.getElementById(
'css-relatorios'
)?.innerHTML}

body{

    background:#f3f4f6;

    padding:35px;

}

#print-area{

    background:#fff;

    border-radius:22px;

    padding:45px;

    box-shadow:
        0 15px 45px
        rgba(
            0,
            0,
            0,
            .10
        );

}

table{

    width:100%;

    border-collapse:collapse;

}

thead{

    background:#111827;

}

thead th{

    color:#fff;

    padding:16px;

    font-size:13px;

    text-transform:uppercase;

    letter-spacing:.6px;

}

tbody td{

    padding:16px;

    border-bottom:
        1px solid #e5e7eb;

}

tbody tr:nth-child(even){

    background:#f9fafb;

}

@page{

    size:A4;

    margin:15mm;

}

@media print{

    body{

        background:#fff;

        padding:0;

    }

    #print-area{

        box-shadow:none;

        padding:0;

    }

}

</style>

</head>

<body>

<div id="print-area">

${conteudoCorrigido}

</div>

<script>

window.onload=()=>{

    setTimeout(()=>{

        window.print();

    },700);

};

</script>

</body>

</html>

`;

    try{

        await window.api
        .imprimirHTML(
            html
        );

    }

    catch(e){

        console.error(

            'Erro impressão:',

            e

        );

    }

};
/* ========================= */
/* CSS GLOBAL RELATÓRIOS */
/* ========================= */

window.addEventListener(
'load',
()=>{

    if(
        document.getElementById(
            'css-relatorios'
        )
    ) return;

    const style =
        document.createElement(
            'style'
        );

    style.id =
        'css-relatorios';

    style.innerHTML = `

/* ========================= */
/* BASE */
/* ========================= */

body{

    font-family:
        Inter,
        Arial,
        sans-serif;

    background:#f4f6f9;

    color:#111827;

    -webkit-print-color-adjust:exact !important;

    print-color-adjust:exact !important;
}

/* ========================= */
/* AREA RELATORIO */
/* ========================= */

.report-container{

    background:#ffffff;

    border-radius:22px;

    padding:45px;

    box-shadow:
        0 12px 35px
        rgba(
            0,
            0,
            0,
            .08
        );

    overflow:hidden;
}

/* ========================= */
/* HEADER */
/* ========================= */

.report-header{

    display:flex;

    justify-content:
        space-between;

    align-items:flex-start;

    gap:30px;

    padding-bottom:30px;

    margin-bottom:35px;

    border-bottom:
        2px solid #e5e7eb;
}

.report-title{

    font-size:34px;

    font-weight:800;

    color:#111827;

    margin-bottom:12px;
}

.report-meta{

    display:flex;

    flex-direction:column;

    gap:8px;

    color:#6b7280;

    font-size:14px;
}

/* ========================= */
/* TARJAS / SEÇÕES */
/* ========================= */

.report-section-title{

    background:#111827;

    color:#ffffff;

    padding:18px 24px;

    border-radius:16px;

    font-size:20px;

    font-weight:700;

    margin-bottom:24px;
}

/* ========================= */
/* TABELA */
/* ========================= */

#print-area table{

    width:100%;

    border-collapse:collapse;

    border-radius:18px;

    overflow:hidden;

    margin-top:25px;

    background:#fff;
}

#print-area thead{

    background:#111827;
}

#print-area th{

    background:#111827 !important;

    color:#ffffff !important;

    padding:16px;

    font-size:14px;

    font-weight:700;

    text-align:left;
}

#print-area td{

    padding:15px;

    border-bottom:
        1px solid #e5e7eb;

    font-size:14px;
}

#print-area tbody tr:nth-child(even){

    background:#f8fafc !important;
}

#print-area tbody tr:hover{

    background:#eef2ff;
}

/* ========================= */
/* CARDS */
/* ========================= */

.report-card{

    background:#ffffff;

    border:
        1px solid #e5e7eb;

    border-radius:20px;

    padding:24px;

    box-shadow:
        0 8px 25px
        rgba(
            0,
            0,
            0,
            .06
        );
}

/* ========================= */
/* TOTAL */
/* ========================= */

.report-total{

    background:#111827;

    color:#ffffff;

    padding:22px;

    border-radius:18px;

    font-size:22px;

    font-weight:800;

    text-align:right;

    margin-top:30px;
}

/* ========================= */
/* FOOTER */
/* ========================= */

.report-footer{

    display:flex;

    justify-content:
        space-between;

    gap:70px;

    margin-top:100px;
}

.assinatura-box{

    flex:1;

    text-align:center;
}

.assinatura-line{

    border-top:
        2px solid #111827;

    margin-bottom:10px;
}

.assinatura-text{

    font-size:14px;

    color:#4b5563;
}

/* ========================= */
/* BOTÃO */
/* ========================= */

.report-print-btn{

    background:#111827;

    color:#fff;

    border:none;

    border-radius:12px;

    padding:12px 22px;

    font-weight:700;

    cursor:pointer;
}

/* ========================= */
/* IMPRESSÃO */
/* ========================= */

@media print{

    *{

        -webkit-print-color-adjust:
            exact !important;

        print-color-adjust:
            exact !important;
    }

    button{

        display:none!important;
    }

    body{

        background:#ffffff!important;
    }

    .report-container{

        box-shadow:none!important;

        padding:0!important;
    }

    .report-section-title{

        background:#111827!important;

        color:#ffffff!important;
    }

    .report-total{

        background:#111827!important;

        color:#ffffff!important;
    }

    table thead{

        background:#111827!important;
    }

    th{

        background:#111827!important;

        color:#ffffff!important;
    }

    tbody tr:nth-child(even){

        background:#f8fafc!important;
    }

}

`;

    document.head.appendChild(
        style
    );

});

/* ========================= */
/* MENU */
/* ========================= */

if(

    !window.pages.relatorios

){

    registerPage(

        'relatorios',

        renderRelatorios
    );
}

/* ========================= */
/* NAVEGAÇÃO MENU */
/* ========================= */

window.irRelatorios = function(){

    navigate(
        'relatorios'
    );
};

/* ========================= */
/* REGISTRAR */
/* ========================= */

registerPage(
    'relatorios',
    renderRelatorios
);