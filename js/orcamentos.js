/* ========================================================= */
/* DOMINUS ERP - ORCAMENTOS.JS                               */
/* ========================================================= */
/*
    GESTÃO DE ORÇAMENTOS

    Este arquivo controla a tela principal de Orçamentos
    e o fluxo manual de criação, consulta, visualização,
    edição, duplicação e impressão.

    PRINCIPAIS RESPONSABILIDADES:
    1. Renderizar a listagem de orçamentos
    2. Filtrar por status
    3. Consultar por código, cliente, período e status
    4. Criar novos orçamentos
    5. Preencher dados do cliente
    6. Adicionar e calcular produtos/serviços
    7. Aplicar a regra atual de orçamento sem nota
    8. Aplicar desconto manual em valor (R$) preservando o valor original
    9. Visualizar orçamento completo
    9. Imprimir / gerar versão para impressão
    10. Editar orçamentos existentes
    11. Duplicar orçamentos
    12. Permitir cadastro de cliente durante o orçamento
    13. Integrar o botão "Criar com IA"
    14. Trabalhar somente com os status:
        Aguardando, Aprovado, Cancelado e Recusado
    15. Criar automaticamente uma OS ao aprovar o orçamento
    16. Exibir clientes em ordem alfabética nos seletores
    17. Registrar a página "orcamentos"

    REGRA DE APROVAÇÃO:
    Sempre que um orçamento estiver com status Aprovado,
    o sistema garante que exista uma OS vinculada a ele.
    A criação é protegida contra duplicidade.
*/


/* ========================================================= */
/* 00. STATUS E INTEGRAÇÃO COM ORDENS DE SERVIÇO            */
/* ========================================================= */

const STATUS_ORCAMENTOS = [
    'Aguardando',
    'Aprovado',
    'Cancelado',
    'Recusado'
];


/* --------------------------------------------------------- */
/* ordenarClientesOrcamento                                  */
/* Retorna uma cópia em ordem alfabética pelo nome.          */
/* --------------------------------------------------------- */
/*
    ORDEM ALFABÉTICA - CLIENTES DOS ORÇAMENTOS

    A ordenação é somente visual.

    IMPORTANTE:
    - o array original do banco NÃO é reordenado;
    - códigos, IDs e vínculos permanecem intactos;
    - a comparação usa pt-BR;
    - diferenças de acentuação e maiúsculas/minúsculas não
      atrapalham a ordem apresentada nos campos de seleção.
*/

function ordenarClientesOrcamento(
    lista
) {

    return [
        ...(
            Array.isArray(
                lista
            )
            ?
            lista
            :
            []
        )
    ]
    .sort(
        (a, b) =>
            String(
                a?.nome || ''
            )
            .localeCompare(
                String(
                    b?.nome || ''
                ),
                'pt-BR',
                {
                    sensitivity:'base'
                }
            )
    );
}


/* --------------------------------------------------------- */
/* normalizarStatusOrcamento                                 */
/* Mantém somente os quatro status válidos do módulo.        */
/* --------------------------------------------------------- */

function normalizarStatusOrcamento(
    status
) {

    const valor =
        String(
            status || ''
        ).trim();

    /*
        Migração dos status antigos:
        "Em Produção" e "Finalizado" pertencem agora ao fluxo
        da OS. No orçamento, ambos representam orçamento
        aprovado.
    */

    if (
        valor === 'Em Produção'
        ||
        valor === 'Finalizado'
    ) {

        return 'Aprovado';
    }

    if (
        STATUS_ORCAMENTOS.includes(
            valor
        )
    ) {

        return valor;
    }

    return 'Aguardando';
}


/* --------------------------------------------------------- */
/* ordenarOrcamentosMaisRecentesPrimeiro                     */
/* Exibe sempre o maior código / orçamento mais recente antes.*/
/* --------------------------------------------------------- */

function ordenarOrcamentosMaisRecentesPrimeiro(
    lista
) {

    return [
        ...(
            Array.isArray(
                lista
            )
            ?
            lista
            :
            []
        )
    ]
    .sort(
        (
            a,
            b
        ) => {

            const codigoA =
                Number(
                    a?.codigo
                );

            const codigoB =
                Number(
                    b?.codigo
                );

            const aValido =
                Number.isFinite(
                    codigoA
                );

            const bValido =
                Number.isFinite(
                    codigoB
                );

            if (
                aValido
                &&
                bValido
                &&
                codigoA !==
                    codigoB
            ) {

                return (
                    codigoB
                    -
                    codigoA
                );
            }

            if (
                aValido
                &&
                !bValido
            ) {

                return -1;
            }

            if (
                !aValido
                &&
                bValido
            ) {

                return 1;
            }

            const dataA =
                String(
                    a?.data || ''
                );

            const dataB =
                String(
                    b?.data || ''
                );

            return dataB.localeCompare(
                dataA
            );
        }
    );
}


