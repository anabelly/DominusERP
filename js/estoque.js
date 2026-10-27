/* ========================================================= */
/* DOMINUS ERP - ESTOQUE.JS                                  */
/* ========================================================= */
/*
    CONTROLE DE ESTOQUE, CONSULTA E IMPORTAÇÃO DE XML

    Este arquivo controla toda a tela de Estoque do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Renderizar a listagem de produtos
    2. Cadastrar novos produtos
    3. Gerenciar tipos de produto
    4. Editar, visualizar e excluir produtos
    5. Consultar e filtrar produtos
    6. Importar XML de nota fiscal
    7. Conferir TODOS os itens do XML em sequência
    8. Abrir automaticamente o próximo produto após salvar
    9. Reutilizar fornecedor existente pelo mesmo CNPJ/CPF
    10. Cadastrar fornecedor novo somente quando não existir
    11. Somar estoque quando o produto for igual ou semelhante
    12. Cadastrar produto novo somente quando for diferente
    13. Impedir a importação repetida do mesmo XML
    12. Gerar automaticamente as contas a pagar das duplicatas
    13. Registrar o histórico dos XMLs importados
    14. Salvar as alterações no banco
    15. Registrar a página "estoque" no sistema

    IMPORTANTE:
    A importação de XML foi reformulada para funcionar como
    uma conferência sequencial de produtos e para integrar
    automaticamente as faturas ao Fluxo Financeiro.
*/


/* ========================================================= */
/* 00. TIPOS DE PRODUTO - ORDEM ALFABÉTICA                  */
/* ========================================================= */
/*
    Mantém db.tiposProduto sempre organizado em ordem alfabética.

    Regras:
    - ignora espaços extras nas pontas;
    - remove duplicados considerando maiúsculas/minúsculas;
    - ordena em português (pt-BR);
    - quando solicitado, salva a ordem corrigida no banco.

    Assim, qualquer novo tipo entra automaticamente na posição
    correta, sem ficar simplesmente no final da lista.
*/


/* --------------------------------------------------------- */
/* ordenarTiposProdutoAlfabeticamente                        */
/* --------------------------------------------------------- */

function ordenarTiposProdutoAlfabeticamente(
    salvarAlteracoes = false
) {

    if (
        !Array.isArray(
            db.tiposProduto
        )
    ) {

        db.tiposProduto =
            [];
    }

    const antes =
        JSON.stringify(
            db.tiposProduto
        );

    const mapaUnicos =
        new Map();

    db.tiposProduto
        .forEach(
            tipo => {

                const nome =
                    String(
                        tipo || ''
                    )
                    .trim();

                if (
                    !nome
                ) {

                    return;
                }

                const chave =
                    nome
                        .normalize(
                            'NFD'
                        )
                        .replace(
                            /[\u0300-\u036f]/g,
                            ''
                        )
                        .toLocaleLowerCase(
                            'pt-BR'
                        );

                if (
                    !mapaUnicos.has(
                        chave
                    )
                ) {

                    mapaUnicos.set(
                        chave,
                        nome
                    );
                }
            }
        );

    db.tiposProduto =
        [
            ...mapaUnicos.values()
        ]
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    'pt-BR',
                    {
                        sensitivity:
                            'base'
                    }
                )
        );

    const depois =
        JSON.stringify(
            db.tiposProduto
        );

    const alterou =
        antes !==
        depois;

    if (
        alterou
        &&
        salvarAlteracoes
        &&
        typeof save ===
            'function'
    ) {

        Promise
            .resolve(
                save()
            )
            .catch(
                erro =>
                    console.error(
                        'Erro ao salvar ordem dos tipos de produto:',
                        erro
                    )
            );
    }

    return db.tiposProduto;
}


/* --------------------------------------------------------- */
/* tipoProdutoJaExiste                                       */
/* Evita duplicidade ignorando maiúsculas e acentos.         */
/* --------------------------------------------------------- */

function tipoProdutoJaExiste(
    nome
) {

    const chave =
        String(
            nome || ''
        )
        .trim()
        .normalize(
            'NFD'
        )
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLocaleLowerCase(
            'pt-BR'
        );

    if (
        !chave
    ) {

        return false;
    }

    return (
        db.tiposProduto
        ||
        []
    )
    .some(
        tipo =>
            String(
                tipo || ''
            )
            .trim()
            .normalize(
                'NFD'
            )
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .toLocaleLowerCase(
                'pt-BR'
            )
            ===
            chave
    );
}


/* ========================================================= */
/* 01. RENDERIZAÇÃO DA TELA DE ESTOQUE                      */
/* ========================================================= */
/*
    renderEstoque()

    Monta a tela principal do Estoque com:
    - cabeçalho
    - botão Consultar Produto
    - botão Importar XML
    - botão XML Importados
    - botão Novo Produto
    - tabela de produtos
    - ações Visualizar / Editar / Excluir
*/

/* --------------------------------------------------------- */
/* renderEstoque */
/* Renderiza a listagem completa do estoque. */
/* --------------------------------------------------------- */

window.renderEstoque = function () {

    if (!db.produtos) {
        db.produtos = [];
    }

    if (!db.tiposProduto) {
        db.tiposProduto = [];
    }

    /*
        Corrige inclusive os tipos já cadastrados anteriormente.
        Se estavam fora de ordem, a nova ordem é salva no banco.
    */

    ordenarTiposProdutoAlfabeticamente(
        true
    );

    if (!Array.isArray(db.xmlImportados)) {
        db.xmlImportados = [];
    }

    let html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <!-- 01.1 CABEÇALHO E AÇÕES DA PÁGINA -->

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
                📦 Controle de Estoque
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
            gap:8px;
            flex-wrap:wrap;
            justify-content:flex-end;
            margin-left:auto;
        ">

            <button
                class="btn-action"
                style="padding:10px 15px;font-size:12px;white-space:nowrap;"
                onclick="abrirConsultaProduto()">

                🔍 Consultar

            </button>

            <button
                class="btn-action"
                style="padding:10px 15px;font-size:12px;white-space:nowrap;background:#475569;"
                onclick="abrirGerenciarTiposProduto()">

                🗂️ Tipos

            </button>

            <button
                class="btn-action"
                style="padding:10px 15px;font-size:12px;white-space:nowrap;background:#2563eb;"
                onclick="importarXML()">

                📄 Importar XML

            </button>

            <button
                class="btn-action"
                style="padding:10px 15px;font-size:12px;white-space:nowrap;background:#7c3aed;"
                onclick="abrirXMLImportados()">

                🧾 XML Importados

            </button>

            <button
                class="btn-action"
                style="padding:10px 15px;font-size:12px;white-space:nowrap;background:#16a34a;"
                onclick="abrirNovoProduto()">

                + Novo Produto

            </button>

        </div>

    </div>

    <!-- 01.2 TABELA PRINCIPAL DO ESTOQUE -->

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
                    background:#2563eb !important;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
                onclick="visualizarProduto(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 10px;
                    font-size:12px;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                onclick="editarProduto(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
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

/* ========================================================= */
/* 02. CADASTRO DE NOVO PRODUTO                             */
/* ========================================================= */
/*
    abrirNovoProduto(dados)

    Abre o formulário reutilizado para:
    - novo produto
    - produto importado do XML
    - visualização
    - edição
*/

/* --------------------------------------------------------- */
/* abrirNovoProduto */
/* Abre o formulário reutilizado de produto. */
/* --------------------------------------------------------- */

window.abrirNovoProduto = function (dados = {}) {

    if (!db.produtos) {
        db.produtos = [];
    }

    if (!db.tiposProduto) {
        db.tiposProduto = [];
    }

    ordenarTiposProdutoAlfabeticamente();

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

        <!-- 02.1 CÓDIGO -->

        <div>

            <label>
                Código
            </label>

            <input
                id="produto-codigo"
                value="${proximoCodigo}"
                disabled>

        </div>

        <!-- 02.2 TIPO DO PRODUTO -->

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

        <!-- 02.3 DESCRIÇÃO -->

        <div>

            <label>
                Descrição
            </label>

            <input
                id="produto-descricao"
                value="${dados.descricao || ''}">

        </div>

        <!-- 02.4 QUANTIDADE -->

        <div>

            <label>
                Quantidade
            </label>

            <input
                type="number"
                id="produto-quantidade"
                value="${dados.quantidade || 1}">

        </div>

        <!-- 02.5 VALOR PAGO -->

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

        <!-- 02.6 FORNECEDOR -->

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

/* ========================================================= */
/* 03. SALVAR NOVO PRODUTO                                  */
/* ========================================================= */
/*
    salvarNovoProduto()

    Valida o tipo, monta o objeto do produto,
    adiciona em db.produtos e salva no banco.
*/

/* --------------------------------------------------------- */
/* salvarNovoProduto */
/* Cria e salva um novo produto no estoque. */
/* --------------------------------------------------------- */

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
/* ========================================================= */
/* 04. CADASTRO DE NOVO TIPO DE PRODUTO                     */
/* ========================================================= */
/*
    novoTipoProduto()

    Permite criar um novo tipo sem perder os dados
    já preenchidos no formulário do produto.
*/

/* --------------------------------------------------------- */
/* novoTipoProduto */
/* Cria um novo tipo preservando os dados preenchidos. */
/* --------------------------------------------------------- */

window.novoTipoProduto = function () {


    const dadosAtuais = {

        descricao:
            document.getElementById(
                'produto-descricao'
            )?.value || '',

        quantidade:
            document.getElementById(
                'produto-quantidade'
            )?.value || 1,

        valor:
            document.getElementById(
                'produto-valor'
            )?.value || '',

        fornecedor:
            document.getElementById(
                'produto-fornecedor'
            )?.value || '',

        importado:true

    };


    const html = `

        <label>
            Nome do Tipo
        </label>

        <input
            id="novo-tipo-produto"
            placeholder="Ex: Matéria Prima">

    `;


    configModal({

        title:
            'Novo Tipo de Produto',

        body:
            html,

        confirmText:
            'Salvar',

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
                !tipoProdutoJaExiste(
                    nome
                )
            ) {

                db.tiposProduto.push(
                    nome
                );

                /*
                    O novo tipo já entra na posição alfabética
                    correta antes de salvar.
                */

                ordenarTiposProdutoAlfabeticamente();

                save();

            }


            closeModal();


            /* ================================================= */
            /* 04.1 REABRIR FORMULÁRIO SEM PERDER OS DADOS          */
            /* ================================================= */
            /*
                Depois de criar o novo tipo, o formulário do produto
                é reaberto com os valores anteriores preservados.
            */

            abrirNovoProduto({

                ...dadosAtuais,

                tipo:nome

            });


        }

    });

};
/* ========================================================= */
/* 05. EXCLUIR PRODUTO                                      */
/* ========================================================= */
/*
    excluirProduto(idx)

    Solicita confirmação, remove o produto,
    salva o banco e atualiza a tela.
*/

