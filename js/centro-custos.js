/* ========================================================= */
/* DOMINUS ERP - CENTRO-CUSTOS.JS                            */
/* ========================================================= */
/*
    CENTRO DE CUSTOS E PARÂMETROS DE PRECIFICAÇÃO

    Este arquivo controla a tela de Centro de Custos e os
    cadastros utilizados na formação de preço dos orçamentos.

    PRINCIPAIS RESPONSABILIDADES:
    1. Garantir a estrutura do Centro de Custos no banco
    2. Gerar IDs para novos registros
    3. Converter números e formatar valores
    4. Proteger textos exibidos no HTML
    5. Exibir status de registros ativos/inativos
    6. Renderizar a tela completa do Centro de Custos
    7. Editar o endereço de origem
    8. Cadastrar, editar e excluir combustíveis
    9. Cadastrar, editar e excluir veículos
    10. Cadastrar, editar e excluir equipamentos
    11. Configurar parâmetros de mão de obra
    12. Configurar parâmetros de precificação
    13. Salvar alterações no banco
    14. Registrar a página "centro-custos" no sistema

    IMPORTANTE:
    Apenas comentários e organização visual foram alterados.
    Nenhuma regra, valor, validação, campo ou lógica foi modificada.
*/


/* ========================================================= */
/* 01. CENTRO DE CUSTOS                                     */
/* ========================================================= */
/*
    Arquivo responsável pelos parâmetros fixos usados
    na formação de preço dos orçamentos.
*/

/* ========================================================= */
/* 02. FUNÇÕES AUXILIARES / HELPERS                         */
/* ========================================================= */
/*
    Funções reutilizadas nesta tela para:
    - garantir a estrutura do banco
    - gerar IDs
    - converter números
    - formatar moeda
    - escapar HTML
    - montar status
    - traduzir tipo de cobrança de equipamento
    - salvar e atualizar a tela
*/

/* --------------------------------------------------------- */
/* garantirCentroCustosCC */
/* Garante que window.db.centroCustos exista e esteja normalizado. */
/* --------------------------------------------------------- */

function garantirCentroCustosCC() {

    if (
        typeof window.normalizarCentroCustos === 'function'
    ) {

        window.db.centroCustos =
            window.normalizarCentroCustos(
                window.db.centroCustos || {}
            );

        return window.db.centroCustos;
    }

    window.db.centroCustos =
        window.db.centroCustos || {
            enderecoOrigem: {},
            combustiveis: [],
            veiculos: [],
            equipamentos: [],
            maoDeObra: {
                horasMensais: 220,
                encargosPercentual: 0
            },
            parametros: {
                desperdicioPercentual: 0,
                administrativoPercentual: 0,
                margemLucroPercentual: 0,
                metodoMargem: 'acrescimo'
            }
        };

    return window.db.centroCustos;
}

/* --------------------------------------------------------- */
/* idNovoCC */
/* Gera um identificador numérico para novos registros do Centro de Custos. */
/* --------------------------------------------------------- */

function idNovoCC() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/* --------------------------------------------------------- */
/* numeroCC */
/* Converte valores digitados em número seguro, aceitando vírgula decimal. */
/* --------------------------------------------------------- */

function numeroCC(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 0;
    }

    const convertido =
        Number(
            String(valor)
                .replace(',', '.')
        );

    return Number.isFinite(convertido)
        ? convertido
        : 0;
}

/* --------------------------------------------------------- */
/* moedaCC */
/* Formata valores monetários no padrão brasileiro. */
/* --------------------------------------------------------- */

function moedaCC(valor) {

    return new Intl.NumberFormat(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    ).format(
        numeroCC(valor)
    );
}

/* --------------------------------------------------------- */
/* escaparHtmlCC */
/* Escapa caracteres especiais antes de inserir texto no HTML. */
/* --------------------------------------------------------- */

