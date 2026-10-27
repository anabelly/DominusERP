/* ========================================================= */
/* DOMINUS ERP - PONTO.JS                                    */
/* ========================================================= */
/*
    CONTROLE DE PONTO DOS FUNCIONÁRIOS

    Este arquivo concentra as regras e cálculos do ponto.

    PRINCIPAIS RESPONSABILIDADES:
    1. Conversão e formatação de horários
    2. Regras padrão do ponto
    3. Integração com férias
    4. Feriados nacionais e personalizados
    5. Configuração de regras por funcionário
    6. Adicional noturno
    7. Cálculo diário de jornada
    8. Horas extras e atrasos
    9. Faltas justificadas e injustificadas
    10. DSR
    11. Resumo mensal
    12. Fechamento e reabertura de mês
    13. Compensação automática diária entre atrasos e horas excedentes
    14. Observações complementares por competência
    15. Exportação do espelho de ponto em PDF em uma única folha

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    Nenhuma regra trabalhista, percentual, horário, cálculo,
    tolerância, campo ou comportamento foi modificado.
*/


/* ========================================================= */
/* 01. PONTO DE FUNCIONÁRIOS                               */
/* ========================================================= */

/* ========================================================= */
/* 02. FUNÇÕES AUXILIARES GERAIS                           */
/* ========================================================= */

/* --------------------------------------------------------- */
/* minutosHoraPonto */
/* Converte horário HH:MM para minutos. */
/* --------------------------------------------------------- */

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

/* --------------------------------------------------------- */
/* formatarMinutosPonto */
/* Converte minutos em HH:MM. */
/* --------------------------------------------------------- */

function formatarMinutosPonto(minutos) {
    minutos = Math.max(
        0,
        Math.round(Number(minutos) || 0)
    );

    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const restantes = String(minutos % 60).padStart(2, '0');

    return `${horas}:${restantes}`;
}

/* --------------------------------------------------------- */
/* formatarMoedaPonto */
/* Formata valores monetários do resumo do ponto. */
/* --------------------------------------------------------- */

