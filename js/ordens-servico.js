/* ========================================================= */
/* DOMINUS ERP - ORDENS-SERVICO.JS                           */
/* ========================================================= */
/*
    ORDENS DE SERVIÇO

    Este arquivo controla a tela de Ordens de Serviço
    e o fluxo de criação, edição, visualização e impressão.

    PRINCIPAIS RESPONSABILIDADES:
    1. Carregar e salvar as ordens de serviço
    2. Exibir indicadores do módulo
    3. Filtrar por status e busca
    4. Renderizar a grade de ordens
    5. Criar OS manualmente
    6. Criar OS a partir de orçamento
    7. Editar OS
    8. Gerenciar itens da produção
    9. Gerar código de OS
    10. Visualizar OS
    11. Imprimir OS
    12. Excluir OS
    13. Criar automaticamente OS vinda de orçamento aprovado
    14. Trabalhar com os status:
        Aberta, Em Produção, Concluída, Finalizada,
        Cancelada e Atrasada
    15. Registrar a página no Dominus ERP

    IMPORTANTE:
    A lógica visual, o formulário de criação, itens,
    visualização e impressão da OS foram preservados.
    A alteração desta versão está concentrada na base
    dos status e na criação automática vinda de orçamento.
*/


/* ========================================================= */
/* 01. ESTADO GLOBAL DAS ORDENS DE SERVIÇO                 */
/* ========================================================= */

let listaOS = [];
let osEditando = null;
let filtroOS = 'TODAS';
let buscaOS = '';

/* ========================================================= */
/* 02. CARREGAR ORDENS DE SERVIÇO                          */
/* ========================================================= */

/* --------------------------------------------------------- */
/* carregarOS */
/* Carrega as ordens do banco para a lista usada na tela. */
/* --------------------------------------------------------- */

function carregarOS() {

    window.db.ordensServico =
        window.db.ordensServico
        || [];

    let alterou =
        false;

    window.db.ordensServico
        .forEach(
            os => {

                const statusNovo =
                    normalizarStatusOS(
                        os.status
                    );

                if (
                    os.status !==
                    statusNovo
                ) {

                    os.status =
                        statusNovo;

                    alterou =
                        true;
                }
            }
        );

    listaOS =
        [
            ...window.db.ordensServico
        ];

    if (
        alterou
        &&
        typeof save ===
            'function'
    ) {

        Promise
            .resolve(
                save()
            )
            .catch(
                erro =>
                    console.error(
                        'Erro ao migrar status das OS:',
                        erro
                    )
            );
    }
}

/* ========================================================= */
/* 03. SALVAR ORDENS DE SERVIÇO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarOSStorage */
/* Persiste a lista atual em db.ordensServico. */
/* --------------------------------------------------------- */

async function salvarOSStorage() {

    window.db.ordensServico = listaOS;

    try {
        await save();
    } catch (e) {
        console.error("Erro ao salvar DB:", e);
    }
}

/* ========================================================= */
/* 04. FORMATAR DATA                                       */
/* ========================================================= */

/* --------------------------------------------------------- */
/* formatarDataBR */
/* Formata data ISO para o padrão brasileiro. */
/* --------------------------------------------------------- */