/* --------------------------------------------------------- */
/* excluirProduto */
/* Exclui um produto após confirmação. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 06. VISUALIZAR PRODUTO                                   */
/* ========================================================= */
/*
    visualizarProduto(idx)

    Reutiliza o formulário, bloqueia os campos e
    troca o botão principal por "Fechar".
*/

/* --------------------------------------------------------- */
/* visualizarProduto */
/* Abre um produto em modo somente leitura. */
/* --------------------------------------------------------- */

window.visualizarProduto = function (idx) {

    const produto =
        db.produtos[idx];

    abrirNovoProduto(produto);

    /* ===================================================== */
    /* 06.1 ALTERAR TÍTULO DO MODAL                          */
    /* ===================================================== */

    const modalTitle =
        document.getElementById('modal-title');

    if (modalTitle) {

        modalTitle.innerText =
            'Visualizar Produto';
    }

    /* ===================================================== */
    /* 06.2 BLOQUEAR CAMPOS DO FORMULÁRIO                    */
    /* ===================================================== */

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

    /* ===================================================== */
    /* 06.3 BLOQUEAR CADASTRO DE NOVO TIPO                   */
    /* ===================================================== */

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

    /* ===================================================== */
    /* 06.4 TRANSFORMAR BOTÃO EM FECHAR                      */
    /* ===================================================== */

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
/* ========================================================= */
/* 07. EDITAR PRODUTO                                       */
/* ========================================================= */
/*
    editarProduto(idx)

    Reabre o formulário preenchido e substitui a ação
    do botão de confirmação para atualizar o registro.
*/

/* --------------------------------------------------------- */
/* editarProduto */
/* Permite editar e salvar um produto existente. */
/* --------------------------------------------------------- */

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

/* ========================================================= */
/* 08. CONSULTA DE PRODUTOS                                 */
/* ========================================================= */
/*
    abrirConsultaProduto()

    Abre um modal com filtros por:
    - período
    - fornecedor
    - tipo de produto
    - descrição
*/

/* --------------------------------------------------------- */
/* abrirConsultaProduto */
/* Abre o modal de pesquisa e filtros. */
/* --------------------------------------------------------- */

window.abrirConsultaProduto = function () {

    ordenarTiposProdutoAlfabeticamente();

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

    <!-- 08.1 CAMPOS DE FILTRO -->

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
                Tipo de produto
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

/* ========================================================= */
/* 09. FILTRAR CONSULTA DE PRODUTOS                         */
/* ========================================================= */
/*
    filtrarProdutosConsulta()

    Aplica os filtros selecionados e monta uma tabela
    com os produtos encontrados.
*/

/* --------------------------------------------------------- */
/* filtrarProdutosConsulta */
/* Aplica filtros e exibe os resultados. */
/* --------------------------------------------------------- */

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

    /* ===================================================== */
    /* 09.1 FILTRO POR PERÍODO                               */
    /* ===================================================== */

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

    /* ===================================================== */
    /* 09.2 FILTRO POR FORNECEDOR                           */
    /* ===================================================== */

    if (fornecedor) {

        produtos = produtos.filter(p =>

            (p.fornecedor || '')
                .toLowerCase()
                .includes(fornecedor)
        );
    }

    /* ===================================================== */
    /* 09.3 FILTRO POR TIPO                                 */
    /* ===================================================== */

    if (tipo) {

        produtos = produtos.filter(p =>

            (p.tipo || '')
                .toLowerCase()
                .includes(tipo)
        );
    }

    /* ===================================================== */
    /* 09.4 FILTRO POR DESCRIÇÃO                            */
    /* ===================================================== */

    if (descricao) {

        produtos = produtos.filter(p =>

            (p.descricao || '')
                .toLowerCase()
                .includes(descricao)
        );
    }

    /* ===================================================== */
    /* 09.5 RESULTADOS DA CONSULTA                           */
    /* ===================================================== */

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
                    background:#2563eb !important;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
                onclick="visualizarProduto(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:5px 8px;
                    font-size:11px;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                onclick="editarProduto(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:5px 8px;
                    font-size:11px;
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
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

/* ========================================================= */
/* 09.1 GERENCIAMENTO DOS XMLs IMPORTADOS                   */
/* ========================================================= */
/*
    Permite:
    - consultar o histórico de XMLs importados;
    - pesquisar por NF, fornecedor, CNPJ/CPF ou arquivo;
    - visualizar os dados registrados;
    - alterar os dados administrativos do histórico;
    - remover um registro do histórico.

    IMPORTANTE:
    remover um registro desta lista NÃO desfaz movimentações
    de estoque nem lançamentos financeiros já gerados.
*/


/* --------------------------------------------------------- */
/* formatarDataHoraXMLImportado                              */
/* Formata a data/hora de importação para exibição.          */
/* --------------------------------------------------------- */

function formatarDataHoraXMLImportado(
    valor
) {

    if (!valor) {
        return '-';
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return String(valor);
    }

    return data.toLocaleString(
        'pt-BR'
    );
}


/* --------------------------------------------------------- */
/* obterHistoricoXMLOrdenado                                 */
/* Retorna uma cópia do histórico do mais recente ao antigo. */
/* --------------------------------------------------------- */

function obterHistoricoXMLOrdenado() {

    garantirHistoricoXML();

    return [
        ...db.xmlImportados
    ]
    .sort(
        (a, b) =>
            String(
                b.importadoEm || ''
            )
            .localeCompare(
                String(
                    a.importadoEm || ''
                )
            )
    );
}


/* --------------------------------------------------------- */
/* abrirXMLImportados                                        */
/* Abre a tela de consulta e gerenciamento do histórico.     */
/* --------------------------------------------------------- */

window.abrirXMLImportados =
function () {

    garantirHistoricoXML();

    const html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:16px;
">

    <div style="
        display:flex;
        gap:10px;
        align-items:end;
        flex-wrap:wrap;
    ">

        <div style="
            flex:1;
            min-width:260px;
        ">

            <label>
                Pesquisar XML importado
            </label>

            <input
                id="filtro-xml-importado"
                placeholder="NF, fornecedor, CNPJ/CPF ou nome do arquivo"
                oninput="filtrarXMLImportados()">

        </div>

        <button
            class="btn-action"
            type="button"
            style="background:#64748b;"
            onclick="
                document.getElementById('filtro-xml-importado').value='';
                filtrarXMLImportados();
            ">

            Limpar

        </button>

    </div>


    <div style="
        padding:12px 14px;
        border-radius:10px;
        background:#f5f3ff;
        border:1px solid #ddd6fe;
        color:#5b21b6;
        font-size:12px;
        line-height:1.5;
    ">

        Este histórico é usado para evitar que a mesma nota
        fiscal seja importada mais de uma vez.

    </div>


    <div
        id="resultado-xml-importados">
    </div>

</div>
`;

    configModal({

        title:
            '🧾 XMLs Importados',

        body:
            html,

        size:
            'large',

        confirmText:
            'Fechar',

        onConfirm() {

            closeModal();
        }
    });

    filtrarXMLImportados();
};


/* --------------------------------------------------------- */
/* filtrarXMLImportados                                      */
/* Pesquisa o histórico e atualiza a tabela.                 */
/* --------------------------------------------------------- */

window.filtrarXMLImportados =
function () {

    const filtro =
        String(
            document.getElementById(
                'filtro-xml-importado'
            )?.value || ''
        )
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase()
        .trim();

    let dados =
        obterHistoricoXMLOrdenado();

    if (filtro) {

        dados =
            dados.filter(
                item => {

                    const texto =
                        [
                            item.numeroNota,
                            item.serie,
                            item.fornecedor,
                            item.documentoFornecedor,
                            item.nomeArquivo,
                            item.chave
                        ]
                        .join(' ')
                        .normalize('NFD')
                        .replace(
                            /[\u0300-\u036f]/g,
                            ''
                        )
                        .toLowerCase();

                    return texto.includes(
                        filtro
                    );
                }
            );
    }

    renderTabelaXMLImportados(
        dados
    );
};


/* --------------------------------------------------------- */
/* renderTabelaXMLImportados                                 */
/* Monta a tabela do histórico.                              */
/* --------------------------------------------------------- */

function renderTabelaXMLImportados(
    dados
) {

    const container =
        document.getElementById(
            'resultado-xml-importados'
        );

    if (!container) {
        return;
    }

    if (!dados.length) {

        container.innerHTML = `

            <div style="
                padding:32px;
                text-align:center;
                color:#6b7280;
                border:1px solid #e5e7eb;
                border-radius:12px;
            ">

                Nenhum XML importado encontrado.

            </div>

        `;

        return;
    }

    container.innerHTML = `

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

                        <th>NF</th>
                        <th>Fornecedor</th>
                        <th>CNPJ/CPF</th>
                        <th>Valor</th>
                        <th>Importado em</th>
                        <th>Ações</th>

                    </tr>

                </thead>

                <tbody>

                    ${dados.map(
                        item => {

                            const indiceReal =
                                db.xmlImportados
                                    .indexOf(
                                        item
                                    );

                            return `

                                <tr>

                                    <td>

                                        <strong>
                                            ${escaparHTMLXML(
                                                item.numeroNota
                                                || '-'
                                            )}
                                        </strong>

                                        ${
                                            item.serie
                                                ? `
                                                    <div style="
                                                        margin-top:3px;
                                                        color:#94a3b8;
                                                        font-size:10px;
                                                    ">
                                                        Série ${escaparHTMLXML(
                                                            item.serie
                                                        )}
                                                    </div>
                                                `
                                                : ''
                                        }

                                    </td>

                                    <td>
                                        ${escaparHTMLXML(
                                            item.fornecedor
                                            || '-'
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHTMLXML(
                                            item.documentoFornecedor
                                            || '-'
                                        )}
                                    </td>

                                    <td>
                                        ${formatarMoeda(
                                            Number(
                                                item.valorNota
                                                || 0
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHTMLXML(
                                            formatarDataHoraXMLImportado(
                                                item.importadoEm
                                            )
                                        )}
                                    </td>

                                    <td>

                                        <div style="
                                            display:flex;
                                            gap:6px;
                                            justify-content:center;
                                            white-space:nowrap;
                                        ">

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 9px;
                                                    font-size:11px;
                                                    background:#2563eb;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
                                                onclick="visualizarXMLImportado(${indiceReal})">

                                                👁

                                            </button>

                                            <button
                                                class="btn-action"
                                                style="
                                                    padding:6px 9px;
                                                    font-size:11px;
                                                    background:#f59e0b;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                                                onclick="editarXMLImportado(${indiceReal})">

                                                ✏

                                            </button>

                                            <button
                                                class="btn-del"
                                                style="
                                                    padding:6px 9px;
                                                    font-size:11px;
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
                                                onclick="removerXMLImportado(${indiceReal})">

                                                🗑

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `;
                        }
                    ).join('')}

                </tbody>

            </table>

        </div>

    `;
}


/* --------------------------------------------------------- */
/* visualizarXMLImportado                                    */
/* Exibe todos os metadados registrados para a nota.         */
/* --------------------------------------------------------- */

window.visualizarXMLImportado =
function (
    indice
) {

    const item =
        db.xmlImportados[
            indice
        ];

    if (!item) {
        return;
    }

    // A lista pertence ao histórico da nota, não ao estoque atual.
    // Os dados do estoque podem mudar depois da importação.
    const materiais = Array.isArray(item.itens)
        ? item.itens
        : [];

    const formatarQuantidadeXML = valor =>
        Number(valor || 0).toLocaleString('pt-BR', {
            maximumFractionDigits: 4
        });

    const linhasMateriais = materiais.map((material, indiceMaterial) => {
        const quantidade = Number(material.quantidade || 0);
        const valorUnitario = Number(material.valorUnitario || 0);
        const valorTotal = Number(material.valorTotal || 0);

        return `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${indiceMaterial + 1}</td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escaparHTMLXML(material.codigo || '-')}</td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;white-space:normal;min-width:230px;">${escaparHTMLXML(material.descricao || '-')}</td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatarQuantidadeXML(quantidade)}</td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${escaparHTMLXML(material.unidade || '-')}</td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${formatarMoeda(valorUnitario)}</td>
                <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${formatarMoeda(valorTotal)}</td>
            </tr>`;
    }).join('');

    const tabelaMateriais = materiais.length
        ? `
            <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:10px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead style="background:#f8fafc;color:#334155;">
                        <tr>
                            <th style="padding:11px 10px;text-align:center;">#</th>
                            <th style="padding:11px 10px;text-align:left;">Código XML</th>
                            <th style="padding:11px 10px;text-align:left;">Material / Descrição</th>
                            <th style="padding:11px 10px;text-align:right;">Quantidade</th>
                            <th style="padding:11px 10px;text-align:center;">Un.</th>
                            <th style="padding:11px 10px;text-align:right;">Valor unitário</th>
                            <th style="padding:11px 10px;text-align:right;">Valor total</th>
                        </tr>
                    </thead>
                    <tbody>${linhasMateriais}</tbody>
                </table>
            </div>`
        : `
            <div style="padding:14px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:10px;line-height:1.5;font-size:12px;">
                A lista de materiais não foi armazenada na importação desta nota.
                Isso pode ocorrer com XMLs importados antes desta atualização.
                Para recuperar os itens dessa nota, é necessário consultar seu arquivo XML original.
            </div>`;

    const html = `

<div style="
    display:grid;
    grid-template-columns:
        repeat(auto-fit,minmax(220px,1fr));
    gap:14px;
">

    <div>
        <label>Número da NF</label>
        <input
            disabled
            value="${escaparHTMLXML(
                item.numeroNota || ''
            )}">
    </div>

    <div>
        <label>Série</label>
        <input
            disabled
            value="${escaparHTMLXML(
                item.serie || ''
            )}">
    </div>

    <div>
        <label>Fornecedor</label>
        <input
            disabled
            value="${escaparHTMLXML(
                item.fornecedor || ''
            )}">
    </div>

    <div>
        <label>CNPJ/CPF</label>
        <input
            disabled
            value="${escaparHTMLXML(
                item.documentoFornecedor || ''
            )}">
    </div>

    <div>
        <label>Data de emissão</label>
        <input
            disabled
            value="${escaparHTMLXML(
                item.dataEmissao || ''
            )}">
    </div>

    <div>
        <label>Valor da nota</label>
        <input
            disabled
            value="${escaparHTMLXML(
                formatarMoeda(
                    Number(
                        item.valorNota || 0
                    )
                )
            )}">
    </div>

    <div>
        <label>Produtos</label>
        <input
            disabled
            value="${Number(
                item.quantidadeItens || 0
            )}">
    </div>

    <div>
        <label>Parcelas</label>
        <input
            disabled
            value="${Number(
                item.quantidadeDuplicatas || 0
            )}">
    </div>

    <div style="
        grid-column:1 / -1;
    ">
        <label>Arquivo</label>
        <input
            disabled
            value="${escaparHTMLXML(
                item.nomeArquivo || ''
            )}">
    </div>

    <div style="
        grid-column:1 / -1;
    ">
        <label>Chave / Identificação</label>
        <textarea
            disabled
            rows="2">${escaparHTMLXML(
                item.chave || ''
            )}</textarea>
    </div>

    <div style="
        grid-column:1 / -1;
    ">
        <label>Importado em</label>
        <input
            disabled
            value="${escaparHTMLXML(
                formatarDataHoraXMLImportado(
                    item.importadoEm
                )
            )}">
    </div>

    <div style="grid-column:1 / -1;margin-top:10px;">
        <h3 style="margin:0 0 12px;color:#ff1f2d;font-size:17px;">
            📦 Materiais da nota fiscal (${materiais.length || Number(item.quantidadeItens || 0)})
        </h3>
        ${tabelaMateriais}
    </div>