function formatarMoedaPonto(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/* --------------------------------------------------------- */
/* numeroPonto */
/* Converte valores para número seguro. */
/* --------------------------------------------------------- */

function numeroPonto(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

/* --------------------------------------------------------- */
/* arredondarPonto */
/* Arredonda valores numéricos. */
/* --------------------------------------------------------- */

function arredondarPonto(valor, casas = 2) {
    const fator = 10 ** casas;
    return Math.round((numeroPonto(valor) + Number.EPSILON) * fator) / fator;
}

/* --------------------------------------------------------- */
/* dataObjPonto */
/* Converte data ISO em objeto Date. */
/* --------------------------------------------------------- */

function dataObjPonto(data) {
    return new Date(`${data}T12:00:00`);
}

/* --------------------------------------------------------- */
/* dataISODataPonto */
/* Converte objeto Date para YYYY-MM-DD. */
/* --------------------------------------------------------- */

function dataISODataPonto(dataObj) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

/* --------------------------------------------------------- */
/* somarDiasPonto */
/* Soma dias a uma data. */
/* --------------------------------------------------------- */

function somarDiasPonto(data, dias) {
    const d = dataObjPonto(data);
    d.setDate(d.getDate() + dias);
    return dataISODataPonto(d);
}

/* --------------------------------------------------------- */
/* normalizarTextoPonto */
/* Normaliza textos para comparações internas. */
/* --------------------------------------------------------- */

function normalizarTextoPonto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/* --------------------------------------------------------- */
/* escaparHTMLPonto */
/* Escapa caracteres especiais antes de inserir no HTML. */
/* --------------------------------------------------------- */

function escaparHTMLPonto(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------- */
/* minutosEntrePonto */
/* Calcula minutos entre dois horários, inclusive virada do dia. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 03. REGRAS PADRÃO DO PONTO                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* regrasPadraoPonto */
/* Retorna as regras padrão usadas no cálculo do ponto. */
/* --------------------------------------------------------- */

function regrasPadraoPonto() {
    return {
        divisorMensal: 220,
        toleranciaMarcacaoMin: 0,
        toleranciaDiaMin: 0,

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

/* --------------------------------------------------------- */
/* garantirRegrasPonto */
/* Garante que o funcionário tenha todas as regras configuradas. */
/* --------------------------------------------------------- */

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

    /*
        REGRA FIXA DA EMPRESA:
        qualquer minuto positivo ou negativo entra no saldo.
        Não aplicar tolerância automática do relógio de ponto.
    */
    func.regrasPonto.toleranciaMarcacaoMin = 0;
    func.regrasPonto.toleranciaDiaMin = 0;

    return func.regrasPonto;
}

/* --------------------------------------------------------- */
/* garantirEstruturaPonto */
/* Garante arrays e objetos necessários ao controle de ponto. */
/* --------------------------------------------------------- */

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

    /*
        Observações complementares do espelho de ponto, separadas
        por competência no formato AAAA-MM.
    */
    if (!func.observacoesPonto || typeof func.observacoesPonto !== 'object') {
        func.observacoesPonto = {};
    }

    if (!Array.isArray(func.feriadosPonto)) {
        func.feriadosPonto = [];
    }

    if (!Array.isArray(func.ferias)) {
        func.ferias = [];
    }

    /*
        Compatibilidade com registros antigos:
        toda falta pode armazenar um texto de justificativa.
    */

    (func.ponto || []).forEach(reg => {

        if (
            typeof reg.justificativaFalta !==
            'string'
        ) {
            reg.justificativaFalta = '';
        }
    });

    garantirRegrasPonto(func);
}


/* ========================================================= */
/* 04. INTEGRAÇÃO COM FÉRIAS                               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* feriasDaDataPonto */
/* Verifica se determinada data está dentro de férias registradas. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 05. FERIADOS                                             */
/* ========================================================= */
/*
    CALENDÁRIO AUTOMÁTICO DO PONTO

    O sistema monta automaticamente, a cada ano:

    - feriados nacionais do Brasil;
    - Paixão de Cristo, calculada pela Páscoa;
    - Data Magna do Rio Grande do Sul - 20 de setembro.

    A empresa pode, pela própria tela:

    - alterar qualquer feriado automático;
    - excluir/desativar um feriado automático;
    - restaurar o feriado original;
    - cadastrar feriados municipais ou internos;
    - alterar/excluir feriados manuais.

    As alterações são salvas em db.feriadosPontoEmpresa
    e valem para todos os funcionários.
*/


/* --------------------------------------------------------- */
/* garantirCalendarioFeriadosEmpresaPonto                    */
/* Garante a estrutura persistente global do calendário.     */
/* --------------------------------------------------------- */

function garantirCalendarioFeriadosEmpresaPonto() {

    if (
        !db.feriadosPontoEmpresa
        ||
        typeof db.feriadosPontoEmpresa !==
            'object'
    ) {

        db.feriadosPontoEmpresa = {

            versao:
                1,

            overrides:
                [],

            adicionais:
                []
        };
    }

    if (
        !Array.isArray(
            db.feriadosPontoEmpresa.overrides
        )
    ) {

        db.feriadosPontoEmpresa.overrides =
            [];
    }

    if (
        !Array.isArray(
            db.feriadosPontoEmpresa.adicionais
        )
    ) {

        db.feriadosPontoEmpresa.adicionais =
            [];
    }

    /*
        MIGRAÇÃO DE COMPATIBILIDADE

        Versões antigas guardavam feriados manuais em
        func.feriadosPonto. Se houver algum, ele é trazido
        uma única vez para o calendário global da empresa.
    */

    const adicionais =
        db.feriadosPontoEmpresa
            .adicionais;

    (db.funcionarios || [])
        .forEach(
            func => {

                if (
                    !Array.isArray(
                        func.feriadosPonto
                    )
                ) {

                    return;
                }

                func.feriadosPonto
                    .forEach(
                        item => {

                            if (
                                !item?.data
                            ) {

                                return;
                            }

                            const existe =
                                adicionais.some(
                                    feriado =>
                                        feriado.data ===
                                            item.data
                                        &&
                                        normalizarTextoPonto(
                                            feriado.nome || ''
                                        )
                                        ===
                                        normalizarTextoPonto(
                                            item.nome || ''
                                        )
                                );

                            if (!existe) {

                                adicionais.push({

                                    id:
                                        `migrado-${Date.now()}-${Math.random()
                                            .toString(36)
                                            .slice(2,8)}`,

                                    data:
                                        item.data,

                                    nome:
                                        item.nome
                                        ||
                                        'Feriado / folga da empresa',

                                    origem:
                                        'manual',

                                    criadoEm:
                                        new Date()
                                            .toISOString()
                                });
                            }
                        }
                    );
            }
        );

    return db.feriadosPontoEmpresa;
}


/* --------------------------------------------------------- */
/* calcularPascoaPonto                                       */
/* Algoritmo gregoriano de Meeus/Jones/Butcher.              */
/* --------------------------------------------------------- */

function calcularPascoaPonto(
    ano
) {

    const a =
        ano % 19;

    const b =
        Math.floor(
            ano / 100
        );

    const c =
        ano % 100;

    const d =
        Math.floor(
            b / 4
        );

    const e =
        b % 4;

    const f =
        Math.floor(
            (b + 8) / 25
        );

    const g =
        Math.floor(
            (b - f + 1) / 3
        );

    const h =
        (
            19 * a
            +
            b
            -
            d
            -
            g
            +
            15
        ) % 30;

    const i =
        Math.floor(
            c / 4
        );

    const k =
        c % 4;

    const l =
        (
            32
            +
            2 * e
            +
            2 * i
            -
            h
            -
            k
        ) % 7;

    const m =
        Math.floor(
            (
                a
                +
                11 * h
                +
                22 * l
            )
            / 451
        );

    const mes =
        Math.floor(
            (
                h
                +
                l
                -
                7 * m
                +
                114
            )
            / 31
        );

    const dia =
        (
            (
                h
                +
                l
                -
                7 * m
                +
                114
            )
            % 31
        )
        +
        1;

    return new Date(
        ano,
        mes - 1,
        dia,
        12,
        0,
        0,
        0
    );
}


/* --------------------------------------------------------- */
/* feriadosAutomaticosRSPonto                               */
/* Gera a base automática Brasil + Rio Grande do Sul.        */
/* --------------------------------------------------------- */

function feriadosAutomaticosRSPonto(
    ano
) {

    const pascoa =
        calcularPascoaPonto(
            ano
        );

    const sextaPaixao =
        new Date(
            pascoa
        );

    sextaPaixao.setDate(
        sextaPaixao.getDate() - 2
    );

    const dataSextaPaixao =
        dataISODataPonto(
            sextaPaixao
        );

    return [

        {
            chave:
                'br-confraternizacao',

            data:
                `${ano}-01-01`,

            nome:
                'Confraternização Universal',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-paixao-cristo',

            data:
                dataSextaPaixao,

            nome:
                'Paixão de Cristo',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-tiradentes',

            data:
                `${ano}-04-21`,

            nome:
                'Tiradentes',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-trabalho',

            data:
                `${ano}-05-01`,

            nome:
                'Dia do Trabalho',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-independencia',

            data:
                `${ano}-09-07`,

            nome:
                'Independência do Brasil',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'rs-data-magna',

            data:
                `${ano}-09-20`,

            nome:
                'Data Magna do Rio Grande do Sul',

            origem:
                'estadual_rs',

            automatico:
                true
        },

        {
            chave:
                'br-aparecida',

            data:
                `${ano}-10-12`,

            nome:
                'Nossa Senhora Aparecida',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-finados',

            data:
                `${ano}-11-02`,

            nome:
                'Finados',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-republica',

            data:
                `${ano}-11-15`,

            nome:
                'Proclamação da República',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-consciencia-negra',

            data:
                `${ano}-11-20`,

            nome:
                'Dia Nacional de Zumbi e da Consciência Negra',

            origem:
                'nacional',

            automatico:
                true
        },

        {
            chave:
                'br-natal',

            data:
                `${ano}-12-25`,

            nome:
                'Natal',

            origem:
                'nacional',

            automatico:
                true
        }

    ];
}


/*
    Mantida por compatibilidade com chamadas antigas.
*/

function feriadosNacionaisFixosPonto(
    ano
) {

    return feriadosAutomaticosRSPonto(
        ano
    );
}


/* --------------------------------------------------------- */
/* idOverrideFeriadoPonto                                    */
/* Identifica uma alteração de feriado automático por ano.   */
/* --------------------------------------------------------- */

function idOverrideFeriadoPonto(
    ano,
    chave
) {

    return (
        `${ano}|${chave}`
    );
}


/* --------------------------------------------------------- */
/* obterCalendarioFeriadosPonto                              */
/* Aplica alterações/exclusões sobre o calendário automático.*/
/* --------------------------------------------------------- */

function obterCalendarioFeriadosPonto(
    ano,
    incluirExcluidos = false
) {

    const config =
        garantirCalendarioFeriadosEmpresaPonto();

    const automaticos =
        feriadosAutomaticosRSPonto(
            ano
        )
        .map(
            base => {

                const idOverride =
                    idOverrideFeriadoPonto(
                        ano,
                        base.chave
                    );

                const override =
                    config.overrides.find(
                        item =>
                            item.id ===
                            idOverride
                    );

                if (
                    override?.excluido ===
                    true
                ) {

                    if (
                        !incluirExcluidos
                    ) {

                        return null;
                    }

                    return {

                        ...base,

                        data:
                            override.data
                            ||
                            base.data,

                        nome:
                            override.nome
                            ||
                            base.nome,

                        id:
                            idOverride,

                        idOverride,

                        excluido:
                            true,

                        alterado:
                            true
                    };
                }

                return {

                    ...base,

                    data:
                        override?.data
                        ||
                        base.data,

                    nome:
                        override?.nome
                        ||
                        base.nome,

                    id:
                        idOverride,

                    idOverride,

                    excluido:
                        false,

                    alterado:
                        !!override
                };
            }
        )
        .filter(Boolean);

    const manuais =
        config.adicionais
            .filter(
                item =>
                    String(
                        item.data || ''
                    ).startsWith(
                        `${ano}-`
                    )
            )
            .map(
                item => ({

                    ...item,

                    automatico:
                        false,

                    origem:
                        item.origem
                        ||
                        'manual',

                    excluido:
                        false,

                    alterado:
                        false
                })
            );

    return [
        ...automaticos,
        ...manuais
    ]
    .sort(
        (a, b) => {

            const dataCompare =
                String(
                    a.data || ''
                )
                .localeCompare(
                    String(
                        b.data || ''
                    )
                );

            if (dataCompare !== 0) {
                return dataCompare;
            }

            return String(
                a.nome || ''
            )
            .localeCompare(
                String(
                    b.nome || ''
                )
            );
        }
    );
}


/* --------------------------------------------------------- */
/* obterFeriadosCustomizadosEmpresaPonto                     */
/* Compatibilidade: retorna somente os feriados manuais.     */
/* --------------------------------------------------------- */

window.obterFeriadosCustomizadosEmpresaPonto =
function () {

    const config =
        garantirCalendarioFeriadosEmpresaPonto();

    return [
        ...config.adicionais
    ]
    .sort(
        (a, b) =>
            String(
                a.data || ''
            )
            .localeCompare(
                String(
                    b.data || ''
                )
            )
    );
};


/* --------------------------------------------------------- */
/* feriadoDaDataPonto                                        */
/* Verifica a data no calendário efetivo Brasil + RS.        */
/* --------------------------------------------------------- */

function feriadoDaDataPonto(
    func,
    data
) {

    const ano =
        Number(
            String(
                data
            ).slice(
                0,
                4
            )
        );

    const calendario =
        obterCalendarioFeriadosPonto(
            ano,
            false
        );

    return calendario.find(
        item =>
            item.data ===
            data
    )
    ||
    null;
}


/* --------------------------------------------------------- */
/* nomeOrigemFeriadoPonto                                    */
/* Texto amigável da origem do feriado.                      */
/* --------------------------------------------------------- */

function nomeOrigemFeriadoPonto(
    item
) {

    if (
        item.origem ===
        'estadual_rs'
    ) {

        return 'Rio Grande do Sul';
    }

    if (
        item.origem ===
        'nacional'
    ) {

        return 'Nacional';
    }

    return 'Cadastrado';
}


/* --------------------------------------------------------- */
/* badgeOrigemFeriadoPonto                                   */
/* Badge visual da origem.                                   */
/* --------------------------------------------------------- */

function badgeOrigemFeriadoPonto(
    item
) {

    const origem =
        nomeOrigemFeriadoPonto(
            item
        );

    let fundo =
        '#f1f5f9';

    let cor =
        '#475569';

    if (
        item.origem ===
        'nacional'
    ) {

        fundo =
            '#eff6ff';

        cor =
            '#1d4ed8';
    }

    else if (
        item.origem ===
        'estadual_rs'
    ) {

        fundo =
            '#f0fdf4';

        cor =
            '#15803d';
    }

    return `

        <span style="
            display:inline-flex;
            align-items:center;
            padding:4px 8px;
            border-radius:999px;
            background:${fundo};
            color:${cor};
            font-size:10px;
            font-weight:800;
            white-space:nowrap;
        ">
            ${escaparHTMLPonto(origem)}
        </span>

    `;
}


/* --------------------------------------------------------- */
/* abrirFeriadosPonto                                        */
/* Gerenciamento completo do calendário do ponto.            */
/* --------------------------------------------------------- */

window.abrirFeriadosPonto =
function (
    idx,
    anoSelecionado = null
) {

    const func =
        db.funcionarios[idx];

    if (!func) {
        return;
    }

    garantirEstruturaPonto(
        func
    );

    garantirCalendarioFeriadosEmpresaPonto();

    const anoAtual =
        new Date()
            .getFullYear();

    const ano =
        Number(
            anoSelecionado
            ??
            window.anoFeriadosPontoSelecionado
            ??
            func.anoPontoSelecionado
            ??
            anoAtual
        );

    window.anoFeriadosPontoSelecionado =
        ano;

    const calendario =
        obterCalendarioFeriadosPonto(
            ano,
            true
        );

    const ativos =
        calendario.filter(
            item =>
                !item.excluido
        ).length;

    const excluidos =
        calendario.filter(
            item =>
                item.excluido
        ).length;

    const manuais =
        calendario.filter(
            item =>
                !item.automatico
        ).length;

    const linhas =
        calendario.length
            ?
            calendario.map(
                item => {

                    const dataBR =
                        item.data
                            ?
                            item.data
                                .split('-')
                                .reverse()
                                .join('/')
                            :
                            '-';

                    const estiloLinha =
                        item.excluido
                            ?
                            'opacity:.48;background:#f8fafc;'
                            :
                            '';

                    const status =
                        item.excluido
                            ?
                            `
                                <span style="
                                    display:inline-flex;
                                    padding:4px 8px;
                                    border-radius:999px;
                                    background:#fee2e2;
                                    color:#b91c1c;
                                    font-size:10px;
                                    font-weight:800;
                                ">
                                    Excluído
                                </span>
                            `
                            :
                            item.alterado
                                ?
                                `
                                    <span style="
                                        display:inline-flex;
                                        padding:4px 8px;
                                        border-radius:999px;
                                        background:#fef3c7;
                                        color:#92400e;
                                        font-size:10px;
                                        font-weight:800;
                                    ">
                                        Alterado
                                    </span>
                                `
                                :
                                `
                                    <span style="
                                        display:inline-flex;
                                        padding:4px 8px;
                                        border-radius:999px;
                                        background:#dcfce7;
                                        color:#166534;
                                        font-size:10px;
                                        font-weight:800;
                                    ">
                                        Ativo
                                    </span>
                                `;

                    let acoes =
                        '';

                    if (
                        item.automatico
                    ) {

                        if (
                            item.excluido
                        ) {

                            acoes = `

                                <button
                                    type="button"
                                    class="btn-action"
                                    style="
                                        background:#16a34a;
                                        padding:6px 9px;
                                        font-size:10px;
                                    "
                                    onclick="restaurarFeriadoAutomaticoPonto(${idx}, '${item.idOverride}', ${ano})">

                                    ↩ Restaurar

                                </button>

                            `;
                        }

                        else {

                            acoes = `

                                <button
                                    type="button"
                                    class="btn-action"
                                    style="
                                        background:#f59e0b;
                                        padding:6px 9px;
                                        font-size:10px;
                                    "
                                    onclick="editarFeriadoPonto(${idx}, 'automatico', '${item.idOverride}', ${ano})">

                                    ✏ Alterar

                                </button>

                                <button
                                    type="button"
                                    class="btn-del"
                                    style="
                                        padding:6px 9px;
                                        font-size:10px;
                                    "
                                    onclick="excluirFeriadoPonto(${idx}, 'automatico', '${item.idOverride}', ${ano})">

                                    Excluir

                                </button>

                                ${
                                    item.alterado
                                        ?
                                        `
                                            <button
                                                type="button"
                                                class="btn-action"
                                                style="
                                                    background:#64748b;
                                                    padding:6px 9px;
                                                    font-size:10px;
                                                "
                                                onclick="restaurarFeriadoAutomaticoPonto(${idx}, '${item.idOverride}', ${ano})">

                                                Padrão

                                            </button>
                                        `
                                        :
                                        ''
                                }

                            `;
                        }
                    }

                    else {

                        acoes = `

                            <button
                                type="button"
                                class="btn-action"
                                style="
                                    background:#f59e0b;
                                    padding:6px 9px;
                                    font-size:10px;
                                "
                                onclick="editarFeriadoPonto(${idx}, 'manual', '${item.id}', ${ano})">

                                ✏ Alterar

                            </button>

                            <button
                                type="button"
                                class="btn-del"
                                style="
                                    padding:6px 9px;
                                    font-size:10px;
                                "
                                onclick="excluirFeriadoPonto(${idx}, 'manual', '${item.id}', ${ano})">

                                Excluir

                            </button>

                        `;
                    }

                    return `

                        <tr style="${estiloLinha}">

                            <td style="
                                padding:10px;
                                border-bottom:1px solid #e5e7eb;
                                white-space:nowrap;
                            ">
                                ${escaparHTMLPonto(dataBR)}
                            </td>

                            <td style="
                                padding:10px;
                                border-bottom:1px solid #e5e7eb;
                            ">
                                <strong>
                                    ${escaparHTMLPonto(
                                        item.nome || '-'
                                    )}
                                </strong>
                            </td>

                            <td style="
                                padding:10px;
                                border-bottom:1px solid #e5e7eb;
                            ">
                                ${badgeOrigemFeriadoPonto(item)}
                            </td>

                            <td style="
                                padding:10px;
                                border-bottom:1px solid #e5e7eb;
                            ">
                                ${status}
                            </td>

                            <td style="
                                padding:10px;
                                border-bottom:1px solid #e5e7eb;
                                text-align:right;
                            ">

                                <div style="
                                    display:flex;
                                    justify-content:flex-end;
                                    gap:5px;
                                    flex-wrap:wrap;
                                ">
                                    ${acoes}
                                </div>

                            </td>

                        </tr>

                    `;
                }
            )
            .join('')
            :
            `
                <tr>
                    <td
                        colspan="5"
                        style="
                            padding:28px;
                            text-align:center;
                            color:#6b7280;
                        ">
                        Nenhum feriado encontrado para ${ano}.
                    </td>
                </tr>
            `;

    const html = `

        <div style="
            display:flex;
            flex-direction:column;
            gap:16px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                flex-wrap:wrap;
            ">

                <div>

                    <div style="
                        font-size:18px;
                        font-weight:900;
                        color:#111827;
                    ">
                        Calendário ${ano}
                    </div>

                    <div style="
                        margin-top:3px;
                        color:#64748b;
                        font-size:11px;
                    ">
                        Brasil + Rio Grande do Sul
                    </div>

                </div>

                <div style="
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                ">

                    <button
                        type="button"
                        class="btn-action"
                        style="
                            background:#64748b;
                            padding:7px 10px;
                        "
                        onclick="abrirFeriadosPonto(${idx}, ${ano - 1})">

                        ← ${ano - 1}

                    </button>

                    <button
                        type="button"
                        class="btn-action"
                        style="
                            background:#2563eb;
                            padding:7px 10px;
                        "
                        onclick="abrirFeriadosPonto(${idx}, ${anoAtual})">

                        Ano atual

                    </button>

                    <button
                        type="button"
                        class="btn-action"
                        style="
                            background:#64748b;
                            padding:7px 10px;
                        "
                        onclick="abrirFeriadosPonto(${idx}, ${ano + 1})">

                        ${ano + 1} →

                    </button>

                </div>

            </div>


            <div style="
                padding:13px 15px;
                border-radius:12px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                color:#1e3a8a;
                font-size:11px;
                line-height:1.55;
            ">

                O calendário é preenchido automaticamente com os
                feriados nacionais e com a Data Magna do Rio Grande
                do Sul. Você pode alterar ou excluir qualquer data
                automática e também cadastrar feriados municipais
                ou folgas adotadas pela empresa.

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(3,minmax(0,1fr));
                gap:10px;
            ">

                <div style="
                    padding:12px;
                    border-radius:10px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                ">

                    <div style="
                        color:#64748b;
                        font-size:9px;
                        font-weight:800;
                        text-transform:uppercase;
                    ">
                        Ativos
                    </div>

                    <div style="
                        margin-top:4px;
                        font-size:19px;
                        font-weight:900;
                    ">
                        ${ativos}
                    </div>

                </div>

                <div style="
                    padding:12px;
                    border-radius:10px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                ">

                    <div style="
                        color:#64748b;
                        font-size:9px;
                        font-weight:800;
                        text-transform:uppercase;
                    ">
                        Cadastrados
                    </div>

                    <div style="
                        margin-top:4px;
                        font-size:19px;
                        font-weight:900;
                    ">
                        ${manuais}
                    </div>

                </div>

                <div style="
                    padding:12px;
                    border-radius:10px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                ">

                    <div style="
                        color:#64748b;
                        font-size:9px;
                        font-weight:800;
                        text-transform:uppercase;
                    ">
                        Excluídos
                    </div>

                    <div style="
                        margin-top:4px;
                        font-size:19px;
                        font-weight:900;
                    ">
                        ${excluidos}
                    </div>

                </div>

            </div>


            <div style="
                padding:14px;
                border:1px solid #e5e7eb;
                border-radius:12px;
                background:#fff;
            ">

                <div style="
                    margin-bottom:10px;
                    font-size:12px;
                    font-weight:900;
                ">
                    + Cadastrar feriado
                </div>

                <div style="
                    display:grid;
                    grid-template-columns:
                        180px
                        minmax(240px,1fr)
                        auto;
                    gap:10px;
                    align-items:end;
                ">

                    <div>

                        <label>
                            Data
                        </label>

                        <input
                            id="ponto-feriado-data"
                            type="date"
                            value="${ano}-01-01">

                    </div>

                    <div>

                        <label>
                            Descrição
                        </label>

                        <input
                            id="ponto-feriado-nome"
                            placeholder="Ex.: Feriado municipal">

                    </div>

                    <button
                        type="button"
                        class="btn-action"
                        style="
                            background:#16a34a;
                            height:42px;
                        "
                        onclick="adicionarFeriadoPonto(${idx}, ${ano})">

                        + Cadastrar

                    </button>

                </div>

            </div>


            <div style="
                overflow:auto;
                border:1px solid #e5e7eb;
                border-radius:12px;
            ">

                <table style="
                    width:100%;
                    min-width:760px;
                ">

                    <thead>

                        <tr>

                            <th>
                                Data
                            </th>

                            <th>
                                Feriado
                            </th>

                            <th>
                                Origem
                            </th>

                            <th>
                                Status
                            </th>

                            <th style="
                                text-align:right;
                            ">
                                Ações
                            </th>

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

        title:
            '📅 Feriados do Ponto',

        body:
            html,

        size:
            'large',

        confirmText:
            'Voltar ao Ponto',

        onConfirm() {

            abrirPontoFuncionario(
                idx
            );
        }
    });
};


/* --------------------------------------------------------- */
/* adicionarFeriadoPonto                                     */
/* Cadastra um feriado manual da empresa.                    */
/* --------------------------------------------------------- */

window.adicionarFeriadoPonto =
async function (
    idx,
    anoTela = null
) {

    const data =
        document
            .getElementById(
                'ponto-feriado-data'
            )
            ?.value
        ||
        '';

    const nome =
        document
            .getElementById(
                'ponto-feriado-nome'
            )
            ?.value
            .trim()
        ||
        '';

    if (!data) {

        alert(
            'Informe a data do feriado.'
        );

        return;
    }

    if (!nome) {

        alert(
            'Informe a descrição do feriado.'
        );

        return;
    }

    const ano =
        Number(
            String(data)
                .slice(
                    0,
                    4
                )
        );

    const config =
        garantirCalendarioFeriadosEmpresaPonto();

    const calendarioAtivo =
        obterCalendarioFeriadosPonto(
            ano,
            false
        );

    const jaExisteNaData =
        calendarioAtivo.find(
            item =>
                item.data ===
                data
        );

    if (jaExisteNaData) {

        alert(
            `Já existe um feriado ativo em ${data.split('-').reverse().join('/')}:\n\n` +
            `${jaExisteNaData.nome}\n\n` +
            'Use o botão Alterar nesse registro.'
        );

        return;
    }

    config.adicionais.push({

        id:
            `manual-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2,8)}`,

        data,

        nome,

        origem:
            'manual',

        criadoEm:
            new Date()
                .toISOString()
    });

    await save();

    abrirFeriadosPonto(
        idx,
        anoTela
        ??
        ano
    );
};


/* --------------------------------------------------------- */
/* editarFeriadoPonto                                        */
/* Edita feriado automático ou cadastrado manualmente.       */
/* --------------------------------------------------------- */

window.editarFeriadoPonto =
function (
    idx,
    tipo,
    id,
    ano
) {

    const config =
        garantirCalendarioFeriadosEmpresaPonto();

    let item =
        null;

    if (
        tipo ===
        'automatico'
    ) {

        item =
            obterCalendarioFeriadosPonto(
                ano,
                true
            )
            .find(
                feriado =>
                    feriado.idOverride ===
                    id
            );
    }

    else {

        item =
            config.adicionais.find(
                feriado =>
                    feriado.id ===
                    id
            );
    }

    if (!item) {

        alert(
            'Feriado não encontrado.'
        );

        return;
    }

    const html = `

        <div style="
            display:grid;
            grid-template-columns:
                180px
                minmax(240px,1fr);
            gap:12px;
        ">

            <div>

                <label>
                    Data
                </label>

                <input
                    id="editar-feriado-data"
                    type="date"
                    value="${escaparHTMLPonto(
                        item.data || ''
                    )}">

            </div>

            <div>

                <label>
                    Descrição
                </label>

                <input
                    id="editar-feriado-nome"
                    value="${escaparHTMLPonto(
                        item.nome || ''
                    )}">

            </div>

            ${
                tipo === 'automatico'
                    ?
                    `
                        <div style="
                            grid-column:1 / -1;
                            padding:11px 13px;
                            border-radius:10px;
                            background:#fffbeb;
                            border:1px solid #fde68a;
                            color:#854d0e;
                            font-size:11px;
                            line-height:1.5;
                        ">
                            Este é um feriado automático.
                            A alteração vale somente para ${ano}.
                            O botão "Padrão" restaura a data e o nome originais.
                        </div>
                    `
                    :
                    ''
            }

        </div>
    `;

    configModal({

        title:
            '✏ Alterar Feriado',

        body:
            html,

        confirmText:
            'Salvar Alteração',

        onConfirm:
        async function () {

            const novaData =
                document
                    .getElementById(
                        'editar-feriado-data'
                    )
                    ?.value
                ||
                '';

            const novoNome =
                document
                    .getElementById(
                        'editar-feriado-nome'
                    )
                    ?.value
                    .trim()
                ||
                '';

            if (
                !novaData
                ||
                !novoNome
            ) {

                alert(
                    'Preencha a data e a descrição.'
                );

                return;
            }

            if (
                tipo ===
                'automatico'
            ) {

                const existente =
                    config.overrides.find(
                        override =>
                            override.id ===
                            id
                    );

                if (existente) {

                    existente.data =
                        novaData;

                    existente.nome =
                        novoNome;

                    existente.excluido =
                        false;

                    existente.alteradoEm =
                        new Date()
                            .toISOString();
                }

                else {

                    const chave =
                        id.split('|')
                            .slice(1)
                            .join('|');

                    config.overrides.push({

                        id,

                        ano,

                        chave,

                        data:
                            novaData,

                        nome:
                            novoNome,

                        excluido:
                            false,

                        alteradoEm:
                            new Date()
                                .toISOString()
                    });
                }
            }

            else {

                const manual =
                    config.adicionais.find(
                        feriado =>
                            feriado.id ===
                            id
                    );

                if (manual) {

                    manual.data =
                        novaData;

                    manual.nome =
                        novoNome;

                    manual.alteradoEm =
                        new Date()
                            .toISOString();
                }
            }

            await save();

            abrirFeriadosPonto(
                idx,
                ano
            );
        }
    });
};


/* --------------------------------------------------------- */
/* excluirFeriadoPonto                                       */
/* Automático: desativa. Manual: remove do cadastro.         */
/* --------------------------------------------------------- */

window.excluirFeriadoPonto =
async function (
    idx,
    tipo,
    id,
    ano
) {

    const config =
        garantirCalendarioFeriadosEmpresaPonto();

    if (
        tipo ===
        'automatico'
    ) {

        const item =
            obterCalendarioFeriadosPonto(
                ano,
                true
            )
            .find(
                feriado =>
                    feriado.idOverride ===
                    id
            );

        if (!item) {
            return;
        }

        if (
            !confirm(
                `Deseja excluir "${item.nome}" do calendário de ${ano}?\n\n` +
                'Ele poderá ser restaurado depois.'
            )
        ) {

            return;
        }

        let override =
            config.overrides.find(
                feriado =>
                    feriado.id ===
                    id
            );

        if (!override) {

            const chave =
                id.split('|')
                    .slice(1)
                    .join('|');

            override = {

                id,

                ano,

                chave,

                data:
                    item.data,

                nome:
                    item.nome,

                excluido:
                    true,

                alteradoEm:
                    new Date()
                        .toISOString()
            };

            config.overrides.push(
                override
            );
        }

        else {

            override.excluido =
                true;

            override.alteradoEm =
                new Date()
                    .toISOString();
        }
    }

    else {

        const manual =
            config.adicionais.find(
                feriado =>
                    feriado.id ===
                    id
            );

        if (!manual) {
            return;
        }

        if (
            !confirm(
                `Deseja excluir "${manual.nome}"?`
            )
        ) {

            return;
        }

        config.adicionais =
            config.adicionais.filter(
                feriado =>
                    feriado.id !==
                    id
            );
    }

    await save();

    abrirFeriadosPonto(
        idx,
        ano
    );
};


/* --------------------------------------------------------- */
/* restaurarFeriadoAutomaticoPonto                           */
/* Remove override e volta ao calendário automático original.*/
/* --------------------------------------------------------- */

window.restaurarFeriadoAutomaticoPonto =
async function (
    idx,
    id,
    ano
) {

    const config =
        garantirCalendarioFeriadosEmpresaPonto();

    config.overrides =
        config.overrides.filter(
            item =>
                item.id !==
                id
        );

    await save();

    abrirFeriadosPonto(
        idx,
        ano
    );
};


/* ========================================================= */
/* 06. CONFIGURAÇÃO DAS REGRAS DO PONTO                    */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirRegrasPontoFuncionario */
/* Abre a configuração das regras de ponto do funcionário. */
/* --------------------------------------------------------- */

window.abrirRegrasPontoFuncionario = function (idx) {
    const func = db.funcionarios[idx];
    if (!func) return;

    garantirEstruturaPonto(func);

    const r = garantirRegrasPonto(func);

    const html = `
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">

            <div style="grid-column:1 / -1;padding:12px 14px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;color:#854d0e;font-size:12px;line-height:1.5;">
                Regra da empresa: o saldo é apurado desde o primeiro minuto, sem tolerância automática.
                Assim, 1 minuto além da jornada entra como hora extra e 1 minuto abaixo da jornada entra como saldo negativo/desconto.
                A distribuição 50% / 100% segue a planilha-base: dias úteis com as primeiras 2h extras a 50% e excedente a 100%;
                sábado com as primeiras 4h a 50% e excedente a 100%; domingo e feriado a 100% quando não houver folga compensatória.
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
                <label>Tolerância por marcação (fixa)</label>
                <input id="reg-tolerancia-marcacao" type="number" value="0" disabled>
            </div>

            <div>
                <label>Tolerância máxima no dia (fixa)</label>
                <input id="reg-tolerancia-dia" type="number" value="0" disabled>
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
                toleranciaMarcacaoMin: 0,
                toleranciaDiaMin: 0,

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

