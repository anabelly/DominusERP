/* ========================= */
/* RECIBOS */
/* ========================= */

window.renderRecibos = function () {

    if (!db.recibos) {
        db.recibos = [];
    }

    if (!db.ultimoRecibo) {
        db.ultimoRecibo = 0;
    }

    let html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
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

                Recibos / Comprovantes

            </div>

            <div style="
            color:#6b7280;
            margin-top:5px;
            ">

                Gestão de recibos

            </div>

        </div>

        <div style="
        display:flex;
        gap:10px;
        flex-wrap:wrap;
        ">

            <button
            class="btn-action"
            onclick="abrirConsultaRecibos()">

                🔍 Consultar

            </button>

            <button
            class="btn-action"
            style="background:#2563eb;"
            onclick="abrirGerarReciboOrcamento()">

                📄 Gerar de Orçamento

            </button>

            <button
            class="btn-action"
            style="background:#16a34a;"
            onclick="abrirModalRecibo()">

                + Novo Recibo

            </button>

        </div>

    </div>

    <!-- TABELA -->

    <div style="
    overflow:auto;
    border:1px solid #e5e7eb;
    border-radius:14px;
    background:#fff;
    ">

        <table style="
        width:100%;
        border-collapse:collapse;
        ">

            <thead>

                <tr>

                    <th>Número</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Origem</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>
`;

    if (db.recibos.length === 0) {

        html += `

<tr>

<td
colspan="6"
style="
text-align:center;
padding:30px;
color:#6b7280;
">

Nenhum recibo cadastrado

</td>

</tr>
`;
    }

    db.recibos.forEach((r, idx)=>{

        html += `

<tr>

<td>

${r.numero || '-'}

</td>

<td>

${
r.data
? formatarDataBR(r.data)
: '-'
}

</td>

<td>

${r.cliente || '-'}

</td>

<td>

${formatarMoeda(
r.total || 0
)}

</td>

<td>

<span style="
background:
${
r.origem === 'orcamento'
? '#2563eb'
: '#16a34a'
};
color:#fff;
padding:6px 12px;
border-radius:999px;
font-size:12px;
font-weight:600;
">

${
r.origem === 'orcamento'
? 'Orçamento'
: 'Manual'
}

</span>

</td>

<td>

<div style="
display:flex;
gap:8px;
justify-content:center;
align-items:center;
flex-wrap:nowrap;
min-width:max-content;
">

<button
class="btn-action"
style="
padding:6px 10px;
font-size:12px;
"
onclick="visualizarRecibo(${idx})">

👁 Visualizar

</button>

<button
class="btn-action"
style="
background:#f59e0b;
padding:6px 10px;
font-size:12px;
"
onclick="editarRecibo(${idx})">

✏ Editar

</button>

<button
class="btn-del"
style="
padding:6px 10px;
font-size:12px;
"
onclick="excluirRecibo(${idx})">

🗑 Excluir

</button>

</div>

</td>

</tr>
`;
    });

    html += `

            </tbody>

        </table>

    </div>

</div>
`;

    return html;

};



/* ========================= */
/* EXCLUIR RECIBO */
/* ========================= */

window.excluirRecibo = function(idx){

    const confirmar =

    confirm(
        'Deseja excluir este recibo?'
    );

    if(!confirmar) return;

    db.recibos.splice(
        idx,
        1
    );

    save();

    navigate(
        'recibos'
    );

};



/* ========================= */
/* CONSULTA RECIBOS */
/* ========================= */

window.abrirConsultaRecibos = function(){

const html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

    <div style="
    display:grid;
    grid-template-columns:
    repeat(
        auto-fit,
        minmax(
            220px,
            1fr
        )
    );
    gap:15px;
    ">

        <div>

            <label>

                Número

            </label>

            <input
            id="filtro-rec-numero">

        </div>

        <div>

            <label>

                Cliente

            </label>

            <input
            id="filtro-rec-cliente">

        </div>

        <div>

            <label>

                Data Inicial

            </label>

            <input
            type="date"
            id="filtro-rec-inicio">

        </div>

        <div>

            <label>

                Data Final

            </label>

            <input
            type="date"
            id="filtro-rec-fim">

        </div>

    </div>

    <div style="
    display:flex;
    justify-content:flex-end;
    gap:10px;
    ">

        <button
        class="btn-action"
        style="
        background:#6b7280;
        "
        onclick="closeModal()">

            Cancelar

        </button>

        <button
        class="btn-action"
        onclick="filtrarConsultaRecibos()">

            🔍 Consultar

        </button>

    </div>

    <div
    id="resultado-consulta-recibos">

    </div>

</div>
`;

configModal({

title:
'Consultar Recibos',

body:
html,

size:
'large',

confirmText:
'Fechar',

onConfirm(){

closeModal();

}

});

};



