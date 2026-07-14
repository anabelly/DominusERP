
/* ===================================================== */
/* ORDENS DE SERVIÇO - ERP EVOLUÍDO                     */
/* ===================================================== */

let listaOS = [];
let osEditando = null;
let filtroOS = 'TODAS';
let buscaOS = '';

/* ===================================================== */
/* CARREGAR                                             */
/* ===================================================== */

function carregarOS() {
    window.db.ordensServico = window.db.ordensServico || [];
    listaOS = [...window.db.ordensServico];
}

/* ===================================================== */
/* SALVAR                                               */
/* ===================================================== */

async function salvarOSStorage() {

    window.db.ordensServico = listaOS;

    try {
        await save();
    } catch (e) {
        console.error("Erro ao salvar DB:", e);
    }
}

/* ===================================================== */
/* FORMATAR DATA BR                                     */
/* ===================================================== */

function formatarDataBR(data) {

    if (!data) return '';

    const partes = data.split('-');

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* ===================================================== */
/* STATUS CONFIG                                        */
/* ===================================================== */

function corStatus(status) {

    const map = {
        'Aberta': '#f59e0b',
        'Em Produção': '#3b82f6',
        'Concluída': '#10b981',
        'Entregue': '#22c55e',
        'Cancelada': '#ef4444'
    };

    return map[status] || '#6b7280';
}

/* ===================================================== */
/* DASHBOARD                                            */
/* ===================================================== */

function renderDashboardOS() {

    const total = listaOS.length;

    const abertas =
        listaOS.filter(o => o.status === 'Aberta').length;

    const producao =
        listaOS.filter(o => o.status === 'Em Produção').length;

    const concluidas =
        listaOS.filter(o => o.status === 'Concluída').length;

    const entregues =
        listaOS.filter(o => o.status === 'Entregue').length;

    const canceladas =
        listaOS.filter(o => o.status === 'Cancelada').length;
    
    const atrasadas =
    listaOS.filter(o => o.dataEntrega &&
        new Date(o.dataEntrega) < new Date() && o.status !== 'Entregue' && o.status !== 'Cancelada').length;

    return `
        <div style="
            display:flex;
            gap:10px;
            margin-bottom:15px;
            flex-wrap:wrap;
        ">

            <div class="card">📦 Total: ${total}</div>

            <div class="card">
                🟡 Abertas: ${abertas}
            </div>

            <div class="card">
                🔵 Produção: ${producao}
            </div>

            <div class="card">
                🟢 Concluídas: ${concluidas}
            </div>

            <div class="card">
                🚚 Entregues: ${entregues}
            </div>

            <div class="card">
                🔴 Canceladas: ${canceladas}
            </div>
            <div class="card">
                ⚠️ Atrasadas: ${atrasadas}
            </div>

        </div>
    `;
}
/* ===================================================== */
/* RENDER PRINCIPAL                                     */
/* ===================================================== */

function renderOrdensServico() {

    carregarOS();

    return `
        <div class="content-card">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <h2>Ordens de Serviço</h2>

                <button class="btn-action" onclick="abrirNovaOS()">
                    + Nova OS
                </button>
            </div>

            ${renderDashboardOS()}

            ${renderFiltrosOS()}

           <div id="grid-os">
    ${renderGridOS()}
</div>

        </div>
    `;
}

/* ===================================================== */
/* FILTROS                                              */
/* ===================================================== */

function renderFiltrosOS() {

    return `
        <div style="
            display:flex;
            gap:10px;
            margin-bottom:10px;
            flex-wrap:wrap;
        ">

           <input
    id="busca-os"
    placeholder="Buscar cliente ou código"
    oninput="
        buscaOS = this.value;
        document.getElementById('grid-os').innerHTML = renderGridOS();
    "
>

            <select
    id="filtro-status-os"
    onchange="
        filtroOS = this.value;
        document.getElementById('grid-os').innerHTML = renderGridOS();
    "
>

                <option value="TODAS"
                    ${filtroOS === 'TODAS' ? 'selected' : ''}>
                    Todas
                </option>

                <option value="Aberta"
                    ${filtroOS === 'Aberta' ? 'selected' : ''}>
                    Abertas
                </option>

                <option value="Em Produção"
                    ${filtroOS === 'Em Produção' ? 'selected' : ''}>
                    Produção
                </option>

                <option value="Concluída"
                    ${filtroOS === 'Concluída' ? 'selected' : ''}>
                    Concluídas
                </option>

                <option value="Entregue"
                    ${filtroOS === 'Entregue' ? 'selected' : ''}>
                    Entregues
                </option>

                <option value="Cancelada"
                    ${filtroOS === 'Cancelada' ? 'selected' : ''}>
                    Canceladas
                </option>

            </select>

        </div>
    `;
}

function atualizarGridOS() {

    const grid =
        document.getElementById('grid-os');

    if (grid) {

        grid.innerHTML =
            renderGridOS();

    }

}

/* ===================================================== */
/* GRID                                                 */
/* ===================================================== */

function renderGridOS() {
    console.log('Filtro atual:', filtroOS);

    let dados = [...listaOS];

    /* FILTRO STATUS */

    if (filtroOS !== 'TODAS') {

        dados = dados.filter(
            o => o.status === filtroOS
        );

    }

    /* FILTRO BUSCA */

    if (buscaOS && buscaOS.trim()) {

        const busca =
            buscaOS.toLowerCase().trim();

        dados = dados.filter(o =>

            (o.cliente || '')
                .toLowerCase()
                .includes(busca)

            ||

            (o.codigo || '')
                .toLowerCase()
                .includes(busca)

            ||

            (o.numeroOrcamento || '')
                .toLowerCase()
                .includes(busca)

        );

    }

    if (!dados.length) {

        return `
            <div style="
                padding:30px;
                text-align:center;
                color:#6b7280;
            ">
                Nenhuma OS encontrada.
            </div>
        `;

    }

    return `

        <table class="table">

            <thead>

                <tr>

                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Orçamento</th>
                    <th>Emissão</th>
                    <th>Entrega</th>
                    <th>Status</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>

                ${dados.map((os) => {

                    const indiceReal =
                        listaOS.findIndex(
                            x => x.codigo === os.codigo
                        );

                    const atrasada =
                        os.dataEntrega &&
                        new Date(os.dataEntrega) < new Date() &&
                        os.status !== 'Entregue' &&
                        os.status !== 'Cancelada';

                    return `

                        <tr style="${atrasada ? 'background:#fff1f2;' : ''}">

                            <td>${os.codigo}</td>

                            <td>${os.cliente}</td>

                            <td>${os.numeroOrcamento || '-'}</td>

                            <td>${os.dataEmissao}</td>

                            <td>${os.dataEntrega || '-'}</td>

                            <td>

                                <span style="
                                    padding:3px 8px;
                                    border-radius:8px;
                                    background:${corStatus(os.status)};
                                    color:white;
                                    font-size:12px;
                                ">
                                    ${os.status}
                                </span>

                            </td>

                            <td>

                                <button
                                    onclick="visualizarOS(${indiceReal})"
                                    style="
                                        background:#eff6ff;
                                        color:#2563eb;
                                        border:none;
                                        padding:8px 12px;
                                        border-radius:8px;
                                        cursor:pointer;
                                        font-weight:600;
                                        margin-right:4px;
                                    ">
                                    👁 Visualizar
                                </button>

                                <button
                                    onclick="editarOS(${indiceReal})"
                                    style="
                                        background:#fef3c7;
                                        color:#b45309;
                                        border:none;
                                        padding:8px 12px;
                                        border-radius:8px;
                                        cursor:pointer;
                                        font-weight:600;
                                        margin-right:4px;
                                    ">
                                    ✏ Editar
                                </button>

                                <button
                                    onclick="imprimirOS(${indiceReal})"
                                    style="
                                        background:#dcfce7;
                                        color:#15803d;
                                        border:none;
                                        padding:8px 12px;
                                        border-radius:8px;
                                        cursor:pointer;
                                        font-weight:600;
                                    ">
                                    🖨 Imprimir
                                </button>

                                <button
                                    onclick="excluirOS(${indiceReal})"
                                    style="
                                        background:#fee2e2;
                                        color:#dc2626;
                                        border:none;
                                        padding:8px 12px;
                                        border-radius:8px;
                                        cursor:pointer;
                                        font-weight:600;
                                        margin-left:4px;
                                    ">
                                    🗑 Excluir
                                </button>

                            </td>

                        </tr>

                    `;

                }).join('')}

            </tbody>

        </table>

    `;

}
/* ===================================================== */
/* NOVA OS                                             */
/* ===================================================== */

function abrirNovaOS() {

    osEditando = null;

    configModal({
        title: 'Nova Ordem de Serviço',
        confirmText: 'Salvar OS',
        onConfirm: salvarOS,
        body: renderFormOS()
    });
}

/* ===================================================== */
/* EDITAR OS                                           */
/* ===================================================== */

function editarOS(index) {

    osEditando = index;

    const os = listaOS[index];

    configModal({
        title: `Editar OS ${os.codigo}`,
        confirmText: 'Atualizar',
        onConfirm: salvarOS,
        body: renderFormOS()
    });

    setTimeout(() => {

        document.getElementById('os-cliente').value = os.cliente;
        document.getElementById('os-data-entrega').value = os.dataEntrega;
        document.getElementById('os-status').value = os.status;

        document.getElementById('os-itens').innerHTML = '';

        os.itens.forEach(i => addItemOS(i));

    }, 100);
}

/* ===================================================== */
/* FORM                                                 */
/* ===================================================== */

function renderFormOS() {


    return `
        <div style="
    display:flex;
    gap:20px;
    margin-bottom:15px;
">

    <label>
        <input
            type="radio"
            name="tipo-os"
            value="manual"
            checked
            onchange="alternarTipoOS()">
        Manual
    </label>

    <label>
        <input
            type="radio"
            name="tipo-os"
            value="orcamento"
            onchange="alternarTipoOS()">
        A partir do orçamento
    </label>

</div>

<div
    id="bloco-orcamento"
    style="display:none;margin-bottom:15px;"
>

    <select
        id="os-orcamento"
        onchange="carregarOrcamentoOS()"
        style="
            width:100%;
            padding:8px;
            border:1px solid #ddd;
            border-radius:8px;
        "
    >

        <option value="">
            Selecione um orçamento aprovado
        </option>

        ${(window.db.orcamentos || [])
            .map((o)=>`
    <option value="${o.codigo}">
        ${o.codigo} - ${o.cliente}
    </option>
`)
            .join('')
        }

    </select>

</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">

            <select id="os-cliente" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;">
    <option value="">Selecione o cliente</option>

    ${(window.db.clientes || []).map(c => `
        <option value="${c.nome}">${c.nome}</option>
    `).join('')}
</select>

           <input id="os-data-entrega" type="date"
style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;">

        </div>

      <div style="margin-top:10px;">

    <select
        id="os-status"
        style="
            width:100%;
            padding:8px;
            border:1px solid #ddd;
            border-radius:8px;
        "
    >
        <option>Aberta</option>
        <option>Em Produção</option>
        <option>Concluída</option>
        <option>Entregue</option>
        <option>Cancelada</option>
    </select>

</div>

<div style="margin-top:10px;">

    <input
        id="os-numero-orcamento"
        placeholder="Nº do orçamento"
        style="
            width:100%;
            padding:8px;
            border:1px solid #ddd;
            border-radius:8px;
        "
    >

</div>

        <hr>

        <h3>Itens</h3>

        <div id="os-itens"></div>

        <button onclick="addItemOS()" style="
    margin-top:10px;
    background:#3b82f6;
    color:white;
    border:none;
    padding:10px 14px;
    border-radius:10px;
    cursor:pointer;
    font-weight:600;
">
    + Adicionar Produto
</button>
    <div style="margin-top:20px;">

    <h3>Observação Geral da Produção</h3>

    <textarea
        id="os-observacao"
        rows="5"
        style="
            width:100%;
            padding:10px;
            border:1px solid #ddd;
            border-radius:10px;
        "
    ></textarea>

</div>
    `;
}

/* ===================================================== */
/* ITENS                                               */
/* ===================================================== */

function addItemOS(data = {}) {

    const div = document.createElement('div');

    div.style = `
        display:grid;
        grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;
        gap:8px;
        margin-bottom:8px;
        background:#f3f4f6;
        padding:8px;
        border-radius:10px;
        align-items:center;
    `;

   div.innerHTML = `

<div style="grid-column:1/-1;">
    <strong>Descrição</strong>
</div>

<textarea
    class="p"
    rows="3"
    placeholder="Descrição do produto"
    style="
        grid-column:1/-1;
        width:100%;
        border:1px solid #ddd;
        border-radius:8px;
        padding:8px;
    "
>${data.produto || ''}</textarea>

<input
    class="q"
    placeholder="Quantidade"
    value="${data.quantidade || ''}"
>

<input
    class="a"
    placeholder="Altura"
    value="${data.altura || ''}"
>

<input
    class="l"
    placeholder="Largura"
    value="${data.largura || ''}"
>

<input
    class="c"
    placeholder="Comprimento"
    value="${data.comprimento || ''}"
>

<button
    onclick="this.parentElement.remove()"
    style="
        background:#fee2e2;
        color:#dc2626;
        border:none;
        border-radius:8px;
        cursor:pointer;
        font-weight:600;
    "
>
🗑 Excluir
</button>
`;

    document.getElementById('os-itens').appendChild(div);
}

function alternarTipoOS() {

    const tipo =
        document.querySelector(
            'input[name="tipo-os"]:checked'
        ).value;

    document.getElementById(
        'bloco-orcamento'
    ).style.display =
        tipo === 'orcamento'
            ? 'block'
            : 'none';
}

function carregarOrcamentoOS() {

    const codigoSelecionado =
        document.getElementById('os-orcamento').value;


    if (!codigoSelecionado) return;

    const orc = (window.db.orcamentos || []).find(o =>
        String(o.codigo).trim() === String(codigoSelecionado).trim()
    );

    if (!orc) {
        console.log('Orçamento não encontrado:', codigoSelecionado);
        return;
    }

    document.getElementById('os-cliente').value =
        orc.cliente || '';

    document.getElementById('os-numero-orcamento').value =
        orc.codigo || '';

    document.getElementById('os-itens').innerHTML = '';

    (orc.itens || []).forEach(i => {

      addItemOS({
    produto: i.produto || i.descricao || '',
    quantidade: i.quantidade || i.qtd || '',
    altura: i.altura || '',
    largura: i.largura || '',
    comprimento: i.comprimento || ''
});

    });

}
/* ===================================================== */
/* SALVAR OS                                           */
/* ===================================================== */

function salvarOS() {

    const itens = [];

    document.querySelectorAll('#os-itens > div').forEach(d => {

        itens.push({
            produto: d.querySelector('.p').value.trim(),
            quantidade: d.querySelector('.q').value,
            altura: d.querySelector('.a').value,
            largura: d.querySelector('.l').value,
            comprimento: d.querySelector('.c').value
        });

    });

    const os = {

    codigo:
        osEditando !== null
        ? listaOS[osEditando].codigo
        : gerarCodigoOS(),

    tipoCriacao:
        document.querySelector(
            'input[name="tipo-os"]:checked'
        )?.value || 'manual',

    cliente:
        document.getElementById(
            'os-cliente'
        ).value,

    numeroOrcamento:
        document.getElementById(
            'os-numero-orcamento'
        ).value,

    observacao:
        document.getElementById(
            'os-observacao'
        ).value,

    dataEmissao:
        osEditando !== null
        ? listaOS[osEditando].dataEmissao
        : new Date().toLocaleDateString(),

    dataEntrega:
        document.getElementById(
            'os-data-entrega'
        ).value,

    status:
        document.getElementById(
            'os-status'
        ).value,

    itens
};

    if (osEditando !== null) {
        listaOS[osEditando] = os;
    } else {
        listaOS.push(os);
    }

   salvarOSStorage();
   carregarOS();

closeModal();

setTimeout(() => {
    if (typeof renderPage === 'function') {
        renderPage();
    }
}, 100);
window.db.ordensServico = listaOS;

carregarOS(); // 🔥 garante sync real

setTimeout(() => {
    renderOrdensServico(); // força re-render da tela atual
    renderPage?.(); // fallback do teu sistema
}, 50);
}

/* ===================================================== */
/* GERAR CÓDIGO                                        */
/* ===================================================== */

function gerarCodigoOS() {

    const numerosExistentes = (window.db.ordensServico || [])
        .map(os => parseInt(
            String(os.codigo)
                .replace('OS-', '')
        ))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    let proximo = 1;

    for (const numero of numerosExistentes) {

        if (numero === proximo) {
            proximo++;
        } else {
            break;
        }

    }

    return `OS-${String(proximo).padStart(4, '0')}`;
}

/* ===================================================== */
/* VISUALIZAR OS                                         */
/* ===================================================== */

function visualizarOS(index) {

    const os = listaOS[index];

    configModal({

        title: `OS ${os.codigo}`,

        size: 'fullscreen',

        hideConfirm: true,

        body: `

<div
id="print-os"
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
                "
            >

        </div>

        <div style="text-align:right;">

            <div style="
                font-size:34px;
                font-weight:800;
                letter-spacing:1px;
            ">
                ORDEM DE SERVIÇO
            </div>

            <div style="
                margin-top:8px;
                opacity:.85;
                font-size:13px;
            ">
                Nº ${os.codigo}
            </div>

        </div>

    </div>

    <!-- DADOS GERAIS -->

    <div style="
    background:#f5f5f5;
    padding:10px 14px;
    border-radius:14px;
    margin-bottom:12px;
">

        <div style="
    font-size:16px;
    font-weight:700;
    margin-bottom:8px;
">
            Informações Gerais
        </div>

        <div style="
            display:grid;
grid-template-columns:1fr 1fr;
gap:6px 18px;
font-size:12px;
line-height:1.25;
        ">

            <div>
                <span style="
    color:#6b7280;
    font-size:11px;
">
Cliente
</span><br>

<b>${os.cliente || '-'}</b>
                ${os.cliente || '-'}
            </div>

            <div>
                <b>Orçamento:</b><br>
                ${os.numeroOrcamento || '-'}
            </div>

            <div>
                <b>Data de Emissão:</b><br>
                ${os.dataEmissao || '-'}
            </div>

            <div>
                <b>Data de Entrega:</b><br>
                ${formatarDataBR(os.dataEntrega)}
            </div>

            <div style="grid-column:1/3;">

                <b>Status:</b>

                <span style="
                    display:inline-block;
                    margin-left:10px;
                    background:${corStatus(os.status)};
                    color:#fff;
                    padding:4px 10px;
                    border-radius:999px;
                    font-size:12px;
                    font-weight:700;
                ">
                    ${os.status}
                </span>

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
            Produtos da Ordem
        </div>

        ${(os.itens || []).map((i, idx) => `

            <div style="
                background:#fff;
                border:1px solid #d1d5db;
                border-radius:12px;
                padding:10px;
                margin-bottom:8px;
            ">

                <!-- PRODUTO -->

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:20px;
                    margin-bottom:14px;
                ">

                    <div style="flex:1;">

                        <div style="
                            font-size:12px;
                            color:#6b7280;
                            margin-bottom:4px;
                        ">
                            ITEM ${idx + 1}
                        </div>

                        <div style="
    font-size:15px;
    font-weight:700;
    line-height:1.5;
    margin:0;
    padding:0;
">
    ${String(i.produto || '-').trim()}
</div>

                    </div>

                    <div style="
                        background:#0f172a;
                        color:#fff;
                        padding:6px 10px;
                        border-radius:10px;
                        text-align:center;
                        min-width:70px;
                    ">

                        <div style="
                            font-size:10px;
                            opacity:.8;
                            text-transform:uppercase;
                        ">
                            Quantidade
                        </div>

                        <div style="
                            font-size:16px;
                            font-weight:800;
                            line-height:1.2;
                        ">
                            ${i.quantidade || 0}
                        </div>

                    </div>

                </div>

                <!-- MEDIDAS -->

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr 1fr;
                    gap:10px;
                ">

                    <div style="
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        padding:6px;
                        text-align:center;
                    ">

                        <div style="
                            font-size:11px;
                            color:#6b7280;
                            text-transform:uppercase;
                        ">
                            Altura
                        </div>

                        <div style="
                            font-size:14px;
                            font-weight:700;
                            margin-top:2px;
                        ">
                            ${i.altura || '-'}
                        </div>

                    </div>

                    <div style="
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">

                        <div style="
                            font-size:10px;
                            color:#6b7280;
                            text-transform:uppercase;
                        ">
                            Largura
                        </div>

                        <div style="
                            font-size:18px;
                            font-weight:700;
                            margin-top:4px;
                        ">
                            ${i.largura || '-'}
                        </div>

                    </div>

                    <div style="
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">

                        <div style="
                            font-size:11px;
                            color:#6b7280;
                            text-transform:uppercase;
                        ">
                            Comprimento
                        </div>

                        <div style="
                            font-size:18px;
                            font-weight:700;
                            margin-top:4px;
                        ">
                            ${i.comprimento || '-'}
                        </div>

                    </div>

                </div>

            </div>

        `).join('')}

    </div>

    ${os.observacao ? `

    <div style="
        background:#f5f5f5;
        padding:16px;
        border-radius:14px;
        margin-bottom:14px;
    ">

        <div style="
            font-size:18px;
            font-weight:700;
            margin-bottom:10px;
        ">
            Observações da Produção
        </div>

        <div style="
            white-space:pre-wrap;
            line-height:1.6;
            font-size:13px;
        ">
            ${os.observacao}
        </div>

    </div>

    ` : ''}

</div>

`

    });

}

/* ===================================================== */
/* IMPRESSÃO                                           */
/* ===================================================== */

async function imprimirOS(index) {

    const os = listaOS[index];

    const html = `

<html>

<head>

<title>
Ordem de Serviço ${os.codigo}
</title>

<style>

*{
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
    box-sizing:border-box;
}

body{
    font-family:Arial,sans-serif;
    background:#fff;
    margin:0;
    padding:30px;
    color:#000;
}

@page{
    size:A4;
    margin:12mm;
}

@media print{

    body{
        padding:0;
    }

    *{
        -webkit-print-color-adjust:exact !important;
        print-color-adjust:exact !important;
    }

}

</style>

</head>

<body>

<div
style="
    background:#fff;
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
                "
            >

        </div>

        <div style="text-align:right;">

            <div style="
                font-size:34px;
                font-weight:800;
                letter-spacing:1px;
            ">
                ORDEM DE SERVIÇO
            </div>

            <div style="
                margin-top:8px;
                opacity:.85;
                font-size:13px;
            ">
                Nº ${os.codigo}
            </div>

        </div>

    </div>

    <!-- DADOS GERAIS -->

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
            Informações Gerais
        </div>

        <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:12px 20px;
            font-size:13px;
            line-height:1.5;
        ">

            <div>
                <b>Cliente:</b><br>
                ${os.cliente || '-'}
            </div>

            <div>
                <b>Orçamento:</b><br>
                ${os.numeroOrcamento || '-'}
            </div>

            <div>
                <b>Data de Emissão:</b><br>
                ${os.dataEmissao || '-'}
            </div>

            <div>
                <b>Data de Entrega:</b><br>
                ${formatarDataBR(os.dataEntrega)}
            </div>

            <div style="grid-column:1/3;">

                <b>Status:</b>

                <span style="
                    display:inline-block;
                    margin-left:10px;
                    background:${corStatus(os.status)};
                    color:#fff;
                    padding:4px 10px;
                    border-radius:999px;
                    font-size:12px;
                    font-weight:700;
                ">
                    ${os.status}
                </span>

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
            Produtos da Ordem
        </div>

        ${(os.itens || []).map((i, idx) => `

            <div style="
                background:#fff;
                border:1px solid #d1d5db;
                border-radius:12px;
                padding:14px;
                margin-bottom:12px;
                page-break-inside:avoid;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:20px;
                    margin-bottom:14px;
                ">

                    <div style="flex:1;">

                        <div style="
                            font-size:12px;
                            color:#6b7280;
                            margin-bottom:4px;
                        ">
                            ITEM ${idx + 1}
                        </div>

                        <div style="
    font-size:13px;
    font-weight:700;
    line-height:1.3;
    margin:0;
    padding:0;
">
    ${String(i.produto || '-').trim()}
</div>

                    </div>

                    <div style="
                        background:#0f172a;
                        color:#fff;
                        padding:8px 14px;
                        border-radius:10px;
                        text-align:center;
                        min-width:90px;
                    ">

                        <div style="
                            font-size:10px;
                            opacity:.8;
                            text-transform:uppercase;
                        ">
                            Quantidade
                        </div>

                        <div style="
                            font-size:20px;
                            font-weight:800;
                            line-height:1.2;
                        ">
                            ${i.quantidade || 0}
                        </div>

                    </div>

                </div>

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr 1fr;
                    gap:10px;
                ">

                    <div style="
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">

                        <div style="
                            font-size:11px;
                            color:#6b7280;
                            text-transform:uppercase;
                        ">
                            Altura
                        </div>

                        <div style="
                            font-size:18px;
                            font-weight:700;
                            margin-top:4px;
                        ">
                            ${i.altura || '-'}
                        </div>

                    </div>

                    <div style="
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">

                        <div style="
                            font-size:11px;
                            color:#6b7280;
                            text-transform:uppercase;
                        ">
                            Largura
                        </div>

                        <div style="
                            font-size:18px;
                            font-weight:700;
                            margin-top:4px;
                        ">
                            ${i.largura || '-'}
                        </div>

                    </div>

                    <div style="
                        border:1px solid #d1d5db;
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">

                        <div style="
                            font-size:11px;
                            color:#6b7280;
                            text-transform:uppercase;
                        ">
                            Comprimento
                        </div>

                        <div style="
                            font-size:18px;
                            font-weight:700;
                            margin-top:4px;
                        ">
                            ${i.comprimento || '-'}
                        </div>

                    </div>

                </div>

            </div>

        `).join('')}

    </div>

    ${os.observacao ? `

    <div style="
        background:#f5f5f5;
        padding:16px;
        border-radius:14px;
        margin-bottom:14px;
    ">

        <div style="
            font-size:18px;
            font-weight:700;
            margin-bottom:10px;
        ">
            Observações da Produção
        </div>

        <div style="
            white-space:pre-wrap;
            line-height:1.6;
            font-size:13px;
        ">
            ${os.observacao}
        </div>

    </div>

    ` : ''}

</div>

    ${`

<div
style="
    display:flex;
    justify-content:space-between;
    gap:80px;
    margin-top:60px;
">

    <div style="
        flex:1;
        text-align:center;
    ">

        <div style="
            border-top:1px solid #94a3b8;
            padding-top:10px;
            font-size:13px;
            font-weight:600;
        ">
            Responsável pela Produção
        </div>

        <div style="
            margin-top:6px;
            font-size:11px;
            color:#64748b;
        ">
            Nome e Assinatura
        </div>

    </div>

    <div style="
        flex:1;
        text-align:center;
    ">

        <div style="
            border-top:1px solid #94a3b8;
            padding-top:10px;
            font-size:13px;
            font-weight:600;
        ">
            Responsável pela Autorização
        </div>

        <div style="
            margin-top:6px;
            font-size:11px;
            color:#64748b;
        ">
            Nome e Assinatura
        </div>

    </div>

</div>

`}

<script>

window.onload = () => {

    setTimeout(() => {

        window.print();

    }, 700);

};


</script>

</body>

</html>

`;

    try {

        await window.api.imprimirHTML(html);

    }

    catch (e) {

        console.error(
            'Erro impressão:',
            e
        );

    }

}

function excluirOS(index) {

    const os = listaOS[index];

    const confirmar = confirm(
`ATENÇÃO

Você está excluindo a OS ${os.codigo}

Esta ação não poderá ser desfeita.

Deseja continuar?`
);

    if (!confirmar) return;

    listaOS.splice(index, 1);

    window.db.ordensServico = listaOS;

    salvarOSStorage();

    carregarOS();

    renderPage?.();
}

/* ===================================================== */
/* REGISTRO                                             */
/* ===================================================== */

registerPage('ordens-servico', renderOrdensServico);