</div>
`;

    configModal({

        title:
            `XML Importado - NF ${item.numeroNota || '-'}`,

        body:
            html,

        confirmText:
            'Voltar',

        onConfirm() {

            abrirXMLImportados();
        }
    });
};


/* --------------------------------------------------------- */
/* editarXMLImportado                                        */
/* Altera apenas os dados administrativos do histórico.      */
/* --------------------------------------------------------- */

window.editarXMLImportado =
function (
    indice
) {

    const item =
        db.xmlImportados[
            indice
        ];

    if (!item) {
        return;
    }

    const html = `

<div style="
    display:grid;
    grid-template-columns:
        repeat(auto-fit,minmax(220px,1fr));
    gap:14px;
">

    <div>
        <label>Número da NF</label>
        <input
            id="edit-xml-nf"
            value="${escaparHTMLXML(
                item.numeroNota || ''
            )}">
    </div>

    <div>
        <label>Série</label>
        <input
            id="edit-xml-serie"
            value="${escaparHTMLXML(
                item.serie || ''
            )}">
    </div>

    <div>
        <label>Fornecedor</label>
        <input
            id="edit-xml-fornecedor"
            value="${escaparHTMLXML(
                item.fornecedor || ''
            )}">
    </div>

    <div>
        <label>CNPJ/CPF</label>
        <input
            id="edit-xml-documento"
            value="${escaparHTMLXML(
                item.documentoFornecedor || ''
            )}">
    </div>

    <div>
        <label>Data de emissão</label>
        <input
            id="edit-xml-emissao"
            type="date"
            value="${escaparHTMLXML(
                item.dataEmissao || ''
            )}">
    </div>

    <div>
        <label>Valor da nota</label>
        <input
            id="edit-xml-valor"
            type="number"
            step="0.01"
            min="0"
            value="${Number(
                item.valorNota || 0
            )}">
    </div>

    <div style="
        grid-column:1 / -1;
    ">
        <label>Nome do arquivo</label>
        <input
            id="edit-xml-arquivo"
            value="${escaparHTMLXML(
                item.nomeArquivo || ''
            )}">
    </div>

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
        A chave técnica da NF não é alterada nesta tela,
        porque ela é usada para identificar importações duplicadas.
    </div>

