/* ========================= */
/* CLIENTES */
/* ========================= */

window.renderClientes = function () {

    if (!db.clientes) {
        db.clientes = [];
    }

    const clientesTela =
        db.clientes.slice(0, 15);

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
                Clientes
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

    clientesTela.forEach((cliente, idx) => {

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
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="visualizarCliente(${idx})">

                👁 Visualizar

            </button>

            <button
                class="btn-action"
                style="
                    background:#f59e0b;
                    padding:6px 10px;
                    font-size:12px;
                "
                onclick="editarCliente(${idx})">

                ✏ Editar

            </button>

            <button
                class="btn-del"
                style="
                    padding:6px 10px;
                    font-size:12px;
                "
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

</div>
`;

    return html;
};

/* ========================= */
/* NOVO CLIENTE */
/* ========================= */

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

        <!-- CÓDIGO -->

        <div>

            <label>
                Código
            </label>

            <input
                id="cliente-codigo"
                value="${proximoCodigo}"
                disabled>

        </div>

        <!-- NOME -->

        <div>

            <label>
                Nome / Razão Social
            </label>

            <input
                id="cliente-nome"
                value="${dados.nome || ''}">

        </div>

        <!-- CPF CNPJ -->

        <div>

            <label>
                CPF / CNPJ
            </label>

            <input
                id="cliente-documento"
                value="${dados.documento || ''}">

        </div>

        <!-- RG IE -->

        <div>

            <label>
                RG / IE
            </label>

            <input
                id="cliente-rgie"
                value="${dados.rgie || ''}">

        </div>

        <!-- TELEFONE -->

        <div>

            <label>
                Telefone
            </label>

            <input
                id="cliente-telefone"
                value="${dados.telefone || ''}">

        </div>

        <!-- EMAIL -->

        <div>

            <label>
                Email
            </label>

            <input
                id="cliente-email"
                value="${dados.email || ''}">

        </div>
                <!-- CEP -->

        <div>

            <label>
                CEP
            </label>

            <input
                id="cliente-cep"
                value="${dados.cep || ''}">

        </div>

        <!-- ENDEREÇO -->

        <div>

            <label>
                Endereço
            </label>

            <input
                id="cliente-endereco"
                value="${dados.endereco || ''}">

        </div>

        <!-- NÚMERO -->

        <div>

            <label>
                Número
            </label>

            <input
                id="cliente-numero"
                value="${dados.numero || ''}">

        </div>

        <!-- BAIRRO -->

        <div>

            <label>
                Bairro
            </label>

            <input
                id="cliente-bairro"
                value="${dados.bairro || ''}">

        </div>

        <!-- CIDADE -->

        <div>

            <label>
                Cidade
            </label>

            <input
                id="cliente-cidade"
                value="${dados.cidade || ''}">

        </div>

        <!-- ESTADO -->

        <div>

            <label>
                Estado
            </label>

            <input
                id="cliente-estado"
                value="${dados.estado || ''}">

        </div>

    </div>

    <!-- OBS -->

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

/* ========================= */
/* SALVAR CLIENTE */
/* ========================= */

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

    navigate('clientes');
};

/* ========================= */
/* VISUALIZAR */
/* ========================= */

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

/* ========================= */
/* EDITAR */
/* ========================= */

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

/* ========================= */
/* EXCLUIR */
/* ========================= */

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

/* ========================= */
/* CONSULTA */
/* ========================= */

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

/* ========================= */
/* FILTRAR */
/* ========================= */

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

    let clientes =
        [...db.clientes];

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
                    padding:5px 8px;
                    font-size:11px;
                "
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
                "
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
                "
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

/* ========================= */
/* REGISTRAR */
/* ========================= */

registerPage(
    'clientes',
    renderClientes
);