/* ========================= */
/* FILTRAR CONSULTA */
/* ========================= */

window.filtrarConsultaRecibos =
function(){

const numero =

document
.getElementById(
'filtro-rec-numero'
)
.value
.toLowerCase();

const cliente =

document
.getElementById(
'filtro-rec-cliente'
)
.value
.toLowerCase();

const dataInicio =

document
.getElementById(
'filtro-rec-inicio'
)
.value;

const dataFim =

document
.getElementById(
'filtro-rec-fim'
)
.value;

let recibos =

[...db.recibos];

if(numero){

recibos =
recibos.filter(r=>

(r.numero || '')
.toLowerCase()
.includes(numero)

);

}

if(cliente){

recibos =
recibos.filter(r=>

(r.cliente || '')
.toLowerCase()
.includes(cliente)

);

}

if(dataInicio){

recibos =
recibos.filter(r=>

r.data >=
dataInicio

);

}

if(dataFim){

recibos =
recibos.filter(r=>

r.data <=
dataFim

);

}

let html = `

<div style="
overflow:auto;
border:1px solid #e5e7eb;
border-radius:12px;
">

<table style="
width:100%;
border-collapse:collapse;
">

<thead>

<tr>

<th>Número</th>
<th>Data</th>
<th>Cliente</th>
<th>Valor</th>
<th>Ações</th>

</tr>

</thead>

<tbody>
`;

if(
recibos.length === 0
){

html += `

<tr>

<td
colspan="5"
style="
text-align:center;
padding:25px;
color:#6b7280;
">

Nenhum recibo encontrado

</td>

</tr>
`;

}

recibos.forEach(r=>{

const idx =
db.recibos.indexOf(r);

html += `

<tr>

<td>

${r.numero}

</td>

<td>

${
r.data
? formatarDataBR(
r.data
)
: '-'
}

</td>

<td>

${r.cliente}

</td>

<td>

${formatarMoeda(
r.total || 0
)}

</td>

<td>

<div style="
display:flex;
gap:8px;
justify-content:center;
">

<button
class="btn-action"
onclick="visualizarRecibo(${idx})">

👁 Visualizar

</button>

<button
class="btn-action"
style="
background:#f59e0b;
"
onclick="editarRecibo(${idx})">

✏ Editar

</button>

<button
class="btn-del"
onclick="excluirRecibo(${idx})">

🗑 Excluir

</button>

</div>

</td>

</tr>
`;

});

html += `

</tbody>

</table>

</div>
`;

document
.getElementById(
'resultado-consulta-recibos'
)
.innerHTML =
html;

};

/* ========================= */
/* NOVO RECIBO */
/* ========================= */

window.abrirModalRecibo =
function(){

    if(!db.recibos){

        db.recibos = [];

    }

    if(!db.ultimoRecibo){

        db.ultimoRecibo = 0;

    }

    const numero =

        'REC-' +

        String(
            db.ultimoRecibo + 1
        )
        .padStart(
            4,
            '0'
        );

const html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

    <!-- DADOS -->

    <div style="
    display:grid;
    grid-template-columns:
    repeat(
        auto-fit,
        minmax(
            220px,
            1fr
        )
    );
    gap:15px;
    ">

        <div>

            <label>

                Número

            </label>

            <input
            id="rec-numero"
            value="${numero}"
            disabled>

        </div>

        <div>

            <label>

                Cliente

            </label>

            <input
            id="rec-cliente">

        </div>

        <div>

            <label>

                Documento

            </label>

            <input
            id="rec-documento">

        </div>

        <div>

            <label>

                Inscrição Estadual

            </label>

            <input
            id="rec-ie">

        </div>

        <div>

            <label>

                Telefone

            </label>

            <input
            id="rec-telefone">

        </div>

        <div>

            <label>

                Endereço

            </label>

            <input
            id="rec-endereco">

        </div>

    </div>

    <!-- PRODUTOS -->

    <hr>

    <h3>

        Produtos / Serviços

    </h3>

    <div
    id="rec-itens">

    </div>

    <button
    class="btn-action"
    type="button"
    onclick="adicionarItemRecibo()">

        + Adicionar

    </button>

    <!-- OBS -->

    <hr>

    <div>

        <label>

            Observação

        </label>

<textarea
id="rec-obs"
rows="4"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this)
">Declaro que os produtos e/ou serviços descritos neste comprovante foram devidamente entregues/executados.</textarea>

    </div>

    <!-- TOTAL -->

    <h2 style="
    text-align:right;
    margin-top:10px;
    ">

        Total:

        <span id="rec-total">

            R$ 0,00

        </span>

    </h2>