</div>
`;

    configModal({

        title:
            'Editar Registro do XML',

        body:
            html,

        confirmText:
            'Salvar Alterações',

        onConfirm:
        async function () {

            item.numeroNota =
                document.getElementById(
                    'edit-xml-nf'
                )?.value.trim()
                || '';

            item.serie =
                document.getElementById(
                    'edit-xml-serie'
                )?.value.trim()
                || '';

            item.fornecedor =
                document.getElementById(
                    'edit-xml-fornecedor'
                )?.value.trim()
                || '';

            item.documentoFornecedor =
                document.getElementById(
                    'edit-xml-documento'
                )?.value.trim()
                || '';

            item.dataEmissao =
                document.getElementById(
                    'edit-xml-emissao'
                )?.value
                || '';

            item.valorNota =
                Number(
                    document.getElementById(
                        'edit-xml-valor'
                    )?.value
                    || 0
                );

            item.nomeArquivo =
                document.getElementById(
                    'edit-xml-arquivo'
                )?.value.trim()
                || '';

            item.alteradoEm =
                new Date()
                    .toISOString();

            await save();

            abrirXMLImportados();
        }
    });
};


/* --------------------------------------------------------- */
/* removerXMLImportado                                       */
/* Remove SOMENTE o registro administrativo do histórico.    */
/* --------------------------------------------------------- */

window.removerXMLImportado =
async function (
    indice
) {

    const item =
        db.xmlImportados[
            indice
        ];

    if (!item) {
        return;
    }

    const confirmar =
        confirm(
            'Deseja remover este XML da lista de importados?\n\n' +
            `NF: ${item.numeroNota || '-'}\n` +
            `Fornecedor: ${item.fornecedor || '-'}\n\n` +
            'ATENÇÃO: esta ação remove somente o registro do histórico. ' +
            'Ela NÃO diminui o estoque e NÃO exclui contas do financeiro.'
        );

    if (!confirmar) {
        return;
    }

    db.xmlImportados.splice(
        indice,
        1
    );

    await save();

    abrirXMLImportados();
};


/* ========================================================= */
/* 10. IMPORTAR XML DE NOTA FISCAL                          */
/* ========================================================= */
/*
    NOVO FLUXO DE IMPORTAÇÃO:

    1. O usuário escolhe o XML uma única vez.
    2. O sistema verifica se esse XML já foi importado.
    3. Todos os itens do XML entram em uma fila de conferência.
    4. É aberto o primeiro produto preenchido automaticamente.
    5. Ao clicar em Salvar, o próximo produto abre sozinho.
    6. Isso continua até o último item da nota.
    7. Somente ao finalizar:
       - os produtos são gravados/atualizados no estoque;
       - o fornecedor é cadastrado, se necessário;
       - as duplicatas/faturas viram Contas a Pagar;
       - o XML é registrado no histórico de importações.

    Dessa forma, o mesmo XML não precisa ser selecionado
    várias vezes para cadastrar seus produtos.
*/


/* --------------------------------------------------------- */
/* ESTRUTURA GLOBAL DA IMPORTAÇÃO                            */
/* --------------------------------------------------------- */

window.importacaoXMLAtual =
    window.importacaoXMLAtual || null;


/* --------------------------------------------------------- */
/* garantirHistoricoXML                                     */
/* Garante a lista persistente de XMLs já importados.        */
/* --------------------------------------------------------- */

function garantirHistoricoXML() {

    if (!Array.isArray(db.xmlImportados)) {
        db.xmlImportados = [];
    }

    return db.xmlImportados;
}


/* --------------------------------------------------------- */
/* normalizarDescricaoProdutoXML                             */
/* Mantém o mesmo padrão de comparação usado no estoque.     */
/* --------------------------------------------------------- */

function normalizarDescricaoProdutoXML(valor) {

    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/,/g, '.')
        .replace(/[^a-z0-9.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}


/* --------------------------------------------------------- */
/* extrairNumerosDescricaoXML                                */
/* Protege contra juntar produtos de medidas diferentes.     */
/* Ex.: "PVC 2mm" não deve ser tratado como "PVC 3mm".       */
/* --------------------------------------------------------- */

function extrairNumerosDescricaoXML(valor) {

    return (
        normalizarDescricaoProdutoXML(valor)
            .match(/\d+(?:\.\d+)?/g)
        || []
    );
}


/* --------------------------------------------------------- */
/* numerosCompativeisDescricaoXML                            */
/* Produtos semelhantes só são unidos quando suas medidas /  */
/* números importantes também são compatíveis.               */
/* --------------------------------------------------------- */

function numerosCompativeisDescricaoXML(
    descricaoA,
    descricaoB
) {

    const numerosA =
        extrairNumerosDescricaoXML(
            descricaoA
        );

    const numerosB =
        extrairNumerosDescricaoXML(
            descricaoB
        );

    if (
        !numerosA.length
        &&
        !numerosB.length
    ) {

        return true;
    }

    if (
        numerosA.length !==
        numerosB.length
    ) {

        return false;
    }

    return numerosA.every(
        (numero, indice) =>
            numero ===
            numerosB[indice]
    );
}


/* --------------------------------------------------------- */
/* similaridadeTextoXML                                      */
/* Calcula similaridade textual sem depender de bibliotecas.  */
/* --------------------------------------------------------- */

function similaridadeTextoXML(
    textoA,
    textoB
) {

    const a =
        normalizarDescricaoProdutoXML(
            textoA
        );

    const b =
        normalizarDescricaoProdutoXML(
            textoB
        );

    if (!a || !b) {
        return 0;
    }

    if (a === b) {
        return 1;
    }

    /*
        Se uma descrição contém integralmente a outra,
        consideramos uma forte indicação de semelhança,
        desde que as medidas/números sejam compatíveis.
    */

    if (
        numerosCompativeisDescricaoXML(
            a,
            b
        )
        &&
        (
            a.includes(b)
            ||
            b.includes(a)
        )
    ) {

        const menor =
            Math.min(
                a.length,
                b.length
            );

        const maior =
            Math.max(
                a.length,
                b.length
            );

        const proporcao =
            maior > 0
                ? menor / maior
                : 0;

        if (proporcao >= 0.72) {
            return 0.92;
        }
    }

    const tokensA =
        [
            ...new Set(
                a.split(' ')
                    .filter(
                        token =>
                            token.length > 1
                    )
            )
        ];

    const tokensB =
        [
            ...new Set(
                b.split(' ')
                    .filter(
                        token =>
                            token.length > 1
                    )
            )
        ];

    if (
        !tokensA.length
        ||
        !tokensB.length
    ) {

        return 0;
    }

    const intersecao =
        tokensA.filter(
            token =>
                tokensB.includes(
                    token
                )
        ).length;

    const totalUnicos =
        new Set(
            [
                ...tokensA,
                ...tokensB
            ]
        ).size;

    const jaccard =
        totalUnicos > 0
            ? intersecao /
              totalUnicos
            : 0;

    const cobertura =
        intersecao /
        Math.min(
            tokensA.length,
            tokensB.length
        );

    return (
        jaccard * 0.55
        +
        cobertura * 0.45
    );
}


/* --------------------------------------------------------- */
/* localizarProdutoSemelhanteXML                             */
/* Procura produto igual OU suficientemente semelhante.      */
/* --------------------------------------------------------- */

function localizarProdutoSemelhanteXML(
    descricao
) {

    const alvo =
        normalizarDescricaoProdutoXML(
            descricao
        );

    if (!alvo) {
        return null;
    }

    let melhor =
        null;

    let melhorPontuacao =
        0;

    (db.produtos || [])
        .forEach(
            produto => {

                const descricaoProduto =
                    produto?.descricao || '';

                const normalizada =
                    normalizarDescricaoProdutoXML(
                        descricaoProduto
                    );

                if (!normalizada) {
                    return;
                }

                /*
                    Correspondência exata:
                    prioridade máxima.
                */

                if (
                    normalizada === alvo
                ) {

                    melhor =
                        produto;

                    melhorPontuacao =
                        1;

                    return;
                }

                /*
                    Se números/medidas não combinam,
                    não tratamos como produto semelhante.
                */

                if (
                    !numerosCompativeisDescricaoXML(
                        descricaoProduto,
                        descricao
                    )
                ) {

                    return;
                }

                const pontuacao =
                    similaridadeTextoXML(
                        descricaoProduto,
                        descricao
                    );

                if (
                    pontuacao >
                    melhorPontuacao
                ) {

                    melhor =
                        produto;

                    melhorPontuacao =
                        pontuacao;
                }
            }
        );

    /*
        Limite conservador para evitar juntar produtos
        diferentes por engano.
    */

    if (
        melhor
        &&
        melhorPontuacao >= 0.82
    ) {

        return {
            produto:
                melhor,

            pontuacao:
                melhorPontuacao
        };
    }

    return null;
}


/* --------------------------------------------------------- */
/* textoTagXML                                               */
/* Lê o primeiro valor de uma tag dentro de um nó XML.       */
/* --------------------------------------------------------- */

function textoTagXML(no, tag) {

    return (
        no
            ?.getElementsByTagName(tag)[0]
            ?.textContent
        || ''
    ).trim();
}


/* --------------------------------------------------------- */
/* numeroTagXML                                              */
/* Lê uma tag numérica com segurança.                        */
/* --------------------------------------------------------- */

function numeroTagXML(no, tag) {

    const valor =
        Number(
            String(
                textoTagXML(no, tag) || '0'
            )
            .replace(',', '.')
        );

    return Number.isFinite(valor)
        ? valor
        : 0;
}


/* --------------------------------------------------------- */
/* formatarDocumentoXML                                      */
/* Formata CPF/CNPJ do fornecedor.                           */
/* --------------------------------------------------------- */

function formatarDocumentoXML(doc) {

    doc =
        String(doc || '')
            .replace(/\D/g, '');

    if (doc.length === 14) {

        return doc.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            '$1.$2.$3/$4-$5'
        );
    }

    if (doc.length === 11) {

        return doc.replace(
            /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
            '$1.$2.$3-$4'
        );
    }

    return doc;
}


/* --------------------------------------------------------- */
/* escaparHTMLXML                                            */
/* Protege valores vindos do XML antes de exibir no modal.   */
/* --------------------------------------------------------- */

function escaparHTMLXML(valor) {

    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* --------------------------------------------------------- */
/* obterIdentificacaoXML                                     */
/* Identifica a NF-e e cria uma chave única para o histórico.*/
/* --------------------------------------------------------- */

function obterIdentificacaoXML(xml) {

    const infNFe =
        xml.getElementsByTagName('infNFe')[0];

    const ide =
        xml.getElementsByTagName('ide')[0];

    const emit =
        xml.getElementsByTagName('emit')[0];

    const chaveProtocolo =
        textoTagXML(
            xml.getElementsByTagName('infProt')[0],
            'chNFe'
        );

    const idInfNFe =
        String(
            infNFe?.getAttribute('Id') || ''
        )
        .replace(/^NFe/i, '')
        .trim();

    const numeroNota =
        textoTagXML(ide, 'nNF');

    const serie =
        textoTagXML(ide, 'serie');

    const dataEmissaoCompleta =
        textoTagXML(ide, 'dhEmi')
        ||
        textoTagXML(ide, 'dEmi');

    const dataEmissao =
        dataEmissaoCompleta
            ? String(dataEmissaoCompleta).slice(0, 10)
            : '';

    const documentoEmitente =
        textoTagXML(emit, 'CNPJ')
        ||
        textoTagXML(emit, 'CPF');

    /*
        Prioridade:
        1. chNFe do protocolo
        2. Id da infNFe
        3. combinação estável de emitente + série + número + emissão
    */

    const chave =
        chaveProtocolo
        ||
        idInfNFe
        ||
        [
            String(documentoEmitente).replace(/\D/g, ''),
            serie,
            numeroNota,
            dataEmissao
        ].join('|');

    return {
        chave,
        numeroNota,
        serie,
        dataEmissao
    };
}


/* --------------------------------------------------------- */
/* localizarXMLJaImportado                                   */
/* Verifica se a chave da nota já existe no histórico.       */
/* --------------------------------------------------------- */

function localizarXMLJaImportado(
    chave,
    identificacao = {}
) {

    const chaveTexto =
        String(
            chave || ''
        ).trim();

    /*
        1. HISTÓRICO OFICIAL
    */

    const historico =
        garantirHistoricoXML();

    if (chaveTexto) {

        const encontradoHistorico =
            historico.find(
                item =>
                    String(
                        item?.chave || ''
                    ).trim()
                    ===
                    chaveTexto
            );

        if (encontradoHistorico) {
            return {
                origemDeteccao:
                    'historico',
                registro:
                    encontradoHistorico
            };
        }
    }

    /*
        2. FINANCEIRO

        Esta verificação também recupera importações feitas
        quando o histórico ainda não era carregado pelo db.js,
        pois os lançamentos financeiros já guardavam chaveXML.
    */

    if (chaveTexto) {

        const financeiro =
            (db.financeiro || [])
                .find(
                    lancamento =>
                        String(
                            lancamento?.chaveXML || ''
                        ).trim()
                        ===
                        chaveTexto
                );

        if (financeiro) {

            return {
                origemDeteccao:
                    'financeiro',
                registro: {
                    chave:
                        chaveTexto,

                    numeroNota:
                        financeiro.numeroNota
                        ||
                        identificacao.numeroNota
                        ||
                        '',

                    fornecedor:
                        financeiro.nome
                        ||
                        '',

                    importadoEm:
                        financeiro.dataCadastro
                        ||
                        ''
                }
            };
        }
    }

    /*
        3. PRODUTOS IMPORTADOS

        Outra proteção para casos em que os produtos já possuem
        a chave da importação, mas o histórico foi perdido.
    */

    if (chaveTexto) {

        const produto =
            (db.produtos || [])
                .find(
                    item =>
                        String(
                            item?.chaveXML || ''
                        ).trim()
                        ===
                        chaveTexto
                );

        if (produto) {

            return {
                origemDeteccao:
                    'produto',
                registro: {
                    chave:
                        chaveTexto,

                    numeroNota:
                        identificacao.numeroNota
                        ||
                        '',

                    fornecedor:
                        produto.fornecedor
                        ||
                        '',

                    importadoEm:
                        produto.dataCadastro
                        ||
                        ''
                }
            };
        }
    }

    /*
        4. COMBINAÇÃO NF + SÉRIE + FORNECEDOR

        Funciona como proteção adicional caso o histórico
        possua dados de versões anteriores sem uma chave igual.
    */

    const nf =
        String(
            identificacao.numeroNota || ''
        ).trim();

    const serie =
        String(
            identificacao.serie || ''
        ).trim();

    const documento =
        String(
            identificacao.documentoFornecedor || ''
        )
        .replace(/\D/g, '');

    if (nf) {

        const porDados =
            historico.find(
                item => {

                    const mesmoNumero =
                        String(
                            item?.numeroNota || ''
                        ).trim()
                        === nf;

                    const mesmaSerie =
                        !serie
                        ||
                        !item?.serie
                        ||
                        String(
                            item.serie
                        ).trim()
                        === serie;

                    const docItem =
                        String(
                            item?.documentoFornecedor || ''
                        )
                        .replace(/\D/g, '');

                    const mesmoDocumento =
                        !documento
                        ||
                        !docItem
                        ||
                        docItem === documento;

                    return (
                        mesmoNumero
                        &&
                        mesmaSerie
                        &&
                        mesmoDocumento
                    );
                }
            );

        if (porDados) {

            return {
                origemDeteccao:
                    'dados',
                registro:
                    porDados
            };
        }
    }

    return null;
}


/* --------------------------------------------------------- */
/* obterDadosFornecedorXML                                   */
/* Extrai fornecedor e endereço do XML.                      */
/* --------------------------------------------------------- */

function obterDadosFornecedorXML(xml) {

    const emit =
        xml.getElementsByTagName('emit')[0];

    const fornecedorNome =
        textoTagXML(emit, 'xNome');

    const documento =
        textoTagXML(emit, 'CNPJ')
        ||
        textoTagXML(emit, 'CPF');

    const endereco =
        textoTagXML(emit, 'xLgr');

    const numero =
        textoTagXML(emit, 'nro');

    const bairro =
        textoTagXML(emit, 'xBairro');

    const cidade =
        textoTagXML(emit, 'xMun');

    const uf =
        textoTagXML(emit, 'UF');

    return {
        nome: fornecedorNome,
        documento,
        documentoLimpo:
            String(documento || '')
                .replace(/\D/g, ''),
        endereco,
        numero,
        bairro,
        cidade,
        uf
    };
}


/* --------------------------------------------------------- */
/* obterDuplicatasXML                                        */
/* Lê a discriminação das faturas/parcelas da nota.          */
/* --------------------------------------------------------- */

function obterDuplicatasXML(xml) {

    const duplicatas =
        [...xml.getElementsByTagName('dup')];

    return duplicatas
        .map(dup => ({

            numero:
                textoTagXML(
                    dup,
                    'nDup'
                ),

            vencimento:
                textoTagXML(
                    dup,
                    'dVenc'
                ),

            valor:
                numeroTagXML(
                    dup,
                    'vDup'
                )

        }))
        .filter(
            dup =>
                dup.valor > 0
        );
}


/* --------------------------------------------------------- */
/* obterValorNotaXML                                         */
/* Prioriza vNF; usa soma dos itens apenas como fallback.    */
/* --------------------------------------------------------- */

function obterValorNotaXML(xml, itens) {

    const total =
        xml.getElementsByTagName('ICMSTot')[0];

    const valorNF =
        numeroTagXML(
            total,
            'vNF'
        );

    if (valorNF > 0) {
        return valorNF;
    }

    return itens.reduce(
        (soma, item) =>
            soma +
            (
                Number(item.quantidade || 0)
                *
                Number(item.valor || 0)
            ),
        0
    );
}


/* --------------------------------------------------------- */
/* obterItensXML                                             */
/* Converte cada <det> da nota em item para conferência.     */
/* --------------------------------------------------------- */

function obterItensXML(xml, fornecedorNome) {

    const itensXML =
        [...xml.getElementsByTagName('det')];

    return itensXML
        .map((det, indice) => {

            const prodXML =
                det.getElementsByTagName('prod')[0];

            if (!prodXML) {
                return null;
            }

            const descricao =
                textoTagXML(
                    prodXML,
                    'xProd'
                );

            const quantidade =
                numeroTagXML(
                    prodXML,
                    'qCom'
                );

            const valorTotal =
                numeroTagXML(
                    prodXML,
                    'vProd'
                );

            const valorUnitario =
                quantidade > 0
                    ? valorTotal / quantidade
                    : numeroTagXML(
                        prodXML,
                        'vUnCom'
                    );

            const correspondencia =
                localizarProdutoSemelhanteXML(
                    descricao
                );

            const produtoExistente =
                correspondencia?.produto
                || null;

            return {

                indiceXML:
                    indice,

                codigoXML:
                    textoTagXML(prodXML, 'cProd'),

                unidadeXML:
                    textoTagXML(prodXML, 'uCom'),

                descricaoOriginal:
                    descricao,

                descricao,

                quantidade,

                valor:
                    valorUnitario,

                valorTotal,

                fornecedor:
                    fornecedorNome,

                tipo:
                    produtoExistente?.tipo
                    || '',

                codigoExistente:
                    produtoExistente?.codigo
                    ?? null,

                nomeProdutoExistente:
                    produtoExistente?.descricao
                    || '',

                similaridadeProduto:
                    correspondencia?.pontuacao
                    || 0,

                produtoExistente:
                    !!produtoExistente

            };
        })
        .filter(Boolean);
}


/* --------------------------------------------------------- */
/* importarXML                                               */
/* Abre o seletor de arquivo apenas uma vez por nota.        */
/* --------------------------------------------------------- */

window.importarXML = function () {

    if (
        window.importacaoXMLAtual
        &&
        !window.importacaoXMLAtual.finalizada
    ) {

        const descartar =
            confirm(
                'Existe uma importação de XML ainda não finalizada.\n\n' +
                'Deseja descartá-la e selecionar outro XML?'
            );

        if (!descartar) {
            return;
        }

        window.importacaoXMLAtual =
            null;
    }

    const input =
        document.createElement('input');

    input.type =
        'file';

    input.accept =
        '.xml,text/xml,application/xml';

    input.onchange =
        function (e) {

            const arquivo =
                e.target.files?.[0];

            if (!arquivo) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function (evento) {

                    try {

                        const xmlTexto =
                            evento.target.result;

                        const parser =
                            new DOMParser();

                        const xml =
                            parser.parseFromString(
                                xmlTexto,
                                'text/xml'
                            );

                        if (
                            xml.getElementsByTagName(
                                'parsererror'
                            ).length
                        ) {

                            alert(
                                'Não foi possível ler este XML. Verifique se o arquivo é uma NF-e válida.'
                            );

                            return;
                        }

                        processarXML(
                            xml,
                            arquivo.name
                        );

                    }

                    catch (erro) {

                        console.error(
                            'Erro ao importar XML:',
                            erro
                        );

                        alert(
                            'Ocorreu um erro ao ler o XML.'
                        );
                    }
                };

            reader.readAsText(
                arquivo
            );
        };

    input.click();
};


/* ========================================================= */
/* 11. PROCESSAR XML                                        */
/* ========================================================= */
/*
    Prepara uma sessão temporária de importação.

    IMPORTANTE:
    os produtos e o financeiro só são gravados definitivamente
    quando o último item da fila for confirmado.
*/


/* --------------------------------------------------------- */
/* processarXML                                              */
/* Valida a nota e cria a fila de produtos para conferência. */
/* --------------------------------------------------------- */

window.processarXML =
async function (
    xml,
    nomeArquivo = ''
) {

    if (!Array.isArray(db.produtos)) {
        db.produtos = [];
    }

    if (!Array.isArray(db.fornecedores)) {
        db.fornecedores = [];
    }

    if (!Array.isArray(db.financeiro)) {
        db.financeiro = [];
    }

    if (!Array.isArray(db.tiposProduto)) {
        db.tiposProduto = [];
    }

    ordenarTiposProdutoAlfabeticamente();

    garantirHistoricoXML();

    const identificacao =
        obterIdentificacaoXML(xml);

    const fornecedor =
        obterDadosFornecedorXML(
            xml
        );

    /*
        Adiciona o documento do fornecedor à identificação
        para reforçar a comparação de notas antigas.
    */

    identificacao.documentoFornecedor =
        fornecedor.documentoLimpo
        || '';

    const jaImportado =
        localizarXMLJaImportado(
            identificacao.chave,
            identificacao
        );

    if (jaImportado) {

        const registro =
            jaImportado.registro
            || {};

        const quando =
            registro.importadoEm
                ? new Date(
                    registro.importadoEm
                ).toLocaleString(
                    'pt-BR'
                )
                : 'data não informada';

        alert(
            '⚠️ Este XML já foi importado anteriormente.\n\n' +
            `NF: ${registro.numeroNota || identificacao.numeroNota || '-'}\n` +
            `Fornecedor: ${registro.fornecedor || fornecedor.nome || '-'}\n` +
            `Importado em: ${quando}\n\n` +
            'A importação foi bloqueada para evitar duplicidade no estoque e no financeiro.'
        );

        return;
    }

    const itens =
        obterItensXML(
            xml,
            fornecedor.nome
        );

    if (!itens.length) {

        alert(
            'Nenhum produto foi encontrado neste XML.'
        );

        return;
    }

    const duplicatas =
        obterDuplicatasXML(
            xml
        );

    const valorNota =
        obterValorNotaXML(
            xml,
            itens
        );

    window.importacaoXMLAtual = {

        ativa:
            true,

        finalizada:
            false,

        nomeArquivo,

        chave:
            identificacao.chave,

        numeroNota:
            identificacao.numeroNota,

        serie:
            identificacao.serie,

        dataEmissao:
            identificacao.dataEmissao,

        fornecedor,

        duplicatas,

        valorNota,

        itens,

        indiceAtual:
            0,

        conferidos:
            [],

        rascunhoAtual:
            null

    };

    abrirProdutoImportacaoXML();
};


/* --------------------------------------------------------- */
/* opcoesTiposProdutoXML                                     */
/* Monta o select de tipo do produto da conferência.         */
/* --------------------------------------------------------- */

function opcoesTiposProdutoXML(
    tipoAtual = ''
) {

    ordenarTiposProdutoAlfabeticamente();

    let html = `
        <option value="">
            Selecione
        </option>
    `;

    (db.tiposProduto || [])
        .forEach(tipo => {

            html += `
                <option
                    value="${escaparHTMLXML(tipo)}"
                    ${String(tipo) === String(tipoAtual) ? 'selected' : ''}>

                    ${escaparHTMLXML(tipo)}

                </option>
            `;
        });

    return html;
}


/* --------------------------------------------------------- */
/* opcoesFornecedorXML                                       */
/* Inclui o fornecedor da nota mesmo antes do cadastro final.*/
/* --------------------------------------------------------- */

function opcoesFornecedorXML(
    fornecedorAtual = ''
) {

    const nomes =
        [
            ...(db.fornecedores || [])
                .map(
                    fornecedor =>
                        fornecedor.nome
                )
                .filter(Boolean),

            fornecedorAtual
        ]
        .filter(Boolean);

    const unicos =
        nomes.filter(
            (nome, indice, lista) =>
                lista.findIndex(
                    outro =>
                        String(outro).toLowerCase()
                        ===
                        String(nome).toLowerCase()
                )
                === indice
        );

    let html = `
        <option value="">
            Selecione
        </option>
    `;

    unicos.forEach(nome => {

        html += `
            <option
                value="${escaparHTMLXML(nome)}"
                ${String(nome) === String(fornecedorAtual) ? 'selected' : ''}>

                ${escaparHTMLXML(nome)}

            </option>
        `;
    });

    return html;
}


/* --------------------------------------------------------- */
/* abrirProdutoImportacaoXML                                 */
/* Abre o produto atual e controla a sequência automática.   */
/* --------------------------------------------------------- */

window.abrirProdutoImportacaoXML =
function () {

    const sessao =
        window.importacaoXMLAtual;

    if (
        !sessao
        ||
        sessao.finalizada
    ) {

        return;
    }

    if (
        sessao.indiceAtual >=
        sessao.itens.length
    ) {

        finalizarImportacaoXML();

        return;
    }

    const itemBase =
        sessao.itens[
            sessao.indiceAtual
        ];

    const dados =
        sessao.rascunhoAtual
        ||
        itemBase;

    sessao.rascunhoAtual =
        null;

    const produtoExistente =
        itemBase.produtoExistente;

    const numeroNotaTexto =
        sessao.numeroNota
        ? `NF ${sessao.numeroNota}`
        : 'Nota fiscal';

    const avisoExistente =
        produtoExistente
            ? `
                <div style="
                    padding:10px 12px;
                    border-radius:10px;
                    background:#eff6ff;
                    border:1px solid #bfdbfe;
                    color:#1e40af;
                    font-size:12px;
                    line-height:1.5;
                ">
                    ℹ️ Produto igual ou semelhante já encontrado no estoque.
                    <br>
                    <strong>Produto cadastrado:</strong>
                    ${escaparHTMLXML(
                        itemBase.nomeProdutoExistente
                        || itemBase.descricaoOriginal
                    )}
                    <br>
                    Ao finalizar o XML, a quantidade desta nota será
                    <strong>somada ao estoque existente</strong>.
                    Não será criado outro produto.
                </div>
            `
            : `
                <div style="
                    padding:10px 12px;
                    border-radius:10px;
                    background:#f0fdf4;
                    border:1px solid #bbf7d0;
                    color:#166534;
                    font-size:12px;
                    line-height:1.5;
                ">
                    ✅ Produto novo encontrado no XML.
                    Confira os dados e selecione o tipo antes de salvar.
                </div>
            `;

    const html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:18px;
">

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        flex-wrap:wrap;
        padding:12px 14px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:12px;
    ">

        <div>

            <div style="
                font-size:12px;
                color:#64748b;
            ">
                ${escaparHTMLXML(numeroNotaTexto)}
                •
                ${escaparHTMLXML(sessao.fornecedor.nome || 'Fornecedor não informado')}
            </div>

            <div style="
                margin-top:4px;
                font-size:15px;
                font-weight:800;
                color:#111827;
            ">
                Produto ${sessao.indiceAtual + 1} de ${sessao.itens.length}
            </div>

        </div>

        <div style="
            padding:6px 10px;
            border-radius:999px;
            background:#ede9fe;
            color:#6d28d9;
            font-size:11px;
            font-weight:800;
        ">
            Importação XML
        </div>

    </div>

    ${avisoExistente}

    <div style="
        display:grid;
        grid-template-columns:
            repeat(auto-fit,minmax(220px,1fr));
        gap:15px;
    ">

        <div>

            <label>
                Tipo do Produto
            </label>

            <div style="
                display:flex;
                gap:10px;
            ">

                <select
                    id="xml-produto-tipo"
                    style="flex:1;">

                    ${opcoesTiposProdutoXML(
                        dados.tipo || ''
                    )}

                </select>

                <button
                    class="btn-action"
                    type="button"
                    onclick="novoTipoProdutoImportacaoXML()">

                    +

                </button>

            </div>

        </div>

        <div>

            <label>
                Descrição
            </label>

            <input
                id="xml-produto-descricao"
                value="${escaparHTMLXML(
                    dados.descricao || ''
                )}">

        </div>

        <div>

            <label>
                Quantidade da Nota
            </label>

            <input
                type="number"
                step="0.0001"
                id="xml-produto-quantidade"
                value="${Number(
                    dados.quantidade || 0
                )}">

        </div>

        <div>

            <label>
                Valor Unitário Pago
            </label>

            <input
                type="number"
                step="0.0001"
                id="xml-produto-valor"
                value="${Number(
                    dados.valor || 0
                )}">

        </div>

        <div>

            <label>
                Fornecedor
            </label>

            <select
                id="xml-produto-fornecedor">

                ${opcoesFornecedorXML(
                    dados.fornecedor
                    ||
                    sessao.fornecedor.nome
                )}

            </select>

        </div>

    </div>

</div>
`;

    configModal({

        title:
            `📄 Conferir Produto do XML (${sessao.indiceAtual + 1}/${sessao.itens.length})`,

        body:
            html,

        size:
            'medium',

        confirmText:
            sessao.indiceAtual <
            sessao.itens.length - 1
                ? 'Salvar e Próximo'
                : 'Salvar e Finalizar',

        onConfirm:
            salvarProdutoImportacaoXML
    });
};