function formatarDataBR(data) {

    if (!data) return '';

    const partes = data.split('-');

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* ========================================================= */
/* 05. CONFIGURAÇÃO VISUAL DOS STATUS                      */
/* ========================================================= */

/* --------------------------------------------------------- */
/* corStatus */
/* Retorna a cor correspondente ao status da OS. */
/* --------------------------------------------------------- */

function corStatus(status) {

    const map = {
        'Aberta': '#f59e0b',
        'Em Produção': '#3b82f6',
        'Concluída': '#10b981',
        'Finalizada': '#22c55e',
        'Cancelada': '#ef4444',
        'Atrasada': '#dc2626'
    };

    return map[status] || '#6b7280';
}


/* --------------------------------------------------------- */
/* normalizarStatusOS                                        */
/* Migra o antigo status "Entregue" para "Finalizada".       */
/* --------------------------------------------------------- */

function normalizarStatusOS(
    status
) {

    const valor =
        String(
            status || ''
        ).trim();

    if (
        valor ===
        'Entregue'
    ) {

        return 'Finalizada';
    }

    const validos = [
        'Aberta',
        'Em Produção',
        'Concluída',
        'Finalizada',
        'Cancelada'
    ];

    if (
        validos.includes(
            valor
        )
    ) {

        return valor;
    }

    return 'Aberta';
}


/* --------------------------------------------------------- */
/* osEstaAtrasada                                            */
/* Mantém a mesma lógica de atraso já existente no módulo.   */
/* --------------------------------------------------------- */

function osEstaAtrasada(
    os
) {

    if (
        !os?.dataEntrega
    ) {

        return false;
    }

    const hoje =
        new Date()
            .toISOString()
            .split('T')[0];

    return (
        os.dataEntrega < hoje
        &&
        os.status !==
            'Finalizada'
        &&
        os.status !==
            'Cancelada'
    );
}


/* --------------------------------------------------------- */
/* statusExibicaoOS                                          */
/* "Atrasada" é automático conforme a data de entrega.       */
/* --------------------------------------------------------- */

function statusExibicaoOS(
    os
) {

    if (
        osEstaAtrasada(
            os
        )
    ) {

        return 'Atrasada';
    }

    return normalizarStatusOS(
        os?.status
    );
}

/* ========================================================= */
/* 06. DASHBOARD DAS ORDENS DE SERVIÇO                     */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderDashboardOS */
/* Calcula e renderiza os indicadores do módulo. */
/* --------------------------------------------------------- */

function renderDashboardOS() {

    const total = listaOS.length;

    const abertas =
        listaOS.filter(
            o =>
                statusExibicaoOS(o)
                ===
                'Aberta'
        ).length;

    const producao =
        listaOS.filter(
            o =>
                statusExibicaoOS(o)
                ===
                'Em Produção'
        ).length;

    const concluidas =
        listaOS.filter(
            o =>
                statusExibicaoOS(o)
                ===
                'Concluída'
        ).length;

    const finalizadas =
        listaOS.filter(
            o =>
                statusExibicaoOS(o)
                ===
                'Finalizada'
        ).length;

    const canceladas =
        listaOS.filter(
            o =>
                statusExibicaoOS(o)
                ===
                'Cancelada'
        ).length;

    const atrasadas =
        listaOS.filter(
            o =>
                statusExibicaoOS(o)
                ===
                'Atrasada'
        ).length;

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
                ✅ Finalizadas: ${finalizadas}
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

/* ========================================================= */
/* 07. RENDERIZAÇÃO PRINCIPAL                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderOrdensServico */
/* Monta a tela principal de Ordens de Serviço. */
/* --------------------------------------------------------- */

function renderOrdensServico() {

    carregarOS();

    return `
        <div class="content-card">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:15px;
            ">

                <h2>Ordens de Serviço</h2>

                <button
                    class="btn-action"
                    onclick="abrirNovaOS()"
                >
                    + Nova OS
                </button>

            </div>

            ${renderDashboardOS()}

            ${renderFiltrosOS()}

            <div
                id="grid-os"
                style="
                    width:100%;
                    overflow-x:auto;
                "
            >
                ${renderGridOS()}
            </div>

        </div>
    `;
}

/* ========================================================= */
/* 08. FILTROS                                             */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderFiltrosOS */
/* Monta busca e filtro de status. */
/* --------------------------------------------------------- */

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
                value="${String(buscaOS || '').replace(/"/g, '&quot;')}"
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

                <option
                    value="TODAS"
                    ${filtroOS === 'TODAS' ? 'selected' : ''}
                >
                    Todas
                </option>

                <option
                    value="Aberta"
                    ${filtroOS === 'Aberta' ? 'selected' : ''}
                >
                    Abertas
                </option>

                <option
                    value="Em Produção"
                    ${filtroOS === 'Em Produção' ? 'selected' : ''}
                >
                    Produção
                </option>

                <option
                    value="Concluída"
                    ${filtroOS === 'Concluída' ? 'selected' : ''}
                >
                    Concluídas
                </option>

                <option
                    value="Finalizada"
                    ${filtroOS === 'Finalizada' ? 'selected' : ''}
                >
                    Finalizadas
                </option>

                <option
                    value="Cancelada"
                    ${filtroOS === 'Cancelada' ? 'selected' : ''}
                >
                    Canceladas
                </option>

                <option
                    value="Atrasada"
                    ${filtroOS === 'Atrasada' ? 'selected' : ''}
                >
                    Atrasadas
                </option>

            </select>

        </div>
    `;
}

/* --------------------------------------------------------- */
/* atualizarGridOS */
/* Atualiza somente a grade de ordens. */
/* --------------------------------------------------------- */

function atualizarGridOS() {

    const grid =
        document.getElementById('grid-os');

    if (grid) {

        grid.innerHTML =
            renderGridOS();

    }

}

/* --------------------------------------------------------- */
/* atualizarTelaOSImediatamente                              */
/* Atualiza toda a tela sem precisar sair e voltar.          */
/* --------------------------------------------------------- */

function atualizarTelaOSImediatamente() {

    window.db.ordensServico =
        listaOS;

    carregarOS();

    const viewPort =
        document.getElementById(
            'view-port'
        );

    if (
        viewPort
        &&
        window.currentPage ===
            'ordens-servico'
    ) {

        viewPort.innerHTML =
            renderOrdensServico();

        const campoBusca =
            document.getElementById(
                'busca-os'
            );

        if (campoBusca) {

            campoBusca.value =
                buscaOS
                ||
                '';
        }

        return;
    }

    if (
        typeof window.navigate ===
            'function'
    ) {

        window.navigate(
            'ordens-servico',
            false
        );
    }
}

/* ========================================================= */
/* 09. GRADE / TABELA DAS ORDENS                           */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderGridOS */
/* Filtra e renderiza a tabela de ordens. */
/* --------------------------------------------------------- */

function renderGridOS() {

    console.log('Filtro atual:', filtroOS);

    let dados = [...listaOS];

    /* FILTRO STATUS */

    if (filtroOS !== 'TODAS') {

        dados = dados.filter(
            o =>
                statusExibicaoOS(
                    o
                )
                ===
                filtroOS
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

        <table
            class="table"
            style="
                width:100%;
                table-layout:auto;
                white-space:nowrap;
            "
        >

            <thead>

                <tr>

                    <th style="white-space:nowrap;">
                        Código
                    </th>

                    <th style="white-space:nowrap;">
                        Cliente
                    </th>

                    <th style="white-space:nowrap;">
                        Orçamento
                    </th>

                    <th style="white-space:nowrap;">
                        Emissão
                    </th>

                    <th style="white-space:nowrap;">
                        Entrega
                    </th>

                    <th style="white-space:nowrap;">
                        Status
                    </th>

                    <th style="white-space:nowrap;">
                        Ações
                    </th>

                </tr>

            </thead>

            <tbody>

                ${dados.map((os) => {

                    const indiceReal =
                        listaOS.findIndex(
                            x => x.codigo === os.codigo
                        );

                    const statusTela =
                        statusExibicaoOS(
                            os
                        );

                    const atrasada =
                        statusTela ===
                        'Atrasada';

                    return `

                        <tr
                            style="
                                ${atrasada ? 'background:#fff1f2;' : ''}
                            "
                        >

                            <td style="
                                white-space:nowrap;
                            ">
                                ${os.codigo}
                            </td>

                            <td style="
                                white-space:nowrap;
                            ">
                                ${os.cliente}
                            </td>

                            <td style="
                                white-space:nowrap;
                            ">
                                ${os.numeroOrcamento || '-'}
                            </td>

                            <td style="
                                white-space:nowrap;
                            ">
                                ${os.dataEmissao}
                            </td>

                            <td style="
                                white-space:nowrap;
                            ">
                                ${os.dataEntrega || '-'}
                            </td>

                            <td style="
                                white-space:nowrap;
                            ">

                                <span style="
                                    display:inline-block;
                                    padding:3px 8px;
                                    border-radius:8px;
                                    background:${corStatus(statusTela)};
                                    color:white;
                                    font-size:12px;
                                    white-space:nowrap;
                                ">
                                    ${statusTela}
                                </span>

                            </td>

                            <td style="
                                white-space:nowrap;
                                min-width:330px;
                            ">

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:6px;
                                    flex-wrap:nowrap;
                                    white-space:nowrap;
                                ">

                                    <button
                                        onclick="visualizarOS(${indiceReal})"
                                        style="
                                            background:#eff6ff;
                                            color:#2563eb;
                                            border:none;
                                            padding:7px 10px;
                                            border-radius:8px;
                                            cursor:pointer;
                                            font-weight:600;
                                            white-space:nowrap;
                                            flex-shrink:0;
                                        "
                                    >
                                        👁 Visualizar
                                    </button>

                                    <button
                                        onclick="editarOS(${indiceReal})"
                                        style="
                                            background:#fef3c7;
                                            color:#b45309;
                                            border:none;
                                            padding:7px 10px;
                                            border-radius:8px;
                                            cursor:pointer;
                                            font-weight:600;
                                            white-space:nowrap;
                                            flex-shrink:0;
                                        "
                                    >
                                        ✏ Editar
                                    </button>

                                    <button
                                        onclick="imprimirOS(${indiceReal})"
                                        style="
                                            background:#dcfce7;
                                            color:#15803d;
                                            border:none;
                                            padding:7px 10px;
                                            border-radius:8px;
                                            cursor:pointer;
                                            font-weight:600;
                                            white-space:nowrap;
                                            flex-shrink:0;
                                        "
                                    >
                                        🖨 Imprimir
                                    </button>

                                    <button
                                        onclick="excluirOS(${indiceReal})"
                                        style="
                                            background:#fee2e2;
                                            color:#dc2626;
                                            border:none;
                                            padding:7px 10px;
                                            border-radius:8px;
                                            cursor:pointer;
                                            font-weight:600;
                                            white-space:nowrap;
                                            flex-shrink:0;
                                        "
                                    >
                                        🗑 Excluir
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }).join('')}

            </tbody>

        </table>

    `;

}

/* ========================================================= */
/* 10. NOVA ORDEM DE SERVIÇO                               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirNovaOS */
/* Abre o formulário de uma nova ordem. */
/* --------------------------------------------------------- */

function abrirNovaOS() {

    osEditando = null;

    configModal({
        title: 'Nova Ordem de Serviço',
        confirmText: 'Salvar OS',
        onConfirm: salvarOS,
        body: renderFormOS()
    });
}

/* ========================================================= */
/* 11. EDITAR ORDEM DE SERVIÇO                             */
/* ========================================================= */

/* --------------------------------------------------------- */
/* editarOS */
/* Carrega uma ordem existente no formulário de edição. */
/* --------------------------------------------------------- */

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

        document.getElementById('os-cliente').value =
            os.cliente || '';

        document.getElementById('os-data-entrega').value =
            os.dataEntrega || '';

        document.getElementById('os-status').value =
            normalizarStatusOS(os.status);

        document.getElementById('os-numero-orcamento').value =
            os.numeroOrcamento || os.orcamentoCodigo || '';

        document.getElementById('os-observacao').value =
            os.observacao || '';

        const tipoOriginal =
            os.tipoCriacao === 'orcamento'
            ? 'orcamento'
            : 'manual';

        const radioTipo =
            document.querySelector(
                `input[name="tipo-os"][value="${tipoOriginal}"]`
            );

        if (radioTipo) {
            radioTipo.checked = true;
            alternarTipoOS();
        }

        if (tipoOriginal === 'orcamento') {

            const seletorOrcamento =
                document.getElementById('os-orcamento');

            if (seletorOrcamento) {
                seletorOrcamento.value =
                    os.numeroOrcamento || os.orcamentoCodigo || '';
            }
        }

        document.getElementById('os-itens').innerHTML = '';

        (os.itens || []).forEach(i =>
            addItemOS(i)
        );

    }, 100);
}

/* ========================================================= */
/* 12. FORMULÁRIO DA ORDEM DE SERVIÇO                      */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderFormOS */
/* Monta o formulário manual ou baseado em orçamento. */
/* --------------------------------------------------------- */

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
            onchange="alternarTipoOS()"
        >

        Manual

    </label>

    <label>

        <input
            type="radio"
            name="tipo-os"
            value="orcamento"
            onchange="alternarTipoOS()"
        >

        A partir do orçamento

    </label>

</div>

<div
    id="bloco-orcamento"
    style="
        display:none;
        margin-bottom:15px;
    "
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
            .map((o) => `

                <option value="${o.codigo}">
                    ${o.codigo} - ${o.cliente}
                </option>

            `)
            .join('')
        }

    </select>

</div>

<div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
">

    <select
        id="os-cliente"
        style="
            width:100%;
            padding:8px;
            border:1px solid #ddd;
            border-radius:8px;
        "
    >

        <option value="">
            Selecione o cliente
        </option>

        ${(window.db.clientes || []).map(c => `

            <option value="${c.nome}">
                ${c.nome}
            </option>

        `).join('')}

    </select>

    <input
        id="os-data-entrega"
        type="date"
        style="
            width:100%;
            padding:8px;
            border:1px solid #ddd;
            border-radius:8px;
        "
    >

</div>

<div style="
    margin-top:10px;
">

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
        <option>Finalizada</option>
        <option>Cancelada</option>

    </select>

</div>

<div style="
    margin-top:10px;
">

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

<h3>
    Itens
</h3>

<div id="os-itens"></div>

<button
    onclick="addItemOS()"
    style="
        margin-top:10px;
        background:#3b82f6;
        color:white;
        border:none;
        padding:10px 14px;
        border-radius:10px;
        cursor:pointer;
        font-weight:600;
    "
>
    + Adicionar Produto
</button>

<div style="
    margin-top:20px;
">

    <h3>
        Observação Geral da Produção
    </h3>

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

/* ========================================================= */
/* 13. ITENS DA ORDEM DE SERVIÇO                           */
/* ========================================================= */

/* --------------------------------------------------------- */
/* addItemOS */
/* Adiciona uma linha de item à ordem de serviço. */
/* --------------------------------------------------------- */

function addItemOS(data = {}) {

    const div =
        document.createElement('div');

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

<div style="
    grid-column:1/-1;
">
    <strong>
        Descrição
    </strong>
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

    document
        .getElementById('os-itens')
        .appendChild(div);
}

/* --------------------------------------------------------- */
/* alternarTipoOS */
/* Alterna entre OS manual e OS a partir de orçamento. */
/* --------------------------------------------------------- */

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

/* --------------------------------------------------------- */
/* carregarOrcamentoOS */
/* Carrega dados do orçamento selecionado para a OS. */
/* --------------------------------------------------------- */

function carregarOrcamentoOS() {

    const codigoSelecionado =
        document.getElementById(
            'os-orcamento'
        ).value;

    if (!codigoSelecionado) return;

    const orc =
        (window.db.orcamentos || [])
            .find(o =>
                String(o.codigo).trim()
                ===
                String(codigoSelecionado).trim()
            );

    if (!orc) {

        console.log(
            'Orçamento não encontrado:',
            codigoSelecionado
        );

        return;
    }

    document.getElementById(
        'os-cliente'
    ).value =
        orc.cliente || '';

    document.getElementById(
        'os-numero-orcamento'
    ).value =
        orc.codigo || '';

    document.getElementById(
        'os-itens'
    ).innerHTML =
        '';

    (orc.itens || []).forEach(i => {

        addItemOS({

            produto:
                i.produto ||
                i.descricao ||
                '',

            quantidade:
                i.quantidade ||
                i.qtd ||
                '',

            altura:
                i.altura || '',

            largura:
                i.largura || '',

            comprimento:
                i.comprimento || ''

        });

    });

}

/* ========================================================= */
/* 13.1 CRIAÇÃO AUTOMÁTICA A PARTIR DE ORÇAMENTO APROVADO  */
/* ========================================================= */

/* --------------------------------------------------------- */
/* criarOSAutomaticaOrcamento                                */
/* Replica a mesma base da criação "A partir do orçamento".  */
/* --------------------------------------------------------- */

window.criarOSAutomaticaOrcamento =
async function (
    orcamento
) {

    if (!orcamento) {
        return null;
    }

    carregarOS();

    /*
        Proteção contra duplicidade:
        um mesmo orçamento pode possuir somente uma OS criada
        automaticamente / vinculada pelo número do orçamento.
    */

    const existente =
        listaOS.find(
            os =>
                String(
                    os.numeroOrcamento || ''
                ).trim()
                ===
                String(
                    orcamento.codigo || ''
                ).trim()
        );

    if (existente) {

        return existente;
    }

    const novaOS = {

        codigo:
            gerarCodigoOS(),

        tipoCriacao:
            'orcamento',

        cliente:
            orcamento.cliente
            ||
            '',

        numeroOrcamento:
            String(
                orcamento.codigo
                ||
                ''
            ),

        observacao:
            '',

        dataEmissao:
            new Date()
                .toLocaleDateString(),

        /*
            Mantém a lógica atual da criação "A partir do orçamento":
            a data de entrega continua sendo definida dentro da OS.
        */

        dataEntrega:
            '',

        status:
            'Aberta',

        itens:
            (orcamento.itens || [])
                .map(
                    item => ({

                        produto:
                            item.produto
                            ||
                            item.descricao
                            ||
                            '',

                        quantidade:
                            item.quantidade
                            ||
                            item.qtd
                            ||
                            '',

                        altura:
                            item.altura
                            ||
                            '',

                        largura:
                            item.largura
                            ||
                            '',

                        comprimento:
                            item.comprimento
                            ||
                            ''
                    })
                )
    };

    listaOS.push(
        novaOS
    );

    await salvarOSStorage();

    carregarOS();

    return novaOS;
};


/* ========================================================= */
/* 14. SALVAR ORDEM DE SERVIÇO                             */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarOS */
/* Valida e salva uma ordem nova ou editada. */
/* --------------------------------------------------------- */

async function salvarOS() {

    const itens = [];

    document
        .querySelectorAll(
            '#os-itens > div'
        )
        .forEach(d => {

            itens.push({

                produto:
                    d.querySelector('.p')
                        .value
                        .trim(),

                quantidade:
                    d.querySelector('.q')
                        .value,

                altura:
                    d.querySelector('.a')
                        .value,

                largura:
                    d.querySelector('.l')
                        .value,

                comprimento:
                    d.querySelector('.c')
                        .value

            });

        });

    const statusAnterior =
        osEditando !== null
            ?
            normalizarStatusOS(
                listaOS[osEditando]
                    ?.status
            )
            :
            null;

    const os = {

        codigo:
            osEditando !== null
            ? listaOS[osEditando].codigo
            : gerarCodigoOS(),

        tipoCriacao:
            (
                document.querySelector(
                    'input[name="tipo-os"]:checked'
                )?.value
                ||
                (
                    osEditando !== null
                    ? listaOS[osEditando]?.tipoCriacao
                    : ''
                )
                ||
                'manual'
            ),

        cliente:
            document.getElementById(
                'os-cliente'
            ).value,

        numeroOrcamento:
            (
                document.getElementById(
                    'os-numero-orcamento'
                ).value
                ||
                (
                    osEditando !== null
                    ? listaOS[osEditando]?.numeroOrcamento
                    : ''
                )
                ||
                (
                    osEditando !== null
                    ? listaOS[osEditando]?.orcamentoCodigo
                    : ''
                )
                ||
                ''
            ),

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
            normalizarStatusOS(
                document.getElementById(
                    'os-status'
                ).value
            ),

        itens

    };

    if (osEditando !== null) {

        listaOS[osEditando] = os;

    } else {

        listaOS.push(os);

    }

    await salvarOSStorage();

    /*
        Quando a OS muda para Concluída, cria automaticamente
        o Termo de Recebimento na tela de Recibos/Comprovantes.

        A criação acontece apenas na transição para Concluída.
        Assim, editar novamente uma OS já concluída não cria
        termos duplicados.
    */

    if(
        os.status === 'Concluída'
        &&
        statusAnterior !== 'Concluída'
    ){

        if(
            typeof window.criarTermoServicoDaOS ===
                'function'
        ){

            await window
                .criarTermoServicoDaOS(
                    os
                );

        }else{

            console.error(
                'Função criarTermoServicoDaOS não encontrada.'
            );
        }
    }

    closeModal();

    atualizarTelaOSImediatamente();
}

/* ========================================================= */
/* 15. GERAR CÓDIGO DA OS                                  */
/* ========================================================= */

/* --------------------------------------------------------- */
/* gerarCodigoOS */
/* Gera o próximo código da ordem de serviço. */
/* --------------------------------------------------------- */

function gerarCodigoOS() {

    const numerosExistentes =
        (window.db.ordensServico || [])

        .map(os =>
            parseInt(
                String(os.codigo)
                    .replace('OS-', '')
            )
        )

        .filter(n =>
            !isNaN(n)
        )

        .sort((a, b) =>
            a - b
        );

    let proximo = 1;

    for (
        const numero
        of numerosExistentes
    ) {

        if (
            numero === proximo
        ) {

            proximo++;

        } else {

            break;

        }

    }

    return `OS-${String(proximo).padStart(4, '0')}`;
}

/* ========================================================= */
/* 16. VISUALIZAR ORDEM DE SERVIÇO                         */
/* ========================================================= */

/* --------------------------------------------------------- */
/* visualizarOS */
/* Abre a visualização completa da OS. */
/* --------------------------------------------------------- */

function visualizarOS(index) {

    const os =
        listaOS[index];

    configModal({

        title:
            `OS ${os.codigo}`,

        size:
            'fullscreen',

        hideConfirm:
            true,

        body: `

