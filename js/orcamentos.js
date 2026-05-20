/* ========================= */
/* ORÇAMENTOS */
/* ========================= */

window.renderOrcamentos = function () {

    if (!db.orcamentos) {
        db.orcamentos = [];
    }

    if (!db.ultimoOrcamento) {
        db.ultimoOrcamento = 3537;
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
                Orçamentos
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Gestão de orçamentos
            </div>

        </div>

        <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        ">

            <button
                class="btn-action"
                onclick="abrirConsultaOrcamentos()">

                🔍 Consultar

            </button>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirModalOrcamento()">

                + Novo Orçamento

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

                    <th>Código</th>
                    <th>Data do Orçamento</th>
                    <th>Cliente</th>
                    <th>Validade</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>
`;

    if (db.orcamentos.length === 0) {

        html += `

<tr>

    <td
        colspan="7"
        style="
            text-align:center;
            padding:30px;
            color:#6b7280;
        ">

        Nenhum orçamento cadastrado

    </td>

</tr>
`;
    }

    db.orcamentos.forEach(
        (orcamento, idx) => {

        let corStatus = '#f59e0b';

        if (
            (orcamento.status || '')
            .toLowerCase() ===
            'aprovado'
        ) {

            corStatus = '#16a34a';
        }

        if (
            (orcamento.status || '')
            .toLowerCase() ===
            'recusado'
        ) {

            corStatus = '#dc2626';
        }

        if (
            (orcamento.status || '')
            .toLowerCase() ===
            'cancelado'
        ) {

            corStatus = '#2563eb';
        }

        html += `

<tr>

    <td>

        ${orcamento.codigo || '-'}

    </td>

    <td>

        ${
            orcamento.data
                ? formatarDataBR(
                    orcamento.data
                )
                : '-'
        }

    </td>

    <td>

        ${orcamento.cliente || '-'}

    </td>

    <td>

        ${
            orcamento.validade
                ? formatarDataBR(
                    orcamento.validade
                )
                : '-'
        }

    </td>

    <td>

        ${formatarMoeda(
            orcamento.total || 0
        )}

    </td>

    <td>

        <span style="
            background:${corStatus};
            color:#fff;
            padding:6px 12px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
        ">

            ${orcamento.status || '-'}

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
                onclick="visualizarOrcamento(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="editarOrcamento(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="excluirOrcamento(${idx})">

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
/* EXCLUIR */
/* ========================= */

window.excluirOrcamento = function (idx) {

    const confirmar =
        confirm(
            'Deseja excluir este orçamento?'
        );

    if (!confirmar) return;

    db.orcamentos.splice(
        idx,
        1
    );

    save();

    navigate(
        'orcamentos'
    );
};


/* ========================= */
/* CONSULTA ORÇAMENTOS */
/* ========================= */

window.abrirConsultaOrcamentos = function () {

    const html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <!-- FILTROS -->

    <div style="
        display:grid;
        grid-template-columns:
            repeat(auto-fit,minmax(220px,1fr));
        gap:15px;
    ">

        <div>

            <label>
                Código
            </label>

            <input
                id="filtro-orc-codigo">

        </div>

        <div>

            <label>
                Cliente
            </label>

            <input
                id="filtro-orc-cliente">

        </div>

        <div>

            <label>
                Data Inicial
            </label>

            <input
                type="date"
                id="filtro-orc-data-inicio">

        </div>

        <div>

            <label>
                Data Final
            </label>

            <input
                type="date"
                id="filtro-orc-data-fim">

        </div>

        <div>

            <label>
                Status
            </label>

            <select
                id="filtro-orc-status">

                <option value="">
                    Todos
                </option>

                <option>
                    Aguardando
                </option>

                <option>
                    Aprovado
                </option>

                <option>
                    Recusado
                </option>

                <option>
                    Cancelado
                </option>

            </select>

        </div>

    </div>

    <div style="
        display:flex;
        justify-content:flex-end;
    ">

        <button
            class="btn-action"
            onclick="filtrarConsultaOrcamentos()">

            🔍 Consultar

        </button>

    </div>

    <div
        id="resultado-consulta-orcamentos">

    </div>

</div>
`;

    configModal({

        title:
            'Consultar Orçamentos',

        body:
            html,

        size:
            'large',

        confirmText:
            'Fechar',

        onConfirm() {

            closeModal();
        }
    });
};


/* ========================= */
/* FILTRAR CONSULTA */
/* ========================= */

window.filtrarConsultaOrcamentos =
function () {

    const codigo =
        document
        .getElementById(
            'filtro-orc-codigo'
        )
        .value
        .toLowerCase();

    const cliente =
        document
        .getElementById(
            'filtro-orc-cliente'
        )
        .value
        .toLowerCase();

    const status =
        document
        .getElementById(
            'filtro-orc-status'
        )
        .value
        .toLowerCase();

    const dataInicio =
        document
        .getElementById(
            'filtro-orc-data-inicio'
        )
        .value;

    const dataFim =
        document
        .getElementById(
            'filtro-orc-data-fim'
        )
        .value;

    let orcamentos =
        [...db.orcamentos];

    /* ========================= */
    /* FILTRO CÓDIGO */
    /* ========================= */

    if (codigo) {

        orcamentos =
            orcamentos.filter(o =>

                String(
                    o.codigo || ''
                )
                .toLowerCase()
                .includes(codigo)
            );
    }

    /* ========================= */
    /* FILTRO CLIENTE */
    /* ========================= */

    if (cliente) {

        orcamentos =
            orcamentos.filter(o =>

                (o.cliente || '')
                .toLowerCase()
                .includes(cliente)
            );
    }

    /* ========================= */
    /* FILTRO STATUS */
    /* ========================= */

    if (status) {

        orcamentos =
            orcamentos.filter(o =>

                (o.status || '')
                .toLowerCase() ===
                status
            );
    }

    /* ========================= */
    /* FILTRO DATA INICIAL */
    /* ========================= */

    if (dataInicio) {

        orcamentos =
            orcamentos.filter(o =>

                o.data >=
                dataInicio
            );
    }

    /* ========================= */
    /* FILTRO DATA FINAL */
    /* ========================= */

    if (dataFim) {

        orcamentos =
            orcamentos.filter(o =>

                o.data <=
                dataFim
            );
    }

    /* ========================= */
    /* RESULTADO */
    /* ========================= */

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

    <th>Código</th>
    <th>Data</th>
    <th>Cliente</th>
    <th>Validade</th>
    <th>Valor</th>
    <th>Status</th>
    <th>Ações</th>

</tr>

</thead>

<tbody>
`;

    if (
        orcamentos.length === 0
    ) {

        html += `

<tr>

<td colspan="7"
style="
    text-align:center;
    padding:25px;
    color:#6b7280;
">

Nenhum orçamento encontrado

</td>

</tr>
`;
    }

    orcamentos.forEach(o => {

        const idx =
            db.orcamentos.indexOf(o);

        let corStatus =
            '#f59e0b';

        if (
            (o.status || '')
            .toLowerCase() ===
            'aprovado'
        ) {

            corStatus =
                '#16a34a';
        }

        if (
            (o.status || '')
            .toLowerCase() ===
            'recusado'
        ) {

            corStatus =
                '#dc2626';
        }

        if (
            (o.status || '')
            .toLowerCase() ===
            'cancelado'
        ) {

            corStatus =
                '#2563eb';
        }

        html += `

<tr>

    <td>

        ${o.codigo || '-'}

    </td>

    <td>

        ${
            o.data
            ? formatarDataBR(
                o.data
            )
            : '-'
        }

    </td>

    <td>

        ${o.cliente || '-'}

    </td>

    <td>

        ${
            o.validade
            ? formatarDataBR(
                o.validade
            )
            : '-'
        }

    </td>

    <td>

        ${formatarMoeda(
            o.total || 0
        )}

    </td>

    <td>

        <span style="
            background:${corStatus};
            color:#fff;
            padding:6px 12px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
        ">

            ${o.status || '-'}

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
                onclick="visualizarOrcamento(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="editarOrcamento(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="excluirOrcamento(${idx})">

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
            'resultado-consulta-orcamentos'
        )
        .innerHTML =
            html;
};

/* ========================= */
/* NOVO ORÇAMENTO */
/* ========================= */

window.abrirModalOrcamento =
function () {

    if (!db.orcamentos) {
        db.orcamentos = [];
    }

    if (!db.clientes) {
        db.clientes = [];
    }

    if (!db.ultimoOrcamento) {
        db.ultimoOrcamento = 3537;
    }

    const codigo =
        db.ultimoOrcamento + 1;

    let optionsClientes = `

<option value="">
    Selecione
</option>

`;

    db.clientes.forEach(
        cliente => {

        optionsClientes += `

<option value="${cliente.nome}">

    ${cliente.nome}

</option>

`;
    });

    const html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <!-- GRID -->

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

        <!-- CÓDIGO -->

        <div>

            <label>
                Código
            </label>

            <input
                id="orc-codigo"
                value="${codigo}"
                disabled>

        </div>

        <!-- CLIENTE -->

        <div>

            <label>
                Cliente
            </label>

            <select
                id="orc-cliente"
                onchange="
                    preencherDadosClienteOrcamento()
                ">

                ${optionsClientes}

            </select>

        </div>

        <!-- A/C -->

        <div>

            <label>
                A/C
            </label>

            <input
                id="orc-ac">

        </div>

        <!-- VALIDADE -->

        <div>

            <label>
                Validade do Orçamento
            </label>

            <input
                type="date"
                id="orc-validade">

        </div>

        <!-- TELEFONE -->

        <div>

            <label>
                Telefone
            </label>

            <input
                id="orc-telefone"
                readonly>

        </div>

        <!-- EMAIL -->

        <div>

            <label>
                E-mail
            </label>

            <input
                id="orc-email"
                readonly>

        </div>

        <!-- ENTREGA -->

        <div>

            <label>
                Prazo de Entrega
            </label>

            <input
                id="orc-entrega">

        </div>

        <!-- TEM NOTA -->

        <div>

            <label>
                Tem Nota?
            </label>

            <select
                id="orc-nota"
                onchange="
                    calcularTotalOrcamento()
                ">

                <option value="sim">

                    Sim

                </option>

                <option value="nao">

                    Não

                </option>

            </select>

        </div>

        <!-- STATUS -->

        <div>

            <label>
                Status
            </label>

            <select
                id="orc-status">

                <option>
                    Aguardando
                </option>

                <option>
                    Aprovado
                </option>

                <option>
                    Recusado
                </option>

                <option>
                    Cancelado
                </option>

            </select>

        </div>
        <!-- PRÉ CONTRATO -->

<div>

    <label>
        Pré-Contrato?
    </label>

    <select id="orc-precontrato">

        <option value="nao">
            Não
        </option>

        <option value="sim">
            Sim
        </option>

    </select>

</div>

    </div>

    <!-- PAGAMENTO -->

    <div>

        <label>
            Formas de Pagamento
        </label>

       <textarea
    id="orc-prazo"
    rows="4"
    style="
        resize:none;
        overflow:hidden;
    "
    oninput="
        autoResize(this)
    "></textarea>

    </div>

    <!-- PRODUTOS -->

    <hr>

    <h3>

        Produtos

    </h3>

    <div
        id="orc-produtos">

    </div>

    <button
        type="button"
        class="btn-action"
        onclick="
            adicionarProdutoOrcamento()
        ">

        + Adicionar Produto

    </button>

    <!-- OBS -->

    <hr>

    <div>

        <label>
            Observações
        </label>

        <textarea
            id="orc-obs"
            rows="4">

        </textarea>

    </div>

    <!-- TOTAL -->

    <h2 style="
        margin-top:10px;
        text-align:right;
    ">

        Total:

        <span id="orc-total">

            R$ 0,00

        </span>

    </h2>

</div>
`;

    configModal({

        title:
            'Novo Orçamento',

        body:
            html,

        size:
            'large',

        confirmText:
            'Salvar',

        onConfirm() {

            salvarNovoOrcamento();
        }
    });

    adicionarProdutoOrcamento();
};

/* ========================= */
/* PREENCHER CLIENTE */
/* ========================= */

window.preencherDadosClienteOrcamento =
function () {

    const nomeCliente =
        document
        .getElementById(
            'orc-cliente'
        )
        .value;

    const cliente =
        db.clientes.find(c =>

            c.nome ===
            nomeCliente
        );

    if (!cliente) {

        document
            .getElementById(
                'orc-telefone'
            )
            .value = '';

        document
            .getElementById(
                'orc-email'
            )
            .value = '';

        return;
    }

    document
        .getElementById(
            'orc-telefone'
        )
        .value =
            cliente.telefone || '';

    document
        .getElementById(
            'orc-email'
        )
        .value =
            cliente.email || '';
};


/* ========================= */
/* SALVAR ORÇAMENTO */
/* ========================= */

window.salvarNovoOrcamento =
function () {

    const itens = [];

    document
        .querySelectorAll(
            '.orc-item'
        )
        .forEach(item => {

        const produto =
            item
            .querySelector(
                '.orc-prod'
            )
            .value;

        const qtd =
            Number(
                item
                .querySelector(
                    '.orc-qtd'
                )
                .value || 0
            );

        const valor =
            Number(
                item
                .querySelector(
                    '.orc-val'
                )
                .value || 0
            );

        itens.push({

            produto,

            qtd,

            valor,

            total:
                qtd * valor
        });
    });

    let total =
        itens.reduce(

            (acc, item) =>

                acc +
                item.total,

            0
        );

    const temNota =
        document
        .getElementById(
            'orc-nota'
        )
        .value;

    if (
        temNota === 'nao'
    ) {

        total =
            total * 1.12;
    }

    const novoOrcamento = {

        codigo:
            db.ultimoOrcamento + 1,

        data:
            new Date()
            .toISOString()
            .split('T')[0],

        cliente:
            document
            .getElementById(
                'orc-cliente'
            )
            .value,

        ac:
            document
            .getElementById(
                'orc-ac'
            )
            .value,

        telefone:
            document
            .getElementById(
                'orc-telefone'
            )
            .value,

        email:
            document
            .getElementById(
                'orc-email'
            )
            .value,

        validade:
            document
            .getElementById(
                'orc-validade'
            )
            .value,

        prazo:
            document
            .getElementById(
                'orc-prazo'
            )
            .value,

        prazoEntrega:
            document
            .getElementById(
                'orc-entrega'
            )
            .value,

        temNota,

        status:
            document
            .getElementById(
                'orc-status'
            )
            .value,

        preContrato:
    document
    .getElementById(
        'orc-precontrato'
    )
    .value,

        observacoes:
            document
            .getElementById(
                'orc-obs'
            )
            .value,

        itens,

        total
    };

    db.orcamentos.push(
        novoOrcamento
    );

    db.ultimoOrcamento =
        novoOrcamento.codigo;

    save();

    closeModal();

    navigate(
        'orcamentos'
    );
};

/* ========================= */
/* ADICIONAR PRODUTO */
/* ========================= */

window.adicionarProdutoOrcamento =
function (
    dados = {}
) {

    const div =
        document
        .getElementById(
            'orc-produtos'
        );

    if (!div) return;

    div.insertAdjacentHTML(
        'beforeend',

`

<div
    class="orc-item"
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
        class="orc-prod"
        rows="2"
        placeholder="Descrição do produto"
        style="
            resize:none;
            overflow:hidden;
        "
        oninput="
            autoResize(this);
            calcularTotalOrcamento();
        "
    >${dados.produto || ''}</textarea>

    <input
        type="number"
        class="orc-qtd"
        placeholder="Qtd"

        value="${
            dados.qtd || 1
        }"

        oninput="
            calcularTotalOrcamento()
        ">

    <input
        type="number"
        step="0.01"

        class="orc-val"

        placeholder="Valor Unitário"

        value="${
            dados.valor || ''
        }"

        oninput="
            calcularTotalOrcamento()
        ">

    <input
        class="orc-total-item"

        readonly

        value="R$ 0,00">

    <button
        class="btn-del"

        type="button"

        onclick="

            this
            .parentElement
            .remove();

            calcularTotalOrcamento();

        ">

        ✕
    </button>

</div>

`
    );

    calcularTotalOrcamento();
};


/* ========================= */
/* AUTO RESIZE */
/* ========================= */

window.autoResize =
function (el) {

    if (!el) return;

    el.style.height =
        'auto';

    el.style.height =
        el.scrollHeight +
        'px';
};


/* ========================= */
/* CALCULAR TOTAL */
/* ========================= */

window.calcularTotalOrcamento =
function () {

    let subtotal = 0;

    document
        .querySelectorAll(
            '.orc-item'
        )
        .forEach(item => {

        const qtd =
            Number(

                item
                .querySelector(
                    '.orc-qtd'
                )
                .value || 0
            );

        const valor =
            Number(

                item
                .querySelector(
                    '.orc-val'
                )
                .value || 0
            );

        const totalItem =
            qtd * valor;

        item
            .querySelector(
                '.orc-total-item'
            )
            .value =

            formatarMoeda(
                totalItem
            );

        subtotal +=
            totalItem;
    });

    const temNota =
        document
        .getElementById(
            'orc-nota'
        )
        ?.value || 'sim';

    let totalFinal =
        subtotal;

    if (
        temNota === 'nao'
    ) {

        totalFinal =
            subtotal * 1.12;
    }

    document
        .getElementById(
            'orc-total'
        )
        .innerText =

        formatarMoeda(
            totalFinal
        );

    atualizarTextoImposto(
        subtotal,
        totalFinal
    );
};


/* ========================= */
/* TEXTO FIXO IMPOSTO */
/* ========================= */

window.atualizarTextoImposto =
function (subtotal,totalFinal) {

    const campoObs =
        document.getElementById(
            'orc-obs'
        );

    if (!campoObs) return;

    const temNota =
        document.getElementById(
            'orc-nota'
        )?.value;

    /* REMOVER TEXTO FIXO ANTIGO */

    campoObs.value =
        campoObs.value.replace(

            /\n*\s*Valor total do orçamento .*?acrescido do valor de imposto\./gs,

            ''
        ).trim();

    /* SE TEM NOTA → NÃO MOSTRA TEXTO */

    if (temNota !== 'nao') {

        return;

    }

    /* TEXTO USANDO SUBTOTAL (SEM IMPOSTO) */

    const texto =

`Valor total do orçamento ${formatarMoeda(subtotal)} acrescido do valor de imposto.`;

    /* ADICIONAR TEXTO */

    if (campoObs.value.trim()) {

        campoObs.value +=
            '\n\n' + texto;

    }

    else {

        campoObs.value =
            texto;

    }
};
/* ========================= */
/* VISUALIZAR ORÇAMENTO */
/* ========================= */

window.visualizarOrcamento = function(index){

    const o =
        db.orcamentos[index];

/* ========================= */
/* CLIENTE COMPLETO */
/* ========================= */

const clienteCompleto =
    db.clientes.find(c=>

        c.nome ===
        o.cliente

    ) || {};

    let itensHTML = '';

    o.itens.forEach((item,i)=>{

        itensHTML += `

<tr>

<td style="
padding:15px;
border:3px solid #8b8b8b;
text-align:center;
">
${i+1}
</td>

<td style="
padding:15px;
border:3px solid #8b8b8b;
text-align:center;
">
Un.
</td>

<td style="
padding:15px;
border:3px solid #8b8b8b;
line-height:1.8;
">
${(item.produto || '')
.replace(/\n/g,'<br>')}
</td>

<td style="
padding:15px;
border:3px solid #8b8b8b;
text-align:center;
">
${item.qtd}
</td>

<td style="
padding:15px;
border:3px solid #8b8b8b;
text-align:center;
">
${formatarMoeda(item.valor)}
</td>

<td style="
padding:15px;
border:3px solid #8b8b8b;
text-align:center;
font-weight:bold;
">
${formatarMoeda(item.total)}
</td>

</tr>
`;
    });

    configModal({

        title:
            `Orçamento #${o.codigo}`,

        size:'fullscreen',

        confirmText:
            '🖨 Imprimir / Salvar PDF',

        onConfirm(){

            imprimirOrcamento();
        },

        body:`

<div
id="print-orcamento"
style="
background:#f4f4f4;
padding:0;
font-family:Arial,sans-serif;
color:#000;
width:100%;
">

<!-- TOPO -->

<div style="
background:#2f2a2c;
color:#fff;
padding:20px 30px;
display:flex;
justify-content:space-between;
align-items:center;
">

<div>

<img
src="${
window.location.href.replace(
/[^/]*$/,
''
)
}logo.png"

style="
max-width:220px;
max-height:120px;
object-fit:contain;
">

</div>

<div style="
text-align:right;
line-height:1.8;
font-size:14px;
">

<div>
📞 (51) 3431.0145 | 99217.2326
</div>

<div>
📷 @wnc.visual
</div>

<div>
✉ wn@wncomunicacao.com.br
</div>

<div>
🌐 www.wncomunicacao.com.br
</div>

<div>
📍 R. Paissandu, 25 | Gravataí/RS
</div>

</div>

</div>

<!-- CLIENTE -->

<div style="
display:grid;
grid-template-columns:2fr 1fr;
gap:15px;
padding:15px;
">

<div style="
border:4px solid #8b8b8b;
background:#fff;
padding:15px;
">

<table style="
width:100%;
font-size:15px;
">

<tr>

<td style="
font-weight:bold;
width:150px;
">
CLIENTE:
</td>

<td>
${o.cliente}
</td>

</tr>

<tr>

<td style="
font-weight:bold;
">
A/C:
</td>

<td>
${o.ac || '-'}
</td>

</tr>

<tr>

<td style="
font-weight:bold;
">
FONE:
</td>

<td>
${o.telefone || '-'}
</td>

</tr>

<tr>

<td style="
font-weight:bold;
">
E-MAIL:
</td>

<td>
${o.email || '-'}
</td>

</tr>

</table>

</div>
<!-- ORÇAMENTO -->

<div style="
border:4px solid #8b8b8b;
background:#fff;
">

<div style="
background:#8b8b8b;
color:#fff;
text-align:center;
font-size:28px;
font-weight:bold;
padding:10px;
">

ORÇAMENTO

</div>

<div style="
padding:15px;
text-align:right;
">

<div style="
font-size:38px;
font-weight:bold;
color:#666;
">

${o.codigo}

</div>

<div style="
margin-top:10px;
font-size:14px;
">

<strong>
Data do Orçamento:
</strong>

${formatarDataBR(o.data)}

</div>

<div style="
margin-top:5px;
font-size:14px;
">

<strong>
Data de Validade:
</strong>

${
o.validade
? formatarDataBR(
    o.validade
)
: '-'
}

</div>

</div>

</div>

</div>

<!-- TABELA -->

<div style="
padding:0 15px 15px 15px;
">

<table style="
width:100%;
border-collapse:collapse;
background:#fff;
">

<thead>

<tr style="
background:#8b8b8b;
color:#fff;
font-size:14px;
">

<th style="
padding:10px;
border:3px solid #8b8b8b;
">
Item
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
">
Un.
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
">
Descrição
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
">
Qntd.
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
">
R$ Unitário
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
">
R$ Total
</th>

</tr>

</thead>

<tbody>

${itensHTML}

</tbody>

</table>

<div style="
background:#8b8b8b;
color:#fff;
text-align:right;
padding:10px 20px;
font-size:36px;
font-weight:bold;
">

${formatarMoeda(o.total)}

</div>

</div>
<!-- RODAPÉ -->

<div style="
padding:0 15px 20px 15px;
">

<div style="
border:4px solid #8b8b8b;
background:#fff;
padding:20px;
line-height:2;
font-size:15px;
">

<div>

<strong>
Forma de Pagamento:
</strong>

${(o.prazo || '-')
.replace(/\n/g,'<br>')}

</div>

<div>

<strong>
Prazo de Entrega:
</strong>

${o.prazoEntrega || '-'}

</div>

<div>

<strong>
Aprovação de Orçamento:
</strong>

O orçamento só poderá ser produzido
após aprovação formal via e-mail.

</div>

<div>

Sem ART ou Documentação de Prefeitura
caso necessário.

</div>

<div>

<strong>
Observação:
</strong>

${o.observacoes || 'Sem observações'}

</div>

<div style="
text-align:center;
color:#d60000;
font-size:15px;
font-weight:bold;
margin-top:5px;
">

NÃO ACEITAMOS PAGAMENTOS
COM CHEQUES

</div>

</div>

</div>
${
o.preContrato === 'sim'

?

`

<!-- NOVA PÁGINA -->

<div class="page-break" style="
background:#fff;
padding:45px;
font-family:Arial,sans-serif;
line-height:2;
">

<div style="
background:#2f2a2c;
color:#fff;
padding:10px 18px;
text-align:center;
font-size:22px;
font-weight:700;
margin-bottom:18px;
border-radius:4px;
line-height:1.4;
">

PRÉ-CONTRATO DE PRESTAÇÃO DE SERVIÇOS

</div>

<p>

Pelo presente instrumento particular,
de um lado,

<strong>

WN COMUNICAÇÃO VISUAL

</strong>,

doravante denominada

<strong>CONTRATADA</strong>,

e de outro lado

<strong>

${o.cliente || '-'}

</strong>,

CNPJ:

<strong>

${clienteCompleto.cnpj || '-'}

</strong>,

doravante denominado(a)

<strong>CONTRATANTE</strong>,

celebram o presente
pré-contrato.

</p>

<p>

O presente documento
tem como objeto a futura
execução dos serviços
descritos no orçamento
nº

<strong>

${o.codigo}

</strong>.

</p>

<p>

O valor estimado do serviço é:

<strong>

${formatarMoeda(o.total)}

</strong>

conforme condições comerciais
apresentadas.

</p>

<p>

Prazo previsto de entrega:

<strong>

${o.prazoEntrega || '-'}

</strong>

</p>

<p>

Forma de pagamento:

<br><br>

${(o.prazo || '-')
.replace(/\n/g,'<br>')}

</p>

<p>

O presente pré-contrato
serve como manifestação
de intenção comercial
entre as partes,
podendo sofrer ajustes
técnicos, operacionais
ou documentais
antes da formalização final.

</p>

<p>

Após aprovação formal,
a CONTRATADA poderá
dar início à produção
dos materiais ou serviços.

</p>


<div style="
display:flex;
justify-content:space-between;
gap:80px;
margin-top:50px;
">

<div style="
flex:1;
text-align:center;
">

________________________________

<br><br>

CONTRATANTE

<br>

${o.cliente}

</div>

<div style="
flex:1;
text-align:center;
">

________________________________

<br><br>

CONTRATADA

<br>

WN COMUNICAÇÃO VISUAL

</div>

</div>

</div>

`

:

''

}

</div>

`
    });

};

/* ========================= */
/* IMPRIMIR / PDF */
/* ========================= */

window.imprimirOrcamento =
async function(){

    const conteudo =

        document.getElementById(
            'print-orcamento'
        )?.innerHTML;

    if(!conteudo) return;

    const html = `

<html>

<head>

<title>
Orçamento
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
/* EDITAR ORÇAMENTO */
/* ========================= */

window.editarOrcamento = function(index){

    const o =
        db.orcamentos[index];

    const clientes =
        db.clientes || [];

    configModal({

        title:
            `Editar Orçamento #${o.codigo}`,

        size:'fullscreen',

        confirmText:'Salvar',
        onConfirm(){

    salvarEdicaoOrcamento(
        index
    );

},

        body:`

<label>
Cliente
</label>

<select
id="orc-cliente"
onchange="
preencherDadosClienteOrcamento()
">

<option value="">
Selecione
</option>

${clientes.map(c=>`

<option
value="${c.nome}"

${
o.cliente === c.nome
? 'selected'
: ''
}
>

${c.nome}

</option>

`).join('')}

</select>

<div style="
display:grid;
grid-template-columns:
1fr 1fr;
gap:15px;
">

<div>

<label>
A/C
</label>

<input
id="orc-ac"
value="${o.ac || ''}">

</div>

<div>

<label>
Validade do Orçamento
</label>

<input
type="date"
id="orc-validade"
value="${o.validade || ''}">

</div>

</div>

<div style="
display:grid;
grid-template-columns:
1fr 1fr;
gap:15px;
">

<div>

<label>
Telefone
</label>

<input
id="orc-telefone"
readonly
value="${o.telefone || ''}">

</div>

<div>

<label>
E-mail
</label>

<input
id="orc-email"
readonly
value="${o.email || ''}">

</div>

</div>

<div style="
display:grid;
grid-template-columns:
1fr 1fr;
gap:15px;
">

<div>

<label>
Forma de Pagamento
</label>

<textarea
id="orc-prazo"
rows="3"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this)
">${o.prazo || ''}</textarea>

</div>

<div>

<label>
Prazo de Entrega
</label>

<input
id="orc-entrega"
value="${
o.prazoEntrega || ''
}">

</div>

</div>

<label>
Tem Nota?
</label>

<select
id="orc-nota"
onchange="
calcularTotalOrcamento()
">

<option
value="sim"
${
o.temNota !== 'nao'
? 'selected'
: ''
}
>

Sim

</option>

<option
value="nao"
${
o.temNota === 'nao'
? 'selected'
: ''
}
>

Não

</option>

</select>

<label>
Status
</label>

<select
id="orc-status">

<option
${
o.status === 'Aguardando'
? 'selected'
: ''
}
>

Aguardando

</option>

<option
${
o.status === 'Aprovado'
? 'selected'
: ''
}
>

Aprovado

</option>

<option
${
o.status === 'Recusado'
? 'selected'
: ''
}
>

Recusado

</option>

<option
${
o.status === 'Cancelado'
? 'selected'
: ''
}
>

Cancelado

</option>

</select>

<label>
Pré-Contrato?
</label>

<select id="orc-precontrato">

<option
value="nao"

${
o.preContrato !== 'sim'
? 'selected'
: ''
}
>

Não

</option>

<option
value="sim"

${
o.preContrato === 'sim'
? 'selected'
: ''
}
>

Sim

</option>

</select>

<hr style="
margin:20px 0;
">

<h3>
Produtos
</h3>

<div id="orc-produtos"></div>

<button
class="btn-action"
type="button"
onclick="
adicionarProdutoOrcamento()
"
style="
margin-top:10px;
">

+ Adicionar Produto

</button>

<hr style="
margin:20px 0;
">


<label>
Observações
</label>

<textarea
id="orc-obs"
rows="4"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this)
">${o.observacoes || ''}</textarea>

<h2 style="
margin-top:20px;
text-align:right;
">

Total:
<span id="orc-total">

${formatarMoeda(
o.total || 0
)}

</span>

</h2>
`
    });

    /* ========================= */
    /* CARREGAR PRODUTOS */
    /* ========================= */

/* ========================= */

if (
    o.itens &&
    o.itens.length
) {

    o.itens.forEach(item => {

        adicionarProdutoOrcamento(
            item
        );

    });

}

else {

    adicionarProdutoOrcamento();

}

    /* ========================= */
    /* AUTO RESIZE */
    /* ========================= */

    document
        .querySelectorAll(
            '#orc-prazo,#orc-obs,.orc-prod'
        )
        .forEach(el=>{

            autoResize(el);

        });

    /* ========================= */
    /* RECALCULAR */
    /* ========================= */

    calcularTotalOrcamento();


    
};


/* ========================= */
/* SALVAR EDIÇÃO ORÇAMENTO */
/* ========================= */

window.salvarEdicaoOrcamento =
function(index){

    const itens = [];

    document
        .querySelectorAll(
            '.orc-item'
        )
        .forEach(item=>{

        const produto =
            item
            .querySelector(
                '.orc-prod'
            )
            .value;

        const qtd =
            Number(
                item
                .querySelector(
                    '.orc-qtd'
                )
                .value || 0
            );

        const valor =
            Number(
                item
                .querySelector(
                    '.orc-val'
                )
                .value || 0
            );

        itens.push({

            produto,

            qtd,

            valor,

            total:
                qtd * valor

        });

    });

    let total =
        itens.reduce(

            (acc,item)=>

                acc +
                item.total,

            0

        );

    const temNota =
        document
        .getElementById(
            'orc-nota'
        )
        .value;

    if(
        temNota === 'nao'
    ){

        total =
            total * 1.12;

    }

    db.orcamentos[index] = {

        ...db.orcamentos[index],

        cliente:
            document
            .getElementById(
                'orc-cliente'
            )
            .value,

        ac:
            document
            .getElementById(
                'orc-ac'
            )
            .value,

        telefone:
            document
            .getElementById(
                'orc-telefone'
            )
            .value,

        email:
            document
            .getElementById(
                'orc-email'
            )
            .value,

        validade:
            document
            .getElementById(
                'orc-validade'
            )
            .value,

        prazo:
            document
            .getElementById(
                'orc-prazo'
            )
            .value,

        prazoEntrega:
            document
            .getElementById(
                'orc-entrega'
            )
            .value,

        temNota,

        status:
            document
            .getElementById(
                'orc-status'
            )
            .value,
            preContrato:
    document
    .getElementById(
        'orc-precontrato'
    )
    .value,

        observacoes:
            document
            .getElementById(
                'orc-obs'
            )
            .value,

        itens,

        total

    };

    save();

    closeModal();

    navigate(
        'orcamentos'
    );

};




/* ========================= */
/* REGISTRAR PÁGINA */
/* ========================= */

registerPage(
    'orcamentos',
    renderOrcamentos
);