</div>
`;

configModal({

title:
'Novo Recibo',

body:
html,

size:
'fullscreen',

confirmText:
'Salvar Recibo',

onConfirm(){

salvarNovoRecibo();

}

});

adicionarItemRecibo();

};



/* ========================= */
/* ADICIONAR ITEM */
/* ========================= */

window.adicionarItemRecibo =
function(
dados = {}
){

const div =

document
.getElementById(
'rec-itens'
);

if(!div)
return;

div.insertAdjacentHTML(

'beforeend',

`

<div
class="rec-item"
style="
display:grid;
grid-template-columns:
2fr
100px
140px
140px
45px;
gap:10px;
margin-bottom:10px;
">

<textarea
class="rec-desc"
rows="2"
placeholder="Descrição"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this);
calcularTotalRecibo();
"
>${dados.descricao || ''}</textarea>

<input
type="number"
class="rec-qtd"

value="${
dados.qtd || 1
}"

oninput="
calcularTotalRecibo()
">

<input
type="number"
step="0.01"

class="rec-val"

value="${
dados.valor || ''
}"

oninput="
calcularTotalRecibo()
">

<input
readonly
class="rec-total-item"
value="R$ 0,00">

<button
type="button"
class="btn-del"

onclick="

this
.parentElement
.remove();

calcularTotalRecibo();

">

✕

</button>

</div>

`

);

calcularTotalRecibo();

};



/* ========================= */
/* CALCULAR TOTAL */
/* ========================= */

window.calcularTotalRecibo =
function(){

let total = 0;

document
.querySelectorAll(
'.rec-item'
)
.forEach(item=>{

const qtd =

Number(

item
.querySelector(
'.rec-qtd'
)
.value || 0

);

const valor =

Number(

item
.querySelector(
'.rec-val'
)
.value || 0

);

const totalItem =

qtd * valor;

item
.querySelector(
'.rec-total-item'
)
.value =

formatarMoeda(
totalItem
);

total +=
totalItem;

});

document
.getElementById(
'rec-total'
)
.innerText =

formatarMoeda(
total
);

};



/* ========================= */
/* SALVAR RECIBO */
/* ========================= */

window.salvarNovoRecibo =
function(){

const itens = [];

document
.querySelectorAll(
'.rec-item'
)
.forEach(item=>{

const descricao =

item
.querySelector(
'.rec-desc'
)
.value;

const qtd =

Number(

item
.querySelector(
'.rec-qtd'
)
.value || 0

);

const valor =

Number(

item
.querySelector(
'.rec-val'
)
.value || 0

);

itens.push({

descricao,

qtd,

valor,

total:
qtd * valor

});

});

const total =

itens.reduce(

(acc,item)=>

acc +
item.total,

0

);

const novoRecibo = {

numero:

'REC-' +

String(
db.ultimoRecibo + 1
)
.padStart(
4,
'0'
),

data:

new Date()
.toISOString()
.split('T')[0],

cliente:

document
.getElementById(
'rec-cliente'
)
.value,

documento:

document
.getElementById(
'rec-documento'
)
.value,

ie:

document
.getElementById(
'rec-ie'
)
.value,

telefone:

document
.getElementById(
'rec-telefone'
)
.value,

endereco:

document
.getElementById(
'rec-endereco'
)
.value,

observacoes:

document
.getElementById(
'rec-obs'
)
.value,

itens,

total,

origem:
'manual'

};

db.recibos.push(
novoRecibo
);

db.ultimoRecibo++;

save();

closeModal();

navigate(
'recibos'
);

};

/* ========================= */
/* GERAR RECIBO DE ORÇAMENTO */
/* ========================= */

window.abrirGerarReciboOrcamento =
function(){

const aprovados =

(db.orcamentos || [])

.filter(o =>

(o.status || '')
.toLowerCase() ===
'aprovado'

);

if(

!aprovados.length

){

alert(
'Não existem orçamentos aprovados.'
);

return;

}

let options = `