<div
    id="print-os"
    style="
        background:#fff;
        padding:20px;
        font-family:Arial,sans-serif;
        color:#000;
    "
>

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

        <div style="
            text-align:right;
        ">

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
                </span>

                <br>

                <b>
                    ${os.cliente || '-'}
                </b>

            </div>

            <div>

                <b>
                    Orçamento:
                </b>

                <br>

                ${os.numeroOrcamento || '-'}

            </div>

            <div>

                <b>
                    Data de Emissão:
                </b>

                <br>

                ${os.dataEmissao || '-'}

            </div>

            <div>

                <b>
                    Data de Entrega:
                </b>

                <br>

                ${formatarDataBR(
                    os.dataEntrega
                )}

            </div>

            <div style="
                grid-column:1/3;
            ">

                <b>
                    Status:
                </b>

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

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:20px;
                    margin-bottom:14px;
                ">

                    <div style="
                        flex:1;
                    ">

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
                            ${String(
                                i.produto || '-'
                            ).trim()}
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

/* ========================================================= */
/* 17. IMPRESSÃO DA ORDEM DE SERVIÇO                       */
/* ========================================================= */

/* --------------------------------------------------------- */
/* imprimirOS */
/* Monta e envia a ordem de serviço para impressão. */
/* --------------------------------------------------------- */