/* ========================================================= */
/* 07. ADICIONAL NOTURNO                                   */
/* ========================================================= */

/* --------------------------------------------------------- */
/* sobreposicaoPonto */
/* Calcula a sobreposição entre intervalos de tempo. */
/* --------------------------------------------------------- */

function sobreposicaoPonto(inicio1, fim1, inicio2, fim2) {
    return Math.max(0, Math.min(fim1, fim2) - Math.max(inicio1, inicio2));
}

/* --------------------------------------------------------- */
/* minutosNoturnosIntervaloPonto */
/* Calcula minutos trabalhados dentro da faixa noturna. */
/* --------------------------------------------------------- */

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

/* --------------------------------------------------------- */
/* minutosTrabalhadosENoturnosPonto */
/* Calcula jornada total e minutos noturnos. */
/* --------------------------------------------------------- */

function minutosTrabalhadosENoturnosPonto(reg, exigirQuatroMarcacoes, regras) {
    const entrada = minutosHoraPonto(reg.entrada);
    const almocoSaida = minutosHoraPonto(reg.almocoSaida);
    const almocoVolta = minutosHoraPonto(reg.almocoVolta);
    const saida = minutosHoraPonto(reg.saida);

    const possuiAlguma = [entrada, almocoSaida, almocoVolta, saida]
        .some(v => v !== null);

    /*
        DIAS ÚTEIS COM JORNADA PADRÃO

        A apuração é feita por períodos independentes:
        - manhã: Entrada -> Saída Almoço
        - tarde: Volta Almoço -> Saída

        Se existir pelo menos uma marcação no dia e faltar uma das
        marcações de um período, aquele período é considerado NÃO
        TRABALHADO. Assim, uma marcação parcial permite calcular o
        atraso sem transformar dias totalmente vazios em atraso.

        Exemplos:
        - somente Volta Almoço + Saída preenchidos:
          manhã = 0 minuto trabalhado;
        - somente Entrada + Saída Almoço preenchidos:
          tarde = 0 minuto trabalhado;
        - nenhuma marcação em dia útil normal:
          o dia permanece sem atraso e sem hora extra.
    */
    if (exigirQuatroMarcacoes) {
        /*
            JORNADA CONTÍNUA SEM MARCAÇÃO DE ALMOÇO

            Quando Entrada e Saída estiverem preenchidas e AMBAS as
            marcações do almoço estiverem vazias, contabilizamos todo o
            intervalo como tempo trabalhado. Não descontamos o almoço
            presumido; o saldo positivo diante da jornada esperada entra
            nas horas extras pelo cálculo diário já existente.

            Exemplo (jornada padrão 07:45–12:00 / 13:30–18:00):
            07:45 até 18:00 sem pausa = 10h15 trabalhadas;
            jornada esperada = 8h45; saldo = 1h30 extra.

            Se apenas UMA marcação do almoço faltar, permanece a regra
            original de períodos independentes e marcações incompletas.
        */
        if (
            entrada !== null &&
            saida !== null &&
            almocoSaida === null &&
            almocoVolta === null
        ) {
            const periodoContinuo = minutosEntrePonto(entrada, saida);
            if (periodoContinuo !== null && periodoContinuo <= 1440) {
                return {
                    completo: true,
                    vazio: false,
                    minutos: Math.max(0, periodoContinuo),
                    noturnos: Math.max(0, minutosNoturnosIntervaloPonto(entrada, saida, regras)),
                    marcacoesIncompletas: false
                };
            }
        }

        let manha = 0;
        let tarde = 0;
        let noturnos = 0;

        if (entrada !== null && almocoSaida !== null) {
            const calculado = minutosEntrePonto(entrada, almocoSaida);

            if (calculado !== null && calculado <= 900) {
                manha = Math.max(0, calculado);
                noturnos += minutosNoturnosIntervaloPonto(
                    entrada,
                    almocoSaida,
                    regras
                );
            }
        }

        if (almocoVolta !== null && saida !== null) {
            const calculado = minutosEntrePonto(almocoVolta, saida);

            if (calculado !== null && calculado <= 900) {
                tarde = Math.max(0, calculado);
                noturnos += minutosNoturnosIntervaloPonto(
                    almocoVolta,
                    saida,
                    regras
                );
            }
        }

        return {
            completo: true,
            vazio: !possuiAlguma,
            minutos: Math.max(0, manha + tarde),
            noturnos: Math.max(0, noturnos),
            marcacoesIncompletas:
                entrada === null ||
                almocoSaida === null ||
                almocoVolta === null ||
                saida === null
        };
    }

    /*
        FINAIS DE SEMANA E FERIADOS

        A planilha-base apura os períodos de trabalho de forma independente.
        Isso é importante porque, em sábado/domingo/feriado, o funcionário
        pode trabalhar somente pela manhã ou somente à tarde.

        Exemplos válidos:
        - Entrada + Saída Almoço;
        - Volta Almoço + Saída;
        - os quatro horários;
        - Entrada + Saída, quando for uma marcação contínua sem intervalo.

        Antes, esta parte exigia obrigatoriamente o primeiro e o ÚLTIMO
        campo (Entrada + Saída). Assim um sábado trabalhado somente pela
        manhã ficava com 0 hora extra mesmo com as marcações preenchidas.
    */
    if (!possuiAlguma) {
        return {
            completo: false,
            vazio: true,
            minutos: 0,
            noturnos: 0
        };
    }

    let total = 0;
    let noturno = 0;
    let periodosValidos = 0;

    /*
        1º período: Entrada -> Saída Almoço
    */
    if (
        entrada !== null
        &&
        almocoSaida !== null
    ) {

        const periodo =
            minutosEntrePonto(
                entrada,
                almocoSaida
            );

        if (
            periodo !== null
            &&
            periodo <= 900
        ) {

            total +=
                Math.max(
                    0,
                    periodo
                );

            noturno +=
                minutosNoturnosIntervaloPonto(
                    entrada,
                    almocoSaida,
                    regras
                );

            periodosValidos++;
        }
    }

    /*
        2º período: Volta Almoço -> Saída
    */
    if (
        almocoVolta !== null
        &&
        saida !== null
    ) {

        const periodo =
            minutosEntrePonto(
                almocoVolta,
                saida
            );

        if (
            periodo !== null
            &&
            periodo <= 900
        ) {

            total +=
                Math.max(
                    0,
                    periodo
                );

            noturno +=
                minutosNoturnosIntervaloPonto(
                    almocoVolta,
                    saida,
                    regras
                );

            periodosValidos++;
        }
    }

    /*
        Compatibilidade para jornada contínua:
        se não existir nenhum par completo, mas Entrada e Saída estiverem
        preenchidas, calcula o intervalo total e desconta o intervalo de
        almoço quando os dois campos dele também existirem.
    */
    if (
        periodosValidos === 0
        &&
        entrada !== null
        &&
        saida !== null
    ) {

        let periodo =
            minutosEntrePonto(
                entrada,
                saida
            );

        let periodoNoturno =
            minutosNoturnosIntervaloPonto(
                entrada,
                saida,
                regras
            );

        if (
            periodo !== null
            &&
            almocoSaida !== null
            &&
            almocoVolta !== null
        ) {

            const intervalo =
                minutosEntrePonto(
                    almocoSaida,
                    almocoVolta
                );

            if (
                intervalo !== null
                &&
                intervalo <= periodo
            ) {

                periodo -=
                    intervalo;

                periodoNoturno -=
                    minutosNoturnosIntervaloPonto(
                        almocoSaida,
                        almocoVolta,
                        regras
                    );
            }
        }

        if (
            periodo !== null
            &&
            periodo >= 0
            &&
            periodo <= 1440
        ) {

            total =
                Math.max(
                    0,
                    periodo
                );

            noturno =
                Math.max(
                    0,
                    periodoNoturno
                );

            periodosValidos =
                1;
        }
    }

    return {
        completo:
            periodosValidos > 0,

        vazio:
            false,

        minutos:
            Math.max(
                0,
                total
            ),

        noturnos:
            Math.max(
                0,
                noturno
            )
    };
}

