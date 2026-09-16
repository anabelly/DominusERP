/* ========================================================= */
/* DOMINUS ERP - FUNCIONARIOS.JS                             */
/* ========================================================= */
/*
    FUNCIONÁRIOS / RH

    Este arquivo concentra o cadastro de funcionários e
    diversos recursos de RH utilizados no Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Funções auxiliares de datas, números e segurança HTML
    2. Garantir a estrutura interna de RH dos funcionários
    3. Cadastro e manutenção de cargos
    4. Renderização da tela de Funcionários
    5. Cadastro e edição de funcionários
    6. Plano de carreira
    7. Férias e períodos aquisitivos
    8. Recibos avulsos de funcionários
    9. Rescisão / acerto avulso
    10. Compatibilidade de status com férias agendadas
    11. Status visual dos funcionários
    12. Abas Ativos / Desligados na listagem
    13. Tabela de funcionários compactada sem alterar códigos
    14. Controle de Uniformes e EPIs integrado aos funcionários ativos

    IMPORTANTE:
    Nesta versão, a única alteração adicional é a ordem visual
    alfabética dos funcionários pelo nome.

    O conteúdo de db.funcionarios e seus índices originais não
    são reordenados, preservando todas as ações e vínculos.
*/


/* ========================================================= */
/* 01. FUNÇÕES AUXILIARES E ESTRUTURA DE RH                 */
/* ========================================================= */
/*
    Funções de apoio usadas em todo o módulo:
    - proteção de HTML
    - números seguros
    - datas
    - períodos
    - estrutura de ponto/RH
    - cadastro de cargos
*/

/* ========================================================= */
/* 01.1 HELPERS GERAIS                                      */
/* ========================================================= */
/*
    Conversões, datas e utilidades compartilhadas
    pelas demais áreas deste arquivo.
*/

/* --------------------------------------------------------- */
/* escaparHTMLFuncionario */
/* Escapa caracteres especiais antes de inserir valores no HTML. */
/* --------------------------------------------------------- */

