/* ========================= */
/* PONTO DE FUNCIONÁRIOS */
/* ========================= */

/* ===================================================== */
/* AUXILIARES GERAIS                                     */
/* ===================================================== */

function minutosHoraPonto(hora) {
    if (!hora || hora === '-') {
        return null;
    }

    const partes = String(hora).trim().split(':');

    if (partes.length < 2) {
        return null;
    }

    const horas = Number(partes[0]);
    const minutos = Number(partes[1]);

    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
        return null;
    }

    return (horas * 60) + minutos;
}

function formatarMinutosPonto(minutos) {
    minutos = Math.max(
        0,
        Math.round(Number(minutos) || 0)
    );

    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const restantes = String(minutos % 60).padStart(2, '0');

    return `${horas}:${restantes}`;
}

function formatarMoedaPonto(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function numeroPonto(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

function arredondarPonto(valor, casas = 2) {
    const fator = 10 ** casas;
    return Math.round((numeroPonto(valor) + Number.EPSILON) * fator) / fator;
}

function dataObjPonto(data) {
    return new Date(`${data}T12:00:00`);
}

function dataISODataPonto(dataObj) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function somarDiasPonto(data, dias) {
    const d = dataObjPonto(data);
    d.setDate(d.getDate() + dias);
    return dataISODataPonto(d);
}

function normalizarTextoPonto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function escaparHTMLPonto(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function minutosEntrePonto(inicio, fim) {
    if (inicio === null || fim === null) {
        return null;
    }

    let resultado = fim - inicio;

    if (resultado < 0) {
        resultado += 1440;
    }

    return resultado;
}

/* ===================================================== */
/* REGRAS PADRÃO                                         */
/* ===================================================== */

function regrasPadraoPonto() {
    return {
        divisorMensal: 220,
        toleranciaMarcacaoMin: 5,
        toleranciaDiaMin: 10,

        extraSemanaPrimeirosMin: 120,
        extraSemanaPrimeirosPercentual: 50,
        extraSemanaExcedentePercentual: 100,

        extraSabadoPrimeirosMin: 240,
        extraSabadoPrimeirosPercentual: 50,
        extraSabadoExcedentePercentual: 100,

        extraDomingoPercentual: 100,
        extraFeriadoPercentual: 100,

        adicionalNoturnoPercentual: 20,
        inicioNoturno: '22:00',
        fimNoturno: '05:00',
        horaNoturnaReduzida: true,

        descontarDSRFalta: true
    };
}

function garantirRegrasPonto(func) {
    if (!func) return regrasPadraoPonto();

    if (!func.regrasPonto || typeof func.regrasPonto !== 'object') {
        func.regrasPonto = {};
    }

    const padrao = regrasPadraoPonto();

    Object.keys(padrao).forEach(chave => {
        if (func.regrasPonto[chave] === undefined || func.regrasPonto[chave] === null) {
            func.regrasPonto[chave] = padrao[chave];
        }
    });

    return func.regrasPonto;
}

function garantirEstruturaPonto(func) {
    if (!func.ponto) {
        func.ponto = [];
    }

    if (!func.mesesFechados) {
        func.mesesFechados = {};
    }

    if (!func.fechamentosPonto || typeof func.fechamentosPonto !== 'object') {
        func.fechamentosPonto = {};
    }

    if (!Array.isArray(func.feriadosPonto)) {
        func.feriadosPonto = [];
    }

    if (!Array.isArray(func.ferias)) {
        func.ferias = [];
    }

    garantirRegrasPonto(func);
}


/* ===================================================== */
/* FÉRIAS                                                */
/* ===================================================== */

function feriasDaDataPonto(func, data) {
    garantirEstruturaPonto(func);

    return (func.ferias || []).find(item => {
        const status = normalizarTextoPonto(item.status || '');

        if (status === 'cancelado' || status === 'cancelada') {
            return false;
        }

        const inicio = String(item.inicio || '');
        const fim = String(item.fim || '');

        if (!inicio || !fim) {
            return false;
        }

        return data >= inicio && data <= fim;
    }) || null;
}

window.feriasDaDataPonto = feriasDaDataPonto;

/* ===================================================== */
/* FERIADOS                                              */
/* ===================================================== */

function feriadosNacionaisFixosPonto(ano) {
    return [
        { data: `${ano}-01-01`, nome: 'Confraternização Universal', origem: 'nacional' },
        { data: `${ano}-04-21`, nome: 'Tiradentes', origem: 'nacional' },
        { data: `${ano}-05-01`, nome: 'Dia do Trabalho', origem: 'nacional' },
        { data: `${ano}-09-07`, nome: 'Independência do Brasil', origem: 'nacional' },
        { data: `${ano}-10-12`, nome: 'Nossa Senhora Aparecida', origem: 'nacional' },
        { data: `${ano}-11-02`, nome: 'Finados', origem: 'nacional' },
        { data: `${ano}-11-15`, nome: 'Proclamação da República', origem: 'nacional' },
        { data: `${ano}-11-20`, nome: 'Dia Nacional de Zumbi e da Consciência Negra', origem: 'nacional' },
        { data: `${ano}-12-25`, nome: 'Natal', origem: 'nacional' }
    ];
}

window.obterFeriadosCustomizadosEmpresaPonto = function () {
    const mapa = new Map();

    (db.funcionarios || []).forEach(func => {
        (func.feriadosPonto || []).forEach(item => {
            if (item?.data) {
                mapa.set(item.data, {
                    data: item.data,
                    nome: item.nome || 'Feriado / folga da empresa'
                });
            }
        });
    });

    return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
};

function feriadoDaDataPonto(func, data) {
    const ano = Number(String(data).slice(0, 4));

    const nacional = feriadosNacionaisFixosPonto(ano)
        .find(item => item.data === data);

    if (nacional) {
        return nacional;
    }

    const customizados = window.obterFeriadosCustomizadosEmpresaPonto();

    const personalizado = customizados.find(item => item.data === data);

    if (personalizado) {
        return {
            ...personalizado,
            origem: 'empresa'
        };
    }

    return null;
}

window.abrirFeriadosPonto = function (idx) {
    const func = db.funcionarios[idx];
    if (!func) return;

    garantirEstruturaPonto(func);

    const customizados = window.obterFeriadosCustomizadosEmpresaPonto();

    const linhas = customizados.length
        ? customizados.map(item => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                    ${escaparHTMLPonto(item.data.split('-').reverse().join('/'))}
                </td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                    ${escaparHTMLPonto(item.nome || '-')}
                </td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">
                    <button
                        class="btn-del"
                        style="padding:5px 9px;font-size:11px;"
                        onclick="excluirFeriadoPonto(${idx}, '${item.data}')">
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="3" style="padding:24px;text-align:center;color:#6b7280;">
                    Nenhum feriado local ou folga especial cadastrado.
                </td>
            </tr>
        `;

    const html = `
        <div style="display:flex;flex-direction:column;gap:16px;">

            <div style="
                padding:12px 14px;
                border-radius:10px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                color:#1e3a8a;
                font-size:12px;
                line-height:1.5;
            ">
                Os feriados nacionais fixos já são reconhecidos automaticamente.
                Cadastre aqui feriados municipais, religiosos adotados pela empresa,
                Carnaval, Corpus Christi ou outras folgas que devam ser tratadas como feriado no ponto.
                O cadastro é aplicado a todos os funcionários atuais.
            </div>

            <div style="display:grid;grid-template-columns:180px 1fr auto;gap:10px;align-items:end;">
                <div>
                    <label>Data</label>
                    <input id="ponto-feriado-data" type="date">
                </div>
                <div>
                    <label>Descrição</label>
                    <input id="ponto-feriado-nome" placeholder="Ex.: Aniversário de Gravataí">
                </div>
                <button
                    class="btn-action"
                    style="background:#2563eb;height:42px;"
                    onclick="adicionarFeriadoPonto(${idx})">
                    + Adicionar
                </button>
            </div>

            <div style="overflow:auto;border:1px solid #e5e7eb;border-radius:10px;">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th style="text-align:right;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    configModal({
        title: '📅 Feriados do Ponto',
        body: html,
        confirmText: 'Voltar ao Ponto',
        onConfirm() {
            abrirPontoFuncionario(idx);
        }
    });
};

window.adicionarFeriadoPonto = async function (idx) {
    const data = document.getElementById('ponto-feriado-data')?.value || '';
    const nome = document.getElementById('ponto-feriado-nome')?.value.trim() || '';

    if (!data) {
        alert('Informe a data do feriado.');
        return;
    }

    if (!nome) {
        alert('Informe a descrição do feriado.');
        return;
    }

    (db.funcionarios || []).forEach(func => {
        garantirEstruturaPonto(func);

        const existe = func.feriadosPonto.find(item => item.data === data);

        if (existe) {
            existe.nome = nome;
        } else {
            func.feriadosPonto.push({ data, nome });
        }
    });

    await save();
    abrirFeriadosPonto(idx);
};

window.excluirFeriadoPonto = async function (idx, data) {
    if (!confirm('Deseja excluir este feriado personalizado?')) {
        return;
    }

    (db.funcionarios || []).forEach(func => {
        garantirEstruturaPonto(func);
        func.feriadosPonto = func.feriadosPonto.filter(item => item.data !== data);
    });

    await save();
    abrirFeriadosPonto(idx);
};

/* ===================================================== */
/* REGRAS DO PONTO                                       */
/* ===================================================== */

window.abrirRegrasPontoFuncionario = function (idx) {
    const func = db.funcionarios[idx];
    if (!func) return;

    garantirEstruturaPonto(func);

    const r = garantirRegrasPonto(func);

    const html = `
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">

            <div style="grid-column:1 / -1;padding:12px 14px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;color:#854d0e;font-size:12px;line-height:1.5;">
                Os valores abaixo começam com os mínimos legais e com a mesma distribuição usada na planilha-base enviada:
                dias úteis com as primeiras 2h extras a 50%, excedente a 100%; sábado com as primeiras 4h a 50%, excedente a 100%;
                domingo e feriado a 100%. Convenção ou acordo coletivo pode prever regra mais favorável, por isso estes campos são editáveis.
            </div>

            <div>
                <label>Divisor mensal</label>
                <input id="reg-divisor" type="number" min="1" step="1" value="${numeroPonto(r.divisorMensal)}">
            </div>

            <div>
                <label>Adicional noturno (%)</label>
                <input id="reg-noturno" type="number" min="0" step="0.01" value="${numeroPonto(r.adicionalNoturnoPercentual)}">
            </div>

            <div>
                <label>Início adicional noturno</label>
                <input id="reg-noturno-inicio" type="time" value="${escaparHTMLPonto(r.inicioNoturno || '22:00')}">
            </div>

            <div>
                <label>Fim adicional noturno</label>
                <input id="reg-noturno-fim" type="time" value="${escaparHTMLPonto(r.fimNoturno || '05:00')}">
            </div>

            <div>
                <label>Tolerância por marcação (min)</label>
                <input id="reg-tolerancia-marcacao" type="number" min="0" step="1" value="${numeroPonto(r.toleranciaMarcacaoMin)}">
            </div>

            <div>
                <label>Tolerância máxima no dia (min)</label>
                <input id="reg-tolerancia-dia" type="number" min="0" step="1" value="${numeroPonto(r.toleranciaDiaMin)}">
            </div>

            <div>
                <label>Dia útil: minutos iniciais a 50%</label>
                <input id="reg-semana-faixa" type="number" min="0" step="1" value="${numeroPonto(r.extraSemanaPrimeirosMin)}">
            </div>

            <div>
                <label>Sábado: minutos iniciais a 50%</label>
                <input id="reg-sabado-faixa" type="number" min="0" step="1" value="${numeroPonto(r.extraSabadoPrimeirosMin)}">
            </div>

            <div>
                <label>Extra inicial dia útil (%)</label>
                <input id="reg-semana-primeiro-pct" type="number" min="0" step="1" value="${numeroPonto(r.extraSemanaPrimeirosPercentual)}">
            </div>

            <div>
                <label>Extra excedente dia útil (%)</label>
                <input id="reg-semana-excedente-pct" type="number" min="0" step="1" value="${numeroPonto(r.extraSemanaExcedentePercentual)}">
            </div>

            <div>
                <label>Extra inicial sábado (%)</label>
                <input id="reg-sabado-primeiro-pct" type="number" min="0" step="1" value="${numeroPonto(r.extraSabadoPrimeirosPercentual)}">
            </div>

            <div>
                <label>Extra excedente sábado (%)</label>
                <input id="reg-sabado-excedente-pct" type="number" min="0" step="1" value="${numeroPonto(r.extraSabadoExcedentePercentual)}">
            </div>

            <div>
                <label>Domingo (%)</label>
                <input id="reg-domingo-pct" type="number" min="0" step="1" value="${numeroPonto(r.extraDomingoPercentual)}">
            </div>

            <div>
                <label>Feriado (%)</label>
                <input id="reg-feriado-pct" type="number" min="0" step="1" value="${numeroPonto(r.extraFeriadoPercentual)}">
            </div>

            <label style="grid-column:1 / -1;display:flex;align-items:center;gap:8px;margin-top:5px;">
                <input id="reg-hora-noturna-reduzida" type="checkbox" style="width:auto;" ${r.horaNoturnaReduzida !== false ? 'checked' : ''}>
                Aplicar hora noturna reduzida (52min30s)
            </label>

            <label style="grid-column:1 / -1;display:flex;align-items:center;gap:8px;">
                <input id="reg-dsr" type="checkbox" style="width:auto;" ${r.descontarDSRFalta !== false ? 'checked' : ''}>
                Descontar 1 DSR por semana com falta injustificada
            </label>

        </div>
    `;

    configModal({
        title: `⚙ Regras do Ponto - ${func.nome}`,
        body: html,
        confirmText: 'Salvar Regras',
        onConfirm: async function () {
            const novo = {
                divisorMensal: Math.max(1, numeroPonto(document.getElementById('reg-divisor').value)),
                toleranciaMarcacaoMin: Math.max(0, numeroPonto(document.getElementById('reg-tolerancia-marcacao').value)),
                toleranciaDiaMin: Math.max(0, numeroPonto(document.getElementById('reg-tolerancia-dia').value)),

                extraSemanaPrimeirosMin: Math.max(0, numeroPonto(document.getElementById('reg-semana-faixa').value)),
                extraSemanaPrimeirosPercentual: Math.max(0, numeroPonto(document.getElementById('reg-semana-primeiro-pct').value)),
                extraSemanaExcedentePercentual: Math.max(0, numeroPonto(document.getElementById('reg-semana-excedente-pct').value)),

                extraSabadoPrimeirosMin: Math.max(0, numeroPonto(document.getElementById('reg-sabado-faixa').value)),
                extraSabadoPrimeirosPercentual: Math.max(0, numeroPonto(document.getElementById('reg-sabado-primeiro-pct').value)),
                extraSabadoExcedentePercentual: Math.max(0, numeroPonto(document.getElementById('reg-sabado-excedente-pct').value)),

                extraDomingoPercentual: Math.max(0, numeroPonto(document.getElementById('reg-domingo-pct').value)),
                extraFeriadoPercentual: Math.max(0, numeroPonto(document.getElementById('reg-feriado-pct').value)),

                adicionalNoturnoPercentual: Math.max(0, numeroPonto(document.getElementById('reg-noturno').value)),
                inicioNoturno: document.getElementById('reg-noturno-inicio').value || '22:00',
                fimNoturno: document.getElementById('reg-noturno-fim').value || '05:00',
                horaNoturnaReduzida: document.getElementById('reg-hora-noturna-reduzida').checked,
                descontarDSRFalta: document.getElementById('reg-dsr').checked
            };

            func.regrasPonto = novo;

            (func.ponto || []).forEach(reg => {
                calcularPontoDia(func, reg, reg.data);
            });

            await save();
            abrirPontoFuncionario(idx);
        }
    });

    setTimeout(() => {
        const content = document.querySelector('#modal-global .content-card');
        if (content) {
            content.style.width = '94vw';
            content.style.maxWidth = '950px';
        }
    }, 0);
};

/* ===================================================== */
/* ADICIONAL NOTURNO                                     */
/* ===================================================== */

function sobreposicaoPonto(inicio1, fim1, inicio2, fim2) {
    return Math.max(0, Math.min(fim1, fim2) - Math.max(inicio1, inicio2));
}

function minutosNoturnosIntervaloPonto(inicio, fim, regras) {
    if (inicio === null || fim === null) {
        return 0;
    }

    let fimAjustado = fim;

    if (fimAjustado < inicio) {
        fimAjustado += 1440;
    }

    const inicioNoturno = minutosHoraPonto(regras.inicioNoturno || '22:00') ?? 1320;
    const fimNoturno = minutosHoraPonto(regras.fimNoturno || '05:00') ?? 300;

    let total = 0;

    for (let deslocamento = -1440; deslocamento <= 2880; deslocamento += 1440) {
        if (inicioNoturno > fimNoturno) {
            total += sobreposicaoPonto(
                inicio,
                fimAjustado,
                inicioNoturno + deslocamento,
                1440 + deslocamento
            );

            total += sobreposicaoPonto(
                inicio,
                fimAjustado,
                0 + deslocamento,
                fimNoturno + deslocamento
            );
        } else {
            total += sobreposicaoPonto(
                inicio,
                fimAjustado,
                inicioNoturno + deslocamento,
                fimNoturno + deslocamento
            );
        }
    }

    return Math.max(0, total);
}

function minutosTrabalhadosENoturnosPonto(reg, exigirQuatroMarcacoes, regras) {
    const entrada = minutosHoraPonto(reg.entrada);
    const almocoSaida = minutosHoraPonto(reg.almocoSaida);
    const almocoVolta = minutosHoraPonto(reg.almocoVolta);
    const saida = minutosHoraPonto(reg.saida);

    const possuiAlguma = [entrada, almocoSaida, almocoVolta, saida]
        .some(v => v !== null);

    if (!possuiAlguma) {
        return {
            completo: false,
            vazio: true,
            minutos: 0,
            noturnos: 0
        };
    }

    if (exigirQuatroMarcacoes) {
        if (
            entrada === null ||
            almocoSaida === null ||
            almocoVolta === null ||
            saida === null
        ) {
            return {
                completo: false,
                vazio: false,
                minutos: 0,
                noturnos: 0
            };
        }

        const manha = minutosEntrePonto(entrada, almocoSaida);
        const tarde = minutosEntrePonto(almocoVolta, saida);

        if (manha === null || tarde === null || manha > 900 || tarde > 900) {
            return {
                completo: false,
                vazio: false,
                minutos: 0,
                noturnos: 0
            };
        }

        return {
            completo: true,
            vazio: false,
            minutos: Math.max(0, manha + tarde),
            noturnos:
                minutosNoturnosIntervaloPonto(entrada, almocoSaida, regras) +
                minutosNoturnosIntervaloPonto(almocoVolta, saida, regras)
        };
    }

    if (entrada === null || saida === null) {
        return {
            completo: false,
            vazio: false,
            minutos: 0,
            noturnos: 0
        };
    }

    let total = minutosEntrePonto(entrada, saida);
    let noturno = minutosNoturnosIntervaloPonto(entrada, saida, regras);

    if (almocoSaida !== null && almocoVolta !== null) {
        const intervalo = minutosEntrePonto(almocoSaida, almocoVolta);

        if (intervalo !== null && intervalo <= total) {
            total -= intervalo;
            noturno -= minutosNoturnosIntervaloPonto(almocoSaida, almocoVolta, regras);
        }
    }

    return {
        completo: true,
        vazio: false,
        minutos: Math.max(0, total),
        noturnos: Math.max(0, noturno)
    };
}

/* ===================================================== */
/* CÁLCULO DIÁRIO                                        */
/* ===================================================== */

function calcularPontoDia(func, reg, data) {
    if (!reg) return null;

    garantirEstruturaPonto(func);

    const regras = garantirRegrasPonto(func);
    const salario = numeroPonto(func.salario);
    const divisor = Math.max(1, numeroPonto(regras.divisorMensal) || 220);
    const valorHora = salario / divisor;
    const valorMinuto = valorHora / 60;

    const dataObj = dataObjPonto(data);
    const diaSemana = dataObj.getDay();
    const feriado = feriadoDaDataPonto(func, data);

    const domingo = diaSemana === 0;
    const sabado = diaSemana === 6;
    const diaUtil = diaSemana >= 1 && diaSemana <= 5;
    const diaUtilNormal = diaUtil && !feriado;
    const ferias = feriasDaDataPonto(func, data);

    if (ferias) {
        reg.atraso = '-';
        reg.extra = '-';
        reg.saldoMinutos = 0;
        reg.extra50Minutos = 0;
        reg.extra100Minutos = 0;
        reg.noturnoMinutos = 0;
        reg.valorAtraso = 0;
        reg.valorExtra50 = 0;
        reg.valorExtra100 = 0;
        reg.valorAdicionalNoturno = 0;
        reg.valorAdicionalNoturnoRegular = 0;
        reg.valorExtrasTotal = 0;

        return {
            ferias: true,
            registroFerias: ferias,
            feriado,
            domingo,
            sabado,
            diaUtilNormal,
            atrasoMinutos: 0,
            extraTotalMinutos: 0,
            extra50Minutos: 0,
            extra100Minutos: 0,
            adicionalNoturnoMinutos: 0,
            valorAtraso: 0,
            valorExtra50: 0,
            valorExtra100: 0,
            valorAdicionalNoturno: 0,
            valorAdicionalNoturnoRegular: 0,
            valorExtrasTotal: 0
        };
    }

    if (reg.falta) {
        reg.atraso = '-';
        reg.extra = '-';
        reg.saldoMinutos = 0;
        reg.extra50Minutos = 0;
        reg.extra100Minutos = 0;
        reg.noturnoMinutos = 0;
        reg.valorAtraso = 0;
        reg.valorExtra50 = 0;
        reg.valorExtra100 = 0;
        reg.valorAdicionalNoturno = 0;
        reg.valorExtrasTotal = 0;

        return {
            falta: true,
            faltaJustificada: reg.faltaJustificada === true,
            feriado,
            domingo,
            sabado,
            diaUtilNormal,
            atrasoMinutos: 0,
            extra50Minutos: 0,
            extra100Minutos: 0,
            adicionalNoturnoMinutos: 0,
            valorAtraso: 0,
            valorExtra50: 0,
            valorExtra100: 0,
            valorAdicionalNoturno: 0,
            valorExtrasTotal: 0
        };
    }

    const trabalho = minutosTrabalhadosENoturnosPonto(
        reg,
        diaUtilNormal,
        regras
    );

    if (trabalho.vazio || !trabalho.completo) {
        reg.atraso = '-';
        reg.extra = '-';
        reg.saldoMinutos = 0;
        reg.extra50Minutos = 0;
        reg.extra100Minutos = 0;
        reg.noturnoMinutos = 0;
        reg.valorAtraso = 0;
        reg.valorExtra50 = 0;
        reg.valorExtra100 = 0;
        reg.valorAdicionalNoturno = 0;
        reg.valorExtrasTotal = 0;

        return {
            incompleto: !trabalho.vazio,
            vazio: trabalho.vazio,
            feriado,
            domingo,
            sabado,
            diaUtilNormal,
            atrasoMinutos: 0,
            extra50Minutos: 0,
            extra100Minutos: 0,
            adicionalNoturnoMinutos: 0,
            valorAtraso: 0,
            valorExtra50: 0,
            valorExtra100: 0,
            valorAdicionalNoturno: 0,
            valorExtrasTotal: 0
        };
    }

    let atrasoMinutos = 0;
    let extraTotalMinutos = 0;

    if (diaUtilNormal) {
        const entradaPadrao = minutosHoraPonto(func.horarios?.entrada || '07:45');
        const almocoSaidaPadrao = minutosHoraPonto(func.horarios?.almocoSaida || '12:00');
        const almocoVoltaPadrao = minutosHoraPonto(func.horarios?.almocoVolta || '13:30');
        const saidaPadrao = minutosHoraPonto(func.horarios?.saida || '18:00');

        const jornadaEsperada =
            minutosEntrePonto(entradaPadrao, almocoSaidaPadrao) +
            minutosEntrePonto(almocoVoltaPadrao, saidaPadrao);

        let saldoDia = trabalho.minutos - jornadaEsperada;

        const entradaReal = minutosHoraPonto(reg.entrada);
        const almocoSaidaReal = minutosHoraPonto(reg.almocoSaida);
        const almocoVoltaReal = minutosHoraPonto(reg.almocoVolta);
        const saidaReal = minutosHoraPonto(reg.saida);

        const variacoes = [
            entradaReal - entradaPadrao,
            almocoSaidaReal - almocoSaidaPadrao,
            almocoVoltaReal - almocoVoltaPadrao,
            saidaReal - saidaPadrao
        ];

        const toleranciaMarcacao = Math.max(0, numeroPonto(regras.toleranciaMarcacaoMin));
        const toleranciaDia = Math.max(0, numeroPonto(regras.toleranciaDiaMin));

        const todasDentro = variacoes.every(v => Math.abs(v) <= toleranciaMarcacao);
        const totalVariacoes = variacoes.reduce((a, v) => a + Math.abs(v), 0);

        if (todasDentro && totalVariacoes <= toleranciaDia) {
            saldoDia = 0;
        }

        if (saldoDia < 0) {
            atrasoMinutos = Math.abs(saldoDia);
        } else if (saldoDia > 0) {
            extraTotalMinutos = saldoDia;
        }
    } else {
        extraTotalMinutos = trabalho.minutos;
    }

    let extra50Minutos = 0;
    let extra100Minutos = 0;

    if (extraTotalMinutos > 0) {
        if (feriado) {
            extra100Minutos = extraTotalMinutos;
        } else if (domingo) {
            extra100Minutos = extraTotalMinutos;
        } else if (sabado) {
            extra50Minutos = Math.min(extraTotalMinutos, Math.max(0, numeroPonto(regras.extraSabadoPrimeirosMin)));
            extra100Minutos = Math.max(0, extraTotalMinutos - extra50Minutos);
        } else {
            extra50Minutos = Math.min(extraTotalMinutos, Math.max(0, numeroPonto(regras.extraSemanaPrimeirosMin)));
            extra100Minutos = Math.max(0, extraTotalMinutos - extra50Minutos);
        }
    }

    const minutosNoturnosReais = Math.min(
        trabalho.noturnos,
        trabalho.minutos
    );

    const noturnoDentroExtra = Math.min(minutosNoturnosReais, extraTotalMinutos);

    const noturno100 = Math.min(noturnoDentroExtra, extra100Minutos);
    const noturnoRestante = Math.max(0, noturnoDentroExtra - noturno100);
    const noturno50 = Math.min(noturnoRestante, extra50Minutos);

    const extra50Diurno = Math.max(0, extra50Minutos - noturno50);
    const extra100Diurno = Math.max(0, extra100Minutos - noturno100);

    const noturnoRegular = Math.max(0, minutosNoturnosReais - noturnoDentroExtra);

    const fatorHoraNoturna = regras.horaNoturnaReduzida !== false
        ? 60 / 52.5
        : 1;

    const adicionalNoturno = Math.max(0, numeroPonto(regras.adicionalNoturnoPercentual)) / 100;

    let pct50 = numeroPonto(regras.extraSemanaPrimeirosPercentual);
    let pct100 = numeroPonto(regras.extraSemanaExcedentePercentual);

    if (sabado && !feriado) {
        pct50 = numeroPonto(regras.extraSabadoPrimeirosPercentual);
        pct100 = numeroPonto(regras.extraSabadoExcedentePercentual);
    }

    if (domingo && !feriado) {
        pct100 = numeroPonto(regras.extraDomingoPercentual);
    }

    if (feriado) {
        pct100 = numeroPonto(regras.extraFeriadoPercentual);
    }

    const mult50 = 1 + (pct50 / 100);
    const mult100 = 1 + (pct100 / 100);

    const valorExtra50Diurno = extra50Diurno * valorMinuto * mult50;
    const valorExtra100Diurno = extra100Diurno * valorMinuto * mult100;

    const valorExtra50Noturno = noturno50 * fatorHoraNoturna * valorMinuto * (1 + adicionalNoturno) * mult50;
    const valorExtra100Noturno = noturno100 * fatorHoraNoturna * valorMinuto * (1 + adicionalNoturno) * mult100;

    const valorExtra50 = valorExtra50Diurno + valorExtra50Noturno;
    const valorExtra100 = valorExtra100Diurno + valorExtra100Noturno;

    const valorNoturnoRegular = noturnoRegular * fatorHoraNoturna * valorMinuto * adicionalNoturno;

    const hipoteticoNoturnoSemAdicional =
        (noturno50 * fatorHoraNoturna * valorMinuto * mult50) +
        (noturno100 * fatorHoraNoturna * valorMinuto * mult100);

    const valorAdicionalNoturnoExtras =
        (valorExtra50Noturno + valorExtra100Noturno) - hipoteticoNoturnoSemAdicional;

    const valorAdicionalNoturno = Math.max(0, valorNoturnoRegular + valorAdicionalNoturnoExtras);

    const valorAtraso = atrasoMinutos * valorMinuto;
    const valorExtrasTotal = valorExtra50 + valorExtra100 + valorNoturnoRegular;

    reg.saldoMinutos = extraTotalMinutos - atrasoMinutos;
    reg.atraso = atrasoMinutos > 0 ? formatarMinutosPonto(atrasoMinutos) : '-';
    reg.extra = extraTotalMinutos > 0 ? formatarMinutosPonto(extraTotalMinutos) : '-';
    reg.extra50Minutos = Math.round(extra50Minutos);
    reg.extra100Minutos = Math.round(extra100Minutos);
    reg.noturnoMinutos = Math.round(minutosNoturnosReais);
    reg.valorAtraso = arredondarPonto(valorAtraso);
    reg.valorExtra50 = arredondarPonto(valorExtra50);
    reg.valorExtra100 = arredondarPonto(valorExtra100);
    reg.valorAdicionalNoturno = arredondarPonto(valorAdicionalNoturno);
    reg.valorAdicionalNoturnoRegular = arredondarPonto(valorNoturnoRegular);
    reg.valorExtrasTotal = arredondarPonto(valorExtrasTotal);

    return {
        feriado,
        domingo,
        sabado,
        diaUtilNormal,
        minutosTrabalhados: trabalho.minutos,
        atrasoMinutos,
        extraTotalMinutos,
        extra50Minutos,
        extra100Minutos,
        adicionalNoturnoMinutos: minutosNoturnosReais,
        valorAtraso: arredondarPonto(valorAtraso),
        valorExtra50: arredondarPonto(valorExtra50),
        valorExtra100: arredondarPonto(valorExtra100),
        valorAdicionalNoturno: arredondarPonto(valorAdicionalNoturno),
        valorAdicionalNoturnoRegular: arredondarPonto(valorNoturnoRegular),
        valorExtrasTotal: arredondarPonto(valorExtrasTotal)
    };
}

/* ===================================================== */
/* DSR                                                   */
/* ===================================================== */

function faltasInjustificadasEntrePonto(func, inicio, fim) {
    return (func.ponto || []).filter(reg => {
        if (!reg.falta || reg.faltaJustificada === true) {
            return false;
        }

        return reg.data >= inicio && reg.data <= fim;
    });
}

function calcularDSRPerdidosMesPonto(func, ano, mesZero) {
    const regras = garantirRegrasPonto(func);

    if (regras.descontarDSRFalta === false) {
        return {
            quantidade: 0,
            datas: []
        };
    }

    const diasMes = new Date(ano, mesZero + 1, 0).getDate();
    const datas = [];

    for (let dia = 1; dia <= diasMes; dia++) {
        const data = `${ano}-${String(mesZero + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const obj = dataObjPonto(data);

        if (obj.getDay() !== 0) {
            continue;
        }

        if (feriasDaDataPonto(func, data)) {
            continue;
        }

        const inicioSemana = somarDiasPonto(data, -6);
        const fimSemana = somarDiasPonto(data, -1);

        if (faltasInjustificadasEntrePonto(func, inicioSemana, fimSemana).length > 0) {
            datas.push(data);
        }
    }

    return {
        quantidade: datas.length,
        datas
    };
}

/* ===================================================== */
/* RESUMO MENSAL                                         */
/* ===================================================== */

function calcularResumoMesPonto(func, ano, mesZero) {
    garantirEstruturaPonto(func);

    const regras = garantirRegrasPonto(func);
    const salario = numeroPonto(func.salario);
    const divisor = Math.max(1, numeroPonto(regras.divisorMensal) || 220);
    const valorHora = salario / divisor;
    const valorMinuto = valorHora / 60;
    const valorDia = salario / 30;
    const diasMes = new Date(ano, mesZero + 1, 0).getDate();

    let totalAtraso = 0;
    let totalExtra50 = 0;
    let totalExtra100 = 0;
    let totalExtraGeral = 0;
    let totalNoturno = 0;

    let valorAtrasos = 0;
    let valorExtra50 = 0;
    let valorExtra100 = 0;
    let valorAdicionalNoturno = 0;
    let valorAdicionalNoturnoRegular = 0;
    let valorExtrasPagar = 0;

    let faltasInjustificadas = 0;
    let faltasJustificadas = 0;

    const detalhesDias = [];

    for (let dia = 1; dia <= diasMes; dia++) {
        const data = `${ano}-${String(mesZero + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        let reg = func.ponto.find(p => p.data === data);

        if (!reg) {
            reg = {
                data,
                entrada: '',
                almocoSaida: '',
                almocoVolta: '',
                saida: '',
                atraso: '-',
                extra: '-',
                saldoMinutos: 0,
                falta: false,
                faltaJustificada: false
            };
        }

        const calc = calcularPontoDia(func, reg, data);

        if (calc?.ferias) {
            /* férias não geram atraso, falta ou hora extra */
        } else if (reg.falta) {
            if (reg.faltaJustificada === true) {
                faltasJustificadas++;
            } else {
                faltasInjustificadas++;
            }
        } else if (calc) {
            totalAtraso += numeroPonto(calc.atrasoMinutos);
            totalExtra50 += numeroPonto(calc.extra50Minutos);
            totalExtra100 += numeroPonto(calc.extra100Minutos);
            totalExtraGeral += numeroPonto(calc.extraTotalMinutos);
            totalNoturno += numeroPonto(calc.adicionalNoturnoMinutos);

            valorAtrasos += numeroPonto(calc.valorAtraso);
            valorExtra50 += numeroPonto(calc.valorExtra50);
            valorExtra100 += numeroPonto(calc.valorExtra100);
            valorAdicionalNoturno += numeroPonto(calc.valorAdicionalNoturno);
            valorAdicionalNoturnoRegular += numeroPonto(calc.valorAdicionalNoturnoRegular);
            valorExtrasPagar += numeroPonto(calc.valorExtrasTotal);
        }

        detalhesDias.push({
            data,
            entrada: reg.entrada || '',
            almocoSaida: reg.almocoSaida || '',
            almocoVolta: reg.almocoVolta || '',
            saida: reg.saida || '',
            atraso: reg.atraso || '-',
            extra: reg.extra || '-',
            falta: reg.falta === true,
            faltaJustificada: reg.faltaJustificada === true,
            ferias: calc?.ferias === true,
            extra50Minutos: numeroPonto(reg.extra50Minutos),
            extra100Minutos: numeroPonto(reg.extra100Minutos),
            noturnoMinutos: numeroPonto(reg.noturnoMinutos)
        });
    }

    const dsr = calcularDSRPerdidosMesPonto(func, ano, mesZero);

    const descontoFaltas = faltasInjustificadas * valorDia;
    const descontoDSR = dsr.quantidade * valorDia;
    const descontoFaltasTotal = descontoFaltas + descontoDSR;
    const horasExtrasPagar = valorExtra50 + valorExtra100;
    const totalAdicionaisPagar = horasExtrasPagar + valorAdicionalNoturnoRegular;

    return {
        ano,
        mes: mesZero,
        salarioBase: arredondarPonto(salario),
        divisorMensal: divisor,
        valorHora: arredondarPonto(valorHora, 6),
        valorMinuto: arredondarPonto(valorMinuto, 6),
        valorDia: arredondarPonto(valorDia, 6),

        horas: {
            atrasoMinutos: Math.round(totalAtraso),
            extra50Minutos: Math.round(totalExtra50),
            extra100Minutos: Math.round(totalExtra100),
            extraTotalMinutos: Math.round(totalExtraGeral),
            noturnoMinutos: Math.round(totalNoturno)
        },

        faltas: {
            injustificadas: faltasInjustificadas,
            justificadas: faltasJustificadas,
            dsrPerdidos: dsr.quantidade,
            datasDSR: dsr.datas
        },

        valores: {
            descontoAtrasos: arredondarPonto(valorAtrasos),
            descontoFaltas: arredondarPonto(descontoFaltas),
            descontoDSR: arredondarPonto(descontoDSR),
            descontoFaltasTotal: arredondarPonto(descontoFaltasTotal),
            extra50: arredondarPonto(valorExtra50),
            extra100: arredondarPonto(valorExtra100),
            adicionalNoturno: arredondarPonto(valorAdicionalNoturno),
            adicionalNoturnoRegular: arredondarPonto(valorAdicionalNoturnoRegular),
            horasExtrasPagar: arredondarPonto(horasExtrasPagar),
            totalAdicionaisPagar: arredondarPonto(totalAdicionaisPagar),
            extrasPagar: arredondarPonto(valorExtrasPagar)
        },

        regras: JSON.parse(JSON.stringify(regras)),
        detalhesDias,
        calculadoEm: new Date().toISOString()
    };
}

/* ===================================================== */
/* ABRIR PONTO                                           */
/* ===================================================== */

window.abrirPontoFuncionario = function (idx) {
    const func = db.funcionarios[idx];

    if (!func) return;

    garantirEstruturaPonto(func);

    if (func.mesPontoSelecionado === undefined) {
        func.mesPontoSelecionado = new Date().getMonth();
    }

    if (func.anoPontoSelecionado === undefined) {
        func.anoPontoSelecionado = new Date().getFullYear();
    }

    const ano = func.anoPontoSelecionado;
    const mes = func.mesPontoSelecionado;
    const diasMes = new Date(ano, mes + 1, 0).getDate();

    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const mesKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;
    const mesFechado = func.mesesFechados[mesKey] === true;

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

    const resumoAtual = mesFechado && func.fechamentosPonto[mesKey]
        ? func.fechamentosPonto[mesKey]
        : calcularResumoMesPonto(func, ano, mes);

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
                ${escaparHTMLPonto(func.nome)}
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                ${escaparHTMLPonto(func.cargo || '-')}
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

        <button
            class="btn-action"
            style="background:#475569;"
            onclick="abrirFeriadosPonto(${idx})">
            📅 Feriados
        </button>

        <button
            class="btn-action"
            style="background:#0f766e;"
            onclick="abrirRegrasPontoFuncionario(${idx})">
            ⚙ Regras
        </button>

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

    ${mesFechado ? `
        <div style="
            padding:10px 12px;
            background:#eff6ff;
            border:1px solid #bfdbfe;
            border-radius:10px;
            color:#1e40af;
            font-size:12px;
        ">
            🔒 Mês fechado. Os valores financeiros foram congelados com o salário e as regras vigentes no fechamento.
        </div>
    ` : ''}

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
        const data = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        let reg = func.ponto.find(ponto => ponto.data === data);

        if (!reg) {
            reg = {
                data,
                entrada: '',
                almocoSaida: '',
                almocoVolta: '',
                saida: '',
                atraso: '-',
                extra: '-',
                saldoMinutos: 0,
                falta: false,
                faltaJustificada: false
            };

            func.ponto.push(reg);
        }

        const calc = calcularPontoDia(func, reg, data);

        const dataObj = dataObjPonto(data);
        const diaSemana = dataObj.getDay();
        const sabado = diaSemana === 6;
        const domingo = diaSemana === 0;
        const fimDeSemana = sabado || domingo;
        const feriado = feriadoDaDataPonto(func, data);
        const ferias = feriasDaDataPonto(func, data);

        const baseTab = ((dia - 1) * 4);

        let fundo = '';

        if (data === hojeStr) {
            fundo = 'background:#fecaca;';
        }

        if (ferias) {
            fundo = 'background:#f5f3ff;color:#5b21b6;';
        } else if (reg.falta) {
            fundo = reg.faltaJustificada
                ? 'background:#f0fdf4;'
                : 'background:#fef2f2;';
        } else if (feriado) {
            fundo = 'background:#eff6ff;color:#1e3a8a;';
        } else if (fimDeSemana) {
            fundo = 'background:#f9fafb;color:#6b7280;';
        }

        html += `
<tr style="${fundo}">

    <td>
        <div style="font-weight:700;">${String(dia).padStart(2, '0')}</div>
        ${feriado ? `<div style="font-size:9px;color:#2563eb;max-width:90px;">${escaparHTMLPonto(feriado.nome)}</div>` : ''}
    </td>

    <td>
        <input
            type="time"
            tabindex="${baseTab + 1}"
            style="width:95px;padding:4px;font-size:12px;"
            value="${reg.entrada || ''}"
            ${mesFechado || reg.falta || ferias ? 'disabled' : ''}
            onchange="
                salvarPonto(${idx}, '${data}', 'entrada', this.value);
                setTimeout(() => { proximoCampoPonto(this); }, 50);
            ">
    </td>

    <td>
        <input
            type="time"
            tabindex="${baseTab + 2}"
            style="width:95px;padding:4px;font-size:12px;"
            value="${reg.almocoSaida || ''}"
            ${mesFechado || reg.falta || ferias ? 'disabled' : ''}
            onchange="
                salvarPonto(${idx}, '${data}', 'almocoSaida', this.value);
                setTimeout(() => { proximoCampoPonto(this); }, 50);
            ">
    </td>

    <td>
        <input
            type="time"
            tabindex="${baseTab + 3}"
            style="width:95px;padding:4px;font-size:12px;"
            value="${reg.almocoVolta || ''}"
            ${mesFechado || reg.falta || ferias ? 'disabled' : ''}
            onchange="
                salvarPonto(${idx}, '${data}', 'almocoVolta', this.value);
                setTimeout(() => { proximoCampoPonto(this); }, 50);
            ">
    </td>

    <td>
        <input
            type="time"
            tabindex="${baseTab + 4}"
            style="width:95px;padding:4px;font-size:12px;"
            value="${reg.saida || ''}"
            ${mesFechado || reg.falta || ferias ? 'disabled' : ''}
            onchange="
                salvarPonto(${idx}, '${data}', 'saida', this.value);
                setTimeout(() => { proximoCampoPonto(this); }, 50);
            ">
    </td>

    <td style="color:#dc2626;font-weight:bold;">
        ${reg.falta || ferias ? '-' : (reg.atraso || '-')}
    </td>

    <td style="color:#16a34a;font-weight:bold;">
        ${reg.falta || ferias ? '-' : (reg.extra || '-')}
    </td>

    <td>
        ${ferias
            ? `
                <button
                    disabled
                    style="
                        border:none;
                        padding:7px 10px;
                        border-radius:8px;
                        font-size:12px;
                        font-weight:700;
                        background:#ede9fe;
                        color:#5b21b6;
                    ">
                    Férias
                </button>
            `
            : feriado || fimDeSemana
            ? `
                <button
                    disabled
                    style="
                        border:none;
                        padding:7px 10px;
                        border-radius:8px;
                        font-size:12px;
                        font-weight:600;
                        background:#f3f4f6;
                        color:#6b7280;
                    ">
                    ${feriado ? 'Feriado' : 'Folga'}
                </button>
            `
            : `
                <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-start;">
                    <button
                        onclick="toggleFalta(${idx}, '${data}')"
                        ${mesFechado ? 'disabled' : ''}
                        style="
                            border:none;
                            padding:7px 10px;
                            border-radius:8px;
                            cursor:${mesFechado ? 'default' : 'pointer'};
                            font-size:12px;
                            font-weight:600;
                            background:${reg.falta ? '#dc2626' : '#e5e7eb'};
                            color:${reg.falta ? '#fff' : '#111'};
                        ">
                        ${reg.falta ? 'Faltou' : 'Falta'}
                    </button>

                    ${reg.falta ? `
                        <button
                            onclick="toggleFaltaJustificada(${idx}, '${data}')"
                            ${mesFechado ? 'disabled' : ''}
                            style="
                                border:none;
                                padding:4px 7px;
                                border-radius:7px;
                                cursor:${mesFechado ? 'default' : 'pointer'};
                                font-size:9px;
                                font-weight:700;
                                background:${reg.faltaJustificada ? '#16a34a' : '#fef3c7'};
                                color:${reg.faltaJustificada ? '#fff' : '#92400e'};
                            ">
                            ${reg.faltaJustificada ? '✓ Justificada' : 'Justificar'}
                        </button>
                    ` : ''}
                </div>
            `
        }
    </td>

</tr>
`;
    }

    const valores = resumoAtual.valores;

    html += `
            </tbody>
        </table>
    </div>

    <!-- RESUMO FINANCEIRO PRINCIPAL - SOMENTE VALORES -->

    <div style="
        display:grid;
        grid-template-columns:repeat(3,minmax(250px,1fr));
        gap:15px;
    ">

        <div class="content-card">
            <div style="
                color:#6b7280;
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:.04em;
            ">
                Desconto por atrasos
            </div>

            <div style="
                font-size:30px;
                font-weight:800;
                color:#dc2626;
                margin-top:12px;
            ">
                ${formatarMoedaPonto(valores.descontoAtrasos)}
            </div>
        </div>

        <div class="content-card">
            <div style="
                color:#6b7280;
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:.04em;
            ">
                Desconto por faltas
            </div>

            <div style="
                font-size:30px;
                font-weight:800;
                color:#b91c1c;
                margin-top:12px;
            ">
                ${formatarMoedaPonto(valores.descontoFaltasTotal)}
            </div>

            <div style="
                font-size:11px;
                color:#6b7280;
                margin-top:8px;
            ">
                Inclui DSR perdido quando aplicável.
            </div>
        </div>

        <div class="content-card">
            <div style="
                color:#6b7280;
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:.04em;
            ">
                Horas extras a pagar
            </div>

            <div style="
                font-size:30px;
                font-weight:800;
                color:#16a34a;
                margin-top:12px;
            ">
                ${formatarMoedaPonto(valores.extrasPagar)}
            </div>

            <div style="
                font-size:11px;
                color:#6b7280;
                margin-top:8px;
            ">
                Inclui adicionais aplicáveis às horas extras e adicional noturno apurado.
            </div>
        </div>

    </div>

</div>
`;

    configModal({
        title: 'Controle de Ponto',
        body: html,
        width: '98vw',
        maxWidth: '1900px',
        confirmText: 'Salvar',
        onConfirm() {
            closeModal();
        }
    });

    setTimeout(() => {
        const content = document.querySelector('#modal-global .content-card');
        if (content) {
            content.style.width = '98vw';
            content.style.maxWidth = '1900px';
        }
    }, 0);
};

/* ===================================================== */
/* ALTERAR MÊS                                           */
/* ===================================================== */

window.alterarMesPonto = function (idx, direcao) {
    const func = db.funcionarios[idx];

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

/* ===================================================== */
/* PRÓXIMO CAMPO                                         */
/* ===================================================== */

window.proximoCampoPonto = function (elemento) {
    const atual = Number(elemento?.tabIndex || 0);

    if (!atual) return;

    const proximo = document.querySelector(`[tabindex="${atual + 1}"]`);

    if (proximo && !proximo.disabled) {
        proximo.focus();
    }
};

/* ===================================================== */
/* SALVAR PONTO                                          */
/* ===================================================== */

window.salvarPonto = function (idx, data, campo, valor) {
    const func = db.funcionarios[idx];

    garantirEstruturaPonto(func);

    let reg = func.ponto.find(ponto => ponto.data === data);

    if (!reg) {
        reg = {
            data,
            entrada: '',
            almocoSaida: '',
            almocoVolta: '',
            saida: '',
            atraso: '-',
            extra: '-',
            saldoMinutos: 0,
            falta: false,
            faltaJustificada: false
        };

        func.ponto.push(reg);
    }

    reg[campo] = valor;

    calcularPontoDia(func, reg, data);

    save();
};

/* ===================================================== */
/* FALTA                                                 */
/* ===================================================== */

window.toggleFalta = function (idx, data) {
    const func = db.funcionarios[idx];

    garantirEstruturaPonto(func);

    let reg = func.ponto.find(ponto => ponto.data === data);

    if (!reg) {
        reg = {
            data,
            entrada: '',
            almocoSaida: '',
            almocoVolta: '',
            saida: '',
            atraso: '-',
            extra: '-',
            saldoMinutos: 0,
            falta: false,
            faltaJustificada: false
        };

        func.ponto.push(reg);
    }

    reg.falta = !reg.falta;

    if (reg.falta) {
        reg.entrada = '';
        reg.almocoSaida = '';
        reg.almocoVolta = '';
        reg.saida = '';
        reg.atraso = '-';
        reg.extra = '-';
        reg.saldoMinutos = 0;
        reg.faltaJustificada = false;
    } else {
        reg.faltaJustificada = false;
    }

    calcularPontoDia(func, reg, data);

    save();
    abrirPontoFuncionario(idx);
};

window.toggleFaltaJustificada = function (idx, data) {
    const func = db.funcionarios[idx];
    if (!func) return;

    garantirEstruturaPonto(func);

    const reg = func.ponto.find(p => p.data === data);

    if (!reg || !reg.falta) return;

    reg.faltaJustificada = !reg.faltaJustificada;

    save();
    abrirPontoFuncionario(idx);
};

/* ===================================================== */
/* FECHAR MÊS                                            */
/* ===================================================== */

window.fecharMes = async function (idx, mesKey) {
    const confirmar = confirm(
        'Deseja fechar este mês?\n\nOs valores serão congelados com o salário e as regras atuais.'
    );

    if (!confirmar) return;

    const func = db.funcionarios[idx];

    garantirEstruturaPonto(func);

    const [anoTexto, mesTexto] = mesKey.split('-');
    const ano = Number(anoTexto);
    const mesZero = Number(mesTexto) - 1;

    const resumo = calcularResumoMesPonto(func, ano, mesZero);

    func.mesesFechados[mesKey] = true;
    func.fechamentosPonto[mesKey] = {
        ...JSON.parse(JSON.stringify(resumo)),
        fechadoEm: new Date().toISOString()
    };

    await save();
    abrirPontoFuncionario(idx);
};

/* ===================================================== */
/* REABRIR MÊS                                           */
/* ===================================================== */

window.reabrirMes = async function (idx, mesKey) {
    const confirmar = confirm(
        'Deseja reabrir este mês?\n\nO resumo congelado será removido e os valores voltarão a ser recalculados.'
    );

    if (!confirmar) return;

    const func = db.funcionarios[idx];

    garantirEstruturaPonto(func);

    func.mesesFechados[mesKey] = false;
    delete func.fechamentosPonto[mesKey];

    await save();
    abrirPontoFuncionario(idx);
};


/* ===================================================== */
/* CÁLCULO DE EXTRAS EM UM PERÍODO                       */
/* Usado pelo módulo de acerto/rescisão simplificada     */
/* ===================================================== */

window.calcularExtrasPeriodoPonto = function (
    func,
    inicio,
    fim,
    salarioReferencia = null,
    datasPermitidas = null
) {
    if (!func || !inicio || !fim) {
        return {
            valorExtra50: 0,
            valorExtra100: 0,
            valorExtras: 0,
            diasComExtra: []
        };
    }

    garantirEstruturaPonto(func);

    const copia = {
        ...func,
        salario:
            salarioReferencia !== null &&
            salarioReferencia !== undefined
                ? numeroPonto(salarioReferencia)
                : numeroPonto(func.salario),
        horarios: {
            ...(func.horarios || {})
        },
        regrasPonto: {
            ...garantirRegrasPonto(func)
        },
        ponto: func.ponto,
        ferias: func.ferias,
        feriadosPonto: func.feriadosPonto
    };

    let valorExtra50 = 0;
    let valorExtra100 = 0;
    const diasComExtra = [];

    let cursor = dataObjPonto(inicio);
    const limite = dataObjPonto(fim);

    while (cursor <= limite) {
        const data = dataISODataPonto(cursor);
        const reg = (func.ponto || []).find(p => p.data === data);

        const permitido =
            !Array.isArray(datasPermitidas) ||
            datasPermitidas.includes(data);

        if (
            permitido &&
            reg &&
            !reg.falta &&
            !feriasDaDataPonto(func, data)
        ) {
            const calc = calcularPontoDia(copia, { ...reg }, data);

            const v50 = numeroPonto(calc?.valorExtra50);
            const v100 = numeroPonto(calc?.valorExtra100);

            valorExtra50 += v50;
            valorExtra100 += v100;

            if ((v50 + v100) > 0) {
                diasComExtra.push({
                    data,
                    valorExtra50: arredondarPonto(v50),
                    valorExtra100: arredondarPonto(v100),
                    valorTotal: arredondarPonto(v50 + v100)
                });
            }
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return {
        valorExtra50: arredondarPonto(valorExtra50),
        valorExtra100: arredondarPonto(valorExtra100),
        valorExtras: arredondarPonto(valorExtra50 + valorExtra100),
        diasComExtra
    };
};

/* ===================================================== */
/* EXPORTAR PDF                                          */
/* ===================================================== */

window.exportarPontoPDF = function (idx) {
    const func = db.funcionarios[idx];

    if (!func || !func.ponto) {
        alert('Sem registros.');
        return;
    }

    garantirEstruturaPonto(func);

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const ano = func.anoPontoSelecionado;
    const mesZero = func.mesPontoSelecionado;
    const mes = mesZero + 1;
    const diasMes = new Date(ano, mes, 0).getDate();
    const mesKey = `${ano}-${String(mes).padStart(2, '0')}`;

    const resumo = func.mesesFechados[mesKey] && func.fechamentosPonto[mesKey]
        ? func.fechamentosPonto[mesKey]
        : calcularResumoMesPonto(func, ano, mesZero);

    const linhas = [];

    for (let dia = 1; dia <= diasMes; dia++) {
        const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const reg = func.ponto.find(p => p.data === data) || {
            entrada: '',
            almocoSaida: '',
            almocoVolta: '',
            saida: '',
            atraso: '-',
            extra: '-',
            falta: false,
            faltaJustificada: false
        };

        let situacao = '';

        const feriado = feriadoDaDataPonto(func, data);
        const diaSemana = dataObjPonto(data).getDay();

        const ferias = feriasDaDataPonto(func, data);

        if (ferias) {
            situacao = 'Férias';
        } else if (reg.falta) {
            situacao = reg.faltaJustificada ? 'Falta Just.' : 'Falta';
        } else if (feriado) {
            situacao = 'Feriado';
        } else if (diaSemana === 0) {
            situacao = 'Domingo';
        } else if (diaSemana === 6) {
            situacao = 'Sábado';
        }

        linhas.push([
            String(dia).padStart(2, '0'),
            reg.entrada || '-',
            reg.almocoSaida || '-',
            reg.almocoVolta || '-',
            reg.saida || '-',
            reg.atraso || '-',
            reg.extra || '-',
            situacao
        ]);
    }

    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('CONTROLE DE PONTO', 10, 10);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`${String(mes).padStart(2, '0')}/${ano}`, 180, 10);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(func.nome || '-', 10, 21);

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(func.cargo || '-', 10, 25);

    doc.autoTable({
        startY: 27,
        head: [[
            'Dia',
            'Ent.',
            'Alm S',
            'Alm V',
            'Saída',
            'Atr.',
            'Ext.',
            'Situação'
        ]],
        body: linhas,
        theme: 'grid',
        styles: {
            fontSize: 5.7,
            cellPadding: 1.4,
            lineWidth: 0.1,
            minCellHeight: 5.5,
            valign: 'middle',
            halign: 'center',
            overflow: 'hidden'
        },
        headStyles: {
            fillColor: [30, 30, 30],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 5.8
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        margin: {
            left: 8,
            right: 8
        },
        tableWidth: 194,
        rowPageBreak: 'avoid'
    });

    let y = doc.lastAutoTable.finalY + 5;

    if (y > 245) {
        doc.addPage();
        y = 15;
    }

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(8, y, 194, 35, 2, 2, 'F');

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');

    doc.text(
        'RESUMO FINANCEIRO DO PONTO',
        12,
        y + 7
    );

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');

    doc.text(
        'DESCONTO POR ATRASOS',
        12,
        y + 15
    );

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(
        formatarMoedaPonto(resumo.valores.descontoAtrasos),
        12,
        y + 22
    );

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(
        'DESCONTO POR FALTAS',
        76,
        y + 15
    );

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(
        formatarMoedaPonto(resumo.valores.descontoFaltasTotal),
        76,
        y + 22
    );

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(
        'HORAS EXTRAS A PAGAR',
        140,
        y + 15
    );

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(
        formatarMoedaPonto(resumo.valores.extrasPagar),
        140,
        y + 22
    );

    doc.setFont(undefined, 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(90, 90, 90);
    doc.text(
        'Faltas incluem DSR quando aplicável. Extras incluem adicionais noturnos apurados.',
        12,
        y + 30
    );

    const yAssinatura = Math.min(282, y + 52);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(8);
    doc.text('________________________________________', 55, yAssinatura);
    doc.text('Assinatura do Funcionário', 78, yAssinatura + 5);

    doc.save(
        `ponto-${func.nome}-${String(mes).padStart(2, '0')}-${ano}.pdf`
    );
};