/* --------------------------------------------------------- */
/* normalizarStatusOrcamentosExistentes                      */
/* Corrige registros antigos sem alterar o restante dos dados.*/
/* --------------------------------------------------------- */

function normalizarStatusOrcamentosExistentes() {

    if (
        !Array.isArray(
            db.orcamentos
        )
    ) {

        return;
    }

    let alterou =
        false;

    db.orcamentos.forEach(
        orcamento => {

            const novoStatus =
                normalizarStatusOrcamento(
                    orcamento.status
                );

            if (
                orcamento.status !==
                novoStatus
            ) {

                orcamento.status =
                    novoStatus;

                alterou =
                    true;
            }
        }
    );

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
                        'Erro ao normalizar status dos orçamentos:',
                        erro
                    )
            );
    }
}


/* --------------------------------------------------------- */
/* garantirOSDoOrcamentoAprovado                             */
/* Cria a OS somente se ainda não existir uma vinculada.     */
/* --------------------------------------------------------- */

async function garantirOSDoOrcamentoAprovado(
    orcamento
) {

    if (
        !orcamento
        ||
        normalizarStatusOrcamento(
            orcamento.status
        ) !==
            'Aprovado'
    ) {

        return null;
    }

    if (
        typeof window.criarOSAutomaticaOrcamento !==
        'function'
    ) {

        console.error(
            'Função de criação automática de OS não encontrada.'
        );

        alert(
            'O orçamento foi aprovado, mas não foi possível criar a OS automaticamente.'
        );

        return null;
    }

    try {

        return await window
            .criarOSAutomaticaOrcamento(
                orcamento
            );

    } catch (erro) {

        console.error(
            'Erro ao criar OS automática:',
            erro
        );

        alert(
            'O orçamento foi aprovado, mas ocorreu um erro ao criar a OS.'
        );

        return null;
    }
}


/* ========================================================= */
/* 01. TELA PRINCIPAL DE ORÇAMENTOS                        */
/* ========================================================= */
window.filtroStatusOrcamentoAtual = '';

/* --------------------------------------------------------- */
/* renderOrcamentos */
/* Renderiza a listagem, filtro de status e ações dos orçamentos. */
/* --------------------------------------------------------- */