/* --------------------------------------------------------- */
/* guardarRascunhoProdutoXML                                 */
/* Guarda o formulário atual antes de abrir o cadastro tipo. */
/* --------------------------------------------------------- */

function guardarRascunhoProdutoXML() {

    const sessao =
        window.importacaoXMLAtual;

    if (!sessao) {
        return;
    }

    sessao.rascunhoAtual = {

        tipo:
            document.getElementById(
                'xml-produto-tipo'
            )?.value || '',

        descricao:
            document.getElementById(
                'xml-produto-descricao'
            )?.value || '',

        quantidade:
            Number(
                document.getElementById(
                    'xml-produto-quantidade'
                )?.value || 0
            ),

        valor:
            Number(
                document.getElementById(
                    'xml-produto-valor'
                )?.value || 0
            ),

        fornecedor:
            document.getElementById(
                'xml-produto-fornecedor'
            )?.value || ''

    };
}


/* --------------------------------------------------------- */
/* novoTipoProdutoImportacaoXML                              */
/* Cria tipo sem quebrar a sequência da importação.          */
/* --------------------------------------------------------- */

window.novoTipoProdutoImportacaoXML =
function () {

    guardarRascunhoProdutoXML();

    const html = `

        <label>
            Nome do Tipo
        </label>

        <input
            id="novo-tipo-produto-xml"
            placeholder="Ex: Matéria Prima">

    `;

    configModal({

        title:
            'Novo Tipo de Produto',

        body:
            html,

        confirmText:
            'Salvar',

        onConfirm:
        async function () {

            const nome =
                document
                    .getElementById(
                        'novo-tipo-produto-xml'
                    )
                    ?.value
                    .trim()
                || '';

            if (!nome) {

                alert(
                    'Digite um nome.'
                );

                return;
            }

            const existe =
                tipoProdutoJaExiste(
                    nome
                );

            if (!existe) {

                db.tiposProduto.push(
                    nome
                );

                /*
                    Também durante a importação XML, o novo tipo
                    entra automaticamente na posição alfabética.
                */

                ordenarTiposProdutoAlfabeticamente();

                await save();
            }

            if (
                window.importacaoXMLAtual
                ?.rascunhoAtual
            ) {

                window.importacaoXMLAtual
                    .rascunhoAtual
                    .tipo =
                        nome;
            }

            abrirProdutoImportacaoXML();
        }
    });
};


