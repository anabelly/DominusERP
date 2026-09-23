/* ========================================================= */
/* DOMINUS ERP - CLIENTES.JS                                 */
/* ========================================================= */
/*
    CADASTRO, CONSULTA E GERENCIAMENTO DE CLIENTES

    Este arquivo controla toda a tela de Clientes do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Controlar a paginação da listagem
    2. Renderizar a tabela de clientes
    3. Cadastrar novos clientes
    4. Salvar novos registros no banco
    5. Visualizar dados em modo somente leitura
    6. Editar clientes existentes
    7. Excluir clientes
    8. Abrir a consulta avançada
    9. Filtrar clientes na consulta
    10. Integrar novo cliente ao fluxo de Orçamentos
    11. Registrar a página "clientes" no sistema

    IMPORTANTE:
    A única alteração funcional desta versão é a ordem visual
    alfabética pelo nome do cliente.

    O código do cliente, o conteúdo de db.clientes e os índices
    originais no banco NÃO são alterados.
*/


/* ========================================================= */
/* 01. CONTROLE DE PAGINAÇÃO DOS CLIENTES                   */
/* ========================================================= */
/*
    paginaClientes:
        página atualmente exibida.

    limiteClientes:
        quantidade máxima de registros por página.

    Esses valores são usados tanto na renderização quanto
    nos botões Próxima / Voltar.
*/

window.paginaClientes = 1;
window.limiteClientes = 15;


/* ========================================================= */
/* 01.1 ORDEM ALFABÉTICA DOS CLIENTES                       */
/* ========================================================= */
/*
    ordenarClientesPorNome(lista)

    Cria uma CÓPIA da lista e ordena visualmente pelo campo nome.

    IMPORTANTE:
    - db.clientes não é reordenado;
    - o código de cada cliente permanece exatamente o mesmo;
    - o índice real continua sendo localizado em db.clientes;
    - a ordenação usa pt-BR e ignora diferenças de acentuação
      e maiúsculas/minúsculas para fins de comparação.
*/

/* --------------------------------------------------------- */
/* ordenarClientesPorNome                                    */
/* Retorna uma cópia dos clientes em ordem alfabética.       */
/* --------------------------------------------------------- */

