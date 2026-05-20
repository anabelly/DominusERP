/* ========================= */
/* FUNCIONÁRIOS */
/* ========================= */

registerPage('funcionarios', function () {

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
            ">

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
                                width:260px;
                            ">
                                Ações
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${db.funcionarios.map((f, index) => `

                            <tr>

                                <td>
                                    ${f.nome || '-'}
                                </td>

                                <td>
                                    ${f.cargo || '-'}
                                </td>

                                <td>

                                    <span class="status ${getStatusFuncionarioClass(f.status)}">

                                        ${f.status || '-'}

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
                                            "
                                            onclick="editarFuncionario(${index})">

                                            ✏ Editar

                                        </button>

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
                                            class="btn-del"
                                            onclick="deleteItem('funcionarios', ${index})">

                                            X

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        `).join('')}

                    </tbody>

                </table>
            `
        }

    </div>

</div>
`;
});

/* ========================= */
/* MODAL FUNCIONÁRIO */
/* ========================= */

window.abrirModalFuncionario = function () {

    const html = `

<label>Nome</label>

<input id="f-nome">

<div class="form-row">

    <div>

        <label>Setor/Cargo</label>

        <select id="f-cargo">

            <option>Produção</option>
            <option>Administrativo</option>
            <option>Gerência</option>
            <option>Auxiliar</option>

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

                folhaFechada: false,

                dataFechamento: null
            };

            db.funcionarios.push(funcionario);

            save();

            closeModal();

            navigate('funcionarios');
        }
    });
};

/* ========================= */
/* EDITAR FUNCIONÁRIO */
/* ========================= */

window.editarFuncionario = function (index) {

    const f =
        db.funcionarios[index];

    if (!f) return;

    const html = `

<label>Nome</label>

<input
    id="edit-f-nome"
    value="${f.nome || ''}">

<div class="form-row">

    <div>

        <label>Setor/Cargo</label>

        <select id="edit-f-cargo">

            <option ${f.cargo === 'Produção' ? 'selected' : ''}>
                Produção
            </option>

            <option ${f.cargo === 'Administrativo' ? 'selected' : ''}>
                Administrativo
            </option>

            <option ${f.cargo === 'Gerência' ? 'selected' : ''}>
                Gerência
            </option>

            <option ${f.cargo === 'Auxiliar' ? 'selected' : ''}>
                Auxiliar
            </option>

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
            id="edit-f-salario"
            value="${f.salario || 0}">

    </div>

    <div>

        <label>Data de Admissão</label>

        <input
            type="date"
            id="edit-f-admissao"
            value="${f.admissao || ''}">

    </div>

</div>

<div class="form-row">

    <div>

        <label>Entrada</label>

        <input
            type="time"
            id="edit-f-entrada"
            value="${f.horarios?.entrada || '07:45'}">

    </div>

    <div>

        <label>Saída Almoço</label>

        <input
            type="time"
            id="edit-f-almoco-saida"
            value="${f.horarios?.almocoSaida || '12:00'}">

    </div>

</div>

<div class="form-row">

    <div>

        <label>Volta Almoço</label>

        <input
            type="time"
            id="edit-f-almoco-volta"
            value="${f.horarios?.almocoVolta || '13:30'}">

    </div>

    <div>

        <label>Saída</label>

        <input
            type="time"
            id="edit-f-saida"
            value="${f.horarios?.saida || '18:00'}">

    </div>

</div>

<label>Observações</label>

<textarea
    id="edit-f-obs"
    rows="4">${f.observacoes || ''}</textarea>
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

            save();

            closeModal();

            navigate('funcionarios');
        }
    });
};

/* ========================= */
/* STATUS FUNCIONÁRIO */
/* ========================= */

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