/* --------------------------------------------------------- */
/* salvarProdutoImportacaoXML                                */
/* Salva o item NA SESSÃO e abre automaticamente o próximo.  */
/* --------------------------------------------------------- */

window.salvarProdutoImportacaoXML =
async function () {

    const sessao =
        window.importacaoXMLAtual;

    if (!sessao) {
        return;
    }

    const itemBase =
        sessao.itens[
            sessao.indiceAtual
        ];

    if (!itemBase) {
        return;
    }

    const tipo =
        document.getElementById(
            'xml-produto-tipo'
        )?.value || '';

    if (!tipo) {

        alert(
            'Selecione o tipo do produto.'
        );

        return;
    }

    const descricao =
        document.getElementById(
            'xml-produto-descricao'
        )?.value.trim() || '';

    if (!descricao) {

        alert(
            'Informe a descrição do produto.'
        );

        return;
    }

    const quantidade =
        Number(
            document.getElementById(
                'xml-produto-quantidade'
            )?.value || 0
        );

    const valor =
        Number(
            document.getElementById(
                'xml-produto-valor'
            )?.value || 0
        );

    const fornecedor =
        document.getElementById(
            'xml-produto-fornecedor'
        )?.value || '';

    sessao.conferidos[
        sessao.indiceAtual
    ] = {

        tipo,

        descricao,

        descricaoOriginal:
            itemBase.descricaoOriginal,

        quantidade,

        valor,

        fornecedor,

        codigoExistente:
            itemBase.codigoExistente,

        nomeProdutoExistente:
            itemBase.nomeProdutoExistente
            || '',

        similaridadeProduto:
            itemBase.similaridadeProduto
            || 0,

        produtoExistente:
            itemBase.produtoExistente

    };

    sessao.indiceAtual++;

    /*
        Não grava o estoque ainda.
        Apenas muda para o próximo produto da mesma nota.
    */

    closeModal();

    setTimeout(
        () => {

            abrirProdutoImportacaoXML();

        },
        0
    );
};


