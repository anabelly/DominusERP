
/* DOMINUS: exibe Nome Fantasia; usa Razão Social quando vazio.
   Mantém os valores originais gravados para preservar vínculos. */
function nomeExibicaoClienteDominus(registroOuNome) {
    const clientes = Array.isArray(window.db?.clientes) ? window.db.clientes : [];
    const texto = v => String(v ?? '').trim();
    const nome = typeof registroOuNome === 'object' && registroOuNome !== null
        ? '' : texto(registroOuNome);
    const registro = nome ? clientes.find(c =>
        [c.nome, c.nomeFantasia, c.razaoSocial, c.codigo]
            .some(v => texto(v).toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))
    ) : registroOuNome;
    return texto(registro?.nomeFantasia) || texto(registro?.razaoSocial) ||
           texto(registro?.nome) || nome;
}
/* ========================================================= */
/* DOMINUS ERP - FINANCEIRO.JS                               */
/* ========================================================= */
/*
    FLUXO FINANCEIRO - CONTAS A PAGAR E A RECEBER

    Este arquivo controla toda a tela de Fluxo Financeiro
    do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Renderizar contas a pagar e a receber por semana
    2. Controlar navegação entre semanas
    3. Exibir status Pendente / Vencido / Pago / Recebido
    4. Cadastrar contas a pagar
    5. Cadastrar contas a receber
    6. Trabalhar com recorrências de contas a pagar
    7. Dar baixa em pagamentos e recebimentos
    8. Editar e excluir lançamentos
    9. Consultar e filtrar lançamentos
    10. Operar baixa/edição/exclusão dentro da consulta
    11. Salvar alterações no banco
    12. Exibir clientes e fornecedores em ordem alfabética
    13. Registrar a página "financeiro" no sistema

    IMPORTANTE:
    A única alteração funcional adicional desta versão é a
    organização alfabética dos clientes e fornecedores nos
    campos de seleção.

    Nenhum código, ID, lançamento, valor, recorrência, filtro
    ou status foi alterado.
*/


/* --------------------------------------------------------- */
/* ordenarClientesFinanceiro                                 */
/* Retorna uma cópia em ordem alfabética pelo nome.          */
/* --------------------------------------------------------- */
/*
    ORDEM ALFABÉTICA - CLIENTES DO FINANCEIRO

    A ordenação é somente visual.

    IMPORTANTE:
    - o array original do banco NÃO é reordenado;
    - códigos, IDs e vínculos permanecem intactos;
    - a comparação usa pt-BR;
    - diferenças de acentuação e maiúsculas/minúsculas não
      atrapalham a ordem apresentada nos campos de seleção.
*/

