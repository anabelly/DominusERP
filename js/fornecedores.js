/* ========================= */
/* FORNECEDORES */
/* ========================= */

window.renderFornecedores = function () {

    if (!db.fornecedores) {
        db.fornecedores = [];
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

                    <th>Nome/Razão</th>
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

    db.fornecedores.forEach((fornecedor, idx) => {

        html += `

<tr>

    <td>
        ${fornecedor.nome || '-'}
    </td>

    <td>
        ${fornecedor.documento || '-'}
    </td>

    <td>
        ${fornecedor.telefone || fornecedor.email || '-'}
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

            <button
                class="btn-action"
                style="
                    padding:6px 10px;
                    font-size:12px;
                    background:#374151;
                "
                onclick="visualizarFornecedor(${idx})">

                👁 Visualizar

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
/* NOVO FORNECEDOR */
/* ========================= */

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

        <!-- NOME -->

        <div>

            <label>
                Nome / Razão Social
            </label>

            <input
                id="fornecedor-nome"
                value="${dados.nome || ''}">

        </div>

        <!-- DOCUMENTO -->

        <div>

            <label>
                Documento
            </label>

            <input
                id="fornecedor-documento"
                value="${dados.documento || ''}">

        </div>

        <!-- FANTASIA -->

        <div>

            <label>
                Nome Fantasia
            </label>

            <input
                id="fornecedor-fantasia"
                value="${dados.fantasia || ''}">

        </div>

        <!-- CONTATO -->

        <div>

            <label>
                Contato
            </label>

            <input
                id="fornecedor-contato"
                value="${dados.contato || ''}">

        </div>

        <!-- EMAIL -->

        <div>

            <label>
                Email
            </label>

            <input
                id="fornecedor-email"
                value="${dados.email || ''}">

        </div>

        <!-- TELEFONE -->

        <div>

            <label>
                Telefone
            </label>

            <input
                id="fornecedor-telefone"
                value="${dados.telefone || ''}">

        </div>

        <!-- ENDEREÇO -->

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

        <!-- CIDADE -->

        <div>

            <label>
                Cidade
            </label>

            <input
                id="fornecedor-cidade"
                value="${dados.cidade || ''}">

        </div>

        <!-- UF -->

        <div>

            <label>
                UF
            </label>

            <input
                id="fornecedor-uf"
                value="${dados.uf || ''}">

        </div>

        <!-- OBS -->

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
/* ========================= */
/* SALVAR FORNECEDOR */
/* ========================= */

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

    /* ========================= */
    /* EVITAR DUPLICADOS */
    /* ========================= */

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

/* ========================= */
/* EXCLUIR */
/* ========================= */

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
/* ========================= */
/* VISUALIZAR */
/* ========================= */

window.visualizarFornecedor = function (idx) {

    const fornecedor =
        db.fornecedores[idx];

    abrirNovoFornecedor(
        fornecedor
    );

    /* ========================= */
    /* ALTERAR TÍTULO */
    /* ========================= */

    const titulo =
        document.getElementById(
            'modal-title'
        );

    if (titulo) {

        titulo.innerText =
            'Visualizar Fornecedor';
    }

    /* ========================= */
    /* DESABILITAR CAMPOS */
    /* ========================= */

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

    /* ========================= */
    /* BOTÃO FECHAR */
    /* ========================= */

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

/* ========================= */
/* EDITAR */
/* ========================= */

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

        /* ========================= */
        /* DUPLICADO (EXCETO ELE) */
        /* ========================= */

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
/* ========================= */
/* CONSULTA */
/* ========================= */

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

/* ========================= */
/* FILTRAR CONSULTA */
/* ========================= */

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

    let lista =
        [...db.fornecedores];

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

/* ========================= */
/* REGISTRAR PÁGINA */
/* ========================= */

registerPage(
    'fornecedores',
    renderFornecedores
);