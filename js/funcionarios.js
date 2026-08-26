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
    8. Rescisão / acerto avulso
    9. Compatibilidade de status com férias agendadas
    10. Status visual dos funcionários

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    Nenhuma regra, cálculo, valor, validação, campo ou
    comportamento foi modificado.
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
/* 02.1 HELPERS DO PLANO DE CARREIRA                        */
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
/* 03. RENDERIZAÇÃO DA PÁGINA DE FUNCIONÁRIOS               */
/* ========================================================= */
/*
    Monta a tela principal com:
    - cadastro de cargos
    - novo funcionário
    - listagem de colaboradores
    - Ponto
    - Carreira
    - Férias
    - Rescisão
    - Editar
    - Excluir
*/

registerPage('funcionarios', function () {

    garantirCadastroCargosFuncionario();
    db.funcionarios.forEach(garantirEstruturaFuncionarioRH);

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
            : `
                <div style="overflow:auto;">
                    <table>

                        <thead>

                            <tr>

                                <th>Nome</th>
                                <th>Cargo</th>
                                <th>Status</th>
                                <th>Salário</th>
                                <th>Admissão</th>

                                <th style="
                                    text-align:right;
                                    min-width:560px;
                                ">
                                    Ações
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${db.funcionarios.map((f, index) => `

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
                                        text-align:right;
                                        white-space:nowrap;
                                    ">

                                        <div style="
                                            display:flex;
                                            justify-content:flex-end;
                                            gap:5px;
                                            flex-wrap:wrap;
                                        ">
                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 10px;
                                                    font-size:0.75rem;
                                                    background:#2563eb;
                                                "
                                                onclick="abrirPontoFuncionario(${index})">

                                                🕒 Ponto

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 10px;
                                                    font-size:0.75rem;
                                                    background:#0f766e;
                                                "
                                                onclick="abrirPlanoCarreira(${index})">

                                                📈 Carreira

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 10px;
                                                    font-size:0.75rem;
                                                    background:#7c3aed;
                                                "
                                                onclick="abrirFeriasFuncionario(${index})">

                                                🏖 Férias

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 10px;
                                                    font-size:0.75rem;
                                                    background:#be123c;
                                                "
                                                onclick="abrirRescisaoFuncionario(${index})">

                                                🧾 Rescisão

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 10px;
                                                    font-size:0.75rem;
                                                    background:#f59e0b;
                                                "
                                                onclick="editarFuncionario(${index})">

                                                ✏ Editar

                                            </button>

                                            <button
                                                class="btn-del"
                                                onclick="deleteItem('funcionarios', ${index})">

                                                Excluir

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `).join('')}

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
            navigate('funcionarios');
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

    const opcoesFuncionarios =
        db.funcionarios.map((func, idx) => `
            <option value="${idx}" ${idx === index ? 'selected' : ''}>
                ${escaparHTMLFuncionario(func.nome || `Funcionário ${idx + 1}`)}
            </option>
        `).join('');

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
