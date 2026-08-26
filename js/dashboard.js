/* ========================================================= */
/* DOMINUS ERP - DASHBOARD.JS                                */
/* ========================================================= */
/*
    DASHBOARD / VISÃO GERAL DO NEGÓCIO

    Dashboard ampliado com visão financeira, comercial e
    operacional, mantendo o gráfico mensal.
*/

registerPage('dash', function () {

    /* ===================================================== */
    /* 01. DADOS BASE                                       */
    /* ===================================================== */

    const financeiro = Array.isArray(db.financeiro) ? db.financeiro : [];
    const orcamentos = Array.isArray(db.orcamentos) ? db.orcamentos : [];
    const ordensServico = Array.isArray(db.ordensServico) ? db.ordensServico : [];
    const produtos = Array.isArray(db.produtos) ? db.produtos : [];
    const clientes = Array.isArray(db.clientes) ? db.clientes : [];
    const funcionarios = Array.isArray(db.funcionarios) ? db.funcionarios : [];

    /* ===================================================== */
    /* 02. HELPERS                                          */
    /* ===================================================== */

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const hojeISO = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, '0'),
        String(hoje.getDate()).padStart(2, '0')
    ].join('-');

    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    function numeroDashboard(valor) {
        const n = Number(valor);
        return Number.isFinite(n) ? n : 0;
    }

    function normalizarDashboard(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function escaparDashboard(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function dataDashboard(valor) {
        if (!valor) return null;

        if (String(valor).includes('/')) {
            if (typeof normalizarData === 'function') {
                const d = normalizarData(valor);
                if (d && !Number.isNaN(d.getTime())) return d;
            }
            return null;
        }

        const d = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function pertenceMesAtual(valor) {
        const d = dataDashboard(valor);

        return !!(
            d &&
            d.getFullYear() === anoAtual &&
            d.getMonth() === mesAtual
        );
    }

    function formatarDataDashboard(valor) {
        if (!valor) return '-';

        if (typeof formatarDataBR === 'function') {
            return formatarDataBR(String(valor).slice(0, 10));
        }

        const d = dataDashboard(valor);
        return d ? d.toLocaleDateString('pt-BR') : '-';
    }

    function formatarMoedaDashboard(valor) {
        if (typeof formatarMoeda === 'function') {
            return formatarMoeda(numeroDashboard(valor));
        }

        return numeroDashboard(valor).toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );
    }

    function ehReceber(lancamento) {
        return (
            lancamento?.tipo === 'Receber'
            ||
            lancamento?.tipoFluxo === 'receber'
        );
    }

    function ehPagar(lancamento) {
        return (
            lancamento?.tipo === 'Pagar'
            ||
            lancamento?.tipoFluxo === 'pagar'
        );
    }

    function estaRecebido(lancamento) {
        return normalizarDashboard(lancamento?.status) === 'recebido';
    }

    function estaPago(lancamento) {
        return normalizarDashboard(lancamento?.status) === 'pago';
    }

    function statusOrcamentoAprovado(status) {
        return [
            'aprovado',
            'em producao',
            'finalizado'
        ].includes(normalizarDashboard(status));
    }

    /* ===================================================== */
    /* 03. FINANCEIRO                                       */
    /* ===================================================== */

    const contasReceber = financeiro.filter(ehReceber);
    const contasPagar = financeiro.filter(ehPagar);

    /*
        Os três indicadores principais do Dashboard consideram
        somente contas EM ABERTO com vencimento no MÊS ATUAL.

        O mês é obtido automaticamente pela data do computador.
        Portanto, quando virar o mês, o Dashboard passa a usar
        o novo mês automaticamente ao ser renderizado.
    */

    const receberEmAberto = contasReceber.filter(
        lancamento =>
            !estaRecebido(lancamento)
            &&
            pertenceMesAtual(lancamento.vencimento)
    );

    const pagarEmAberto = contasPagar.filter(
        lancamento =>
            !estaPago(lancamento)
            &&
            pertenceMesAtual(lancamento.vencimento)
    );

    const totalReceberAberto = receberEmAberto.reduce(
        (total, lancamento) =>
            total + numeroDashboard(lancamento.valor),
        0
    );

    const totalPagarAberto = pagarEmAberto.reduce(
        (total, lancamento) =>
            total + numeroDashboard(lancamento.valor),
        0
    );

    const saldoProjetado =
        totalReceberAberto -
        totalPagarAberto;

    const recebidoMes = contasReceber
        .filter(
            lancamento =>
                estaRecebido(lancamento) &&
                pertenceMesAtual(lancamento.dataPagamento)
        )
        .reduce(
            (total, lancamento) =>
                total + numeroDashboard(lancamento.valor),
            0
        );

    const pagoMes = contasPagar
        .filter(
            lancamento =>
                estaPago(lancamento) &&
                pertenceMesAtual(lancamento.dataPagamento)
        )
        .reduce(
            (total, lancamento) =>
                total + numeroDashboard(lancamento.valor),
            0
        );

    const saldoRealizadoMes =
        recebidoMes -
        pagoMes;

    /* ===================================================== */
    /* 04. ORÇAMENTOS                                       */
    /* ===================================================== */

    const orcamentosMes = orcamentos.filter(
        orcamento =>
            pertenceMesAtual(orcamento.data)
    );

    const totalOrcamentosMes = orcamentosMes.reduce(
        (total, orcamento) =>
            total + numeroDashboard(orcamento.total),
        0
    );

    const orcamentosAprovadosMes = orcamentosMes.filter(
        orcamento =>
            statusOrcamentoAprovado(orcamento.status)
    );

    const taxaAprovacao =
        orcamentosMes.length > 0
            ? (
                orcamentosAprovadosMes.length /
                orcamentosMes.length
            ) * 100
            : 0;

    const orcamentosAguardando = orcamentos.filter(
        orcamento =>
            normalizarDashboard(orcamento.status) === 'aguardando'
    ).length;

    /* ===================================================== */
    /* 05. ORDENS DE SERVIÇO                                */
    /* ===================================================== */

    const osAbertas = ordensServico.filter(
        os =>
            normalizarDashboard(os.status) === 'aberta'
    ).length;

    const osEmProducao = ordensServico.filter(
        os =>
            normalizarDashboard(os.status) === 'em producao'
    ).length;

    const osAtrasadas = ordensServico.filter(
        os =>
            os.dataEntrega &&
            os.dataEntrega < hojeISO &&
            ![
                'entregue',
                'cancelada'
            ].includes(
                normalizarDashboard(os.status)
            )
    ).length;

    /* ===================================================== */
    /* 06. ESTOQUE / CLIENTES / FUNCIONÁRIOS                */
    /* ===================================================== */

    const valorEstoque = produtos.reduce(
        (total, produto) =>
            total +
            (
                numeroDashboard(produto.quantidade)
                *
                numeroDashboard(produto.valor)
            ),
        0
    );

    const funcionariosAtivos = funcionarios.filter(
        funcionario =>
            normalizarDashboard(funcionario.status) === 'ativo'
    ).length;

    /* ===================================================== */
    /* 07. GRÁFICO MENSAL                                   */
    /* ===================================================== */

    const meses = [
        'JAN','FEV','MAR','ABR','MAI','JUN',
        'JUL','AGO','SET','OUT','NOV','DEZ'
    ];

    const vendasMensais = Array(12).fill(0);

    contasReceber.forEach(lancamento => {

        const data =
            lancamento.dataPagamento
            ||
            lancamento.vencimento;

        const d =
            dataDashboard(data);

        if (
            !d ||
            d.getFullYear() !== anoAtual
        ) {
            return;
        }

        vendasMensais[d.getMonth()] +=
            numeroDashboard(lancamento.valor);
    });

    const maiorVenda =
        Math.max(
            ...vendasMensais,
            1
        );

    /* ===================================================== */
    /* 08. PRÓXIMOS VENCIMENTOS                             */
    /* ===================================================== */

    const proximosVencimentos = [
        ...receberEmAberto.map(
            lancamento => ({
                ...lancamento,
                tipoDashboard: 'Receber'
            })
        ),
        ...pagarEmAberto.map(
            lancamento => ({
                ...lancamento,
                tipoDashboard: 'Pagar'
            })
        )
    ]
    .filter(
        lancamento =>
            lancamento.vencimento
    )
    .sort(
        (a, b) =>
            String(a.vencimento)
            .localeCompare(
                String(b.vencimento)
            )
    )
    .slice(0, 6);

    /* ===================================================== */
    /* 09. ÚLTIMOS ORÇAMENTOS                               */
    /* ===================================================== */

    const ultimosOrcamentos = [...orcamentos]
        .sort((a, b) => {

            const dataA =
                String(a.data || '');

            const dataB =
                String(b.data || '');

            if (dataA !== dataB) {
                return dataB.localeCompare(dataA);
            }

            return (
                numeroDashboard(b.codigo)
                -
                numeroDashboard(a.codigo)
            );
        })
        .slice(0, 5);

    const textoData =
        hoje.toLocaleDateString(
            'pt-BR',
            {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );

    /* ===================================================== */
    /* 10. HTML                                             */
    /* ===================================================== */

    return `

<style>

.dash-page{
    display:flex;
    flex-direction:column;
    gap:20px;
}

.dash-header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:20px;
    flex-wrap:wrap;
}

.dash-title{
    font-size:30px;
    font-weight:800;
    color:#111827;
    margin:0;
}

.dash-subtitle{
    color:#6b7280;
    margin-top:5px;
    font-size:14px;
}

.dash-grid-main{
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:14px;
}

.dash-kpi{
    background:#fff;
    border:1px solid #e5e7eb;
    border-radius:16px;
    padding:17px;
    box-shadow:0 5px 16px rgba(15,23,42,.04);
    min-height:130px;
    position:relative;
    overflow:hidden;
}

.dash-kpi::before{
    content:'';
    position:absolute;
    left:0;
    top:0;
    bottom:0;
    width:4px;
    background:var(--dash-accent,#64748b);
}

.dash-kpi-icon{
    width:38px;
    height:38px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:11px;
    background:#f8fafc;
    font-size:18px;
}

.dash-kpi-label{
    margin-top:13px;
    color:#64748b;
    font-size:11px;
    font-weight:800;
    letter-spacing:.04em;
    text-transform:uppercase;
}

.dash-kpi-value{
    margin-top:5px;
    font-size:23px;
    line-height:1.15;
    font-weight:850;
    color:#111827;
}

.dash-kpi-note{
    margin-top:7px;
    color:#94a3b8;
    font-size:11px;
    line-height:1.4;
}

.dash-section-grid{
    display:grid;
    grid-template-columns:minmax(0,1.65fr) minmax(320px,.85fr);
    gap:18px;
    align-items:start;
}

.dash-card{
    background:#fff;
    border:1px solid #e5e7eb;
    border-radius:16px;
    box-shadow:0 5px 16px rgba(15,23,42,.04);
    overflow:hidden;
}

.dash-card-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    padding:17px 18px;
    border-bottom:1px solid #f1f5f9;
}

.dash-card-title{
    font-size:16px;
    font-weight:800;
    color:#111827;
}

.dash-card-subtitle{
    margin-top:3px;
    font-size:11px;
    color:#94a3b8;
}

.dash-mini-grid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px;
    padding:16px;
}

.dash-mini{
    padding:14px;
    border:1px solid #eef2f7;
    border-radius:13px;
    background:#fafafa;
}

.dash-mini-label{
    color:#64748b;
    font-size:11px;
    font-weight:700;
}

.dash-mini-value{
    margin-top:5px;
    font-size:18px;
    font-weight:850;
    color:#111827;
}

.dash-mini-note{
    margin-top:4px;
    font-size:10px;
    color:#94a3b8;
}

.dash-chart-wrap{
    padding:18px;
}

.dash-chart{
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:8px;
    height:285px;
    padding:22px 10px 8px;
    background:linear-gradient(180deg,#fff,#fafafa);
    border:1px solid #eef2f7;
    border-radius:14px;
}

.dash-chart-col{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:flex-end;
    flex:1;
    min-width:0;
    height:100%;
}

.dash-chart-bar{
    width:100%;
    max-width:40px;
    border-radius:9px 9px 3px 3px;
    background:linear-gradient(180deg,#22c55e,#15803d);
    box-shadow:0 5px 12px rgba(22,163,74,.16);
    cursor:pointer;
    transition:.2s;
    min-height:8px;
}

.dash-chart-bar:hover{
    transform:translateY(-3px);
    filter:brightness(1.04);
}

.dash-chart-month{
    margin-top:9px;
    font-size:10px;
    font-weight:800;
    color:#64748b;
}


.dash-card-link{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    border:none;
    border-radius:10px;
    padding:9px 13px;
    font-size:11px;
    font-weight:800;
    cursor:pointer;
    white-space:nowrap;
    transition:
        transform .18s ease,
        box-shadow .18s ease,
        filter .18s ease;
    color:#fff;
}

.dash-card-link:hover{
    transform:translateY(-2px);
    filter:brightness(1.04);
}

.dash-card-link:active{
    transform:translateY(0);
}

.dash-card-link-financeiro{
    background:linear-gradient(
        135deg,
        #2563eb,
        #1d4ed8
    );
    box-shadow:
        0 5px 14px
        rgba(37,99,235,.22);
}

.dash-card-link-orcamentos{
    background:linear-gradient(
        135deg,
        #7c3aed,
        #6d28d9
    );
    box-shadow:
        0 5px 14px
        rgba(124,58,237,.22);
}

.dash-card-link-icon{
    font-size:12px;
    line-height:1;
}

.dash-table-wrap{
    overflow:auto;
}

.dash-table{
    width:100%;
    border-collapse:collapse;
}

.dash-table th{
    font-size:10px;
    text-transform:uppercase;
    letter-spacing:.04em;
    color:#94a3b8;
    font-weight:800;
    padding:11px 14px;
    background:#fafafa;
    text-align:left;
    white-space:nowrap;
}

.dash-table td{
    padding:12px 14px;
    border-top:1px solid #f1f5f9;
    font-size:12px;
    color:#374151;
    vertical-align:middle;
}

.dash-badge{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding:5px 9px;
    border-radius:999px;
    font-size:10px;
    font-weight:800;
    white-space:nowrap;
}

.dash-empty{
    padding:30px 18px;
    text-align:center;
    color:#94a3b8;
    font-size:12px;
}

.dash-footer{
    text-align:center;
    color:#9ca3af;
    font-size:10px;
    padding:8px 0 2px;
}

@media(max-width:1200px){

    .dash-grid-main{
        grid-template-columns:repeat(2,minmax(0,1fr));
    }

    .dash-section-grid{
        grid-template-columns:1fr;
    }
}

@media(max-width:700px){

    .dash-grid-main{
        grid-template-columns:1fr;
    }

    .dash-mini-grid{
        grid-template-columns:1fr;
    }

    .dash-chart{
        overflow-x:auto;
        justify-content:flex-start;
    }

    .dash-chart-col{
        flex:0 0 44px;
    }
}

</style>


<div class="dash-page">

    <!-- CABEÇALHO -->

    <div class="dash-header">

        <div>

            <h1 class="dash-title">
                Visão Geral do Negócio
            </h1>

            <div class="dash-subtitle">
                ${escaparDashboard(
                    textoData.charAt(0).toUpperCase() +
                    textoData.slice(1)
                )}
            </div>

        </div>

    </div>


    <!-- KPIs PRINCIPAIS -->

    <div class="dash-grid-main">

        <div class="dash-kpi" style="--dash-accent:#16a34a;">

            <div class="dash-kpi-icon">
                💰
            </div>

            <div class="dash-kpi-label">
                A receber em aberto no mês
            </div>

            <div class="dash-kpi-value">
                ${formatarMoedaDashboard(totalReceberAberto)}
            </div>

            <div class="dash-kpi-note">
                ${receberEmAberto.length}
                lançamento(s) pendente(s) no mês atual
            </div>

        </div>


        <div class="dash-kpi" style="--dash-accent:#ef4444;">

            <div class="dash-kpi-icon">
                💸
            </div>

            <div class="dash-kpi-label">
                A pagar em aberto no mês
            </div>

            <div class="dash-kpi-value">
                ${formatarMoedaDashboard(totalPagarAberto)}
            </div>

            <div class="dash-kpi-note">
                ${pagarEmAberto.length}
                lançamento(s) pendente(s) no mês atual
            </div>

        </div>


        <div
            class="dash-kpi"
            style="
                --dash-accent:${
                    saldoProjetado >= 0
                        ? '#2563eb'
                        : '#dc2626'
                };
            ">

            <div class="dash-kpi-icon">
                📊
            </div>

            <div class="dash-kpi-label">
                Saldo projetado do mês
            </div>

            <div class="dash-kpi-value">
                ${formatarMoedaDashboard(saldoProjetado)}
            </div>

            <div class="dash-kpi-note">
                A receber no mês menos a pagar no mês
            </div>

        </div>


    </div>


    <!-- MOVIMENTO DO MÊS + COMERCIAL -->

    <div class="dash-section-grid">

        <div class="dash-card">

            <div class="dash-card-header">

                <div>

                    <div class="dash-card-title">
                        Movimento do mês
                    </div>

                    <div class="dash-card-subtitle">
                        Valores efetivamente pagos e recebidos
                    </div>

                </div>

            </div>


            <div class="dash-mini-grid">

                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Recebido no mês
                    </div>

                    <div
                        class="dash-mini-value"
                        style="color:#15803d;">

                        ${formatarMoedaDashboard(recebidoMes)}

                    </div>

                    <div class="dash-mini-note">
                        Contas marcadas como Recebido
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Pago no mês
                    </div>

                    <div
                        class="dash-mini-value"
                        style="color:#dc2626;">

                        ${formatarMoedaDashboard(pagoMes)}

                    </div>

                    <div class="dash-mini-note">
                        Contas marcadas como Pago
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Saldo realizado
                    </div>

                    <div
                        class="dash-mini-value"
                        style="
                            color:${
                                saldoRealizadoMes >= 0
                                    ? '#2563eb'
                                    : '#dc2626'
                            };
                        ">

                        ${formatarMoedaDashboard(saldoRealizadoMes)}

                    </div>

                    <div class="dash-mini-note">
                        Recebido menos pago no mês
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Orçamentos do mês
                    </div>

                    <div class="dash-mini-value">
                        ${orcamentosMes.length}
                    </div>

                    <div class="dash-mini-note">
                        ${formatarMoedaDashboard(totalOrcamentosMes)}
                        em propostas
                    </div>

                </div>

            </div>

        </div>


        <div class="dash-card">

            <div class="dash-card-header">

                <div>

                    <div class="dash-card-title">
                        Comercial
                    </div>

                    <div class="dash-card-subtitle">
                        Resumo dos orçamentos
                    </div>

                </div>

            </div>


            <div class="dash-mini-grid">

                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Taxa de aprovação
                    </div>

                    <div
                        class="dash-mini-value"
                        style="color:#16a34a;">

                        ${taxaAprovacao.toFixed(1)}%

                    </div>

                    <div class="dash-mini-note">
                        ${orcamentosAprovadosMes.length}
                        de
                        ${orcamentosMes.length}
                        no mês
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Aguardando retorno
                    </div>

                    <div
                        class="dash-mini-value"
                        style="color:#f59e0b;">

                        ${orcamentosAguardando}

                    </div>

                    <div class="dash-mini-note">
                        Orçamentos ainda em análise
                    </div>

                </div>

            </div>

        </div>

    </div>


    <!-- GRÁFICO + OPERAÇÃO -->

    <div class="dash-section-grid">

        <div class="dash-card">

            <div class="dash-card-header">

                <div>

                    <div class="dash-card-title">
                        Desempenho de Vendas
                    </div>

                    <div class="dash-card-subtitle">
                        Valores de contas a receber por mês • ${anoAtual}
                    </div>

                </div>

            </div>


            <div class="dash-chart-wrap">

                <div class="dash-chart">

                    ${vendasMensais.map(
                        (valor, i) => {

                            const altura =
                                valor > 0
                                    ? Math.max(
                                        12,
                                        (
                                            valor /
                                            maiorVenda
                                        ) * 195
                                    )
                                    : 8;

                            return `

                                <div class="dash-chart-col">

                                    <div
                                        class="dash-chart-bar"
                                        title="${escaparDashboard(
                                            formatarMoedaDashboard(valor)
                                        )}"
                                        style="
                                            height:${altura}px;
                                            opacity:${
                                                valor > 0
                                                    ? 1
                                                    : .22
                                            };
                                        ">
                                    </div>

                                    <div class="dash-chart-month">
                                        ${meses[i]}
                                    </div>

                                </div>

                            `;
                        }
                    ).join('')}

                </div>

            </div>

        </div>


        <div class="dash-card">

            <div class="dash-card-header">

                <div>

                    <div class="dash-card-title">
                        Operação
                    </div>

                    <div class="dash-card-subtitle">
                        Produção, estoque e equipe
                    </div>

                </div>

            </div>


            <div class="dash-mini-grid">

                <div class="dash-mini">

                    <div class="dash-mini-label">
                        OS abertas
                    </div>

                    <div class="dash-mini-value">
                        ${osAbertas}
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Em produção
                    </div>

                    <div
                        class="dash-mini-value"
                        style="color:#2563eb;">

                        ${osEmProducao}

                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        OS atrasadas
                    </div>

                    <div
                        class="dash-mini-value"
                        style="
                            color:${
                                osAtrasadas > 0
                                    ? '#dc2626'
                                    : '#16a34a'
                            };
                        ">

                        ${osAtrasadas}

                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Estoque estimado
                    </div>

                    <div class="dash-mini-value">
                        ${formatarMoedaDashboard(valorEstoque)}
                    </div>

                    <div class="dash-mini-note">
                        ${produtos.length}
                        produto(s)
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Clientes
                    </div>

                    <div class="dash-mini-value">
                        ${clientes.length}
                    </div>

                </div>


                <div class="dash-mini">

                    <div class="dash-mini-label">
                        Funcionários ativos
                    </div>

                    <div class="dash-mini-value">
                        ${funcionariosAtivos}
                    </div>

                </div>

            </div>

        </div>

    </div>


    <!-- VENCIMENTOS + ÚLTIMOS ORÇAMENTOS -->

    <div class="dash-section-grid">

        <div class="dash-card">

            <div class="dash-card-header">

                <div>

                    <div class="dash-card-title">
                        Próximos vencimentos
                    </div>

                    <div class="dash-card-subtitle">
                        Pendências financeiras mais próximas
                    </div>

                </div>

                <button
                    class="
                        dash-card-link
                        dash-card-link-financeiro
                    "
                    onclick="navigate('financeiro')">

                    <span class="dash-card-link-icon">
                        💰
                    </span>

                    Ver financeiro

                    <span class="dash-card-link-icon">
                        →
                    </span>

                </button>

            </div>


            ${
                proximosVencimentos.length
                    ? `

                        <div class="dash-table-wrap">

                            <table class="dash-table">

                                <thead>

                                    <tr>
                                        <th>Vencimento</th>
                                        <th>Descrição</th>
                                        <th>Tipo</th>
                                        <th>Valor</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    ${proximosVencimentos.map(
                                        lancamento => {

                                            const vencido =
                                                lancamento.vencimento <
                                                hojeISO;

                                            const entrada =
                                                lancamento.tipoDashboard ===
                                                'Receber';

                                            return `

                                                <tr>

                                                    <td>

                                                        <strong
                                                            style="
                                                                color:${
                                                                    vencido
                                                                        ? '#dc2626'
                                                                        : '#374151'
                                                                };
                                                            ">

                                                            ${formatarDataDashboard(
                                                                lancamento.vencimento
                                                            )}

                                                        </strong>

                                                    </td>

                                                    <td>

                                                        ${escaparDashboard(
                                                            lancamento.descricao
                                                            ||
                                                            lancamento.nome
                                                            ||
                                                            '-'
                                                        )}

                                                    </td>

                                                    <td>

                                                        <span
                                                            class="dash-badge"
                                                            style="
                                                                background:${
                                                                    entrada
                                                                        ? '#dcfce7'
                                                                        : '#fee2e2'
                                                                };
                                                                color:${
                                                                    entrada
                                                                        ? '#166534'
                                                                        : '#991b1b'
                                                                };
                                                            ">

                                                            ${
                                                                entrada
                                                                    ? 'Receber'
                                                                    : 'Pagar'
                                                            }

                                                        </span>

                                                    </td>

                                                    <td>

                                                        <strong>
                                                            ${formatarMoedaDashboard(
                                                                lancamento.valor
                                                            )}
                                                        </strong>

                                                    </td>

                                                </tr>

                                            `;
                                        }
                                    ).join('')}

                                </tbody>

                            </table>

                        </div>

                    `
                    : `

                        <div class="dash-empty">
                            Nenhum vencimento pendente.
                        </div>

                    `
            }

        </div>


        <div class="dash-card">

            <div class="dash-card-header">

                <div>

                    <div class="dash-card-title">
                        Últimos orçamentos
                    </div>

                    <div class="dash-card-subtitle">
                        Movimentação comercial recente
                    </div>

                </div>

                <button
                    class="
                        dash-card-link
                        dash-card-link-orcamentos
                    "
                    onclick="navigate('orcamentos')">

                    <span class="dash-card-link-icon">
                        📄
                    </span>

                    Ver todos

                    <span class="dash-card-link-icon">
                        →
                    </span>

                </button>

            </div>


            ${
                ultimosOrcamentos.length
                    ? `

                        <div class="dash-table-wrap">

                            <table class="dash-table">

                                <thead>

                                    <tr>
                                        <th>Nº</th>
                                        <th>Cliente</th>
                                        <th>Status</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    ${ultimosOrcamentos.map(
                                        orcamento => {

                                            const status =
                                                normalizarDashboard(
                                                    orcamento.status
                                                );

                                            let fundo =
                                                '#fef3c7';

                                            let cor =
                                                '#92400e';

                                            if (
                                                [
                                                    'aprovado',
                                                    'finalizado'
                                                ].includes(status)
                                            ) {
                                                fundo = '#dcfce7';
                                                cor = '#166534';
                                            }

                                            if (
                                                status ===
                                                'em producao'
                                            ) {
                                                fundo = '#dbeafe';
                                                cor = '#1d4ed8';
                                            }

                                            if (
                                                [
                                                    'recusado',
                                                    'cancelado'
                                                ].includes(status)
                                            ) {
                                                fundo = '#fee2e2';
                                                cor = '#991b1b';
                                            }

                                            return `

                                                <tr>

                                                    <td>

                                                        <strong>
                                                            #${escaparDashboard(
                                                                orcamento.codigo
                                                                ||
                                                                '-'
                                                            )}
                                                        </strong>

                                                    </td>

                                                    <td>

                                                        ${escaparDashboard(
                                                            orcamento.cliente
                                                            ||
                                                            '-'
                                                        )}

                                                    </td>

                                                    <td>

                                                        <span
                                                            class="dash-badge"
                                                            style="
                                                                background:${fundo};
                                                                color:${cor};
                                                            ">

                                                            ${escaparDashboard(
                                                                orcamento.status
                                                                ||
                                                                '-'
                                                            )}

                                                        </span>

                                                    </td>

                                                </tr>

                                            `;
                                        }
                                    ).join('')}

                                </tbody>

                            </table>

                        </div>

                    `
                    : `

                        <div class="dash-empty">
                            Nenhum orçamento cadastrado.
                        </div>

                    `
            }

        </div>

    </div>


    <div class="dash-footer">
        © 2026 Dominus ERP - Todos os direitos reservados
    </div>

</div>

`;

});