/* --------------------------------------------------------- */
/* garantirFornecedorImportacaoXML                           */
/* Cadastra o fornecedor da nota somente se não existir.     */
/* --------------------------------------------------------- */

function garantirFornecedorImportacaoXML(
    sessao
) {

    const fornecedor =
        sessao.fornecedor;

    const documentoLimpo =
        fornecedor.documentoLimpo;

    let existente =
        (db.fornecedores || [])
            .find(
                item => {

                    const doc =
                        String(
                            item.documento
                            ||
                            item.cnpj
                            ||
                            item.cpfCnpj
                            ||
                            ''
                        )
                        .replace(/\D/g, '');

                    /*
                        Se o CNPJ/CPF é exatamente o mesmo,
                        o fornecedor já existe e NÃO deve
                        ser cadastrado novamente.
                    */

                    return (
                        documentoLimpo
                        &&
                        doc === documentoLimpo
                    );
                }
            );

    if (existente) {
        return existente;
    }

    /*
        Se o XML não tiver documento, tenta pelo nome
        antes de criar outro fornecedor.
    */

    if (!documentoLimpo) {

        existente =
            (db.fornecedores || [])
                .find(
                    item =>
                        String(
                            item.nome || ''
                        )
                        .trim()
                        .toLowerCase()
                        ===
                        String(
                            fornecedor.nome || ''
                        )
                        .trim()
                        .toLowerCase()
                );

        if (existente) {
            return existente;
        }
    }

    if (
        !fornecedor.nome
        &&
        !documentoLimpo
    ) {

        return null;
    }

    const novoFornecedor = {

        nome:
            fornecedor.nome,

        documento:
            formatarDocumentoXML(
                documentoLimpo
            ),

        razaoSocial:
            fornecedor.nome,

        fantasia:
            fornecedor.nome,

        endereco:
            [
                fornecedor.endereco,
                fornecedor.numero
                    ? `, ${fornecedor.numero}`
                    : '',
                fornecedor.bairro
                    ? ` - ${fornecedor.bairro}`
                    : '',
                fornecedor.cidade
                    ? ` - ${fornecedor.cidade}`
                    : '',
                fornecedor.uf
                    ? `/${fornecedor.uf}`
                    : ''
            ].join(''),

        contato:
            '',

        personalidade:
            documentoLimpo.length > 11
                ? 'PJ'
                : 'PF',

        dataCadastro:
            new Date().toISOString()

    };

    db.fornecedores.push(
        novoFornecedor
    );

    return novoFornecedor;
}


/* --------------------------------------------------------- */
/* aplicarProdutosImportacaoXML                              */
/* Grava ou atualiza todos os produtos conferidos.           */
/* --------------------------------------------------------- */

function aplicarProdutosImportacaoXML(
    sessao
) {

    sessao.conferidos.forEach(
        item => {

            let produtoExistente =
                null;

            if (
                item.codigoExistente !== null
                &&
                item.codigoExistente !== undefined
            ) {

                produtoExistente =
                    db.produtos.find(
                        produto =>
                            String(produto.codigo)
                            ===
                            String(item.codigoExistente)
                    );
            }

            if (!produtoExistente) {

                const correspondencia =
                    localizarProdutoSemelhanteXML(
                        item.descricaoOriginal
                        ||
                        item.descricao
                    );

                produtoExistente =
                    correspondencia?.produto
                    || null;
            }

            if (produtoExistente) {

                produtoExistente.quantidade =
                    Number(
                        produtoExistente.quantidade || 0
                    )
                    +
                    Number(
                        item.quantidade || 0
                    );

                produtoExistente.tipo =
                    item.tipo;

                produtoExistente.descricao =
                    item.descricao;

                produtoExistente.valor =
                    Number(
                        item.valor || 0
                    );

                produtoExistente.fornecedor =
                    item.fornecedor;

                return;
            }

            db.produtos.push({

                codigo:
                    db.produtos.length + 1,

                tipo:
                    item.tipo,

                descricao:
                    item.descricao,

                quantidade:
                    Number(
                        item.quantidade || 0
                    ),

                valor:
                    Number(
                        item.valor || 0
                    ),

                fornecedor:
                    item.fornecedor,

                dataCadastro:
                    new Date().toISOString(),

                origem:
                    'xml',

                chaveXML:
                    sessao.chave
            });
        }
    );
}



/* --------------------------------------------------------- */
/* formatarNumeroParcelaXML                                  */
/* Ex.: parcela 1 de 3 -> 001/003                            */
/* --------------------------------------------------------- */

function formatarNumeroParcelaXML(
    numeroOriginal,
    indice,
    totalParcelas
) {

    let atual =
        String(
            numeroOriginal
            || ''
        )
        .trim();

    /*
        Quando o XML já traz número puramente numérico,
        preservamos o valor e garantimos no mínimo 3 dígitos.
    */

    if (
        !atual
        ||
        /^\d+$/.test(atual)
    ) {

        atual =
            String(
                Number(
                    atual
                    ||
                    indice + 1
                )
            )
            .padStart(
                3,
                '0'
            );
    }

    const total =
        String(
            Math.max(
                1,
                Number(
                    totalParcelas || 1
                )
            )
        )
        .padStart(
            3,
            '0'
        );

    return `${atual}/${total}`;
}


/* --------------------------------------------------------- */
/* registrarFinanceiroImportacaoXML                          */
/* Gera as Contas a Pagar a partir das duplicatas da NF.     */
/* --------------------------------------------------------- */

function registrarFinanceiroImportacaoXML(
    sessao
) {

    /*
        Proteção extra:
        se por algum motivo já existir lançamento com a mesma
        chaveXML, não cria o financeiro novamente.
    */

    const financeiroJaCriado =
        (db.financeiro || [])
            .some(
                lancamento =>
                    lancamento.chaveXML
                    &&
                    String(
                        lancamento.chaveXML
                    )
                    ===
                    String(
                        sessao.chave
                    )
            );

    if (financeiroJaCriado) {

        return 0;
    }

    const fornecedorNome =
        sessao.fornecedor.nome
        || 'Fornecedor';

    const numeroNota =
        sessao.numeroNota
        || '-';

    let quantidadeLancamentos =
        0;

    if (
        Array.isArray(
            sessao.duplicatas
        )
        &&
        sessao.duplicatas.length
    ) {

        sessao.duplicatas.forEach(
            (dup, indice) => {

                if (
                    Number(
                        dup.valor || 0
                    ) <= 0
                ) {

                    return;
                }

                db.financeiro.push({

                    tipo:
                        'Pagar',

                    nome:
                        fornecedorNome,

                    descricao:
                        `Compra XML - NF ${numeroNota} - ${fornecedorNome} - Parcela ${formatarNumeroParcelaXML(
                            dup.numero,
                            indice,
                            sessao.duplicatas.length
                        )}`,

                    valor:
                        Number(
                            dup.valor
                        ),

                    vencimento:
                        dup.vencimento
                        ||
                        sessao.dataEmissao
                        ||
                        new Date()
                            .toISOString()
                            .split('T')[0],

                    status:
                        'Pendente',

                    dataPagamento:
                        null,

                    tipoConta:
                        'Matéria Prima/Estoque',

                    dataCadastro:
                        new Date().toISOString(),

                    origem:
                        'xml',

                    chaveXML:
                        sessao.chave,

                    numeroNota:
                        sessao.numeroNota,

                    parcelaXML:
                        dup.numero
                        || String(
                            indice + 1
                        )

                });

                quantidadeLancamentos++;
            }
        );
    }

    /*
        XML sem <dup>:
        cria uma única Conta a Pagar usando o valor total da NF.
    */

    else if (
        Number(
            sessao.valorNota || 0
        ) > 0
    ) {

        db.financeiro.push({

            tipo:
                'Pagar',

            nome:
                fornecedorNome,

            descricao:
                `Compra XML - NF ${numeroNota} - ${fornecedorNome} - Parcela 001/001`,

            valor:
                Number(
                    sessao.valorNota
                ),

            vencimento:
                sessao.dataEmissao
                ||
                new Date()
                    .toISOString()
                    .split('T')[0],

            status:
                'Pendente',

            dataPagamento:
                null,

            tipoConta:
                'Matéria Prima/Estoque',

            dataCadastro:
                new Date().toISOString(),

            origem:
                'xml',

            chaveXML:
                sessao.chave,

            numeroNota:
                sessao.numeroNota

        });

        quantidadeLancamentos++;
    }

    return quantidadeLancamentos;
}