window.renderOrcamentos = function () {

    if (!db.orcamentos) {
        db.orcamentos = [];
    }

    normalizarStatusOrcamentosExistentes();

  if (
    db.ultimoOrcamento === undefined ||
    db.ultimoOrcamento === null
) {
    db.ultimoOrcamento = 3687;
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

        <button
            class="btn-action"
            style="
                background:#7c3aed;
            "
            onclick="abrirAssistenteOrcamentoIA()">

            🤖 Criar com IA

        </button>

        </div>

    </div>

    <div style="
        width:150px;
        margin-top:10px;
        margin-left:auto;
    ">

        <label style="
            font-size:12px;
            color:#6b7280;
        ">
            Status
        </label>

        <select
            id="filtro-status-orcamento"
            onchange="filtrarStatusOrcamento()"
            style="
                width:100%;
                padding:8px;
                border-radius:8px;
                border:1px solid #ccc;
            "
        >

            <option value=""
            ${
                window.filtroStatusOrcamentoAtual === ''
                ? 'selected'
                : ''
            }
            >
                Todos
            </option>

            <option value="Aguardando"
            ${
                window.filtroStatusOrcamentoAtual === 'Aguardando'
                ? 'selected'
                : ''
            }
            >
                Aguardando
            </option>

            <option value="Aprovado"
            ${
                window.filtroStatusOrcamentoAtual === 'Aprovado'
                ? 'selected'
                : ''
            }
            >
                Aprovado
            </option>

            <option value="Recusado"
            ${
                window.filtroStatusOrcamentoAtual === 'Recusado'
                ? 'selected'
                : ''
            }
            >
                Recusado
            </option>

            <option value="Cancelado"
            ${
                window.filtroStatusOrcamentoAtual === 'Cancelado'
                ? 'selected'
                : ''
            }
            >
                Cancelado
            </option>

        </select>

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

    /*
        Ordem da tela:
        orçamento mais recente / maior código sempre primeiro.
    */

    let listaOrcamentos =
        ordenarOrcamentosMaisRecentesPrimeiro(
            db.orcamentos
        );

    const filtroStatus =
        filtroStatusOrcamentoAtual;

    if(filtroStatus){

        listaOrcamentos =
            listaOrcamentos.filter(o =>

                o.status === filtroStatus

            );
    }

    listaOrcamentos.forEach(
        (orcamento) => {

        const idx =
            db.orcamentos.indexOf(orcamento);

        let corStatus =
            '#f59e0b';

        if (
            (orcamento.status || '')
            .toLowerCase() ===
            'aprovado'
        ) {

            corStatus =
                '#16a34a';
        }

        if (
            (orcamento.status || '')
            .toLowerCase() ===
            'recusado'
        ) {

            corStatus =
                '#dc2626';
        }

        if (
            (orcamento.status || '')
            .toLowerCase() ===
            'cancelado'
        ) {

            corStatus =
                '#2563eb';
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
    white-space:nowrap;
    display:inline-block;
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
                    background:#2563eb !important;
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
                class="btn-action"
                style="
                    background:#7c3aed;
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="duplicarOrcamento(${idx})">

                📄 Duplicar

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

/* ========================================================= */
/* 02. FILTRO RÁPIDO POR STATUS                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* filtrarStatusOrcamento */
/* Atualiza o filtro rápido de status e recarrega a tela. */
/* --------------------------------------------------------- */

window.filtrarStatusOrcamento = function(){

    const select =
        document.getElementById(
            'filtro-status-orcamento'
        );

    filtroStatusOrcamentoAtual =
        select.value;

    navigate(
        'orcamentos'
    );
};

/* ========================================================= */
/* 03. EXCLUIR ORÇAMENTO                                   */
/* ========================================================= */

/* --------------------------------------------------------- */
/* excluirOrcamento */
/* Exclui um orçamento após confirmação. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 04. CONSULTA AVANÇADA DE ORÇAMENTOS                     */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirConsultaOrcamentos */
/* Abre a consulta avançada de orçamentos. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 05. PROCESSAR FILTROS DA CONSULTA                       */
/* ========================================================= */

/* --------------------------------------------------------- */
/* filtrarConsultaOrcamentos */
/* Aplica os filtros e monta a tabela de resultados. */
/* --------------------------------------------------------- */

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

    /*
        A consulta também mantém o orçamento mais recente
        no topo dos resultados.
    */

    let orcamentos =
        ordenarOrcamentosMaisRecentesPrimeiro(
            db.orcamentos
        );

    /* ========================================================= */
    /* 05.1 FILTRO POR CÓDIGO                                  */
    /* ========================================================= */

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

    /* ========================================================= */
    /* 05.2 FILTRO POR CLIENTE                                 */
    /* ========================================================= */

    if (cliente) {

        orcamentos =
            orcamentos.filter(o =>

                (o.cliente || '')
                .toLowerCase()
                .includes(cliente)
            );
    }

    /* ========================================================= */
    /* 05.3 FILTRO POR STATUS                                  */
    /* ========================================================= */

    if (status) {

        orcamentos =
            orcamentos.filter(o =>

                (o.status || '')
                .toLowerCase() ===
                status
            );
    }

    /* ========================================================= */
    /* 05.4 FILTRO POR DATA INICIAL                            */
    /* ========================================================= */

    if (dataInicio) {

        orcamentos =
            orcamentos.filter(o =>

                o.data >=
                dataInicio
            );
    }

    /* ========================================================= */
    /* 05.5 FILTRO POR DATA FINAL                              */
    /* ========================================================= */

    if (dataFim) {

        orcamentos =
            orcamentos.filter(o =>

                o.data <=
                dataFim
            );
    }

    /* ========================================================= */
    /* 05.6 RESULTADOS DA CONSULTA                             */
    /* ========================================================= */

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
                    background:#2563eb !important;
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
                class="btn-action"
                style="
                    background:#7c3aed;
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="duplicarOrcamento(${idx})">

                📄 Duplicar

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

/* --------------------------------------------------------- */
/* obterProximoCodigoOrcamento */
/* Calcula o próximo código disponível para orçamento. */
/* --------------------------------------------------------- */

window.obterProximoCodigoOrcamento = function () {

    const inicio = 3688;

    const usados =
        (db.orcamentos || [])
        .map(o => Number(o.codigo))
        .filter(n => !isNaN(n))
        .sort((a,b)=>a-b);

    let esperado = inicio;

    for (const numero of usados) {

        if (numero !== esperado) {
            return esperado;
        }

        esperado++;
    }

    return esperado;
};
/* ========================================================= */
/* 06. NOVO ORÇAMENTO                                      */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirModalOrcamento */
/* Abre o formulário de criação de novo orçamento. */
/* --------------------------------------------------------- */

window.abrirModalOrcamento =
function () {

    if (!db.orcamentos) {
        db.orcamentos = [];
    }

    if (!db.clientes) {
        db.clientes = [];
    }

    if (
        db.ultimoOrcamento === undefined ||
        db.ultimoOrcamento === null
    ) {
        db.ultimoOrcamento = 3688;
    }

    const codigo =
        obterProximoCodigoOrcamento();

    let optionsClientes = `

<option value="">
    Selecione
</option>

`;

    /* ===================================================== */
    /* CLIENTES EM ORDEM ALFABÉTICA                          */
    /* ===================================================== */
    /*
        O cadastro de cliente continua com o mesmo código.
        Aqui apenas organizamos a lista exibida no select.
    */

    ordenarClientesOrcamento(
        db.clientes
    )
    .forEach(
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
    <label>Cliente</label>

    <div style="
        display:grid;
        grid-template-columns:1fr 40px;
        gap:8px;
        align-items:end;
    ">

        <select
            id="orc-cliente"
            onchange="preencherDadosClienteOrcamento()">

            ${optionsClientes}

        </select>

       <button
    type="button"
    onclick="abrirCadastroClienteOrcamento()"
    style="
        width:40px;
        height:40px;
        border:none;
        border-radius:8px;
        background:#16a34a;
        color:#fff;
        font-size:22px;
        cursor:pointer;
        margin:0;
        padding:0;

        display:flex;
        align-items:center;
        justify-content:center;
    "
>
    <span style="
        position:relative;
        top:-2px;
    ">+</span>
</button>

    </div>
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

    ${blocoImagensOrcamentoFormulario()}

    <!-- DESCONTO / TOTAIS -->

    <div style="
        margin-top:20px;
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:10px;
    ">

        <!-- VALOR TOTAL ANTES DO DESCONTO -->

        <div style="
            font-size:18px;
            font-weight:600;
        ">

            Valor Total:

            <span id="orc-total-original">
                R$ 0,00
            </span>

        </div>

        <!-- DESCONTO EM REAIS -->

        <div style="
            display:flex;
            align-items:center;
            gap:10px;
        ">

            <label
                for="orc-desconto"
                style="
                    margin:0;
                    font-weight:600;
                ">
                Desconto (R$):
            </label>

            <input
                id="orc-desconto"
                type="text"
                inputmode="decimal"
                value="0,00"
                placeholder="0,00"
                oninput="calcularTotalOrcamento()"
                style="
                    width:150px;
                    text-align:right;
                ">

        </div>

        <!-- VALOR FINAL APÓS O DESCONTO -->

        <h2 style="
            margin:0;
            text-align:right;
        ">

            Valor com Desconto:

            <span id="orc-total">
                R$ 0,00
            </span>

        </h2>

    </div>

</div>
`;

    window._orcImagensEdicao = [];

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
    renderizarImagensOrcamentoEdicao();
};

/* ========================================================= */
/* 06.1 IMAGENS / REFERÊNCIAS DO ORÇAMENTO                  */
/* ========================================================= */
/*
    As imagens são reduzidas antes de serem salvas para evitar
    crescimento excessivo do banco. Elas ficam vinculadas ao
    orçamento e são impressas somente a partir da página seguinte.
*/

window._orcImagensEdicao = window._orcImagensEdicao || [];

window.selecionarImagensOrcamento = function(input){
    const arquivos = Array.from(input?.files || []);
    if(!arquivos.length) return;

    arquivos.forEach(arquivo => {
        if(!arquivo.type.startsWith('image/')) return;

        const leitor = new FileReader();
        leitor.onload = function(e){
            const img = new Image();
            img.onload = function(){
                const max = 1600;
                let largura = img.width;
                let altura = img.height;
                const escala = Math.min(1, max / Math.max(largura, altura));
                largura = Math.round(largura * escala);
                altura = Math.round(altura * escala);

                const canvas = document.createElement('canvas');
                canvas.width = largura;
                canvas.height = altura;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, largura, altura);
                ctx.drawImage(img, 0, 0, largura, altura);

                window._orcImagensEdicao.push({
                    nome: arquivo.name || 'imagem',
                    legenda: '',
                    dataUrl: canvas.toDataURL('image/jpeg', 0.86)
                });
                renderizarImagensOrcamentoEdicao();
            };
            img.src = e.target.result;
        };
        leitor.readAsDataURL(arquivo);
    });

    input.value = '';
};

window.renderizarImagensOrcamentoEdicao = function(){
    const area = document.getElementById('orc-imagens-preview');
    if(!area) return;

    const imagens = window._orcImagensEdicao || [];
    if(!imagens.length){
        area.innerHTML = '<div style="color:#6b7280;font-size:13px;padding:10px 0;">Nenhuma imagem adicionada.</div>';
        return;
    }

    area.innerHTML = imagens.map((img, i) => `
        <div style="display:grid;grid-template-columns:110px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid #e5e7eb;border-radius:10px;margin-top:10px;background:#fff;">
            <img src="${img.dataUrl}" style="width:110px;height:78px;object-fit:contain;border-radius:7px;background:#f3f4f6;">
            <div>
                <div style="font-size:12px;font-weight:700;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${img.nome || `Imagem ${i+1}`}</div>
                <input type="text" value="${String(img.legenda || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="Legenda opcional (ex.: Fachada atual)" oninput="atualizarLegendaImagemOrcamento(${i}, this.value)" style="width:100%;">
            </div>
            <button type="button" class="btn-del" onclick="removerImagemOrcamento(${i})" title="Remover imagem">✕</button>
        </div>
    `).join('');
};

window.atualizarLegendaImagemOrcamento = function(index, valor){
    if(window._orcImagensEdicao?.[index]){
        window._orcImagensEdicao[index].legenda = valor || '';
    }
};

window.removerImagemOrcamento = function(index){
    window._orcImagensEdicao.splice(index, 1);
    renderizarImagensOrcamentoEdicao();
};

window.blocoImagensOrcamentoFormulario = function(){
    return `
        <hr>
        <div style="margin-top:10px;">
            <h3 style="margin-bottom:6px;">🖼️ Imagens / Referências do Projeto</h3>
            <div style="font-size:12px;color:#6b7280;margin-bottom:10px;">
                As imagens serão impressas como anexo visual a partir de uma nova página.
            </div>
            <input id="orc-imagens-input" type="file" accept="image/*" multiple style="display:none" onchange="selecionarImagensOrcamento(this)">
            <button type="button" class="btn-action" onclick="document.getElementById('orc-imagens-input').click()">+ Adicionar Imagem</button>
            <div id="orc-imagens-preview"></div>
        </div>
    `;
};

window.renderAnexoImagensOrcamento = function(o){
    const imagens = Array.isArray(o?.imagens) ? o.imagens.filter(x => x?.dataUrl) : [];
    if(!imagens.length) return '';

    const cards = imagens.map((img, i) => `
        <div class="orc-anexo-card" style="border:1px solid #d1d5db;border-radius:10px;padding:10px;background:#fff;break-inside:avoid;page-break-inside:avoid;">
            <div style="height:245px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border-radius:7px;overflow:hidden;">
                <img src="${img.dataUrl}" style="width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;">
            </div>
            ${img.legenda ? `<div style="font-size:12px;text-align:center;margin-top:8px;font-weight:600;">${String(img.legenda).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` : ''}
        </div>
    `).join('');

    return `
        <section class="orc-anexo-imagens page-break" style="background:#fff;padding:0;font-family:Arial,sans-serif;color:#111;">
            <div style="border-bottom:3px solid #2f2a2c;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;">
                <div>
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">WN Comunicação Visual</div>
                    <div style="font-size:22px;font-weight:800;margin-top:3px;">ANEXO VISUAL</div>
                </div>
                <div style="text-align:right;font-size:12px;line-height:1.5;">
                    <strong>Orçamento nº ${o.codigo || '-'}</strong><br>
                    ${o.cliente || ''}
                </div>
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:14px;">Imagens e referências vinculadas à proposta comercial.</div>
            <div class="orc-anexo-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
                ${cards}
            </div>
        </section>
    `;
};

/* ========================================================= */
/* 07. PREENCHER DADOS DO CLIENTE                          */
/* ========================================================= */

/* --------------------------------------------------------- */
/* preencherDadosClienteOrcamento */
/* Preenche os dados auxiliares do cliente selecionado. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 08. SALVAR NOVO ORÇAMENTO                               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarNovoOrcamento */
/* Valida, calcula e salva um novo orçamento. */
/* --------------------------------------------------------- */

window.salvarNovoOrcamento =
async function () {

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

    let totalOriginal =
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

        totalOriginal =
            totalOriginal * 1.12;
    }

    /* ========================================================= */
    /* 08.1 DESCONTO EM VALOR                                   */
    /* ========================================================= */
    /*
        O desconto é informado diretamente em reais.

        O sistema preserva:
        - totalOriginal: valor após a regra de nota e antes do desconto
        - desconto: valor concedido ao cliente
        - total: valor final efetivamente cobrado
    */

    const desconto =
        obterDescontoOrcamento(
            totalOriginal
        );

    const total =
        Math.max(
            0,
            totalOriginal - desconto
        );

    const novoOrcamento = {

        codigo:
            obterProximoCodigoOrcamento(),

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

        imagens:
            JSON.parse(JSON.stringify(window._orcImagensEdicao || [])),

        totalOriginal,

        desconto,

        total
    };

    novoOrcamento.status =
        normalizarStatusOrcamento(
            novoOrcamento.status
        );

    db.orcamentos.push(
        novoOrcamento
    );

    db.ultimoOrcamento =
        novoOrcamento.codigo;

    await save();

    /*
        Se o orçamento já for salvo como Aprovado,
        a OS é criada automaticamente com status Aberta.
    */

    if (
        novoOrcamento.status ===
        'Aprovado'
    ) {

        await garantirOSDoOrcamentoAprovado(
            novoOrcamento
        );
    }

    closeModal();

    navigate(
        'orcamentos'
    );
};

/* ========================================================= */
/* 09. ADICIONAR PRODUTO / SERVIÇO                         */
/* ========================================================= */

/* --------------------------------------------------------- */
/* adicionarProdutoOrcamento */
/* Adiciona uma nova linha de item ao orçamento. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 10. AUTO RESIZE DOS CAMPOS DE TEXTO                     */
/* ========================================================= */

/* --------------------------------------------------------- */
/* autoResize */
/* Ajusta automaticamente a altura de campos de texto. */
/* --------------------------------------------------------- */

window.autoResize =
function (el) {

    if (!el) return;

    el.style.height =
        'auto';

    el.style.height =
        el.scrollHeight +
        'px';
};

/* ========================================================= */
/* 10.1 DESCONTO DO ORÇAMENTO                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* obterDescontoOrcamento */
/* Lê o desconto informado em reais e limita ao valor total. */
/* --------------------------------------------------------- */

window.obterDescontoOrcamento =
function (totalOriginal = Infinity) {

    const campo =
        document.getElementById(
            'orc-desconto'
        );

    if (!campo) {

        return 0;
    }

    /*
        Aceita tanto:
        300,00
        quanto:
        300.00

        Também remove R$, espaços e separadores de milhar.
    */

    let texto =
        String(
            campo.value || ''
        )
        .trim()
        .replace(/R\$/gi, '')
        .replace(/\s/g, '');

    if (
        texto.includes(',')
    ) {

        texto =
            texto
            .replace(/\./g, '')
            .replace(',', '.');
    }

    texto =
        texto.replace(
            /[^0-9.-]/g,
            ''
        );

    let desconto =
        Number(texto || 0);

    if (
        !Number.isFinite(desconto)
        ||
        desconto < 0
    ) {

        desconto = 0;
    }

    const limite =
        Number(totalOriginal);

    if (
        Number.isFinite(limite)
        &&
        desconto > limite
    ) {

        desconto = limite;
    }

    return desconto;
};

/* ========================================================= */
/* 11. CALCULAR TOTAL DO ORÇAMENTO                         */
/* ========================================================= */

/* --------------------------------------------------------- */
/* calcularTotalOrcamento */
/* Recalcula subtotal, regra de nota e total do orçamento. */
/* --------------------------------------------------------- */

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

    /*
        totalOriginal representa o valor comercial antes
        do desconto. A regra atual de nota continua sendo
        aplicada antes do desconto.
    */

    let totalOriginal =
        subtotal;

    if (
        temNota === 'nao'
    ) {

        totalOriginal =
            subtotal * 1.12;
    }

    const desconto =
        obterDescontoOrcamento(
            totalOriginal
        );

    const totalFinal =
        Math.max(
            0,
            totalOriginal - desconto
        );

    const campoTotalOriginal =
        document.getElementById(
            'orc-total-original'
        );

    if (campoTotalOriginal) {

        campoTotalOriginal.innerText =
            formatarMoeda(
                totalOriginal
            );
    }

    const campoTotalFinal =
        document.getElementById(
            'orc-total'
        );

    if (campoTotalFinal) {

        campoTotalFinal.innerText =
            formatarMoeda(
                totalFinal
            );
    }

    atualizarTextoImposto(
        subtotal,
        totalOriginal
    );
};

/* ========================================================= */
/* 12. TEXTO / REGRA VISUAL DE IMPOSTO                     */
/* ========================================================= */

/* --------------------------------------------------------- */
/* atualizarTextoImposto */
/* Atualiza o texto visual relacionado à regra de nota. */
/* --------------------------------------------------------- */

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

    campoObs.value =
        campoObs.value.replace(

            /\n*\s*Valor total do orçamento .*?acrescido do valor de imposto\./gs,

            ''
        ).trim();

    if (temNota !== 'nao') {

        return;
    }

    const texto =

`Valor total do orçamento ${formatarMoeda(subtotal)} acrescido do valor de imposto.`;

    if (campoObs.value.trim()) {

        campoObs.value +=
            '\n\n' + texto;

    }

    else {

        campoObs.value =
            texto;
    }
};
/* ========================================================= */
/* 13. VISUALIZAR ORÇAMENTO                                */
/* ========================================================= */

/* --------------------------------------------------------- */
/* visualizarOrcamento */
/* Abre o orçamento em modo de visualização. */
/* --------------------------------------------------------- */

window.visualizarOrcamento = async function(index){

    const o =
        db.orcamentos[index];

    window.orcamentoAtual = o;

    const logoPath =
        await window.api.getLogoPath();

/* ========================================================= */
/* 13.1 DADOS COMPLETOS DO CLIENTE                         */
/* ========================================================= */

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
src="${logoPath}"

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
font-size:14px;
">

<th style="
padding:10px;
border:3px solid #8b8b8b;
color:#fff;
">
Item
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
color:#fff;
">
Un.
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
color:#fff;
">
Descrição
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
color:#fff;
">
Qntd.
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
color:#fff;
">
R$ Unitário
</th>

<th style="
padding:10px;
border:3px solid #8b8b8b;
color:#fff;
">
R$ Total
</th>

</tr>

</thead>

<tbody>

${itensHTML}

</tbody>

</table>

${
Number(o.desconto || 0) > 0
?
`
<div style="
background:#fff;
border-left:3px solid #8b8b8b;
border-right:3px solid #8b8b8b;
padding:10px 20px;
text-align:right;
font-size:16px;
line-height:1.8;
">

<div>
<strong>VALOR TOTAL:</strong>
${formatarMoeda(
    o.totalOriginal !== undefined
    ? o.totalOriginal
    : Number(o.total || 0) + Number(o.desconto || 0)
)}
</div>

<div style="color:#b91c1c;">
<strong>DESCONTO CONCEDIDO:</strong>
- ${formatarMoeda(o.desconto || 0)}
</div>

</div>

<div style="
background:#8b8b8b;
color:#fff;
text-align:right;
padding:10px 20px;
font-size:30px;
font-weight:bold;
">

VALOR FINAL: ${formatarMoeda(o.total)}

</div>
`
:
`
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
`
}

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

${renderAnexoImagensOrcamento(o)}

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

PROPOSTA DE PRODUTOS E SERVIÇOS

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

${clienteCompleto.documento || '-'}

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

<br>

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

/* ========================================================= */
/* 14. IMPRESSÃO / PDF                                     */
/* ========================================================= */

/* --------------------------------------------------------- */
/* imprimirOrcamento */
/* Monta e envia o orçamento para impressão. */
/* --------------------------------------------------------- */

window.imprimirOrcamento =
async function(){

    const conteudo =

        document.getElementById(
            'print-orcamento'
        )?.innerHTML;

    if(!conteudo) return;

    const numeroOrcamento =
        window.orcamentoAtual?.codigo || '';

    const html = `

<html>

<head>

<title>
${numeroOrcamento} - Orçamento 
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
    break-before:page;

}

.orc-anexo-imagens{
    page-break-before:always;
    break-before:page;
}

.orc-anexo-card{
    break-inside:avoid;
    page-break-inside:avoid;
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
/* ========================================================= */
/* 15. EDITAR ORÇAMENTO                                    */
/* ========================================================= */

/* --------------------------------------------------------- */
/* editarOrcamento */
/* Abre um orçamento existente para edição. */
/* --------------------------------------------------------- */

window.editarOrcamento = function(index){

    const o =
        db.orcamentos[index];

    /* ===================================================== */
    /* CLIENTES DA EDIÇÃO EM ORDEM ALFABÉTICA               */
    /* ===================================================== */

    const clientes =
        ordenarClientesOrcamento(
            db.clientes || []
        );

    window._orcImagensEdicao = JSON.parse(JSON.stringify(o.imagens || []));

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

${blocoImagensOrcamentoFormulario()}

<!-- DESCONTO / TOTAIS -->

<div style="
margin-top:20px;
display:flex;
flex-direction:column;
align-items:flex-end;
gap:10px;
">

<div style="
font-size:18px;
font-weight:600;
">

Valor Total:

<span id="orc-total-original">

${formatarMoeda(
o.totalOriginal !== undefined
? o.totalOriginal
: Number(o.total || 0) + Number(o.desconto || 0)
)}

</span>

</div>

<div style="
display:flex;
align-items:center;
gap:10px;
">

<label
for="orc-desconto"
style="
margin:0;
font-weight:600;
">
Desconto (R$):
</label>

<input
id="orc-desconto"
type="text"
inputmode="decimal"
value="${Number(o.desconto || 0).toFixed(2).replace('.', ',')}"
placeholder="0,00"
oninput="calcularTotalOrcamento()"
style="
width:150px;
text-align:right;
">

</div>

<h2 style="
margin:0;
text-align:right;
">

Valor com Desconto:

<span id="orc-total">

${formatarMoeda(
o.total || 0
)}

</span>

</h2>

</div>
`
    });

    /* ========================================================= */
    /* 15.1 CARREGAR PRODUTOS NA EDIÇÃO                        */
    /* ========================================================= */

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

    /* ========================================================= */
    /* 16. AUTO RESIZE DOS CAMPOS NA EDIÇÃO                    */
    /* ========================================================= */

    document
        .querySelectorAll(
            '#orc-prazo,#orc-obs,.orc-prod'
        )
        .forEach(el=>{

            autoResize(el);

        });

    /* ========================================================= */
    /* 17. RECALCULAR EDIÇÃO                                   */
    /* ========================================================= */

    calcularTotalOrcamento();

};

/* ========================================================= */
/* 18. SALVAR EDIÇÃO DO ORÇAMENTO                          */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarEdicaoOrcamento */
/* Salva as alterações feitas em um orçamento existente. */
/* --------------------------------------------------------- */

window.salvarEdicaoOrcamento =
async function(index){

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

    let totalOriginal =
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

        totalOriginal =
            totalOriginal * 1.12;

    }

    /* ========================================================= */
    /* 18.1 DESCONTO EM VALOR                                   */
    /* ========================================================= */

    const desconto =
        obterDescontoOrcamento(
            totalOriginal
        );

    const total =
        Math.max(
            0,
            totalOriginal - desconto
        );

    const statusAnterior =
        normalizarStatusOrcamento(
            db.orcamentos[index]
                ?.status
        );

    const novoStatus =
        normalizarStatusOrcamento(
            document.getElementById(
                'orc-status'
            ).value
        );

    db.orcamentos[index] = {

        ...db.orcamentos[index],

        codigo:
            db.orcamentos[index]?.codigo,

        data:
            db.orcamentos[index]?.data,

        cliente:
            document.getElementById(
                'orc-cliente'
            ).value,

        ac:
            document.getElementById(
                'orc-ac'
            ).value,

        telefone:
            document.getElementById(
                'orc-telefone'
            ).value,

        email:
            document.getElementById(
                'orc-email'
            ).value,

        validade:
            document.getElementById(
                'orc-validade'
            ).value,

        prazo:
            document.getElementById(
                'orc-prazo'
            ).value,

        prazoEntrega:
            document.getElementById(
                'orc-entrega'
            ).value,

        temNota,

        status:
            novoStatus,

        preContrato:
            document.getElementById(
                'orc-precontrato'
            ).value,

        observacoes:
            document.getElementById(
                'orc-obs'
            ).value,

        itens,

        imagens:
            JSON.parse(JSON.stringify(window._orcImagensEdicao || [])),

        totalOriginal,

        desconto,

        total
    };

    await save();

    /*
        A OS é garantida sempre que o orçamento estiver Aprovado.
        Se já existir uma OS para o mesmo número de orçamento,
        nada é duplicado.
    */

    if (
        novoStatus ===
        'Aprovado'
    ) {

        await garantirOSDoOrcamentoAprovado(
            db.orcamentos[index]
        );
    }

    closeModal();

    navigate(
        'orcamentos'
    );

};

/* ========================================================= */
/* 19. INTEGRAÇÃO COM ASSISTENTE DE ORÇAMENTOS             */
/* ========================================================= */

/*
    A funcionalidade do botão
    "Criar com IA" será implementada
    posteriormente no arquivo:

    js/orcamentos-ia.js

    A função que esse arquivo deverá
    disponibilizar será:

    window.abrirAssistenteOrcamentoIA
*/

/* ========================================================= */
/* 20. CADASTRAR CLIENTE DURANTE O ORÇAMENTO               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirCadastroClienteOrcamento */
/* Abre o cadastro de cliente a partir do orçamento. */
/* --------------------------------------------------------- */

window.abrirCadastroClienteOrcamento = function(){

    window.voltarParaOrcamento = true;

    abrirNovoCliente();

};

/* ========================================================= */
/* 21. DUPLICAR ORÇAMENTO                                  */
/* ========================================================= */

/* --------------------------------------------------------- */
/* duplicarOrcamento */
/* Cria uma nova cópia de um orçamento existente. */
/* --------------------------------------------------------- */

window.duplicarOrcamento =
function(index){

    const original =
        db.orcamentos[index];

    if(!original){

        alert(
            'Orçamento não encontrado'
        );

        return;

    }

    const novoCodigo =
        obterProximoCodigoOrcamento();

    const novoOrcamento = {

        codigo:
            novoCodigo,

        data:
            new Date()
            .toISOString()
            .split('T')[0],

        cliente:
            original.cliente,

        ac:
            original.ac || '',

        telefone:
            original.telefone || '',

        email:
            original.email || '',

        validade:
            original.validade || '',

        prazo:
            original.prazo || '',

        prazoEntrega:
            original.prazoEntrega || '',

        temNota:
            original.temNota || 'sim',

        status:
            'Aguardando',

        preContrato:
            original.preContrato || 'nao',

        observacoes:
            original.observacoes || '',

        itens:
            JSON.parse(
                JSON.stringify(
                    original.itens || []
                )
            ),

        imagens:
            JSON.parse(
                JSON.stringify(
                    original.imagens || []
                )
            ),

        totalOriginal:
            original.totalOriginal !== undefined
            ? original.totalOriginal
            : Number(original.total || 0) + Number(original.desconto || 0),

        desconto:
            Number(original.desconto || 0),

        total:
            original.total || 0

    };

    db.orcamentos.push(
        novoOrcamento
    );

    db.ultimoOrcamento =
        novoCodigo;

    save();

    alert(
        `Orçamento duplicado com sucesso!\nNovo código: ${novoCodigo}`
    );

    navigate(
        'orcamentos'
    );

};

/* ========================================================= */
/* 22. REGISTRAR PÁGINA NO SISTEMA                         */
/* ========================================================= */

registerPage(
    'orcamentos',
    renderOrcamentos
);