function escaparHTMLFuncionario(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------- */
/* numeroFuncionario */
/* Converte um valor para número seguro. */
/* --------------------------------------------------------- */

function numeroFuncionario(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

/* --------------------------------------------------------- */
/* dataHojeFuncionario */
/* Retorna a data atual no formato YYYY-MM-DD. */
/* --------------------------------------------------------- */

function dataHojeFuncionario() {
    return new Date().toISOString().split('T')[0];
}


/* --------------------------------------------------------- */
/* dataObjFuncionario */
/* Converte uma data ISO em objeto Date seguro. */
/* --------------------------------------------------------- */

function dataObjFuncionario(data) {
    if (!data) return null;

    const d = new Date(`${data}T12:00:00`);

    return Number.isNaN(d.getTime())
        ? null
        : d;
}

/* --------------------------------------------------------- */
/* dataISOFuncionario */
/* Converte um objeto Date para YYYY-MM-DD. */
/* --------------------------------------------------------- */

function dataISOFuncionario(dataObj) {
    if (!dataObj) return '';

    return [
        dataObj.getFullYear(),
        String(dataObj.getMonth() + 1).padStart(2, '0'),
        String(dataObj.getDate()).padStart(2, '0')
    ].join('-');
}

/* --------------------------------------------------------- */
/* somarDiasFuncionario */
/* Soma dias a uma data e devolve o resultado em formato ISO. */
/* --------------------------------------------------------- */

function somarDiasFuncionario(data, dias) {
    const d = dataObjFuncionario(data);

    if (!d) return '';

    d.setDate(d.getDate() + Number(dias || 0));

    return dataISOFuncionario(d);
}

/* --------------------------------------------------------- */
/* somarAnosFuncionario */
/* Soma anos a uma data, incluindo tratamento de 29/02. */
/* --------------------------------------------------------- */

function somarAnosFuncionario(data, anos) {
    const d = dataObjFuncionario(data);

    if (!d) return '';

    const mes = d.getMonth();
    const dia = d.getDate();

    d.setFullYear(d.getFullYear() + Number(anos || 0));

    /*
        Ajuste para datas como 29/02.
        Se o navegador "pular" de mês,
        usamos o último dia do mês anterior.
    */
    if (d.getMonth() !== mes && dia >= 28) {
        d.setDate(0);
    }

    return dataISOFuncionario(d);
}

/* --------------------------------------------------------- */
/* diasInclusivosFuncionario */
/* Calcula a quantidade de dias entre duas datas incluindo as extremidades. */
/* --------------------------------------------------------- */

function diasInclusivosFuncionario(inicio, fim) {
    const a = dataObjFuncionario(inicio);
    const b = dataObjFuncionario(fim);

    if (!a || !b || b < a) {
        return 0;
    }

    return Math.floor(
        (b.getTime() - a.getTime()) /
        86400000
    ) + 1;
}

/* --------------------------------------------------------- */
/* hojeDentroPeriodoFuncionario */
/* Verifica se a data atual está dentro de um período. */
/* --------------------------------------------------------- */

function hojeDentroPeriodoFuncionario(inicio, fim) {
    const hoje = dataHojeFuncionario();

    return !!(
        inicio &&
        fim &&
        hoje >= inicio &&
        hoje <= fim
    );
}

/* ========================================================= */
/* 01.2 GARANTIR ESTRUTURA INTERNA DO FUNCIONÁRIO           */
/* ========================================================= */
/*
    Garante arrays e objetos usados por:
    - ponto
    - fechamentos
    - carreira
    - feriados
    - férias
    - acertos/rescisão
*/

/* --------------------------------------------------------- */
/* garantirEstruturaFuncionarioRH */
/* Garante a estrutura necessária de RH dentro do funcionário. */
/* --------------------------------------------------------- */

function garantirEstruturaFuncionarioRH(func) {
    if (!func) return;

    if (!Array.isArray(func.ponto)) {
        func.ponto = [];
    }

    if (!func.mesesFechados || typeof func.mesesFechados !== 'object') {
        func.mesesFechados = {};
    }

    if (!func.fechamentosPonto || typeof func.fechamentosPonto !== 'object') {
        func.fechamentosPonto = {};
    }

    if (!Array.isArray(func.planoCarreira)) {
        func.planoCarreira = [];
    }

    if (!Array.isArray(func.feriadosPonto)) {
        func.feriadosPonto = [];
    }

    if (!Array.isArray(func.ferias)) {
        func.ferias = [];
    }

    if (!Array.isArray(func.acertosRescisao)) {
        func.acertosRescisao = [];
    }
}

/* ========================================================= */
/* 02. CADASTRO E GERENCIAMENTO DE CARGOS                   */
/* ========================================================= */
/*
    Mantém a lista de cargos utilizada no cadastro,
    edição e plano de carreira.
*/

/* --------------------------------------------------------- */
/* garantirCadastroCargosFuncionario */
/* Garante e normaliza a lista global de cargos. */
/* --------------------------------------------------------- */

function garantirCadastroCargosFuncionario() {
    if (!window.db) {
        return [];
    }

    /*
        A lista oficial de cargos agora é db.cargosFuncionario.

        IMPORTANTE:
        não recriamos automaticamente os quatro cargos padrão
        sempre que a lista estiver vazia.

        Uma lista vazia é válida e significa que o usuário
        realmente removeu todos os cargos que podia remover.
    */

    if (!Array.isArray(db.cargosFuncionario)) {
        db.cargosFuncionario = [];
    }

    /*
        MIGRAÇÃO / COMPATIBILIDADE

        Se existir funcionário usando um cargo que ainda não esteja
        na lista (por exemplo, banco antigo), o cargo é incorporado
        uma única vez para não quebrar cadastros existentes.

        Cargos realmente excluídos não voltam, pois o sistema
        impede excluir um cargo que esteja em uso.
    */

    const usados = [];

    (Array.isArray(db.funcionarios) ? db.funcionarios : []).forEach(func => {
        if (func?.cargo) {
            usados.push(String(func.cargo).trim());
        }

        if (Array.isArray(func?.planoCarreira)) {
            func.planoCarreira.forEach(etapa => {
                if (etapa?.cargo) {
                    usados.push(String(etapa.cargo).trim());
                }

                if (etapa?.proximoCargo) {
                    usados.push(String(etapa.proximoCargo).trim());
                }
            });
        }
    });

    usados.forEach(cargo => {
        const nome = String(cargo || '').trim();

        if (!nome) return;

        const existe = db.cargosFuncionario.some(
            item =>
                String(item || '')
                    .trim()
                    .toLowerCase()
                ===
                nome.toLowerCase()
        );

        if (!existe) {
            db.cargosFuncionario.push(nome);
        }
    });

    db.cargosFuncionario = db.cargosFuncionario
        .map(
            item =>
                String(item || '').trim()
        )
        .filter(Boolean)
        .filter(
            (item, index, lista) =>
                lista.findIndex(
                    outro =>
                        outro.toLowerCase()
                        ===
                        item.toLowerCase()
                )
                ===
                index
        );

    return db.cargosFuncionario;
}

/* --------------------------------------------------------- */
/* cargosPadraoFuncionario */
/* Retorna uma cópia da lista atual de cargos. */
/* --------------------------------------------------------- */

function cargosPadraoFuncionario() {
    return [...garantirCadastroCargosFuncionario()];
}

/* --------------------------------------------------------- */
/* opcoesCargoFuncionario */
/* Monta as opções HTML do seletor de cargos. */
/* --------------------------------------------------------- */

function opcoesCargoFuncionario(valorAtual = '', incluirVazio = false) {
    const cargos = cargosPadraoFuncionario();

    if (
        valorAtual &&
        !cargos.some(
            cargo => cargo.toLowerCase() === String(valorAtual).toLowerCase()
        )
    ) {
        cargos.push(valorAtual);
    }

    const vazio = incluirVazio
        ? '<option value="">Selecione...</option>'
        : '';

    return vazio + cargos.map(cargo => `
        <option
            value="${escaparHTMLFuncionario(cargo)}"
            ${cargo === valorAtual ? 'selected' : ''}>
            ${escaparHTMLFuncionario(cargo)}
        </option>
    `).join('');
}

/* --------------------------------------------------------- */
/* cargoEmUsoFuncionario */
/* Verifica se um cargo está sendo usado por funcionário ou carreira. */
/* --------------------------------------------------------- */

function cargoEmUsoFuncionario(cargo) {
    const alvo = String(cargo || '').trim().toLowerCase();

    if (!alvo) return false;

    return (Array.isArray(db.funcionarios) ? db.funcionarios : []).some(func => {
        if (String(func?.cargo || '').trim().toLowerCase() === alvo) {
            return true;
        }

        return Array.isArray(func?.planoCarreira) && func.planoCarreira.some(etapa =>
            String(etapa?.cargo || '').trim().toLowerCase() === alvo ||
            String(etapa?.proximoCargo || '').trim().toLowerCase() === alvo
        );
    });
}

/* --------------------------------------------------------- */
/* abrirCadastroCargosFuncionario */
/* Abre o gerenciamento de cargos da empresa. */
/* --------------------------------------------------------- */

window.abrirCadastroCargosFuncionario = function () {
    garantirCadastroCargosFuncionario();

    const linhas = db.cargosFuncionario.map(cargo => `
        <div
            class="cargo-funcionario-linha"
            data-original="${escaparHTMLFuncionario(cargo)}"
            style="
                display:grid;
                grid-template-columns:1fr auto;
                gap:8px;
                align-items:center;
                margin-bottom:8px;
            "
        >
            <input
                class="cargo-funcionario-nome"
                value="${escaparHTMLFuncionario(cargo)}"
                placeholder="Nome do cargo"
            >

            <button
                type="button"
                class="btn-del"
                style="padding:8px 11px;"
                onclick="removerCargoFuncionarioCadastro(this)"
                title="Excluir cargo"
            >
                Excluir
            </button>
        </div>
    `).join('');

    const html = `
        <div style="display:flex;flex-direction:column;gap:14px;">

            <div style="
                background:#eff6ff;
                border:1px solid #bfdbfe;
                color:#1e3a8a;
                padding:12px;
                border-radius:10px;
                font-size:13px;
                line-height:1.5;
            ">
                Cadastre aqui os cargos usados pela empresa. Eles aparecerão automaticamente
                no cadastro, edição e plano de carreira dos funcionários.
            </div>

            <div id="lista-cargos-funcionario">
                ${linhas || '<div style="color:#6b7280;">Nenhum cargo cadastrado.</div>'}
            </div>

            <button
                type="button"
                class="btn-action"
                style="align-self:flex-start;background:#2563eb;"
                onclick="adicionarLinhaCargoFuncionario()"
            >
                + Novo Cargo
            </button>

        </div>
    `;

    configModal({
        title: '⚙ Cadastro de Cargos',
        body: html,
        confirmText: 'Salvar Cargos',
        onConfirm: async function () {
            const linhasDOM = [
                ...document.querySelectorAll('.cargo-funcionario-linha')
            ];

            const novos = [];
            const renomeados = [];

            for (const linha of linhasDOM) {
                const input = linha.querySelector('.cargo-funcionario-nome');
                const novo = String(input?.value || '').trim();
                const original = String(linha.dataset.original || '').trim();

                if (!novo) {
                    alert('Não deixe cargo sem nome.');
                    input?.focus();
                    return;
                }

                if (
                    novos.some(
                        item => item.toLowerCase() === novo.toLowerCase()
                    )
                ) {
                    alert(`O cargo "${novo}" está duplicado.`);
                    input?.focus();
                    return;
                }

                novos.push(novo);

                if (
                    original &&
                    original.toLowerCase() !== novo.toLowerCase()
                ) {
                    renomeados.push({
                        original,
                        novo
                    });
                }
            }

            renomeados.forEach(({ original, novo }) => {
                const alvo = original.toLowerCase();

                (Array.isArray(db.funcionarios) ? db.funcionarios : []).forEach(func => {
                    if (
                        String(func?.cargo || '').trim().toLowerCase() === alvo
                    ) {
                        func.cargo = novo;
                    }

                    if (Array.isArray(func?.planoCarreira)) {
                        func.planoCarreira.forEach(etapa => {
                            if (
                                String(etapa?.cargo || '').trim().toLowerCase() === alvo
                            ) {
                                etapa.cargo = novo;
                            }

                            if (
                                String(etapa?.proximoCargo || '').trim().toLowerCase() === alvo
                            ) {
                                etapa.proximoCargo = novo;
                            }
                        });
                    }
                });
            });

            /*
                A lista inteira é substituída pela lista exibida
                no modal e salva no banco.

                Assim:
                - cargo novo permanece;
                - cargo removido permanece removido;
                - cargo renomeado permanece renomeado.
            */

            db.cargosFuncionario =
                novos;

            await save();

            closeModal();

            await navigate(
                'funcionarios',
                false
            );
        }
    });
};

/* --------------------------------------------------------- */
/* adicionarLinhaCargoFuncionario */
/* Adiciona uma nova linha ao cadastro de cargos. */
/* --------------------------------------------------------- */

window.adicionarLinhaCargoFuncionario = function () {
    const lista = document.getElementById('lista-cargos-funcionario');

    if (!lista) return;

    const vazio = lista.querySelector('div[style*="Nenhum cargo"]');
    if (vazio) vazio.remove();

    const linha = document.createElement('div');

    linha.className = 'cargo-funcionario-linha';
    linha.dataset.original = '';
    linha.style.cssText = `
        display:grid;
        grid-template-columns:1fr auto;
        gap:8px;
        align-items:center;
        margin-bottom:8px;
    `;

    linha.innerHTML = `
        <input
            class="cargo-funcionario-nome"
            placeholder="Nome do cargo"
        >

        <button
            type="button"
            class="btn-del"
            style="padding:8px 11px;"
            onclick="removerCargoFuncionarioCadastro(this)"
            title="Excluir cargo"
        >
            Excluir
        </button>
    `;

    lista.appendChild(linha);
    linha.querySelector('input')?.focus();
};

/* --------------------------------------------------------- */
/* removerCargoFuncionarioCadastro */
/* Remove um cargo da tela quando ele não estiver em uso. */
/* --------------------------------------------------------- */

window.removerCargoFuncionarioCadastro = async function (botao) {
    const linha = botao?.closest('.cargo-funcionario-linha');

    if (!linha) return;

    const original = String(linha.dataset.original || '').trim();

    if (
        original &&
        cargoEmUsoFuncionario(original)
    ) {
        alert(
            `O cargo "${original}" está sendo usado por um funcionário ou no plano de carreira.\n\n` +
            'Se quiser substituí-lo, altere o nome e clique em Salvar Cargos.'
        );
        return;
    }

    /*
        Se o cargo já existia no cadastro, ele é removido
        imediatamente da lista persistida e salvo no banco.

        Isso evita o comportamento anterior em que o cargo
        sumia visualmente do modal, mas voltava ao abrir de novo.
    */

    if (original) {
        garantirCadastroCargosFuncionario();

        db.cargosFuncionario =
            db.cargosFuncionario.filter(
                cargo =>
                    String(cargo || '')
                        .trim()
                        .toLowerCase()
                    !==
                    original.toLowerCase()
            );

        /*
            Salva ANTES de atualizar a interface.
            Se o save falhar, o cargo não some falsamente da tela.
        */

        try {

            await save();

        } catch (erro) {

            console.error(
                'Erro ao excluir cargo:',
                erro
            );

            alert(
                'Não foi possível excluir o cargo. Tente novamente.'
            );

            return;
        }
    }

    linha.remove();
};

/* ========================================================= */
/* 02.1 RECIBOS AVULSOS DE FUNCIONÁRIOS                     */
/* ========================================================= */
/*
    Gerador de recibos pequenos para pagamentos de funcionários.

    TIPOS DISPONÍVEIS:
    - Adiantamento
    - Auxílio Combustível
    - Diária
    - Salário
    - Vale
    - Vale Transporte

    REGRAS DOS CAMPOS:
    - Adiantamento:
        valor + bonificação
    - Auxílio Combustível:
        somente valor
    - Diária:
        quantidade de diárias + valor da diária
    - Salário:
        valor + descontos + bonificação + horas extras
    - Vale:
        somente valor
    - Vale Transporte:
        quantidade de passagens + valor da passagem

    O recibo é gerado apenas para impressão.
    Nenhum registro é salvo no módulo de Recibos.
*/


/* --------------------------------------------------------- */
/* tiposReciboFuncionario                                    */
/* Retorna os tipos em ordem alfabética.                     */
/* --------------------------------------------------------- */

function tiposReciboFuncionario() {

    return [
        'Adiantamento',
        'Auxílio Combustível',
        'Diária',
        'Salário',
        'Vale',
        'Vale Transporte'
    ]
    .sort(
        (a, b) =>
            a.localeCompare(
                b,
                'pt-BR',
                {
                    sensitivity:'base'
                }
            )
    );
}


/* --------------------------------------------------------- */
/* funcionariosAtivosRecibo                                  */
/* Retorna somente funcionários com status Ativo.            */
/* --------------------------------------------------------- */

function funcionariosAtivosRecibo() {

    return (
        Array.isArray(
            db.funcionarios
        )
        ?
        db.funcionarios
        :
        []
    )
    .map(
        (funcionario, index) => ({
            funcionario,
            index
        })
    )
    .filter(
        item =>
            String(
                item.funcionario?.status || ''
            )
            .trim()
            ===
            'Ativo'
    )
    .sort(
        (a, b) =>
            String(
                a.funcionario?.nome || ''
            )
            .localeCompare(
                String(
                    b.funcionario?.nome || ''
                ),
                'pt-BR',
                {
                    sensitivity:'base'
                }
            )
    );
}


/* --------------------------------------------------------- */
/* competenciaAtualReciboFuncionario                         */
/* Retorna YYYY-MM para o campo type="month".                */
/* --------------------------------------------------------- */

function competenciaAtualReciboFuncionario() {

    const hoje =
        new Date();

    return (
        hoje.getFullYear()
        +
        '-'
        +
        String(
            hoje.getMonth() + 1
        )
        .padStart(
            2,
            '0'
        )
    );
}


/* --------------------------------------------------------- */
/* formatarCompetenciaReciboFuncionario                      */
/* Ex.: 2026-09 -> set/26                                    */
/* --------------------------------------------------------- */

function formatarCompetenciaReciboFuncionario(
    valor
) {

    const partes =
        String(
            valor || ''
        )
        .split(
            '-'
        );

    if (
        partes.length !==
        2
    ) {

        return (
            valor
            ||
            '-'
        );
    }

    const ano =
        partes[0];

    const mes =
        Number(
            partes[1]
        );

    const meses = [
        'jan',
        'fev',
        'mar',
        'abr',
        'mai',
        'jun',
        'jul',
        'ago',
        'set',
        'out',
        'nov',
        'dez'
    ];

    const nomeMes =
        meses[
            mes - 1
        ]
        ||
        partes[1];

    return (
        nomeMes
        +
        '/'
        +
        String(
            ano
        )
        .slice(
            -2
        )
    );
}


/* --------------------------------------------------------- */
/* numeroCampoReciboFuncionario                              */
/* Lê com segurança um campo numérico.                       */
/* --------------------------------------------------------- */

function numeroCampoReciboFuncionario(
    id
) {

    const elemento =
        document.getElementById(
            id
        );

    return Math.max(
        0,
        numeroFuncionario(
            elemento?.value
        )
    );
}


/* --------------------------------------------------------- */
/* calcularDadosReciboFuncionario                            */
/* Calcula o total conforme o tipo selecionado.              */
/* --------------------------------------------------------- */

function calcularDadosReciboFuncionario() {

    const tipo =
        document.getElementById(
            'recibo-funcionario-tipo'
        )
        ?.value
        ||
        '';

    const valor =
        numeroCampoReciboFuncionario(
            'recibo-funcionario-valor'
        );

    const descontos =
        numeroCampoReciboFuncionario(
            'recibo-funcionario-descontos'
        );

    const bonificacao =
        numeroCampoReciboFuncionario(
            'recibo-funcionario-bonificacao'
        );

    const horasExtras =
        numeroCampoReciboFuncionario(
            'recibo-funcionario-horas-extras'
        );

    const quantidadeDiarias =
        Math.max(
            0,
            Math.floor(
                numeroCampoReciboFuncionario(
                    'recibo-funcionario-qtd-diarias'
                )
            )
        );

    const valorDiaria =
        numeroCampoReciboFuncionario(
            'recibo-funcionario-valor-diaria'
        );

    const quantidadePassagens =
        Math.max(
            0,
            Math.floor(
                numeroCampoReciboFuncionario(
                    'recibo-funcionario-qtd-passagens'
                )
            )
        );

    const valorPassagem =
        numeroCampoReciboFuncionario(
            'recibo-funcionario-valor-passagem'
        );

    let total =
        valor;

    if (
        tipo ===
        'Salário'
    ) {

        total =
            valor
            -
            descontos
            +
            bonificacao
            +
            horasExtras;
    }

    if (
        tipo ===
        'Adiantamento'
    ) {

        total =
            valor
            +
            bonificacao;
    }

    if (
        tipo ===
        'Diária'
    ) {

        total =
            quantidadeDiarias
            *
            valorDiaria;
    }

    if (
        tipo ===
        'Vale Transporte'
    ) {

        total =
            quantidadePassagens
            *
            valorPassagem;
    }

    total =
        Math.max(
            0,
            total
        );

    return {
        tipo,
        valor,
        descontos,
        bonificacao,
        horasExtras,
        quantidadeDiarias,
        valorDiaria,
        quantidadePassagens,
        valorPassagem,
        total
    };
}


/* --------------------------------------------------------- */
/* atualizarTotalReciboFuncionario                           */
/* Atualiza o total exibido no formulário.                   */
/* --------------------------------------------------------- */

window.atualizarTotalReciboFuncionario =
function () {

    const dados =
        calcularDadosReciboFuncionario();

    const total =
        document.getElementById(
            'recibo-funcionario-total'
        );

    if (
        total
    ) {

        total.innerText =
            formatarMoeda(
                dados.total
            );
    }
};


/* --------------------------------------------------------- */
/* atualizarCamposReciboFuncionario                          */
/* Exibe apenas os campos permitidos para cada tipo.         */
/* --------------------------------------------------------- */

window.atualizarCamposReciboFuncionario =
function () {

    const tipo =
        document.getElementById(
            'recibo-funcionario-tipo'
        )
        ?.value
        ||
        '';

    const container =
        document.getElementById(
            'recibo-funcionario-campos'
        );

    if (
        !container
    ) {

        return;
    }

    const campoValor =
        (
            rotulo = 'Valor'
        ) => `

            <div>

                <label>
                    ${rotulo}
                </label>

                <input
                    id="recibo-funcionario-valor"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>
        `;

    if (
        !tipo
    ) {

        container.innerHTML = `

            <div style="
                grid-column:1 / -1;
                color:#64748b;
                font-size:12px;
                padding:12px 0;
            ">
                Selecione o tipo de recibo para preencher os valores.
            </div>
        `;

        atualizarTotalReciboFuncionario();

        return;
    }


    if (
        tipo ===
        'Salário'
    ) {

        container.innerHTML = `

            ${campoValor('Valor do salário')}

            <div>

                <label>
                    Descontos
                </label>

                <input
                    id="recibo-funcionario-descontos"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>

            <div>

                <label>
                    Bonificação
                </label>

                <input
                    id="recibo-funcionario-bonificacao"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>

            <div>

                <label>
                    Horas Extras
                </label>

                <input
                    id="recibo-funcionario-horas-extras"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>
        `;
    }

    else if (
        tipo ===
        'Adiantamento'
    ) {

        container.innerHTML = `

            ${campoValor('Valor do adiantamento')}

            <div>

                <label>
                    Bonificação
                </label>

                <input
                    id="recibo-funcionario-bonificacao"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>
        `;
    }

    else if (
        tipo ===
        'Diária'
    ) {

        container.innerHTML = `

            <div>

                <label>
                    Quantidade de Diárias
                </label>

                <input
                    id="recibo-funcionario-qtd-diarias"
                    type="number"
                    min="1"
                    step="1"
                    value="1"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>

            <div>

                <label>
                    Valor da Diária
                </label>

                <input
                    id="recibo-funcionario-valor-diaria"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>
        `;
    }

    else if (
        tipo ===
        'Vale Transporte'
    ) {

        container.innerHTML = `

            <div>

                <label>
                    Quantidade de Passagens
                </label>

                <input
                    id="recibo-funcionario-qtd-passagens"
                    type="number"
                    min="1"
                    step="1"
                    value="1"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>

            <div>

                <label>
                    Valor da Passagem
                </label>

                <input
                    id="recibo-funcionario-valor-passagem"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    oninput="atualizarTotalReciboFuncionario()">

            </div>
        `;
    }

    else if (
        tipo ===
        'Auxílio Combustível'
    ) {

        container.innerHTML =
            campoValor(
                'Valor do auxílio combustível'
            );
    }

    else {

        /*
            Vale:
            somente o valor.
        */

        container.innerHTML =
            campoValor(
                'Valor do vale'
            );
    }

    atualizarTotalReciboFuncionario();
};


/* --------------------------------------------------------- */
/* abrirGeradorReciboFuncionario                             */
/* Abre a tela para montar um recibo.                        */
/* --------------------------------------------------------- */

window.abrirGeradorReciboFuncionario =
function () {

    const funcionarios =
        funcionariosAtivosRecibo();

    if (
        !funcionarios.length
    ) {

        alert(
            'Não há funcionários ativos para gerar recibo.'
        );

        return;
    }

    const opcoesFuncionarios =
        funcionarios
        .map(
            item => `

                <option
                    value="${item.index}">
                    ${escaparHTMLFuncionario(
                        item.funcionario?.nome || ''
                    )}
                </option>
            `
        )
        .join(
            ''
        );

    const opcoesTipos =
        tiposReciboFuncionario()
        .map(
            tipo => `

                <option
                    value="${escaparHTMLFuncionario(
                        tipo
                    )}">
                    ${escaparHTMLFuncionario(
                        tipo
                    )}
                </option>
            `
        )
        .join(
            ''
        );

    const html = `

        <div style="
            display:flex;
            flex-direction:column;
            gap:18px;
        ">

            <div style="
                padding:12px 14px;
                border-radius:10px;
                border:1px solid #bfdbfe;
                background:#eff6ff;
                color:#1e3a8a;
                font-size:12px;
                line-height:1.5;
            ">
                Selecione o funcionário, o tipo de pagamento e os valores.
                O recibo será aberto diretamente para impressão.
            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:14px;
            ">

                <div>

                    <label>
                        Funcionário *
                    </label>

                    <select
                        id="recibo-funcionario-indice">

                        <option value="">
                            Selecione...
                        </option>

                        ${opcoesFuncionarios}

                    </select>

                </div>


                <div>

                    <label>
                        Tipo de Recibo *
                    </label>

                    <select
                        id="recibo-funcionario-tipo"
                        onchange="atualizarCamposReciboFuncionario()">

                        <option value="">
                            Selecione...
                        </option>

                        ${opcoesTipos}

                    </select>

                </div>


                <div>

                    <label>
                        Competência *
                    </label>

                    <input
                        id="recibo-funcionario-competencia"
                        type="month"
                        value="${competenciaAtualReciboFuncionario()}">

                </div>


                <div>

                    <label>
                        Data do Recebimento *
                    </label>

                    <input
                        id="recibo-funcionario-data"
                        type="date"
                        value="${dataHojeFuncionario()}">

                </div>

            </div>


            <div
                id="recibo-funcionario-campos"
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(2,minmax(0,1fr));
                    gap:14px;
                    padding-top:4px;
                "
            >

                <div style="
                    grid-column:1 / -1;
                    color:#64748b;
                    font-size:12px;
                    padding:12px 0;
                ">
                    Selecione o tipo de recibo para preencher os valores.
                </div>

            </div>


            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                padding:15px 16px;
                border-radius:12px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
            ">

                <div>

                    <div style="
                        color:#64748b;
                        font-size:10px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                    ">
                        Total do recibo
                    </div>

                    <div style="
                        margin-top:4px;
                        color:#0f172a;
                        font-size:11px;
                    ">
                        Valor que aparecerá em destaque no documento
                    </div>

                </div>

                <div
                    id="recibo-funcionario-total"
                    style="
                        font-size:25px;
                        font-weight:950;
                        color:#dc2626;
                        white-space:nowrap;
                    "
                >
                    R$ 0,00
                </div>

            </div>

        </div>
    `;

    configModal({

        title:
            '🧾 Gerar Recibo',

        body:
            html,

        size:
            'large',

        confirmText:
            '🖨 Gerar / Imprimir Recibo',

        onConfirm:
            gerarReciboAvulsoFuncionario
    });
};


/* --------------------------------------------------------- */
/* tituloTipoReciboFuncionario                               */
/* Título do recibo de acordo com o tipo.                    */
/* --------------------------------------------------------- */

function tituloTipoReciboFuncionario(
    tipo
) {

    const mapa = {

        'Adiantamento':
            'RECIBO DE ADIANTAMENTO',

        'Auxílio Combustível':
            'RECIBO DE AUXÍLIO COMBUSTÍVEL',

        'Diária':
            'RECIBO DE DIÁRIA',

        'Salário':
            'RECIBO DE SALÁRIO',

        'Vale':
            'RECIBO DE VALE',

        'Vale Transporte':
            'RECIBO DE VALE-TRANSPORTE'
    };

    return (
        mapa[
            tipo
        ]
        ||
        'RECIBO DE PAGAMENTO'
    );
}


/* --------------------------------------------------------- */
/* textoReferenciaReciboFuncionario                          */
/* Frase principal conforme o tipo do recibo.                */
/* --------------------------------------------------------- */

function textoReferenciaReciboFuncionario(
    dados,
    competencia
) {

    const competenciaTexto =
        escaparHTMLFuncionario(
            competencia
        );

    if (
        dados.tipo ===
        'Adiantamento'
    ) {

        return (
            `referente a adiantamento salarial da competência ${competenciaTexto}.`
        );
    }

    if (
        dados.tipo ===
        'Auxílio Combustível'
    ) {

        return (
            `referente a auxílio combustível da competência ${competenciaTexto}.`
        );
    }

    if (
        dados.tipo ===
        'Diária'
    ) {

        const palavra =
            dados.quantidadeDiarias ===
                1
                ?
                'diária'
                :
                'diárias';

        return (
            `referente a ${dados.quantidadeDiarias} ${palavra}, ` +
            `no valor unitário de ${formatarMoeda(dados.valorDiaria)}, ` +
            `da competência ${competenciaTexto}.`
        );
    }

    if (
        dados.tipo ===
        'Salário'
    ) {

        return (
            `referente ao salário da competência ${competenciaTexto}.`
        );
    }

    if (
        dados.tipo ===
        'Vale Transporte'
    ) {

        const palavra =
            dados.quantidadePassagens ===
                1
                ?
                'passagem'
                :
                'passagens';

        return (
            `referente a vale-transporte, correspondente a ` +
            `${dados.quantidadePassagens} ${palavra}, ` +
            `no valor unitário de ${formatarMoeda(dados.valorPassagem)}, ` +
            `da competência ${competenciaTexto}.`
        );
    }

    return (
        `referente a vale da competência ${competenciaTexto}.`
    );
}


/* --------------------------------------------------------- */
/* detalhesReciboFuncionario                                 */
/* Monta os detalhes específicos de cada tipo.               */
/* --------------------------------------------------------- */

function detalhesReciboFuncionario(
    dados
) {

    const linha =
        (
            label,
            valor,
            classe = ''
        ) => `

            <div class="detail-row ${classe}">

                <span>
                    ${label}
                </span>

                <strong>
                    ${valor}
                </strong>

            </div>
        `;

    if (
        dados.tipo ===
        'Salário'
    ) {

        return (
            linha(
                'Valor do salário',
                formatarMoeda(
                    dados.valor
                )
            )
            +
            linha(
                'Descontos',
                `- ${formatarMoeda(
                    dados.descontos
                )}`,
                'negative'
            )
            +
            linha(
                'Bonificação',
                `+ ${formatarMoeda(
                    dados.bonificacao
                )}`,
                'positive'
            )
            +
            linha(
                'Horas extras',
                `+ ${formatarMoeda(
                    dados.horasExtras
                )}`,
                'positive'
            )
        );
    }

    if (
        dados.tipo ===
        'Adiantamento'
    ) {

        return (
            linha(
                'Valor do adiantamento',
                formatarMoeda(
                    dados.valor
                )
            )
            +
            (
                dados.bonificacao > 0
                    ?
                    linha(
                        'Bonificação',
                        `+ ${formatarMoeda(
                            dados.bonificacao
                        )}`,
                        'positive'
                    )
                    :
                    ''
            )
        );
    }

    if (
        dados.tipo ===
        'Diária'
    ) {

        return (
            linha(
                'Quantidade de diárias',
                dados.quantidadeDiarias
            )
            +
            linha(
                'Valor da diária',
                formatarMoeda(
                    dados.valorDiaria
                )
            )
        );
    }

    if (
        dados.tipo ===
        'Vale Transporte'
    ) {

        return (
            linha(
                'Quantidade de passagens',
                dados.quantidadePassagens
            )
            +
            linha(
                'Valor da passagem',
                formatarMoeda(
                    dados.valorPassagem
                )
            )
        );
    }

    return '';
}


/* --------------------------------------------------------- */
/* gerarReciboAvulsoFuncionario                              */
/* Gera e abre o recibo pequeno para impressão.              */
/* --------------------------------------------------------- */

window.gerarReciboAvulsoFuncionario =
async function () {

    const indiceTexto =
        document.getElementById(
            'recibo-funcionario-indice'
        )
        ?.value
        ||
        '';

    const tipo =
        document.getElementById(
            'recibo-funcionario-tipo'
        )
        ?.value
        ||
        '';

    const competenciaISO =
        document.getElementById(
            'recibo-funcionario-competencia'
        )
        ?.value
        ||
        '';

    const dataRecebimento =
        document.getElementById(
            'recibo-funcionario-data'
        )
        ?.value
        ||
        '';

    if (
        indiceTexto ===
        ''
    ) {

        alert(
            'Selecione o funcionário.'
        );

        return;
    }

    if (
        !tipo
    ) {

        alert(
            'Selecione o tipo de recibo.'
        );

        return;
    }

    if (
        !competenciaISO
    ) {

        alert(
            'Selecione a competência.'
        );

        return;
    }

    if (
        !dataRecebimento
    ) {

        alert(
            'Selecione a data do recebimento.'
        );

        return;
    }

    const indice =
        Number(
            indiceTexto
        );

    const funcionario =
        db.funcionarios[
            indice
        ];

    if (
        !funcionario
        ||
        funcionario.status !==
            'Ativo'
    ) {

        alert(
            'O funcionário selecionado não está disponível para este recibo.'
        );

        return;
    }

    const dados =
        calcularDadosReciboFuncionario();

    if (
        tipo ===
        'Diária'
        &&
        (
            dados.quantidadeDiarias <=
                0
            ||
            dados.valorDiaria <=
                0
        )
    ) {

        alert(
            'Informe a quantidade de diárias e o valor da diária.'
        );

        return;
    }

    if (
        tipo ===
        'Vale Transporte'
        &&
        (
            dados.quantidadePassagens <=
                0
            ||
            dados.valorPassagem <=
                0
        )
    ) {

        alert(
            'Informe a quantidade de passagens e o valor da passagem.'
        );

        return;
    }

    if (
        ![
            'Diária',
            'Vale Transporte'
        ]
        .includes(
            tipo
        )
        &&
        dados.valor <=
            0
    ) {

        alert(
            'Informe o valor do recibo.'
        );

        return;
    }

    if (
        dados.total <=
        0
    ) {

        alert(
            'O total do recibo precisa ser maior que zero.'
        );

        return;
    }

    let logoEmpresa =
        '';

    try{

        if(
            window.api
            &&
            typeof window.api.getLogoPath ===
                'function'
        ){

            logoEmpresa =
                await window.api
                    .getLogoPath();
        }

    }
    catch(erro){

        console.warn(
            'Não foi possível carregar a logo no recibo:',
            erro
        );
    }

    const competencia =
        formatarCompetenciaReciboFuncionario(
            competenciaISO
        );

    const valorTotal =
        formatarMoeda(
            dados.total
        );

    const referencia =
        textoReferenciaReciboFuncionario(
            dados,
            competencia
        );

    const detalhes =
        detalhesReciboFuncionario(
            dados
        );

    const ano =
        String(
            dataRecebimento
        )
        .slice(
            0,
            4
        )
        ||
        new Date()
            .getFullYear();

    const nomeFuncionario =
        escaparHTMLFuncionario(
            funcionario.nome
            ||
            'Funcionário'
        );

    const tituloTipo =
        tituloTipoReciboFuncionario(
            tipo
        );

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        ${tituloTipo} - ${nomeFuncionario}
    </title>

    <style>

        *{
            box-sizing:border-box;
        }

        html,
        body{
            margin:0;
            padding:0;
            background:#fff;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            color:#111827;
        }

        body{
            padding:10mm;
        }

        .receipt{
            width:190mm;
            max-width:100%;
            min-height:92mm;
            margin:0 auto;
            border:1.5px solid #9ca3af;
            background:#fff;
        }

        .header{
            display:grid;
            grid-template-columns:
                1fr
                48mm;
            min-height:26mm;
            border-bottom:1px solid #d1d5db;
        }

        .header-main{
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            padding:7px 12px;
            text-align:center;
        }

        .receipt-number{
            font-size:14px;
            font-weight:900;
            color:#111827;
        }

        .receipt-type{
            margin-top:5px;
            font-size:15px;
            font-weight:900;
            text-transform:uppercase;
        }

        .logo-box{
            display:flex;
            align-items:center;
            justify-content:center;
            padding:5px;
            border-left:1px solid #d1d5db;
        }

        .logo{
            max-width:42mm;
            max-height:21mm;
            object-fit:contain;
        }

        .empresa-fallback{
            text-align:center;
            font-size:12px;
            font-weight:900;
        }

        .statement{
            padding:8px 15px 5px;
            text-align:center;
            font-size:12px;
            line-height:1.5;
        }

        .amount{
            padding:3px 15px 8px;
            text-align:center;
            color:#ef1b1b;
            font-size:24px;
            font-weight:950;
            border-bottom:1px solid #e5e7eb;
        }

        .reference{
            padding:8px 16px;
            text-align:center;
            font-size:11.5px;
            line-height:1.5;
            border-bottom:1px solid #e5e7eb;
        }

        .details{
            display:grid;
            grid-template-columns:
                repeat(2,minmax(0,1fr));
            gap:4px 12px;
            padding:7px 16px;
            border-bottom:1px solid #e5e7eb;
        }

        .detail-row{
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding:3px 0;
            font-size:10px;
        }

        .detail-row span{
            color:#475569;
        }

        .detail-row strong{
            color:#111827;
            white-space:nowrap;
        }

        .detail-row.positive strong{
            color:#15803d;
        }

        .detail-row.negative strong{
            color:#b91c1c;
        }

        .footer-grid{
            display:grid;
            grid-template-columns:
                1fr
                1fr;
            gap:0;
            border-bottom:1px solid #e5e7eb;
        }

        .footer-cell{
            padding:5px 12px;
            font-size:10.5px;
        }

        .footer-cell + .footer-cell{
            border-left:1px solid #e5e7eb;
        }

        .footer-label{
            font-weight:900;
            color:#111827;
        }

        .signature{
            padding:13px 18px 8px;
            display:flex;
            align-items:flex-end;
            gap:8px;
            min-height:18mm;
            font-size:10.5px;
        }

        .signature-label{
            font-weight:900;
            white-space:nowrap;
        }

        .signature-line{
            flex:1;
            min-width:40mm;
            border-bottom:1px solid #111827;
            height:12px;
        }

        .employee-name{
            white-space:nowrap;
            font-weight:800;
            text-transform:uppercase;
        }

        @media print{

            @page{
                size:A4 portrait;
                margin:10mm;
            }

            body{
                padding:0;
            }

            .receipt{
                width:190mm;
                margin:0;
            }
        }

    </style>

</head>

<body>

    <div class="receipt">

        <div class="header">

            <div class="header-main">

                <div class="receipt-number">
                    RECIBO / ${escaparHTMLFuncionario(
                        ano
                    )}
                </div>

                <div class="receipt-type">
                    ${escaparHTMLFuncionario(
                        tituloTipo
                    )}
                </div>

            </div>

            <div class="logo-box">

                ${
                    logoEmpresa
                        ? `
                            <img
                                class="logo"
                                src="${logoEmpresa}"
                                alt="WN Comunicação Visual">
                        `
                        : `
                            <div class="empresa-fallback">
                                WN Comunicação Visual
                            </div>
                        `
                }

            </div>

        </div>


        <div class="statement">

            RECEBI DE
            <strong>
                WN COMUNICAÇÃO VISUAL LTDA
            </strong>
            A QUANTIA DE:

        </div>


        <div class="amount">
            ${valorTotal}
        </div>


        <div class="reference">
            ${referencia}
        </div>


        ${
            detalhes
                ? `
                    <div class="details">
                        ${detalhes}
                    </div>
                `
                : ''
        }


        <div class="footer-grid">

            <div class="footer-cell">

                <span class="footer-label">
                    Competência:
                </span>

                ${escaparHTMLFuncionario(
                    competencia
                )}

            </div>

            <div class="footer-cell">

                <span class="footer-label">
                    Data:
                </span>

                ${escaparHTMLFuncionario(
                    formatarDataCarreira(
                        dataRecebimento
                    )
                )}

            </div>

        </div>


        <div class="signature">

            <span class="signature-label">
                Assinatura:
            </span>

            <span class="signature-line"></span>

            <span class="employee-name">
                ${nomeFuncionario}
            </span>

        </div>

    </div>


    <script>

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

    if(
        window.api
        &&
        typeof window.api.imprimirHTML ===
            'function'
    ){

        await window.api
            .imprimirHTML(
                html
            );

        return;
    }

    const janela =
        window.open(
            '',
            '_blank'
        );

    if(
        !janela
    ){

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


/* ========================================================= */
/* 02.2 HELPERS DO PLANO DE CARREIRA                        */
/* ========================================================= */
/*
    Funções usadas para datas, status e identificação
    das etapas da carreira.
*/

/* --------------------------------------------------------- */
/* formatarDataCarreira */
/* Formata datas do plano de carreira para exibição. */
/* --------------------------------------------------------- */

function formatarDataCarreira(valor) {
    if (!valor) return '-';

    const partes = String(valor).split('-');

    if (partes.length !== 3) {
        return valor;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* --------------------------------------------------------- */
/* normalizarStatusEtapaCarreira */
/* Normaliza o status interno de uma etapa de carreira. */
/* --------------------------------------------------------- */

function normalizarStatusEtapaCarreira(status) {
    const s = String(status || '').toLowerCase();

    if (s === 'ativo') return 'ativo';
    if (s === 'concluido' || s === 'concluído') return 'concluido';
    return 'planejado';
}

/* --------------------------------------------------------- */
/* textoStatusEtapaCarreira */
/* Retorna o texto amigável do status da etapa. */
/* --------------------------------------------------------- */

function textoStatusEtapaCarreira(status) {
    const s = normalizarStatusEtapaCarreira(status);

    if (s === 'ativo') return 'Ativo';
    if (s === 'concluido') return 'Concluído';
    return 'Planejado';
}

/* --------------------------------------------------------- */
/* estiloStatusEtapaCarreira */
/* Retorna o estilo visual do status da etapa. */
/* --------------------------------------------------------- */

function estiloStatusEtapaCarreira(status) {
    const s = normalizarStatusEtapaCarreira(status);

    if (s === 'ativo') {
        return 'background:#0057b8;color:#fff;';
    }

    if (s === 'concluido') {
        return 'background:#e5e7eb;color:#374151;';
    }

    return 'background:#dbeafe;color:#1d4ed8;';
}

/* --------------------------------------------------------- */
/* obterEtapaAtivaCarreira */
/* Localiza a etapa de carreira atualmente ativa. */
/* --------------------------------------------------------- */

function obterEtapaAtivaCarreira(func) {
    garantirEstruturaFuncionarioRH(func);

    const ativas = func.planoCarreira
        .filter(etapa => normalizarStatusEtapaCarreira(etapa.status) === 'ativo')
        .sort((a, b) => String(b.inicio || '').localeCompare(String(a.inicio || '')));

    return ativas[0] || null;
}

/* --------------------------------------------------------- */
/* obterProximaEtapaCarreira */
/* Localiza ou projeta a próxima etapa de carreira. */
/* --------------------------------------------------------- */

function obterProximaEtapaCarreira(func, etapaAtiva) {
    garantirEstruturaFuncionarioRH(func);

    const planejadas = func.planoCarreira
        .filter(etapa => normalizarStatusEtapaCarreira(etapa.status) === 'planejado')
        .sort((a, b) => String(a.previsaoPromocao || a.inicio || '9999-12-31')
            .localeCompare(String(b.previsaoPromocao || b.inicio || '9999-12-31')));

    if (planejadas.length) {
        return planejadas[0];
    }

    if (etapaAtiva && (etapaAtiva.proximoCargo || numeroFuncionario(etapaAtiva.salarioPrevisto) > 0)) {
        return {
            cargo: etapaAtiva.proximoCargo || '',
            nivel: '',
            salario: numeroFuncionario(etapaAtiva.salarioPrevisto),
            previsaoPromocao: etapaAtiva.previsaoPromocao || '',
            status: 'planejado'
        };
    }

    return null;
}

/* ========================================================= */
/* 02.3 ABAS ATIVOS / DESLIGADOS                            */
/* ========================================================= */
/*
    A tela principal de Funcionários passa a separar visualmente
    os colaboradores em duas abas:

    ATIVOS:
        Todos os funcionários que ainda possuem vínculo com a
        empresa. Isso inclui os status:
        - Ativo
        - Férias
        - Afastado

    DESLIGADOS:
        Somente funcionários com status "Desligado".

    IMPORTANTE:
    O funcionário NÃO é movido de posição dentro de db.funcionarios.
    A separação é apenas visual e depende do status atual.

    Portanto:
    - ao alterar um funcionário para "Desligado", ele deixa
      imediatamente a aba Ativos e passa para Desligados;
    - ao cancelar uma rescisão e reativá-lo, ele volta
      automaticamente para a aba Ativos.
*/

window.abaFuncionariosAtual =
    window.abaFuncionariosAtual
    ||
    'ativos';


/* --------------------------------------------------------- */
/* alterarAbaFuncionarios                                    */
/* Troca a aba sem recarregar o banco inteiro.               */
/* --------------------------------------------------------- */

window.alterarAbaFuncionarios =
function (
    aba
) {

    window.abaFuncionariosAtual =
        aba ===
            'desligados'
            ?
            'desligados'
            :
            'ativos';

    navigate(
        'funcionarios',
        false
    );
};


/* --------------------------------------------------------- */
/* funcionarioEstaDesligado                                 */
/* Centraliza a identificação do grupo Desligados.           */
/* --------------------------------------------------------- */

function funcionarioEstaDesligado(
    funcionario
) {

    return (
        String(
            funcionario?.status || ''
        )
        .trim()
        .toLowerCase()
        ===
        'desligado'
    );
}


/* ========================================================= */
/* 02.4 ORDEM ALFABÉTICA DOS FUNCIONÁRIOS                   */
/* ========================================================= */
/*
    ordenarFuncionariosPorNome(lista)

    Retorna uma cópia da lista organizada pelo nome.

    IMPORTANTE:
    - db.funcionarios permanece na ordem original;
    - nenhum código, vínculo ou índice é modificado;
    - a ordenação serve somente para facilitar a localização
      visual dos colaboradores.
*/

/* --------------------------------------------------------- */
/* ordenarFuncionariosPorNome                                */
/* Retorna uma cópia em ordem alfabética.                    */
/* --------------------------------------------------------- */

function ordenarFuncionariosPorNome(
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
/* 03. RENDERIZAÇÃO DA PÁGINA DE FUNCIONÁRIOS               */
/* ========================================================= */
/*
    Monta a tela principal com:
    - cadastro de cargos
    - recibos avulsos
    - novo funcionário
    - abas Ativos / Desligados
    - listagem em ordem alfabética
    - Ponto
    - Carreira
    - Férias
    - Rescisão
    - Editar
    - Excluir

    A tabela foi compactada para aproximar a coluna Ações
    da Data de Admissão e reduzir a necessidade de rolagem
    horizontal.
*/

registerPage('funcionarios', function () {

    garantirCadastroCargosFuncionario();
    db.funcionarios.forEach(garantirEstruturaFuncionarioRH);

    /* ===================================================== */
    /* 03.1 LISTA VISUAL EM ORDEM ALFABÉTICA                */
    /* ===================================================== */
    /*
        A lista usada no HTML é uma cópia ordenada.
        db.funcionarios não sofre alteração.
    */

    const funcionariosOrdenados =
        ordenarFuncionariosPorNome(
            db.funcionarios
        );


    /* ===================================================== */
    /* 03.2 SEPARAR ATIVOS E DESLIGADOS                     */
    /* ===================================================== */

    const funcionariosAtivos =
        funcionariosOrdenados
            .filter(
                funcionario =>
                    !funcionarioEstaDesligado(
                        funcionario
                    )
            );

    const funcionariosDesligados =
        funcionariosOrdenados
            .filter(
                funcionario =>
                    funcionarioEstaDesligado(
                        funcionario
                    )
            );

    const abaAtual =
        window.abaFuncionariosAtual ===
            'desligados'
            ?
            'desligados'
            :
            'ativos';

    const funcionariosExibidos =
        abaAtual ===
            'desligados'
            ?
            funcionariosDesligados
            :
            funcionariosAtivos;

    return `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <!-- HEADER -->

    <div class="content-card">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
        ">

            <div>

                <h1 style="
                    font-size:28px;
                    margin-bottom:5px;
                ">
                    Funcionários
                </h1>

                <p style="
                    color:#6b7280;
                ">
                    Gerenciamento de colaboradores.
                </p>

            </div>

            <div style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
            ">

                <button
                    class="btn-action"
                    style="background:#475569;"
                    onclick="abrirCadastroCargosFuncionario()">

                    ⚙ Cargos

                </button>

                <!-- ================================================= -->
                <!-- UNIFORMES E EPIs                                  -->
                <!-- Abre o controle baseado na planilha de uniformes. -->
                <!-- ================================================= -->

                <button
                    class="btn-action"
                    style="background:#1d4ed8;"
                    onclick="abrirUniformesEPIFuncionario()">

                    👕 Uniformes e EPIs

                </button>

                <button
                    class="btn-action"
                    style="background:#0f766e;"
                    onclick="abrirGeradorReciboFuncionario()">

                    🧾 Recibo

                </button>

                <button
                    class="btn-action"
                    onclick="abrirModalFuncionario()">

                    + Novo Funcionário

                </button>

            </div>

        </div>

    </div>

    <!-- LISTA -->

    <div class="content-card">

        <!-- ================================================= -->
        <!-- 03.3 ABAS DE SITUAÇÃO                            -->
        <!-- ================================================= -->

        <div style="
            display:flex;
            align-items:center;
            gap:8px;
            margin-bottom:18px;
            padding-bottom:14px;
            border-bottom:1px solid #e5e7eb;
        ">

            <button
                type="button"
                onclick="alterarAbaFuncionarios('ativos')"
                style="
                    border:none;
                    cursor:pointer;
                    padding:9px 16px;
                    border-radius:10px;
                    font-size:12px;
                    font-weight:850;
                    transition:.15s;
                    background:${
                        abaAtual === 'ativos'
                            ? '#dcfce7'
                            : '#f8fafc'
                    };
                    color:${
                        abaAtual === 'ativos'
                            ? '#166534'
                            : '#64748b'
                    };
                    box-shadow:${
                        abaAtual === 'ativos'
                            ? 'inset 0 0 0 1px #bbf7d0'
                            : 'inset 0 0 0 1px #e2e8f0'
                    };
                "
            >
                Ativos
                <span style="
                    margin-left:5px;
                    opacity:.8;
                ">
                    (${funcionariosAtivos.length})
                </span>
            </button>


            <button
                type="button"
                onclick="alterarAbaFuncionarios('desligados')"
                style="
                    border:none;
                    cursor:pointer;
                    padding:9px 16px;
                    border-radius:10px;
                    font-size:12px;
                    font-weight:850;
                    transition:.15s;
                    background:${
                        abaAtual === 'desligados'
                            ? '#fee2e2'
                            : '#f8fafc'
                    };
                    color:${
                        abaAtual === 'desligados'
                            ? '#991b1b'
                            : '#64748b'
                    };
                    box-shadow:${
                        abaAtual === 'desligados'
                            ? 'inset 0 0 0 1px #fecaca'
                            : 'inset 0 0 0 1px #e2e8f0'
                    };
                "
            >
                Desligados
                <span style="
                    margin-left:5px;
                    opacity:.8;
                ">
                    (${funcionariosDesligados.length})
                </span>
            </button>

        </div>

        ${
            db.funcionarios.length === 0
            ? `
                <p style="
                    text-align:center;
                    color:#777;
                    padding:30px;
                ">
                    Nenhum funcionário cadastrado.
                </p>
            `
            : funcionariosExibidos.length === 0
            ? `
                <p style="
                    text-align:center;
                    color:#777;
                    padding:30px;
                ">
                    ${
                        abaAtual === 'desligados'
                            ? 'Nenhum funcionário desligado.'
                            : 'Nenhum funcionário ativo.'
                    }
                </p>
            `
            : `
                <div style="
                    overflow-x:auto;
                    overflow-y:hidden;
                ">
                    <table style="
                        width:100%;
                        table-layout:auto;
                    ">

                        <thead>

                            <tr>

                                <th style="
                                    width:17%;
                                    min-width:82px;
                                ">
                                    Nome
                                </th>

                                <th style="
                                    width:15%;
                                    min-width:92px;
                                ">
                                    Cargo
                                </th>

                                <th style="
                                    width:11%;
                                    min-width:86px;
                                ">
                                    Status
                                </th>

                                <th style="
                                    width:11%;
                                    min-width:88px;
                                ">
                                    Salário
                                </th>

                                <th style="
                                    width:12%;
                                    min-width:92px;
                                ">
                                    Admissão
                                </th>

                                <th style="
                                    text-align:left;
                                    width:34%;
                                    min-width:430px;
                                    padding-left:8px;
                                ">
                                    Ações
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${funcionariosExibidos.map(f => {

                                /* ========================= */
                                /* ÍNDICE REAL DO FUNCIONÁRIO */
                                /* ========================= */
                                /*
                                    A lista está em ordem alfabética,
                                    mas as ações precisam continuar
                                    apontando para db.funcionarios.
                                */

                                const index =
                                    db.funcionarios.indexOf(
                                        f
                                    );

                                return `

                                <tr>

                                    <td>
                                        ${escaparHTMLFuncionario(f.nome || '-')}
                                    </td>

                                    <td>
                                        ${escaparHTMLFuncionario(f.cargo || '-')}
                                    </td>

                                    <td>

                                        <span class="status ${getStatusFuncionarioClass(f.status)}">

                                            ${escaparHTMLFuncionario(f.status || '-')}

                                        </span>

                                    </td>

                                    <td>
                                        ${formatarMoeda(f.salario)}
                                    </td>

                                    <td>
                                        ${formatarDataBR(f.admissao)}
                                    </td>

                                    <td style="
                                        text-align:left;
                                        white-space:nowrap;
                                        padding-left:8px;
                                        padding-right:4px;
                                    ">

                                        <div style="
                                            display:flex;
                                            justify-content:flex-start;
                                            align-items:center;
                                            gap:4px;
                                            flex-wrap:nowrap;
                                            min-width:max-content;
                                        ">
                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:5px 7px;
                                                    font-size:0.68rem;
                                                    background:#2563eb;
                                                "
                                                onclick="abrirPontoFuncionario(${index})">

                                                🕒 Ponto

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:5px 7px;
                                                    font-size:0.68rem;
                                                    background:#0f766e;
                                                "
                                                onclick="abrirPlanoCarreira(${index})">

                                                📈 Carreira

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:5px 7px;
                                                    font-size:0.68rem;
                                                    background:#7c3aed;
                                                "
                                                onclick="abrirFeriasFuncionario(${index})">

                                                🏖 Férias

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:5px 7px;
                                                    font-size:0.68rem;
                                                    background:#be123c;
                                                "
                                                onclick="abrirRescisaoFuncionario(${index})">

                                                🧾 Rescisão

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:5px 7px;
                                                    font-size:0.68rem;
                                                    background:#f59e0b;
                                                "
                                                onclick="editarFuncionario(${index})">

                                                ✏ Editar

                                            </button>

                                            <button
                                                class="btn-del"
                                                style="
                                                    padding:5px 7px;
                                                    font-size:0.68rem;
                                                "
                                                onclick="deleteItem('funcionarios', ${index})">

                                                Excluir

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `;
                            }).join('')}

                        </tbody>

                    </table>
                </div>
            `
        }

    </div>

</div>
`;
});

/* ========================================================= */
/* 04. CADASTRO DE FUNCIONÁRIO                              */
/* ========================================================= */
/*
    Abre o formulário de novo funcionário e cria toda
    a estrutura inicial usada por Ponto, Carreira,
    Férias e Rescisão.
*/

/* --------------------------------------------------------- */
/* abrirModalFuncionario */
/* Abre o formulário para cadastrar um novo funcionário. */
/* --------------------------------------------------------- */

window.abrirModalFuncionario = function () {

    const html = `

<label>Nome</label>
<input id="f-nome">

<div class="form-row">

    <div>

        <label>Setor/Cargo</label>

        <select id="f-cargo">
            ${opcoesCargoFuncionario(cargosPadraoFuncionario()[0] || '')}
        </select>

    </div>

    <div>

        <label>Status</label>

        <select id="f-status">

            <option>Ativo</option>
            <option>Férias</option>
            <option>Afastado</option>
            <option>Desligado</option>

        </select>

    </div>

</div>

<div class="form-row">

    <div>

        <label>Salário</label>

        <input
            type="number"
            step="0.01"
            min="0"
            id="f-salario"
            placeholder="0.00">

    </div>

    <div>

        <label>Data de Admissão</label>

        <input
            type="date"
            id="f-admissao">

    </div>

</div>

<div style="
    margin-top:10px;
    margin-bottom:8px;
    font-size:13px;
    font-weight:800;
    color:#374151;
">
    Horário padrão da empresa
</div>

<div class="form-row">

    <div>

        <label>Entrada</label>

        <input
            type="time"
            id="f-entrada"
            value="07:45">

    </div>

    <div>

        <label>Saída Almoço</label>

        <input
            type="time"
            id="f-almoco-saida"
            value="12:00">

    </div>

</div>

<div class="form-row">

    <div>

        <label>Volta Almoço</label>

        <input
            type="time"
            id="f-almoco-volta"
            value="13:30">

    </div>

    <div>

        <label>Saída</label>

        <input
            type="time"
            id="f-saida"
            value="18:00">

    </div>

</div>

<label>Observações</label>

<textarea
    id="f-obs"
    rows="4"></textarea>
`;

    configModal({

        title: 'Cadastro de Funcionário',

        body: html,

        confirmText: 'Salvar',

        onConfirm() {

            const funcionario = {

                id: Date.now(),

                nome:
                    str(document.getElementById('f-nome').value),

                cargo:
                    str(document.getElementById('f-cargo').value),

                status:
                    str(document.getElementById('f-status').value),

                salario:
                    num(document.getElementById('f-salario').value),

                admissao:
                    str(document.getElementById('f-admissao').value),

                horarios: {

                    entrada:
                        str(document.getElementById('f-entrada').value),

                    almocoSaida:
                        str(document.getElementById('f-almoco-saida').value),

                    almocoVolta:
                        str(document.getElementById('f-almoco-volta').value),

                    saida:
                        str(document.getElementById('f-saida').value)
                },

                observacoes:
                    str(document.getElementById('f-obs').value),

                ponto: [],

                mesesFechados: {},

                fechamentosPonto: {},

                planoCarreira: [],

                ferias: [],

                acertosRescisao: [],

                feriadosPonto:
                    typeof window.obterFeriadosCustomizadosEmpresaPonto === 'function'
                        ? window.obterFeriadosCustomizadosEmpresaPonto()
                        : [],

                folhaFechada: false,

                dataFechamento: null
            };

            if (!funcionario.nome) {
                alert('Informe o nome do funcionário.');
                return;
            }

            if (funcionario.salario < 0) {
                alert('O salário não pode ser negativo.');
                return;
            }

            funcionario.planoCarreira.push({
                id: Date.now() + 1,
                cargo: funcionario.cargo,
                nivel: '',
                salario: funcionario.salario,
                status: 'ativo',
                inicio: funcionario.admissao || dataHojeFuncionario(),
                fim: '',
                proximoCargo: '',
                salarioPrevisto: 0,
                previsaoPromocao: '',
                requisitos: '',
                competencias: '',
                observacoes: 'Etapa inicial criada no cadastro do funcionário.',
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString()
            });

            db.funcionarios.push(funcionario);

            save();
            closeModal();

            /*
                A aba é filtrada pelo status em tempo real.

                Se o status acabou de ser alterado para "Desligado",
                o funcionário deixa automaticamente a aba Ativos e
                passa a existir somente em Desligados.

                Se for reativado, acontece o caminho inverso.
            */

            navigate(
                'funcionarios'
            );
        }
    });
};

/* ========================================================= */
/* 05. EDIÇÃO DE FUNCIONÁRIO                                */
/* ========================================================= */
/*
    Permite alterar dados cadastrais, salário, status,
    horário padrão e observações do funcionário.
*/

/* --------------------------------------------------------- */
/* editarFuncionario */
/* Abre o formulário para editar um funcionário existente. */
/* --------------------------------------------------------- */

window.editarFuncionario = function (index) {

    const f =
        db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const html = `

<label>Nome</label>

<input
    id="edit-f-nome"
    value="${escaparHTMLFuncionario(f.nome || '')}">

<div class="form-row">

    <div>

        <label>Setor/Cargo</label>

        <select id="edit-f-cargo">
            ${opcoesCargoFuncionario(f.cargo || '')}
        </select>

    </div>

    <div>

        <label>Status</label>

        <select id="edit-f-status">

            <option ${f.status === 'Ativo' ? 'selected' : ''}>
                Ativo
            </option>

            <option ${f.status === 'Férias' ? 'selected' : ''}>
                Férias
            </option>

            <option ${f.status === 'Afastado' ? 'selected' : ''}>
                Afastado
            </option>

            <option ${f.status === 'Desligado' ? 'selected' : ''}>
                Desligado
            </option>

        </select>

    </div>

</div>

<div class="form-row">

    <div>

        <label>Salário</label>

        <input
            type="number"
            step="0.01"
            min="0"
            id="edit-f-salario"
            value="${numeroFuncionario(f.salario)}">

    </div>

    <div>

        <label>Data de Admissão</label>

        <input
            type="date"
            id="edit-f-admissao"
            value="${escaparHTMLFuncionario(f.admissao || '')}">

    </div>

</div>

<div style="
    margin-top:10px;
    margin-bottom:8px;
    font-size:13px;
    font-weight:800;
    color:#374151;
">
    Horário padrão da empresa
</div>

<div class="form-row">

    <div>

        <label>Entrada</label>

        <input
            type="time"
            id="edit-f-entrada"
            value="${escaparHTMLFuncionario(f.horarios?.entrada || '07:45')}">

    </div>

    <div>

        <label>Saída Almoço</label>

        <input
            type="time"
            id="edit-f-almoco-saida"
            value="${escaparHTMLFuncionario(f.horarios?.almocoSaida || '12:00')}">

    </div>

</div>

<div class="form-row">

    <div>

        <label>Volta Almoço</label>

        <input
            type="time"
            id="edit-f-almoco-volta"
            value="${escaparHTMLFuncionario(f.horarios?.almocoVolta || '13:30')}">

    </div>

    <div>

        <label>Saída</label>

        <input
            type="time"
            id="edit-f-saida"
            value="${escaparHTMLFuncionario(f.horarios?.saida || '18:00')}">

    </div>

</div>

<label>Observações</label>

<textarea
    id="edit-f-obs"
    rows="4">${escaparHTMLFuncionario(f.observacoes || '')}</textarea>
`;

    configModal({

        title: 'Editar Funcionário',

        body: html,

        confirmText: 'Salvar Alterações',

        onConfirm() {

            f.nome =
                str(document.getElementById('edit-f-nome').value);

            f.cargo =
                str(document.getElementById('edit-f-cargo').value);

            f.status =
                str(document.getElementById('edit-f-status').value);

            f.salario =
                num(document.getElementById('edit-f-salario').value);

            f.admissao =
                str(document.getElementById('edit-f-admissao').value);

            f.horarios = {

                entrada:
                    str(document.getElementById('edit-f-entrada').value),

                almocoSaida:
                    str(document.getElementById('edit-f-almoco-saida').value),

                almocoVolta:
                    str(document.getElementById('edit-f-almoco-volta').value),

                saida:
                    str(document.getElementById('edit-f-saida').value)
            };

            f.observacoes =
                str(document.getElementById('edit-f-obs').value);

            const etapaAtiva = obterEtapaAtivaCarreira(f);

            if (etapaAtiva) {
                etapaAtiva.cargo = f.cargo;
                etapaAtiva.salario = f.salario;
                etapaAtiva.atualizadoEm = new Date().toISOString();
            }

            if (!f.nome) {
                alert('Informe o nome do funcionário.');
                return;
            }

            if (f.salario < 0) {
                alert('O salário não pode ser negativo.');
                return;
            }

            save();
            closeModal();
            navigate('funcionarios');
        }
    });
};

/* ========================================================= */
/* 06. PLANO DE CARREIRA                                    */
/* ========================================================= */
/*
    Controla:
    - etapa atual
    - próxima etapa
    - histórico
    - nível
    - salário
    - previsão de promoção
    - requisitos
    - competências
*/

/* --------------------------------------------------------- */
/* abrirPlanoCarreira */
/* Abre o painel completo do plano de carreira. */
/* --------------------------------------------------------- */

window.abrirPlanoCarreira = function (index) {

    const f = db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const etapaAtiva =
        obterEtapaAtivaCarreira(f);

    const proximaEtapa =
        obterProximaEtapaCarreira(
            f,
            etapaAtiva
        );

    const cargoAtual =
        etapaAtiva?.cargo ||
        f.cargo ||
        '-';

    const nivelAtual =
        etapaAtiva?.nivel ||
        '';

    const salarioAtual =
        numeroFuncionario(
            etapaAtiva?.salario ?? f.salario
        );

    const proximoCargo =
        proximaEtapa?.cargo ||
        etapaAtiva?.proximoCargo ||
        '-';

    const proximoNivel =
        proximaEtapa?.nivel ||
        '';

    const salarioPrevisto =
        numeroFuncionario(
            proximaEtapa?.salario ||
            etapaAtiva?.salarioPrevisto
        );

    const previsao =
        proximaEtapa?.previsaoPromocao ||
        etapaAtiva?.previsaoPromocao ||
        '';

    const aumento =
        salarioPrevisto > 0
            ? salarioPrevisto - salarioAtual
            : 0;

    const percentual =
        salarioAtual > 0 && salarioPrevisto > 0
            ? (aumento / salarioAtual) * 100
            : 0;

    /* ===================================================== */
    /* FUNCIONÁRIOS DO SELETOR EM ORDEM ALFABÉTICA          */
    /* ===================================================== */

    const opcoesFuncionarios =
        ordenarFuncionariosPorNome(
            db.funcionarios
        )
        .map(
            func => {

                const idx =
                    db.funcionarios.indexOf(
                        func
                    );

                return `
                    <option value="${idx}" ${idx === index ? 'selected' : ''}>
                        ${escaparHTMLFuncionario(func.nome || `Funcionário ${idx + 1}`)}
                    </option>
                `;
            }
        )
        .join('');

    const historico =
        [...f.planoCarreira]
            .sort((a, b) => String(b.inicio || '').localeCompare(String(a.inicio || '')));

    const linhas =
        historico.length
        ? historico.map(etapa => `
            <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    ${formatarDataCarreira(etapa.inicio)}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    <strong>${escaparHTMLFuncionario(etapa.cargo || '-')}</strong>
                    ${etapa.nivel ? `<span style="color:#6b7280;"> · ${escaparHTMLFuncionario(etapa.nivel)}</span>` : ''}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${formatarMoeda(numeroFuncionario(etapa.salario))}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    ${escaparHTMLFuncionario(etapa.proximoCargo || '-')}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${formatarDataCarreira(etapa.previsaoPromocao)}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    <span style="
                        display:inline-block;
                        padding:4px 10px;
                        border-radius:999px;
                        font-size:11px;
                        font-weight:800;
                        ${estiloStatusEtapaCarreira(etapa.status)}
                    ">
                        ${textoStatusEtapaCarreira(etapa.status)}
                    </span>
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">
                    <button
                        type="button"
                        title="Editar etapa"
                        onclick="editarEtapaCarreira(${index}, '${String(etapa.id)}')"
                        style="
                            border:none;
                            background:transparent;
                            cursor:pointer;
                            font-size:16px;
                            padding:5px 7px;
                        ">
                        ✏️
                    </button>
                    <button
                        type="button"
                        title="Excluir etapa"
                        onclick="excluirEtapaCarreira(${index}, '${String(etapa.id)}')"
                        style="
                            border:none;
                            background:transparent;
                            color:#dc2626;
                            cursor:pointer;
                            font-size:16px;
                            padding:5px 7px;
                        ">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="7" style="padding:30px;text-align:center;color:#6b7280;">
                    Nenhuma etapa de carreira cadastrada.
                </td>
            </tr>
        `;

    const html = `
        <div style="display:flex;flex-direction:column;gap:16px;">

            <div class="content-card" style="padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap;">
                    <div style="min-width:260px;">
                        <label style="font-weight:700;">Funcionário</label>
                        <select
                            id="carreira-funcionario"
                            onchange="abrirPlanoCarreira(Number(this.value))"
                            style="min-width:260px;">
                            ${opcoesFuncionarios}
                        </select>
                    </div>

                    <button
                        class="btn-action"
                        style="background:#0057b8;"
                        onclick="novaEtapaCarreira(${index})">
                        ＋ Nova etapa
                    </button>
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3,minmax(0,1fr));
                gap:12px;
            ">
                <div class="content-card" style="padding:16px;">
                    <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;">
                        Cargo atual
                    </div>
                    <div style="font-size:20px;font-weight:800;margin-top:6px;">
                        ${escaparHTMLFuncionario(cargoAtual)}${nivelAtual ? ` · ${escaparHTMLFuncionario(nivelAtual)}` : ''}
                    </div>
                    <div style="color:#64748b;margin-top:5px;">
                        ${formatarMoeda(salarioAtual)}
                    </div>
                </div>

                <div class="content-card" style="padding:16px;background:#eff6ff;border:1px solid #93c5fd;">
                    <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;">
                        Próximo passo
                    </div>
                    <div style="font-size:20px;font-weight:800;margin-top:6px;color:#0057b8;">
                        ${escaparHTMLFuncionario(proximoCargo)}${proximoNivel ? ` · ${escaparHTMLFuncionario(proximoNivel)}` : ''}
                    </div>
                    <div style="color:#64748b;margin-top:5px;">
                        ${salarioPrevisto > 0 ? formatarMoeda(salarioPrevisto) : '-'}
                        ${previsao ? ` · prev. ${formatarDataCarreira(previsao)}` : ''}
                    </div>
                </div>

                <div class="content-card" style="padding:16px;">
                    <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;">
                        Aumento previsto
                    </div>
                    <div style="font-size:20px;font-weight:800;margin-top:6px;color:${aumento >= 0 ? '#059669' : '#dc2626'};">
                        ${salarioPrevisto > 0 ? `${aumento >= 0 ? '+' : ''} ${formatarMoeda(aumento)}` : '-'}
                    </div>
                    <div style="color:#64748b;margin-top:5px;">
                        ${salarioPrevisto > 0 ? `${percentual.toFixed(1)}%` : '-'}
                    </div>
                </div>
            </div>

            <div class="content-card" style="padding:0;overflow:auto;">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th>Início</th>
                            <th>Cargo / Nível</th>
                            <th>Salário</th>
                            <th>Próximo cargo</th>
                            <th>Previsão</th>
                            <th>Status</th>
                            <th style="text-align:right;">Ações</th>
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
        title: '📈 Plano de Carreira',
        body: html,
        confirmText: 'Fechar',
        onConfirm() {
            closeModal();
        }
    });

    setTimeout(() => {
        const content = document.querySelector('#modal-global .content-card');
        if (content) {
            content.style.width = '96vw';
            content.style.maxWidth = '1200px';
        }
    }, 0);
};

/* --------------------------------------------------------- */
/* novaEtapaCarreira */
/* Inicia o cadastro de uma nova etapa de carreira. */
/* --------------------------------------------------------- */

window.novaEtapaCarreira = function (index) {
    abrirFormularioEtapaCarreira(index, null);
};

/* --------------------------------------------------------- */
/* editarEtapaCarreira */
/* Abre uma etapa de carreira existente para edição. */
/* --------------------------------------------------------- */

window.editarEtapaCarreira = function (index, etapaId) {
    abrirFormularioEtapaCarreira(index, etapaId);
};

/* --------------------------------------------------------- */
/* abrirFormularioEtapaCarreira */
/* Monta e processa o formulário de etapa de carreira. */
/* --------------------------------------------------------- */

function abrirFormularioEtapaCarreira(index, etapaId = null) {

    const f = db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const etapa =
        etapaId !== null
            ? f.planoCarreira.find(item => String(item.id) === String(etapaId))
            : null;

    const dados = etapa || {
        cargo: f.cargo || '',
        nivel: '',
        salario: numeroFuncionario(f.salario),
        status: 'ativo',
        inicio: dataHojeFuncionario(),
        fim: '',
        proximoCargo: '',
        salarioPrevisto: 0,
        previsaoPromocao: '',
        requisitos: '',
        competencias: '',
        observacoes: ''
    };

    const html = `
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">

            <div>
                <label>Cargo *</label>
                <select id="car-cargo">
                    ${opcoesCargoFuncionario(dados.cargo || '', true)}
                </select>
            </div>

            <div>
                <label>Nível</label>
                <input
                    id="car-nivel"
                    value="${escaparHTMLFuncionario(dados.nivel || '')}"
                    placeholder="Ex.: Júnior / Pleno / Sênior">
            </div>

            <div>
                <label>Salário atual (R$) *</label>
                <input
                    id="car-salario"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${numeroFuncionario(dados.salario)}">
            </div>

            <div>
                <label>Status</label>
                <select id="car-status">
                    <option value="ativo" ${normalizarStatusEtapaCarreira(dados.status) === 'ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="planejado" ${normalizarStatusEtapaCarreira(dados.status) === 'planejado' ? 'selected' : ''}>Planejado</option>
                    <option value="concluido" ${normalizarStatusEtapaCarreira(dados.status) === 'concluido' ? 'selected' : ''}>Concluído</option>
                </select>
            </div>

            <div>
                <label>Início *</label>
                <input
                    id="car-inicio"
                    type="date"
                    value="${escaparHTMLFuncionario(dados.inicio || '')}">
            </div>

            <div>
                <label>Fim</label>
                <input
                    id="car-fim"
                    type="date"
                    value="${escaparHTMLFuncionario(dados.fim || '')}">
            </div>

            <div style="grid-column:1 / -1;">
                <label style="color:#0057b8;">Próximo cargo (meta)</label>
                <select id="car-proximo">
                    ${opcoesCargoFuncionario(dados.proximoCargo || '', true)}
                </select>
            </div>

            <div>
                <label>Salário previsto (R$)</label>
                <input
                    id="car-salario-previsto"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${numeroFuncionario(dados.salarioPrevisto)}">
            </div>

            <div>
                <label>Previsão de promoção</label>
                <input
                    id="car-previsao"
                    type="date"
                    value="${escaparHTMLFuncionario(dados.previsaoPromocao || '')}">
            </div>

            <div style="grid-column:1 / -1;">
                <label>Requisitos para promoção</label>
                <textarea
                    id="car-requisitos"
                    rows="3"
                    placeholder="Ex.: 1 ano no cargo, curso técnico, metas atingidas...">${escaparHTMLFuncionario(dados.requisitos || '')}</textarea>
            </div>

            <div style="grid-column:1 / -1;">
                <label>Competências a desenvolver</label>
                <textarea
                    id="car-competencias"
                    rows="3">${escaparHTMLFuncionario(dados.competencias || '')}</textarea>
            </div>

            <div style="grid-column:1 / -1;">
                <label>Observações</label>
                <textarea
                    id="car-observacoes"
                    rows="3">${escaparHTMLFuncionario(dados.observacoes || '')}</textarea>
            </div>

        </div>
    `;

    configModal({
        title: etapa ? 'Editar etapa de carreira' : 'Nova etapa de carreira',
        body: html,
        confirmText: 'Salvar',
        onConfirm: async function () {

            const cargo = document.getElementById('car-cargo').value.trim();
            const nivel = document.getElementById('car-nivel').value.trim();
            const salario = numeroFuncionario(document.getElementById('car-salario').value);
            const status = document.getElementById('car-status').value;
            const inicio = document.getElementById('car-inicio').value;
            const fim = document.getElementById('car-fim').value;
            const proximoCargo = document.getElementById('car-proximo').value.trim();
            const salarioPrevisto = numeroFuncionario(document.getElementById('car-salario-previsto').value);
            const previsaoPromocao = document.getElementById('car-previsao').value;
            const requisitos = document.getElementById('car-requisitos').value.trim();
            const competencias = document.getElementById('car-competencias').value.trim();
            const observacoes = document.getElementById('car-observacoes').value.trim();

            if (!cargo) {
                alert('Informe o cargo.');
                return;
            }

            if (!inicio) {
                alert('Informe a data de início.');
                return;
            }

            if (salario < 0 || salarioPrevisto < 0) {
                alert('Os salários não podem ser negativos.');
                return;
            }

            if (status === 'ativo') {
                f.planoCarreira.forEach(item => {
                    if (
                        String(item.id) !== String(etapaId) &&
                        normalizarStatusEtapaCarreira(item.status) === 'ativo'
                    ) {
                        item.status = 'concluido';

                        if (!item.fim) {
                            item.fim = inicio || dataHojeFuncionario();
                        }
                    }
                });
            }

            const novoDados = {
                cargo,
                nivel,
                salario,
                status,
                inicio,
                fim,
                proximoCargo,
                salarioPrevisto,
                previsaoPromocao,
                requisitos,
                competencias,
                observacoes,
                atualizadoEm: new Date().toISOString()
            };

            if (etapa) {
                Object.assign(etapa, novoDados);
            } else {
                f.planoCarreira.push({
                    id: Date.now(),
                    criadoEm: new Date().toISOString(),
                    ...novoDados
                });
            }

            if (status === 'ativo') {
                f.cargo = cargo;
                f.salario = salario;
            }

            await save();
            abrirPlanoCarreira(index);
        }
    });

    setTimeout(() => {
        const content = document.querySelector('#modal-global .content-card');
        if (content) {
            content.style.width = '94vw';
            content.style.maxWidth = '900px';
        }
    }, 0);
}

/* --------------------------------------------------------- */
/* excluirEtapaCarreira */
/* Exclui uma etapa de carreira após confirmação. */
/* --------------------------------------------------------- */

window.excluirEtapaCarreira = async function (index, etapaId) {

    const f = db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const etapa = f.planoCarreira.find(item => String(item.id) === String(etapaId));

    if (!etapa) return;

    if (!confirm(`Deseja excluir a etapa "${etapa.cargo || 'sem cargo'}"?`)) {
        return;
    }

    f.planoCarreira = f.planoCarreira.filter(item => String(item.id) !== String(etapaId));

    await save();
    abrirPlanoCarreira(index);
};


/* ========================================================= */
/* 07. FÉRIAS                                               */
/* ========================================================= */
/*
    Controla períodos aquisitivos, saldo, faltas,
    agendamento, abono, valores e histórico de férias.
*/

/* ========================================================= */
/* 07.1 REGRAS E CÁLCULOS DE FÉRIAS                         */
/* ========================================================= */
/*
    Funções auxiliares para direito de férias,
    faltas, períodos aquisitivos, valores e status.
*/

/* --------------------------------------------------------- */
/* direitoFeriasPorFaltasFuncionario */
/* Calcula a quantidade de dias de férias conforme faltas. */
/* --------------------------------------------------------- */

function direitoFeriasPorFaltasFuncionario(faltas) {
    faltas = Math.max(
        0,
        Math.floor(
            numeroFuncionario(faltas)
        )
    );

    if (faltas <= 5) return 30;
    if (faltas <= 14) return 24;
    if (faltas <= 23) return 18;
    if (faltas <= 32) return 12;

    return 0;
}

/* --------------------------------------------------------- */
/* contarFaltasInjustificadasPeriodoFuncionario */
/* Conta faltas injustificadas dentro do período aquisitivo. */
/* --------------------------------------------------------- */

function contarFaltasInjustificadasPeriodoFuncionario(
    func,
    inicio,
    fim
) {
    garantirEstruturaFuncionarioRH(func);

    return (func.ponto || []).filter(reg => (
        reg &&
        reg.falta === true &&
        reg.faltaJustificada !== true &&
        reg.data >= inicio &&
        reg.data <= fim
    )).length;
}

/* --------------------------------------------------------- */
/* obterPeriodosAquisitivosFuncionario */
/* Monta os períodos aquisitivos e respectivos saldos de férias. */
/* --------------------------------------------------------- */

function obterPeriodosAquisitivosFuncionario(func) {
    garantirEstruturaFuncionarioRH(func);

    if (!func.admissao) {
        return [];
    }

    const periodos = [];
    const hoje = dataHojeFuncionario();

    /*
        Exibimos períodos desde a admissão até um período
        além da data atual, para permitir planejamento.
    */
    for (let i = 0; i < 40; i++) {
        const inicio = somarAnosFuncionario(
            func.admissao,
            i
        );

        const proximoInicio = somarAnosFuncionario(
            func.admissao,
            i + 1
        );

        if (!inicio || !proximoInicio) {
            break;
        }

        const fim = somarDiasFuncionario(
            proximoInicio,
            -1
        );

        const concessivoFim = somarDiasFuncionario(
            somarAnosFuncionario(
                proximoInicio,
                1
            ),
            -1
        );

        const faltas =
            contarFaltasInjustificadasPeriodoFuncionario(
                func,
                inicio,
                fim
            );

        const direito =
            direitoFeriasPorFaltasFuncionario(
                faltas
            );

        const usados = (func.ferias || [])
            .filter(item => (
                item.periodoAquisitivoInicio === inicio &&
                normalizarTextoFuncionarioRH(item.status) !== 'cancelado' &&
                normalizarTextoFuncionarioRH(item.status) !== 'cancelada'
            ))
            .reduce(
                (total, item) =>
                    total +
                    numeroFuncionario(item.diasGozo) +
                    numeroFuncionario(item.diasAbono),
                0
            );

        periodos.push({
            inicio,
            fim,
            concessivoFim,
            faltas,
            direito,
            usados,
            saldo:
                Math.max(
                    0,
                    direito - usados
                ),
            adquirido:
                hoje > fim,
            vencido:
                hoje > concessivoFim &&
                Math.max(0, direito - usados) > 0
        });

        if (inicio > hoje && i > 1) {
            break;
        }
    }

    return periodos;
}

/* --------------------------------------------------------- */
/* normalizarTextoFuncionarioRH */
/* Normaliza textos usados nas comparações internas de RH. */
/* --------------------------------------------------------- */

function normalizarTextoFuncionarioRH(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/* --------------------------------------------------------- */
/* statusFeriasTextoFuncionario */
/* Retorna o texto amigável do status das férias. */
/* --------------------------------------------------------- */

function statusFeriasTextoFuncionario(status) {
    const s = normalizarTextoFuncionarioRH(status);

    if (s === 'concluido' || s === 'concluida') {
        return 'Concluídas';
    }

    if (s === 'cancelado' || s === 'cancelada') {
        return 'Canceladas';
    }

    return 'Agendadas';
}

/* --------------------------------------------------------- */
/* statusFeriasEstiloFuncionario */
/* Retorna o estilo visual do status das férias. */
/* --------------------------------------------------------- */

function statusFeriasEstiloFuncionario(status) {
    const s = normalizarTextoFuncionarioRH(status);

    if (s === 'concluido' || s === 'concluida') {
        return 'background:#dcfce7;color:#166534;';
    }

    if (s === 'cancelado' || s === 'cancelada') {
        return 'background:#fee2e2;color:#991b1b;';
    }

    return 'background:#ede9fe;color:#5b21b6;';
}

/* --------------------------------------------------------- */
/* calcularValorFeriasFuncionario */
/* Calcula remuneração, terço e abono usados na tela de férias. */
/* --------------------------------------------------------- */

function calcularValorFeriasFuncionario(
    salario,
    diasGozo,
    diasAbono = 0
) {
    salario =
        Math.max(
            0,
            numeroFuncionario(salario)
        );

    diasGozo =
        Math.max(
            0,
            numeroFuncionario(diasGozo)
        );

    diasAbono =
        Math.max(
            0,
            numeroFuncionario(diasAbono)
        );

    const valorDia =
        salario / 30;

    const remuneracaoGozo =
        valorDia *
        diasGozo;

    const tercoGozo =
        remuneracaoGozo / 3;

    const abono =
        valorDia *
        diasAbono;

    const tercoAbono =
        abono / 3;

    return {
        valorDia,
        remuneracaoGozo,
        tercoGozo,
        abono,
        tercoAbono,
        totalBruto:
            remuneracaoGozo +
            tercoGozo +
            abono +
            tercoAbono
    };
}

/* --------------------------------------------------------- */
/* periodosFeriasHTMLFuncionario */
/* Monta as opções dos períodos aquisitivos. */
/* --------------------------------------------------------- */

function periodosFeriasHTMLFuncionario(
    func,
    periodoSelecionado = ''
) {
    return obterPeriodosAquisitivosFuncionario(func)
        .map(p => {
            const valor =
                p.inicio;

            const texto =
                `${formatarDataCarreira(p.inicio)} a ${formatarDataCarreira(p.fim)} · direito ${p.direito} dias · saldo ${p.saldo}`;

            return `
                <option
                    value="${escaparHTMLFuncionario(valor)}"
                    ${valor === periodoSelecionado ? 'selected' : ''}>
                    ${escaparHTMLFuncionario(texto)}
                </option>
            `;
        })
        .join('');
}

/* --------------------------------------------------------- */
/* abrirFeriasFuncionario */
/* Abre o painel de férias do funcionário. */
/* --------------------------------------------------------- */

window.abrirFeriasFuncionario = function (index) {
    const f = db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const periodos =
        obterPeriodosAquisitivosFuncionario(f);

    const periodoAtual =
        [...periodos]
        .reverse()
        .find(p => p.adquirido && p.saldo > 0)
        ||
        [...periodos]
        .reverse()
        .find(p => p.saldo > 0)
        ||
        periodos[0]
        ||
        null;

    const historico =
        [...(f.ferias || [])]
        .sort(
            (a, b) =>
                String(b.inicio || '')
                .localeCompare(
                    String(a.inicio || '')
                )
        );

    const linhas =
        historico.length
        ?
        historico
        .map(item => `
            <tr>
                <td style="padding:11px;border-bottom:1px solid #e5e7eb;">
                    ${formatarDataCarreira(item.periodoAquisitivoInicio)}
                    a
                    ${formatarDataCarreira(item.periodoAquisitivoFim)}
                </td>

                <td style="padding:11px;border-bottom:1px solid #e5e7eb;">
                    ${formatarDataCarreira(item.inicio)}
                    a
                    ${formatarDataCarreira(item.fim)}
                </td>

                <td style="padding:11px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    ${numeroFuncionario(item.diasGozo)}${numeroFuncionario(item.diasAbono) > 0 ? ` + ${numeroFuncionario(item.diasAbono)} abono` : ''}
                </td>

                <td style="padding:11px;border-bottom:1px solid #e5e7eb;text-align:right;">
                    ${formatarMoeda(numeroFuncionario(item.totalBruto))}
                </td>

                <td style="padding:11px;border-bottom:1px solid #e5e7eb;">
                    <span style="
                        display:inline-block;
                        padding:4px 9px;
                        border-radius:999px;
                        font-size:10px;
                        font-weight:800;
                        ${statusFeriasEstiloFuncionario(item.status)}
                    ">
                        ${statusFeriasTextoFuncionario(item.status)}
                    </span>
                </td>

                <td style="padding:11px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">
                    <button
                        type="button"
                        onclick="editarFeriasFuncionario(${index}, '${String(item.id)}')"
                        title="Editar"
                        style="
                            border:none;
                            background:transparent;
                            cursor:pointer;
                            font-size:16px;
                            padding:5px 7px;
                        ">
                        ✏️
                    </button>

                    <button
                        type="button"
                        onclick="excluirFeriasFuncionario(${index}, '${String(item.id)}')"
                        title="Excluir"
                        style="
                            border:none;
                            background:transparent;
                            color:#dc2626;
                            cursor:pointer;
                            font-size:16px;
                            padding:5px 7px;
                        ">
                        🗑️
                    </button>
                </td>
            </tr>
        `)
        .join('')
        :
        `
            <tr>
                <td
                    colspan="6"
                    style="
                        padding:28px;
                        text-align:center;
                        color:#6b7280;
                    ">
                    Nenhum período de férias registrado.
                </td>
            </tr>
        `;

    const direito =
        periodoAtual
        ?
        periodoAtual.direito
        :
        0;

    const saldo =
        periodoAtual
        ?
        periodoAtual.saldo
        :
        0;

    const prazo =
        periodoAtual
        ?
        periodoAtual.concessivoFim
        :
        '';

    const html = `
        <div style="
            display:flex;
            flex-direction:column;
            gap:16px;
        ">

            <div class="content-card">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    flex-wrap:wrap;
                ">
                    <div>
                        <div style="
                            font-size:20px;
                            font-weight:800;
                        ">
                            ${escaparHTMLFuncionario(f.nome || '-')}
                        </div>

                        <div style="
                            color:#6b7280;
                            margin-top:4px;
                        ">
                            Admissão:
                            ${formatarDataCarreira(f.admissao)}
                        </div>
                    </div>

                    <button
                        class="btn-action"
                        style="background:#7c3aed;"
                        onclick="novaFeriasFuncionario(${index})">
                        ＋ Registrar férias
                    </button>
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3,minmax(0,1fr));
                gap:12px;
            ">

                <div class="content-card">
                    <div style="
                        color:#64748b;
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:.06em;
                    ">
                        Período aquisitivo
                    </div>

                    <div style="
                        font-weight:800;
                        margin-top:7px;
                        font-size:17px;
                    ">
                        ${
                            periodoAtual
                            ?
                            `${formatarDataCarreira(periodoAtual.inicio)} a ${formatarDataCarreira(periodoAtual.fim)}`
                            :
                            '-'
                        }
                    </div>

                    <div style="
                        color:#64748b;
                        margin-top:5px;
                        font-size:12px;
                    ">
                        ${
                            periodoAtual
                            ?
                            `${periodoAtual.faltas} falta(s) injustificada(s) no período`
                            :
                            ''
                        }
                    </div>
                </div>

                <div class="content-card" style="
                    background:#f5f3ff;
                    border:1px solid #c4b5fd;
                ">
                    <div style="
                        color:#64748b;
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:.06em;
                    ">
                        Direito / Saldo
                    </div>

                    <div style="
                        font-weight:800;
                        margin-top:7px;
                        font-size:21px;
                        color:#6d28d9;
                    ">
                        ${direito} dias / ${saldo} dias
                    </div>

                    <div style="
                        color:#64748b;
                        margin-top:5px;
                        font-size:12px;
                    ">
                        Conforme faltas injustificadas registradas no ponto.
                    </div>
                </div>

                <div class="content-card">
                    <div style="
                        color:#64748b;
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:.06em;
                    ">
                        Prazo para concessão
                    </div>

                    <div style="
                        font-weight:800;
                        margin-top:7px;
                        font-size:21px;
                        color:${
                            periodoAtual?.vencido
                            ?
                            '#dc2626'
                            :
                            '#111827'
                        };
                    ">
                        ${prazo ? formatarDataCarreira(prazo) : '-'}
                    </div>

                    <div style="
                        color:#64748b;
                        margin-top:5px;
                        font-size:12px;
                    ">
                        ${
                            periodoAtual?.vencido
                            ?
                            'Prazo vencido'
                            :
                            'Controle interno'
                        }
                    </div>
                </div>

            </div>

            <div class="content-card" style="
                padding:0;
                overflow:auto;
            ">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th>Período aquisitivo</th>
                            <th>Férias gozadas/agendadas</th>
                            <th>Dias</th>
                            <th style="text-align:right;">Estimativa bruta</th>
                            <th>Status</th>
                            <th style="text-align:right;">Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${linhas}
                    </tbody>
                </table>
            </div>

            <div style="
                padding:11px 13px;
                background:#fffbeb;
                border:1px solid #fde68a;
                border-radius:10px;
                font-size:11px;
                color:#92400e;
                line-height:1.5;
            ">
                Os valores de férias são uma estimativa bruta para controle interno.
                Não calcula INSS, IRRF ou regras específicas de convenção coletiva.
            </div>

        </div>
    `;

    configModal({
        title:
            '🏖 Controle de Férias',

        body:
            html,

        confirmText:
            'Fechar',

        onConfirm() {
            closeModal();
        }
    });

    setTimeout(() => {
        const content =
            document.querySelector(
                '#modal-global .content-card'
            );

        if (content) {
            content.style.width =
                '96vw';

            content.style.maxWidth =
                '1250px';
        }
    }, 0);
};

/* --------------------------------------------------------- */
/* novaFeriasFuncionario */
/* Inicia um novo registro/agendamento de férias. */
/* --------------------------------------------------------- */

window.novaFeriasFuncionario = function (index) {
    abrirFormularioFeriasFuncionario(
        index,
        null
    );
};

/* --------------------------------------------------------- */
/* editarFeriasFuncionario */
/* Abre um registro de férias existente para edição. */
/* --------------------------------------------------------- */

window.editarFeriasFuncionario = function (
    index,
    feriasId
) {
    abrirFormularioFeriasFuncionario(
        index,
        feriasId
    );
};

/* --------------------------------------------------------- */
/* abrirFormularioFeriasFuncionario */
/* Monta e processa o formulário de férias. */
/* --------------------------------------------------------- */

function abrirFormularioFeriasFuncionario(
    index,
    feriasId = null
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const registro =
        feriasId !== null
        ?
        f.ferias.find(
            item =>
                String(item.id) ===
                String(feriasId)
        )
        :
        null;

    const periodos =
        obterPeriodosAquisitivosFuncionario(f);

    const periodoPadrao =
        registro?.periodoAquisitivoInicio
        ||
        [...periodos]
        .reverse()
        .find(p => p.saldo > 0)
        ?.inicio
        ||
        periodos[0]
        ?.inicio
        ||
        '';

    const dados =
        registro
        ||
        {
            periodoAquisitivoInicio:
                periodoPadrao,

            inicio:
                '',

            fim:
                '',

            diasAbono:
                0,

            status:
                'Agendadas',

            observacoes:
                ''
        };

    const html = `
        <div style="
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:14px;
        ">

            <div style="grid-column:1 / -1;">
                <label>Período aquisitivo *</label>

                <select
                    id="fer-periodo"
                    onchange="atualizarPreviewFeriasFuncionario(${index})">
                    ${periodosFeriasHTMLFuncionario(
                        f,
                        dados.periodoAquisitivoInicio
                    )}
                </select>
            </div>

            <div>
                <label>Início das férias *</label>
                <input
                    id="fer-inicio"
                    type="date"
                    value="${escaparHTMLFuncionario(dados.inicio || '')}"
                    onchange="atualizarPreviewFeriasFuncionario(${index})">
            </div>

            <div>
                <label>Fim das férias *</label>
                <input
                    id="fer-fim"
                    type="date"
                    value="${escaparHTMLFuncionario(dados.fim || '')}"
                    onchange="atualizarPreviewFeriasFuncionario(${index})">
            </div>

            <div>
                <label>Abono pecuniário - dias vendidos</label>
                <input
                    id="fer-abono"
                    type="number"
                    min="0"
                    step="1"
                    value="${numeroFuncionario(dados.diasAbono)}"
                    oninput="atualizarPreviewFeriasFuncionario(${index})">
            </div>

            <div>
                <label>Status</label>
                <select id="fer-status">
                    <option
                        value="Agendadas"
                        ${statusFeriasTextoFuncionario(dados.status) === 'Agendadas' ? 'selected' : ''}>
                        Agendadas
                    </option>

                    <option
                        value="Concluídas"
                        ${statusFeriasTextoFuncionario(dados.status) === 'Concluídas' ? 'selected' : ''}>
                        Concluídas
                    </option>

                    <option
                        value="Canceladas"
                        ${statusFeriasTextoFuncionario(dados.status) === 'Canceladas' ? 'selected' : ''}>
                        Canceladas
                    </option>
                </select>
            </div>

            <div
                id="fer-preview"
                style="
                    grid-column:1 / -1;
                    padding:14px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    border-radius:10px;
                    line-height:1.7;
                ">
            </div>

            <div style="grid-column:1 / -1;">
                <label>Observações</label>
                <textarea
                    id="fer-observacoes"
                    rows="3">${escaparHTMLFuncionario(dados.observacoes || '')}</textarea>
            </div>

        </div>
    `;

    configModal({
        title:
            registro
            ?
            'Editar férias'
            :
            'Registrar férias',

        body:
            html,

        confirmText:
            'Salvar',

        onConfirm:
            async function () {

                const periodoInicio =
                    document
                    .getElementById(
                        'fer-periodo'
                    )
                    ?.value
                    ||
                    '';

                const periodo =
                    obterPeriodosAquisitivosFuncionario(f)
                    .find(
                        p =>
                            p.inicio ===
                            periodoInicio
                    );

                const inicio =
                    document
                    .getElementById(
                        'fer-inicio'
                    )
                    ?.value
                    ||
                    '';

                const fim =
                    document
                    .getElementById(
                        'fer-fim'
                    )
                    ?.value
                    ||
                    '';

                const diasGozo =
                    diasInclusivosFuncionario(
                        inicio,
                        fim
                    );

                const diasAbono =
                    Math.max(
                        0,
                        Math.floor(
                            numeroFuncionario(
                                document
                                .getElementById(
                                    'fer-abono'
                                )
                                ?.value
                            )
                        )
                    );

                const status =
                    document
                    .getElementById(
                        'fer-status'
                    )
                    ?.value
                    ||
                    'Agendadas';

                const observacoes =
                    document
                    .getElementById(
                        'fer-observacoes'
                    )
                    ?.value
                    .trim()
                    ||
                    '';

                if (!periodo) {
                    alert(
                        'Selecione um período aquisitivo válido.'
                    );

                    return;
                }

                if (
                    !inicio ||
                    !fim ||
                    diasGozo <= 0
                ) {
                    alert(
                        'Informe um período de férias válido.'
                    );

                    return;
                }

                const outros =
                    f.ferias.filter(
                        item =>
                            String(item.id) !==
                            String(feriasId)
                        &&
                            item.periodoAquisitivoInicio ===
                            periodo.inicio
                        &&
                            statusFeriasTextoFuncionario(
                                item.status
                            ) !==
                            'Canceladas'
                    );

                const diasJaUsados =
                    outros.reduce(
                        (total, item) =>
                            total +
                            numeroFuncionario(
                                item.diasGozo
                            ) +
                            numeroFuncionario(
                                item.diasAbono
                            ),
                        0
                    );

                if (
                    statusFeriasTextoFuncionario(status) !==
                    'Canceladas'
                    &&
                    diasJaUsados +
                    diasGozo +
                    diasAbono >
                    periodo.direito
                ) {
                    alert(
                        `O período possui direito a ${periodo.direito} dias. ` +
                        `Já existem ${diasJaUsados} dias comprometidos e este lançamento usaria ${diasGozo + diasAbono}.`
                    );

                    return;
                }

                const maxAbono =
                    Math.floor(
                        periodo.direito / 3
                    );

                if (
                    diasAbono >
                    maxAbono
                ) {
                    alert(
                        `O abono informado ultrapassa 1/3 do direito de férias (${maxAbono} dias).`
                    );

                    return;
                }

                const periodosGozo =
                    [
                        ...outros
                        .map(
                            item =>
                                numeroFuncionario(
                                    item.diasGozo
                                )
                        ),
                        diasGozo
                    ]
                    .filter(
                        dias =>
                            dias > 0
                    );

                if (
                    statusFeriasTextoFuncionario(status) !==
                    'Canceladas'
                    &&
                    periodosGozo.length > 3
                ) {
                    alert(
                        'As férias não podem ficar divididas em mais de 3 períodos.'
                    );

                    return;
                }

                if (
                    statusFeriasTextoFuncionario(status) !==
                    'Canceladas'
                    &&
                    periodosGozo.length >= 2
                ) {
                    const maior =
                        Math.max(
                            ...periodosGozo
                        );

                    const menorQueCinco =
                        periodosGozo.some(
                            dias =>
                                dias < 5
                        );

                    if (
                        maior < 14 ||
                        menorQueCinco
                    ) {
                        alert(
                            'No fracionamento, um período deve ter pelo menos 14 dias e os demais pelo menos 5 dias.'
                        );

                        return;
                    }
                }

                const calculo =
                    calcularValorFeriasFuncionario(
                        f.salario,
                        diasGozo,
                        diasAbono
                    );

                const novo = {
                    periodoAquisitivoInicio:
                        periodo.inicio,

                    periodoAquisitivoFim:
                        periodo.fim,

                    concessivoFim:
                        periodo.concessivoFim,

                    faltasInjustificadasPeriodo:
                        periodo.faltas,

                    direitoPeriodo:
                        periodo.direito,

                    inicio,

                    fim,

                    diasGozo,

                    diasAbono,

                    salarioBase:
                        numeroFuncionario(
                            f.salario
                        ),

                    remuneracaoGozo:
                        calculo.remuneracaoGozo,

                    tercoGozo:
                        calculo.tercoGozo,

                    valorAbono:
                        calculo.abono,

                    tercoAbono:
                        calculo.tercoAbono,

                    totalBruto:
                        calculo.totalBruto,

                    status,

                    observacoes,

                    atualizadoEm:
                        new Date()
                        .toISOString()
                };

                if (registro) {
                    Object.assign(
                        registro,
                        novo
                    );
                }
                else {
                    f.ferias.push({
                        id:
                            Date.now(),

                        criadoEm:
                            new Date()
                            .toISOString(),

                        ...novo
                    });
                }

                await save();

                abrirFeriasFuncionario(
                    index
                );
            }
    });

    setTimeout(
        () => {
            const content =
                document.querySelector(
                    '#modal-global .content-card'
                );

            if (content) {
                content.style.width =
                    '94vw';

                content.style.maxWidth =
                    '850px';
            }

            atualizarPreviewFeriasFuncionario(
                index
            );
        },
        0
    );
}

/* --------------------------------------------------------- */
/* atualizarPreviewFeriasFuncionario */
/* Atualiza os valores e informações prévias do formulário de férias. */
/* --------------------------------------------------------- */

window.atualizarPreviewFeriasFuncionario = function (
    index
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    const box =
        document
        .getElementById(
            'fer-preview'
        );

    if (!box) return;

    const periodoInicio =
        document
        .getElementById(
            'fer-periodo'
        )
        ?.value
        ||
        '';

    const periodo =
        obterPeriodosAquisitivosFuncionario(f)
        .find(
            p =>
                p.inicio ===
                periodoInicio
        );

    const inicio =
        document
        .getElementById(
            'fer-inicio'
        )
        ?.value
        ||
        '';

    const fim =
        document
        .getElementById(
            'fer-fim'
        )
        ?.value
        ||
        '';

    const diasGozo =
        diasInclusivosFuncionario(
            inicio,
            fim
        );

    const diasAbono =
        Math.max(
            0,
            numeroFuncionario(
                document
                .getElementById(
                    'fer-abono'
                )
                ?.value
            )
        );

    const calc =
        calcularValorFeriasFuncionario(
            f.salario,
            diasGozo,
            diasAbono
        );

    box.innerHTML = `
        <div style="
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:12px;
        ">
            <div>
                <div style="color:#64748b;font-size:11px;">DIAS DE GOZO</div>
                <strong>${diasGozo || 0}</strong>
            </div>

            <div>
                <div style="color:#64748b;font-size:11px;">SALDO DO PERÍODO</div>
                <strong>${periodo ? periodo.saldo : 0}</strong>
            </div>

            <div>
                <div style="color:#64748b;font-size:11px;">FALTAS INJUSTIFICADAS</div>
                <strong>${periodo ? periodo.faltas : 0}</strong>
            </div>
        </div>

        <hr style="
            border:none;
            border-top:1px solid #e5e7eb;
            margin:12px 0;
        ">

        <div>
            Remuneração proporcional:
            <strong>${formatarMoeda(calc.remuneracaoGozo)}</strong>
        </div>

        <div>
            1/3 constitucional:
            <strong>${formatarMoeda(calc.tercoGozo)}</strong>
        </div>

        ${
            diasAbono > 0
            ?
            `
                <div>
                    Abono:
                    <strong>${formatarMoeda(calc.abono)}</strong>
                </div>

                <div>
                    1/3 sobre abono:
                    <strong>${formatarMoeda(calc.tercoAbono)}</strong>
                </div>
            `
            :
            ''
        }

        <div style="
            margin-top:8px;
            font-size:18px;
            font-weight:800;
            color:#6d28d9;
        ">
            Estimativa bruta:
            ${formatarMoeda(calc.totalBruto)}
        </div>
    `;
};

/* --------------------------------------------------------- */
/* excluirFeriasFuncionario */
/* Exclui um registro de férias após confirmação. */
/* --------------------------------------------------------- */

window.excluirFeriasFuncionario = async function (
    index,
    feriasId
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const registro =
        f.ferias.find(
            item =>
                String(item.id) ===
                String(feriasId)
        );

    if (!registro) return;

    if (
        !confirm(
            'Deseja excluir este registro de férias?'
        )
    ) {
        return;
    }

    f.ferias =
        f.ferias.filter(
            item =>
                String(item.id) !==
                String(feriasId)
        );

    await save();

    abrirFeriasFuncionario(
        index
    );
};


/* ========================================================= */
/* 08. RESCISÃO / ACERTO AVULSO                             */
/* ========================================================= */
/*
    Controla os cálculos e registros internos usados
    na tela de acerto/rescisão do funcionário.
*/

/* --------------------------------------------------------- */
/* dataTrabalhadaNoPontoFuncionario */
/* Verifica se uma data possui trabalho registrado no ponto. */
/* --------------------------------------------------------- */

function dataTrabalhadaNoPontoFuncionario(
    func,
    data
) {
    const reg =
        (func.ponto || [])
        .find(
            item =>
                item.data ===
                data
        );

    if (!reg) {
        return false;
    }

    if (reg.falta) {
        return false;
    }

    const ferias =
        (func.ferias || [])
        .some(item => (
            statusFeriasTextoFuncionario(item.status) !==
            'Canceladas'
            &&
            data >= item.inicio
            &&
            data <= item.fim
        ));

    if (ferias) {
        return false;
    }

    return !!(
        reg.entrada ||
        reg.almocoSaida ||
        reg.almocoVolta ||
        reg.saida
    );
}

/* --------------------------------------------------------- */
/* datasTrabalhadasPeriodoFuncionario */
/* Conta/lista datas trabalhadas dentro de um período. */
/* --------------------------------------------------------- */

function datasTrabalhadasPeriodoFuncionario(
    func,
    inicio,
    fim
) {
    if (
        !inicio ||
        !fim
    ) {
        return [];
    }

    const inicioObj =
        dataObjFuncionario(
            inicio
        );

    const fimObj =
        dataObjFuncionario(
            fim
        );

    if (
        !inicioObj ||
        !fimObj ||
        fimObj < inicioObj
    ) {
        return [];
    }

    const datas = [];

    const cursor =
        new Date(
            inicioObj.getTime()
        );

    while (
        cursor <=
        fimObj
    ) {
        const data =
            dataISOFuncionario(
                cursor
            );

        if (
            dataTrabalhadaNoPontoFuncionario(
                func,
                data
            )
        ) {
            datas.push(
                data
            );
        }

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    return datas;
}

/* --------------------------------------------------------- */
/* calcularAcertoAvulsoFuncionario */
/* Executa o cálculo interno do acerto avulso. */
/* --------------------------------------------------------- */

function calcularAcertoAvulsoFuncionario(
    func,
    inicio,
    fim,
    salarioReferencia,
    diasSelecionados,
    diasManuais,
    ajuste
) {
    salarioReferencia =
        Math.max(
            0,
            numeroFuncionario(
                salarioReferencia
            )
        );

    diasManuais =
        Math.max(
            0,
            Math.floor(
                numeroFuncionario(
                    diasManuais
                )
            )
        );

    ajuste =
        numeroFuncionario(
            ajuste
        );

    const diaria =
        salarioReferencia / 30;

    const diasPonto =
        Array.isArray(
            diasSelecionados
        )
        ?
        diasSelecionados.length
        :
        0;

    const totalDias =
        diasPonto +
        diasManuais;

    const valorDiarias =
        diaria *
        totalDias;

    let extras = {
        valorExtra50:
            0,

        valorExtra100:
            0,

        valorExtras:
            0,

        diasComExtra:
            []
    };

    if (
        typeof window
            .calcularExtrasPeriodoPonto
        ===
        'function'
        &&
        inicio &&
        fim
    ) {
        extras =
            window
            .calcularExtrasPeriodoPonto(
                func,
                inicio,
                fim,
                salarioReferencia,
                diasSelecionados
            );
    }

    return {
        diaria,

        diasPonto,

        diasManuais,

        totalDias,

        valorDiarias,

        valorExtra50:
            numeroFuncionario(
                extras.valorExtra50
            ),

        valorExtra100:
            numeroFuncionario(
                extras.valorExtra100
            ),

        valorExtras:
            numeroFuncionario(
                extras.valorExtras
            ),

        ajuste,

        total:
            valorDiarias +
            numeroFuncionario(
                extras.valorExtras
            )
            +
            ajuste,

        datasPonto:
            diasSelecionados
            ||
            []
    };
}

/* --------------------------------------------------------- */
/* abrirRescisaoFuncionario */
/* Abre o painel de rescisão/acertos do funcionário. */
/* --------------------------------------------------------- */

window.abrirRescisaoFuncionario = function (index) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    /*
        Depois que uma rescisão/acerto foi concluída,
        esta tela deixa de exibir tabela, histórico e botão
        para novo acerto.

        Ela passa a mostrar somente:
        - Rescisão realizada
        - valor
        - botão do recibo de pagamento
    */

    const ultimoAcerto =
        [...f.acertosRescisao]
            .filter(
                acerto =>
                    acerto.rescisaoRealizada === true
                    &&
                    acerto.rescisaoCancelada !== true
            )
            .sort(
                (a, b) =>
                    String(b.criadoEm || b.dataCalculo || '')
                        .localeCompare(
                            String(a.criadoEm || a.dataCalculo || '')
                        )
            )[0]
        || null;

    if (ultimoAcerto) {

        const html = `
            <div style="
                display:flex;
                flex-direction:column;
                gap:18px;
            ">

                <div style="
                    padding:28px;
                    border-radius:16px;
                    background:#f0fdf4;
                    border:1px solid #bbf7d0;
                    text-align:center;
                ">

                    <div style="
                        font-size:34px;
                        margin-bottom:10px;
                    ">
                        ✅
                    </div>

                    <div style="
                        font-size:24px;
                        font-weight:900;
                        color:#166534;
                    ">
                        Rescisão realizada
                    </div>

                    <div style="
                        margin-top:8px;
                        color:#4b5563;
                        font-size:13px;
                    ">
                        ${escaparHTMLFuncionario(f.nome || '-')}
                    </div>

                    <div style="
                        margin-top:15px;
                        font-size:13px;
                        color:#64748b;
                    ">
                        Valor do acerto
                    </div>

                    <div style="
                        margin-top:4px;
                        font-size:28px;
                        font-weight:900;
                        color:#111827;
                    ">
                        ${formatarMoeda(
                            numeroFuncionario(
                                ultimoAcerto.total
                            )
                        )}
                    </div>

                    <div style="
                        margin-top:22px;
                        display:flex;
                        justify-content:center;
                        gap:10px;
                        flex-wrap:wrap;
                    ">

                        <button
                            type="button"
                            class="btn-action"
                            style="
                                background:#7c3aed;
                                padding:11px 18px;
                                font-size:13px;
                            "
                            onclick="gerarReciboRescisaoFuncionario(${index}, '${String(ultimoAcerto.id)}')">

                            🧾 Recibo de pagamento

                        </button>

                        <button
                            type="button"
                            class="btn-del"
                            style="
                                padding:11px 18px;
                                font-size:13px;
                            "
                            onclick="cancelarRescisaoFuncionario(${index}, '${String(ultimoAcerto.id)}')">

                            ↩ Cancelar rescisão

                        </button>

                    </div>

                </div>

            </div>
        `;

        configModal({
            title:
                '🧾 Rescisão',

            body:
                html,

            confirmText:
                'Fechar',

            onConfirm() {
                closeModal();
            }
        });

        return;
    }

    /*
        Antes de existir uma rescisão, mostramos apenas
        a opção para iniciar o processo.
    */

    const html = `
        <div style="
            display:flex;
            flex-direction:column;
            gap:16px;
        ">

            <div class="content-card">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    flex-wrap:wrap;
                ">

                    <div>

                        <div style="
                            font-size:20px;
                            font-weight:800;
                        ">
                            ${escaparHTMLFuncionario(f.nome || '-')}
                        </div>

                        <div style="
                            color:#6b7280;
                            margin-top:4px;
                        ">
                            Salário atual:
                            ${formatarMoeda(
                                numeroFuncionario(
                                    f.salario
                                )
                            )}
                        </div>

                    </div>

                    <button
                        class="btn-action"
                        style="background:#be123c;"
                        onclick="novoAcertoRescisaoFuncionario(${index})">

                        🧾 Realizar Rescisão

                    </button>

                </div>

            </div>

            <div style="
                padding:12px 14px;
                border-radius:10px;
                background:#fff7ed;
                border:1px solid #fed7aa;
                color:#9a3412;
                font-size:11px;
                line-height:1.55;
            ">
                Este módulo faz o acerto simplificado solicitado:
                diária = salário de referência ÷ 30, somada às horas extras apuradas no ponto.
                Ele não calcula verbas de uma rescisão CLT formal, FGTS, 13º, férias proporcionais,
                aviso-prévio, INSS ou benefícios.
            </div>

        </div>
    `;

    configModal({
        title:
            '🧾 Rescisão / Acerto',

        body:
            html,

        confirmText:
            'Fechar',

        onConfirm() {
            closeModal();
        }
    });
};

/* --------------------------------------------------------- */
/* novoAcertoRescisaoFuncionario */
/* Abre o formulário para registrar um novo acerto. */
/* --------------------------------------------------------- */

window.novoAcertoRescisaoFuncionario = function (
    index
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const inicioPadrao =
        f.admissao
        ||
        dataHojeFuncionario();

    const fimPadrao =
        dataHojeFuncionario();

    const html = `
        <div style="
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:14px;
        ">

            <div>
                <label>Início do período *</label>
                <input
                    id="acerto-inicio"
                    type="date"
                    value="${escaparHTMLFuncionario(inicioPadrao)}"
                    onchange="atualizarDiasAcertoFuncionario(${index})">
            </div>

            <div>
                <label>Fim do período *</label>
                <input
                    id="acerto-fim"
                    type="date"
                    value="${escaparHTMLFuncionario(fimPadrao)}"
                    onchange="atualizarDiasAcertoFuncionario(${index})">
            </div>

            <div>
                <label>Salário de referência (R$) *</label>
                <input
                    id="acerto-salario"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${numeroFuncionario(f.salario)}"
                    oninput="atualizarPreviewAcertoFuncionario(${index})">
            </div>

            <div>
                <label>Dias adicionais manuais</label>
                <input
                    id="acerto-dias-manuais"
                    type="number"
                    min="0"
                    step="1"
                    value="0"
                    oninput="atualizarPreviewAcertoFuncionario(${index})">
            </div>

            <div>
                <label>Ajuste manual (R$)</label>
                <input
                    id="acerto-ajuste"
                    type="number"
                    step="0.01"
                    value="0"
                    oninput="atualizarPreviewAcertoFuncionario(${index})">

                <div style="
                    color:#6b7280;
                    font-size:10px;
                    margin-top:4px;
                ">
                    Use valor negativo para desconto.
                </div>
            </div>

            <div>
                <label>Status do pagamento</label>
                <select id="acerto-status">
                    <option>Pendente</option>
                    <option>Pago</option>
                </select>
            </div>

            <div style="
                grid-column:1 / -1;
                padding:12px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:10px;
            ">
                <div style="
                    font-weight:800;
                    margin-bottom:8px;
                ">
                    Dias encontrados no ponto
                </div>

                <div
                    id="acerto-dias-ponto"
                    style="
                        display:grid;
                        grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
                        gap:6px 10px;
                    ">
                </div>
            </div>

            <div
                id="acerto-preview"
                style="
                    grid-column:1 / -1;
                    padding:14px;
                    background:#fff7ed;
                    border:1px solid #fed7aa;
                    border-radius:10px;
                ">
            </div>

            <div style="grid-column:1 / -1;">
                <label>Observações</label>
                <textarea
                    id="acerto-observacoes"
                    rows="3"></textarea>
            </div>

        </div>
    `;

    configModal({
        title:
            'Novo acerto avulso / pré-registro',

        body:
            html,

        confirmText:
            'Finalizar Acerto',

        onConfirm:
            async function () {

                const inicio =
                    document
                    .getElementById(
                        'acerto-inicio'
                    )
                    ?.value
                    ||
                    '';

                const fim =
                    document
                    .getElementById(
                        'acerto-fim'
                    )
                    ?.value
                    ||
                    '';

                if (
                    !inicio ||
                    !fim ||
                    fim < inicio
                ) {
                    alert(
                        'Informe um período válido.'
                    );

                    return;
                }

                const salario =
                    Math.max(
                        0,
                        numeroFuncionario(
                            document
                            .getElementById(
                                'acerto-salario'
                            )
                            ?.value
                        )
                    );

                if (
                    salario <= 0
                ) {
                    alert(
                        'Informe o salário de referência.'
                    );

                    return;
                }

                const diasSelecionados =
                    [
                        ...document
                        .querySelectorAll(
                            '.acerto-dia-check:checked'
                        )
                    ]
                    .map(
                        el =>
                            el.dataset.data
                    );

                const diasManuais =
                    Math.max(
                        0,
                        Math.floor(
                            numeroFuncionario(
                                document
                                .getElementById(
                                    'acerto-dias-manuais'
                                )
                                ?.value
                            )
                        )
                    );

                const ajuste =
                    numeroFuncionario(
                        document
                        .getElementById(
                            'acerto-ajuste'
                        )
                        ?.value
                    );

                const calculo =
                    calcularAcertoAvulsoFuncionario(
                        f,
                        inicio,
                        fim,
                        salario,
                        diasSelecionados,
                        diasManuais,
                        ajuste
                    );

                if (
                    calculo.totalDias <= 0
                ) {
                    if (
                        !confirm(
                            'Nenhum dia trabalhado foi selecionado. Deseja salvar o acerto mesmo assim?'
                        )
                    ) {
                        return;
                    }
                }

                const registro = {
                    id:
                        Date.now(),

                    tipo:
                        'acerto_avulso_pre_registro',

                    titulo:
                        'Acerto avulso / pré-registro',

                    dataCalculo:
                        dataHojeFuncionario(),

                    inicio,

                    fim,

                    salarioReferencia:
                        salario,

                    diaria:
                        calculo.diaria,

                    datasPonto:
                        calculo.datasPonto,

                    diasPonto:
                        calculo.diasPonto,

                    diasManuais:
                        calculo.diasManuais,

                    totalDias:
                        calculo.totalDias,

                    valorDiarias:
                        calculo.valorDiarias,

                    valorExtra50:
                        calculo.valorExtra50,

                    valorExtra100:
                        calculo.valorExtra100,

                    valorExtras:
                        calculo.valorExtras,

                    ajuste:
                        calculo.ajuste,

                    total:
                        calculo.total,

                    statusPagamento:
                        document
                        .getElementById(
                            'acerto-status'
                        )
                        ?.value
                        ||
                        'Pendente',

                    observacoes:
                        document
                        .getElementById(
                            'acerto-observacoes'
                        )
                        ?.value
                        .trim()
                        ||
                        '',

                    criadoEm:
                        new Date()
                        .toISOString()
                };

                registro.rescisaoRealizada =
                    true;

                registro.reciboDisponivel =
                    true;

                f.acertosRescisao.push(
                    registro
                );

                /*
                    Concluir a rescisão sempre desliga o funcionário.
                    A própria tela de Rescisão oferece a opção
                    "Cancelar rescisão" para reativá-lo se necessário.
                */

                f.status =
                    'Desligado';

                await save();

                /*
                    Atualiza imediatamente a lista de funcionários
                    usando os dados que acabaram de ser salvos.
                    Assim o status "Desligado" aparece na mesma hora,
                    sem precisar trocar de tela e voltar.
                */

                await navigate(
                    'funcionarios',
                    false
                );

                abrirRescisaoFuncionario(
                    index
                );
            }
    });

    setTimeout(
        () => {
            const content =
                document.querySelector(
                    '#modal-global .content-card'
                );

            if (content) {
                content.style.width =
                    '94vw';

                content.style.maxWidth =
                    '900px';
            }

            atualizarDiasAcertoFuncionario(
                index
            );
        },
        0
    );
};

/* --------------------------------------------------------- */
/* atualizarDiasAcertoFuncionario */
/* Atualiza a quantidade de dias considerada no acerto. */
/* --------------------------------------------------------- */

window.atualizarDiasAcertoFuncionario = function (
    index
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    const inicio =
        document
        .getElementById(
            'acerto-inicio'
        )
        ?.value
        ||
        '';

    const fim =
        document
        .getElementById(
            'acerto-fim'
        )
        ?.value
        ||
        '';

    const box =
        document
        .getElementById(
            'acerto-dias-ponto'
        );

    if (!box) return;

    const datas =
        datasTrabalhadasPeriodoFuncionario(
            f,
            inicio,
            fim
        );

    box.innerHTML =
        datas.length
        ?
        datas
        .map(data => `
            <label style="
                display:flex;
                align-items:center;
                gap:6px;
                padding:5px 7px;
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:7px;
                font-size:11px;
            ">
                <input
                    class="acerto-dia-check"
                    data-data="${data}"
                    type="checkbox"
                    checked
                    style="width:auto;"
                    onchange="atualizarPreviewAcertoFuncionario(${index})">
                ${formatarDataCarreira(data)}
            </label>
        `)
        .join('')
        :
        `
            <div style="
                color:#6b7280;
                font-size:11px;
            ">
                Nenhum dia com marcação de ponto foi encontrado neste período.
                Se necessário, use "Dias adicionais manuais".
            </div>
        `;

    atualizarPreviewAcertoFuncionario(
        index
    );
};

/* --------------------------------------------------------- */
/* atualizarPreviewAcertoFuncionario */
/* Atualiza a prévia dos valores do acerto. */
/* --------------------------------------------------------- */

window.atualizarPreviewAcertoFuncionario = function (
    index
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    const box =
        document
        .getElementById(
            'acerto-preview'
        );

    if (!box) return;

    const inicio =
        document
        .getElementById(
            'acerto-inicio'
        )
        ?.value
        ||
        '';

    const fim =
        document
        .getElementById(
            'acerto-fim'
        )
        ?.value
        ||
        '';

    const salario =
        Math.max(
            0,
            numeroFuncionario(
                document
                .getElementById(
                    'acerto-salario'
                )
                ?.value
            )
        );

    const diasSelecionados =
        [
            ...document
            .querySelectorAll(
                '.acerto-dia-check:checked'
            )
        ]
        .map(
            el =>
                el.dataset.data
        );

    const diasManuais =
        Math.max(
            0,
            Math.floor(
                numeroFuncionario(
                    document
                    .getElementById(
                        'acerto-dias-manuais'
                    )
                    ?.value
                )
            )
        );

    const ajuste =
        numeroFuncionario(
            document
            .getElementById(
                'acerto-ajuste'
            )
            ?.value
        );

    const c =
        calcularAcertoAvulsoFuncionario(
            f,
            inicio,
            fim,
            salario,
            diasSelecionados,
            diasManuais,
            ajuste
        );

    box.innerHTML = `
        <div style="
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:10px 18px;
        ">
            <div>
                Diária:
                <strong>${formatarMoeda(c.diaria)}</strong>
            </div>

            <div>
                Dias trabalhados:
                <strong>${c.totalDias}</strong>
            </div>

            <div>
                Valor das diárias:
                <strong>${formatarMoeda(c.valorDiarias)}</strong>
            </div>

            <div>
                Horas extras:
                <strong>${formatarMoeda(c.valorExtras)}</strong>
            </div>

            <div>
                Ajuste:
                <strong>${formatarMoeda(c.ajuste)}</strong>
            </div>
        </div>

        <div style="
            margin-top:13px;
            padding-top:12px;
            border-top:1px solid #fed7aa;
            font-size:22px;
            font-weight:900;
            color:#9f1239;
        ">
            TOTAL A RECEBER:
            ${formatarMoeda(c.total)}
        </div>
    `;
};



/* --------------------------------------------------------- */
/* obterDatasTrabalhadasReciboFuncionario                    */
/* Obtém as datas EXATAS trabalhadas registradas no ponto.   */
/* --------------------------------------------------------- */

function obterDatasTrabalhadasReciboFuncionario(
    func,
    item
) {

    /*
        A rescisão já salva em "datasPonto" exatamente os dias
        selecionados a partir do ponto do funcionário.

        Para registros antigos, onde datasPonto ainda não exista,
        o sistema reconstrói a lista usando o ponto entre início
        e fim do acerto.
    */

    let datas =
        Array.isArray(
            item?.datasPonto
        )
        ?
        item.datasPonto
        :
        [];

    if (
        !datas.length
        &&
        item?.inicio
        &&
        item?.fim
    ) {

        datas =
            datasTrabalhadasPeriodoFuncionario(
                func,
                item.inicio,
                item.fim
            );
    }

    return [
        ...new Set(
            datas
                .filter(Boolean)
                .map(
                    data =>
                        String(data)
                            .trim()
                )
        )
    ]
    .sort();
}


/* --------------------------------------------------------- */
/* dataSeguinteReciboFuncionario                             */
/* Verifica se duas datas são dias consecutivos.             */
/* --------------------------------------------------------- */

function dataSeguinteReciboFuncionario(
    anterior,
    atual
) {

    const a =
        dataObjFuncionario(
            anterior
        );

    const b =
        dataObjFuncionario(
            atual
        );

    if (
        !a
        ||
        !b
    ) {
        return false;
    }

    const proximo =
        new Date(
            a.getTime()
        );

    proximo.setDate(
        proximo.getDate() + 1
    );

    return (
        dataISOFuncionario(
            proximo
        )
        ===
        atual
    );
}


/* --------------------------------------------------------- */
/* formatarDiasTrabalhadosReciboFuncionario                  */
/* Agrupa apenas dias consecutivos.                          */
/*                                                             */
/* Exemplos:                                                  */
/* 06 e 07 -> 06/08/2026 a 07/08/2026                       */
/* 06 a 10 -> 06/08/2026 a 10/08/2026                       */
/* 06, 07 e 10 -> 06/08/2026 a 07/08/2026 e 10/08/2026     */
/* --------------------------------------------------------- */

function formatarDiasTrabalhadosReciboFuncionario(
    datas
) {

    if (
        !Array.isArray(datas)
        ||
        !datas.length
    ) {

        return '';
    }

    const ordenadas =
        [
            ...new Set(
                datas
            )
        ]
        .sort();

    const grupos =
        [];

    let inicio =
        ordenadas[0];

    let fim =
        ordenadas[0];

    for (
        let i = 1;
        i < ordenadas.length;
        i++
    ) {

        const atual =
            ordenadas[i];

        if (
            dataSeguinteReciboFuncionario(
                fim,
                atual
            )
        ) {

            fim =
                atual;

            continue;
        }

        grupos.push({
            inicio,
            fim
        });

        inicio =
            atual;

        fim =
            atual;
    }

    grupos.push({
        inicio,
        fim
    });

    const partes =
        grupos.map(
            grupo => {

                const inicioBR =
                    formatarDataCarreira(
                        grupo.inicio
                    );

                const fimBR =
                    formatarDataCarreira(
                        grupo.fim
                    );

                if (
                    grupo.inicio ===
                    grupo.fim
                ) {

                    return inicioBR;
                }

                return (
                    `${inicioBR} a ${fimBR}`
                );
            }
        );

    if (
        partes.length === 1
    ) {

        return partes[0];
    }

    if (
        partes.length === 2
    ) {

        return (
            `${partes[0]} e ${partes[1]}`
        );
    }

    return (
        partes
            .slice(
                0,
                -1
            )
            .join(', ')
        +
        ' e '
        +
        partes[
            partes.length - 1
        ]
    );
}


/* --------------------------------------------------------- */
/* formatarCompetenciaRescisaoFuncionario                    */
/* Ex.: 2026-08-26 -> 08/2026                                */
/* --------------------------------------------------------- */

function formatarCompetenciaRescisaoFuncionario(
    data
) {

    const valor =
        String(
            data || ''
        ).trim();

    const match =
        valor.match(
            /^(\d{4})-(\d{2})/
        );

    if (match) {

        return `${match[2]}/${match[1]}`;
    }

    return '-';
}


/* --------------------------------------------------------- */
/* cancelarRescisaoFuncionario                               */
/* Cancela a rescisão registrada e reativa o funcionário.   */
/* --------------------------------------------------------- */

window.cancelarRescisaoFuncionario =
async function (
    index,
    acertoId
) {

    const f =
        db.funcionarios[index];

    if (!f) {
        return;
    }

    garantirEstruturaFuncionarioRH(
        f
    );

    const item =
        f.acertosRescisao.find(
            acerto =>
                String(acerto.id)
                ===
                String(acertoId)
        );

    if (!item) {

        alert(
            'Rescisão não encontrada.'
        );

        return;
    }

    const confirmar =
        confirm(
            `Deseja cancelar a rescisão de ${f.nome || 'este funcionário'}?\n\n` +
            'O funcionário será reativado no sistema.'
        );

    if (!confirmar) {
        return;
    }

    /*
        Não apagamos o registro do banco.
        Ele é marcado como cancelado para preservar o histórico,
        mas deixa de ser considerado uma rescisão ativa.
    */

    item.rescisaoRealizada =
        false;

    item.rescisaoCancelada =
        true;

    item.reciboDisponivel =
        false;

    item.canceladoEm =
        new Date()
            .toISOString();

    f.status =
        'Ativo';

    await save();

    /*
        Atualiza a tela imediatamente.
    */

    await navigate(
        'funcionarios',
        false
    );

    abrirRescisaoFuncionario(
        index
    );
};


/* --------------------------------------------------------- */
/* gerarReciboRescisaoFuncionario                            */
/* Gera o recibo de pagamento da rescisão dentro do módulo.  */
/* --------------------------------------------------------- */

window.gerarReciboRescisaoFuncionario = async function (
    index,
    acertoId
) {

    const f =
        db.funcionarios[index];

    if (!f) {
        return;
    }

    garantirEstruturaFuncionarioRH(
        f
    );

    const item =
        f.acertosRescisao.find(
            acerto =>
                String(acerto.id)
                ===
                String(acertoId)
        );

    if (!item) {

        alert(
            'Rescisão não encontrada.'
        );

        return;
    }

    /*
        Puxa EXATAMENTE os dias preenchidos no ponto que foram
        considerados como trabalhados na rescisão.
    */

    const datasTrabalhadas =
        obterDatasTrabalhadasReciboFuncionario(
            f,
            item
        );

    if (!datasTrabalhadas.length) {

        alert(
            'Não existem dias trabalhados registrados no ponto para gerar este recibo.'
        );

        return;
    }

    const quantidadeDiarias =
        datasTrabalhadas.length;

    const diasTrabalhadosTexto =
        formatarDiasTrabalhadosReciboFuncionario(
            datasTrabalhadas
        );

    const competencia =
        formatarCompetenciaRescisaoFuncionario(
            datasTrabalhadas[
                datasTrabalhadas.length - 1
            ]
            ||
            item.fim
            ||
            item.dataCalculo
        );

    const textoDiarias =
        quantidadeDiarias === 1
            ? '1 diária de trabalho'
            : `${quantidadeDiarias} diárias de trabalho`;

    /*
        Se existirem diárias lançadas manualmente no acerto,
        elas continuam aparecendo no detalhamento, mas NÃO são
        inventadas como datas no recibo. As datas são somente
        as datas realmente encontradas no ponto.
    */

    const diasManuais =
        Math.max(
            0,
            Math.floor(
                numeroFuncionario(
                    item.diasManuais
                )
            )
        );

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
            'Não foi possível carregar a logo no recibo:',
            erro
        );
    }

    const valorTotal =
        formatarMoeda(
            numeroFuncionario(
                item.total
            )
        );

    const valorDiarias =
        formatarMoeda(
            numeroFuncionario(
                item.valorDiarias
            )
        );

    const valorExtras =
        formatarMoeda(
            numeroFuncionario(
                item.valorExtras
            )
        );

    const valorAjuste =
        formatarMoeda(
            numeroFuncionario(
                item.ajuste
            )
        );

    const observacoes =
        escaparHTMLFuncionario(
            item.observacoes
            ||
            ''
        );

    const declaracao =
        `Eu, ${escaparHTMLFuncionario(f.nome || 'funcionário(a)')}, declaro ter recebido da ` +
        `WN Comunicação Visual o valor de ${valorTotal}, referente ao pagamento de ` +
        `${textoDiarias}, dos dias ${diasTrabalhadosTexto}.`;

    /*
        O recibo NÃO é salvo em nenhum módulo.
        Ele é criado somente para impressão.
    */

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        Recibo de Pagamento - ${escaparHTMLFuncionario(f.nome || 'Funcionário')}
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
            padding:24px;
        }

        .print-page{
            width:210mm;
            min-height:297mm;
            margin:0 auto;
            background:#fff;
            padding:18mm 18mm 16mm;
            box-shadow:
                0 12px 35px
                rgba(15,23,42,.14);
        }

        .header{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:24px;
            padding-bottom:18px;
            border-bottom:3px solid #7c3aed;
        }

        .logo-wrap{
            min-width:180px;
        }

        .logo{
            max-width:190px;
            max-height:65px;
            object-fit:contain;
            display:block;
        }

        .empresa-fallback{
            font-size:18px;
            font-weight:900;
            letter-spacing:.4px;
        }

        .document-title{
            text-align:right;
        }

        .document-title h1{
            margin:0;
            font-size:25px;
            letter-spacing:.3px;
        }

        .document-title p{
            margin:6px 0 0;
            color:#64748b;
            font-size:12px;
        }

        .meta{
            display:grid;
            grid-template-columns:
                minmax(0,1fr)
                180px;
            gap:14px;
            margin-top:24px;
        }

        .meta-card{
            padding:14px 16px;
            border:1px solid #e2e8f0;
            border-radius:12px;
            background:#f8fafc;
        }

        .label{
            display:block;
            color:#64748b;
            font-size:10px;
            font-weight:800;
            letter-spacing:.7px;
            text-transform:uppercase;
            margin-bottom:6px;
        }

        .meta-value{
            font-size:14px;
            font-weight:800;
            color:#172033;
        }

        .value-box{
            margin-top:18px;
            padding:20px;
            text-align:center;
            border-radius:15px;
            background:
                linear-gradient(
                    135deg,
                    #f5f3ff,
                    #faf5ff
                );
            border:1px solid #ddd6fe;
        }

        .value-box .label{
            color:#6d28d9;
        }

        .value-total{
            margin-top:7px;
            color:#5b21b6;
            font-size:31px;
            font-weight:900;
        }

        .declaration{
            margin-top:26px;
            padding:18px 20px;
            border-left:4px solid #7c3aed;
            background:#fafafa;
            font-size:14px;
            line-height:1.75;
            text-align:justify;
        }

        .worked-days{
            margin-top:20px;
            padding:16px 18px;
            border-radius:12px;
            border:1px solid #e2e8f0;
        }

        .worked-days-title{
            margin-bottom:10px;
            font-size:13px;
            font-weight:900;
        }

        .worked-days-text{
            color:#334155;
            font-size:13px;
            line-height:1.6;
        }

        .details{
            margin-top:20px;
        }

        .details h2{
            margin:0 0 11px;
            font-size:15px;
        }

        .detail-row{
            display:flex;
            justify-content:space-between;
            gap:20px;
            padding:10px 12px;
            margin-bottom:6px;
            border-radius:8px;
            background:#f8fafc;
            font-size:12px;
        }

        .detail-row strong{
            color:#111827;
        }

        .obs{
            margin-top:18px;
            padding:13px 15px;
            border-radius:10px;
            background:#fffbeb;
            border:1px solid #fde68a;
            font-size:11px;
            line-height:1.5;
        }

        .signatures{
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:50px;
            margin-top:75px;
        }

        .signature{
            text-align:center;
            padding-top:8px;
            border-top:1px solid #334155;
            font-size:11px;
            color:#475569;
        }

        .footer{
            margin-top:45px;
            padding-top:12px;
            border-top:1px solid #e2e8f0;
            color:#94a3b8;
            font-size:9px;
        }

        @media print{

            @page{
                size:A4;
                margin:0;
            }

            html,
            body{
                background:#fff;
            }

            body{
                padding:0;
            }

            .print-page{
                width:210mm;
                min-height:297mm;
                margin:0;
                box-shadow:none;
            }

        }

    </style>

</head>

<body>

    <div class="print-page">

        <div class="header">

            <div class="logo-wrap">

                ${
                    logoEmpresa
                        ? `
                            <img
                                class="logo"
                                src="${logoEmpresa}"
                                alt="WN Comunicação Visual">
                        `
                        : `
                            <div class="empresa-fallback">
                                WN Comunicação Visual
                            </div>
                        `
                }

            </div>

            <div class="document-title">

                <h1>
                    RECIBO DE PAGAMENTO
                </h1>

                <p>
                    Pagamento de diárias de trabalho
                </p>

            </div>

        </div>


        <div class="meta">

            <div class="meta-card">

                <span class="label">
                    Funcionário
                </span>

                <div class="meta-value">
                    ${escaparHTMLFuncionario(f.nome || '-')}
                </div>

            </div>

            <div class="meta-card">

                <span class="label">
                    Competência
                </span>

                <div class="meta-value">
                    ${competencia}
                </div>

            </div>

        </div>


        <div class="value-box">

            <span class="label">
                Valor recebido
            </span>

            <div class="value-total">
                ${valorTotal}
            </div>

        </div>


        <div class="declaration">
            ${declaracao}
        </div>


        <div class="worked-days">

            <div class="worked-days-title">
                Dias trabalhados considerados neste pagamento
            </div>

            <div class="worked-days-text">
                ${diasTrabalhadosTexto}
            </div>

        </div>


        <div class="details">

            <h2>
                Detalhamento do pagamento
            </h2>

            <div class="detail-row">

                <span>
                    Quantidade de diárias registradas no ponto
                </span>

                <strong>
                    ${quantidadeDiarias}
                </strong>

            </div>

            ${
                diasManuais > 0
                    ? `
                        <div class="detail-row">

                            <span>
                                Diárias informadas manualmente
                            </span>

                            <strong>
                                ${diasManuais}
                            </strong>

                        </div>
                    `
                    : ''
            }

            <div class="detail-row">

                <span>
                    Valor das diárias
                </span>

                <strong>
                    ${valorDiarias}
                </strong>

            </div>

            <div class="detail-row">

                <span>
                    Horas extras
                </span>

                <strong>
                    ${valorExtras}
                </strong>

            </div>

            <div class="detail-row">

                <span>
                    Ajuste
                </span>

                <strong>
                    ${valorAjuste}
                </strong>

            </div>

        </div>


        ${
            observacoes
                ? `
                    <div class="obs">
                        <strong>Observações:</strong>
                        ${observacoes}
                    </div>
                `
                : ''
        }


        <div class="signatures">

            <div class="signature">
                WN Comunicação Visual
            </div>

            <div class="signature">
                Assinatura do Funcionário
            </div>

        </div>


        <div class="footer">
            Emitido em
            ${formatarDataCarreira(
                dataHojeFuncionario()
            )}
        </div>

    </div>


    <script>

        /*
            Quando o HTML é aberto pelo sistema de impressão
            do Dominus, a janela de impressão aparece direto.
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

    /*
        Não chama doc.save() e não grava recibo em banco.
        Apenas abre a impressão imediatamente.
    */

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


/*
    Alias mantido somente para compatibilidade com versões
    antigas do código. A tela atual usa exclusivamente o
    recibo de pagamento acima.
*/

window.gerarComprovanteAcertoFuncionario =
    window.gerarReciboRescisaoFuncionario;


/* ========================================================= */
/* 09. COMPATIBILIDADE DE STATUS COM FÉRIAS AGENDADAS       */
/* ========================================================= */
/*
    Mantém o status do funcionário compatível com
    períodos de férias agendados.
*/

/* --------------------------------------------------------- */
/* atualizarStatusFeriasFuncionario */
/* Atualiza o status do funcionário conforme férias agendadas. */
/* --------------------------------------------------------- */

window.atualizarStatusFeriasFuncionario = function (
    index
) {
    const f =
        db.funcionarios[index];

    if (!f) return;

    garantirEstruturaFuncionarioRH(f);

    const hoje =
        dataHojeFuncionario();

    const emFerias =
        (f.ferias || [])
        .some(item => (
            statusFeriasTextoFuncionario(item.status) !==
            'Canceladas'
            &&
            hoje >= item.inicio
            &&
            hoje <= item.fim
        ));

    if (
        emFerias &&
        f.status ===
        'Ativo'
    ) {
        f.status =
            'Férias';
    }

    if (
        !emFerias &&
        f.status ===
        'Férias'
    ) {
        f.status =
            'Ativo';
    }
};

/* ========================================================= */
/* 10. STATUS VISUAL DO FUNCIONÁRIO                          */
/* ========================================================= */
/*
    Retorna a classe visual correspondente ao status
    exibido na listagem de funcionários.
*/

/* --------------------------------------------------------- */
/* getStatusFuncionarioClass */
/* Retorna a classe CSS correspondente ao status do funcionário. */
/* --------------------------------------------------------- */

window.getStatusFuncionarioClass = function (status) {

    switch (status) {

        case 'Ativo':
            return 'status-ativo';

        case 'Férias':
            return 'status-ferias';

        case 'Afastado':
            return 'status-afastado';

        case 'Desligado':
            return 'status-desligado';

        default:
            return 'status-padrao';
    }
};


/* ========================================================= */
/* 10. CONTROLE DE UNIFORMES E EPIs                          */
/* ========================================================= */
/*
    CONTROLE INTEGRADO DE UNIFORMES E EPIs

    Esta área reproduz dentro do Dominus a lógica da planilha:
    "Controle de Uniformes e EPIs - Dashboard v2".

    ESTRUTURA DA PLANILHA REPRODUZIDA:
    1. Dashboard
    2. Cadastro de Produtos
    3. Cadastro de Funcionários
    4. Movimentações

    IMPORTANTE SOBRE FUNCIONÁRIOS:
    O cadastro de funcionários da planilha NÃO é duplicado no ERP.
    O campo Funcionário das movimentações busca diretamente em
    db.funcionarios e exibe SOMENTE quem estiver com status "Ativo".

    Se um funcionário for desligado, ele deixa de aparecer em novas
    movimentações, porém o histórico antigo continua preservado.

    REGRA DE ESTOQUE DA PLANILHA:
    - Quantidade em estoque = quantidade cadastrada do produto;
    - Qtd. pendente = soma das movimentações com status "Pendente";
    - Quantidade disponível = estoque - pendências, nunca menor que zero;
    - ZERADO = disponível igual a zero;
    - ABAIXO DO MÍNIMO = disponível maior que zero e menor que o mínimo;
    - OK = disponível igual ou superior ao estoque mínimo.

    STATUS DAS MOVIMENTAÇÕES:
    - Pendente
    - Devolvido

    SITUAÇÃO NA DEVOLUÇÃO:
    - Suja
    - Limpo
    - Inteiro
    - Quebrado

    Os produtos e as quatro movimentações já existentes na planilha
    enviada são importados automaticamente SOMENTE na primeira criação
    da estrutura de Uniformes e EPIs no banco do Dominus.
*/


/* --------------------------------------------------------- */
/* produtosIniciaisUniformesEPI                              */
/* Produtos existentes na planilha enviada.                  */
/* --------------------------------------------------------- */

function produtosIniciaisUniformesEPI() {
    const dados = [
        ['Camisa azul claro - P',1,2],['Camisa azul claro - M',1,1],['Camisa azul claro - G',2,1],['Camisa azul claro - GG',2,1],['Camisa azul claro - EXG',2,1],
        ['Colete preto - P',1,0],['Colete preto - M',1,0],['Colete preto - G',2,4],['Colete preto - GG',2,3],['Colete preto - XG',2,0],['Colete preto - EXG',2,0],
        ['Camisa simples preto e vermelho - P',1,2],['Camisa simples preto e vermelho - M',1,0],['Camisa simples preto e vermelho - G',2,10],['Camisa simples preto e vermelho - GG',2,5],['Camisa simples preto e vermelho - XG',2,7],['Camisa simples preto e vermelho - EXG',2,0],
        ['Camisa polo preto e vermelho - P',1,0],['Camisa polo preto e vermelho - M',1,0],['Camisa polo preto e vermelho - G',2,0],['Camisa polo preto e vermelho - GG',2,6],['Camisa polo preto e vermelho - XG',2,5],['Camisa polo preto e vermelho - EXG',2,0],
        ['Camisa preta simples - P',1,0],['Camisa preta simples - M',1,1],['Camisa preta simples - G',2,7],['Camisa preta simples - GG',2,0],['Camisa preta simples - XG',2,0],['Camisa preta simples - EXG',2,0],
        ['Camisa cinza Sintonia Fina - P',1,0],['Camisa cinza Sintonia Fina - M',1,9],['Camisa cinza Sintonia Fina - G',2,7],['Camisa cinza Sintonia Fina - GG',2,19],['Camisa cinza Sintonia Fina - XG',2,0],['Camisa cinza Sintonia Fina - EXG',2,0],
        ['Boné WN - Único',2,4],
        ['Calça preta - P',1,0],['Calça preta - M',1,2],['Calça preta - G',2,1],['Calça preta - GG',2,2],['Calça preta - XG',2,0],['Calça preta - EXG',2,0],
        ['Calça azul - P',1,2],['Calça azul - M',1,3],['Calça azul - G',2,1],['Calça azul - GG',2,2],['Calça azul - XG',2,0],['Calça azul - EXG',2,1],
        ['Colete azul - P',1,0],['Colete azul - M',1,3],['Colete azul - G',2,1],['Colete azul - GG',2,0],['Colete azul - XG',2,0],['Colete azul - EXG',2,0],
        ['Jaqueta corta vento - P',1,0],['Jaqueta corta vento - M',1,1],['Jaqueta corta vento - G',2,1],['Jaqueta corta vento - GG',2,0],['Jaqueta corta vento - XG',2,0],['Jaqueta corta vento - EXG',2,0],
        ['Camisa social azul claro - Tamanho não informado',2,6],
        ['Botina - 40',2,3],['Botina - 41',2,3],['Botina - 42',1,2],['Botina - 43',1,2],
        ['Protetor auricular - Único',2,3],['Abafador de ruídos - Único',2,7],['Máscara de proteção grande - Único',1,1],['Luva simples de proteção - Único',4,16],['Luva raspa - Único',2,4],['Óculos de proteção - Único',2,1],['Óculos escuro de proteção - Único',1,4],['Óculos amarelo de proteção - Único',1,1]
    ];

    return dados.map((item, indice) => ({
        id: `uni-prod-${String(indice + 1).padStart(3,'0')}`,
        nome: item[0],
        estoqueMinimo: item[1],
        quantidadeEstoque: item[2],
        valorUnitario: 0
    }));
}


/* --------------------------------------------------------- */
/* movimentacoesIniciaisUniformesEPI                         */
/* Movimentações já existentes na planilha enviada.          */
/* --------------------------------------------------------- */

function movimentacoesIniciaisUniformesEPI() {
    return [
        ['Kauan Gabriel Alves da Silva','Botina - 40',1],
        ['Kauan Gabriel Alves da Silva','Luva simples de proteção - Único',1],
        ['Kauan Gabriel Alves da Silva','Camisa cinza Sintonia Fina - GG',2],
        ['Kauan Gabriel Alves da Silva','Calça azul - M',1]
    ].map((item, indice) => ({
        id: `uni-mov-${String(indice + 1).padStart(3,'0')}`,
        dataRetirada: '2026-09-16',
        funcionarioId: '',
        funcionarioNome: item[0],
        produtoId: '',
        produtoNome: item[1],
        quantidade: item[2],
        motivo: 'Funcionário novo',
        status: 'Pendente',
        dataDevolucao: '',
        situacao: ''
    }));
}


/* --------------------------------------------------------- */
/* garantirEstruturaUniformesEPI                             */
/* Garante a estrutura no banco e importa a planilha 1 vez. */
/* --------------------------------------------------------- */

function garantirEstruturaUniformesEPI() {
    if (!window.db) return null;

    if (!db.uniformesEPI || typeof db.uniformesEPI !== 'object') {
        db.uniformesEPI = {
            versao: 1,
            inicializadoPlanilhaV2: false,
            produtos: [],
            movimentacoes: []
        };
    }

    if (!Array.isArray(db.uniformesEPI.produtos)) {
        db.uniformesEPI.produtos = [];
    }

    if (!Array.isArray(db.uniformesEPI.movimentacoes)) {
        db.uniformesEPI.movimentacoes = [];
    }

    if (!db.uniformesEPI.inicializadoPlanilhaV2) {
        if (db.uniformesEPI.produtos.length === 0) {
            db.uniformesEPI.produtos = produtosIniciaisUniformesEPI();
        }

        if (db.uniformesEPI.movimentacoes.length === 0) {
            db.uniformesEPI.movimentacoes = movimentacoesIniciaisUniformesEPI();
        }

        db.uniformesEPI.inicializadoPlanilhaV2 = true;

        Promise.resolve(save()).catch(erro =>
            console.error('Erro ao inicializar Uniformes e EPIs:', erro)
        );
    }

    return db.uniformesEPI;
}


/* --------------------------------------------------------- */
/* idUniformeEPI                                             */
/* Gera um identificador simples e único.                    */
/* --------------------------------------------------------- */

function idUniformeEPI(prefixo) {
    return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}


/* --------------------------------------------------------- */
/* funcionariosAtivosUniformesEPI                            */
/* Retorna literalmente somente funcionários com status Ativo. */
/* --------------------------------------------------------- */

function funcionariosAtivosUniformesEPI() {
    return ordenarFuncionariosPorNome(
        (Array.isArray(db.funcionarios) ? db.funcionarios : [])
            .filter(funcionario =>
                String(funcionario?.status || '')
                    .trim()
                    .toLowerCase() === 'ativo'
            )
    );
}


/* --------------------------------------------------------- */
/* quantidadePendenteProdutoUniformeEPI                      */
/* Soma as retiradas que continuam pendentes.                */
/* --------------------------------------------------------- */

function quantidadePendenteProdutoUniformeEPI(produto) {
    const estrutura = garantirEstruturaUniformesEPI();
    if (!estrutura || !produto) return 0;

    return estrutura.movimentacoes
        .filter(mov =>
            String(mov.status || '').toLowerCase() === 'pendente' &&
            (
                (mov.produtoId && mov.produtoId === produto.id) ||
                (!mov.produtoId && mov.produtoNome === produto.nome)
            )
        )
        .reduce((total, mov) => total + numeroFuncionario(mov.quantidade), 0);
}


/* --------------------------------------------------------- */
/* resumoProdutoUniformeEPI                                  */
/* Reproduz os cálculos automáticos do Cadastro de Produtos. */
/* --------------------------------------------------------- */

function resumoProdutoUniformeEPI(produto) {
    const estoque = numeroFuncionario(produto?.quantidadeEstoque);
    const minimo = numeroFuncionario(produto?.estoqueMinimo);
    const valor = numeroFuncionario(produto?.valorUnitario);
    const pendente = quantidadePendenteProdutoUniformeEPI(produto);
    const disponivel = Math.max(0, estoque - pendente);

    let status = 'OK';
    if (disponivel === 0) {
        status = 'ZERADO';
    } else if (disponivel < minimo) {
        status = 'ABAIXO DO MÍNIMO';
    }

    return {
        estoque,
        minimo,
        valor,
        pendente,
        disponivel,
        valorTotal: estoque * valor,
        valorDisponivel: disponivel * valor,
        status
    };
}


/* --------------------------------------------------------- */
/* formatarMoedaUniformeEPI                                  */
/* Formata valores monetários no padrão brasileiro.          */
/* --------------------------------------------------------- */

function formatarMoedaUniformeEPI(valor) {
    return numeroFuncionario(valor).toLocaleString(
        'pt-BR',
        { style:'currency', currency:'BRL' }
    );
}


/* --------------------------------------------------------- */
/* formatarDataUniformeEPI                                   */
/* Formata YYYY-MM-DD para DD/MM/YYYY.                       */
/* --------------------------------------------------------- */

function formatarDataUniformeEPI(data) {
    if (!data) return '-';
    const partes = String(data).split('-');
    return partes.length === 3
        ? `${partes[2]}/${partes[1]}/${partes[0]}`
        : String(data);
}


/* --------------------------------------------------------- */
/* abrirUniformesEPIFuncionario                              */
/* Abre a área principal de Uniformes e EPIs.                */
/* --------------------------------------------------------- */

window.abrirUniformesEPIFuncionario = function () {
    garantirEstruturaUniformesEPI();
    window.abaUniformesEPIAtual = window.abaUniformesEPIAtual || 'dashboard';

    configModal({
        title: '👕 Uniformes e EPIs',
        body: '<div id="uniformes-epi-conteudo"></div>',
        size: 'fullscreen',
        confirmText: 'Fechar',
        onConfirm() {
            closeModal();
        }
    });

    renderUniformesEPI();
};


/* --------------------------------------------------------- */
/* mudarAbaUniformesEPI                                      */
/* Alterna Dashboard, Produtos e Movimentações.              */
/* --------------------------------------------------------- */

window.mudarAbaUniformesEPI = function (aba) {
    window.abaUniformesEPIAtual = aba;
    renderUniformesEPI();
};


/* --------------------------------------------------------- */
/* renderUniformesEPI                                        */
/* Monta a navegação e a aba selecionada.                    */
/* --------------------------------------------------------- */

window.renderUniformesEPI = function () {
    const alvo = document.getElementById('uniformes-epi-conteudo');
    if (!alvo) return;

    const aba = window.abaUniformesEPIAtual || 'dashboard';

    const botaoAba = (id, texto) => `
        <button
            type="button"
            onclick="mudarAbaUniformesEPI('${id}')"
            style="
                border:none;
                border-radius:10px;
                padding:10px 16px;
                cursor:pointer;
                font-weight:700;
                background:${aba === id ? '#dc2626' : '#e5e7eb'};
                color:${aba === id ? '#fff' : '#111827'};
            "
        >${texto}</button>
    `;

    let conteudo = '';

    if (aba === 'produtos') {
        conteudo = htmlProdutosUniformesEPI();
    } else if (aba === 'movimentacoes') {
        conteudo = htmlMovimentacoesUniformesEPI();
    } else {
        conteudo = htmlDashboardUniformesEPI();
    }

    alvo.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:18px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${botaoAba('dashboard','📊 Dashboard')}
                ${botaoAba('produtos','📦 Produtos')}
                ${botaoAba('movimentacoes','🔄 Movimentações')}
            </div>
            ${conteudo}
        </div>
    `;
};


/* --------------------------------------------------------- */
/* htmlDashboardUniformesEPI                                 */
/* Reproduz o Dashboard da planilha.                         */
/* --------------------------------------------------------- */

function htmlDashboardUniformesEPI() {
    const estrutura = garantirEstruturaUniformesEPI();
    const produtos = estrutura.produtos
        .map(produto => ({ produto, resumo: resumoProdutoUniformeEPI(produto) }));

    const abaixo = produtos.filter(item => item.resumo.status === 'ABAIXO DO MÍNIMO');
    const zerados = produtos.filter(item => item.resumo.status === 'ZERADO');
    const pendencias = estrutura.movimentacoes.filter(
        mov => String(mov.status || '').toLowerCase() === 'pendente'
    );

    const card = (titulo, valor, cor) => `
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px;border-top:4px solid ${cor};">
            <div style="font-size:12px;color:#6b7280;font-weight:700;">${titulo}</div>
            <div style="font-size:30px;font-weight:800;margin-top:6px;">${valor}</div>
        </div>
    `;

    const linhasProdutos = lista => lista.length
        ? lista.map(item => `
            <tr>
                <td>${escaparHTMLFuncionario(item.produto.nome)}</td>
                <td style="text-align:center;">${item.resumo.disponivel}</td>
                <td style="text-align:center;">${item.resumo.minimo}</td>
                <td><strong>${item.resumo.status}</strong></td>
            </tr>
        `).join('')
        : '<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:18px;">Nenhum produto.</td></tr>';

    const linhasPendencias = pendencias.length
        ? pendencias.map(mov => `
            <tr>
                <td>${formatarDataUniformeEPI(mov.dataRetirada)}</td>
                <td>${escaparHTMLFuncionario(mov.funcionarioNome)}</td>
                <td>${escaparHTMLFuncionario(mov.produtoNome)}</td>
                <td style="text-align:center;">${numeroFuncionario(mov.quantidade)}</td>
                <td>${escaparHTMLFuncionario(mov.motivo || '-')}</td>
                <td>${escaparHTMLFuncionario(mov.situacao || '-')}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:18px;">Nenhuma pendência ativa.</td></tr>';

    return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">
            ${card('PRODUTOS ABAIXO DO MÍNIMO', abaixo.length, '#f59e0b')}
            ${card('PRODUTOS ZERADOS', zerados.length, '#dc2626')}
            ${card('PENDÊNCIAS ATIVAS', pendencias.length, '#2563eb')}
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px;">
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;overflow:auto;">
                <h3 style="margin:0 0 12px;">Produtos abaixo do mínimo</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr><th>Produto</th><th>Disponível</th><th>Mínimo</th><th>Status</th></tr></thead>
                    <tbody>${linhasProdutos(abaixo)}</tbody>
                </table>
            </div>

            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;overflow:auto;">
                <h3 style="margin:0 0 12px;">Produtos zerados</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr><th>Produto</th><th>Disponível</th><th>Mínimo</th><th>Status</th></tr></thead>
                    <tbody>${linhasProdutos(zerados)}</tbody>
                </table>
            </div>
        </div>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;overflow:auto;">
            <h3 style="margin:0 0 12px;">Movimentações pendentes</h3>
            <table style="width:100%;border-collapse:collapse;min-width:850px;">
                <thead><tr><th>Data</th><th>Funcionário</th><th>Produto</th><th>Qtd.</th><th>Motivo</th><th>Situação</th></tr></thead>
                <tbody>${linhasPendencias}</tbody>
            </table>
        </div>
    `;
}


/* --------------------------------------------------------- */
/* htmlProdutosUniformesEPI                                  */
/* Reproduz o Cadastro de Produtos da planilha.              */
/* --------------------------------------------------------- */

function htmlProdutosUniformesEPI() {
    const estrutura = garantirEstruturaUniformesEPI();
    const produtos = [...estrutura.produtos].sort((a,b) =>
        String(a.nome || '').localeCompare(String(b.nome || ''),'pt-BR',{sensitivity:'base'})
    );

    const linhas = produtos.length
        ? produtos.map(produto => {
            const r = resumoProdutoUniformeEPI(produto);
            const cor = r.status === 'ZERADO' ? '#dc2626' : r.status === 'ABAIXO DO MÍNIMO' ? '#f59e0b' : '#16a34a';

            return `
                <tr>
                    <td>${escaparHTMLFuncionario(produto.nome)}</td>
                    <td style="text-align:center;">${r.minimo}</td>
                    <td style="text-align:center;">${r.estoque}</td>
                    <td>${formatarMoedaUniformeEPI(r.valor)}</td>
                    <td style="text-align:center;">${r.pendente}</td>
                    <td style="text-align:center;font-weight:800;">${r.disponivel}</td>
                    <td>${formatarMoedaUniformeEPI(r.valorTotal)}</td>
                    <td>${formatarMoedaUniformeEPI(r.valorDisponivel)}</td>
                    <td><span style="background:${cor};color:#fff;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap;">${r.status}</span></td>
                    <td>
                        <div style="display:flex;gap:6px;white-space:nowrap;">
                            <button type="button" class="btn-action" style="padding:6px 9px;background:#f59e0b;" onclick="editarProdutoUniformeEPI('${produto.id}')">Editar</button>
                            <button type="button" class="btn-del" style="padding:6px 9px;" onclick="excluirProdutoUniformeEPI('${produto.id}')">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('')
        : '<tr><td colspan="10" style="text-align:center;padding:20px;color:#6b7280;">Nenhum produto cadastrado.</td></tr>';

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
            <div>
                <h2 style="margin:0;">Cadastro de Produtos</h2>
                <div style="color:#6b7280;font-size:13px;margin-top:4px;">Estoque, mínimo e valores dos uniformes e EPIs.</div>
            </div>
            <button type="button" class="btn-action" style="background:#16a34a;" onclick="novoProdutoUniformeEPI()">+ Novo Produto</button>
        </div>

        <div style="overflow:auto;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;min-width:1250px;">
                <thead>
                    <tr>
                        <th>Produto / Tamanho</th>
                        <th>Estoque mínimo</th>
                        <th>Qtd. em estoque</th>
                        <th>Valor pago unit.</th>
                        <th>Qtd. pendente</th>
                        <th>Qtd. disponível</th>
                        <th>Valor total cadastrado</th>
                        <th>Valor disponível</th>
                        <th>Status estoque</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}


/* --------------------------------------------------------- */
/* novoProdutoUniformeEPI                                    */
/* Abre o cadastro de um novo uniforme ou EPI.               */
/* --------------------------------------------------------- */

window.novoProdutoUniformeEPI = function () {
    abrirFormularioProdutoUniformeEPI(null);
};


/* --------------------------------------------------------- */
/* editarProdutoUniformeEPI                                  */
/* Abre um produto existente para edição.                    */
/* --------------------------------------------------------- */

window.editarProdutoUniformeEPI = function (id) {
    const produto = garantirEstruturaUniformesEPI().produtos.find(p => p.id === id);
    if (!produto) return;
    abrirFormularioProdutoUniformeEPI(produto);
};


/* --------------------------------------------------------- */
/* abrirFormularioProdutoUniformeEPI                         */
/* Formulário compartilhado entre novo e editar.             */
/* --------------------------------------------------------- */

function abrirFormularioProdutoUniformeEPI(produto) {
    const editando = !!produto;

    configModal({
        title: editando ? 'Editar Uniforme / EPI' : 'Novo Uniforme / EPI',
        size: 'medium',
        confirmText: 'Salvar',
        body: `
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div>
                    <label>Produto / Tamanho</label>
                    <input id="uni-prod-nome" value="${escaparHTMLFuncionario(produto?.nome || '')}" placeholder="Ex.: Botina - 40">
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                    <div><label>Estoque mínimo</label><input id="uni-prod-minimo" type="number" min="0" step="1" value="${numeroFuncionario(produto?.estoqueMinimo)}"></div>
                    <div><label>Quantidade em estoque</label><input id="uni-prod-estoque" type="number" min="0" step="1" value="${numeroFuncionario(produto?.quantidadeEstoque)}"></div>
                    <div><label>Valor pago unit. (R$)</label><input id="uni-prod-valor" type="number" min="0" step="0.01" value="${numeroFuncionario(produto?.valorUnitario)}"></div>
                </div>
            </div>
        `,
        async onConfirm() {
            const nome = document.getElementById('uni-prod-nome')?.value.trim();
            const minimo = numeroFuncionario(document.getElementById('uni-prod-minimo')?.value);
            const estoque = numeroFuncionario(document.getElementById('uni-prod-estoque')?.value);
            const valor = numeroFuncionario(document.getElementById('uni-prod-valor')?.value);

            if (!nome) {
                alert('Informe o produto / tamanho.');
                return;
            }

            const estrutura = garantirEstruturaUniformesEPI();
            const duplicado = estrutura.produtos.some(p =>
                p.id !== produto?.id &&
                String(p.nome || '').trim().toLowerCase() === nome.toLowerCase()
            );

            if (duplicado) {
                alert('Já existe um produto com esse nome.');
                return;
            }

            if (editando) {
                const nomeAntigo = produto.nome;
                produto.nome = nome;
                produto.estoqueMinimo = minimo;
                produto.quantidadeEstoque = estoque;
                produto.valorUnitario = valor;

                estrutura.movimentacoes.forEach(mov => {
                    if (mov.produtoId === produto.id || (!mov.produtoId && mov.produtoNome === nomeAntigo)) {
                        mov.produtoId = produto.id;
                        mov.produtoNome = nome;
                    }
                });
            } else {
                estrutura.produtos.push({
                    id: idUniformeEPI('uni-prod'),
                    nome,
                    estoqueMinimo: minimo,
                    quantidadeEstoque: estoque,
                    valorUnitario: valor
                });
            }

            await save();
            abrirUniformesEPIFuncionario();
            window.abaUniformesEPIAtual = 'produtos';
            renderUniformesEPI();
        }
    });
}


/* --------------------------------------------------------- */
/* excluirProdutoUniformeEPI                                 */
/* Exclui produto somente se não houver movimentação ligada. */
/* --------------------------------------------------------- */

window.excluirProdutoUniformeEPI = async function (id) {
    const estrutura = garantirEstruturaUniformesEPI();
    const produto = estrutura.produtos.find(p => p.id === id);
    if (!produto) return;

    const emUso = estrutura.movimentacoes.some(mov =>
        mov.produtoId === id || (!mov.produtoId && mov.produtoNome === produto.nome)
    );

    if (emUso) {
        alert('Este produto possui movimentações registradas e não pode ser excluído. Edite o produto se necessário.');
        return;
    }

    if (!confirm(`Deseja excluir "${produto.nome}"?`)) return;

    estrutura.produtos = estrutura.produtos.filter(p => p.id !== id);
    await save();
    renderUniformesEPI();
};


/* --------------------------------------------------------- */
/* htmlMovimentacoesUniformesEPI                             */
/* Reproduz a aba Movimentações da planilha.                 */
/* --------------------------------------------------------- */

function htmlMovimentacoesUniformesEPI() {
    const estrutura = garantirEstruturaUniformesEPI();
    const movimentacoes = [...estrutura.movimentacoes].sort((a,b) =>
        String(b.dataRetirada || '').localeCompare(String(a.dataRetirada || ''))
    );

    const linhas = movimentacoes.length
        ? movimentacoes.map(mov => {
            const pendente = String(mov.status || '').toLowerCase() === 'pendente';
            return `
                <tr>
                    <td>${formatarDataUniformeEPI(mov.dataRetirada)}</td>
                    <td>${escaparHTMLFuncionario(mov.funcionarioNome)}</td>
                    <td>${escaparHTMLFuncionario(mov.produtoNome)}</td>
                    <td style="text-align:center;">${numeroFuncionario(mov.quantidade)}</td>
                    <td>${escaparHTMLFuncionario(mov.estadoProduto || '-')}</td>
                    <td>${escaparHTMLFuncionario(mov.motivo || '-')}</td>
                    <td><span style="background:${pendente ? '#f59e0b' : '#16a34a'};color:#fff;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;">${escaparHTMLFuncionario(mov.status || '')}</span></td>
                    <td>${formatarDataUniformeEPI(mov.dataDevolucao)}</td>
                    <td>${escaparHTMLFuncionario(mov.situacao || '-')}</td>
                    <td>
                        <div style="display:flex;gap:6px;white-space:nowrap;">
                            <button type="button" class="btn-action" style="padding:6px 9px;background:#f59e0b;" onclick="editarMovimentacaoUniformeEPI('${mov.id}')">Editar</button>
                            ${pendente ? `<button type="button" class="btn-action" style="padding:6px 9px;background:#16a34a;" onclick="devolverMovimentacaoUniformeEPI('${mov.id}')">Devolver</button>` : ''}
                            <button type="button" class="btn-del" style="padding:6px 9px;" onclick="excluirMovimentacaoUniformeEPI('${mov.id}')">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('')
        : '<tr><td colspan="10" style="text-align:center;padding:20px;color:#6b7280;">Nenhuma movimentação registrada.</td></tr>';

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
            <div>
                <h2 style="margin:0;">Movimentações de Uniformes e EPI</h2>
                <div style="color:#6b7280;font-size:13px;margin-top:4px;">Retiradas, pendências e devoluções.</div>
            </div>
            <button type="button" class="btn-action" style="background:#16a34a;" onclick="novaMovimentacaoUniformeEPI()">+ Nova Movimentação</button>
        </div>

        <div style="overflow:auto;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;min-width:1300px;">
                <thead>
                    <tr>
                        <th>Data da retirada</th>
                        <th>Funcionário</th>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Estado entregue</th>
                        <th>Motivo</th>
                        <th>Status</th>
                        <th>Data da devolução</th>
                        <th>Situação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}


/* --------------------------------------------------------- */
/* novaMovimentacaoUniformeEPI                               */
/* Abre uma nova retirada.                                   */
/* --------------------------------------------------------- */

window.novaMovimentacaoUniformeEPI = function () {
    abrirFormularioMovimentacaoUniformeEPI(null);
};


/* --------------------------------------------------------- */
/* editarMovimentacaoUniformeEPI                             */
/* Abre uma movimentação para edição.                        */
/* --------------------------------------------------------- */

window.editarMovimentacaoUniformeEPI = function (id) {
    const mov = garantirEstruturaUniformesEPI().movimentacoes.find(m => m.id === id);
    if (!mov) return;
    abrirFormularioMovimentacaoUniformeEPI(mov);
};


/* --------------------------------------------------------- */
/* abrirFormularioMovimentacaoUniformeEPI                    */
/* Formulário de retirada / edição de movimentação.          */
/* --------------------------------------------------------- */

function abrirFormularioMovimentacaoUniformeEPI(mov) {
    const estrutura = garantirEstruturaUniformesEPI();
    const funcionarios = funcionariosAtivosUniformesEPI();
    const produtos = [...estrutura.produtos].sort((a,b) =>
        String(a.nome || '').localeCompare(String(b.nome || ''),'pt-BR',{sensitivity:'base'})
    );

    const funcionarioAtual = mov?.funcionarioNome || '';
    const produtoAtual = mov?.produtoNome || '';

    const opcoesFuncionarios = funcionarios.map((func, indice) => `
        <option value="${indice}" ${func.nome === funcionarioAtual ? 'selected' : ''}>${escaparHTMLFuncionario(func.nome)}</option>
    `).join('');

    const opcoesProdutos = produtos.map(produto => {
        const r = resumoProdutoUniformeEPI(produto);
        return `<option value="${produto.id}" ${produto.nome === produtoAtual ? 'selected' : ''}>${escaparHTMLFuncionario(produto.nome)} — disponível: ${r.disponivel}</option>`;
    }).join('');

    configModal({
        title: mov ? 'Editar Movimentação' : 'Nova Movimentação',
        size: 'large',
        confirmText: 'Salvar',
        body: `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
                <div><label>Data da retirada</label><input id="uni-mov-data" type="date" value="${mov?.dataRetirada || dataHojeFuncionario()}"></div>
                <div>
                    <label>Funcionário</label>
                    <select id="uni-mov-funcionario">
                        <option value="">Selecione...</option>
                        ${opcoesFuncionarios}
                        ${mov && !funcionarios.some(f => f.nome === funcionarioAtual) ? `<option value="historico" selected>${escaparHTMLFuncionario(funcionarioAtual)} (histórico)</option>` : ''}
                    </select>
                </div>
                <div>
                    <label>Produto</label>
                    <select id="uni-mov-produto">
                        <option value="">Selecione...</option>
                        ${opcoesProdutos}
                    </select>
                </div>
                <div><label>Quantidade</label><input id="uni-mov-qtd" type="number" min="1" step="1" value="${numeroFuncionario(mov?.quantidade) || 1}"></div>
                <div>
                    <label>Estado do produto entregue</label>
                    <select id="uni-mov-estado-produto">
                        <option value="">Selecione...</option>
                        <option value="Novo" ${mov?.estadoProduto === 'Novo' ? 'selected' : ''}>Novo</option>
                        <option value="Usado" ${mov?.estadoProduto === 'Usado' ? 'selected' : ''}>Usado</option>
                    </select>
                </div>
                <div style="grid-column:1/-1;"><label>Motivo</label><input id="uni-mov-motivo" value="${escaparHTMLFuncionario(mov?.motivo || '')}" placeholder="Ex.: Funcionário novo"></div>
                <div>
                    <label>Status</label>
                    <select id="uni-mov-status" onchange="atualizarCamposDevolucaoUniformeEPI()">
                        <option value="Pendente" ${mov?.status !== 'Devolvido' ? 'selected' : ''}>Pendente</option>
                        <option value="Devolvido" ${mov?.status === 'Devolvido' ? 'selected' : ''}>Devolvido</option>
                    </select>
                </div>
                <div><label>Data da devolução</label><input id="uni-mov-devolucao" type="date" value="${mov?.dataDevolucao || ''}"></div>
                <div>
                    <label>Situação</label>
                    <select id="uni-mov-situacao">
                        <option value="">Selecione...</option>
                        ${['Suja','Limpo','Inteiro','Quebrado'].map(s => `<option ${mov?.situacao === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
            </div>
        `,
        async onConfirm() {
            const funcSel = document.getElementById('uni-mov-funcionario');
            const prodId = document.getElementById('uni-mov-produto')?.value;
            const produto = estrutura.produtos.find(p => p.id === prodId);
            const qtd = numeroFuncionario(document.getElementById('uni-mov-qtd')?.value);
            const estadoProduto = document.getElementById('uni-mov-estado-produto')?.value || '';
            const status = document.getElementById('uni-mov-status')?.value;

            let funcionario = null;
            let funcionarioNome = '';

            if (funcSel?.value === 'historico' && mov) {
                funcionarioNome = mov.funcionarioNome;
            } else if (funcSel?.value !== '') {
                funcionario = funcionarios[Number(funcSel.value)];
                funcionarioNome = funcionario?.nome || '';
            }

            if (!funcionarioNome) {
                alert('Selecione um funcionário ativo.');
                return;
            }

            if (!produto) {
                alert('Selecione um produto.');
                return;
            }

            if (qtd <= 0) {
                alert('Informe uma quantidade válida.');
                return;
            }

            if (!estadoProduto) {
                alert('Informe se o produto entregue é Novo ou Usado.');
                return;
            }

            /*
                Para nova retirada pendente, impede entregar quantidade
                superior à disponível, exatamente para manter o estoque
                coerente com o cálculo da planilha.
            */
            if (status === 'Pendente') {
                let disponivel = resumoProdutoUniformeEPI(produto).disponivel;

                if (mov && String(mov.status || '').toLowerCase() === 'pendente') {
                    const mesmoProduto =
                        mov.produtoId === produto.id ||
                        (!mov.produtoId && mov.produtoNome === produto.nome);

                    if (mesmoProduto) {
                        disponivel += numeroFuncionario(mov.quantidade);
                    }
                }

                if (qtd > disponivel) {
                    alert(`Quantidade indisponível. Disponível para este produto: ${disponivel}.`);
                    return;
                }
            }

            const registro = mov || { id:idUniformeEPI('uni-mov') };
            registro.dataRetirada = document.getElementById('uni-mov-data')?.value || dataHojeFuncionario();
            registro.funcionarioId = funcionario?.id || mov?.funcionarioId || '';
            registro.funcionarioNome = funcionarioNome;
            registro.produtoId = produto.id;
            registro.produtoNome = produto.nome;
            registro.quantidade = qtd;
            registro.estadoProduto = estadoProduto;
            registro.motivo = document.getElementById('uni-mov-motivo')?.value.trim() || '';
            registro.status = status;
            registro.dataDevolucao = status === 'Devolvido' ? (document.getElementById('uni-mov-devolucao')?.value || dataHojeFuncionario()) : '';
            registro.situacao = status === 'Devolvido' ? (document.getElementById('uni-mov-situacao')?.value || '') : '';

            if (!mov) {
                estrutura.movimentacoes.push(registro);
            }

            await save();
            abrirUniformesEPIFuncionario();
            window.abaUniformesEPIAtual = 'movimentacoes';
            renderUniformesEPI();
        }
    });

    atualizarCamposDevolucaoUniformeEPI();
}


/* --------------------------------------------------------- */
/* atualizarCamposDevolucaoUniformeEPI                       */
/* Habilita os campos de devolução conforme o status.        */
/* --------------------------------------------------------- */

window.atualizarCamposDevolucaoUniformeEPI = function () {
    const devolvido = document.getElementById('uni-mov-status')?.value === 'Devolvido';
    const data = document.getElementById('uni-mov-devolucao');
    const situacao = document.getElementById('uni-mov-situacao');

    if (data) data.disabled = !devolvido;
    if (situacao) situacao.disabled = !devolvido;
};


/* --------------------------------------------------------- */
/* devolverMovimentacaoUniformeEPI                           */
/* Atalho para registrar a devolução de um item pendente.    */
/* --------------------------------------------------------- */

window.devolverMovimentacaoUniformeEPI = function (id) {
    const mov = garantirEstruturaUniformesEPI().movimentacoes.find(m => m.id === id);
    if (!mov) return;
    mov.status = 'Devolvido';
    mov.dataDevolucao = mov.dataDevolucao || dataHojeFuncionario();
    abrirFormularioMovimentacaoUniformeEPI(mov);
};


/* --------------------------------------------------------- */
/* excluirMovimentacaoUniformeEPI                            */
/* Remove uma movimentação e recalcula o disponível.         */
/* --------------------------------------------------------- */

window.excluirMovimentacaoUniformeEPI = async function (id) {
    if (!confirm('Deseja excluir esta movimentação?')) return;

    const estrutura = garantirEstruturaUniformesEPI();
    estrutura.movimentacoes = estrutura.movimentacoes.filter(m => m.id !== id);
    await save();
    renderUniformesEPI();
};