<option value="">

Selecione

</option>

`;

aprovados.forEach((o,idx)=>{

options += `

<option value="${idx}">

${o.codigo}
—
${o.cliente}
—
${formatarMoeda(
o.total || 0
)}

</option>

`;

});

const html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

<div>

<label>

Orçamento aprovado

</label>

<select
id="rec-orcamento">

${options}

</select>

</div>

</div>

`;

configModal({

title:
'Gerar Recibo de Orçamento',

body:
html,

size:
'medium',

confirmText:
'Gerar',

onConfirm(){

gerarReciboDeOrcamento();

}

});

};



/* ========================= */
/* GERAR RECIBO */
/* ========================= */

window.gerarReciboDeOrcamento =
function(){

const idx =

document
.getElementById(
'rec-orcamento'
)
.value;

if(!idx){

alert(
'Selecione um orçamento.'
);

return;

}

const aprovados =

(db.orcamentos || [])

.filter(o =>

(o.status || '')
.toLowerCase() ===
'aprovado'

);

const o =

aprovados[idx];

if(!o)
return;

const clienteCompleto =

(db.clientes || [])
.find(c =>

c.nome ===
o.cliente

) || {};

if(!db.recibos){

db.recibos = [];

}

if(!db.ultimoRecibo){

db.ultimoRecibo = 0;

}

/* ========================= */
/* CONVERTER ITENS */
/* ========================= */

const itens =

(o.itens || [])

.map(item=>({

descricao:

item.produto || '',

qtd:

item.qtd || 0,

valor:

item.valor || 0,

total:

item.total || 0

}));



/* ========================= */
/* CRIAR RECIBO */
/* ========================= */

const novoRecibo = {

numero:

'REC-' +

String(
db.ultimoRecibo + 1
)
.padStart(
4,
'0'
),

data:

new Date()
.toISOString()
.split('T')[0],

cliente:

o.cliente || '',

documento:

clienteCompleto.cnpj ||

clienteCompleto.cpf ||

'',

ie:

clienteCompleto.ie ||

clienteCompleto.inscricao ||

'',

telefone:

o.telefone || '',

email:

o.email || '',

endereco:

clienteCompleto.endereco ||

'',

ac:

o.ac || '',

prazo:

o.prazo || '',

prazoEntrega:

o.prazoEntrega || '',

validade:

o.validade || '',

observacoes:

o.observacoes ||

'',

itens,

total:

o.total || 0,

origem:
'orcamento',

orcamentoCodigo:
o.codigo

};

db.recibos.push(
novoRecibo
);

db.ultimoRecibo++;

save();

closeModal();

navigate(
'recibos'
);

alert(
'Recibo gerado com sucesso.'
);

};

/* ========================= */
/* VISUALIZAR RECIBO */
/* ========================= */