/* ========================================================= */
/* 08. CÁLCULO DIÁRIO DA JORNADA                           */
/* ========================================================= */

/* --------------------------------------------------------- */
/* calcularPontoDia */
/* Executa o cálculo completo de um dia de ponto. */
/* --------------------------------------------------------- */

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

    /*
        REGRA PARA DIAS SEM MARCAÇÃO:

        - Se o dia estiver TOTALMENTE em branco, não existe atraso,
          hora extra nem desconto automático. Isso evita, por exemplo,
          que um funcionário admitido no meio do mês acumule atrasos
          nos dias anteriores à admissão.

        - Se existir PELO MENOS UMA marcação no dia útil, o dia passa
          a ser apurado normalmente. Nesse caso, períodos não
          preenchidos são considerados não trabalhados e entram no
          saldo do dia.

        Exemplos:
        - somente 13:30 e 18:00 preenchidos: a manhã entra como atraso;
        - somente 07:45 e 12:00 preenchidos: a tarde entra como atraso;
        - nenhuma marcação: atraso e extra permanecem como "-".

        Faltas continuam sendo descontadas exclusivamente pela regra
        própria de falta, tratada acima.
    */
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

        /*
            REGRA FIXA DA EMPRESA:
            não existe faixa de tolerância no cálculo do saldo.
            O saldo diário é considerado integralmente desde o primeiro minuto.
        */
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

