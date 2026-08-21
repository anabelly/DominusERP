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

            ${cardRelatorio(
    '📄',
    'Orçamentos',
    'Consulta por período, cliente e status',
    'orcamentos'
)}

${cardRelatorio(
    '🏷️',
    'Tipo de Produto',
    'Consulta por fornecedor e categoria',
    'tipoProduto'
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

window.abrirRelatorio = function(tipo){

    let extraCampo = '';

    if(tipo === 'orcamentos'){

    const clientes = [

        ...new Set(

            (db.clientes || [])

            .map(c=>c.nome)

            .filter(Boolean)

        )

    ];

    const status = [

        'Aguardando',

        'Aprovado',

        'Em Produção',

        'Recusado',

        'Cancelado',

        'Finalizado'

    ];

    extraCampo = `

<div>

<label>

Cliente

</label>

<select id="relatorio-cliente">

<option value="">

Todos

</option>

${clientes.map(c=>`

<option value="${c}">

${c}

</option>

`).join('')}

</select>

</div>

<div>

<label>

Status

</label>

<select id="relatorio-status">

<option value="">

Todos

</option>

${status.map(s=>`

<option value="${s}">

${s}

</option>

`).join('')}

</select>

</div>

`;
}
if(tipo === 'tipoProduto'){

    const fornecedores = [

        ...new Set(

            (db.produtos || [])

            .map(p=>p.fornecedor)

            .filter(Boolean)

        )

    ];

    const tipos = [

        ...new Set(

            (db.produtos || [])

            .map(p=>p.tipo)

            .filter(Boolean)

        )

    ];

    extraCampo = `

<div>

<label>

Fornecedor

</label>

<select id="relatorio-fornecedor">

<option value="">

Todos

</option>

${fornecedores.map(f=>`

<option value="${f}">

${f}

</option>

`).join('')}

</select>

</div>

<div>

<label>

Tipo Produto

</label>

<select id="relatorio-tipo-produto">

<option value="">

Todos

</option>

${tipos.map(t=>`

<option value="${t}">

${t}

</option>

`).join('')}

</select>

</div>

`;
}

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

window.gerarRelatorioOrcamentos = function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.orcamentos,
            'data'
        );

    const cliente =
        document.getElementById(
            'relatorio-cliente'
        )?.value || '';

    const status =
        document.getElementById(
            'relatorio-status'
        )?.value || '';

    if(cliente){

        dados =
            dados.filter(o=>

                o.cliente === cliente

            );

    }

    if(status){

        dados =
            dados.filter(o=>

                o.status === status

            );

    }

    let total = 0;

    dados.forEach(o=>{

        total +=
            Number(
                o.total || 0
            );

    });

    let linhas='';

    dados.forEach(o=>{

        linhas += `

<tr>

<td>

${formatarData(
    o.data
)}

</td>

<td>

${o.cliente||'-'}

</td>

<td>

${o.status||'-'}

</td>

<td>

${formatarMoeda(
    o.total||0
)}

</td>

</tr>

`;

    });

    let html =
        getCabecalhoRelatorio(
            'ORÇAMENTOS'
        );

    html += `

<div style="
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(240px,1fr));
gap:20px;
margin-bottom:30px;
">

${cardIndicadorRelatorio(

'ORÇAMENTOS',

dados.length,

'#111827'

)}

${cardIndicadorRelatorio(

'TOTAL',

formatarMoeda(total),

'#2563eb'

)}

</div>

`;

    html +=
        tabelaProfissionalRelatorio(

            [

                'Data',

                'Cliente',

                'Status',

                'Total'

            ],

            linhas

        );

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
};

window.gerarRelatorioTipoProduto =
function(){

    let dados =
        filtrarPeriodoRelatorio(
            db.produtos,
            'dataCadastro'
        );

    const fornecedor =
        document.getElementById(
            'relatorio-fornecedor'
        )?.value || '';

    const tipo =
        document.getElementById(
            'relatorio-tipo-produto'
        )?.value || '';

    if(fornecedor){

        dados =
            dados.filter(p=>

                p.fornecedor === fornecedor

            );

    }

    if(tipo){

        dados =
            dados.filter(p=>

                p.tipo === tipo

            );

    }

    let total=0;

    dados.forEach(p=>{

        total +=
            Number(
                p.valor||0
            );

    });

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

${p.tipo||'-'}

</td>

<td>

${p.fornecedor||'-'}

</td>

<td>

${formatarMoeda(
    p.valor||0
)}

</td>

</tr>

`;

    });

    let html =
        getCabecalhoRelatorio(
            'TIPO DE PRODUTO'
        );

    html += `

<div style="
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(240px,1fr));
gap:20px;
margin-bottom:30px;
">

${cardIndicadorRelatorio(

'PRODUTOS',

dados.length,

'#111827'

)}

${cardIndicadorRelatorio(

'TOTAL',

formatarMoeda(total),

'#2563eb'

)}

</div>

`;

    html +=
        tabelaProfissionalRelatorio(

            [

                'Código',

                'Produto',

                'Tipo',

                'Fornecedor',

                'Valor'

            ],

            linhas

        );

    document.getElementById(
        'resultado-relatorio'
    ).innerHTML = html;
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

        case 'orcamentos':
            gerarRelatorioOrcamentos();
            break;

        case 'tipoProduto':
        gerarRelatorioTipoProduto();
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
function (

    titulo,
    dados

){

    /* ========================= */
    /* ORDENAR POR DATA */
    /* MAIS ATUAL → MAIS LONGE */
    /* ========================= */

    dados.sort((a,b)=>{

        const dataA =
            a.vencimento || '';

        const dataB =
            b.vencimento || '';

        return dataA.localeCompare(dataB);

    });

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

${l.descricao || '-'}

</td>

<td>

${l.nome || '-'}

</td>

<td>

${l.status || '-'}

</td>

<td>

${formatarMoeda(
    l.valor || 0
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
};/* ========================= */
/* DRE PROFISSIONAL NOVO */
/* ========================= */

window.gerarDRE = function(){

    const inicio =
        document.getElementById(
            'relatorio-inicio'
        )?.value || '';

    const fim =
        document.getElementById(
            'relatorio-fim'
        )?.value || '';

    /*
        PERÍODO DO DRE

        Para os agrupamentos de despesas, usamos a mesma
        referência do relatório "Tipo de Conta": vencimento.

        Assim, qualquer valor mostrado no DRE para um tipo de
        conta bate com a consulta daquele mesmo tipo + período.
    */
    const dados =
        (db.financeiro || [])
        .filter(item => {

            const dataMovimento =
                item.vencimento
                ||
                '';

            if(!dataMovimento){
                return false;
            }

            if(
                inicio
                &&
                dataMovimento < inicio
            ){
                return false;
            }

            if(
                fim
                &&
                dataMovimento > fim
            ){
                return false;
            }

            return true;
        });


    /* ========================= */
    /* AUXILIARES                */
    /* ========================= */

    function numDRE(valor){

        if(
            typeof valor === 'number'
            &&
            Number.isFinite(valor)
        ){
            return valor;
        }

        let texto =
            String(valor ?? '')
            .trim()
            .replace(/R\$/gi,'')
            .replace(/\s/g,'');

        if(!texto){
            return 0;
        }

        /*
            Aceita tanto:
            12439.65
            quanto:
            12.439,65
        */
        if(texto.includes(',')){
            texto =
                texto
                .replace(/\./g,'')
                .replace(',','.');
        }

        texto =
            texto.replace(
                /[^0-9.-]/g,
                ''
            );

        const numero =
            Number(texto);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }

    function escDRE(valor){
        return String(valor ?? '')
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#039;');
    }

    function percentualDRE(valor, base){
        if(!(base > 0)) return '0,0%';

        return (
            valor / base * 100
        )
        .toLocaleString(
            'pt-BR',
            {
                minimumFractionDigits:1,
                maximumFractionDigits:1
            }
        ) + '%';
    }

    function dataBRDRE(data){
        if(!data) return '-';

        const partes =
            String(data).split('-');

        if(partes.length !== 3){
            return data;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function dataISODRE(data){
        return new Date(
            `${data}T12:00:00`
        );
    }

    function isoDRE(data){
        return [
            data.getFullYear(),
            String(data.getMonth()+1).padStart(2,'0'),
            String(data.getDate()).padStart(2,'0')
        ].join('-');
    }

    function normalizarTipoContaDRE(valor){
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .trim()
            .toLowerCase();
    }

    /*
        AGRUPAMENTO DO DRE

        Cada grupo abaixo usa SOMENTE os Tipos de Conta
        definidos para ele. Qualquer Tipo de Conta que não
        estiver em nenhum grupo conhecido cai em
        "Outras despesas".
    */
    const tiposDRE = {

        impostos:
            new Set([
                'simples nacional/impostos'
            ]),

        pessoal:
            new Set([
                'salarios',
                'bonificacao/gratificacao',
                'comissao'
            ]),

        administrativo:
            new Set([
                'advogado',
                'agua e saneamento',
                'alarme/seguranca',
                'aluguel',
                'cartao',
                'contabilidade',
                'energia eletrica',
                'internet/telefone',
                'iptu',
                'limpeza/manutencao',
                'marketing/anuncios',
                'plano de saude',
                'seguros',
                'software/erp'
            ]),

        materiaPrima:
            new Set([
                'materia prima/estoque'
            ]),

        veiculos:
            new Set([
                'despesa veiculos',
                'multa veiculos',
                'ipva/licenciamento'
            ])
    };

    function categoriaDespesaDRE(item){

        const tipo =
            normalizarTipoContaDRE(
                item.tipoConta
            );

        if(
            tiposDRE.impostos.has(tipo)
        ){
            return 'Impostos / Deduções';
        }

        if(
            tiposDRE.pessoal.has(tipo)
        ){
            return 'Pessoal e remunerações';
        }

        if(
            tiposDRE.administrativo.has(tipo)
        ){
            return 'Administrativo e serviços';
        }

        if(
            tiposDRE.materiaPrima.has(tipo)
        ){
            return 'Matéria prima';
        }

        if(
            tiposDRE.veiculos.has(tipo)
        ){
            return 'Veículos';
        }

        return 'Outras despesas';
    }

    function somarItensDRE(lista){
        return (lista || [])
            .reduce(
                (total,item)=>
                    total + numDRE(item.valor),
                0
            );
    }

    function calcularResumoDRE(lista){

        /*
            RECEITA:
            mantém a lógica atual do DRE:
            somente contas a receber já marcadas como Recebido.

            DESPESAS:
            seguem Tipo de Conta + período, exatamente como
            solicitado, independentemente do status.
            Isso faz os totais baterem com o relatório
            "Tipo de Conta" para o mesmo período.
        */
        const receitas =
            (lista || [])
            .filter(item =>
                item.tipo === 'Receber'
                &&
                item.status === 'Recebido'
            );

        const despesas =
            (lista || [])
            .filter(item =>
                item.tipo === 'Pagar'
            );

        const receitaBruta =
            somarItensDRE(
                receitas
            );

        const itensImpostos = [];
        const itensPessoal = [];
        const itensAdministrativo = [];
        const itensMateriaPrima = [];
        const itensVeiculos = [];
        const itensOutras = [];

        despesas.forEach(item=>{

            const categoria =
                categoriaDespesaDRE(
                    item
                );

            if(
                categoria ===
                'Impostos / Deduções'
            ){
                itensImpostos.push(
                    item
                );
                return;
            }

            if(
                categoria ===
                'Pessoal e remunerações'
            ){
                itensPessoal.push(
                    item
                );
                return;
            }

            if(
                categoria ===
                'Administrativo e serviços'
            ){
                itensAdministrativo.push(
                    item
                );
                return;
            }

            if(
                categoria ===
                'Matéria prima'
            ){
                itensMateriaPrima.push(
                    item
                );
                return;
            }

            if(
                categoria ===
                'Veículos'
            ){
                itensVeiculos.push(
                    item
                );
                return;
            }

            itensOutras.push(
                item
            );
        });

        const impostos =
            somarItensDRE(
                itensImpostos
            );

        const pessoal =
            somarItensDRE(
                itensPessoal
            );

        const administrativo =
            somarItensDRE(
                itensAdministrativo
            );

        const custos =
            somarItensDRE(
                itensMateriaPrima
            );

        const veiculos =
            somarItensDRE(
                itensVeiculos
            );

        const outrasDespesas =
            somarItensDRE(
                itensOutras
            );

        const itensOperacionais = [
            ...itensPessoal,
            ...itensAdministrativo,
            ...itensVeiculos,
            ...itensOutras
        ];

        const despesasOperacionais =
            pessoal
            +
            administrativo
            +
            veiculos
            +
            outrasDespesas;

        const receitaLiquida =
            receitaBruta - impostos;

        const lucroBruto =
            receitaLiquida - custos;

        const resultadoOperacional =
            lucroBruto - despesasOperacionais;

        const lucroLiquido =
            resultadoOperacional;

        const totalSaidas =
            impostos
            +
            custos
            +
            despesasOperacionais;

        /*
            Ordem fixa de exibição, conforme solicitado.
            Matéria prima fica na linha de custo direto do DRE,
            mas também aparece na Composição das despesas.
        */
        const gruposOrdenados = [
            {
                nome:
                    'Pessoal e remunerações',
                valor:
                    pessoal
            },
            {
                nome:
                    'Administrativo e serviços',
                valor:
                    administrativo
            },
            {
                nome:
                    'Veículos',
                valor:
                    veiculos
            },
            {
                nome:
                    'Outras despesas',
                valor:
                    outrasDespesas
            }
        ];

        return {
            receitas,
            despesas,
            itensImpostos,
            itensPessoal,
            itensAdministrativo,
            itensMateriaPrima,
            itensVeiculos,
            itensOutras,
            itensOperacionais,
            receitaBruta,
            impostos,
            pessoal,
            administrativo,
            custos,
            veiculos,
            outrasDespesas,
            despesasOperacionais,
            receitaLiquida,
            lucroBruto,
            resultadoOperacional,
            lucroLiquido,
            totalSaidas,
            gruposOrdenados
        };
    }

    const resumo =
        calcularResumoDRE(
            dados
        );

    const {
        receitaBruta,
        impostos,
        pessoal,
        administrativo,
        custos,
        veiculos,
        outrasDespesas,
        despesasOperacionais,
        receitaLiquida,
        lucroBruto,
        lucroLiquido,
        totalSaidas,
        gruposOrdenados
    } = resumo;

    const margemBruta =
        receitaLiquida > 0
        ?
        lucroBruto / receitaLiquida * 100
        :
        0;

    const margemLiquida =
        receitaBruta > 0
        ?
        lucroLiquido / receitaBruta * 100
        :
        0;

    const positivo =
        lucroLiquido >= 0;

    const corResultado =
        positivo
        ? '#16a34a'
        : '#dc2626';

    const fundoResultado =
        positivo
        ? '#f0fdf4'
        : '#fef2f2';

    /* ========================= */
    /* COMPARATIVO ANTERIOR      */
    /* ========================= */

    let comparativo = null;

    if(
        inicio
        &&
        fim
        &&
        fim >= inicio
    ){
        const inicioAtual =
            dataISODRE(inicio);

        const fimAtual =
            dataISODRE(fim);

        const duracaoDias =
            Math.round(
                (
                    fimAtual - inicioAtual
                )
                /
                86400000
            ) + 1;

        const fimAnterior =
            new Date(
                inicioAtual
            );

        fimAnterior.setDate(
            fimAnterior.getDate() - 1
        );

        const inicioAnterior =
            new Date(
                fimAnterior
            );

        inicioAnterior.setDate(
            inicioAnterior.getDate()
            -
            duracaoDias
            +
            1
        );

        const inicioAnteriorISO =
            isoDRE(
                inicioAnterior
            );

        const fimAnteriorISO =
            isoDRE(
                fimAnterior
            );

        const dadosAnterior =
            (db.financeiro || [])
            .filter(item=>{

                const data =
                    item.vencimento
                    ||
                    '';

                if(!data){
                    return false;
                }

                return (
                    data >= inicioAnteriorISO
                    &&
                    data <= fimAnteriorISO
                );
            });

        const resumoAnterior =
            calcularResumoDRE(
                dadosAnterior
            );

        comparativo = {
            inicio:
                inicioAnteriorISO,
            fim:
                fimAnteriorISO,
            atual:
                resumo,
            anterior:
                resumoAnterior
        };
    }

    function variacaoDRE(
        atual,
        anterior,
        inverso = false
    ){
        if(!(anterior > 0)){
            return {
                texto:'Sem base anterior',
                cor:'#6b7280',
                simbolo:'•'
            };
        }

        const variacao =
            (
                atual - anterior
            )
            /
            anterior
            *
            100;

        const favoravel =
            inverso
            ? variacao <= 0
            : variacao >= 0;

        return {
            texto:
                `${Math.abs(variacao).toLocaleString(
                    'pt-BR',
                    {
                        minimumFractionDigits:1,
                        maximumFractionDigits:1
                    }
                )}%`,
            cor:
                favoravel
                ? '#16a34a'
                : '#dc2626',
            simbolo:
                variacao > 0
                ? '▲'
                : variacao < 0
                ? '▼'
                : '•'
        };
    }

    function cardKPIDRE(
        titulo,
        valor,
        subtitulo,
        cor,
        icone
    ){
        return `
        <div style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:18px;
            min-height:118px;
            box-shadow:0 6px 18px rgba(15,23,42,.05);
            page-break-inside:avoid;
        ">
            <div style="
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:12px;
            ">
                <div>
                    <div style="
                        font-size:11px;
                        font-weight:800;
                        letter-spacing:.08em;
                        text-transform:uppercase;
                        color:#6b7280;
                    ">
                        ${titulo}
                    </div>

                    <div style="
                        margin-top:8px;
                        font-size:24px;
                        font-weight:900;
                        color:${cor};
                        line-height:1.15;
                    ">
                        ${valor}
                    </div>
                </div>

                <div style="
                    width:40px;
                    height:40px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:12px;
                    background:#f8fafc;
                    font-size:20px;
                ">
                    ${icone}
                </div>
            </div>

            <div style="
                margin-top:10px;
                color:#94a3b8;
                font-size:11px;
                line-height:1.4;
            ">
                ${subtitulo}
            </div>
        </div>
        `;
    }

    function linhaDRE(
        titulo,
        valor,
        opcoes = {}
    ){
        const destaque =
            !!opcoes.destaque;

        const principal =
            !!opcoes.principal;

        const negativo =
            !!opcoes.negativo;

        const indent =
            Number(opcoes.indent || 0);

        const cor =
            opcoes.cor
            ||
            (
                negativo
                ? '#b91c1c'
                : '#0f172a'
            );

        return `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            padding:${principal ? '15px 18px' : '11px 18px'};
            padding-left:${18 + indent}px;
            border-top:${destaque || principal ? '1px solid #dbe2ea' : '1px solid #f1f5f9'};
            background:${principal ? '#f8fafc' : destaque ? '#fbfdff' : '#fff'};
            font-size:${principal ? '14px' : '12.5px'};
            font-weight:${principal ? '900' : destaque ? '800' : '500'};
        ">
            <span style="
                color:${principal ? '#111827' : '#475569'};
            ">
                ${titulo}
            </span>

            <strong style="
                white-space:nowrap;
                color:${cor};
                font-size:${principal ? '15px' : '13px'};
            ">
                ${formatarMoeda(valor)}
            </strong>
        </div>
        `;
    }

    function barraIndicadorDRE(
        titulo,
        valor,
        percentual,
        cor
    ){
        const largura =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(percentual) || 0
                )
            );

        return `
        <div style="margin-bottom:15px;">
            <div style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                margin-bottom:6px;
                font-size:12px;
            ">
                <span style="color:#475569;font-weight:700;">
                    ${titulo}
                </span>

                <strong style="color:#0f172a;">
                    ${formatarMoeda(valor)}
                </strong>
            </div>

            <div style="
                height:8px;
                background:#eef2f7;
                border-radius:999px;
                overflow:hidden;
            ">
                <div style="
                    height:100%;
                    width:${largura}%;
                    background:${cor};
                    border-radius:999px;
                "></div>
            </div>
        </div>
        `;
    }

    function cardComparativoDRE(
        titulo,
        atual,
        anterior,
        inverso = false
    ){
        const v =
            variacaoDRE(
                atual,
                anterior,
                inverso
            );

        return `
        <div style="
            border:1px solid #e5e7eb;
            border-radius:14px;
            padding:14px;
            background:#fff;
        ">
            <div style="
                color:#64748b;
                font-size:11px;
                font-weight:800;
                text-transform:uppercase;
                letter-spacing:.05em;
            ">
                ${titulo}
            </div>

            <div style="
                font-size:19px;
                font-weight:900;
                color:#111827;
                margin-top:6px;
            ">
                ${formatarMoeda(atual)}
            </div>

            <div style="
                margin-top:6px;
                font-size:11px;
                color:${v.cor};
                font-weight:800;
            ">
                ${v.simbolo} ${v.texto}
                <span style="color:#94a3b8;font-weight:500;">
                    vs. período anterior
                </span>
            </div>
        </div>
        `;
    }

    const maiorGrupo =
        gruposOrdenados
        .slice()
        .sort(
            (a,b)=>
                b.valor - a.valor
        )
        [0]
        ||
        null;

    const consumoReceita =
        receitaBruta > 0
        ? totalSaidas / receitaBruta * 100
        : 0;

    let analise = '';

    if(!(receitaBruta > 0) && !(totalSaidas > 0)){
        analise = `
            Não existem movimentações recebidas ou pagas
            no período selecionado para compor o DRE.
        `;
    }
    else if(positivo){
        analise = `
            O período encerrou com
            <strong style="color:#15803d;">
                resultado positivo de ${formatarMoeda(lucroLiquido)}
            </strong>,
            equivalente a uma margem líquida de
            <strong>${margemLiquida.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</strong>.
            ${
                maiorGrupo
                ?
                `O maior grupo de despesas operacionais foi
                <strong>${escDRE(maiorGrupo.nome)}</strong>,
                totalizando
                <strong>${formatarMoeda(maiorGrupo.valor)}</strong>.`
                :
                ''
            }
        `;
    }
    else{
        analise = `
            O período encerrou com
            <strong style="color:#b91c1c;">
                resultado negativo de ${formatarMoeda(Math.abs(lucroLiquido))}
            </strong>.
            As saídas consumiram
            <strong>${consumoReceita.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</strong>
            da receita bruta registrada no período.
            ${
                maiorGrupo
                ?
                `O maior grupo de despesas operacionais foi
                <strong>${escDRE(maiorGrupo.nome)}</strong>.`
                :
                ''
            }
        `;
    }

    let html =
        getCabecalhoRelatorio(
            'DRE GERENCIAL'
        );

    html += `

    <div style="
        background:linear-gradient(135deg,#111827 0%,#1f2937 100%);
        color:#fff;
        border-radius:18px;
        padding:20px 22px;
        margin-bottom:18px;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:18px;
        flex-wrap:wrap;
        box-shadow:0 10px 30px rgba(15,23,42,.14);
        page-break-inside:avoid;
    ">
        <div>
            <div style="
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:.12em;
                color:#cbd5e1;
                font-weight:800;
            ">
                Visão executiva
            </div>

            <div style="
                font-size:22px;
                font-weight:900;
                margin-top:5px;
            ">
                Demonstrativo de Resultado
            </div>

            <div style="
                margin-top:6px;
                font-size:12px;
                color:#cbd5e1;
            ">
                ${
                    inicio || fim
                    ?
                    `Período: ${dataBRDRE(inicio)} até ${dataBRDRE(fim)}`
                    :
                    'Período selecionado no filtro'
                }
                • Regime gerencial por caixa
            </div>
        </div>

        <div style="
            padding:10px 14px;
            border-radius:999px;
            background:${positivo ? 'rgba(22,163,74,.18)' : 'rgba(220,38,38,.18)'};
            color:${positivo ? '#bbf7d0' : '#fecaca'};
            border:1px solid ${positivo ? 'rgba(134,239,172,.3)' : 'rgba(252,165,165,.3)'};
            font-size:12px;
            font-weight:900;
        ">
            ${positivo ? '▲ RESULTADO POSITIVO' : '▼ RESULTADO NEGATIVO'}
        </div>
    </div>

    <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
        gap:12px;
        margin-bottom:18px;
    ">
        ${cardKPIDRE(
            'Receita Bruta',
            formatarMoeda(receitaBruta),
            'Recebimentos efetivamente realizados',
            '#15803d',
            '💰'
        )}

        ${cardKPIDRE(
            'Receita Líquida',
            formatarMoeda(receitaLiquida),
            `Após ${formatarMoeda(impostos)} em deduções`,
            '#047857',
            '🧾'
        )}

        ${cardKPIDRE(
            'Lucro Bruto',
            formatarMoeda(lucroBruto),
            `Margem bruta de ${margemBruta.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,
            lucroBruto >= 0 ? '#2563eb' : '#dc2626',
            '📈'
        )}

        ${cardKPIDRE(
            'Despesas Operacionais',
            formatarMoeda(despesasOperacionais),
            `${percentualDRE(despesasOperacionais,receitaBruta)} da receita bruta`,
            '#b45309',
            '💳'
        )}

        ${cardKPIDRE(
            'Lucro Líquido',
            formatarMoeda(lucroLiquido),
            positivo ? 'Resultado final positivo' : 'Resultado final negativo',
            corResultado,
            positivo ? '✅' : '⚠️'
        )}

        ${cardKPIDRE(
            'Margem Líquida',
            `${margemLiquida.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,
            'Lucro líquido ÷ receita bruta',
            corResultado,
            '🎯'
        )}
    </div>

    <div style="
        display:grid;
        grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr);
        gap:16px;
        align-items:start;
        margin-bottom:18px;
    ">
        <div style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 6px 18px rgba(15,23,42,.04);
            page-break-inside:avoid;
        ">
            <div style="
                padding:16px 18px;
                background:#0f172a;
                color:#fff;
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
            ">
                <div>
                    <div style="font-size:15px;font-weight:900;">
                        Estrutura do DRE
                    </div>
                    <div style="font-size:10.5px;color:#cbd5e1;margin-top:3px;">
                        Receitas, deduções, custos e despesas do período
                    </div>
                </div>
                <div style="font-size:20px;">📊</div>
            </div>

            ${linhaDRE(
                '(+) Receita Bruta',
                receitaBruta,
                {
                    principal:true,
                    cor:'#15803d'
                }
            )}

            ${linhaDRE(
                '(-) Impostos / Deduções',
                -impostos,
                {
                    negativo:true,
                    indent:14
                }
            )}

            ${linhaDRE(
                '(=) Receita Líquida',
                receitaLiquida,
                {
                    destaque:true,
                    cor:'#047857'
                }
            )}

            ${linhaDRE(
                '(-) Matéria prima',
                -custos,
                {
                    negativo:true,
                    indent:14
                }
            )}

            ${linhaDRE(
                '(=) Lucro Bruto',
                lucroBruto,
                {
                    destaque:true,
                    cor:lucroBruto >= 0 ? '#2563eb' : '#dc2626'
                }
            )}

            <div style="
                padding:10px 18px;
                background:#f8fafc;
                border-top:1px solid #e2e8f0;
                color:#334155;
                font-size:10.5px;
                font-weight:900;
                letter-spacing:.08em;
                text-transform:uppercase;
            ">
                Despesas Operacionais
            </div>

            ${
                gruposOrdenados.length
                ?
                gruposOrdenados
                .map(grupo=>
                    linhaDRE(
                        `(-) ${escDRE(grupo.nome)}`,
                        -grupo.valor,
                        {
                            negativo:true,
                            indent:14
                        }
                    )
                )
                .join('')
                :
                linhaDRE(
                    'Nenhuma despesa operacional registrada',
                    0,
                    {
                        indent:14
                    }
                )
            }

            ${linhaDRE(
                '(=) Resultado Operacional',
                lucroLiquido,
                {
                    destaque:true,
                    cor:corResultado
                }
            )}

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                padding:18px;
                background:${fundoResultado};
                border-top:2px solid ${corResultado};
            ">
                <div>
                    <div style="
                        font-size:11px;
                        color:#64748b;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        font-weight:900;
                    ">
                        Resultado Final
                    </div>
                    <div style="
                        font-size:17px;
                        font-weight:900;
                        color:#111827;
                        margin-top:3px;
                    ">
                        LUCRO LÍQUIDO
                    </div>
                </div>

                <div style="
                    font-size:23px;
                    font-weight:900;
                    color:${corResultado};
                    white-space:nowrap;
                ">
                    ${formatarMoeda(lucroLiquido)}
                </div>
            </div>
        </div>

        <div style="
            display:flex;
            flex-direction:column;
            gap:16px;
        ">
            <div style="
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:18px;
                padding:18px;
                box-shadow:0 6px 18px rgba(15,23,42,.04);
                page-break-inside:avoid;
            ">
                <div style="
                    font-size:14px;
                    font-weight:900;
                    color:#111827;
                    margin-bottom:16px;
                ">
                    Indicadores do período
                </div>

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:10px;
                ">
                    <div style="background:#f8fafc;border-radius:12px;padding:12px;">
                        <div style="font-size:10px;color:#64748b;font-weight:800;">
                            MARGEM BRUTA
                        </div>
                        <div style="font-size:18px;font-weight:900;margin-top:5px;color:#2563eb;">
                            ${margemBruta.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%
                        </div>
                    </div>

                    <div style="background:#f8fafc;border-radius:12px;padding:12px;">
                        <div style="font-size:10px;color:#64748b;font-weight:800;">
                            MARGEM LÍQUIDA
                        </div>
                        <div style="font-size:18px;font-weight:900;margin-top:5px;color:${corResultado};">
                            ${margemLiquida.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%
                        </div>
                    </div>

                    <div style="background:#f8fafc;border-radius:12px;padding:12px;">
                        <div style="font-size:10px;color:#64748b;font-weight:800;">
                            CUSTOS / RECEITA
                        </div>
                        <div style="font-size:18px;font-weight:900;margin-top:5px;color:#b45309;">
                            ${percentualDRE(custos,receitaBruta)}
                        </div>
                    </div>

                    <div style="background:#f8fafc;border-radius:12px;padding:12px;">
                        <div style="font-size:10px;color:#64748b;font-weight:800;">
                            DESPESAS / RECEITA
                        </div>
                        <div style="font-size:18px;font-weight:900;margin-top:5px;color:#b45309;">
                            ${percentualDRE(despesasOperacionais,receitaBruta)}
                        </div>
                    </div>
                </div>
            </div>

            <div style="
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:18px;
                padding:18px;
                box-shadow:0 6px 18px rgba(15,23,42,.04);
                page-break-inside:avoid;
            ">
                <div style="
                    font-size:14px;
                    font-weight:900;
                    color:#111827;
                    margin-bottom:16px;
                ">
                    Composição das despesas
                </div>

                ${(() => {
                    const totalComposicao =
                        totalSaidas;

                    const categorias = [
                        {
                            nome:
                                'Impostos / Deduções',
                            valor:
                                impostos,
                            cor:
                                '#dc2626'
                        },
                        {
                            nome:
                                'Pessoal e remunerações',
                            valor:
                                pessoal,
                            cor:
                                '#2563eb'
                        },
                        {
                            nome:
                                'Administrativo e serviços',
                            valor:
                                administrativo,
                            cor:
                                '#0891b2'
                        },
                        {
                            nome:
                                'Matéria prima',
                            valor:
                                custos,
                            cor:
                                '#d97706'
                        },
                        {
                            nome:
                                'Veículos',
                            valor:
                                veiculos,
                            cor:
                                '#7c3aed'
                        },
                        {
                            nome:
                                'Outras despesas',
                            valor:
                                outrasDespesas,
                            cor:
                                '#be123c'
                        }
                    ];

                    if(!(totalComposicao > 0)){
                        return `<div style="color:#94a3b8;font-size:12px;">
                            Nenhuma despesa ou imposto no período.
                        </div>`;
                    }

                    return categorias
                        .map(categoria=>
                            barraIndicadorDRE(
                                categoria.nome,
                                categoria.valor,
                                totalComposicao > 0
                                    ? categoria.valor / totalComposicao * 100
                                    : 0,
                                categoria.cor
                            )
                        )
                        .join('');
                })()}
            </div>
        </div>
    </div>

    ${
        comparativo
        ?
        `
        <div style="
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:18px;
            padding:18px;
            margin-bottom:18px;
            page-break-inside:avoid;
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-end;
                gap:15px;
                flex-wrap:wrap;
                margin-bottom:14px;
            ">
                <div>
                    <div style="font-size:15px;font-weight:900;color:#111827;">
                        Comparativo com período anterior
                    </div>
                    <div style="font-size:11px;color:#64748b;margin-top:3px;">
                        ${dataBRDRE(comparativo.inicio)} até ${dataBRDRE(comparativo.fim)}
                    </div>
                </div>

                <div style="font-size:10px;color:#94a3b8;">
                    Mesmo número de dias do período selecionado
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
                gap:10px;
            ">
                ${cardComparativoDRE(
                    'Receita Bruta',
                    comparativo.atual.receitaBruta,
                    comparativo.anterior.receitaBruta
                )}

                ${cardComparativoDRE(
                    'Custos + Despesas',
                    comparativo.atual.totalSaidas,
                    comparativo.anterior.totalSaidas,
                    true
                )}

                ${cardComparativoDRE(
                    'Lucro Líquido',
                    comparativo.atual.lucroLiquido,
                    comparativo.anterior.lucroLiquido
                )}
            </div>
        </div>
        `
        :
        ''
    }

    <div style="
        background:${fundoResultado};
        border:1px solid ${positivo ? '#bbf7d0' : '#fecaca'};
        border-radius:18px;
        padding:18px;
        margin-bottom:18px;
        page-break-inside:avoid;
    ">
        <div style="
            display:flex;
            align-items:center;
            gap:9px;
            margin-bottom:10px;
        ">
            <div style="font-size:20px;">
                ${positivo ? '💡' : '🔎'}
            </div>
            <div style="font-size:14px;font-weight:900;color:#111827;">
                Análise do período
            </div>
        </div>

        <div style="
            font-size:12.5px;
            line-height:1.7;
            color:#475569;
        ">
            ${analise}
        </div>

        <div style="
            margin-top:14px;
            padding-top:12px;
            border-top:1px solid ${positivo ? '#bbf7d0' : '#fecaca'};
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
        ">
            <div>
                <div style="font-size:9.5px;color:#94a3b8;font-weight:800;">
                    TOTAL DE SAÍDAS
                </div>
                <div style="font-size:14px;font-weight:900;color:#111827;margin-top:3px;">
                    ${formatarMoeda(totalSaidas)}
                </div>
            </div>

            <div>
                <div style="font-size:9.5px;color:#94a3b8;font-weight:800;">
                    SAÍDAS / RECEITA
                </div>
                <div style="font-size:14px;font-weight:900;color:#111827;margin-top:3px;">
                    ${percentualDRE(totalSaidas,receitaBruta)}
                </div>
            </div>
        </div>
    </div>

    <div style="
        background:#fffbeb;
        border:1px solid #fde68a;
        color:#92400e;
        border-radius:12px;
        padding:11px 14px;
        margin-bottom:18px;
        font-size:10.5px;
        line-height:1.5;
        page-break-inside:avoid;
    ">
        <strong>Observação:</strong>
        este DRE é gerencial e utiliza somente lançamentos financeiros com status
        <strong>Recebido</strong> e <strong>Pago</strong> dentro do período selecionado.
    </div>

    <div style="
        display:flex;
        justify-content:flex-end;
        margin-top:15px;
        page-break-inside:avoid;
    ">
        <button
            class="btn-action"
            onclick="imprimirRelatorio()"
            style="
                padding:10px 18px;
                font-weight:800;
            "
        >
            🖨 IMPRIMIR DRE
        </button>
    </div>

    <div style="
        margin-top:10px;
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
    src="${window.logoBase64 || 'logo.png'}"
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


    try{

        window.logoBase64 =
            await window.api.getLogoPath();

    }

    catch(e){

        console.error(
            'Erro carregando logo:',
            e
        );

    }


    const conteudo =

        document.getElementById(
            'print-area'
        )?.innerHTML;

    if(!conteudo) return;

const conteudoCorrigido =
    conteudo;
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