function ordenarClientesFinanceiro(
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
/* ordenarFornecedoresFinanceiro                             */
/* Retorna uma cópia em ordem alfabética pelo nome.          */
/* --------------------------------------------------------- */
/*
    ORDEM ALFABÉTICA - FORNECEDORES DO FINANCEIRO

    A ordenação é somente visual.

    IMPORTANTE:
    - o array original do banco NÃO é reordenado;
    - códigos, IDs e vínculos permanecem intactos;
    - a comparação usa pt-BR;
    - diferenças de acentuação e maiúsculas/minúsculas não
      atrapalham a ordem apresentada nos campos de seleção.
*/

function ordenarFornecedoresFinanceiro(
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


/* ========================================================= */
/* 01. RENDERIZAÇÃO DO FLUXO FINANCEIRO                     */
/* ========================================================= */
/*
    renderFinanceiro()

    Monta a tela principal com as contas a pagar e receber
    da semana selecionada.
*/

/* --------------------------------------------------------- */
/* renderFinanceiro */
/* Renderiza o fluxo financeiro semanal. */
/* --------------------------------------------------------- */

/* ========================================================= */
/* FORMAS DE LIQUIDAÇÃO E TIPOS DE CONTA                      */
/* ========================================================= */
const FORMAS_FINANCEIRO = ['Dinheiro', 'Pix', 'Boleto', 'Cartão'];
const TIPOS_CONTA_FINANCEIRO_PADRAO = [
    'Advogado','Água e Saneamento','Alarme/Segurança','Aluguel',
    'Bonificação/Gratificação','Cartão','Comissão','Contabilidade',
    'Despesa Veículos','Energia Elétrica','Internet/Telefone','IPTU',
    'IPVA/Licenciamento','Limpeza/Manutenção','Marketing/Anúncios',
    'Matéria Prima/Estoque','Multa Veículos','Outros','Plano de Saúde',
    'Pró-Labore','Salários','Seguros','Simples Nacional/Impostos','Software/ERP'
];
function escaparFin(v) {
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
       .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function garantirTiposContaFinanceiro() {
    window.db = window.db || {};
    if (!Array.isArray(db.tiposContaFinanceiro)) {
        const existentes = Array.isArray(db.financeiro)
            ? db.financeiro.map(x => x.tipoConta).filter(Boolean) : [];
        db.tiposContaFinanceiro = [...TIPOS_CONTA_FINANCEIRO_PADRAO, ...existentes];
    }
    const vistos = new Set();
    db.tiposContaFinanceiro = db.tiposContaFinanceiro.map(x => String(x || '').trim())
      .filter(x => {const k=x.toLocaleLowerCase('pt-BR');
          if (!k || vistos.has(k)) return false;
          vistos.add(k); return true;})
      .sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
    return db.tiposContaFinanceiro;
}
function formaFinanceiro(lanc) { return lanc?.formaPagamento || lanc?.formaRecebimento || ''; }
function ehCompraCartaoFinanceiro(lanc) {
    return lanc?.tipo === 'Pagar' && formaFinanceiro(lanc) === 'Cartão' &&
        String(lanc?.tipoConta || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase() !== 'cartao';
}
/* A fatura do cartão, cadastrada no tipo de conta Cartão, continua contabilizada. */
window.ehCompraCartaoFinanceiro = ehCompraCartaoFinanceiro;
window.contabilizarPagarFinanceiro = lanc => lanc?.tipo === 'Pagar' && !ehCompraCartaoFinanceiro(lanc);
function abreviarFormaFinanceiro(lanc) {
    return ({Dinheiro:'Din',Pix:'Pix',Boleto:'Bol','Cartão':'Car'})[formaFinanceiro(lanc)] || '-';
}
function selectFormaFinanceiro(id, atual='', obrigatorio=false) {
    return `<label>Forma de pagamento / recebimento${obrigatorio?' *':''}</label>
      <select id="${id}"><option value="">Selecione</option>
      ${FORMAS_FINANCEIRO.map(x=>`<option value="${x}" ${x===atual?'selected':''}>${x}</option>`).join('')}
      </select>`;
}
function selectTipoContaFinanceiro(id, atual='', todos=false) {
    const tipos=[...garantirTiposContaFinanceiro()];
    if(atual && !tipos.includes(atual)) tipos.push(atual);
    const options = todos ? '<option value="">Todos</option>' : '';
    return `<select id="${id}">${options}${tipos.map(t=>`<option value="${escaparFin(t)}" ${t===atual?'selected':''}>${escaparFin(t)}</option>`).join('')}</select>`;
}
window.abrirTiposContaFinanceiro = function() {
    const lista = garantirTiposContaFinanceiro();
    configModal({title:'Tipos de Conta',size:'large',confirmText:'Fechar',
      body:`<div style="display:flex;gap:8px;margin-bottom:16px;align-items:end;flex-wrap:wrap">
        <div style="flex:1;min-width:180px"><label>Novo tipo de conta</label>
        <input id="novo-tipo-conta-fin" placeholder="Digite o tipo de conta"></div>
        <button type="button" class="btn-action" onclick="cadastrarTipoContaFinanceiro()">+ Cadastrar</button></div>
        <div style="max-height:360px;overflow:auto"><table style="width:100%"><thead><tr><th>Tipo de conta</th><th>Ação</th></tr></thead><tbody>
        ${lista.map((t,i)=>`<tr><td>${escaparFin(t)}</td><td><button type="button" class="btn-action" style="padding:6px 12px" onclick="editarTipoContaFinanceiro(${i})">✏ Editar</button></td></tr>`).join('')}
        </tbody></table></div>`,onConfirm(){closeModal();}});
};
window.cadastrarTipoContaFinanceiro = async function() {
    const campo=document.getElementById('novo-tipo-conta-fin');
    const nome=campo?.value.trim(); if(!nome){alert('Informe o tipo de conta.');return;}
    const lista=garantirTiposContaFinanceiro();
    if(lista.some(x=>x.toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR'))){alert('Esse tipo já existe.');return;}
    lista.push(nome); garantirTiposContaFinanceiro(); await save(); abrirTiposContaFinanceiro();
};
window.editarTipoContaFinanceiro = async function(index) {
    const lista=garantirTiposContaFinanceiro(); const antigo=lista[index]; if(!antigo)return;
    const novo=prompt('Editar tipo de conta:',antigo)?.trim(); if(!novo||novo===antigo)return;
    if(lista.some(x=>x!==antigo&&x.toLocaleLowerCase('pt-BR')===novo.toLocaleLowerCase('pt-BR'))){alert('Esse tipo já existe.');return;}
    /* Atualiza vínculos existentes, sem modificar os valores dos lançamentos. */
    (db.financeiro||[]).forEach(x=>{if(x.tipoConta===antigo)x.tipoConta=novo;});
    lista[index]=novo; garantirTiposContaFinanceiro(); await save(); abrirTiposContaFinanceiro();
};

window.renderFinanceiro = function () {

    if (!db.financeiro) {
        db.financeiro = [];
    }

   if (window.financeiroSemanaOffsetPagar === undefined) {
    window.financeiroSemanaOffsetPagar = 0;
}

if (window.financeiroSemanaOffsetReceber === undefined) {
    window.financeiroSemanaOffsetReceber = 0;
}
    /* ===================================================== */
    /* 01.2 GERAR PERÍODO DA SEMANA                       */
    /* ===================================================== */

function gerarPeriodoSemana(offset){

    const hoje =
        new Date();

    hoje.setHours(
        0,0,0,0
    );

    const diaSemana =
        hoje.getDay();

    const diffSegunda =

        diaSemana === 0

        ?

        -6

        :

        1 - diaSemana;

    const inicioSemana =
        new Date(hoje);

    inicioSemana.setDate(

        hoje.getDate()

        +

        diffSegunda

        +

        (offset * 7)

    );

    inicioSemana.setHours(
        0,0,0,0
    );

    /* SEGUNDA SEGUINTE */

    const fimSemana =
        new Date(
            inicioSemana
        );

    fimSemana.setDate(

        inicioSemana.getDate()

        +

        7

    );

    fimSemana.setHours(
        0,0,0,0
    );

    return {

        inicio:

            inicioSemana
            .toISOString()
            .split('T')[0],

        fim:

            fimSemana
            .toISOString()
            .split('T')[0]
    };
}

const periodoPagar =
    gerarPeriodoSemana(
        window.financeiroSemanaOffsetPagar
    );

const periodoReceber =
    gerarPeriodoSemana(
        window.financeiroSemanaOffsetReceber
    );

    /* ===================================================== */
    /* 01.3 CONTAS A PAGAR DA SEMANA                      */
    /* ===================================================== */

    const contasPagar =

    db.financeiro

    .filter(l=>{

        if(

            l.tipo !== 'Pagar'

        ){

            return false;

        }

        return (

            l.vencimento >=
            periodoPagar.inicio

            &&

            l.vencimento <=
            periodoPagar.fim

        );

    })

    .sort((a,b)=>

        new Date(
            a.vencimento
        )

        -

        new Date(
            b.vencimento
        )

    );

    /* ===================================================== */
    /* 01.4 CONTAS A RECEBER DA SEMANA                    */
    /* ===================================================== */

    const contasReceber =

    db.financeiro

    .filter(l=>{

        if(

            l.tipo !== 'Receber'

        ){

            return false;

        }

        return (

            l.vencimento >=
            periodoReceber.inicio

            &&

            l.vencimento <=
            periodoReceber.fim

        );

    })

    .sort((a,b)=>

        new Date(
            a.vencimento
        )

        -

        new Date(
            b.vencimento
        )

    );

    let html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:25px;
">

    <!-- 01.5 CABEÇALHO E AÇÕES DO FINANCEIRO -->

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
                💰 Fluxo Financeiro
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Controle de contas a pagar e receber
            </div>

        </div>

        <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        ">

            <button class="btn-action" style="background:#64748b" onclick="abrirTiposContaFinanceiro()">⚙ Tipos de Conta</button>

            <button
                class="btn-action"
                onclick="abrirConsultaFinanceiro()">

                🔍 Consultar

            </button>

            <button
                class="btn-action"
                style="background:#2563eb;"
                onclick="abrirContaPagar()">

                💸 Contas a Pagar

            </button>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirContaReceber()">

                💰 Contas a Receber

            </button>

        </div>

    </div>

    ${renderTabelaFinanceiro(
        'Contas a Pagar',
        contasPagar,
        'Pagar'
    )}

    ${renderTabelaFinanceiro(
        'Contas a Receber',
        contasReceber,
        'Receber'
    )}

</div>
`;

    return html;
};

/* ========================================================= */
/* 02. TABELA FINANCEIRA                                    */
/* ========================================================= */
/*
    renderTabelaFinanceiro()

    Exibe lançamentos, status, ações e navegação semanal.
*/

/* --------------------------------------------------------- */
/* renderTabelaFinanceiro */
/* Monta a tabela e as ações de cada lançamento. */
/* --------------------------------------------------------- */

window.renderTabelaFinanceiro = function (
    titulo,
    dados,
    tipo
) {

    let html = `

<div class="content-card">

    <div style="
        font-size:18px;
        font-weight:700;
        margin-bottom:20px;
    ">
        ${titulo}
    </div>

    <div style="
        overflow:auto;
    ">

        <table style="
            width:100%;
            border-collapse:collapse;
        ">

            <thead>

                <tr>

                    <th>Data</th>
                    <th>Descrição</th>
                    <th>
                        ${tipo === 'Pagar'
                            ? 'Fornecedor'
                            : 'Cliente'}
                    </th>
                    <th>Valor</th>
                    <th>
                        ${tipo === 'Pagar'
                            ? 'Pagamento'
                            : 'Recebimento'}
                    </th>
                    <th>Forma</th>
                    <th>Status</th>
                    <th>Ação</th>

                </tr>

            </thead>

            <tbody>
`;

    if (dados.length === 0) {

        html += `

<tr>

    <td colspan="8" style="
        text-align:center;
        padding:30px;
        color:#6b7280;
    ">

        Nenhum lançamento encontrado

    </td>

</tr>
`;
    }

    dados.forEach((lanc, idx) => {

        const indexReal =
            db.financeiro.indexOf(lanc);

        /* ================================================= */
        /* 02.1 STATUS VISUAL DO LANÇAMENTO                 */
        /* ================================================= */

        let status =
            lanc.status || 'Pendente';

        if (
            status === 'Pendente' &&
            lanc.vencimento <
            new Date().toISOString().split('T')[0]
        ) {

            status = 'Vencido';
        }

        let corStatus =
            '#fef3c7';

        let corTexto =
            '#92400e';

        if (
            status === 'Pago' ||
            status === 'Recebido'
        ) {

            corStatus = '#dcfce7';

            corTexto = '#166534';
        }

        if (status === 'Vencido') {

            corStatus = '#fee2e2';

            corTexto = '#991b1b';
        }

        html += `

<tr>

    <td>
        ${formatarData(lanc.vencimento)}
    </td>

    <td>
        ${lanc.descricao || '-'}
    </td>

    <td>
        ${(lanc.tipo === 'Receber' || lanc.tipoFluxo === 'Receber') ? (nomeExibicaoClienteDominus(lanc.nome) || '-') : (lanc.nome || '-')}
    </td>

    <td>
        ${formatarMoeda(lanc.valor || 0)}
    </td>

    <td>
        ${
            lanc.dataPagamento
                ? formatarData(lanc.dataPagamento)
                : '-'
        }
    </td>

    <td title="${escaparFin(formaFinanceiro(lanc) || 'Não informada')}">${abreviarFormaFinanceiro(lanc)}</td>

    <td>

        <div style="
            background:${corStatus};
            color:${corTexto};
            padding:7px 12px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
            width:max-content;
        ">

            ${status}

        </div>

    </td>

    <td>

        <div style="
            display:flex;
            gap:6px;
            align-items:center;
            flex-wrap:nowrap;
            justify-content:flex-start;
            width:238px;
            min-width:238px;
        ">

            ${
    status === 'Pendente' ||
    status === 'Vencido'
    ? `
        <button
            class="btn-action"
            style="
                background:#16a34a;
                padding:6px 10px;
                font-size:12px;
                white-space:nowrap;
                width:105px;
                min-width:105px;
                height:32px;
background:#dcfce7 !important;color:#15803d !important;border:1px solid #bbf7d0 !important;box-shadow:none !important;"
            onclick="darBaixaFinanceiro(${indexReal})">

            ✔ ${tipo}

        </button>
    `
    : `
        <button
            class="btn-action"
            style="
                background:#16a34a;
                padding:6px 10px;
                font-size:12px;
                white-space:nowrap;
                width:105px;
                min-width:105px;
                height:32px;
background:#dcfce7 !important;color:#15803d !important;border:1px solid #bbf7d0 !important;box-shadow:none !important;"
            onclick="desfazerBaixaFinanceiro(${indexReal})"
            title="Desfazer ${status}"
        >
            ↩ ${status}
        </button>
    `
}

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 8px;
                    font-size:12px;
                    white-space:nowrap;
                    width:69px;
                    min-width:69px;
                    height:32px;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                onclick="editarLancamento(${indexReal})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 8px;
                    font-size:12px;
                    white-space:nowrap;
                    width:58px;
                    min-width:58px;
                    height:32px;
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
                onclick="excluirLancamento(${indexReal})">

                Excluir

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

    <div
        id="financeiro-nav-${tipo}"
        style="
            display:flex;
            justify-content:center;
            gap:10px;
            margin-top:20px;
        "
    >

    <button
        class="btn-action"
        onclick="alterarSemanaFinanceiro('${tipo}', -1)">

        ← Semana Anterior

    </button>

    <button
        class="btn-action"
        onclick="alterarSemanaFinanceiro('${tipo}', 1)">

        Próxima Semana →

    </button>

</div>

</div>
`;

    return html;
};

/* ========================================================= */
/* 03. NAVEGAÇÃO ENTRE SEMANAS                              */
/* ========================================================= */
/*
    Mantém offsets independentes para Pagar e Receber.
*/

/* --------------------------------------------------------- */
/* alterarSemanaFinanceiro */
/* Avança ou retrocede a semana do tipo selecionado. */
/* --------------------------------------------------------- */

window.alterarSemanaFinanceiro = function (
    tipo,
    direcao
) {

    /*
        Guarda a posição vertical do navegador semanal antes
        de renderizar novamente a tela.

        Assim, mesmo que a nova semana tenha mais ou menos
        lançamentos, os botões permanecem visualmente na mesma
        altura e podem ser clicados novamente sem nova rolagem.
    */

    const idNavegacao =
        `financeiro-nav-${tipo}`;

    const navegacaoAntes =
        document.getElementById(
            idNavegacao
        );

    const topoAntes =
        navegacaoAntes
            ? navegacaoAntes
                .getBoundingClientRect()
                .top
            : null;


    if (tipo === 'Pagar') {

        window.financeiroSemanaOffsetPagar +=
            direcao;

    } else {

        window.financeiroSemanaOffsetReceber +=
            direcao;
    }


    navigate(
        'financeiro',
        false
    );


    /*
        Aguarda a nova tabela ser colocada na tela e compensa
        somente a diferença de posição do navegador semanal.
    */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            if (topoAntes === null) {
                return;
            }

            const navegacaoDepois =
                document.getElementById(
                    idNavegacao
                );

            if (!navegacaoDepois) {
                return;
            }

            const topoDepois =
                navegacaoDepois
                    .getBoundingClientRect()
                    .top;

            const diferenca =
                topoDepois -
                topoAntes;

            if (
                Math.abs(diferenca) <
                1
            ) {
                return;
            }

            /*
                Primeiro tenta ajustar o elemento que realmente
                está rolando. Isso funciona tanto com a página
                inteira quanto com um container interno do ERP.
            */

            let elemento =
                navegacaoDepois.parentElement;

            let containerRolagem =
                null;

            while (
                elemento &&
                elemento !==
                    document.body
            ) {

                const estilo =
                    window.getComputedStyle(
                        elemento
                    );

                const overflowY =
                    estilo.overflowY;

                if (
                    (
                        overflowY === 'auto'
                        ||
                        overflowY === 'scroll'
                    )
                    &&
                    elemento.scrollHeight >
                    elemento.clientHeight
                ) {

                    containerRolagem =
                        elemento;

                    break;
                }

                elemento =
                    elemento.parentElement;
            }


            if (containerRolagem) {

                containerRolagem.scrollTop +=
                    diferenca;

            } else {

                window.scrollBy(
                    0,
                    diferenca
                );
            }
        });
    });
};

/* ========================================================= */
/* 04. NOVA CONTA A PAGAR                                   */
/* ========================================================= */
/*
    Formulário de despesa com fornecedor, tipo de conta,
    vencimento e recorrência.
*/

/* --------------------------------------------------------- */
/* abrirContaPagar */
/* Abre o cadastro de nova conta a pagar. */
/* --------------------------------------------------------- */

window.abrirContaPagar = function (
    dados = {}
) {

    /* ===================================================== */
    /* 04.1 TIPOS DE CONTA DISPONÍVEIS                    */
    /* ===================================================== */

    const tiposConta = garantirTiposContaFinanceiro();

    const html = `

<div style="
    display:grid;
    grid-template-columns:
        repeat(auto-fit,minmax(220px,1fr));
    gap:15px;
">

    <div>

        <label>Valor</label>

        <input
            type="number"
            step="0.01"
            id="fin-valor"
            value="${dados.valor || ''}">

    </div>

    <div>

        <label>Fornecedor</label>

        <select id="fin-fornecedor">

            <option value="">
                Selecione
            </option>

            ${ordenarFornecedoresFinanceiro(
                db.fornecedores
            ).map(f => `

                <option
                    value="${f.nome}">

                    ${f.nome}

                </option>

            `).join('')}

        </select>

    </div>

    <div>

        <label>Descrição</label>

        <input
            id="fin-desc"
            value="${dados.descricao || ''}">

    </div>

    <div>

        <label>Vencimento</label>

        <input
            type="date"
            id="fin-vencimento">

    </div>

    <div>

        <label>Tipo de Conta</label>

        <select id="fin-tipo-conta">

            ${tiposConta.map(t => `
                <option value="${escaparFin(t)}" ${dados.tipoConta===t?'selected':''}>${escaparFin(t)}</option>
            `).join('')}

        </select>

    </div>

    <div>

        ${selectFormaFinanceiro('fin-forma', dados.formaPagamento || '', false)}
    </div>

    <div>
        <label>Recorrência</label>

        <select
            id="fin-recorrencia"
            onchange="toggleRecorrenciaFinanceiro()">

            <option value="Unica">
                Única
            </option>

            <option value="Semanal">
                Semanal
            </option>

            <option value="Quinzenal">
                Quinzenal
            </option>

            <option value="Mensal">
                Mensal
            </option>

        </select>

    </div>
<div
    id="box-dia-semana"
    style="display:none;">

    <label>Dia da Semana</label>

    <select id="fin-dia-semana">

        <option value="1">
            Segunda-feira
        </option>

        <option value="2">
            Terça-feira
        </option>

        <option value="3">
            Quarta-feira
        </option>

        <option value="4">
            Quinta-feira
        </option>

        <option value="5">
            Sexta-feira
        </option>

        <option value="6">
            Sábado
        </option>

        <option value="0">
            Domingo
        </option>

    </select>

</div>
    <div
        id="box-quantidade-recorrencia"
        style="display:none;">

        <label>Quantidade</label>

        <input
            type="number"
            id="fin-quantidade"
            value="1">

    </div>

</div>
`;

    configModal({

        title: 'Nova Conta a Pagar',

        body: html,

        size: 'large',

        confirmText: 'Salvar',

        onConfirm() {

            salvarContaPagar();
        }
    });
};

/* ========================================================= */
/* 05. DAR BAIXA EM LANÇAMENTO                              */
/* ========================================================= */
/*
    Registra a data real e altera o status para Pago
    ou Recebido.
*/

/* --------------------------------------------------------- */
/* darBaixaFinanceiro */
/* Registra pagamento ou recebimento. */
/* --------------------------------------------------------- */

window.darBaixaFinanceiro = async function(idx){

    const lanc =
        db.financeiro[idx];

    if (!lanc) return;

    const titulo =
        lanc.tipo === 'Receber'
            ? 'Receber Conta'
            : 'Pagar Conta';

    const labelData =
        lanc.tipo === 'Receber'
            ? 'Data do Recebimento'
            : 'Data do Pagamento';

    const hoje =
        new Date()
            .toISOString()
            .split('T')[0];

    const html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:15px;
">

    <div>

        <label>
            ${labelData}
        </label>

        <input
            type="date"
            id="fin-data-baixa"
            value="${hoje}">

    </div>

    <div>${selectFormaFinanceiro('fin-forma-baixa',formaFinanceiro(lanc),true)}</div>

    <div style="
        background:#f3f4f6;
        padding:15px;
        border-radius:12px;
        line-height:1.6;
    ">

        <div>
            <strong>Descrição:</strong>
            ${lanc.descricao || '-'}
        </div>

        <div>
            <strong>Valor:</strong>
            ${formatarMoeda(lanc.valor || 0)}
        </div>

    </div>

</div>
`;

    configModal({

        title: titulo,

        body: html,

        size: 'small',

        confirmText:
            lanc.tipo === 'Receber'
                ? 'Receber'
                : 'Pagar',

            onConfirm: async function(){

            const forma=document.getElementById('fin-forma-baixa')?.value;
            if (!forma) { alert('Selecione a forma de pagamento ou recebimento.'); return; }
            if (lanc.tipo === 'Pagar') lanc.formaPagamento=forma;
            else lanc.formaRecebimento=forma;
            lanc.status =
                lanc.tipo === 'Receber'
                    ? 'Recebido'
                    : 'Pago';

            lanc.dataPagamento =
                document.getElementById(
                    'fin-data-baixa'
                ).value;

           await save();

closeModal();

navigate('financeiro', false);
        }
    });
};


/* --------------------------------------------------------- */
/* desfazerBaixaFinanceiro                                   */
/* Volta um lançamento Pago/Recebido para Pendente.          */
/* --------------------------------------------------------- */

window.desfazerBaixaFinanceiro =
async function(idx){

    const lanc =
        db.financeiro[idx];

    if (!lanc) {
        return;
    }

    if (
        lanc.status !== 'Pago'
        &&
        lanc.status !== 'Recebido'
    ) {
        return;
    }

    const acao =
        lanc.tipo === 'Receber'
            ? 'recebimento'
            : 'pagamento';

    const confirmar =
        confirm(
            `Deseja desfazer o ${acao} deste lançamento?`
        );

    if (!confirmar) {
        return;
    }

    lanc.status =
        'Pendente';

    lanc.dataPagamento =
        null;

    await save();

    navigate(
        'financeiro',
        false
    );
};
/* ========================================================= */
/* 06. EXCLUIR LANÇAMENTO                                   */
/* ========================================================= */

/* --------------------------------------------------------- */
/* excluirLancamento */
/* Exclui um lançamento após confirmação. */
/* --------------------------------------------------------- */

window.excluirLancamento = async function(idx){

    const confirmar =
        confirm(
            'Deseja excluir este lançamento?'
        );

    if (!confirmar) return;

    db.financeiro.splice(idx, 1);

   await save();

navigate('financeiro', false);
};

/* ========================================================= */
/* 07. EDITAR LANÇAMENTO                                    */
/* ========================================================= */
/*
    Usa fornecedor para Pagar e cliente para Receber.
*/

/* --------------------------------------------------------- */
/* editarLancamento */
/* Abre a edição do lançamento. */
/* --------------------------------------------------------- */

window.editarLancamento = function(idx){

    const lanc = db.financeiro[idx];

    if(!lanc) return;


    let pessoaHTML = '';

    if(lanc.tipo === 'Pagar'){

        pessoaHTML = `

        <label>Fornecedor</label>

        <select id="fin-pessoa">

            <option value="">
                Selecione
            </option>

            ${
            ordenarFornecedoresFinanceiro(
                db.fornecedores
            ).map(f=>`

                <option 
                value="${f.nome}"
                ${f.nome === lanc.nome ? 'selected':''}>
                    ${f.nome}
                </option>

            `).join('')
            }

        </select>

        `;

    }

    else{

        pessoaHTML = `

        <label>Cliente</label>

        <select id="fin-pessoa">

            <option value="">
                Selecione
            </option>

            ${
            ordenarClientesFinanceiro(
                db.clientes
            ).map(c=>`

                <option 
                value="${c.nome}"
                ${c.nome === lanc.nome ? 'selected':''}>
                    ${nomeExibicaoClienteDominus(c)}
                </option>

            `).join('')
            }

        </select>

        `;

    }


    const html = `


<div style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:15px;
">


<div>

<label>Valor</label>

<input 
id="fin-valor"
type="number"
step="0.01"
value="${lanc.valor || ''}">

</div>


<div>

${pessoaHTML}

</div>


<div>

<label>Descrição</label>

<input 
id="fin-desc"
value="${lanc.descricao || ''}">

</div>


<div>

<label>Data</label>

<input 
type="date"
id="fin-vencimento"
value="${lanc.vencimento || ''}">

</div>
<div>${selectFormaFinanceiro('fin-forma-editar',formaFinanceiro(lanc),false)}</div>
${lanc.tipo==='Pagar' ? `<div><label>Tipo de Conta</label>${selectTipoContaFinanceiro('fin-tipo-conta-editar',lanc.tipoConta)}</div>` : ''}



</div>


`;



configModal({

title:'Editar Lançamento',

body:html,

size:'medium',

confirmText:'Salvar',

onConfirm: async function(){


    lanc.valor =
    Number(
        document.getElementById('fin-valor').value
    );


    lanc.nome =
    document.getElementById('fin-pessoa').value;


    lanc.descricao =
    document.getElementById('fin-desc').value;


    lanc.vencimento =
    document.getElementById('fin-vencimento').value;



    const formaEditada=document.getElementById('fin-forma-editar')?.value || '';
    if(lanc.tipo==='Pagar'){
        lanc.formaPagamento=formaEditada;
        lanc.tipoConta=document.getElementById('fin-tipo-conta-editar')?.value||lanc.tipoConta;
    } else { lanc.formaRecebimento=formaEditada; }
    await save();


    closeModal();


    navigate(
        'financeiro',
        false
    );


}


});


};
/* ========================================================= */
/* 08. SALVAR CONTA A PAGAR                                 */
/* ========================================================= */
/*
    Cria uma ou várias contas conforme a recorrência.
*/

/* --------------------------------------------------------- */
/* salvarContaPagar */
/* Salva contas a pagar e suas recorrências. */
/* --------------------------------------------------------- */

window.salvarContaPagar = async function () {

    const valor =
        Number(document.getElementById('fin-valor').value);

    const nome =
        document.getElementById('fin-fornecedor').value;

    const descricao =
        document.getElementById('fin-desc').value;

    const vencimento =
        document.getElementById('fin-vencimento').value;

    const tipoConta =
        document.getElementById('fin-tipo-conta').value;

    const formaPagamento = document.getElementById('fin-forma')?.value || '';

    const recorrencia =
        document.getElementById('fin-recorrencia').value;

    const quantidade =
        parseInt(document.getElementById('fin-quantidade')?.value || 1);

    const diaSemana =
        parseInt(document.getElementById('fin-dia-semana')?.value || 1);

    if (!valor || !vencimento) {
        alert('Preencha os campos obrigatórios.');
        return;
    }

    const dataBase = new Date(vencimento + 'T00:00:00');

    /* ===================================================== */
    /* 08.1 RECORRÊNCIA ÚNICA                                */
    /* ===================================================== */
    if (recorrencia === 'Unica') {
        db.financeiro.push({
            tipo: 'Pagar',
            valor,
            nome,
            descricao,
            vencimento,
            tipoConta,
            formaPagamento,
            status: 'Pendente'
        });
    }

    /* ===================================================== */
    /* 08.2 RECORRÊNCIA SEMANAL                             */
    /* ===================================================== */
    if (recorrencia === 'Semanal') {

        /* Ajusta a primeira data para o dia da semana escolhido. */
        let primeiraData = new Date(dataBase);
        while (primeiraData.getDay() !== diaSemana) {
            primeiraData.setDate(primeiraData.getDate() + 1);
        }

        for (let i = 0; i < quantidade; i++) {
            const data = new Date(primeiraData);
            data.setDate(primeiraData.getDate() + i * 7);

            db.financeiro.push({
                tipo: 'Pagar',
                valor,
                nome,
                descricao,
                vencimento: data.toISOString().split('T')[0],
                tipoConta,
            formaPagamento,
                status: 'Pendente'
            });
        }
    }

    /* ===================================================== */
    /* 08.3 RECORRÊNCIA QUINZENAL                           */
    /* ===================================================== */
    if (recorrencia === 'Quinzenal') {
        for (let i = 0; i < quantidade; i++) {
            const data = new Date(dataBase);
            data.setDate(dataBase.getDate() + i * 15);

            db.financeiro.push({
                tipo: 'Pagar',
                valor,
                nome,
                descricao,
                vencimento: data.toISOString().split('T')[0],
                tipoConta,
            formaPagamento,
                status: 'Pendente'
            });
        }
    }

    /* ===================================================== */
    /* 08.4 RECORRÊNCIA MENSAL                              */
    /* ===================================================== */
    if (recorrencia === 'Mensal') {
        for (let i = 0; i < quantidade; i++) {
            const data = new Date(dataBase);
            data.setMonth(dataBase.getMonth() + i);

            db.financeiro.push({
                tipo: 'Pagar',
                valor,
                nome,
                descricao,
                vencimento: data.toISOString().split('T')[0],
                tipoConta,
            formaPagamento,
                status: 'Pendente'
            });
        }
    }

   await save();

closeModal();

navigate('financeiro', false);
};

/* ========================================================= */
/* 09. NOVA CONTA A RECEBER                               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirContaReceber */
/* Abre o cadastro de nova conta a receber. */
/* --------------------------------------------------------- */

window.abrirContaReceber = function (
    dados = {}
) {

    const html = `

<div style="
    display:grid;
    grid-template-columns:
        repeat(auto-fit,minmax(220px,1fr));
    gap:15px;
">

    <div>

        <label>Valor</label>

        <input
            type="number"
            step="0.01"
            id="fin-valor"
            value="${dados.valor || ''}">

    </div>

    <div>

        <label>Cliente</label>

        <select id="fin-cliente">

            <option value="">
                Selecione
            </option>

            ${ordenarClientesFinanceiro(
                db.clientes
            ).map(c => `

                <option
                    value="${c.nome}"
                    ${dados.nome === c.nome ? 'selected' : ''}>

                    ${nomeExibicaoClienteDominus(c)}

                </option>

            `).join('')}

        </select>

    </div>

    <div>

        <label>Descrição</label>

        <input
            id="fin-desc"
            value="${dados.descricao || ''}">

    </div>

    <div>

        <label>Recebimento</label>

        <input
            type="date"
            id="fin-vencimento"
            value="${dados.vencimento || ''}">

    </div>
    <div>${selectFormaFinanceiro('fin-forma',dados.formaRecebimento||'',false)}</div>

</div>
`;

    configModal({

        title: 'Nova Conta a Receber',

        body: html,

        size: 'medium',

        confirmText: 'Salvar',

        onConfirm() {

            salvarContaReceber();
        }
    });
};

/* ========================================================= */
/* 10. SALVAR CONTA A RECEBER                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarContaReceber */
/* Salva uma nova conta a receber. */
/* --------------------------------------------------------- */

window.salvarContaReceber = async function () {

    const lancamento = {

        tipo: 'Receber',

        valor:
            Number(
                document.getElementById('fin-valor').value
            ),

        nome:
            document.getElementById('fin-cliente').value,

        descricao:
            document.getElementById('fin-desc').value,

        vencimento:
            document.getElementById('fin-vencimento').value,

        status: 'Pendente',

        formaRecebimento: document.getElementById('fin-forma')?.value || '',
        dataPagamento: null
    };
    if(
!lancamento.valor ||
!lancamento.vencimento
){

alert(
'Preencha os campos obrigatórios.'
);

return;

}

    db.financeiro.push(
        lancamento
    );
await save();

closeModal();

navigate('financeiro', false);
};

/* ========================================================= */
/* 11. CAMPOS DE RECORRÊNCIA                              */
/* ========================================================= */
/*
    Mostra quantidade e, no modo semanal, dia da semana.
*/

/* --------------------------------------------------------- */
/* toggleRecorrenciaFinanceiro */
/* Controla campos extras da recorrência. */
/* --------------------------------------------------------- */

window.toggleRecorrenciaFinanceiro = function () {

    const recorrencia =
        document.getElementById(
            'fin-recorrencia'
        ).value;

    const boxQtd =
        document.getElementById(
            'box-quantidade-recorrencia'
        );

    const boxDia =
        document.getElementById(
            'box-dia-semana'
        );

    if (recorrencia === 'Unica') {

        boxQtd.style.display =
            'none';

        boxDia.style.display =
            'none';

    } else {

        boxQtd.style.display =
            'block';

        if (recorrencia === 'Semanal') {

            boxDia.style.display =
                'block';

        } else {

            boxDia.style.display =
                'none';
        }
    }
};
/* ========================================================= */
/* 12. CONSULTA FINANCEIRA EM MODAL                         */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirConsultaFinanceiro */
/* Abre a consulta financeira em modal. */
/* --------------------------------------------------------- */

window.abrirConsultaFinanceiro = function () {

    /* Guarda os resultados da última consulta. */
    window.dadosConsultaFinanceiro = [];

    const html = `
<div style="
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:15px;
">

    <div>
        <label>Tipo</label>
        <select id="consulta-tipo" onchange="toggleConsultaFinanceiro()">
            <option value="Pagar">Contas a Pagar</option>
            <option value="Receber">Contas a Receber</option>
        </select>
    </div>

    <div>
        <label>Data Inicial</label>
        <input type="date" id="consulta-inicio">
    </div>

    <div>
        <label>Data Final</label>
        <input type="date" id="consulta-fim">
    </div>

    <div id="consulta-tipo-conta-box"><label>Tipo de Conta</label>${selectTipoContaFinanceiro('consulta-tipo-conta','',true)}</div>

    <div id="consulta-pessoa-box">
        <label>Fornecedor</label>
        <select id="consulta-pessoa">
            <option value="">Todos</option>
            ${ordenarFornecedoresFinanceiro(
                db.fornecedores
            ).map(f => `
                <option value="${f.nome}">${f.nome}</option>
            `).join('')}
        </select>
    </div>

</div>

<div id="consulta-resultado" style="margin-top:25px;"></div>
`;

    configModal({
        title: 'Consultar Financeiro',
        body: html,
        size: 'large',
        confirmText: 'Consultar',
        onConfirm() {
            consultarFinanceiro(); /* Atualiza a tabela dentro da modal. */
        }
    });
};

/* ========================================================= */
/* 13. ALTERNAR FORNECEDOR / CLIENTE                        */
/* ========================================================= */
/* --------------------------------------------------------- */
/* toggleConsultaFinanceiro */
/* Alterna fornecedor e cliente na consulta. */
/* --------------------------------------------------------- */

window.toggleConsultaFinanceiro = function () {
    const tipo = document.getElementById('consulta-tipo').value;
    const box = document.getElementById('consulta-pessoa-box');
    const caixaTipoConta=document.getElementById('consulta-tipo-conta-box');
    if(caixaTipoConta) caixaTipoConta.style.display=tipo==='Pagar'?'':'none';

    if (tipo === 'Pagar') {
        box.innerHTML = `
<label>Fornecedor</label>
<select id="consulta-pessoa">
    <option value="">Todos</option>
    ${ordenarFornecedoresFinanceiro(
        db.fornecedores
    ).map(f => `<option value="${f.nome}">${f.nome}</option>`).join('')}
</select>`;
    } else {
        box.innerHTML = `
<label>Cliente</label>
<select id="consulta-pessoa">
    <option value="">Todos</option>
    ${ordenarClientesFinanceiro(
        db.clientes
    ).map(c => `<option value="${c.nome}">${nomeExibicaoClienteDominus(c)}</option>`).join('')}
</select>`;
    }
};

/* ========================================================= */
/* 14. FILTRAR CONSULTA FINANCEIRA                          */
/* ========================================================= */
/* --------------------------------------------------------- */
/* consultarFinanceiro */
/* Filtra os lançamentos da consulta. */
/* --------------------------------------------------------- */

window.consultarFinanceiro = function () {

    const tipo = document.getElementById('consulta-tipo').value;
    const inicio = document.getElementById('consulta-inicio').value;
    const fim = document.getElementById('consulta-fim').value;
    const pessoa = document.getElementById('consulta-pessoa').value;
    const tipoContaBusca=tipo==='Pagar' ? (document.getElementById('consulta-tipo-conta')?.value||'') : '';

    /* Filtra os resultados conforme os campos da consulta. */
    window.dadosConsultaFinanceiro = db.financeiro.filter(l => {
        if (l.tipo !== tipo) return false;
        if (inicio && l.vencimento < inicio) return false;
        if (fim && l.vencimento > fim) return false;
        if (pessoa && l.nome !== pessoa) return false;
        if (tipoContaBusca && l.tipoConta !== tipoContaBusca) return false;
        return true;
    });

    renderTabelaConsultaFinanceiro(); /* Renderiza a tabela. */
};

/* ========================================================= */
/* 15. RENDERIZAR RESULTADOS DA CONSULTA                    */
/* ========================================================= */
/* --------------------------------------------------------- */
/* renderTabelaConsultaFinanceiro */
/* Renderiza resultados sem fechar a modal. */
/* --------------------------------------------------------- */

window.renderTabelaConsultaFinanceiro = function() {

    const tipo = document.getElementById('consulta-tipo').value;
    const resultados = window.dadosConsultaFinanceiro;

    let html = `
<div style="overflow:auto; border:1px solid #e5e7eb; border-radius:14px;">
<table style="width:100%; border-collapse:collapse;">
<thead>
<tr>
    <th>Vencimento</th>
    <th>Descrição</th>
    <th>${tipo === 'Pagar' ? 'Fornecedor' : 'Cliente'}</th>
    <th>Valor</th>
    <th>Forma</th>
    <th>Status</th>
    <th>Ações</th>
</tr>
</thead>
<tbody>
`;

    if (resultados.length === 0) {
        html += `<tr><td colspan="7" style="padding:30px; text-align:center; color:#6b7280;">Nenhum lançamento encontrado</td></tr>`;
    } else {
        resultados.forEach((l, idx) => {
            const status = l.status || 'Pendente';
            html += `
<tr>
    <td>${formatarDataBR(l.vencimento)}</td>
    <td>${l.descricao || '-'}</td>
    <td>${(l.tipo === 'Receber' || l.tipoFluxo === 'Receber') ? (nomeExibicaoClienteDominus(l.nome) || '-') : (l.nome || '-')}</td>
    <td>${formatarMoeda(l.valor || 0)}</td>
    <td title="${escaparFin(formaFinanceiro(l)||'Não informada')}">${abreviarFormaFinanceiro(l)}</td>
    <td>${status}</td>
    <td>
        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:nowrap;">
            <button class="btn-action" style="background:#16a34a; padding:6px 10px; font-size:12px;background:#dcfce7 !important;color:#15803d !important;border:1px solid #bbf7d0 !important;box-shadow:none !important;" onclick="darBaixaFinanceiroConsulta(${idx})">✔</button>
            <button class="btn-action" style="background:#2563eb; padding:6px 10px; font-size:12px;background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;" onclick="editarLancamentoConsulta(${idx})">✏</button>
            <button class="btn-del" style="padding:6px 10px; font-size:12px;background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;" onclick="excluirLancamentoConsulta(${idx})">X</button>
        </div>
    </td>
</tr>`;
        });
    }

    html += `</tbody></table></div>`;

    document.getElementById('consulta-resultado').innerHTML = html;
};


   
/* ========================================================= */
/* 16. EXCLUIR PELA CONSULTA                                */
/* ========================================================= */

/* --------------------------------------------------------- */
/* excluirLancamentoConsulta */
/* Exclui um item da consulta. */
/* --------------------------------------------------------- */

window.excluirLancamentoConsulta = async function(idx){

    const confirmar =
    confirm(
        'Deseja excluir este lançamento?'
    );


    if(!confirmar)
        return;



    const lanc =
    window.dadosConsultaFinanceiro[idx];


    if(!lanc)
        return;



    const indexReal =
    db.financeiro.indexOf(lanc);



    if(indexReal >= 0){

        db.financeiro.splice(
            indexReal,
            1
        );

    }



    await save();


    consultarFinanceiro();


};
/* ========================================================= */
/* 17. DAR BAIXA PELA CONSULTA                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* darBaixaFinanceiroConsulta */
/* Dá baixa em um item da consulta. */
/* --------------------------------------------------------- */

window.darBaixaFinanceiroConsulta =
function(idx){


const lanc =
window.dadosConsultaFinanceiro[idx];


if(!lanc)
return;



const hoje =
new Date()
.toISOString()
.split('T')[0];



const html = `


<label>

${
lanc.tipo === 'Pagar'
?
'Data do Pagamento'
:
'Data do Recebimento'
}

</label>


<input 
type="date"
id="consulta-data-baixa"
value="${hoje}">
<div style="margin-top:14px">${selectFormaFinanceiro('consulta-forma-baixa',formaFinanceiro(lanc),true)}</div>


`;



configModal({

title:
lanc.tipo === 'Pagar'
?
'Pagar Conta'
:
'Receber Conta',


body:html,


size:'small',


confirmText:'Confirmar',


onConfirm: async function(){



const forma=document.getElementById('consulta-forma-baixa')?.value;
if(!forma){alert('Selecione a forma de pagamento ou recebimento.');return;}
if(lanc.tipo==='Pagar') lanc.formaPagamento=forma;
else lanc.formaRecebimento=forma;
lanc.dataPagamento =
document.getElementById(
'consulta-data-baixa'
).value;



lanc.status =
lanc.tipo === 'Pagar'
?
'Pago'
:
'Recebido';



await save();



closeModal();



abrirConsultaFinanceiro();



}


});


};
/* ========================================================= */
/* 18. EDITAR PELA CONSULTA                                 */
/* ========================================================= */

/* --------------------------------------------------------- */
/* editarLancamentoConsulta */
/* Encaminha um item filtrado para edição. */
/* --------------------------------------------------------- */

window.editarLancamentoConsulta =
function(idx){


const lanc =
window.dadosConsultaFinanceiro[idx];


if(!lanc)
return;



const indexReal =
db.financeiro.indexOf(lanc);



if(indexReal < 0)
return;



editarLancamento(indexReal);


};
/* ========================================================= */
/* 19. REGISTRAR PÁGINA NO SISTEMA                          */
/* ========================================================= */

registerPage(
    'financeiro',
    renderFinanceiro
);  