/* ========================================================= */
/* 09. DSR                                                 */
/* ========================================================= */

/* --------------------------------------------------------- */
/* faltasInjustificadasEntrePonto */
/* Conta faltas injustificadas no período informado. */
/* --------------------------------------------------------- */

function faltasInjustificadasEntrePonto(func, inicio, fim) {
    return (func.ponto || []).filter(reg => {
        if (!reg.falta || reg.faltaJustificada === true) {
            return false;
        }

        return reg.data >= inicio && reg.data <= fim;
    });
}

/* --------------------------------------------------------- */
/* calcularDSRPerdidosMesPonto */
/* Calcula DSR perdido por faltas injustificadas. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 10. RESUMO MENSAL                                       */
/* ========================================================= */

/* --------------------------------------------------------- */
/* calcularResumoMesPonto */
/* Consolida atrasos, extras, faltas e valores do mês. */
/* --------------------------------------------------------- */

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
                faltaJustificada: false,
                justificativaFalta: ''
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
            justificativaFalta: reg.justificativaFalta || '',
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

/* ========================================================= */
/* 11. ABRIR ESPELHO DE PONTO                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirPontoFuncionario */
/* Abre a tela mensal de ponto do funcionário. */
/* --------------------------------------------------------- */

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
                    🖨 Imprimir Ponto
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
                faltaJustificada: false,
                justificativaFalta: ''
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
            ">
    </td>

    <td
        id="ponto-atraso-${idx}-${data}"
        style="color:#dc2626;font-weight:bold;">
        ${reg.falta || ferias ? '-' : (reg.atraso || '-')}
    </td>

    <td
        id="ponto-extra-${idx}-${data}"
        style="color:#16a34a;font-weight:bold;">
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

                        ${
                            reg.faltaJustificada &&
                            reg.justificativaFalta
                                ? `
                                    <div style="
                                        margin-top:3px;
                                        max-width:130px;
                                        font-size:8px;
                                        color:#166534;
                                        line-height:1.25;
                                    ">
                                        ${escaparHTMLPonto(
                                            reg.justificativaFalta
                                        )}
                                    </div>
                                `
                                : ''
                        }

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

    <!-- OBSERVAÇÕES COMPLEMENTARES -->

    <div class="content-card" style="padding:14px;">
        <label style="display:block;margin-bottom:7px;font-weight:800;">
            Observações complementares do ponto
        </label>

        <textarea
            id="ponto-observacoes-mes"
            rows="3"
            ${mesFechado ? 'disabled' : ''}
            placeholder="Adicione informações complementares desta competência, se necessário."
            onblur="salvarObservacaoPonto(${idx}, '${mesKey}', this.value)"
            style="width:100%;resize:vertical;min-height:72px;">${escaparHTMLPonto(
                func.observacoesPonto?.[mesKey] || ''
            )}</textarea>
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

            <div
                id="ponto-resumo-atrasos-${idx}"
                style="
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

            <div
                id="ponto-resumo-faltas-${idx}"
                style="
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

            <div
                id="ponto-resumo-extras-${idx}"
                style="
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