/* --------------------------------------------------------- */
/* registrarHistoricoImportacaoXML                           */
/* Marca a nota como importada para bloquear repetição.      */
/* --------------------------------------------------------- */

function registrarHistoricoImportacaoXML(
    sessao
) {

    const historico =
        garantirHistoricoXML();

    const jaExiste =
        historico.some(
            item =>
                String(item?.chave || '')
                ===
                String(sessao.chave || '')
        );

    if (jaExiste) {
        return;
    }

    historico.push({

        chave:
            sessao.chave,

        numeroNota:
            sessao.numeroNota,

        serie:
            sessao.serie,

        dataEmissao:
            sessao.dataEmissao,

        fornecedor:
            sessao.fornecedor.nome,

        documentoFornecedor:
            formatarDocumentoXML(
                sessao.fornecedor.documentoLimpo
            ),

        valorNota:
            Number(
                sessao.valorNota || 0
            ),

        quantidadeItens:
            sessao.itens.length,

        // Guarda uma fotografia dos materiais da NF para consultas futuras.
        // Não modifica os produtos cadastrados nem as quantidades em estoque.
        itens:
            sessao.itens.map(produto => ({
                codigo: String(produto.codigoXML || ''),
                descricao: String(produto.descricaoOriginal || produto.descricao || ''),
                quantidade: Number(produto.quantidade || 0),
                unidade: String(produto.unidadeXML || ''),
                valorUnitario: Number(produto.valor || 0),
                valorTotal: Number(produto.valorTotal || 0)
            })),

        quantidadeDuplicatas:
            sessao.duplicatas.length,

        nomeArquivo:
            sessao.nomeArquivo,

        importadoEm:
            new Date().toISOString()
    });
}


/* --------------------------------------------------------- */
/* finalizarImportacaoXML                                    */
/* Faz a gravação definitiva de estoque + financeiro + log.  */
/* --------------------------------------------------------- */

window.finalizarImportacaoXML =
async function () {

    const sessao =
        window.importacaoXMLAtual;

    if (
        !sessao
        ||
        sessao.finalizada
    ) {

        return;
    }

    /*
        Verifica a chave novamente antes da gravação final.
    */

    if (
        localizarXMLJaImportado(
            sessao.chave,
            {
                numeroNota:
                    sessao.numeroNota,

                serie:
                    sessao.serie,

                documentoFornecedor:
                    sessao.fornecedor
                        ?.documentoLimpo
                    || ''
            }
        )
    ) {

        window.importacaoXMLAtual =
            null;

        closeModal();

        alert(
            'Este XML já consta como importado. A operação foi cancelada para evitar duplicidade.'
        );

        return;
    }

    if (
        sessao.conferidos.length <
        sessao.itens.length
    ) {

        alert(
            'Ainda existem produtos do XML para conferir.'
        );

        return;
    }

    try {

        garantirFornecedorImportacaoXML(
            sessao
        );

        aplicarProdutosImportacaoXML(
            sessao
        );

        const lancamentosFinanceiros =
            registrarFinanceiroImportacaoXML(
                sessao
            );

        registrarHistoricoImportacaoXML(
            sessao
        );

        sessao.finalizada =
            true;

        await save();

        window.importacaoXMLAtual =
            null;

        closeModal();

        navigate(
            'estoque'
        );

        alert(
            '✅ XML importado com sucesso!\n\n' +
            `Produtos conferidos: ${sessao.itens.length}\n` +
            `Lançamentos no financeiro: ${lancamentosFinanceiros}\n` +
            `NF: ${sessao.numeroNota || '-'}`
        );

    }

    catch (erro) {

        console.error(
            'Erro ao finalizar importação XML:',
            erro
        );

        sessao.finalizada =
            false;

        alert(
            'Ocorreu um erro ao finalizar a importação do XML.'
        );
    }
};


/* ========================================================= */
/* 11.1 GERENCIAR TIPOS DE PRODUTO - CADASTRO E EDIÇÃO      */
/* ========================================================= */
/*
    O banco atual guarda os tipos como strings no array
    db.tiposProduto e os produtos vinculam-se pelo campo tipo.
    Ao editar uma categoria, todos os produtos associados são
    atualizados para que a consulta continue encontrando-os.
    Não excluímos tipos aqui para não deixar vínculos órfãos.
*/

function escaparHTMLGerenciarTipo(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function chaveGerenciarTipo(valor) {
    return String(valor || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}

window.abrirGerenciarTiposProduto = function () {
    if (!Array.isArray(db.tiposProduto)) db.tiposProduto = [];
    if (!Array.isArray(db.produtos)) db.produtos = [];
    ordenarTiposProdutoAlfabeticamente();

    const linhas = db.tiposProduto.map((tipo, indice) => {
        const quantidade = db.produtos.filter(p =>
            chaveGerenciarTipo(p.tipo) === chaveGerenciarTipo(tipo)
        ).length;
        return `
            <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                    ${escaparHTMLGerenciarTipo(tipo)}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    ${quantidade}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">
                    <button type="button" class="btn-action" style="background:#2563eb;"
                        onclick="editarTipoProdutoGerenciado(${indice})">✏️ Editar</button>
                </td>
            </tr>`;
    }).join('');

    configModal({
        title: 'Gerenciar Tipos de Produto',
        body: `
            <div style="display:flex;flex-direction:column;gap:16px;">
                <div style="color:#64748b;font-size:13px;">
                    Cadastre novos tipos e edite os existentes. A edição atualiza
                    automaticamente os produtos vinculados.
                </div>
                <div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:220px;">
                        <label for="gerenciar-tipo-novo">Novo tipo de produto</label>
                        <input id="gerenciar-tipo-novo" maxlength="100"
                            placeholder="Ex.: Lonas, Adesivos, Placas PVC">
                    </div>
                    <button type="button" class="btn-action" style="background:#16a34a;"
                        onclick="cadastrarTipoProdutoGerenciado()">+ Cadastrar tipo</button>
                </div>
                <div style="overflow-x:auto;max-height:410px;overflow-y:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead><tr>
                            <th style="text-align:left;">Tipo de produto</th>
                            <th style="text-align:center;">Produtos</th>
                            <th style="text-align:right;">Ações</th>
                        </tr></thead>
                        <tbody>${linhas || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#64748b;">Nenhum tipo cadastrado.</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`,
        confirmText: 'Fechar',
        onConfirm: () => closeModal()
    });
};

window.cadastrarTipoProdutoGerenciado = async function () {
    const campo = document.getElementById('gerenciar-tipo-novo');
    const nome = String(campo?.value || '').trim();
    if (!nome) return alert('Informe o nome do tipo de produto.');
    if (tipoProdutoJaExiste(nome)) return alert('Esse tipo de produto já está cadastrado.');

    db.tiposProduto.push(nome);
    ordenarTiposProdutoAlfabeticamente();
    try {
        await save();
        abrirGerenciarTiposProduto();
    } catch (erro) {
        db.tiposProduto = db.tiposProduto.filter(x => x !== nome);
        console.error('Erro ao salvar tipo de produto:', erro);
        alert('Não foi possível salvar. Tente novamente.');
    }
};

window.editarTipoProdutoGerenciado = function (indice) {
    ordenarTiposProdutoAlfabeticamente();
    const tipoAntigo = db.tiposProduto[indice];
    if (typeof tipoAntigo !== 'string') return abrirGerenciarTiposProduto();

    const relacionados = (db.produtos || []).filter(p =>
        chaveGerenciarTipo(p.tipo) === chaveGerenciarTipo(tipoAntigo)
    ).length;

    configModal({
        title: 'Editar Tipo de Produto',
        body: `
            <label for="tipo-produto-edicao">Nome do tipo</label>
            <input id="tipo-produto-edicao" maxlength="100"
                value="${escaparHTMLGerenciarTipo(tipoAntigo)}">
            <p style="margin-top:12px;color:#64748b;font-size:12px;">
                ${relacionados} produto(s) vinculado(s) serão atualizados com o novo nome.
            </p>`,
        confirmText: 'Salvar alteração',
        onConfirm: async () => {
            const novoNome = String(document.getElementById('tipo-produto-edicao')?.value || '').trim();
            if (!novoNome) return alert('O nome do tipo não pode ficar vazio.');
            if (chaveGerenciarTipo(novoNome) !== chaveGerenciarTipo(tipoAntigo)
                && tipoProdutoJaExiste(novoNome)) {
                return alert('Já existe outro tipo com esse nome.');
            }
            const posicao = db.tiposProduto.findIndex(x => x === tipoAntigo);
            if (posicao < 0) return alert('Este tipo não foi encontrado. Abra o gerenciamento novamente.');
            const alterados = [];
            db.produtos.forEach(produto => {
                if (chaveGerenciarTipo(produto.tipo) === chaveGerenciarTipo(tipoAntigo)) {
                    alterados.push([produto, produto.tipo]);
                    produto.tipo = novoNome;
                }
            });
            db.tiposProduto[posicao] = novoNome;
            ordenarTiposProdutoAlfabeticamente();
            try {
                await save();
                abrirGerenciarTiposProduto();
            } catch (erro) {
                db.tiposProduto = db.tiposProduto.filter(x => x !== novoNome);
                db.tiposProduto.push(tipoAntigo);
                ordenarTiposProdutoAlfabeticamente();
                alterados.forEach(([produto, tipo]) => { produto.tipo = tipo; });
                console.error('Erro ao atualizar tipo de produto:', erro);
                alert('A alteração não pôde ser salva.');
            }
        }
    });
};

/* ========================================================= */
/* 12. REGISTRAR PÁGINA NO SISTEMA                          */
/* ========================================================= */
/*
    Registra a tela com o nome:

        estoque

    Assim, navigate('estoque') consegue renderizar
    esta página dentro do view-port.
*/

registerPage(
    'estoque',
    renderEstoque
);