async function imprimirOS(index) {

    const os =
        listaOS[index];

    const html = `

<html>

<head>

<title>
    Ordem de Serviço ${os.codigo}
</title>

<style>

* {
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
    box-sizing:border-box;
}

body {
    font-family:Arial,sans-serif;
    background:#fff;
    margin:0;
    padding:30px;
    color:#000;
}

@page {
    size:A4;
    margin:12mm;
}

@media print {

    body {
        padding:0;
    }

    * {
        -webkit-print-color-adjust:exact !important;
        print-color-adjust:exact !important;
    }

}

</style>

</head>

<body>

<div style="
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

        <div style="
            text-align:right;
        ">

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

                <b>
                    Cliente:
                </b>

                <br>

                ${os.cliente || '-'}

            </div>

            <div>

                <b>
                    Orçamento:
                </b>

                <br>

                ${os.numeroOrcamento || '-'}

            </div>

            <div>

                <b>
                    Data de Emissão:
                </b>

                <br>

                ${os.dataEmissao || '-'}

            </div>

            <div>

                <b>
                    Data de Entrega:
                </b>

                <br>

                ${formatarDataBR(
                    os.dataEntrega
                )}

            </div>

            <div style="
                grid-column:1/3;
            ">

                <b>
                    Status:
                </b>

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

                    <div style="
                        flex:1;
                    ">

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
                            ${String(
                                i.produto || '-'
                            ).trim()}
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

<div style="
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

        await window.api
            .imprimirHTML(html);

    }

    catch (e) {

        console.error(
            'Erro impressão:',
            e
        );

    }

}

/* ========================================================= */
/* 18. EXCLUIR ORDEM DE SERVIÇO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* excluirOS */
/* Exclui uma ordem de serviço após confirmação. */
/* --------------------------------------------------------- */

async function excluirOS(index) {

    const os =
        listaOS[index];

    if (!os) return;

    const confirmar =
        confirm(
`ATENÇÃO

Você está excluindo a OS ${os.codigo}

Esta ação não poderá ser desfeita.

Deseja continuar?`
        );

    if (!confirmar) return;

    listaOS.splice(
        index,
        1
    );

    window.db.ordensServico =
        listaOS;

    await salvarOSStorage();

    atualizarTelaOSImediatamente();
}

/* ========================================================= */
/* 19. REGISTRAR PÁGINA NO SISTEMA                         */
/* ========================================================= */

registerPage(
    'ordens-servico',
    renderOrdensServico
);