window.visualizarRecibo = function(index){

const r = db.recibos[index];

let itensHTML = '';

(r.itens || []).forEach((item,i)=>{

itensHTML += `

<tr>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
">

${i+1}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
white-space:pre-line;
line-height:1.55;
">

${item.descricao || ''}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
">

${item.qtd || 0}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
">

${formatarMoeda(item.valor || 0)}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
font-weight:700;
">

${formatarMoeda(item.total || 0)}

</td>

</tr>

`;

});

configModal({

title:`Recibo ${r.numero}`,

size:'fullscreen',

confirmText:'🖨 Imprimir / PDF',

onConfirm(){

imprimirRecibo();

},

body:`

<div
id="print-recibo"
style="
background:#fff;
padding:20px;
font-family:Arial,sans-serif;
color:#000;
">

<!-- CABEÇALHO -->

<div style="
background:#0f172a;
color:#fff;
padding:20px;
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:14px;
">

<div>

<img
src="${window.location.href.replace(/[^/]*$/,'')}logo.png"
style="
max-width:220px;
max-height:80px;
object-fit:contain;
">

</div>

<div style="
text-align:right;
">

<div style="
font-size:36px;
font-weight:800;
letter-spacing:1px;
">

RECIBO

</div>

<div style="
margin-top:8px;
opacity:.85;
font-size:12px;
">

Documento Nº 1

</div>

<div style="
margin-top:4px;
opacity:.85;
font-size:12px;
">

Emitido em
${formatarDataBR(r.data)}

</div>

</div>

</div>

<!-- CLIENTE -->

<div style="
background:#f5f5f5;
padding:14px;
border-radius:14px;
margin-bottom:14px;
">

<div style="
font-size:17px;
font-weight:700;
margin-bottom:10px;
">

Dados do Cliente

</div>

<div style="
display:grid;
grid-template-columns:1fr 1fr;
gap:10px 16px;
line-height:1.35;
font-size:12px;
">

<div>
<b>Cliente:</b><br>
${r.cliente || '-'}
</div>

<div>
<b>Documento:</b><br>
${r.documento || '-'}
</div>

<div>
<b>Inscrição Estadual:</b><br>
${r.ie || '-'}
</div>

<div>
<b>Telefone:</b><br>
${r.telefone || '-'}
</div>

<div style="grid-column:1/3;">
<b>Endereço:</b><br>
${r.endereco || '-'}
</div>

</div>

</div>

<!-- PRODUTOS -->

<div style="
background:#f5f5f5;
padding:16px;
border-radius:14px;
margin-bottom:14px;
">

<div style="
font-size:18px;
font-weight:700;
margin-bottom:14px;
">

Produtos / Serviços

</div>

<table style="
width:100%;
border-collapse:collapse;
font-size:12px;
">

<thead>

<tr style="
background:#0f172a;
color:#fff;
">

<th style="padding:10px;width:55px;">
ITEM
</th>

<th style="
padding:10px;
text-align:left;
">
DESCRIÇÃO
</th>

<th style="
padding:10px;
width:80px;
">
QTD
</th>

<th style="
padding:10px;
width:120px;
">
VALOR UNIT.
</th>

<th style="
padding:10px;
width:120px;
">
TOTAL
</th>

</tr>

</thead>

<tbody>

${itensHTML}

</tbody>

</table>

<!-- TOTAL -->

<div style="
display:flex;
justify-content:flex-end;
margin-top:18px;
">

<div style="
background:#0f172a;
color:#fff;
padding:10px 18px;
border-radius:10px;
text-align:center;
min-width:170px;
">

<div style="
font-size:9px;
opacity:.80;
letter-spacing:1px;
text-transform:uppercase;
">

VALOR TOTAL

</div>

<div style="
font-size:22px;
font-weight:800;
margin-top:4px;
line-height:1;
">

${formatarMoeda(r.total || 0)}

</div>

</div>

</div>

</div>

<!-- OBSERVAÇÃO -->

<div style="
background:#f5f5f5;
padding:10px 14px;
border-radius:12px;
margin-bottom:10px;
">

<div style="
font-size:15px;
font-weight:700;
margin-bottom:8px;
">

Observação

</div>

<div style="
white-space:pre-line;
line-height:1.35;
font-size:11px;
">

Declaro que os produtos e/ou serviços descritos neste comprovante foram devidamente entregues/executados.

${r.observacoes ? '\n' + r.observacoes : ''}

</div>

</div>

<!-- ASSINATURA -->

<div
id="assinaturas"
style="
display:flex;
justify-content:center;
margin-top:150px;
">

<div style="
width:380px;
text-align:center;
font-size:13px;
">

<div style="
border-top:1px solid #94a3b8;
padding-top:10px;
">

Assinatura do Cliente

</div>

</div>

</div>

</div>

`

});

};

/* ========================= */
/* IMPRIMIR RECIBO / PDF */
/* ========================= */