/* ========================================================= */
/* 12. NAVEGAÇÃO ENTRE MESES                               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* alterarMesPonto */
/* Avança ou retrocede o mês exibido. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 13. NAVEGAÇÃO ENTRE CAMPOS                              */
/* ========================================================= */

/* --------------------------------------------------------- */
/* proximoCampoPonto */
/* Move o foco para o próximo campo de marcação. */
/* --------------------------------------------------------- */

window.proximoCampoPonto = function (elemento) {
    const atual = Number(elemento?.tabIndex || 0);

    if (!atual) return;

    const proximo = document.querySelector(`[tabindex="${atual + 1}"]`);

    if (proximo && !proximo.disabled) {
        proximo.focus();
    }
};

/* ========================================================= */
/* 14. SALVAR MARCAÇÃO DE PONTO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* atualizarCalculoPontoNaTela                               */
/* Atualiza linha e resumo mensal sem reabrir o modal.       */
/* --------------------------------------------------------- */

function atualizarCalculoPontoNaTela(
    idx,
    data,
    reg
) {

    /*
        O cálculo já era executado ao salvar a marcação, porém a tela
        permanecia com o HTML antigo. Por isso horas extras recém-digitadas
        podiam ficar invisíveis até fechar e abrir o ponto novamente.

        Aqui atualizamos somente os campos calculados, preservando o foco
        e a sequência de digitação dos horários.
    */

    const atrasoEl =
        document.getElementById(
            `ponto-atraso-${idx}-${data}`
        );

    const extraEl =
        document.getElementById(
            `ponto-extra-${idx}-${data}`
        );

    if (atrasoEl) {
        atrasoEl.textContent =
            reg?.falta
                ? '-'
                : (
                    reg?.atraso
                    ||
                    '-'
                );
    }

    if (extraEl) {
        extraEl.textContent =
            reg?.falta
                ? '-'
                : (
                    reg?.extra
                    ||
                    '-'
                );
    }

    const func =
        db.funcionarios[idx];

    if (!func) {
        return;
    }

    const ano =
        Number(
            String(data).slice(0,4)
        );

    const mesZero =
        Number(
            String(data).slice(5,7)
        )
        -
        1;

    if (
        !Number.isFinite(ano)
        ||
        !Number.isFinite(mesZero)
        ||
        mesZero < 0
        ||
        mesZero > 11
    ) {
        return;
    }

    /*
        Só atualiza os cards se a marcação pertence ao mês atualmente
        aberto na tela.
    */
    if (
        Number(func.anoPontoSelecionado) !== ano
        ||
        Number(func.mesPontoSelecionado) !== mesZero
    ) {
        return;
    }

    const resumo =
        calcularResumoMesPonto(
            func,
            ano,
            mesZero
        );

    const atrasoResumoEl =
        document.getElementById(
            `ponto-resumo-atrasos-${idx}`
        );

    const faltasResumoEl =
        document.getElementById(
            `ponto-resumo-faltas-${idx}`
        );

    const extrasResumoEl =
        document.getElementById(
            `ponto-resumo-extras-${idx}`
        );

    if (atrasoResumoEl) {
        atrasoResumoEl.textContent =
            formatarMoedaPonto(
                resumo.valores.descontoAtrasos
            );
    }

    if (faltasResumoEl) {
        faltasResumoEl.textContent =
            formatarMoedaPonto(
                resumo.valores.descontoFaltasTotal
            );
    }

    if (extrasResumoEl) {
        extrasResumoEl.textContent =
            formatarMoedaPonto(
                resumo.valores.extrasPagar
            );
    }
}


/* --------------------------------------------------------- */
/* salvarPonto */
/* Salva a marcação digitada, recalcula e atualiza a tela.   */
/* --------------------------------------------------------- */

window.salvarPonto = async function (idx, data, campo, valor) {
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
            faltaJustificada: false,
            justificativaFalta: ''
        };

        func.ponto.push(reg);
    }

    reg[campo] = valor;

    calcularPontoDia(
        func,
        reg,
        data
    );

    atualizarCalculoPontoNaTela(
        idx,
        data,
        reg
    );

    try {

        await save();

    }
    catch (erro) {

        console.error(
            'Erro ao salvar marcação do ponto:',
            erro
        );
    }
};

/* ========================================================= */
/* 15. CONTROLE DE FALTAS                                  */
/* ========================================================= */

/* --------------------------------------------------------- */
/* toggleFalta */
/* Marca ou desmarca falta no dia. */
/* --------------------------------------------------------- */

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
            faltaJustificada: false,
            justificativaFalta: ''
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
        reg.justificativaFalta = '';
    } else {
        reg.faltaJustificada = false;
        reg.justificativaFalta = '';
    }

    calcularPontoDia(func, reg, data);

    save();
    abrirPontoFuncionario(idx);
};

/* --------------------------------------------------------- */
/* toggleFaltaJustificada */
/* Alterna a justificativa da falta. */
/* --------------------------------------------------------- */

window.toggleFaltaJustificada = function (idx, data) {

    abrirJustificativaFaltaPonto(
        idx,
        data
    );
};


/* --------------------------------------------------------- */
/* abrirJustificativaFaltaPonto                              */
/* Abre o campo onde o motivo da falta é informado.          */
/* --------------------------------------------------------- */

window.abrirJustificativaFaltaPonto =
function (
    idx,
    data
) {

    const func =
        db.funcionarios[idx];

    if (!func) {
        return;
    }

    garantirEstruturaPonto(
        func
    );

    const reg =
        func.ponto.find(
            p =>
                p.data === data
        );

    if (
        !reg
        ||
        !reg.falta
    ) {
        return;
    }

    const justificativaAtual =
        reg.justificativaFalta
        ||
        '';

    const html = `

        <div style="
            display:flex;
            flex-direction:column;
            gap:12px;
        ">

            <div style="
                padding:11px 13px;
                border-radius:10px;
                background:#f0fdf4;
                border:1px solid #bbf7d0;
                color:#166534;
                font-size:12px;
                line-height:1.5;
            ">

                Informe o motivo da falta justificada.
                Ex.: Atestado médico, consulta médica, declaração etc.

            </div>

            <div>

                <label>
                    Justificativa *
                </label>

                <textarea
                    id="ponto-justificativa-falta"
                    rows="4"
                    placeholder="Ex.: Atestado médico">${escaparHTMLPonto(
                        justificativaAtual
                    )}</textarea>

            </div>

            ${
                justificativaAtual
                ? `
                    <button
                        type="button"
                        class="btn-del"
                        style="
                            align-self:flex-start;
                            padding:7px 10px;
                        "
                        onclick="removerJustificativaFaltaPonto(${idx}, '${data}')">

                        Remover justificativa

                    </button>
                `
                : ''
            }

        </div>
    `;

    configModal({

        title:
            `Justificar Falta - ${data.split('-').reverse().join('/')}`,

        body:
            html,

        confirmText:
            'Salvar Justificativa',

        onConfirm:
        async function () {

            const texto =
                document
                    .getElementById(
                        'ponto-justificativa-falta'
                    )
                    ?.value
                    .trim()
                || '';

            if (!texto) {

                alert(
                    'Informe a justificativa da falta.'
                );

                return;
            }

            reg.faltaJustificada =
                true;

            reg.justificativaFalta =
                texto;

            await save();

            abrirPontoFuncionario(
                idx
            );
        }
    });
};