function ordenarClientesPorNome(
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
/* 02. RENDERIZAÇÃO DA PÁGINA DE CLIENTES                   */
/* ========================================================= */
/*
    renderClientes()

    Monta a tela principal com:
    - título
    - botão Consultar Cliente
    - botão Novo Cliente
    - tabela de registros
    - ações Visualizar / Editar / Excluir
    - controles de paginação
*/

/* --------------------------------------------------------- */
/* renderClientes */
/* Renderiza a tabela da página atual e os controles de navegação. */
/* --------------------------------------------------------- */

window.renderClientes = function () {

    if (!db.clientes) {
        db.clientes = [];
    }

  const inicio =
    (window.paginaClientes - 1) *
    window.limiteClientes;

const fim =
    inicio + window.limiteClientes;


/* ===================================================== */
/* 02.1 ORDENAR ANTES DE PAGINAR                        */
/* ===================================================== */
/*
    Primeiro organiza todos os clientes por nome.
    Depois aplica o recorte da página atual.

    Assim a página 1 começa realmente pelos nomes em A, B, C...
*/

const clientesOrdenados =
    ordenarClientesPorNome(
        db.clientes
    );

const clientesTela =
    clientesOrdenados.slice(
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
                👤 Clientes
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Cadastro e gerenciamento de clientes
            </div>

        </div>

        <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        ">

            <button
                class="btn-action"
                onclick="abrirConsultaCliente()">

                🔍 Consultar Cliente

            </button>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirNovoCliente()">

                + Novo Cliente

            </button>

        </div>

    </div>

    <!-- 02.2 TABELA PRINCIPAL DE CLIENTES -->

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
                    <th>Nome / Razão Social</th>
                    <th>CPF/CNPJ</th>
                    <th>Telefone</th>
                    <th>Cidade</th>
                    <th>Cadastro</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>
`;

    if (clientesTela.length === 0) {

        html += `

<tr>

    <td colspan="7" style="
        text-align:center;
        padding:30px;
        color:#6b7280;
    ">

        Nenhum cliente cadastrado

    </td>

</tr>
`;
    }

    clientesTela.forEach(cliente => {

        /* ================================================= */
        /* 02.3 ÍNDICE REAL DO CLIENTE                       */
        /* ================================================= */
        /*
            Como a lista exibida está ordenada alfabeticamente,
            não podemos usar a posição visual como índice do banco.

            indexOf(cliente) recupera a posição real em db.clientes,
            preservando Visualizar / Editar / Excluir.
        */

        const idx =
            db.clientes.indexOf(
                cliente
            );

        html += `

<tr>

    <td>
        ${cliente.codigo || '-'}
    </td>

    <td>
        ${cliente.nome || '-'}
    </td>

    <td>
        ${cliente.documento || '-'}
    </td>

    <td>
        ${cliente.telefone || '-'}
    </td>

    <td>
        ${cliente.cidade || '-'}
    </td>

    <td>
        ${
            cliente.dataCadastro
            ? formatarData(cliente.dataCadastro.split('T')[0])
            : '-'
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
                    background:#2563eb !important;
                    padding:6px 10px;
                    font-size:12px;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
                onclick="visualizarCliente(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 10px;
                    font-size:12px;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                onclick="editarCliente(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
                onclick="excluirCliente(${idx})">

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
    onclick="paginaAnteriorClientes()"
    ${window.paginaClientes <= 1 ? 'disabled' : ''}>

⬅ Voltar

</button>


<span style="
    font-weight:600;
">

Página ${window.paginaClientes}

</span>


<button
    class="btn-action"
    onclick="proximaPaginaClientes()"
    ${
        fim >= db.clientes.length
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
    proximaPaginaClientes()
        avança uma página quando ainda existem registros.

    paginaAnteriorClientes()
        retorna uma página quando a página atual é maior que 1.
*/


/* --------------------------------------------------------- */
/* proximaPaginaClientes */
/* Calcula o total de páginas e avança quando houver próxima página. */
/* --------------------------------------------------------- */

window.proximaPaginaClientes = function(){

    const totalPaginas =
        Math.ceil(
            db.clientes.length /
            window.limiteClientes
        );


    if(
        window.paginaClientes <
        totalPaginas
    ){

        window.paginaClientes++;

        navigate(
            'clientes',
            false
        );

    }

};



/* --------------------------------------------------------- */
/* paginaAnteriorClientes */
/* Volta uma página quando a página atual for maior que 1. */
/* --------------------------------------------------------- */

window.paginaAnteriorClientes = function(){


    if(
        window.paginaClientes > 1
    ){

        window.paginaClientes--;


        navigate(
            'clientes',
            false
        );

    }

};

/* ========================================================= */
/* 04. CADASTRO DE NOVO CLIENTE                             */
/* ========================================================= */
/*
    abrirNovoCliente(dados)

    Abre o formulário reutilizado para cadastro,
    visualização e edição.

    Campos disponíveis:
    - código
    - nome / razão social
    - CPF / CNPJ
    - RG / IE
    - telefone
    - e-mail
    - CEP
    - endereço
    - número
    - bairro
    - cidade
    - estado
    - observações
*/

/* --------------------------------------------------------- */
/* abrirNovoCliente */
/* Monta o formulário usado para cadastro de cliente. */
/* --------------------------------------------------------- */

window.abrirNovoCliente = function (
    dados = {}
) {

    if (!db.clientes) {
        db.clientes = [];
    }

    const proximoCodigo =
        db.clientes.length + 1;

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

        <!-- 04.1 CÓDIGO -->

        <div>

            <label>
                Código
            </label>

            <input
                id="cliente-codigo"
                value="${proximoCodigo}"
                disabled>

        </div>

        <!-- 04.2 NOME / RAZÃO SOCIAL -->

        <div>

            <label>
                Nome / Razão Social
            </label>

            <input
                id="cliente-nome"
                value="${dados.nome || ''}">

        </div>

        <!-- 04.3 CPF / CNPJ -->

        <div>

            <label>
                CPF / CNPJ
            </label>

            <input
                id="cliente-documento"
                value="${dados.documento || ''}">

        </div>

        <!-- 04.4 RG / IE -->

        <div>

            <label>
                RG / IE
            </label>

            <input
                id="cliente-rgie"
                value="${dados.rgie || ''}">

        </div>

        <!-- 04.5 TELEFONE -->

        <div>

            <label>
                Telefone
            </label>

            <input
                id="cliente-telefone"
                value="${dados.telefone || ''}">

        </div>

        <!-- 04.6 E-MAIL -->

        <div>

            <label>
                Email
            </label>

            <input
                id="cliente-email"
                value="${dados.email || ''}">

        </div>
                <!-- 04.7 CEP -->

        <div>

            <label>
                CEP
            </label>

            <input
                id="cliente-cep"
                value="${dados.cep || ''}">

        </div>

        <!-- 04.8 ENDEREÇO -->

        <div>

            <label>
                Endereço
            </label>

            <input
                id="cliente-endereco"
                value="${dados.endereco || ''}">

        </div>

        <!-- 04.9 NÚMERO -->

        <div>

            <label>
                Número
            </label>

            <input
                id="cliente-numero"
                value="${dados.numero || ''}">

        </div>

        <!-- 04.10 BAIRRO -->

        <div>

            <label>
                Bairro
            </label>

            <input
                id="cliente-bairro"
                value="${dados.bairro || ''}">

        </div>

        <!-- 04.11 CIDADE -->

        <div>

            <label>
                Cidade
            </label>

            <input
                id="cliente-cidade"
                value="${dados.cidade || ''}">

        </div>

        <!-- 04.12 ESTADO -->

        <div>

            <label>
                Estado
            </label>

            <input
                id="cliente-estado"
                value="${dados.estado || ''}">

        </div>

    </div>

    <!-- 04.13 OBSERVAÇÕES -->

    <div>

        <label>
            Observações
        </label>

        <textarea
            id="cliente-obs"
            rows="4"
            style="
                width:100%;
                resize:vertical;
            "
        >${dados.obs || ''}</textarea>

    </div>

</div>
`;

    configModal({

        title: 'Novo Cliente',

        body: html,

        size: 'large',

        confirmText: 'Salvar',

        onConfirm() {

            salvarNovoCliente();
        }
    });
};

/* ========================================================= */
/* 05. SALVAR NOVO CLIENTE                                  */
/* ========================================================= */
/*
    salvarNovoCliente()

    Valida o nome, monta o objeto cliente,
    adiciona em db.clientes e salva o banco.

    Também preserva a integração existente com o fluxo
    de Orçamentos quando window.voltarParaOrcamento estiver ativo.
*/

/* --------------------------------------------------------- */
/* salvarNovoCliente */
/* Valida, cria e adiciona um novo cliente em db.clientes. */
/* --------------------------------------------------------- */

window.salvarNovoCliente = function () {

    const nome =
        document
            .getElementById(
                'cliente-nome'
            )
            .value
            .trim();

    if (!nome) {

        alert(
            'Informe o nome do cliente.'
        );

        return;
    }

    const cliente = {

        codigo:
            db.clientes.length + 1,

        nome,

        documento:
            document
                .getElementById(
                    'cliente-documento'
                )
                .value,

        rgie:
            document
                .getElementById(
                    'cliente-rgie'
                )
                .value,

        telefone:
            document
                .getElementById(
                    'cliente-telefone'
                )
                .value,

        email:
            document
                .getElementById(
                    'cliente-email'
                )
                .value,

        cep:
            document
                .getElementById(
                    'cliente-cep'
                )
                .value,

        endereco:
            document
                .getElementById(
                    'cliente-endereco'
                )
                .value,

        numero:
            document
                .getElementById(
                    'cliente-numero'
                )
                .value,

        bairro:
            document
                .getElementById(
                    'cliente-bairro'
                )
                .value,

        cidade:
            document
                .getElementById(
                    'cliente-cidade'
                )
                .value,

        estado:
            document
                .getElementById(
                    'cliente-estado'
                )
                .value,

        obs:
            document
                .getElementById(
                    'cliente-obs'
                )
                .value,

        dataCadastro:
            new Date().toISOString()
    };

    db.clientes.push(
    cliente
);

save();

closeModal();


if(window.voltarParaOrcamento){

    window.voltarParaOrcamento = false;


    /* ===================================================== */
    /* 05.1 RETORNAR AO ORÇAMENTO EM ANDAMENTO              */
    /* ===================================================== */
    /*
        Quando o cliente foi criado a partir do orçamento,
        reabre o modal e preenche automaticamente o cliente
        recém-cadastrado.
    */
    abrirModalOrcamento();


    setTimeout(()=>{

        const campoCliente =
            document.getElementById(
                'orc-cliente'
            );


        if(campoCliente){

            campoCliente.value =
                cliente.nome;

            preencherDadosClienteOrcamento();

        }

    },300);


}
else{

    navigate('clientes');

}
};

/* ========================================================= */
/* 06. VISUALIZAR CLIENTE                                   */
/* ========================================================= */
/*
    visualizarCliente(idx)

    Reutiliza o formulário de cliente, bloqueia os campos
    e transforma o botão principal em "Fechar".
*/

/* --------------------------------------------------------- */
/* visualizarCliente */
/* Abre os dados em modo somente leitura. */
/* --------------------------------------------------------- */

window.visualizarCliente = function (idx) {

    const cliente =
        db.clientes[idx];

    abrirNovoCliente(cliente);

    const modalTitle =
        document.getElementById(
            'modal-title'
        );

    if (modalTitle) {

        modalTitle.innerText =
            'Visualizar Cliente';
    }

    document
        .querySelectorAll(
            '#modal-body input, #modal-body textarea'
        )
        .forEach(campo => {

            campo.disabled = true;
        });

    const btnConfirm =
        document.getElementById(
            'modal-confirm'
        );

    if (btnConfirm) {

        btnConfirm.innerText =
            'Fechar';

        btnConfirm.onclick =
            function () {

                closeModal();
            };
    }
};

/* ========================================================= */
/* 07. EDITAR CLIENTE                                       */
/* ========================================================= */
/*
    editarCliente(idx)

    Reabre o formulário preenchido e substitui a ação
    do botão de confirmação para atualizar o registro.
*/

/* --------------------------------------------------------- */
/* editarCliente */
/* Permite alterar os dados do cliente selecionado. */
/* --------------------------------------------------------- */

window.editarCliente = function (idx) {

    const cliente =
        db.clientes[idx];

    abrirNovoCliente(cliente);

    document.getElementById(
        'modal-title'
    ).innerText =
        'Editar Cliente';

    document.getElementById(
        'modal-confirm'
    ).onclick = function () {

        cliente.nome =
            document.getElementById(
                'cliente-nome'
            ).value;

        cliente.documento =
            document.getElementById(
                'cliente-documento'
            ).value;

        cliente.rgie =
            document.getElementById(
                'cliente-rgie'
            ).value;

        cliente.telefone =
            document.getElementById(
                'cliente-telefone'
            ).value;

        cliente.email =
            document.getElementById(
                'cliente-email'
            ).value;

        cliente.cep =
            document.getElementById(
                'cliente-cep'
            ).value;

        cliente.endereco =
            document.getElementById(
                'cliente-endereco'
            ).value;

        cliente.numero =
            document.getElementById(
                'cliente-numero'
            ).value;

        cliente.bairro =
            document.getElementById(
                'cliente-bairro'
            ).value;

        cliente.cidade =
            document.getElementById(
                'cliente-cidade'
            ).value;

        cliente.estado =
            document.getElementById(
                'cliente-estado'
            ).value;

        cliente.obs =
            document.getElementById(
                'cliente-obs'
            ).value;

        save();

        closeModal();

        navigate(
            'clientes'
        );
    };
};

/* ========================================================= */
/* 08. EXCLUIR CLIENTE                                      */
/* ========================================================= */
/*
    excluirCliente(idx)

    Solicita confirmação, remove o registro do array,
    salva o banco e atualiza a tela.
*/

/* --------------------------------------------------------- */
/* excluirCliente */
/* Remove o cliente selecionado após confirmação. */
/* --------------------------------------------------------- */

window.excluirCliente = function (
    idx
) {

    const confirmar =
        confirm(
            'Deseja excluir este cliente?'
        );

    if (!confirmar) return;

    db.clientes.splice(
        idx,
        1
    );

    save();

    navigate(
        'clientes'
    );
};

/* ========================================================= */
/* 09. CONSULTA DE CLIENTES                                 */
/* ========================================================= */
/*
    abrirConsultaCliente()

    Abre um modal de consulta com campos de filtro e
    uma área própria para exibir os resultados.
*/

/* --------------------------------------------------------- */
/* abrirConsultaCliente */
/* Abre o modal de pesquisa de clientes. */
/* --------------------------------------------------------- */

window.abrirConsultaCliente =
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
                Data Inicial
            </label>

            <input
                type="date"
                id="consulta-data-inicio">

        </div>

        <div>

            <label>
                Data Final
            </label>

            <input
                type="date"
                id="consulta-data-fim">

        </div>

        <div>

            <label>
                Nome
            </label>

            <input
                id="consulta-nome">

        </div>

        <div>

            <label>
                CPF / CNPJ
            </label>

            <input
                id="consulta-documento">

        </div>

        <div>

            <label>
                Cidade
            </label>

            <input
                id="consulta-cidade">

        </div>

    </div>

    <div style="
        display:flex;
        justify-content:flex-end;
    ">

        <button
            class="btn-action"
            onclick="filtrarClientesConsulta()">

            🔍 Consultar

        </button>

    </div>

    <div
        id="resultado-clientes">
    </div>

</div>
`;

    configModal({

        title:
            'Consultar Clientes',

        body: html,

        size: 'large',

        confirmText: 'Fechar',

        onConfirm() {

            closeModal();
        }
    });
};

/* ========================================================= */
/* 10. FILTRAR RESULTADOS DA CONSULTA                      */
/* ========================================================= */
/*
    filtrarClientesConsulta()

    Filtra os registros conforme os campos usados
    pela lógica atual e monta a tabela de resultados
    com ações de Visualizar, Editar e Excluir.
*/

/* --------------------------------------------------------- */
/* filtrarClientesConsulta */
/* Aplica os filtros da consulta e renderiza os resultados. */
/* --------------------------------------------------------- */

window.filtrarClientesConsulta =
function () {

    const nome =
        document
            .getElementById(
                'consulta-nome'
            )
            .value
            .toLowerCase();

    const documento =
        document
            .getElementById(
                'consulta-documento'
            )
            .value
            .toLowerCase();

    const cidade =
        document
            .getElementById(
                'consulta-cidade'
            )
            .value
            .toLowerCase();

    /* ===================================================== */
    /* 10.1 ORDEM ALFABÉTICA DOS RESULTADOS                 */
    /* ===================================================== */
    /*
        A consulta também começa com a lista em ordem
        alfabética para manter o mesmo padrão da tela principal.
    */

    let clientes =
        ordenarClientesPorNome(
            db.clientes
        );

    if (nome) {

        clientes =
            clientes.filter(c =>

                (c.nome || '')
                    .toLowerCase()
                    .includes(nome)
            );
    }

    if (documento) {

        clientes =
            clientes.filter(c =>

                (c.documento || '')
                    .toLowerCase()
                    .includes(documento)
            );
    }

    if (cidade) {

        clientes =
            clientes.filter(c =>

                (c.cidade || '')
                    .toLowerCase()
                    .includes(cidade)
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
    <th>Telefone</th>
    <th>Cidade</th>
    <th>Ações</th>

</tr>

</thead>

<tbody>
`;

if (
    clientes.length === 0
) {

    html += `

<tr>

<td colspan="5"
style="
    text-align:center;
    padding:25px;
">

Nenhum cliente encontrado

</td>

</tr>
`;
}

clientes.forEach(
    cliente => {

    const idx =
        db.clientes.indexOf(
            cliente
        );

    html += `

<tr>

    <td>
        ${cliente.nome || '-'}
    </td>

    <td>
        ${cliente.documento || '-'}
    </td>

    <td>
        ${cliente.telefone || '-'}
    </td>

    <td>
        ${cliente.cidade || '-'}
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
                    background:#2563eb !important;
                    padding:5px 8px;
                    font-size:11px;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
                onclick="
                    visualizarCliente(
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
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                onclick="
                    editarCliente(
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
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
                onclick="
                    excluirCliente(
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

document.getElementById(
    'resultado-clientes'
).innerHTML = html;
};

/* ========================================================= */
/* 11. REGISTRAR PÁGINA NO SISTEMA                         */
/* ========================================================= */
/*
    Registra a tela com o nome:

        clientes

    Assim, navigate('clientes') consegue renderizar
    esta página dentro do view-port.
*/

registerPage(
    'clientes',
    renderClientes
);