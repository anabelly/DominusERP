/* ========================= */
/* ESTOQUE */
/* ========================= */

window.renderEstoque = function () {

    if (!db.produtos) {
        db.produtos = [];
    }

    if (!db.tiposProduto) {
        db.tiposProduto = [];
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
                Controle de Estoque
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Gerenciamento de produtos
            </div>

        </div>

        <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        ">

            <button
                class="btn-action"
                onclick="abrirConsultaProduto()">

                🔍 Consultar Produto

            </button>

            <button
                class="btn-action"
                style="background:#2563eb;"
                onclick="importarXML()">

                📄 Importar XML

            </button>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirNovoProduto()">

                + Novo Produto

            </button>

        </div>

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
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Fornecedor</th>
                    <th>Valor</th>
                    <th>Quantidade</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>
`;

    if (db.produtos.length === 0) {

        html += `

<tr>

    <td colspan="7" style="
        text-align:center;
        padding:30px;
        color:#6b7280;
    ">

        Nenhum produto cadastrado

    </td>

</tr>
`;
    }

    db.produtos.forEach((produto, idx) => {

        html += `

<tr>

    <td>
        ${produto.codigo || '-'}
    </td>

    <td>
        ${produto.tipo || '-'}
    </td>

    <td>
        ${produto.descricao || '-'}
    </td>

    <td>
        ${produto.fornecedor || '-'}
    </td>

    <td>
        ${formatarMoeda(produto.valor || 0)}
    </td>

    <td>
        ${produto.quantidade || 0}
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
                "
                onclick="visualizarProduto(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="editarProduto(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="excluirProduto(${idx})">

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

/* ========================= */
/* NOVO PRODUTO */
/* ========================= */

window.abrirNovoProduto = function (dados = {}) {

    if (!db.produtos) {
        db.produtos = [];
    }

    if (!db.tiposProduto) {
        db.tiposProduto = [];
    }

    const proximoCodigo =
        db.produtos.length + 1;

    let optionsTipos = `
        <option value="">
            Selecione
        </option>
    `;

    db.tiposProduto.forEach(tipo => {

        optionsTipos += `
            <option
                value="${tipo}"
                ${dados.tipo === tipo ? 'selected' : ''}>

                ${tipo}

            </option>
        `;
    });

    const html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <div style="
        display:grid;
        grid-template-columns:
            repeat(auto-fit,minmax(220px,1fr));
        gap:15px;
    ">

        <!-- CÓDIGO -->

        <div>

            <label>
                Código
            </label>

            <input
                id="produto-codigo"
                value="${proximoCodigo}"
                disabled>

        </div>

        <!-- TIPO -->

        <div>

            <label>
                Tipo do Produto
            </label>

            <div style="
                display:flex;
                gap:10px;
            ">

                <select
                    id="produto-tipo"
                    style="flex:1;">

                    ${optionsTipos}

                </select>

                <button
                    class="btn-action"
                    type="button"
                    onclick="novoTipoProduto()">

                    +

                </button>

            </div>

        </div>

        <!-- DESCRIÇÃO -->

        <div>

            <label>
                Descrição
            </label>

            <input
                id="produto-descricao"
                value="${dados.descricao || ''}">

        </div>

        <!-- QUANTIDADE -->

        <div>

            <label>
                Quantidade
            </label>

            <input
                type="number"
                id="produto-quantidade"
                value="${dados.quantidade || 1}">

        </div>

        <!-- VALOR -->

        <div>

            <label>
                Valor Pago
            </label>

            <input
                type="number"
                step="0.01"
                id="produto-valor"
                value="${dados.valor || ''}">

        </div>

        <!-- FORNECEDOR -->

        <div>

            <label>
                Fornecedor
            </label>

            <select id="produto-fornecedor">

                <option value="">
                    Selecione
                </option>

                ${db.fornecedores.map(f => `

                    <option
                        value="${f.nome}"
                        ${dados.fornecedor === f.nome ? 'selected' : ''}>

                        ${f.nome}

                    </option>

                `).join('')}

            </select>

        </div>

    </div>

</div>
`;

    configModal({

        title: dados.importado
            ? 'Conferir Produto Importado'
            : 'Novo Produto',

        body: html,

        size: 'medium',

        confirmText: 'Salvar',

        onConfirm() {

            salvarNovoProduto();
        }
    });
};

/* ========================= */
/* SALVAR PRODUTO */
/* ========================= */

window.salvarNovoProduto = function () {

    const tipo =
        document.getElementById('produto-tipo').value;

    if (!tipo) {

        alert(
            'Selecione o tipo do produto.'
        );

        return;
    }

    const produto = {

        codigo:
            db.produtos.length + 1,

        tipo,

        descricao:
            document.getElementById('produto-descricao').value,

        quantidade:
            Number(
                document.getElementById('produto-quantidade').value
            ),

        valor:
            Number(
                document.getElementById('produto-valor').value
            ),

        fornecedor:
            document.getElementById('produto-fornecedor').value,

        dataCadastro:
            new Date().toISOString()
    };

    db.produtos.push(produto);

    save();

    closeModal();

    navigate('estoque');
};
/* ========================= */
/* NOVO TIPO PRODUTO */
/* ========================= */

window.novoTipoProduto = function () {

    const html = `

        <label>
            Nome do Tipo
        </label>

        <input
            id="novo-tipo-produto"
            placeholder="Ex: Matéria Prima">

    `;

    configModal({

        title: 'Novo Tipo de Produto',

        body: html,

        confirmText: 'Salvar',

        onConfirm() {

            const nome =

                document
                    .getElementById(
                        'novo-tipo-produto'
                    )
                    .value
                    .trim();

            if (!nome) {

                alert(
                    'Digite um nome.'
                );

                return;
            }

            if (

                !db.tiposProduto.includes(
                    nome
                )

            ) {

                db.tiposProduto.push(
                    nome
                );

                save();
            }

            closeModal();

            abrirNovoProduto({

                tipo: nome

            });
        }

    });

};
/* ========================= */
/* EXCLUIR */
/* ========================= */

window.excluirProduto = function (idx) {

    const confirmar =
        confirm(
            'Deseja excluir este produto?'
        );

    if (!confirmar) return;

    db.produtos.splice(idx, 1);

    save();

    navigate('estoque');
};

/* ========================= */
/* VISUALIZAR */
/* ========================= */

window.visualizarProduto = function (idx) {

    const produto =
        db.produtos[idx];

    abrirNovoProduto(produto);

    /* ========================= */
    /* ALTERAR TÍTULO */
    /* ========================= */

    const modalTitle =
        document.getElementById('modal-title');

    if (modalTitle) {

        modalTitle.innerText =
            'Visualizar Produto';
    }

    /* ========================= */
    /* DESABILITAR CAMPOS */
    /* ========================= */

    const campos = [

        'produto-tipo',
        'produto-descricao',
        'produto-quantidade',
        'produto-valor',
        'produto-fornecedor'
    ];

    campos.forEach(id => {

        const campo =
            document.getElementById(id);

        if (campo) {

            campo.disabled = true;
        }
    });

    /* ========================= */
    /* DESABILITAR BOTÃO + */
    /* ========================= */

    const btnNovoTipo =
        document.querySelector(
            '#produto-tipo'
        )?.parentElement
         ?.querySelector('button');

    if (btnNovoTipo) {

        btnNovoTipo.disabled = true;

        btnNovoTipo.style.opacity = '0.5';

        btnNovoTipo.style.cursor =
            'not-allowed';
    }

    /* ========================= */
    /* ALTERAR BOTÃO CONFIRMAR */
    /* ========================= */

    const btnConfirm =
        document.getElementById(
            'modal-confirm'
        );

    if (btnConfirm) {

        btnConfirm.innerText = 'Fechar';

        btnConfirm.onclick = () => {

            closeModal();
        };
    }
};
/* ========================= */
/* EDITAR */
/* ========================= */

window.editarProduto = function (idx) {

    const produto =
        db.produtos[idx];

    abrirNovoProduto(produto);

    document.getElementById('modal-confirm').onclick = () => {

        produto.tipo =
            document.getElementById('produto-tipo').value;

        produto.descricao =
            document.getElementById('produto-descricao').value;

        produto.quantidade =
            Number(
                document.getElementById('produto-quantidade').value
            );

        produto.valor =
            Number(
                document.getElementById('produto-valor').value
            );

        produto.fornecedor =
            document.getElementById('produto-fornecedor').value;

        save();

        closeModal();

        navigate('estoque');
    };
};

/* ========================= */
/* CONSULTA */
/* ========================= */

window.abrirConsultaProduto = function () {

    let optionsTipos = `
        <option value="">
            Todos
        </option>
    `;

    db.tiposProduto.forEach(tipo => {

        optionsTipos += `
            <option value="${tipo}">
                ${tipo}
            </option>
        `;
    });

    let optionsFornecedor = `
        <option value="">
            Todos
        </option>
    `;

    db.fornecedores.forEach(f => {

        optionsFornecedor += `
            <option value="${f.nome}">
                ${f.nome}
            </option>
        `;
    });

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
                Data Inicial
            </label>

            <input
                type="date"
                id="filtro-data-inicio">

        </div>

        <div>

            <label>
                Data Final
            </label>

            <input
                type="date"
                id="filtro-data-fim">

        </div>

        <div>

            <label>
                Fornecedor
            </label>

            <select id="filtro-fornecedor">

                ${optionsFornecedor}

            </select>

        </div>

        <div>

            <label>
                Tipo
            </label>

            <select id="filtro-tipo">

                ${optionsTipos}

            </select>

        </div>

        <div style="
            grid-column:span 2;
        ">

            <label>
                Buscar descrição
            </label>

            <input
                id="filtro-descricao"
                placeholder="Digite parte da descrição">

        </div>

    </div>

    <div style="
        display:flex;
        justify-content:flex-end;
    ">

        <button
            class="btn-action"
            onclick="filtrarProdutosConsulta()">

            🔍 Consultar

        </button>

    </div>

    <div id="resultado-consulta-produtos"></div>

</div>
`;

    configModal({

        title: 'Consultar Produtos',

        body: html,

        size: 'large',

        confirmText: 'Fechar',

        onConfirm() {
            closeModal();
        }
    });
};

/* ========================= */
/* FILTRAR CONSULTA */
/* ========================= */

window.filtrarProdutosConsulta = function () {

    const dataInicio =
        document.getElementById('filtro-data-inicio').value;

    const dataFim =
        document.getElementById('filtro-data-fim').value;

    const fornecedor =
        document.getElementById('filtro-fornecedor').value
            .toLowerCase();

    const tipo =
        document.getElementById('filtro-tipo').value
            .toLowerCase();

    const descricao =
        document.getElementById('filtro-descricao').value
            .toLowerCase();

    let produtos =
        [...db.produtos];

    /* ========================= */
    /* FILTRO DATA */
    /* ========================= */

    if (dataInicio) {

        produtos = produtos.filter(p => {

            if (!p.dataCadastro) return false;

            return (
                p.dataCadastro.split('T')[0] >=
                dataInicio
            );
        });
    }

    if (dataFim) {

        produtos = produtos.filter(p => {

            if (!p.dataCadastro) return false;

            return (
                p.dataCadastro.split('T')[0] <=
                dataFim
            );
        });
    }

    /* ========================= */
    /* FILTRO FORNECEDOR */
    /* ========================= */

    if (fornecedor) {

        produtos = produtos.filter(p =>

            (p.fornecedor || '')
                .toLowerCase()
                .includes(fornecedor)
        );
    }

    /* ========================= */
    /* FILTRO TIPO */
    /* ========================= */

    if (tipo) {

        produtos = produtos.filter(p =>

            (p.tipo || '')
                .toLowerCase()
                .includes(tipo)
        );
    }

    /* ========================= */
    /* FILTRO DESCRIÇÃO */
    /* ========================= */

    if (descricao) {

        produtos = produtos.filter(p =>

            (p.descricao || '')
                .toLowerCase()
                .includes(descricao)
        );
    }

    /* ========================= */
    /* RESULTADO */
    /* ========================= */

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
    <th>Tipo</th>
    <th>Descrição</th>
    <th>Fornecedor</th>
    <th>Valor</th>
    <th>Quantidade</th>
    <th>Ações</th>

</tr>

</thead>

<tbody>
`;

    if (produtos.length === 0) {

        html += `

<tr>

    <td colspan="7" style="
        text-align:center;
        padding:25px;
        color:#6b7280;
    ">

        Nenhum produto encontrado

    </td>

</tr>
`;
    }

    produtos.forEach(produto => {

        const idx =
            db.produtos.indexOf(produto);

        html += `

<tr>

    <td>
        ${produto.codigo || '-'}
    </td>

    <td>
        ${produto.tipo || '-'}
    </td>

    <td>
        ${produto.descricao || '-'}
    </td>

    <td>
        ${produto.fornecedor || '-'}
    </td>

    <td>
        ${formatarMoeda(produto.valor || 0)}
    </td>

    <td>
        ${produto.quantidade || 0}
    </td>

    <td>

        <div style="
    display:flex;
    gap:5px;
    justify-content:center;
    align-items:center;
    flex-wrap:nowrap;
    min-width:max-content;
">

            <button
                class="btn-action"
                style="
                    padding:5px 8px;
                    font-size:11px;
                "
                onclick="visualizarProduto(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:5px 8px;
                    font-size:11px;
                "
                onclick="editarProduto(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:5px 8px;
                    font-size:11px;
                "
                onclick="excluirProduto(${idx})">

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

    document.getElementById(
        'resultado-consulta-produtos'
    ).innerHTML = html;
};
/* ========================= */
/* IMPORTAR XML */
/* ========================= */

window.importarXML = function () {

    const input =
        document.createElement('input');

    input.type = 'file';

    input.accept = '.xml';

    input.onchange = function (e) {

        const arquivo =
            e.target.files[0];

        if (!arquivo) return;

        const reader =
            new FileReader();

        reader.onload = function (evento) {

            const xmlTexto =
                evento.target.result;

            const parser =
                new DOMParser();

            const xml =
                parser.parseFromString(
                    xmlTexto,
                    'text/xml'
                );

            processarXML(xml);
        };

        reader.readAsText(arquivo);
    };

    input.click();
};

/* ========================= */
/* PROCESSAR XML */
/* ========================= */

window.processarXML = function (xml) {

    if (!db.produtos) {
        db.produtos = [];
    }

    if (!db.fornecedores) {
        db.fornecedores = [];
    }

    if (!db.financeiro) {
        db.financeiro = [];
    }

    /* ========================= */
/* FORNECEDOR XML */
/* ========================= */

const emit =
    xml.getElementsByTagName('emit')[0];

const fornecedorNome =
    emit
        ?.getElementsByTagName('xNome')[0]
        ?.textContent || '';

const documento =
    emit
        ?.getElementsByTagName('CNPJ')[0]
        ?.textContent ||

    emit
        ?.getElementsByTagName('CPF')[0]
        ?.textContent ||

    '';

const endereco =
    emit
        ?.getElementsByTagName('xLgr')[0]
        ?.textContent || '';

const numero =
    emit
        ?.getElementsByTagName('nro')[0]
        ?.textContent || '';

const bairro =
    emit
        ?.getElementsByTagName('xBairro')[0]
        ?.textContent || '';

const cidade =
    emit
        ?.getElementsByTagName('xMun')[0]
        ?.textContent || '';

const uf =
    emit
        ?.getElementsByTagName('UF')[0]
        ?.textContent || '';

let fornecedorExiste =
    db.fornecedores.find(f =>

        (f.nome || '')
            .trim()
            .toLowerCase() ===

        fornecedorNome
            .trim()
            .toLowerCase()
    );

if (
    fornecedorNome &&
    !fornecedorExiste
) {

    db.fornecedores.push({

        nome: fornecedorNome,

        documento,

        razaoSocial:
            fornecedorNome,

        fantasia:
            fornecedorNome,

        endereco:
            `${endereco}, ${numero} - ${bairro} - ${cidade}/${uf}`,

        contato:'',

        personalidade:
            documento.length > 11
                ? 'PJ'
                : 'PF',

        dataCadastro:
            new Date().toISOString()
    });
}

    /* ========================= */
    /* ITENS XML */
    /* ========================= */

    const itensXML =
        xml.getElementsByTagName('det');

    const produtosImportados = [];

    let totalNota = 0;

    for (
        let i = 0;
        i < itensXML.length;
        i++
    ) {

        const prodXML =
            itensXML[i]
                .getElementsByTagName('prod')[0];

        if (!prodXML) continue;

        const descricao =
            prodXML
                .getElementsByTagName('xProd')[0]
                ?.textContent || '';

        const quantidade =
            parseFloat(
                prodXML
                    .getElementsByTagName('qCom')[0]
                    ?.textContent || 0
            );

        const valorTotal =
            parseFloat(
                prodXML
                    .getElementsByTagName('vProd')[0]
                    ?.textContent || 0
            );

        const valorUnitario =
            quantidade > 0
                ? valorTotal / quantidade
                : 0;

        totalNota += valorTotal;

        /* ========================= */
        /* VERIFICA EXISTENTE */
        /* ========================= */

        const produtoExistente =
            db.produtos.find(p =>

                p.descricao
                    ?.trim()
                    .toLowerCase() ===

                descricao
                    ?.trim()
                    .toLowerCase()
            );

        /* ========================= */
        /* ATUALIZA EXISTENTE */
        /* ========================= */

        if (produtoExistente) {

            produtoExistente.quantidade +=
                quantidade;

            produtoExistente.valor =
                valorUnitario;

            produtoExistente.fornecedor =
                fornecedorNome;
        }

        /* ========================= */
        /* NOVO PRODUTO */
        /* ========================= */

        else {

            produtosImportados.push({

                descricao,

                quantidade,

                valor: valorUnitario,

                fornecedor:
                    fornecedorNome,

                importado: true
            });
        }
    }

    /* ========================= */
    /* ABRIR CONFERÊNCIA */
    /* ========================= */

    let indiceAtual = 0;

    function abrirProximoProduto() {

        /* ========================= */
        /* FINALIZOU */
        /* ========================= */

        if (
            indiceAtual >=
            produtosImportados.length
        ) {

            db.financeiro.push({

                tipo: 'Pagar',

                descricao:
                    `Compra XML - ${fornecedorNome}`,

                fornecedor:
                    fornecedorNome,

                valor:
                    totalNota,

                vencimento:
                    new Date()
                        .toISOString()
                        .split('T')[0],

                status: 'Pendente',

                dataCadastro:
                    new Date().toISOString()
            });

            save();

            navigate('estoque');

            alert(
                'XML importado com sucesso!'
            );

            return;
        }

        /* ========================= */
        /* PRODUTO ATUAL */
        /* ========================= */

        const dados =
            produtosImportados[indiceAtual];

        abrirNovoProduto(dados);

        /* ========================= */
        /* SOBRESCREVE CONFIRMAR */
        /* ========================= */

        document.getElementById(
            'modal-confirm'
        ).onclick = function () {

            const tipo =
                document.getElementById(
                    'produto-tipo'
                ).value;

            if (!tipo) {

                alert(
                    'Selecione o tipo do produto.'
                );

                return;
            }

            const novoProduto = {

                codigo:
                    db.produtos.length + 1,

                tipo,

                descricao:
                    document.getElementById(
                        'produto-descricao'
                    ).value,

                quantidade:
                    Number(
                        document.getElementById(
                            'produto-quantidade'
                        ).value
                    ),

                valor:
                    Number(
                        document.getElementById(
                            'produto-valor'
                        ).value
                    ),

                fornecedor:
                    document.getElementById(
                        'produto-fornecedor'
                    ).value,

                dataCadastro:
                    new Date().toISOString()
            };

            db.produtos.push(
                novoProduto
            );

            save();

            closeModal();

            indiceAtual++;

            abrirProximoProduto();
        };
    }

    /* ========================= */
    /* INICIAR */
    /* ========================= */

    abrirProximoProduto();
};

/* ========================= */
/* REGISTRAR PÁGINA */
/* ========================= */

registerPage(
    'estoque',
    renderEstoque
);