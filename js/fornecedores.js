/* ========================================================= */
/* DOMINUS ERP - FORNECEDORES.JS                             */
/* ========================================================= */
/*
    CADASTRO, CONSULTA E GERENCIAMENTO DE FORNECEDORES

    Este arquivo controla toda a tela de Fornecedores
    do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Controlar a paginação da listagem
    2. Renderizar a tabela de fornecedores
    3. Cadastrar novos fornecedores
    4. Evitar fornecedores duplicados pelo nome
    5. Salvar novos registros no banco
    6. Visualizar dados em modo somente leitura
    7. Editar fornecedores existentes
    8. Evitar duplicidade durante a edição
    9. Excluir fornecedores
    10. Abrir a consulta de fornecedores
    11. Filtrar por nome, documento, cidade e UF
    12. Registrar a página "fornecedores" no sistema

    IMPORTANTE:
    A única alteração funcional desta versão é a ordem visual
    alfabética pelo Nome Fantasia do fornecedor.

    O banco, os registros e os índices originais permanecem
    exatamente como estavam.
*/


/* ========================================================= */
/* 01. CONTROLE DE PAGINAÇÃO DOS FORNECEDORES               */
/* ========================================================= */
/*
    paginaFornecedores:
        página atualmente exibida.

    limiteFornecedores:
        quantidade máxima de registros por página.
*/

window.paginaFornecedores = 1;
window.limiteFornecedores = 15;


/* ========================================================= */
/* 01.1 ORDEM ALFABÉTICA DOS FORNECEDORES                   */
/* ========================================================= */
/*
    ordenarFornecedoresPorNome(lista)

    Cria uma cópia da lista para exibição e ordena por:
    1. Nome Fantasia
    2. Nome / Razão Social como alternativa

    IMPORTANTE:
    db.fornecedores não é reordenado.
    As ações continuam usando o índice real do fornecedor
    dentro do banco.
*/

/* --------------------------------------------------------- */
/* ordenarFornecedoresPorNome                                */
/* Retorna uma cópia em ordem alfabética.                    */
/* --------------------------------------------------------- */

function ordenarFornecedoresPorNome(
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
        (a, b) => {

            const nomeA =
                String(
                    a?.fantasia
                    ||
                    a?.nome
                    ||
                    ''
                );

            const nomeB =
                String(
                    b?.fantasia
                    ||
                    b?.nome
                    ||
                    ''
                );

            return nomeA.localeCompare(
                nomeB,
                'pt-BR',
                {
                    sensitivity:'base'
                }
            );
        }
    );
}


/* ========================================================= */
/* 02. RENDERIZAÇÃO DA PÁGINA DE FORNECEDORES               */
/* ========================================================= */
/*
    renderFornecedores()

    Monta:
    - cabeçalho
    - botão Consultar
    - botão Novo Fornecedor
    - tabela principal
    - ações Visualizar / Editar / Remover
    - controles de paginação
*/

/* --------------------------------------------------------- */
/* renderFornecedores */
/* Renderiza a página atual de fornecedores. */
/* --------------------------------------------------------- */