/* --------------------------------------------------------- */
/* removerJustificativaFaltaPonto                            */
/* Mantém a falta, mas volta a tratá-la como injustificada.  */
/* --------------------------------------------------------- */

window.removerJustificativaFaltaPonto =
async function (
    idx,
    data
) {

    const func =
        db.funcionarios[idx];

    if (!func) {
        return;
    }

    garantirEstruturaPonto(
        func
    );

    const reg =
        func.ponto.find(
            p =>
                p.data === data
        );

    if (!reg) {
        return;
    }

    reg.faltaJustificada =
        false;

    reg.justificativaFalta =
        '';

    await save();

    abrirPontoFuncionario(
        idx
    );
};

/* ========================================================= */
/* 15.1 OBSERVAÇÕES COMPLEMENTARES DO PONTO                 */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarObservacaoPonto */
/* Salva a observação complementar da competência atual. */
/* --------------------------------------------------------- */

window.salvarObservacaoPonto = async function (idx, mesKey, valor) {
    const func = db.funcionarios[idx];
    if (!func) return;

    garantirEstruturaPonto(func);

    if (func.mesesFechados?.[mesKey]) {
        return;
    }

    func.observacoesPonto[mesKey] = String(valor || '').trim();

    await save();
};


/* ========================================================= */
/* 16. FECHAR MÊS                                          */
/* ========================================================= */

/* --------------------------------------------------------- */
/* fecharMes */
/* Fecha o mês e registra o resumo correspondente. */
/* --------------------------------------------------------- */

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
        observacao: String(func.observacoesPonto?.[mesKey] || '').trim(),
        fechadoEm: new Date().toISOString()
    };

    await save();
    abrirPontoFuncionario(idx);
};

/* ========================================================= */
/* 17. REABRIR MÊS                                         */
/* ========================================================= */

/* --------------------------------------------------------- */
/* reabrirMes */
/* Reabre um mês anteriormente fechado. */
/* --------------------------------------------------------- */

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

/* --------------------------------------------------------- */
/* calcularExtrasPeriodoPonto */
/* Calcula horas extras em um período. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 18. IMPRIMIR ESPELHO DE PONTO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* exportarPontoPDF */
/* Mantém o nome por compatibilidade, mas abre impressão direta. */
/* --------------------------------------------------------- */

