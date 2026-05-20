/* ========================= */
/* FINANCEIRO */
/* ========================= */

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
function gerarPeriodoSemana(offset) {

    const hoje = new Date();

    const diaSemana =
        hoje.getDay();

    const diffSegunda =
        diaSemana === 0
            ? -6
            : 1 - diaSemana;

    const inicioSemana =
        new Date(hoje);

    inicioSemana.setDate(
        hoje.getDate() +
        diffSegunda +
        (offset * 7)
    );

    inicioSemana.setHours(0,0,0,0);

    const fimSemana =
        new Date(inicioSemana);

    fimSemana.setDate(
        inicioSemana.getDate() + 6
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

    const contasPagar =
        db.financeiro.filter(l => {

            if (l.tipo !== 'Pagar') {
                return false;
            }

            return (
    l.vencimento >= periodoPagar.inicio &&
    l.vencimento <= periodoPagar.fim
);
        });

    const contasReceber =
        db.financeiro.filter(l => {

            if (l.tipo !== 'Receber') {
                return false;
            }

            return (
    l.vencimento >= periodoReceber.inicio &&
    l.vencimento <= periodoReceber.fim
);
        });

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
                Fluxo Financeiro
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

/* ========================= */
/* TABELA */
/* ========================= */

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
                    <th>Status</th>
                    <th>Ação</th>

                </tr>

            </thead>

            <tbody>
`;

    if (dados.length === 0) {

        html += `

<tr>

    <td colspan="7" style="
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
        ${lanc.nome || '-'}
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
            justify-content:center;
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
                        "
                        onclick="darBaixaFinanceiro(${indexReal})">

                        ✔ ${tipo}

                    </button>
                `
                : `
                    <div style="
                        color:#16a34a;
                        font-size:13px;
                        font-weight:600;
                        white-space:nowrap;
                    ">
                        ✔ ${status}
                    </div>
                `
            }

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
                    white-space:nowrap;
                "
                onclick="excluirLancamento(${indexReal})">

                X

            </button>

            <button
                class="btn-action"
                style="
                    background:#ef4444;
                    padding:6px 10px;
                    font-size:12px;
                    white-space:nowrap;
                "
                onclick="editarLancamento(${indexReal})">

                ➖ Editar

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

    <div style="
    display:flex;
    justify-content:center;
    gap:10px;
    margin-top:20px;
">

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

/* ========================= */
/* ALTERAR SEMANA */
/* ========================= */

window.alterarSemanaFinanceiro = function (
    tipo,
    direcao
) {

    if (tipo === 'Pagar') {

        window.financeiroSemanaOffsetPagar +=
            direcao;

    } else {

        window.financeiroSemanaOffsetReceber +=
            direcao;
    }

    navigate('financeiro');
};

/* ========================= */
/* ABRIR CONTA PAGAR */
/* ========================= */

window.abrirContaPagar = function (
    dados = {}
) {

    const tiposConta = [

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

            ${db.fornecedores.map(f => `

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

                <option value="${t}">
                    ${t}
                </option>

            `).join('')}

        </select>

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

/* ========================= */
/* DAR BAIXA */
/* ========================= */

window.darBaixaFinanceiro = function (idx) {

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

        onConfirm() {

            lanc.status =
                lanc.tipo === 'Receber'
                    ? 'Recebido'
                    : 'Pago';

            lanc.dataPagamento =
                document.getElementById(
                    'fin-data-baixa'
                ).value;

            save();

            closeModal();

            navigate('financeiro');
        }
    });
};
/* ========================= */
/* EXCLUIR */
/* ========================= */

window.excluirLancamento = function (idx) {

    const confirmar =
        confirm(
            'Deseja excluir este lançamento?'
        );

    if (!confirmar) return;

    db.financeiro.splice(idx, 1);

    save();

    navigate('financeiro');
};

/* ========================= */
/* EDITAR */
/* ========================= */

window.editarLancamento = function (idx) {

    const lanc =
        db.financeiro[idx];

    if (!lanc) return;

    if (lanc.tipo === 'Pagar') {

        abrirContaPagar(lanc);

    } else {

        abrirContaReceber(lanc);
    }

    document.getElementById(
        'modal-confirm'
    ).onclick = function () {

        lanc.valor =
            Number(
                document.getElementById('fin-valor').value
            );

        lanc.descricao =
            document.getElementById('fin-desc').value;

        lanc.vencimento =
            document.getElementById('fin-vencimento').value;

        if (lanc.tipo === 'Pagar') {

            lanc.nome =
                document.getElementById('fin-fornecedor').value;

            lanc.tipoConta =
                document.getElementById('fin-tipo-conta').value;

        } else {

            lanc.nome =
                document.getElementById('fin-cliente').value;
        }

        save();

        closeModal();

        navigate('financeiro');
    };
};

/* ========================= */
/* SALVAR CONTA PAGAR */
/* ========================= */

window.salvarContaPagar = function () {

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

    /* ========================= */
    /* RECORRÊNCIA ÚNICA */
    /* ========================= */
    if (recorrencia === 'Unica') {
        db.financeiro.push({
            tipo: 'Pagar',
            valor,
            nome,
            descricao,
            vencimento,
            tipoConta,
            status: 'Pendente'
        });
    }

    /* ========================= */
    /* RECORRÊNCIA SEMANAL */
    /* ========================= */
    if (recorrencia === 'Semanal') {

        // Ajusta a primeira data para o dia da semana escolhido
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
                status: 'Pendente'
            });
        }
    }

    /* ========================= */
    /* RECORRÊNCIA QUINZENAL */
    /* ========================= */
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
                status: 'Pendente'
            });
        }
    }

    /* ========================= */
    /* RECORRÊNCIA MENSAL */
    /* ========================= */
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
                status: 'Pendente'
            });
        }
    }

    save();
    closeModal();
    navigate('financeiro');
};

/* ========================= */
/* CONTA RECEBER */
/* ========================= */

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

            ${db.clientes.map(c => `

                <option
                    value="${c.nome}"
                    ${dados.nome === c.nome ? 'selected' : ''}>

                    ${c.nome}

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

/* ========================= */
/* SALVAR CONTA RECEBER */
/* ========================= */

window.salvarContaReceber = function () {

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

        dataPagamento: null
    };

    db.financeiro.push(
        lancamento
    );

    save();

    closeModal();

    navigate('financeiro');
};

/* ========================= */
/* TOGGLE RECORRÊNCIA */
/* ========================= */

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
/* ========================= */
/* CONSULTA FINANCEIRO - MODAL FIXA */
/* ========================= */

window.abrirConsultaFinanceiro = function () {

    // Guardar resultados da última consulta
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

    <div id="consulta-pessoa-box">
        <label>Fornecedor</label>
        <select id="consulta-pessoa">
            <option value="">Todos</option>
            ${db.fornecedores.map(f => `
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
            consultarFinanceiro(); // Atualiza tabela dentro da modal
        }
    });
};

/* ========================= */
/* TOGGLE CONSULTA (Fornecedor/Cliente) */
/* ========================= */
window.toggleConsultaFinanceiro = function () {
    const tipo = document.getElementById('consulta-tipo').value;
    const box = document.getElementById('consulta-pessoa-box');

    if (tipo === 'Pagar') {
        box.innerHTML = `
<label>Fornecedor</label>
<select id="consulta-pessoa">
    <option value="">Todos</option>
    ${db.fornecedores.map(f => `<option value="${f.nome}">${f.nome}</option>`).join('')}
</select>`;
    } else {
        box.innerHTML = `
<label>Cliente</label>
<select id="consulta-pessoa">
    <option value="">Todos</option>
    ${db.clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
</select>`;
    }
};

/* ========================= */
/* CONSULTAR E RENDERIZAR TABELA */
/* ========================= */
window.consultarFinanceiro = function () {

    const tipo = document.getElementById('consulta-tipo').value;
    const inicio = document.getElementById('consulta-inicio').value;
    const fim = document.getElementById('consulta-fim').value;
    const pessoa = document.getElementById('consulta-pessoa').value;

    // Filtrar resultados
    window.dadosConsultaFinanceiro = db.financeiro.filter(l => {
        if (l.tipo !== tipo) return false;
        if (inicio && l.vencimento < inicio) return false;
        if (fim && l.vencimento > fim) return false;
        if (pessoa && l.nome !== pessoa) return false;
        return true;
    });

    renderTabelaConsultaFinanceiro(); // Renderiza tabela
};

/* ========================= */
/* RENDERIZAR TABELA CONSULTA (SEM FECHAR MODAL) */
/* ========================= */
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
    <th>Status</th>
    <th>Ações</th>
</tr>
</thead>
<tbody>
`;

    if (resultados.length === 0) {
        html += `<tr><td colspan="6" style="padding:30px; text-align:center; color:#6b7280;">Nenhum lançamento encontrado</td></tr>`;
    } else {
        resultados.forEach((l, idx) => {
            const status = l.status || 'Pendente';
            html += `
<tr>
    <td>${formatarDataBR(l.vencimento)}</td>
    <td>${l.descricao || '-'}</td>
    <td>${l.nome || '-'}</td>
    <td>${formatarMoeda(l.valor || 0)}</td>
    <td>${status}</td>
    <td>
        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:nowrap;">
            <button class="btn-action" style="background:#16a34a; padding:6px 10px; font-size:12px;" onclick="darBaixaFinanceiroConsulta(${idx})">✔</button>
            <button class="btn-action" style="background:#2563eb; padding:6px 10px; font-size:12px;" onclick="editarLancamentoConsulta(${idx})">✏</button>
            <button class="btn-del" style="padding:6px 10px; font-size:12px;" onclick="excluirLancamentoConsulta(${idx})">X</button>
        </div>
    </td>
</tr>`;
        });
    }

    html += `</tbody></table></div>`;

    document.getElementById('consulta-resultado').innerHTML = html;
};

/* ========================= */
/* DAR BAIXA NA CONSULTA (SEM FECHAR MODAL) */
/* ========================= */
window.darBaixaFinanceiroConsulta = function(idx) {
    const lanc = window.dadosConsultaFinanceiro[idx];
    if (!lanc) return;

    const hojeStr = new Date().toISOString().split('T')[0];
    const dataBaixa = prompt(`Informe a data de ${lanc.tipo === 'Pagar' ? 'pagamento' : 'recebimento'}:`, hojeStr);
    if (!dataBaixa) return;

    lanc.dataPagamento = dataBaixa;
    lanc.status = lanc.tipo === 'Pagar' ? 'Pago' : 'Recebido';

    save();
    renderTabelaConsultaFinanceiro(); // Atualiza tabela sem fechar modal
};

/* ========================= */
/* EXCLUIR NA CONSULTA (SEM FECHAR MODAL) */
/* ========================= */
window.excluirLancamentoConsulta = function(idx) {
    const confirmar = confirm('Deseja excluir este lançamento?');
    if (!confirmar) return;

    const lanc = window.dadosConsultaFinanceiro[idx];
    const indexReal = db.financeiro.indexOf(lanc);
    if (indexReal >= 0) db.financeiro.splice(indexReal,1);

    save();
    renderTabelaConsultaFinanceiro();
};

/* ========================= */
/* EDITAR NA CONSULTA (SEM FECHAR MODAL) */
/* ========================= */
window.editarLancamentoConsulta = function(idx) {
    const lanc = window.dadosConsultaFinanceiro[idx];
    if (!lanc) return;

    // Preenche inputs inline na tabela
    const row = document.querySelectorAll('#consulta-resultado tbody tr')[idx];
    row.cells[1].innerHTML = `<input type="text" value="${lanc.descricao || ''}" style="width:100%;">`;
    row.cells[2].innerHTML = `<input type="text" value="${lanc.nome || ''}" style="width:100%;">`;
    row.cells[3].innerHTML = `<input type="number" step="0.01" value="${lanc.valor || 0}" style="width:100%;">`;

    const btns = row.cells[5].querySelectorAll('button');
    btns[1].textContent = '💾';
    btns[1].onclick = () => {
        // Salva alterações inline
        lanc.descricao = row.cells[1].querySelector('input').value;
        lanc.nome = row.cells[2].querySelector('input').value;
        lanc.valor = parseFloat(row.cells[3].querySelector('input').value) || 0;
        save();
        renderTabelaConsultaFinanceiro();
    };
};

/* ========================= */
/* REGISTRAR PÁGINA */
/* ========================= */

registerPage(
    'financeiro',
    renderFinanceiro
);  