window.renderFornecedores = function () {

    if (!db.fornecedores) {
        db.fornecedores = [];
    }
    const inicio =
    (window.paginaFornecedores - 1) *
    window.limiteFornecedores;


const fim =
    inicio +
    window.limiteFornecedores;


/* ===================================================== */
/* 02.1 ORDENAR ANTES DE PAGINAR                        */
/* ===================================================== */
/*
    A ordenação acontece apenas na cópia usada pela tela.
    Depois disso é aplicado o recorte da página atual.
*/

const fornecedoresOrdenados =
    ordenarFornecedoresPorNome(
        db.fornecedores
    );

const fornecedoresTela =
    fornecedoresOrdenados.slice(
        inicio,
        fim
    );

    let html = `

<div style="
    display:flex;
    flex-direction:column;
    gap:20px;
">

    <!-- 02.1 CABEÇALHO E AÇÕES DA PÁGINA -->

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
                Fornecedores
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Cadastro e gerenciamento de fornecedores
            </div>

        </div>

        <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        ">

            <button
                class="btn-action"
                onclick="abrirConsultaFornecedor()">

                🔍 Consultar

            </button>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirNovoFornecedor()">

                + Novo Fornecedor

            </button>

        </div>

    </div>

    <!-- 02.2 TABELA PRINCIPAL DE FORNECEDORES -->

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

        
        <th>Nome Fantasia</th>
        <th>Documento</th>
        <th>Contato</th>
        <th>Ações</th>

    </tr>

</thead>

            <tbody>
`;

    if (db.fornecedores.length === 0) {

        html += `

<tr>

    <td
        colspan="4"
        style="
            text-align:center;
            padding:30px;
            color:#6b7280;
        ">

        Nenhum fornecedor cadastrado

    </td>

</tr>
`;
    }

  fornecedoresTela.forEach(fornecedor => {

    /* ===================================================== */
    /* 02.3 ÍNDICE REAL DO FORNECEDOR                       */
    /* ===================================================== */
    /*
        A posição na lista alfabética é apenas visual.
        Para editar, visualizar ou excluir, buscamos o índice
        verdadeiro dentro de db.fornecedores.
    */

    const idx =
        db.fornecedores.indexOf(
            fornecedor
        );

        html += `

<tr>

   

    <td>
        ${fornecedor.fantasia || '-'}
    </td>

    <td>
        ${fornecedor.documento || '-'}
    </td>

    <td>
        ${
            fornecedor.telefone ||
            fornecedor.email ||
            fornecedor.contato ||
            '-'
        }
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
                "
                onclick="visualizarFornecedor(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    padding:6px 10px;
                    font-size:12px;
                    background:#f59e0b;
                "
                onclick="editarFornecedor(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="excluirFornecedor(${idx})">

                🗑 Remover

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
<!-- 02.3 CONTROLES DE PAGINAÇÃO -->

<div style="
    display:flex;
    justify-content:center;
    align-items:center;
    gap:15px;
    margin-top:20px;
">

<button
    class="btn-action"
    onclick="paginaAnteriorFornecedores()"
    ${window.paginaFornecedores <= 1 ? 'disabled' : ''}>

⬅ Voltar

</button>


<span style="
    font-weight:600;
">

Página ${window.paginaFornecedores}

</span>


<button
    class="btn-action"
    onclick="proximaPaginaFornecedores()"
    ${
        fim >= db.fornecedores.length
        ? 'disabled'
        : ''
    }>

Próxima ➡

</button>

</div>

</div>
`;

    return html;
};
/* ========================================================= */
/* 03. FUNÇÕES DE NAVEGAÇÃO DA PAGINAÇÃO                    */
/* ========================================================= */
/*
    proximaPaginaFornecedores()
        avança uma página quando houver próxima página.

    paginaAnteriorFornecedores()
        retorna uma página quando possível.
*/


/* --------------------------------------------------------- */
/* proximaPaginaFornecedores */
/* Avança para a próxima página quando existir. */
/* --------------------------------------------------------- */

window.proximaPaginaFornecedores = function(){


    const totalPaginas =
        Math.ceil(
            db.fornecedores.length /
            window.limiteFornecedores
        );


    if(
        window.paginaFornecedores <
        totalPaginas
    ){

        window.paginaFornecedores++;


        navigate(
            'fornecedores',
            false
        );

    }

};



/* --------------------------------------------------------- */
/* paginaAnteriorFornecedores */
/* Volta uma página quando possível. */
/* --------------------------------------------------------- */

window.paginaAnteriorFornecedores = function(){


    if(
        window.paginaFornecedores > 1
    ){

        window.paginaFornecedores--;


        navigate(
            'fornecedores',
            false
        );

    }

};
/* ========================================================= */
/* 04. CADASTRO DE NOVO FORNECEDOR                          */
/* ========================================================= */
/*
    abrirNovoFornecedor(dados)

    Abre o formulário reutilizado para:
    - cadastro
    - visualização
    - edição

    Campos:
    - nome / razão social
    - documento
    - nome fantasia
    - contato
    - e-mail
    - telefone
    - endereço
    - cidade
    - UF
    - observações
*/

/* --------------------------------------------------------- */
/* abrirNovoFornecedor */
/* Abre o formulário reutilizado de fornecedor. */
/* --------------------------------------------------------- */

window.abrirNovoFornecedor = function (dados = {}) {

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

        <!-- 04.1 NOME / RAZÃO SOCIAL -->

        <div>

            <label>
                Nome / Razão Social
            </label>

            <input
                id="fornecedor-nome"
                value="${dados.nome || ''}">

        </div>

        <!-- 04.2 DOCUMENTO -->

        <div>

            <label>
                Documento
            </label>

            <input
                id="fornecedor-documento"
                value="${dados.documento || ''}">

        </div>

        <!-- 04.3 NOME FANTASIA -->

        <div>

            <label>
                Nome Fantasia
            </label>

            <input
                id="fornecedor-fantasia"
                value="${dados.fantasia || ''}">

        </div>

        <!-- 04.4 CONTATO -->

        <div>

            <label>
                Contato
            </label>

            <input
                id="fornecedor-contato"
                value="${dados.contato || ''}">

        </div>

        <!-- 04.5 E-MAIL -->

        <div>

            <label>
                Email
            </label>

            <input
                id="fornecedor-email"
                value="${dados.email || ''}">

        </div>

        <!-- 04.6 TELEFONE -->

        <div>

            <label>
                Telefone
            </label>

            <input
                id="fornecedor-telefone"
                value="${dados.telefone || ''}">

        </div>

        <!-- 04.7 ENDEREÇO -->

        <div style="
            grid-column:span 2;
        ">

            <label>
                Endereço
            </label>

            <input
                id="fornecedor-endereco"
                value="${dados.endereco || ''}">

        </div>

        <!-- 04.8 CIDADE -->

        <div>

            <label>
                Cidade
            </label>

            <input
                id="fornecedor-cidade"
                value="${dados.cidade || ''}">

        </div>

        <!-- 04.9 UF -->

        <div>

            <label>
                UF
            </label>

            <input
                id="fornecedor-uf"
                value="${dados.uf || ''}">

        </div>

        <!-- 04.10 OBSERVAÇÕES -->

        <div style="
            grid-column:span 2;
        ">

            <label>
                Observações
            </label>

            <textarea
                id="fornecedor-observacoes"
                style="
                    min-height:90px;
                    resize:vertical;
                "
            >${dados.observacoes || ''}</textarea>

        </div>

    </div>

</div>
`;

    configModal({

        title:
            dados.editando
                ? 'Editar Fornecedor'
                : 'Novo Fornecedor',

        body: html,

        size:'large',

        confirmText:'Salvar',

        onConfirm() {

            salvarNovoFornecedor();
        }
    });
};
/* ========================================================= */
/* 05. SALVAR NOVO FORNECEDOR                               */
/* ========================================================= */
/*
    salvarNovoFornecedor()

    Valida o nome, impede duplicidade e adiciona o
    fornecedor em db.fornecedores.
*/

/* --------------------------------------------------------- */
/* salvarNovoFornecedor */
/* Valida e salva um novo fornecedor. */
/* --------------------------------------------------------- */

window.salvarNovoFornecedor = function () {

    const nome =
        document
            .getElementById(
                'fornecedor-nome'
            )
            .value
            .trim();

    if (!nome) {

        alert(
            'Informe o nome do fornecedor.'
        );

        return;
    }

    /* ===================================================== */
    /* 05.1 EVITAR FORNECEDOR DUPLICADO                      */
    /* ===================================================== */
    /*
        Compara o nome de forma normalizada e não permite
        cadastrar outro fornecedor com o mesmo nome.
    */

    const existe =
        db.fornecedores.find(f =>

            f.nome
                ?.trim()
                .toLowerCase() ===

            nome
                .toLowerCase()
        );

    if (existe) {

        alert(
            'Já existe um fornecedor com este nome.'
        );

        return;
    }

    const fornecedor = {

        nome,

        documento:
            document
                .getElementById(
                    'fornecedor-documento'
                )
                .value,

        fantasia:
            document
                .getElementById(
                    'fornecedor-fantasia'
                )
                .value,

        contato:
            document
                .getElementById(
                    'fornecedor-contato'
                )
                .value,

        email:
            document
                .getElementById(
                    'fornecedor-email'
                )
                .value,

        telefone:
            document
                .getElementById(
                    'fornecedor-telefone'
                )
                .value,

        endereco:
            document
                .getElementById(
                    'fornecedor-endereco'
                )
                .value,

        cidade:
            document
                .getElementById(
                    'fornecedor-cidade'
                )
                .value,

        uf:
            document
                .getElementById(
                    'fornecedor-uf'
                )
                .value,

        observacoes:
            document
                .getElementById(
                    'fornecedor-observacoes'
                )
                .value,

        dataCadastro:
            new Date()
                .toISOString()
    };

    db.fornecedores.push(
        fornecedor
    );

    save();

    closeModal();

    navigate(
        'fornecedores'
    );
};

/* ========================================================= */
/* 06. EXCLUIR FORNECEDOR                                   */
/* ========================================================= */
/*
    excluirFornecedor(idx)

    Solicita confirmação, remove o registro,
    salva o banco e atualiza a tela.
*/

/* --------------------------------------------------------- */
/* excluirFornecedor */
/* Exclui um fornecedor após confirmação. */
/* --------------------------------------------------------- */

window.excluirFornecedor = function (idx) {

    const confirmar =
        confirm(
            'Deseja excluir este fornecedor?'
        );

    if (!confirmar) return;

    db.fornecedores.splice(
        idx,
        1
    );

    save();

    navigate(
        'fornecedores'
    );
};
/* ========================================================= */
/* 07. VISUALIZAR FORNECEDOR                                */
/* ========================================================= */
/*
    visualizarFornecedor(idx)

    Reutiliza o formulário, bloqueia os campos
    e transforma o botão principal em "Fechar".
*/

/* --------------------------------------------------------- */
/* visualizarFornecedor */
/* Abre o fornecedor em modo somente leitura. */
/* --------------------------------------------------------- */

window.visualizarFornecedor = function (idx) {

    const fornecedor =
        db.fornecedores[idx];

    abrirNovoFornecedor(
        fornecedor
    );

    /* ===================================================== */
    /* 07.1 ALTERAR TÍTULO DO MODAL                          */
    /* ===================================================== */

    const titulo =
        document.getElementById(
            'modal-title'
        );

    if (titulo) {

        titulo.innerText =
            'Visualizar Fornecedor';
    }

    /* ===================================================== */
    /* 07.2 BLOQUEAR CAMPOS DO FORMULÁRIO                    */
    /* ===================================================== */

    const campos = [

        'fornecedor-nome',
        'fornecedor-documento',
        'fornecedor-fantasia',
        'fornecedor-contato',
        'fornecedor-email',
        'fornecedor-telefone',
        'fornecedor-endereco',
        'fornecedor-cidade',
        'fornecedor-uf',
        'fornecedor-observacoes'
    ];

    campos.forEach(id => {

        const campo =
            document.getElementById(
                id
            );

        if (campo) {

            campo.disabled = true;
        }
    });

    /* ===================================================== */
    /* 07.3 TRANSFORMAR BOTÃO EM FECHAR                      */
    /* ===================================================== */

    const btn =
        document.getElementById(
            'modal-confirm'
        );

    if (btn) {

        btn.innerText =
            'Fechar';

        btn.onclick =
            closeModal;
    }
};

/* ========================================================= */
/* 08. EDITAR FORNECEDOR                                    */
/* ========================================================= */
/*
    editarFornecedor(idx)

    Reabre o formulário preenchido e atualiza o
    registro existente após validação.
*/

/* --------------------------------------------------------- */
/* editarFornecedor */
/* Permite editar um fornecedor existente. */
/* --------------------------------------------------------- */

window.editarFornecedor = function (idx) {

    const fornecedor =
        db.fornecedores[idx];

    abrirNovoFornecedor(
        fornecedor
    );

    const btn =
        document.getElementById(
            'modal-confirm'
        );

    btn.onclick =
        function () {

        const novoNome =
            document
                .getElementById(
                    'fornecedor-nome'
                )
                .value
                .trim();

        if (!novoNome) {

            alert(
                'Informe o nome do fornecedor.'
            );

            return;
        }

        /* ===================================================== */
        /* 08.1 VALIDAR DUPLICIDADE NA EDIÇÃO                    */
        /* ===================================================== */
        /*
            Impede que o novo nome seja igual ao de outro
            fornecedor, ignorando o próprio registro editado.
        */

        const existe =
            db.fornecedores.find(
                (f, i) =>

                    i !== idx &&

                    f.nome
                        ?.trim()
                        .toLowerCase() ===

                    novoNome
                        .toLowerCase()
            );

        if (existe) {

            alert(
                'Já existe outro fornecedor com esse nome.'
            );

            return;
        }

        fornecedor.nome =
            novoNome;

        fornecedor.documento =
            document
                .getElementById(
                    'fornecedor-documento'
                )
                .value;

        fornecedor.fantasia =
            document
                .getElementById(
                    'fornecedor-fantasia'
                )
                .value;

        fornecedor.contato =
            document
                .getElementById(
                    'fornecedor-contato'
                )
                .value;

        fornecedor.email =
            document
                .getElementById(
                    'fornecedor-email'
                )
                .value;

        fornecedor.telefone =
            document
                .getElementById(
                    'fornecedor-telefone'
                )
                .value;

        fornecedor.endereco =
            document
                .getElementById(
                    'fornecedor-endereco'
                )
                .value;

        fornecedor.cidade =
            document
                .getElementById(
                    'fornecedor-cidade'
                )
                .value;

        fornecedor.uf =
            document
                .getElementById(
                    'fornecedor-uf'
                )
                .value;

        fornecedor.observacoes =
            document
                .getElementById(
                    'fornecedor-observacoes'
                )
                .value;

        save();

        closeModal();

        navigate(
            'fornecedores'
        );
    };
};
/* ========================================================= */
/* 09. CONSULTA DE FORNECEDORES                             */
/* ========================================================= */
/*
    abrirConsultaFornecedor()

    Abre um modal de consulta por:
    - nome
    - documento
    - cidade
    - UF
*/

/* --------------------------------------------------------- */
/* abrirConsultaFornecedor */
/* Abre a consulta de fornecedores. */
/* --------------------------------------------------------- */

window.abrirConsultaFornecedor =
function () {

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

        <div>

            <label>
                Nome
            </label>

            <input
                id="consulta-fornecedor-nome"
                placeholder="Nome fornecedor">

        </div>

        <div>

            <label>
                Documento
            </label>

            <input
                id="consulta-fornecedor-doc"
                placeholder="CPF / CNPJ">

        </div>

        <div>

            <label>
                Cidade
            </label>

            <input
                id="consulta-fornecedor-cidade"
                placeholder="Cidade">

        </div>

        <div>

            <label>
                UF
            </label>

            <input
                id="consulta-fornecedor-uf"
                placeholder="UF">

        </div>

    </div>

    <div style="
        display:flex;
        justify-content:flex-end;
    ">

        <button
            class="btn-action"
            onclick="
                filtrarConsultaFornecedor()
            ">

            🔍 Consultar

        </button>

    </div>

    <div
        id="resultado-consulta-fornecedor">

    </div>

</div>
`;

    configModal({

        title:
            'Consultar Fornecedores',

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
};

/* ========================================================= */
/* 10. FILTRAR RESULTADOS DA CONSULTA                       */
/* ========================================================= */
/*
    filtrarConsultaFornecedor()

    Filtra db.fornecedores e monta a tabela de
    resultados com ações de Visualizar / Editar / Excluir.
*/

/* --------------------------------------------------------- */
/* filtrarConsultaFornecedor */
/* Aplica os filtros e renderiza os resultados. */
/* --------------------------------------------------------- */

window.filtrarConsultaFornecedor =
function () {

    const nome =
        document
            .getElementById(
                'consulta-fornecedor-nome'
            )
            .value
            .toLowerCase();

    const documento =
        document
            .getElementById(
                'consulta-fornecedor-doc'
            )
            .value
            .toLowerCase();

    const cidade =
        document
            .getElementById(
                'consulta-fornecedor-cidade'
            )
            .value
            .toLowerCase();

    const uf =
        document
            .getElementById(
                'consulta-fornecedor-uf'
            )
            .value
            .toLowerCase();

    /* ===================================================== */
    /* 10.1 ORDEM ALFABÉTICA DOS RESULTADOS                 */
    /* ===================================================== */

    let lista =
        ordenarFornecedoresPorNome(
            db.fornecedores
        );

    if (nome) {

        lista =
            lista.filter(f =>

                (f.nome || '')
                    .toLowerCase()
                    .includes(nome)
            );
    }

    if (documento) {

        lista =
            lista.filter(f =>

                (f.documento || '')
                    .toLowerCase()
                    .includes(documento)
            );
    }

    if (cidade) {

        lista =
            lista.filter(f =>

                (f.cidade || '')
                    .toLowerCase()
                    .includes(cidade)
            );
    }

    if (uf) {

        lista =
            lista.filter(f =>

                (f.uf || '')
                    .toLowerCase()
                    .includes(uf)
            );
    }

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

    <th>Nome</th>
    <th>Documento</th>
    <th>Contato</th>
    <th>Cidade</th>
    <th>Ações</th>

</tr>

</thead>

<tbody>
`;

    if (
        lista.length === 0
    ) {

        html += `

<tr>

    <td colspan="5"
        style="
            text-align:center;
            padding:25px;
            color:#6b7280;
        ">

        Nenhum fornecedor encontrado

    </td>

</tr>
`;
    }

    lista.forEach(
        fornecedor => {

        const idx =
            db.fornecedores
                .indexOf(
                    fornecedor
                );

        html += `

<tr>

    <td>
        ${fornecedor.nome || '-'}
    </td>

    <td>
        ${fornecedor.documento || '-'}
    </td>

    <td>
        ${fornecedor.contato || '-'}
    </td>

    <td>
        ${fornecedor.cidade || '-'}
    </td>

    <td>

        <div style="
            display:flex;
            gap:5px;
            justify-content:center;
            flex-wrap:nowrap;
        ">

            <button
                class="btn-action"
                style="
                    background:#2563eb !important;
                    padding:5px 8px;
                    font-size:11px;
                "
                onclick="
                    visualizarFornecedor(
                        ${idx}
                    )
                ">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:5px 8px;
                    font-size:11px;
                "
                onclick="
                    editarFornecedor(
                        ${idx}
                    )
                ">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:5px 8px;
                    font-size:11px;
                "
                onclick="
                    excluirFornecedor(
                        ${idx}
                    )
                ">

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

    document
        .getElementById(
            'resultado-consulta-fornecedor'
        )
        .innerHTML =
            html;
};

/* ========================================================= */
/* 11. REGISTRAR PÁGINA NO SISTEMA                          */
/* ========================================================= */
/*
    Registra a tela com o nome:

        fornecedores
*/

registerPage(
    'fornecedores',
    renderFornecedores
);