/* ========================================================= */
/* DOMINUS ERP - CADASTRO DE LOGINS                          */
/* ========================================================= */
/*
    Cadastro central de usuários do sistema.

    TIPOS:
    - Administrador:
      acesso total a todas as telas e funções.

    - Funcionário:
      acesso somente às telas selecionadas.

    MASTER:
    - login: admin
    - senha: admin
    - não pode ser excluído nem alterado nesta tela.
*/


/* ========================================================= */
/* 01. HELPERS                                               */
/* ========================================================= */

function garantirUsuariosSistema(){

    if(
        !Array.isArray(
            window.db.usuariosSistema
        )
    ){

        window.db.usuariosSistema =
            [];
    }

    return window.db.usuariosSistema;
}


function escaparHTMLUsuario(
    valor
){

    return String(
        valor
        ??
        ''
    )
    .replace(
        /&/g,
        '&amp;'
    )
    .replace(
        /</g,
        '&lt;'
    )
    .replace(
        />/g,
        '&gt;'
    )
    .replace(
        /"/g,
        '&quot;'
    )
    .replace(
        /'/g,
        '&#039;'
    );
}


function gerarIdUsuarioSistema(){

    return (
        'usr-'
        +
        Date.now()
        +
        '-'
        +
        Math.random()
            .toString(36)
            .slice(2,8)
    );
}


function validarAdministradorUsuarios(){

    if(
        typeof window.usuarioEhAdministrador ===
            'function'
        &&
        window.usuarioEhAdministrador()
    ){

        return true;
    }

    alert(
        'Somente Administradores podem acessar o Cadastro de Logins.'
    );

    return false;
}


function telasSelecionaveisUsuario(){

    return (
        Array.isArray(
            window.TELAS_SISTEMA
        )
        ?
        window.TELAS_SISTEMA
        :
        []
    );
}


function nomesPermissoesUsuario(
    permissoes
){

    const mapa =
        new Map(
            telasSelecionaveisUsuario()
                .map(
                    tela => [
                        tela.id,
                        `${tela.icone || ''} ${tela.nome}`
                            .trim()
                    ]
                )
        );

    return (
        Array.isArray(
            permissoes
        )
        ?
        permissoes
        :
        []
    )
    .map(
        id =>
            mapa.get(
                id
            )
    )
    .filter(Boolean);
}


/* ========================================================= */
/* 02. RENDER PRINCIPAL                                      */
/* ========================================================= */