window.exportarPontoPDF = async function (idx) {

    const func =
        db.funcionarios[idx];

    if (
        !func
        ||
        !func.ponto
    ) {

        alert(
            'Sem registros.'
        );

        return;
    }

    garantirEstruturaPonto(
        func
    );

    const ano =
        func.anoPontoSelecionado;

    const mesZero =
        func.mesPontoSelecionado;

    const mes =
        mesZero + 1;

    const diasMes =
        new Date(
            ano,
            mes,
            0
        ).getDate();

    const mesKey =
        `${ano}-${String(mes).padStart(2, '0')}`;

    const resumo =
        func.mesesFechados[mesKey]
        &&
        func.fechamentosPonto[mesKey]
            ?
            func.fechamentosPonto[mesKey]
            :
            calcularResumoMesPonto(
                func,
                ano,
                mesZero
            );

    /*
        A impressão usa o mesmo conteúdo do espelho mensal,
        mas não gera nem salva arquivo PDF.

        Ao clicar no botão, o sistema abre diretamente
        a tela de impressão.
    */

    let logoEmpresa =
        '';

    try {

        if (
            window.api
            &&
            typeof window.api.getLogoPath ===
                'function'
        ) {

            logoEmpresa =
                await window.api
                    .getLogoPath();
        }

    } catch (erro) {

        console.warn(
            'Não foi possível carregar a logo no espelho de ponto:',
            erro
        );
    }


    /* ===================================================== */
    /* LINHAS DO ESPELHO                                    */
    /* ===================================================== */

    const linhas =
        [];

    for (
        let dia = 1;
        dia <= diasMes;
        dia++
    ) {

        const data =
            `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const reg =
            func.ponto.find(
                p =>
                    p.data === data
            )
            ||
            {
                entrada:
                    '',

                almocoSaida:
                    '',

                almocoVolta:
                    '',

                saida:
                    '',

                atraso:
                    '-',

                extra:
                    '-',

                falta:
                    false,

                faltaJustificada:
                    false,

                justificativaFalta:
                    ''
            };

        let situacao =
            '';

        const feriado =
            feriadoDaDataPonto(
                func,
                data
            );

        const diaSemana =
            dataObjPonto(
                data
            ).getDay();

        const ferias =
            feriasDaDataPonto(
                func,
                data
            );

        const justificativa =
            reg.falta
            &&
            reg.faltaJustificada
                ?
                String(
                    reg.justificativaFalta
                    ||
                    'Justificada'
                ).trim()
                :
                '';

        /*
            Na impressão do ponto:
            - falta justificada repete o texto da justificativa
              nas quatro marcações;
            - feriado repete "Feriado" nas quatro marcações.

            Exemplo:
            Dia 20 | Feriado | Feriado | Feriado | Feriado
        */

        const textoMarcacaoEspecial =
            justificativa
            ||
            (
                feriado
                    ?
                    'Feriado'
                    :
                    ''
            );

        if (ferias) {

            situacao =
                'Férias';

        } else if (
            reg.falta
        ) {

            situacao =
                reg.faltaJustificada
                    ?
                    'Falta Justificada'
                    :
                    'Falta';

        } else if (
            feriado
        ) {

            situacao =
                feriado.nome
                ?
                `Feriado - ${feriado.nome}`
                :
                'Feriado';

        } else if (
            diaSemana === 0
        ) {

            situacao =
                'Domingo';

        } else if (
            diaSemana === 6
        ) {

            situacao =
                'Sábado';
        }

        linhas.push({

            dia:
                String(dia)
                    .padStart(
                        2,
                        '0'
                    ),

            data,

            entrada:
                textoMarcacaoEspecial
                ||
                reg.entrada
                ||
                '-',

            almocoSaida:
                textoMarcacaoEspecial
                ||
                reg.almocoSaida
                ||
                '-',

            almocoVolta:
                textoMarcacaoEspecial
                ||
                reg.almocoVolta
                ||
                '-',

            saida:
                textoMarcacaoEspecial
                ||
                reg.saida
                ||
                '-',

            atraso:
                reg.atraso
                ||
                '-',

            extra:
                reg.extra
                ||
                '-',

            situacao
        });
    }


    /* ===================================================== */
    /* INFORMAÇÕES DE CABEÇALHO                             */
    /* ===================================================== */

    const competencia =
        `${String(mes).padStart(2, '0')}/${ano}`;

    const nomeFuncionario =
        escaparHTMLPonto(
            func.nome
            ||
            '-'
        );

    const cargoFuncionario =
        escaparHTMLPonto(
            func.cargo
            ||
            '-'
        );

    const observacaoPonto =
        escaparHTMLPonto(
            resumo?.observacao
            ||
            func.observacoesPonto?.[mesKey]
            ||
            ''
        );

    const linhasHTML =
        linhas.map(
            linha => {

                const classeSituacao =
                    linha.situacao
                        ?
                        'linha-situacao'
                        :
                        '';

                return `

                    <tr class="${classeSituacao}">

                        <td class="dia">
                            ${linha.dia}
                        </td>

                        <td>
                            ${escaparHTMLPonto(
                                linha.entrada
                            )}
                        </td>

                        <td>
                            ${escaparHTMLPonto(
                                linha.almocoSaida
                            )}
                        </td>

                        <td>
                            ${escaparHTMLPonto(
                                linha.almocoVolta
                            )}
                        </td>

                        <td>
                            ${escaparHTMLPonto(
                                linha.saida
                            )}
                        </td>

                        <td>
                            ${escaparHTMLPonto(
                                linha.atraso
                            )}
                        </td>

                        <td>
                            ${escaparHTMLPonto(
                                linha.extra
                            )}
                        </td>

                        <td class="situacao">
                            ${escaparHTMLPonto(
                                linha.situacao
                            )}
                        </td>

                    </tr>

                `;
            }
        )
        .join('');


    /* ===================================================== */
    /* HTML DE IMPRESSÃO                                    */
    /* ===================================================== */

    const html = `
<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        Controle de Ponto - ${nomeFuncionario} - ${competencia}
    </title>

    <style>

        *{
            box-sizing:border-box;
        }

        html,
        body{
            margin:0;
            padding:0;
            background:#eef2f7;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            color:#172033;
        }

        body{
            padding:20px;
        }

        .pagina{
            width:210mm;
            height:297mm;
            max-height:297mm;
            overflow:hidden;
            margin:0 auto;
            padding:8mm 9mm 7mm;
            background:#fff;
            box-shadow:
                0 12px 35px
                rgba(15,23,42,.14);
        }

        /* ================================================= */
        /* CABEÇALHO                                        */
        /* ================================================= */

        .cabecalho{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:24px;
            padding-bottom:12px;
            border-bottom:3px solid #2563eb;
        }

        .logo-area{
            min-width:170px;
        }

        .logo{
            display:block;
            max-width:180px;
            max-height:58px;
            object-fit:contain;
        }

        .logo-fallback{
            font-size:18px;
            font-weight:900;
            letter-spacing:.3px;
        }

        .titulo{
            text-align:right;
        }

        .titulo h1{
            margin:0;
            font-size:23px;
            letter-spacing:.2px;
        }

        .titulo p{
            margin:5px 0 0;
            color:#64748b;
            font-size:11px;
        }

        /* ================================================= */
        /* DADOS DO FUNCIONÁRIO                             */
        /* ================================================= */

        .dados{
            display:grid;
            grid-template-columns:
                minmax(0,1fr)
                150px;
            gap:10px;
            margin-top:14px;
        }

        .dado{
            padding:9px 11px;
            border:1px solid #e2e8f0;
            border-radius:9px;
            background:#f8fafc;
        }

        .rotulo{
            display:block;
            margin-bottom:3px;
            color:#64748b;
            font-size:8px;
            font-weight:800;
            letter-spacing:.7px;
            text-transform:uppercase;
        }

        .valor{
            font-size:11px;
            font-weight:800;
            color:#172033;
        }

        /* ================================================= */
        /* TABELA                                           */
        /* ================================================= */

        .tabela-wrap{
            margin-top:8px;
            border:1px solid #dbe3ed;
            border-radius:9px;
            overflow:hidden;
        }

        table{
            width:100%;
            border-collapse:collapse;
            table-layout:fixed;
        }

        thead th{
            padding:5px 3px;
            background:#1e293b;
            color:#fff;
            font-size:7.2px;
            font-weight:800;
            text-align:center;
            border-right:1px solid rgba(255,255,255,.12);
        }

        tbody td{
            padding:2.7px 3px;
            min-height:16px;
            border-right:1px solid #e5e7eb;
            border-bottom:1px solid #e5e7eb;
            font-size:7px;
            text-align:center;
            vertical-align:middle;
            overflow-wrap:anywhere;
        }

        tbody tr:nth-child(even){
            background:#f8fafc;
        }

        tbody tr.linha-situacao{
            background:#fffdf5;
        }

        th:last-child,
        td:last-child{
            border-right:none;
        }

        tbody tr:last-child td{
            border-bottom:none;
        }

        .dia{
            width:28px;
            font-weight:900;
        }

        .situacao{
            width:98px;
            font-size:6.5px;
            font-weight:700;
            color:#475569;
        }

        /* ================================================= */
        /* RESUMO FINANCEIRO                                */
        /* ================================================= */

        .resumo{
            margin-top:8px;
            padding:8px;
            border:1px solid #dbe3ed;
            border-radius:10px;
            background:#f8fafc;
        }

        .resumo-titulo{
            margin-bottom:8px;
            font-size:10px;
            font-weight:900;
            color:#172033;
        }

        .resumo-grid{
            display:grid;
            grid-template-columns:
                repeat(3,1fr);
            gap:8px;
        }

        .resumo-card{
            padding:8px 9px;
            border-radius:8px;
            background:#fff;
            border:1px solid #e5e7eb;
        }

        .resumo-card .rotulo{
            font-size:7px;
        }

        .resumo-card strong{
            display:block;
            margin-top:3px;
            font-size:11px;
        }

        .resumo-nota{
            margin-top:7px;
            color:#64748b;
            font-size:7px;
            line-height:1.4;
        }

        .observacoes-ponto{
            margin-top:8px;
            padding:7px 9px;
            border:1px solid #dbe3ed;
            border-radius:8px;
            background:#fff;
            font-size:7px;
            line-height:1.35;
            min-height:27px;
        }

        .observacoes-ponto strong{
            display:block;
            margin-bottom:3px;
            font-size:7.5px;
            color:#172033;
        }

        /* ================================================= */
        /* ASSINATURA                                       */
        /* ================================================= */

        .assinatura{
            width:260px;
            margin:15px auto 0;
            padding-top:6px;
            border-top:1px solid #475569;
            text-align:center;
            color:#475569;
            font-size:8px;
        }

        .rodape{
            margin-top:14px;
            padding-top:7px;
            border-top:1px solid #e5e7eb;
            color:#94a3b8;
            font-size:6.8px;
            text-align:center;
        }

        @media print{

            @page{
                size:A4 portrait;
                margin:0;
            }

            html,
            body{
                background:#fff;
            }

            body{
                padding:0;
            }

            .pagina{
                width:210mm;
                height:297mm;
                max-height:297mm;
                overflow:hidden;
                margin:0;
                box-shadow:none;
            }

        }

    </style>

</head>

<body>

    <div class="pagina">

        <!-- CABEÇALHO -->

        <div class="cabecalho">

            <div class="logo-area">

                ${
                    logoEmpresa
                        ?
                        `
                            <img
                                class="logo"
                                src="${logoEmpresa}"
                                alt="WN Comunicação Visual">
                        `
                        :
                        `
                            <div class="logo-fallback">
                                WN Comunicação Visual
                            </div>
                        `
                }

            </div>

            <div class="titulo">

                <h1>
                    CONTROLE DE PONTO
                </h1>

                <p>
                    Espelho mensal de jornada
                </p>

            </div>

        </div>


        <!-- DADOS -->

        <div class="dados">

            <div class="dado">

                <span class="rotulo">
                    Funcionário
                </span>

                <div class="valor">
                    ${nomeFuncionario}
                </div>

            </div>

            <div class="dado">

                <span class="rotulo">
                    Competência
                </span>

                <div class="valor">
                    ${competencia}
                </div>

            </div>

            <div class="dado">

                <span class="rotulo">
                    Cargo
                </span>

                <div class="valor">
                    ${cargoFuncionario}
                </div>

            </div>

            <div class="dado">

                <span class="rotulo">
                    Status do mês
                </span>

                <div class="valor">
                    ${
                        func.mesesFechados[mesKey]
                            ?
                            'Fechado'
                            :
                            'Aberto'
                    }
                </div>

            </div>

        </div>


        <!-- TABELA -->

        <div class="tabela-wrap">

            <table>

                <thead>

                    <tr>

                        <th class="dia">
                            Dia
                        </th>

                        <th>
                            Entrada
                        </th>

                        <th>
                            Saída<br>Almoço
                        </th>

                        <th>
                            Volta<br>Almoço
                        </th>

                        <th>
                            Saída
                        </th>

                        <th>
                            Atraso
                        </th>

                        <th>
                            Extra
                        </th>

                        <th class="situacao">
                            Situação
                        </th>

                    </tr>

                </thead>

                <tbody>
                    ${linhasHTML}
                </tbody>

            </table>

        </div>


        <!-- RESUMO -->

        <div class="resumo">

            <div class="resumo-titulo">
                Resumo financeiro do ponto
            </div>

            <div class="resumo-grid">

                <div class="resumo-card">

                    <span class="rotulo">
                        Desconto por atrasos
                    </span>

                    <strong>
                        ${formatarMoedaPonto(
                            resumo.valores.descontoAtrasos
                        )}
                    </strong>

                </div>

                <div class="resumo-card">

                    <span class="rotulo">
                        Desconto por faltas
                    </span>

                    <strong>
                        ${formatarMoedaPonto(
                            resumo.valores.descontoFaltasTotal
                        )}
                    </strong>

                </div>

                <div class="resumo-card">

                    <span class="rotulo">
                        Horas extras a pagar
                    </span>

                    <strong>
                        ${formatarMoedaPonto(
                            resumo.valores.extrasPagar
                        )}
                    </strong>

                </div>

            </div>

            <div class="resumo-nota">
                Faltas incluem DSR quando aplicável.
                Extras incluem adicionais noturnos apurados.
            </div>

        </div>


        <!-- OBSERVAÇÕES COMPLEMENTARES -->

        ${
            observacaoPonto
                ? `
                    <div class="observacoes-ponto">
                        <strong>Observações complementares</strong>
                        ${observacaoPonto.replace(/\n/g, '<br>')}
                    </div>
                `
                : ''
        }


        <!-- ASSINATURA -->

        <div class="assinatura">
            Assinatura do Funcionário
        </div>


        <div class="rodape">
            WN Comunicação Visual • Controle de Ponto • ${competencia}
        </div>

    </div>


    <script>

        /*
            Abre automaticamente a caixa de impressão
            assim que o espelho é carregado.
        */

        window.addEventListener(
            'load',
            function () {

                setTimeout(
                    function () {

                        window.print();

                    },
                    250
                );
            }
        );

    </script>

</body>

</html>
`;


    /* ===================================================== */
    /* ABRIR IMPRESSÃO                                      */
    /* ===================================================== */

    if (
        window.api
        &&
        typeof window.api.imprimirHTML ===
            'function'
    ) {

        await window.api
            .imprimirHTML(
                html
            );

        return;
    }

    /*
        Fallback para execução fora do Electron.
    */

    const janela =
        window.open(
            '',
            '_blank'
        );

    if (!janela) {

        alert(
            'Não foi possível abrir a janela de impressão.'
        );

        return;
    }

    janela.document.write(
        html
    );

    janela.document.close();
};