function escaparHtmlCC(valor) {

    return String(
        valor ?? ''
    )
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* --------------------------------------------------------- */
/* statusCC */
/* Retorna o selo visual de status Ativo ou Inativo. */
/* --------------------------------------------------------- */

function statusCC(ativo) {

    if (ativo !== false) {

        return `
            <span style="
                display:inline-block;
                background:#16a34a;
                color:#fff;
                padding:5px 10px;
                border-radius:999px;
                font-size:12px;
                font-weight:700;
                white-space:nowrap;
            ">
                Ativo
            </span>
        `;
    }

    return `
        <span style="
            display:inline-block;
            background:#6b7280;
            color:#fff;
            padding:5px 10px;
            border-radius:999px;
            font-size:12px;
            font-weight:700;
            white-space:nowrap;
        ">
            Inativo
        </span>
    `;
}

/* --------------------------------------------------------- */
/* tipoEquipamentoLabelCC */
/* Traduz o tipo interno de cálculo do equipamento para um rótulo amigável. */
/* --------------------------------------------------------- */

function tipoEquipamentoLabelCC(tipo) {

    const mapa = {
        hora: 'Por hora',
        dia: 'Por dia',
        utilizacao: 'Por utilização'
    };

    return mapa[tipo] || '-';
}

/* --------------------------------------------------------- */
/* salvarCentroCustosCC */
/* Salva o banco, fecha o modal e atualiza a tela Centro de Custos. */
/* --------------------------------------------------------- */

async function salvarCentroCustosCC() {

    await save();

    closeModal();

    await navigate(
        'centro-custos',
        false
    );
}

/* ========================================================= */
/* 03. RENDERIZAÇÃO DA TELA                                 */
/* ========================================================= */
/*
    renderCentroCustos()

    Monta toda a tela do Centro de Custos.

    Exibe:
    - endereço de origem
    - mão de obra
    - combustíveis
    - veículos
    - equipamentos próprios
    - parâmetros de precificação
*/

/* --------------------------------------------------------- */
/* renderCentroCustos */
/* Renderiza os cards, tabelas e parâmetros da página. */
/* --------------------------------------------------------- */

window.renderCentroCustos = function () {

    const cc =
        garantirCentroCustosCC();

    const endereco =
        cc.enderecoOrigem || {};

    const maoDeObra =
        cc.maoDeObra || {};

    const parametros =
        cc.parametros || {};

    const combustiveis =
        Array.isArray(cc.combustiveis)
            ? cc.combustiveis
            : [];

    const veiculos =
        Array.isArray(cc.veiculos)
            ? cc.veiculos
            : [];

    const equipamentos =
        Array.isArray(cc.equipamentos)
            ? cc.equipamentos
            : [];

    const enderecoTexto = [
        endereco.logradouro,
        endereco.numero
    ]
    .filter(Boolean)
    .join(', ');

    const cidadeTexto = [
        endereco.bairro,
        endereco.cidade,
        endereco.uf
    ]
    .filter(Boolean)
    .join(' - ');

    const metodoTexto =
        parametros.metodoMargem === 'margem'
            ? 'Margem sobre preço de venda'
            : 'Acréscimo sobre o custo';

    const combustiveisHTML =
        combustiveis.length
        ? combustiveis.map(item => `

            <tr>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    <strong>${escaparHtmlCC(item.nome || '-')}</strong>
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${moedaCC(item.valorLitro)} / L
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${statusCC(item.ativo)}
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">

                    <div style="display:flex;gap:7px;flex-wrap:nowrap;">

                        <button
                            class="btn-action"
                            style="background:#2563eb;"
                            onclick="abrirModalCombustivelCC('${item.id}')">
                            Editar
                        </button>

                        <button
                            class="btn-action"
                            style="background:#dc2626;"
                            onclick="excluirCombustivelCC('${item.id}')">
                            Excluir
                        </button>

                    </div>

                </td>

            </tr>

        `).join('')
        : `
            <tr>
                <td colspan="4" style="
                    padding:24px;
                    text-align:center;
                    color:#6b7280;
                ">
                    Nenhum combustível cadastrado.
                </td>
            </tr>
        `;

    const veiculosHTML =
        veiculos.length
        ? veiculos.map(item => {

            const combustivel =
                combustiveis.find(
                    c => String(c.id) === String(item.combustivelId)
                );

            return `

                <tr>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                        <strong>${escaparHtmlCC(item.nome || '-')}</strong>
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                        ${escaparHtmlCC(item.placa || '-')}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                        ${escaparHtmlCC(combustivel?.nome || 'Não informado')}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                        ${numeroCC(item.consumoKmLitro)} km/L
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                        ${moedaCC(item.custoOperacionalKm)} / km
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                        ${statusCC(item.ativo)}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">

                        <div style="display:flex;gap:7px;flex-wrap:nowrap;">

                            <button
                                class="btn-action"
                                style="background:#2563eb;"
                                onclick="abrirModalVeiculoCC('${item.id}')">
                                Editar
                            </button>

                            <button
                                class="btn-action"
                                style="background:#dc2626;"
                                onclick="excluirVeiculoCC('${item.id}')">
                                Excluir
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join('')
        : `
            <tr>
                <td colspan="7" style="
                    padding:24px;
                    text-align:center;
                    color:#6b7280;
                ">
                    Nenhum veículo cadastrado.
                </td>
            </tr>
        `;

    const equipamentosHTML =
        equipamentos.length
        ? equipamentos.map(item => `

            <tr>
                            <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    <strong>${escaparHtmlCC(item.nome || '-')}</strong>
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${tipoEquipamentoLabelCC(item.tipoCalculo)}
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${moedaCC(item.valor)}
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
                    ${statusCC(item.ativo)}
                </td>

                <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">

                    <div style="display:flex;gap:7px;flex-wrap:nowrap;">

                        <button
                            class="btn-action"
                            style="background:#2563eb;"
                            onclick="abrirModalEquipamentoCC('${item.id}')">
                            Editar
                        </button>

                        <button
                            class="btn-action"
                            style="background:#dc2626;"
                            onclick="excluirEquipamentoCC('${item.id}')">
                            Excluir
                        </button>

                    </div>

                </td>

            </tr>

        `).join('')
        : `
            <tr>
                <td colspan="5" style="
                    padding:24px;
                    text-align:center;
                    color:#6b7280;
                ">
                    Nenhum equipamento cadastrado.
                </td>
            </tr>
        `;

    return `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <!-- 03.1 CABEÇALHO DA PÁGINA -->

    <div class="content-card" style="padding:24px;">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:20px;
            flex-wrap:wrap;
        ">

            <div>

                <h1 style="
                    margin:0 0 8px 0;
                    font-size:28px;
                ">
                    🧮 Centro de Custos
                </h1>

                <div style="
                    color:#6b7280;
                    line-height:1.5;
                ">
                    Parâmetros fixos usados na formação de preço dos orçamentos.
                    Altere apenas quando houver mudança real de custo.
                </div>

            </div>

        </div>

    </div>

    <!-- 03.2 ENDEREÇO + MÃO DE OBRA -->

    <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(340px,1fr));
        gap:20px;
    ">

        <!-- 03.2.1 CARD - ENDEREÇO DE ORIGEM -->

        <div class="content-card" style="padding:24px;">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                margin-bottom:18px;
            ">

                <div style="font-size:18px;font-weight:800;">
                    📍 Endereço de Origem
                </div>

                <button
                    class="btn-action"
                    style="background:#2563eb;"
                    onclick="abrirModalEnderecoCC()">
                    Editar
                </button>

            </div>

            <div style="
                background:#f8fafc;
                border:1px solid #e5e7eb;
                border-radius:12px;
                padding:18px;
                line-height:1.7;
            ">

                <div style="font-weight:700;">
                    ${escaparHtmlCC(enderecoTexto || '-')}
                </div>

                <div>
                    ${escaparHtmlCC(cidadeTexto || '-')}
                </div>

                <div>
                    CEP ${escaparHtmlCC(endereco.cep || '-')}
                </div>

            </div>

            <div style="
                margin-top:12px;
                font-size:12px;
                color:#6b7280;
            ">
                Este endereço será usado como ponto de partida para cálculo de deslocamento.
            </div>

        </div>

        <!-- 03.2.2 CARD - MÃO DE OBRA -->

        <div class="content-card" style="padding:24px;">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                margin-bottom:18px;
            ">

                <div style="font-size:18px;font-weight:800;">
                    👷 Mão de Obra
                </div>

                <button
                    class="btn-action"
                    style="background:#2563eb;"
                    onclick="abrirModalMaoDeObraCC()">
                    Editar
                </button>

            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(140px,1fr));
                gap:12px;
            ">

                <div style="
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                    padding:16px;
                ">
                    <div style="font-size:12px;color:#6b7280;">
                        Base mensal
                    </div>
                    <div style="font-size:22px;font-weight:800;margin-top:4px;">
                        ${numeroCC(maoDeObra.horasMensais)} h
                    </div>
                </div>

                <div style="
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                    padding:16px;
                ">
                    <div style="font-size:12px;color:#6b7280;">
                        Encargos
                    </div>
                    <div style="font-size:22px;font-weight:800;margin-top:4px;">
                        ${numeroCC(maoDeObra.encargosPercentual)}%
                    </div>
                </div>

            </div>

            <div style="
                margin-top:12px;
                font-size:12px;
                color:#6b7280;
            ">
                O salário de cada funcionário continuará vindo do cadastro de Funcionários.
            </div>

        </div>

    </div>

    <!-- 03.3 TABELA - COMBUSTÍVEIS -->

    <div class="content-card" style="padding:24px;">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
            margin-bottom:18px;
        ">

            <div>
                <div style="font-size:18px;font-weight:800;">
                    ⛽ Combustíveis
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                    Cadastre o valor atual por litro.
                </div>
            </div>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirModalCombustivelCC()">
                + Novo Combustível
            </button>

        </div>

        <div style="overflow-x:auto;">

            <table style="width:100%;border-collapse:collapse;">

                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:12px;text-align:left;">Combustível</th>
                        <th style="padding:12px;text-align:left;">Valor por Litro</th>
                        <th style="padding:12px;text-align:left;">Status</th>
                        <th style="padding:12px;text-align:left;">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    ${combustiveisHTML}
                </tbody>

            </table>

        </div>

    </div>

    <!-- 03.4 TABELA - VEÍCULOS -->

    <div class="content-card" style="padding:24px;">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
            margin-bottom:18px;
        ">

            <div>
                <div style="font-size:18px;font-weight:800;">
                    🚚 Veículos
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                    Consumo médio e custo operacional usado no deslocamento.
                </div>
            </div>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirModalVeiculoCC()">
                + Novo Veículo
            </button>

        </div>

        <div style="overflow-x:auto;">

            <table style="width:100%;border-collapse:collapse;">

                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:12px;text-align:left;">Veículo</th>
                        <th style="padding:12px;text-align:left;">Placa</th>
                        <th style="padding:12px;text-align:left;">Combustível</th>
                        <th style="padding:12px;text-align:left;">Consumo</th>
                        <th style="padding:12px;text-align:left;">Custo Operacional</th>
                        <th style="padding:12px;text-align:left;">Status</th>
                        <th style="padding:12px;text-align:left;">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    ${veiculosHTML}
                </tbody>
                    </table>

        </div>

    </div>

    <!-- 03.5 TABELA - EQUIPAMENTOS -->

    <div class="content-card" style="padding:24px;">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
            margin-bottom:18px;
        ">

            <div>
                <div style="font-size:18px;font-weight:800;">
                    🏭 Equipamentos Próprios
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                    Valor interno de uso de máquinas e equipamentos da empresa.
                </div>
            </div>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirModalEquipamentoCC()">
                + Novo Equipamento
            </button>

        </div>

        <div style="overflow-x:auto;">

            <table style="width:100%;border-collapse:collapse;">

                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:12px;text-align:left;">Equipamento</th>
                        <th style="padding:12px;text-align:left;">Cobrança</th>
                        <th style="padding:12px;text-align:left;">Valor</th>
                        <th style="padding:12px;text-align:left;">Status</th>
                        <th style="padding:12px;text-align:left;">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    ${equipamentosHTML}
                </tbody>

            </table>

        </div>

    </div>

    <!-- 03.6 PARÂMETROS DE PRECIFICAÇÃO -->

    <div class="content-card" style="padding:24px;">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
            margin-bottom:18px;
        ">

            <div>
                <div style="font-size:18px;font-weight:800;">
                    📊 Parâmetros de Precificação
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                    Percentuais padrão utilizados na formação do preço sugerido.
                </div>
            </div>

            <button
                class="btn-action"
                style="background:#2563eb;"
                onclick="abrirModalParametrosCC()">
                Editar
            </button>

        </div>

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
            gap:12px;
        ">

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <div style="font-size:12px;color:#6b7280;">Desperdício</div>
                <div style="font-size:22px;font-weight:800;margin-top:4px;">
                    ${numeroCC(parametros.desperdicioPercentual)}%
                </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <div style="font-size:12px;color:#6b7280;">Administrativo</div>
                <div style="font-size:22px;font-weight:800;margin-top:4px;">
                    ${numeroCC(parametros.administrativoPercentual)}%
                </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <div style="font-size:12px;color:#6b7280;">Margem / Acréscimo</div>
                <div style="font-size:22px;font-weight:800;margin-top:4px;">
                    ${numeroCC(parametros.margemLucroPercentual)}%
                </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <div style="font-size:12px;color:#6b7280;">Método</div>
                <div style="font-size:15px;font-weight:800;margin-top:7px;line-height:1.35;">
                    ${metodoTexto}
                </div>
            </div>

        </div>

    </div>

</div>

    `;
};

/* ========================================================= */
/* 04. ENDEREÇO DE ORIGEM                                   */
/* ========================================================= */
/*
    Permite editar o endereço utilizado como ponto
    inicial dos cálculos de deslocamento.
*/

/* --------------------------------------------------------- */
/* abrirModalEnderecoCC */
/* Abre o formulário de edição do endereço de origem. */
/* --------------------------------------------------------- */

window.abrirModalEnderecoCC = function () {

    const cc =
        garantirCentroCustosCC();

    const e =
        cc.enderecoOrigem || {};

    configModal({

        title: 'Editar Endereço de Origem',

        confirmText: 'Salvar Endereço',

        body: `

            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:14px;
            ">

                <div style="grid-column:1 / -1;">
                    <label>Logradouro</label>
                    <input
                        id="cc-end-logradouro"
                        value="${escaparHtmlCC(e.logradouro || '')}">
                </div>

                <div>
                    <label>Número</label>
                    <input
                        id="cc-end-numero"
                        value="${escaparHtmlCC(e.numero || '')}">
                </div>

                <div>
                    <label>Bairro</label>
                    <input
                        id="cc-end-bairro"
                        value="${escaparHtmlCC(e.bairro || '')}">
                </div>

                <div>
                    <label>Cidade</label>
                    <input
                        id="cc-end-cidade"
                        value="${escaparHtmlCC(e.cidade || '')}">
                </div>

                <div>
                    <label>UF</label>
                    <input
                        id="cc-end-uf"
                        maxlength="2"
                        value="${escaparHtmlCC(e.uf || '')}">
                </div>

                <div style="grid-column:1 / -1;">
                    <label>CEP</label>
                    <input
                        id="cc-end-cep"
                        value="${escaparHtmlCC(e.cep || '')}">
                </div>

            </div>
        `,

        onConfirm: async function () {

            const logradouro =
                document.getElementById('cc-end-logradouro').value.trim();

            const numero =
                document.getElementById('cc-end-numero').value.trim();

            const bairro =
                document.getElementById('cc-end-bairro').value.trim();

            const cidade =
                document.getElementById('cc-end-cidade').value.trim();

            const uf =
                document.getElementById('cc-end-uf').value.trim().toUpperCase();

            const cep =
                document.getElementById('cc-end-cep').value.trim();

            if (!logradouro || !cidade) {
                alert('Preencha pelo menos Logradouro e Cidade.');
                return;
            }

            cc.enderecoOrigem = {
                logradouro,
                numero,
                bairro,
                cidade,
                uf,
                cep
            };

            await salvarCentroCustosCC();
        }

    });
};

/* ========================================================= */
/* 05. COMBUSTÍVEIS                                         */
/* ========================================================= */
/*
    Cadastro de combustíveis usados pelos veículos.

    Cada registro pode armazenar:
    - nome
    - valor por litro
    - status ativo/inativo
*/

/* --------------------------------------------------------- */
/* abrirModalCombustivelCC */
/* Abre o formulário de cadastro ou edição de combustível. */
/* --------------------------------------------------------- */

window.abrirModalCombustivelCC = function (id = null) {

    const cc =
        garantirCentroCustosCC();

    const existente =
        id !== null
        ? cc.combustiveis.find(
            item => String(item.id) === String(id)
        )
        : null;

    configModal({

        title:
            existente
                ? 'Editar Combustível'
                : 'Novo Combustível',

        confirmText: 'Salvar',

        body: `

            <label>Nome do Combustível</label>
            <input
                id="cc-comb-nome"
                placeholder="Ex.: Gasolina"
                value="${escaparHtmlCC(existente?.nome || '')}">

            <label>Valor por Litro (R$)</label>
            <input
                id="cc-comb-valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value="${existente?.valorLitro ?? ''}">

            <label style="
                display:flex;
                align-items:center;
                gap:8px;
                margin-top:16px;
            ">
                <input
                    id="cc-comb-ativo"
                    type="checkbox"
                    style="width:auto;"
                    ${existente?.ativo === false ? '' : 'checked'}>
                Combustível ativo
            </label>
        `,

        onConfirm: async function () {

            const nome =
                document.getElementById('cc-comb-nome').value.trim();

            const valorLitro =
                numeroCC(
                    document.getElementById('cc-comb-valor').value
                );

            const ativo =
                document.getElementById('cc-comb-ativo').checked;

            if (!nome) {
                alert('Informe o nome do combustível.');
                return;
            }

            if (valorLitro <= 0) {
                alert('Informe um valor por litro maior que zero.');
                return;
            }

            if (existente) {

                existente.nome = nome;
                existente.valorLitro = valorLitro;
                existente.ativo = ativo;

            } else {

                cc.combustiveis.push({
                    id: idNovoCC(),
                    nome,
                    valorLitro,
                    ativo
                                    });

            }

            await salvarCentroCustosCC();
        }

    });
};

/* --------------------------------------------------------- */
/* excluirCombustivelCC */
/* Exclui combustível somente quando não estiver vinculado a veículo. */
/* --------------------------------------------------------- */

window.excluirCombustivelCC = async function (id) {

    const cc =
        garantirCentroCustosCC();

    const emUso =
        cc.veiculos.some(
            v => String(v.combustivelId) === String(id)
        );

    if (emUso) {

        alert(
            'Este combustível está vinculado a um veículo.\n\n' +
            'Altere ou exclua o veículo antes de excluir o combustível.'
        );

        return;
    }

    if (!confirm('Deseja excluir este combustível?')) {
        return;
    }

    cc.combustiveis =
        cc.combustiveis.filter(
            item => String(item.id) !== String(id)
        );

    await save();

    await navigate(
        'centro-custos',
        false
    );
};

/* ========================================================= */
/* 06. VEÍCULOS                                             */
/* ========================================================= */
/*
    Cadastro de veículos usados nos cálculos de deslocamento.

    Cada veículo pode guardar:
    - nome
    - placa
    - combustível
    - consumo médio em km/L
    - custo operacional por km
    - status ativo/inativo
*/

/* --------------------------------------------------------- */
/* abrirModalVeiculoCC */
/* Abre o formulário de cadastro ou edição de veículo. */
/* --------------------------------------------------------- */

window.abrirModalVeiculoCC = function (id = null) {

    const cc =
        garantirCentroCustosCC();

    if (!cc.combustiveis.length) {

        alert(
            'Cadastre pelo menos um combustível antes de cadastrar um veículo.'
        );

        return;
    }

    const existente =
        id !== null
        ? cc.veiculos.find(
            item => String(item.id) === String(id)
        )
        : null;

    const optionsCombustivel =
        cc.combustiveis.map(c => `
            <option
                value="${c.id}"
                ${
                    String(existente?.combustivelId || '') === String(c.id)
                        ? 'selected'
                        : ''
                }>
                ${escaparHtmlCC(c.nome)}${c.ativo === false ? ' (Inativo)' : ''}
            </option>
        `).join('');

    configModal({

        title:
            existente
                ? 'Editar Veículo'
                : 'Novo Veículo',

        confirmText: 'Salvar',

        body: `

            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:14px;
            ">

                <div style="grid-column:1 / -1;">
                    <label>Nome / Identificação do Veículo</label>
                    <input
                        id="cc-vei-nome"
                        placeholder="Ex.: Fiorino"
                        value="${escaparHtmlCC(existente?.nome || '')}">
                </div>

                <div>
                    <label>Placa</label>
                    <input
                        id="cc-vei-placa"
                        placeholder="ABC1D23"
                        value="${escaparHtmlCC(existente?.placa || '')}">
                </div>

                <div>
                    <label>Combustível</label>
                    <select id="cc-vei-combustivel">
                        <option value="">Selecione</option>
                        ${optionsCombustivel}
                    </select>
                </div>

                <div>
                    <label>Consumo Médio (km/L)</label>
                    <input
                        id="cc-vei-consumo"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex.: 10"
                        value="${existente?.consumoKmLitro ?? ''}">
                </div>

                <div>
                    <label>Custo Operacional por km (R$)</label>
                    <input
                        id="cc-vei-custo-km"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex.: 0.30"
                        value="${existente?.custoOperacionalKm ?? ''}">
                </div>

                <div style="grid-column:1 / -1;">
                    <label style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                    ">
                        <input
                            id="cc-vei-ativo"
                            type="checkbox"
                            style="width:auto;"
                            ${existente?.ativo === false ? '' : 'checked'}>
                        Veículo ativo
                    </label>
                </div>

            </div>

            <div style="
                margin-top:16px;
                padding:12px;
                background:#f8fafc;
                border:1px solid #e5e7eb;
                border-radius:10px;
                color:#6b7280;
                font-size:12px;
                line-height:1.5;
            ">
                O custo operacional por km pode representar manutenção,
                pneus, óleo, depreciação e outros custos do veículo.
                O combustível será calculado separadamente.
            </div>
        `,

        onConfirm: async function () {

            const nome =
                document.getElementById('cc-vei-nome').value.trim();

            const placa =
                document.getElementById('cc-vei-placa').value.trim().toUpperCase();

            const combustivelId =
                document.getElementById('cc-vei-combustivel').value;

            const consumoKmLitro =
                numeroCC(
                    document.getElementById('cc-vei-consumo').value
                );

            const custoOperacionalKm =
                numeroCC(
                    document.getElementById('cc-vei-custo-km').value
                );

            const ativo =
                document.getElementById('cc-vei-ativo').checked;

            if (!nome) {
                alert('Informe o nome do veículo.');
                return;
            }

            if (!combustivelId) {
                alert('Selecione o combustível.');
                return;
            }

            if (consumoKmLitro <= 0) {
                alert('Informe um consumo médio maior que zero.');
                return;
            }

            if (custoOperacionalKm < 0) {
                alert('O custo operacional por km não pode ser negativo.');
                return;
            }

            if (existente) {

                existente.nome = nome;
                existente.placa = placa;
                existente.combustivelId = combustivelId;
                existente.consumoKmLitro = consumoKmLitro;
                existente.custoOperacionalKm = custoOperacionalKm;
                existente.ativo = ativo;

            } else {

                cc.veiculos.push({
                    id: idNovoCC(),
                    nome,
                    placa,
                    combustivelId,
                    consumoKmLitro,
                    custoOperacionalKm,
                    ativo
                });

            }

            await salvarCentroCustosCC();
        }

    });
};

/* --------------------------------------------------------- */
/* excluirVeiculoCC */
/* Exclui um veículo após confirmação. */
/* --------------------------------------------------------- */

window.excluirVeiculoCC = async function (id) {

    const cc =
        garantirCentroCustosCC();

    if (!confirm('Deseja excluir este veículo?')) {
        return;
    }

    cc.veiculos =
        cc.veiculos.filter(
            item => String(item.id) !== String(id)
        );

    await save();

    await navigate(
        'centro-custos',
        false
    );
};

/* ========================================================= */
/* 07. EQUIPAMENTOS PRÓPRIOS                                */
/* ========================================================= */
/*
    Cadastro de máquinas e equipamentos utilizados
    na execução dos serviços.

    O custo pode ser configurado:
    - por hora
    - por dia
    - por utilização
*/

/* --------------------------------------------------------- */
/* abrirModalEquipamentoCC */
/* Abre o formulário de cadastro ou edição de equipamento. */
/* --------------------------------------------------------- */

window.abrirModalEquipamentoCC = function (id = null) {

    const cc =
        garantirCentroCustosCC();

    const existente =
        id !== null
        ? cc.equipamentos.find(
            item => String(item.id) === String(id)
        )
        : null;

    configModal({

        title:
            existente
                ? 'Editar Equipamento'
                : 'Novo Equipamento',

        confirmText: 'Salvar',

        body: `

            <label>Nome do Equipamento</label>
            <input
                id="cc-eqp-nome"
                placeholder="Ex.: CNC"
                value="${escaparHtmlCC(existente?.nome || '')}">

            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:14px;
            ">

                <div>
                    <label>Forma de Cálculo</label>
                    <select id="cc-eqp-tipo">
                        <option value="hora" ${existente?.tipoCalculo === 'hora' ? 'selected' : ''}>
                            Por hora
                        </option>
                        <option value="dia" ${existente?.tipoCalculo === 'dia' ? 'selected' : ''}>
                            Por dia
                        </option>
                        <option value="utilizacao" ${existente?.tipoCalculo === 'utilizacao' ? 'selected' : ''}>
                            Por utilização
                        </option>
                    </select>
                </div>

                <div>
                    <label>Valor (R$)</label>
                    <input
                        id="cc-eqp-valor"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value="${existente?.valor ?? ''}">
                </div>
                        </div>

            <label>Observações</label>
            <textarea
                id="cc-eqp-obs"
                rows="3"
                placeholder="Opcional">${escaparHtmlCC(existente?.observacoes || '')}</textarea>

            <label style="
                display:flex;
                align-items:center;
                gap:8px;
                margin-top:16px;
            ">
                <input
                    id="cc-eqp-ativo"
                    type="checkbox"
                    style="width:auto;"
                    ${existente?.ativo === false ? '' : 'checked'}>
                Equipamento ativo
            </label>
        `,

        onConfirm: async function () {

            const nome =
                document.getElementById('cc-eqp-nome').value.trim();

            const tipoCalculo =
                document.getElementById('cc-eqp-tipo').value;

            const valor =
                numeroCC(
                    document.getElementById('cc-eqp-valor').value
                );

            const observacoes =
                document.getElementById('cc-eqp-obs').value.trim();

            const ativo =
                document.getElementById('cc-eqp-ativo').checked;

            if (!nome) {
                alert('Informe o nome do equipamento.');
                return;
            }

            if (valor < 0) {
                alert('O valor não pode ser negativo.');
                return;
            }

            if (existente) {

                existente.nome = nome;
                existente.tipoCalculo = tipoCalculo;
                existente.valor = valor;
                existente.observacoes = observacoes;
                existente.ativo = ativo;

            } else {

                cc.equipamentos.push({
                    id: idNovoCC(),
                    nome,
                    tipoCalculo,
                    valor,
                    ativo,
                    observacoes
                });

            }

            await salvarCentroCustosCC();
        }

    });
};

/* --------------------------------------------------------- */
/* excluirEquipamentoCC */
/* Exclui um equipamento após confirmação. */
/* --------------------------------------------------------- */

window.excluirEquipamentoCC = async function (id) {

    const cc =
        garantirCentroCustosCC();

    if (!confirm('Deseja excluir este equipamento?')) {
        return;
    }

    cc.equipamentos =
        cc.equipamentos.filter(
            item => String(item.id) !== String(id)
        );

    await save();

    await navigate(
        'centro-custos',
        false
    );
};

/* ========================================================= */
/* 08. PARÂMETROS DE MÃO DE OBRA                            */
/* ========================================================= */
/*
    Define:
    - horas mensais base
    - percentual de encargos

    O salário individual continua vindo do cadastro
    de Funcionários.
*/

/* --------------------------------------------------------- */
/* abrirModalMaoDeObraCC */
/* Abre os parâmetros de horas mensais e encargos. */
/* --------------------------------------------------------- */

window.abrirModalMaoDeObraCC = function () {

    const cc =
        garantirCentroCustosCC();

    const m =
        cc.maoDeObra || {};

    configModal({

        title: 'Parâmetros de Mão de Obra',

        confirmText: 'Salvar',

        body: `

            <label>Horas Mensais Base</label>
            <input
                id="cc-mao-horas"
                type="number"
                step="1"
                min="1"
                value="${m.horasMensais ?? 220}">

            <label>Encargos sobre Salário (%)</label>
            <input
                id="cc-mao-encargos"
                type="number"
                step="0.01"
                min="0"
                value="${m.encargosPercentual ?? 0}">

            <div style="
                margin-top:16px;
                padding:12px;
                background:#f8fafc;
                border:1px solid #e5e7eb;
                border-radius:10px;
                color:#6b7280;
                font-size:12px;
                line-height:1.5;
            ">
                Exemplo: salário ÷ horas mensais = custo base por hora.
                Depois o percentual de encargos será aplicado sobre esse custo.
            </div>
        `,

        onConfirm: async function () {

            const horasMensais =
                numeroCC(
                    document.getElementById('cc-mao-horas').value
                );

            const encargosPercentual =
                numeroCC(
                    document.getElementById('cc-mao-encargos').value
                );

            if (horasMensais <= 0) {
                alert('As horas mensais devem ser maiores que zero.');
                return;
            }

            if (encargosPercentual < 0) {
                alert('O percentual de encargos não pode ser negativo.');
                return;
            }

            cc.maoDeObra = {
                horasMensais,
                encargosPercentual
            };

            await salvarCentroCustosCC();
        }

    });
};

/* ========================================================= */
/* 09. PARÂMETROS DE PRECIFICAÇÃO                           */
/* ========================================================= */
/*
    Configura:
    - desperdício
    - custo administrativo
    - margem/acréscimo padrão
    - método de precificação
*/

/* --------------------------------------------------------- */
/* abrirModalParametrosCC */
/* Abre os parâmetros gerais de precificação. */
/* --------------------------------------------------------- */

window.abrirModalParametrosCC = function () {

    const cc =
        garantirCentroCustosCC();

    const p =
        cc.parametros || {};

    configModal({

        title: 'Parâmetros de Precificação',

        confirmText: 'Salvar',

        body: `

            <div style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:14px;
            ">

                <div>
                    <label>Desperdício (%)</label>
                    <input
                        id="cc-par-desperdicio"
                        type="number"
                        step="0.01"
                        min="0"
                        value="${p.desperdicioPercentual ?? 0}">
                </div>

                <div>
                    <label>Custo Administrativo (%)</label>
                    <input
                        id="cc-par-administrativo"
                        type="number"
                        step="0.01"
                        min="0"
                        value="${p.administrativoPercentual ?? 0}">
                </div>

                <div>
                    <label>Margem / Acréscimo Padrão (%)</label>
                    <input
                        id="cc-par-margem"
                        type="number"
                        step="0.01"
                        min="0"
                        value="${p.margemLucroPercentual ?? 0}">
                </div>

                <div>
                    <label>Método de Precificação</label>
                    <select id="cc-par-metodo">
                        <option
                            value="acrescimo"
                            ${p.metodoMargem !== 'margem' ? 'selected' : ''}>
                            Acréscimo sobre o custo
                        </option>
                        <option
                            value="margem"
                            ${p.metodoMargem === 'margem' ? 'selected' : ''}>
                            Margem sobre preço de venda
                        </option>
                    </select>
                </div>

            </div>

            <div style="
                margin-top:16px;
                padding:14px;
                background:#f8fafc;
                border:1px solid #e5e7eb;
                border-radius:10px;
                font-size:12px;
                color:#4b5563;
                line-height:1.6;
            ">
                <strong>Acréscimo sobre o custo:</strong>
                custo de R$ 1.000 + 35% = R$ 1.350.<br>

                <strong>Margem sobre preço de venda:</strong>
                custo de R$ 1.000 com margem real de 35% ≈ R$ 1.538,46.
            </div>
        `,

        onConfirm: async function () {

            const desperdicioPercentual =
                numeroCC(
                    document.getElementById('cc-par-desperdicio').value
                );

            const administrativoPercentual =
                numeroCC(
                    document.getElementById('cc-par-administrativo').value
                );

            const margemLucroPercentual =
                numeroCC(
                    document.getElementById('cc-par-margem').value
                );

            const metodoMargem =
                document.getElementById('cc-par-metodo').value;

            if (
                desperdicioPercentual < 0 ||
                administrativoPercentual < 0 ||
                margemLucroPercentual < 0
            ) {

                alert('Os percentuais não podem ser negativos.');
                return;
            }

            if (
                metodoMargem === 'margem' &&
                margemLucroPercentual >= 100
            ) {

                alert(
                    'Para margem sobre preço de venda, use um percentual menor que 100%.'
                );

                return;
            }

            cc.parametros = {
                desperdicioPercentual,
                administrativoPercentual,
                margemLucroPercentual,
                metodoMargem
            };

            await salvarCentroCustosCC();
        }

    });
};

/* ========================================================= */
/* 10. REGISTRAR PÁGINA NO SISTEMA                          */
/* ========================================================= */
/*
    Registra a tela com o nome:

        centro-custos

    Assim, navigate('centro-custos') consegue renderizar
    esta página dentro do view-port.
*/

registerPage(
    'centro-custos',
    renderCentroCustos
);