window.imprimirRecibo =
async function(){

    const conteudo =

        document.getElementById(
            'print-recibo'
        )?.innerHTML;

    if(!conteudo) return;

    const html = `

<html>

<head>

<title>
Recibo
</title>

<style>

*{

    -webkit-print-color-adjust:
    exact !important;

    print-color-adjust:
    exact !important;

    box-sizing:border-box;

}

body{

    font-family:Arial,sans-serif;

    background:#fff;

    margin:0;

    padding:30px;

    color:#000;

}

.page-break{

    page-break-before:always;

}

table{

    width:100%;

    border-collapse:collapse;

}

th,td{

    padding:10px;

    text-align:left;

}

img{

    display:block;

    max-width:220px;

    max-height:120px;

    object-fit:contain;

}

@page{

    size:A4;

    margin:12mm;

}

@media print{

    body{

        padding:0;

        background:#fff;

    }

    *{

        -webkit-print-color-adjust:
        exact !important;

        print-color-adjust:
        exact !important;

    }

}

</style>

</head>

<body>

${conteudo}

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
/* EDITAR RECIBO */
/* ========================= */

window.editarRecibo =
function(index){

const r =

db.recibos[index];

configModal({

title:
`Editar ${r.numero}`,

size:
'fullscreen',

confirmText:
'Salvar',

onConfirm(){

salvarEdicaoRecibo(
index
);

},

body:`

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

<div style="
display:grid;
grid-template-columns:
repeat(
auto-fit,
minmax(
220px,
1fr
)
);
gap:15px;
">

<div>

<label>

Cliente

</label>

<input
id="rec-cliente"
value="${
r.cliente || ''
}">

</div>

<div>

<label>

Documento

</label>

<input
id="rec-documento"
value="${
r.documento || ''
}">

</div>

<div>

<label>

Inscrição Estadual

</label>

<input
id="rec-ie"
value="${
r.ie || ''
}">

</div>

<div>

<label>

Telefone

</label>

<input
id="rec-telefone"
value="${
r.telefone || ''
}">

</div>

<div>

<label>

Endereço

</label>

<input
id="rec-endereco"
value="${
r.endereco || ''
}">

</div>

</div>

<hr>

<h3>

Produtos / Serviços

</h3>

<div
id="rec-itens">

</div>

<button
type="button"
class="btn-action"
onclick="
adicionarItemRecibo()
">

+ Adicionar

</button>

<hr>

<div>

<label>

Observações

</label>

<textarea
id="rec-obs"
rows="4"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this)
">${r.observacoes || ''}</textarea>

</div>

<h2 style="
text-align:right;
">

Total:

<span id="rec-total">

${formatarMoeda(
r.total || 0
)}

</span>

</h2>

</div>

`

});

/* CARREGAR ITENS */

if(

r.itens &&
r.itens.length

){

r.itens.forEach(item=>{

adicionarItemRecibo({

descricao:

item.descricao,

qtd:

item.qtd,

valor:

item.valor

});

});

}

else{

adicionarItemRecibo();

}

/* AUTO RESIZE */

document
.querySelectorAll(
'#rec-obs,.rec-desc'
)
.forEach(el=>{

autoResize(el);

});

calcularTotalRecibo();

};



/* ========================= */
/* SALVAR EDIÇÃO */
/* ========================= */

window.salvarEdicaoRecibo =
function(index){

const itens = [];

document
.querySelectorAll(
'.rec-item'
)
.forEach(item=>{

const descricao =

item
.querySelector(
'.rec-desc'
)
.value;

const qtd =

Number(

item
.querySelector(
'.rec-qtd'
)
.value || 0

);

const valor =

Number(

item
.querySelector(
'.rec-val'
)
.value || 0

);

itens.push({

descricao,

qtd,

valor,

total:
qtd * valor

});

});

const total =

itens.reduce(

(acc,item)=>

acc +
item.total,

0

);

db.recibos[index] = {

...db.recibos[index],

cliente:

document
.getElementById(
'rec-cliente'
)
.value,

documento:

document
.getElementById(
'rec-documento'
)
.value,

ie:

document
.getElementById(
'rec-ie'
)
.value,

telefone:

document
.getElementById(
'rec-telefone'
)
.value,

endereco:

document
.getElementById(
'rec-endereco'
)
.value,

observacoes:

document
.getElementById(
'rec-obs'
)
.value,

itens,

total

};

save();

closeModal();

navigate(
'recibos'
);

};



/* ========================= */
/* REGISTRAR PÁGINA */
/* ========================= */

registerPage(
'recibos',
renderRecibos
);