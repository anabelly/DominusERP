/* ========================= */
/* PONTO DE FUNCIONÁRIOS */
/* ========================= */

window.abrirPontoFuncionario = function (idx) {

    const func = db.funcionarios[idx];

    if (!func) return;

    /* ========================= */
    /* ESTRUTURA */
    /* ========================= */

    if (!func.ponto) {
        func.ponto = [];
    }

    if (!func.mesesFechados) {
        func.mesesFechados = {};
    }

    if (func.mesPontoSelecionado === undefined) {
        func.mesPontoSelecionado =
            new Date().getMonth();
    }

    if (func.anoPontoSelecionado === undefined) {
        func.anoPontoSelecionado =
            new Date().getFullYear();
    }

    /* ========================= */
    /* DATAS */
    /* ========================= */

    const ano =
        func.anoPontoSelecionado;

    const mes =
        func.mesPontoSelecionado;

    const diasMes =
        new Date(ano, mes + 1, 0).getDate();

    const hoje =
        new Date();

    const hojeStr =
        `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const mesKey =
        `${ano}-${String(mes + 1).padStart(2, '0')}`;

    const mesFechado =
        func.mesesFechados[mesKey] === true;

    const nomesMeses = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ];

    /* ========================= */
    /* CÁLCULOS */
    /* ========================= */

    let totalAtraso = 0;
    let totalExtra = 0;
    let totalFaltas = 0;

    const salario =
        parseFloat(func.salario || 0);

    const valorHora =
        salario / 220;

    const valorMinuto =
        valorHora / 60;

    /* ========================= */
    /* HTML */
    /* ========================= */

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
                ${func.nome}
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                ${func.cargo || '-'}
            </div>

        </div>

        <div style="
            display:flex;
            align-items:center;
            gap:10px;
        ">

            <button
                onclick="alterarMesPonto(${idx}, -1)"
                class="btn-action">

                ◀

            </button>

            <div style="
                background:#f3f4f6;
                padding:12px 18px;
                border-radius:12px;
                font-weight:600;
                min-width:180px;
                text-align:center;
            ">

                ${nomesMeses[mes]} / ${ano}

            </div>

            <button
                onclick="alterarMesPonto(${idx}, 1)"
                class="btn-action">

                ▶

            </button>

        </div>

    </div>

    <!-- BOTÕES -->

    <div style="
        display:flex;
        justify-content:flex-end;
        gap:10px;
        flex-wrap:wrap;
    ">

        ${
            !mesFechado
            ? `
                <button
                    class="btn-del"
                    onclick="fecharMes(${idx}, '${mesKey}')">

                    🔒 Fechar Mês

                </button>
            `
            : `
                <button
                    class="btn-action"
                    style="background:#2563eb;"
                    onclick="exportarPontoPDF(${idx})">

                    📄 PDF

                </button>

                <button
                    class="btn-action"
                    style="background:#f59e0b;"
                    onclick="reabrirMes(${idx}, '${mesKey}')">

                    🔓 Reabrir Mês

                </button>
            `
        }

    </div>

    <!-- TABELA -->

    <div style="
        overflow:auto;
        border:1px solid #e5e7eb;
        border-radius:14px;
    ">

        <table>

            <thead>

                <tr>

                    <th>Dia</th>
                    <th>Entrada</th>
                    <th>Saída Almoço</th>
                    <th>Volta Almoço</th>
                    <th>Saída</th>
                    <th>Atraso</th>
                    <th>Extra</th>
                    <th>Falta</th>

                </tr>

            </thead>

            <tbody>
`;

    for (let dia = 1; dia <= diasMes; dia++) {

        const data =
            `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        let reg =
            func.ponto.find(p => p.data === data);

        if (!reg) {

            reg = {
                data,
                entrada: '',
                almocoSaida: '',
                almocoVolta: '',
                saida: '',
                atraso: '-',
                extra: '-',
                falta: false
            };

            func.ponto.push(reg);
        }

        const atrasoMin =
            paraMinutos(reg.atraso);

        const extraMin =
            paraMinutos(reg.extra);

        if (reg.falta) {

            totalFaltas++;

        } else {

            totalAtraso += atrasoMin || 0;
            totalExtra += extraMin || 0;
        }
        const baseTab = ((dia - 1) * 4);

        html += `

<tr style="
    ${
        data === hojeStr
        ? 'background:#fecaca;'
        : ''
    }

    ${
        reg.falta
        ? 'background:#fef2f2;'
        : ''
    }
">

    <td>
        ${String(dia).padStart(2, '0')}
    </td>

    <td>

    <input
        type="time"
        tabindex="${baseTab + 1}"
        style="
            width:95px;
            padding:4px;
            font-size:12px;
        "
        value="${reg.entrada || ''}"
        ${mesFechado || reg.falta ? 'disabled' : ''}
        onchange="
salvarPonto(
    ${idx},
    '${data}',
    'entrada',
    this.value
);

setTimeout(() => {
    proximoCampoPonto(this);
},50);
"
    >

</td>

<td>

    <input
        type="time"
        tabindex="${baseTab + 2}"
        style="
            width:95px;
            padding:4px;
            font-size:12px;
        "
        value="${reg.almocoSaida || ''}"
        ${mesFechado || reg.falta ? 'disabled' : ''}
        onchange="
salvarPonto(
    ${idx},
    '${data}',
    'almocoSaida',
    this.value
);

setTimeout(() => {
    proximoCampoPonto(this);
},50);
"
    >

</td>

<td>

    <input
        type="time"
        tabindex="${baseTab + 3}"
        style="
            width:95px;
            padding:4px;
            font-size:12px;
        "
        value="${reg.almocoVolta || ''}"
        ${mesFechado || reg.falta ? 'disabled' : ''}
        onchange="
salvarPonto(
    ${idx},
    '${data}',
    'almocoVolta',
    this.value
);

setTimeout(() => {
    proximoCampoPonto(this);
},50);
"
    >

</td>

<td>

    <input
        type="time"
        tabindex="${baseTab + 4}"
        style="
            width:95px;
            padding:4px;
            font-size:12px;
        "
        value="${reg.saida || ''}"
        ${mesFechado || reg.falta ? 'disabled' : ''}
        onchange="
salvarPonto(
    ${idx},
    '${data}',
    'saida',
    this.value
);

setTimeout(() => {
    proximoCampoPonto(this);
},50);
"
    >

</td>

    <td style="
        color:#dc2626;
        font-weight:bold;
    ">
        ${reg.falta ? '-' : (reg.atraso || '-')}
    </td>

    <td style="
        color:#16a34a;
        font-weight:bold;
    ">
        ${reg.falta ? '-' : (reg.extra || '-')}
    </td>

    <td>

        <button
            onclick="toggleFalta(${idx}, '${data}')"
            ${mesFechado ? 'disabled' : ''}
            style="
                border:none;
                padding:7px 10px;
                border-radius:8px;
                cursor:pointer;
                font-size:12px;
                font-weight:600;
                background:${reg.falta ? '#dc2626' : '#e5e7eb'};
                color:${reg.falta ? '#fff' : '#111'};
            ">

            ${reg.falta ? 'Faltou' : 'Falta'}

        </button>

    </td>

</tr>

`;
    }

    const valorExtras =
        totalExtra * valorMinuto;

    const valorDesconto =
        totalAtraso * valorMinuto;

    html += `

            </tbody>

        </table>

    </div>

    <!-- RESUMO -->

    <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
        gap:15px;
    ">

        <div class="content-card">

            <div style="color:#6b7280;">
                Total de Atrasos
            </div>

            <div style="
                font-size:28px;
                font-weight:bold;
                color:#dc2626;
                margin-top:10px;
            ">
                ${formatarMinutos(totalAtraso)}
            </div>

            <div style="
                margin-top:10px;
                color:#dc2626;
                font-weight:600;
            ">
                Desconto:
                ${formatarMoeda(valorDesconto)}
            </div>

        </div>

        <div class="content-card">

            <div style="color:#6b7280;">
                Total de Extras
            </div>

            <div style="
                font-size:28px;
                font-weight:bold;
                color:#16a34a;
                margin-top:10px;
            ">
                ${formatarMinutos(totalExtra)}
            </div>

            <div style="
                margin-top:10px;
                color:#16a34a;
                font-weight:600;
            ">
                Receber:
                ${formatarMoeda(valorExtras)}
            </div>

        </div>

        <div class="content-card">

            <div style="color:#6b7280;">
                Faltas
            </div>

            <div style="
                font-size:28px;
                font-weight:bold;
                margin-top:10px;
            ">
                ${totalFaltas}
            </div>

        </div>

    </div>

</div>
`;

    configModal({

    title: `Controle de Ponto`,

    body: html,

    width: '98vw',

    maxWidth: '1900px',

    confirmText: 'Salvar',

    onConfirm() {
        closeModal();
    }
});
};

/* ========================= */
/* ALTERAR MÊS */
/* ========================= */

window.alterarMesPonto = function (idx, direcao) {

    const func =
        db.funcionarios[idx];

    func.mesPontoSelecionado += direcao;

    if (func.mesPontoSelecionado > 11) {

        func.mesPontoSelecionado = 0;

        func.anoPontoSelecionado++;
    }

    if (func.mesPontoSelecionado < 0) {

        func.mesPontoSelecionado = 11;

        func.anoPontoSelecionado--;
    }

    abrirPontoFuncionario(idx);
};

/* ========================= */
/* TOGGLE FALTA */
/* ========================= */

window.toggleFalta = function (
    idx,
    data
) {

    const func =
        db.funcionarios[idx];

    const reg =
        func.ponto.find(
            p => p.data === data
        );

    if (!reg) return;

    reg.falta = !reg.falta;

    if (reg.falta) {

        reg.entrada = '';
        reg.almocoSaida = '';
        reg.almocoVolta = '';
        reg.saida = '';
        reg.atraso = '-';
        reg.extra = '-';
    }

    save();
};

/* ========================= */
/* SALVAR PONTO */
/* ========================= */

window.salvarPonto = function (
    idx,
    data,
    campo,
    valor
) {

    const func =
        db.funcionarios[idx];

    let reg =
        func.ponto.find(
            p => p.data === data
        );

    if (!reg) {

        reg = {

            data,

            entrada: '',
            almocoSaida: '',
            almocoVolta: '',
            saida: '',

            atraso: '-',
            extra: '-',

            falta: false
        };

        func.ponto.push(reg);
    }

    reg[campo] = valor;

    /* ========================= */
    /* HORÁRIOS PADRÃO */
    /* ========================= */

    const entradaPadrao =
        paraMinutos(
            func.horarios?.entrada || '07:45'
        );

    const almocoSaidaPadrao =
        paraMinutos(
            func.horarios?.almocoSaida || '12:00'
        );

    const almocoVoltaPadrao =
        paraMinutos(
            func.horarios?.almocoVolta || '13:00'
        );

    const saidaPadrao =
        paraMinutos(
            func.horarios?.saida || '18:00'
        );

    /* ========================= */
    /* HORÁRIOS REAIS */
    /* ========================= */

    const entradaReal =
        paraMinutos(reg.entrada);

    const almocoSaidaReal =
        paraMinutos(reg.almocoSaida);

    const almocoVoltaReal =
        paraMinutos(reg.almocoVolta);

    const saidaReal =
        paraMinutos(reg.saida);

    /* ========================= */
    /* ZERA */
    /* ========================= */

    let totalAtraso = 0;
    let totalExtra = 0;

    /* ========================= */
    /* ENTRADA */
    /* ========================= */

    if (entradaReal !== null) {

        if (entradaReal > entradaPadrao) {

            totalAtraso +=
                entradaReal - entradaPadrao;
        }

        if (entradaReal < entradaPadrao) {

            totalExtra +=
                entradaPadrao - entradaReal;
        }
    }

    /* ========================= */
    /* SAÍDA ALMOÇO */
    /* ========================= */

    if (almocoSaidaReal !== null) {

        if (almocoSaidaReal < almocoSaidaPadrao) {

            totalAtraso +=
                almocoSaidaPadrao - almocoSaidaReal;
        }

        if (almocoSaidaReal > almocoSaidaPadrao) {

            totalExtra +=
                almocoSaidaReal - almocoSaidaPadrao;
        }
    }

    /* ========================= */
    /* VOLTA ALMOÇO */
    /* ========================= */

    if (almocoVoltaReal !== null) {

        if (almocoVoltaReal > almocoVoltaPadrao) {

            totalAtraso +=
                almocoVoltaReal - almocoVoltaPadrao;
        }

        if (almocoVoltaReal < almocoVoltaPadrao) {

            totalExtra +=
                almocoVoltaPadrao - almocoVoltaReal;
        }
    }

    /* ========================= */
    /* SAÍDA */
    /* ========================= */

    if (saidaReal !== null) {

        if (saidaReal < saidaPadrao) {

            totalAtraso +=
                saidaPadrao - saidaReal;
        }

        if (saidaReal > saidaPadrao) {

            totalExtra +=
                saidaReal - saidaPadrao;
        }
    }

    /* ========================= */
    /* SALVA */
    /* ========================= */

    reg.atraso =
        totalAtraso > 0
        ? formatarMinutos(totalAtraso)
        : '-';

    reg.extra =
        totalExtra > 0
        ? formatarMinutos(totalExtra)
        : '-';

    save();

};

/* ========================= */
/* FECHAR MÊS */
/* ========================= */

window.fecharMes = function (
    idx,
    mesKey
) {

    const confirmar =
        confirm(
            'Deseja fechar este mês?'
        );

    if (!confirmar) return;

    const func =
        db.funcionarios[idx];

    func.mesesFechados[mesKey] = true;

    save();

    abrirPontoFuncionario(idx);
};

/* ========================= */
/* REABRIR MÊS */
/* ========================= */

window.reabrirMes = function (
    idx,
    mesKey
) {

    const confirmar =
        confirm(
            'Deseja reabrir este mês?'
        );

    if (!confirmar) return;

    const func =
        db.funcionarios[idx];

    func.mesesFechados[mesKey] = false;

    save();

    abrirPontoFuncionario(idx);
};
/* ========================= */
/* TOGGLE FALTA */
/* ========================= */

window.toggleFalta = function (
    idx,
    data
) {

    const func =
        db.funcionarios[idx];

    const reg =
        func.ponto.find(
            p => p.data === data
        );

    if (!reg) return;

    reg.falta = !reg.falta;

    if (reg.falta) {

        reg.entrada = '';
        reg.almocoSaida = '';
        reg.almocoVolta = '';
        reg.saida = '';
        reg.atraso = '-';
        reg.extra = '-';
    }

    save();

    abrirPontoFuncionario(idx);
};
window.exportarPontoPDF = function (idx) {

    const func = db.funcionarios[idx];

    if (!func || !func.ponto) {

        alert("Sem registros.");

        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({

        orientation: 'portrait',

        unit: 'mm',

        format: 'a4'
    });

    /* ====================================== */
    /* MÊS */
    /* ====================================== */

    const ano =
        func.anoPontoSelecionado;

    const mes =
        func.mesPontoSelecionado + 1;

    const diasMes =
        new Date(ano, mes, 0).getDate();

    /* ====================================== */
    /* AUXILIARES */
    /* ====================================== */

    function paraMinutos(hora) {

        if (!hora || hora === '-') {
            return 0;
        }

        const [h, m] = hora.split(':');

        return (
            parseInt(h) * 60
        ) + parseInt(m);
    }

    function formatar(minutos) {

        const negativo =
            minutos < 0;

        minutos =
            Math.abs(minutos);

        const h =
            String(
                Math.floor(minutos / 60)
            ).padStart(2, '0');

        const m =
            String(
                minutos % 60
            ).padStart(2, '0');

        return `
${negativo ? '-' : ''}${h}:${m}
`.trim();
    }

    function moeda(valor) {

        return Number(valor || 0)
            .toLocaleString('pt-BR', {

                style: 'currency',

                currency: 'BRL'
            });
    }

    /* ====================================== */
    /* CÁLCULOS */
    /* ====================================== */

    let totalAtraso = 0;

    let totalExtra = 0;

    const linhas = [];

    for (
        let dia = 1;
        dia <= diasMes;
        dia++
    ) {

        const data =
            `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;

        const reg =
            func.ponto.find(
                p => p.data === data
            ) || {};

        const atraso =
            paraMinutos(reg.atraso);

        const extra =
            paraMinutos(reg.extra);

        totalAtraso += atraso;

        totalExtra += extra;

        linhas.push([

            String(dia).padStart(2,'0'),

            reg.entrada || '-',

            reg.almocoSaida || '-',

            reg.almocoVolta || '-',

            reg.saida || '-',

            reg.atraso || '-',

            reg.extra || '-'
        ]);
    }

    const salario =
        parseFloat(func.salario || 0);

    const valorHora =
        salario / 220;

    const valorMinuto =
        valorHora / 60;

    const descontoAtraso =
        totalAtraso * valorMinuto;

    const valorExtras =
        totalExtra * valorMinuto;

    /* ====================================== */
    /* HEADER */
    /* ====================================== */

    doc.setFillColor(30,30,30);

    doc.rect(
        0,
        0,
        210,
        16,
        'F'
    );

    doc.setTextColor(255,255,255);

    doc.setFontSize(13);

    doc.setFont(undefined, 'bold');

    doc.text(
        'CONTROLE DE PONTO',
        10,
        10
    );

    doc.setFontSize(8);

    doc.setFont(undefined, 'normal');

    doc.text(
        `${String(mes).padStart(2,'0')}/${ano}`,
        180,
        10
    );

    /* ====================================== */
    /* FUNCIONÁRIO */
    /* ====================================== */

    doc.setTextColor(20,20,20);

    doc.setFontSize(10);

    doc.setFont(undefined, 'bold');

    doc.text(
        func.nome || '-',
        10,
        21
    );

    doc.setFontSize(7);

    doc.setFont(undefined, 'normal');

    doc.text(
        `${func.cargo || '-'} | Salário: ${moeda(salario)}`,
        10,
        25
    );

    /* ====================================== */
    /* TABELA */
    /* ====================================== */

    doc.autoTable({

        startY: 27,

        head: [[
            'Dia',
            'Ent.',
            'Alm S',
            'Alm V',
            'Saída',
            'Atr.',
            'Ext.'
        ]],

        body: linhas,

        theme: 'grid',

        styles: {

            fontSize: 6.5,

            cellPadding: 1.6,

            lineWidth: 0.1,

            minCellHeight: 6,

            valign: 'middle',

            halign: 'center',

            overflow: 'hidden'
        },

        headStyles: {

            fillColor: [30,30,30],

            textColor: 255,

            fontStyle: 'bold',

            fontSize: 6.5
        },

        alternateRowStyles: {

            fillColor: [248,248,248]
        },

        margin: {

            left: 8,

            right: 8
        },

        tableWidth: 194,

        rowPageBreak: 'avoid'
    });

    /* ====================================== */
    /* RESUMO */
    /* ====================================== */

    let y =
        doc.lastAutoTable.finalY + 5;

    doc.setFillColor(245,245,245);

    doc.roundedRect(

        8,

        y,

        194,

        14,

        2,

        2,

        'F'
    );

    doc.setFontSize(7);

    doc.setFont(undefined, 'bold');

    doc.text(
        `ATRASOS: ${formatar(totalAtraso)}`,
        12,
        y + 6
    );

    doc.text(
        `VALOR A DESCONTAR: ${moeda(descontoAtraso)}`,
        45,
        y + 6
    );

    doc.text(
        `EXTRAS: ${formatar(totalExtra)}`,
        120,
        y + 6
    );

    doc.text(
        `VALOR EXTRA A RECEBER: ${moeda(valorExtras)}`,
        145,
        y + 6
    );

    /* ====================================== */
    /* ASSINATURA */
    /* ====================================== */

    doc.setFont(undefined, 'normal');

    doc.setFontSize(8);

    doc.text(
        "________________________________________",
        55,
        282
    );

    doc.text(
        "Assinatura do Funcionário",
        78,
        287
    );


    /* ====================================== */
    /* SALVAR */
    /* ====================================== */

    doc.save(
        `ponto-${func.nome}-${String(mes).padStart(2,'0')}-${ano}.pdf`
    );
};