window.renderUsuariosSistema =
function (){

    if(
        !validarAdministradorUsuarios()
    ){

        return `
            <div class="content-card">
                <h2>Acesso restrito</h2>
            </div>
        `;
    }

    const usuarios =
        garantirUsuariosSistema();

    const linhas =
        usuarios.length
        ?
        usuarios
            .map(
                usuario => {

                    const admin =
                        usuario.tipo ===
                            'administrador';

                    const permissoes =
                        admin
                            ?
                            []
                            :
                            nomesPermissoesUsuario(
                                usuario.permissoes
                            );

                    const textoPermissoes =
                        admin
                            ?
                            `
                                <span style="
                                    display:inline-flex;
                                    padding:5px 9px;
                                    border-radius:999px;
                                    background:#dcfce7;
                                    color:#166534;
                                    font-size:10px;
                                    font-weight:900;
                                ">
                                    Acesso total
                                </span>
                            `
                            :
                            permissoes.length
                                ?
                                `
                                    <div style="
                                        display:flex;
                                        flex-wrap:wrap;
                                        gap:5px;
                                    ">
                                        ${
                                            permissoes
                                                .map(
                                                    nome => `
                                                        <span style="
                                                            display:inline-flex;
                                                            padding:4px 7px;
                                                            border-radius:999px;
                                                            background:#f1f5f9;
                                                            color:#475569;
                                                            font-size:9px;
                                                            font-weight:800;
                                                        ">
                                                            ${escaparHTMLUsuario(nome)}
                                                        </span>
                                                    `
                                                )
                                                .join('')
                                        }
                                    </div>
                                `
                                :
                                `
                                    <span style="
                                        color:#b91c1c;
                                        font-size:10px;
                                        font-weight:800;
                                    ">
                                        Nenhuma tela liberada
                                    </span>
                                `;

                    const sessao =
                        window.usuarioAtualSistema
                            ?
                            window.usuarioAtualSistema()
                            :
                            null;

                    const ehAtual =
                        String(
                            sessao?.id || ''
                        )
                        ===
                        String(
                            usuario.id || ''
                        );

                    return `

                        <tr>

                            <td>

                                <div style="
                                    font-weight:900;
                                    color:#111827;
                                ">
                                    ${escaparHTMLUsuario(
                                        usuario.usuario
                                    )}
                                </div>

                                ${
                                    ehAtual
                                        ?
                                        `
                                            <div style="
                                                margin-top:4px;
                                                color:#2563eb;
                                                font-size:9px;
                                                font-weight:900;
                                            ">
                                                LOGIN ATUAL
                                            </div>
                                        `
                                        :
                                        ''
                                }

                            </td>

                            <td>

                                <span style="
                                    display:inline-flex;
                                    padding:5px 9px;
                                    border-radius:999px;
                                    background:${
                                        admin
                                            ?
                                            '#eff6ff'
                                            :
                                            '#f8fafc'
                                    };
                                    color:${
                                        admin
                                            ?
                                            '#1d4ed8'
                                            :
                                            '#475569'
                                    };
                                    font-size:10px;
                                    font-weight:900;
                                ">
                                    ${
                                        admin
                                            ?
                                            'Administrador'
                                            :
                                            'Funcionário'
                                    }
                                </span>

                            </td>

                            <td>
                                ${textoPermissoes}
                            </td>

                            <td>

                                <div style="
                                    display:flex;
                                    gap:6px;
                                    flex-wrap:wrap;
                                ">

                                    <button
                                        type="button"
                                        class="btn-action"
                                        style="
                                            background:#f59e0b;
                                            padding:7px 10px;
                                            font-size:11px;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
                                        onclick="editarUsuarioSistema('${usuario.id}')"
                                    >
                                        ✏ Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-del"
                                        style="
                                            padding:7px 10px;
                                            font-size:11px;
                                            ${ehAtual ? 'opacity:.45;cursor:not-allowed;' : ''}
                                        "
                                        onclick="excluirUsuarioSistema('${usuario.id}')"
                                        ${ehAtual ? 'disabled' : ''}
                                     style="background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;">
                                        Excluir
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;
                }
            )
            .join('')
        :
        `
            <tr>
                <td
                    colspan="4"
                    style="
                        padding:28px;
                        text-align:center;
                        color:#64748b;
                    "
                >
                    Nenhum login adicional cadastrado.
                </td>
            </tr>
        `;

    return `

        <div style="
            display:flex;
            flex-direction:column;
            gap:18px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:15px;
                flex-wrap:wrap;
            ">

                <div>

                    <h1 style="
                        margin:0;
                        font-size:28px;
                    ">
                        🔐 Cadastro de Logins
                    </h1>

                    <div style="
                        margin-top:6px;
                        color:#64748b;
                        font-size:12px;
                    ">
                        Usuários, senhas e permissões de acesso ao Dominus ERP
                    </div>

                </div>

                <button
                    class="btn-action"
                    onclick="abrirNovoUsuarioSistema()"
                >
                    + Novo Login
                </button>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    minmax(260px,1fr)
                    minmax(260px,1fr);
                gap:12px;
            ">

                <div class="content-card">

                    <div style="
                        color:#64748b;
                        font-size:9px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                    ">
                        Administrador Master
                    </div>

                    <div style="
                        margin-top:6px;
                        font-size:22px;
                        font-weight:950;
                    ">
                        admin
                    </div>

                    <div style="
                        margin-top:4px;
                        color:#16a34a;
                        font-size:11px;
                        font-weight:900;
                    ">
                        Acesso total • Protegido
                    </div>

                </div>

                <div class="content-card">

                    <div style="
                        color:#64748b;
                        font-size:9px;
                        font-weight:900;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                    ">
                        Banco de Dados
                    </div>

                    <div style="
                        margin-top:6px;
                        font-size:16px;
                        font-weight:900;
                    ">
                        Compartilhado
                    </div>

                    <div style="
                        margin-top:4px;
                        color:#64748b;
                        font-size:11px;
                        line-height:1.5;
                    ">
                        Todos os logins acessam os mesmos clientes,
                        orçamentos, OS, estoque e demais dados.
                    </div>

                </div>

            </div>


            <div class="content-card">

                <div style="
                    margin-bottom:14px;
                    font-size:15px;
                    font-weight:900;
                ">
                    Logins adicionais
                </div>

                <div style="
                    overflow:auto;
                ">

                    <table style="
                        width:100%;
                        min-width:800px;
                    ">

                        <thead>

                            <tr>

                                <th>
                                    Login
                                </th>

                                <th>
                                    Tipo
                                </th>

                                <th>
                                    Acessos
                                </th>

                                <th>
                                    Ações
                                </th>

                            </tr>

                        </thead>

                        <tbody>
                            ${linhas}
                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    `;
};


/* ========================================================= */
/* 03. ABRIR NOVO / EDITAR                                   */
/* ========================================================= */

window.abrirNovoUsuarioSistema =
function (){

    abrirFormularioUsuarioSistema(
        null
    );
};


window.editarUsuarioSistema =
function (
    id
){

    if(
        !validarAdministradorUsuarios()
    ){

        return;
    }

    const usuario =
        garantirUsuariosSistema()
            .find(
                item =>
                    String(
                        item.id
                    )
                    ===
                    String(
                        id
                    )
            );

    if(
        !usuario
    ){

        alert(
            'Login não encontrado.'
        );

        return;
    }

    abrirFormularioUsuarioSistema(
        usuario
    );
};


function abrirFormularioUsuarioSistema(
    usuario
){

    if(
        !validarAdministradorUsuarios()
    ){

        return;
    }

    const editando =
        !!usuario;

    const tipo =
        usuario?.tipo ===
            'administrador'
            ?
            'administrador'
            :
            'funcionario';

    const permissoesAtuais =
        Array.isArray(
            usuario?.permissoes
        )
        ?
        usuario.permissoes
        :
        [];

    const permissoesHTML =
        telasSelecionaveisUsuario()
            .map(
                tela => {

                    const marcado =
                        permissoesAtuais.includes(
                            tela.id
                        )
                        ?
                        'checked'
                        :
                        '';

                    return `

                        <label style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                            padding:9px 10px;
                            border:1px solid #e2e8f0;
                            border-radius:9px;
                            background:#fff;
                            cursor:pointer;
                        ">

                            <input
                                type="checkbox"
                                class="usuario-permissao"
                                value="${tela.id}"
                                ${marcado}
                                style="
                                    width:auto;
                                    margin:0;
                                "
                            >

                            <span style="
                                font-size:11px;
                                font-weight:800;
                                color:#334155;
                            ">
                                ${tela.icone || ''}
                                ${escaparHTMLUsuario(
                                    tela.nome
                                )}
                            </span>

                        </label>

                    `;
                }
            )
            .join('');

    const html = `

        <div style="
            display:flex;
            flex-direction:column;
            gap:16px;
        ">

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:12px;
            ">

                <div>

                    <label>
                        Login *
                    </label>

                    <input
                        id="usuario-login"
                        value="${escaparHTMLUsuario(
                            usuario?.usuario || ''
                        )}"
                        placeholder="Ex.: weslley"
                        autocomplete="off"
                    >

                </div>

                <div>

                    <label>
                        Senha ${
                            editando
                                ?
                                '(deixe em branco para manter)'
                                :
                                '*'
                        }
                    </label>

                    <input
                        id="usuario-senha"
                        type="password"
                        autocomplete="new-password"
                        placeholder="${
                            editando
                                ?
                                'Não alterar senha'
                                :
                                'Digite a senha'
                        }"
                    >

                </div>

                <div style="
                    grid-column:1 / -1;
                ">

                    <label>
                        Tipo de acesso *
                    </label>

                    <select
                        id="usuario-tipo"
                        onchange="alternarTipoUsuarioSistema()"
                    >

                        <option
                            value="administrador"
                            ${
                                tipo === 'administrador'
                                    ?
                                    'selected'
                                    :
                                    ''
                            }
                        >
                            Administrador
                        </option>

                        <option
                            value="funcionario"
                            ${
                                tipo === 'funcionario'
                                    ?
                                    'selected'
                                    :
                                    ''
                            }
                        >
                            Funcionário
                        </option>

                    </select>

                </div>

            </div>


            <div
                id="usuario-admin-aviso"
                style="
                    padding:13px 15px;
                    border-radius:11px;
                    background:#eff6ff;
                    border:1px solid #bfdbfe;
                    color:#1e40af;
                    font-size:11px;
                    line-height:1.55;
                "
            >
                <strong>Administrador:</strong>
                terá acesso total a todas as telas e funções do sistema.
            </div>


            <div
                id="usuario-permissoes-box"
                style="
                    padding:14px;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    background:#f8fafc;
                "
            >

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    margin-bottom:10px;
                    flex-wrap:wrap;
                ">

                    <div>

                        <div style="
                            font-size:12px;
                            font-weight:900;
                        ">
                            Telas liberadas para o Funcionário
                        </div>

                        <div style="
                            margin-top:3px;
                            color:#64748b;
                            font-size:10px;
                        ">
                            Marque somente as telas que este login poderá abrir.
                        </div>

                    </div>

                    <div style="
                        display:flex;
                        gap:5px;
                    ">

                        <button
                            type="button"
                            class="btn-action"
                            style="
                                background:#475569;
                                padding:6px 9px;
                                font-size:10px;
                            "
                            onclick="marcarTodasPermissoesUsuarioSistema(true)"
                        >
                            Marcar todas
                        </button>

                        <button
                            type="button"
                            class="btn-action"
                            style="
                                background:#94a3b8;
                                padding:6px 9px;
                                font-size:10px;
                            "
                            onclick="marcarTodasPermissoesUsuarioSistema(false)"
                        >
                            Limpar
                        </button>

                    </div>

                </div>

                <div style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(190px,1fr));
                    gap:7px;
                ">
                    ${permissoesHTML}
                </div>

            </div>

        </div>

    `;

    configModal({

        title:
            editando
                ?
                'Editar Login'
                :
                'Novo Login',

        body:
            html,

        size:
            'large',

        confirmText:
            editando
                ?
                'Salvar Alterações'
                :
                'Cadastrar Login',

        onConfirm(){

            salvarUsuarioSistema(
                usuario?.id
                ||
                null
            );
        }
    });

    alternarTipoUsuarioSistema();
}


/* ========================================================= */
/* 04. TIPO / PERMISSÕES                                     */
/* ========================================================= */

window.alternarTipoUsuarioSistema =
function (){

    const tipo =
        document
            .getElementById(
                'usuario-tipo'
            )
            ?.value
        ||
        'funcionario';

    const funcionario =
        tipo ===
        'funcionario';

    const box =
        document.getElementById(
            'usuario-permissoes-box'
        );

    const aviso =
        document.getElementById(
            'usuario-admin-aviso'
        );

    if(
        box
    ){

        box.style.display =
            funcionario
                ?
                ''
                :
                'none';
    }

    if(
        aviso
    ){

        aviso.style.display =
            funcionario
                ?
                'none'
                :
                '';
    }
};


window.marcarTodasPermissoesUsuarioSistema =
function (
    marcar
){

    document
        .querySelectorAll(
            '.usuario-permissao'
        )
        .forEach(
            campo => {

                campo.checked =
                    !!marcar;
            }
        );
};


/* ========================================================= */
/* 05. SALVAR USUÁRIO                                        */
/* ========================================================= */

window.salvarUsuarioSistema =
async function (
    id = null
){

    if(
        !validarAdministradorUsuarios()
    ){

        return;
    }

    const usuarios =
        garantirUsuariosSistema();

    const login =
        document
            .getElementById(
                'usuario-login'
            )
            ?.value
            .trim()
        ||
        '';

    const senha =
        document
            .getElementById(
                'usuario-senha'
            )
            ?.value
        ||
        '';

    const tipo =
        document
            .getElementById(
                'usuario-tipo'
            )
            ?.value
        ===
        'administrador'
            ?
            'administrador'
            :
            'funcionario';

    if(
        !login
    ){

        alert(
            'Informe o login.'
        );

        return;
    }

    if(
        /\s/.test(
            login
        )
    ){

        alert(
            'O login não pode conter espaços.'
        );

        return;
    }

    if(
        login.toLowerCase()
        ===
        'admin'
    ){

        alert(
            'O login "admin" é reservado para o Administrador Master.'
        );

        return;
    }

    const existenteMesmoLogin =
        usuarios.find(
            item =>
                String(
                    item.usuario || ''
                )
                .trim()
                .toLowerCase()
                ===
                login.toLowerCase()
            &&
                String(
                    item.id
                )
                !==
                String(
                    id || ''
                )
        );

    if(
        existenteMesmoLogin
    ){

        alert(
            'Já existe um login com esse nome.'
        );

        return;
    }

    const atual =
        id
        ?
        usuarios.find(
            item =>
                String(
                    item.id
                )
                ===
                String(
                    id
                )
        )
        :
        null;

    if(
        !atual
        &&
        !senha
    ){

        alert(
            'Informe a senha.'
        );

        return;
    }

    const permissoes =
        tipo ===
            'administrador'
        ?
        []
        :
        [
            ...document
                .querySelectorAll(
                    '.usuario-permissao:checked'
                )
        ]
        .map(
            campo =>
                campo.value
        );

    if(
        tipo ===
            'funcionario'
        &&
        !permissoes.length
    ){

        alert(
            'Selecione pelo menos uma tela para o Funcionário.'
        );

        return;
    }

    const agora =
        new Date()
            .toISOString();

    if(
        atual
    ){

        const loginAnterior =
            atual.usuario;

        atual.usuario =
            login;

        atual.tipo =
            tipo;

        atual.permissoes =
            permissoes;

        atual.atualizadoEm =
            agora;

        if(
            senha
        ){

            atual.senha =
                senha;
        }

        /*
            A Agenda é privada pelo ID do login.
            Se o nome do login mudar, atualiza apenas o texto
            exibido como responsável, sem trocar o proprietário.
        */

        (window.db.agenda || [])
            .forEach(
                compromisso => {

                    if(
                        String(
                            compromisso.usuarioId || ''
                        )
                        ===
                        String(
                            atual.id
                        )
                    ){

                        compromisso.responsavel =
                            login;
                    }
                }
            );

        console.log(
            `Login alterado: ${loginAnterior} -> ${login}`
        );
    }

    else{

        usuarios.push({

            id:
                gerarIdUsuarioSistema(),

            usuario:
                login,

            senha,

            tipo,

            permissoes,

            criadoEm:
                agora,

            atualizadoEm:
                null
        });
    }

    await save();

    if(
        typeof window.sincronizarSessaoComBanco ===
            'function'
    ){

        window.sincronizarSessaoComBanco();
    }

    closeModal();

    if(
        usuarioPodeAcessarPagina(
            'usuarios'
        )
    ){

        navigate(
            'usuarios',
            false
        );

        return;
    }

    const destino =
        primeiraPaginaPermitida();

    if(
        destino
    ){

        navigate(
            destino,
            false
        );
    }
};


/* ========================================================= */
/* 06. EXCLUIR USUÁRIO                                       */
/* ========================================================= */

window.excluirUsuarioSistema =
async function (
    id
){

    if(
        !validarAdministradorUsuarios()
    ){

        return;
    }

    const sessao =
        window.usuarioAtualSistema
            ?
            window.usuarioAtualSistema()
            :
            null;

    if(
        String(
            sessao?.id || ''
        )
        ===
        String(
            id
        )
    ){

        alert(
            'Você não pode excluir o login que está usando neste momento.'
        );

        return;
    }

    const usuarios =
        garantirUsuariosSistema();

    const usuario =
        usuarios.find(
            item =>
                String(
                    item.id
                )
                ===
                String(
                    id
                )
        );

    if(
        !usuario
    ){

        return;
    }

    const confirmar =
        confirm(
            `Deseja excluir o login "${usuario.usuario}"?\n\n` +
            'Os dados gerais do ERP não serão excluídos. ' +
            'Os compromissos particulares desse login permanecerão armazenados no banco.'
        );

    if(
        !confirmar
    ){

        return;
    }

    window.db.usuariosSistema =
        usuarios.filter(
            item =>
                String(
                    item.id
                )
                !==
                String(
                    id
                )
        );

    await save();

    navigate(
        'usuarios',
        false
    );
};


/* ========================================================= */
/* 07. REGISTRO DA PÁGINA                                   */
/* ========================================================= */

registerPage(
    'usuarios',
    renderUsuariosSistema
);
