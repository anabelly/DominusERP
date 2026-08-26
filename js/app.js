/* ========================= */
/* APP PRINCIPAL */
/* ========================= */

window.pages = {};


/* ========================================================= */
/* LOGIN, SESSÃO E PERMISSÕES                               */
/* ========================================================= */

window.MASTER_DOMINUS = {

    id:
        'master-admin',

    usuario:
        'admin',

    tipo:
        'administrador',

    permissoes:
        [],

    master:
        true
};


/*
    Telas que podem ser liberadas para usuários do tipo
    Funcionário.

    A tela "usuarios" não entra nesta lista porque o cadastro
    de logins é exclusivo de Administradores.
*/

window.TELAS_SISTEMA = [

    {
        id:'dash',
        nome:'Dashboard',
        icone:'🏠'
    },

    {
        id:'estoque',
        nome:'Estoque',
        icone:'📦'
    },

    {
        id:'clientes',
        nome:'Clientes',
        icone:'👤'
    },

    {
        id:'fornecedores',
        nome:'Fornecedores',
        icone:'🏭'
    },

    {
        id:'funcionarios',
        nome:'Funcionários',
        icone:'👷'
    },

    {
        id:'orcamentos',
        nome:'Orçamentos',
        icone:'📄'
    },

    {
        id:'ordens-servico',
        nome:'Ordens de Serviço',
        icone:'🛠️'
    },

    {
        id:'recibos',
        nome:'Recibos / Comprovantes',
        icone:'🧾'
    },

    {
        id:'financeiro',
        nome:'Fluxo Financeiro',
        icone:'💰'
    },

    {
        id:'agenda',
        nome:'Agenda',
        icone:'📅'
    },

    {
        id:'centro-custos',
        nome:'Centro de Custos',
        icone:'🧮'
    },

    {
        id:'relatorios',
        nome:'Relatórios',
        icone:'📊'
    },

    {
        id:'backup',
        nome:'Backup / Restauração',
        icone:'💾'
    },

    {
        id:'atualizacao',
        nome:'Atualização',
        icone:'🔄'
    },

    {
        id:'sobre',
        nome:'Sobre',
        icone:'ℹ️'
    }

];


/* --------------------------------------------------------- */
/* lerUsuarioSessao                                         */
/* --------------------------------------------------------- */

window.lerUsuarioSessao =
function () {

    const logado =
        sessionStorage.getItem(
            'dominus_logado'
        )
        ===
        'true';

    if (
        !logado
    ) {

        return null;
    }

    const bruto =
        sessionStorage.getItem(
            'dominus_usuario'
        );

    if (
        bruto
    ) {

        try{

            const usuario =
                JSON.parse(
                    bruto
                );

            if (
                usuario
                &&
                usuario.id
                &&
                usuario.usuario
            ) {

                return usuario;
            }

        }
        catch(erro){

            console.error(
                'Erro ao ler sessão:',
                erro
            );
        }
    }

    /*
        Compatibilidade com a sessão antiga do sistema.
    */

    sessionStorage.setItem(
        'dominus_usuario',
        JSON.stringify(
            window.MASTER_DOMINUS
        )
    );

    return {
        ...window.MASTER_DOMINUS
    };
};


/* --------------------------------------------------------- */
/* usuarioAtualSistema                                      */
/* --------------------------------------------------------- */

window.usuarioAtualSistema =
function () {

    return window
        .lerUsuarioSessao();
};


/* --------------------------------------------------------- */
/* usuarioEhAdministrador                                   */
/* --------------------------------------------------------- */

window.usuarioEhAdministrador =
function () {

    const usuario =
        usuarioAtualSistema();

    return (
        usuario
        &&
        (
            usuario.master ===
                true
            ||
            usuario.tipo ===
                'administrador'
        )
    );
};


/* --------------------------------------------------------- */
/* usuarioPodeAcessarPagina                                 */
/* --------------------------------------------------------- */

window.usuarioPodeAcessarPagina =
function (
    pagina
) {

    const usuario =
        usuarioAtualSistema();

    if (
        !usuario
    ) {

        return false;
    }

    /*
        Administradores possuem acesso literalmente a tudo.
    */

    if (
        usuarioEhAdministrador()
    ) {

        return true;
    }

    /*
        Cadastro de Logins é sempre exclusivo de Administrador.
    */

    if (
        pagina ===
        'usuarios'
    ) {

        return false;
    }

    return (
        Array.isArray(
            usuario.permissoes
        )
        &&
        usuario.permissoes.includes(
            pagina
        )
    );
};


/* --------------------------------------------------------- */
/* primeiraPaginaPermitida                                  */
/* --------------------------------------------------------- */

window.primeiraPaginaPermitida =
function () {

    const preferencia = [
        'dash',
        'agenda',
        'orcamentos',
        'ordens-servico',
        'clientes',
        'estoque',
        'financeiro',
        'recibos',
        'funcionarios',
        'fornecedores',
        'centro-custos',
        'relatorios',
        'backup',
        'atualizacao',
        'sobre'
    ];

    const encontrada =
        preferencia.find(
            pagina =>
                usuarioPodeAcessarPagina(
                    pagina
                )
        );

    return (
        encontrada
        ||
        (
            usuarioEhAdministrador()
                ?
                'dash'
                :
                null
        )
    );
};


/* --------------------------------------------------------- */
/* atualizarUsuarioNoMenu                                   */
/* --------------------------------------------------------- */

window.atualizarUsuarioNoMenu =
function () {

    const usuario =
        usuarioAtualSistema();

    const nome =
        document.getElementById(
            'usuario-logado-nome'
        );

    const tipo =
        document.getElementById(
            'usuario-logado-tipo'
        );

    if (
        nome
    ) {

        nome.innerText =
            usuario?.usuario
            ||
            '-';
    }

    if (
        tipo
    ) {

        tipo.innerText =
            usuarioEhAdministrador()
                ?
                (
                    usuario?.master
                        ?
                        'Administrador Master'
                        :
                        'Administrador'
                )
                :
                'Funcionário';
    }
};


/* --------------------------------------------------------- */
/* aplicarPermissoesMenu                                    */
/* --------------------------------------------------------- */

window.aplicarPermissoesMenu =
function () {

    document
        .querySelectorAll(
            '.nav-item'
        )
        .forEach(
            item => {

                const onclick =
                    item.getAttribute(
                        'onclick'
                    )
                    ||
                    '';

                const match =
                    onclick.match(
                        /navigate\('([^']+)'\)/
                    );

                if (
                    !match
                ) {

                    return;
                }

                const pagina =
                    match[1];

                const permitido =
                    usuarioPodeAcessarPagina(
                        pagina
                    );

                item.style.display =
                    permitido
                        ?
                        ''
                        :
                        'none';
            }
        );

    /*
        Esconde grupos do menu que ficaram sem nenhuma tela visível.
    */

    document
        .querySelectorAll(
            '.nav-group'
        )
        .forEach(
            grupo => {

                let proximo =
                    grupo.nextElementSibling;

                let temVisivel =
                    false;

                while(
                    proximo
                    &&
                    !proximo.classList.contains(
                        'nav-group'
                    )
                ){

                    if(
                        proximo.classList.contains(
                            'nav-item'
                        )
                        &&
                        proximo.style.display !==
                            'none'
                    ){

                        temVisivel =
                            true;

                        break;
                    }

                    proximo =
                        proximo.nextElementSibling;
                }

                grupo.style.display =
                    temVisivel
                        ?
                        ''
                        :
                        'none';
            }
        );

    atualizarUsuarioNoMenu();
};


/* --------------------------------------------------------- */
/* sincronizarSessaoComBanco                                */
/* --------------------------------------------------------- */
/*
    Depois de carregar o banco:
    - Administrador Master continua fixo;
    - demais usuários são atualizados com as permissões atuais;
    - se um login foi excluído, a sessão é encerrada.
*/

window.sincronizarSessaoComBanco =
function () {

    const sessao =
        usuarioAtualSistema();

    if (
        !sessao
    ) {

        window.location.href =
            'Dominus ERP.html';

        return false;
    }

    if (
        sessao.master ===
        true
    ) {

        sessionStorage.setItem(
            'dominus_usuario',
            JSON.stringify(
                window.MASTER_DOMINUS
            )
        );

        return true;
    }

    const usuarios =
        Array.isArray(
            window.db?.usuariosSistema
        )
        ?
        window.db.usuariosSistema
        :
        [];

    const atualizado =
        usuarios.find(
            usuario =>
                String(
                    usuario.id
                )
                ===
                String(
                    sessao.id
                )
        );

    if (
        !atualizado
    ) {

        sessionStorage.clear();

        alert(
            'Este login não está mais cadastrado no sistema.'
        );

        window.location.href =
            'Dominus ERP.html';

        return false;
    }

    const novaSessao = {

        id:
            atualizado.id,

        usuario:
            atualizado.usuario,

        tipo:
            atualizado.tipo ===
                'administrador'
                ?
                'administrador'
                :
                'funcionario',

        permissoes:
            atualizado.tipo ===
                'administrador'
                ?
                []
                :
                (
                    Array.isArray(
                        atualizado.permissoes
                    )
                    ?
                    atualizado.permissoes
                    :
                    []
                ),

        master:
            false
    };

    sessionStorage.setItem(
        'dominus_usuario',
        JSON.stringify(
            novaSessao
        )
    );

    return true;
};


/* --------------------------------------------------------- */
/* sairSistema                                              */
/* --------------------------------------------------------- */

window.sairSistema =
function () {

    sessionStorage.clear();

    window.location.href =
        'Dominus ERP.html';
};



/* ========================= */
/* REGISTRAR PÁGINAS */
/* ========================= */

window.registerPage = function (nome, renderFn) {

    if (!nome || typeof renderFn !== 'function') {
        console.error('Página inválida:', nome);
        return;
    }

    window.pages[nome] = renderFn;
};

/* ========================= */
/* NAVEGAÇÃO */
/* ========================= */

window.currentPage = null;

window.navigate = async function (pagina, atualizar = true) {

    try {

        /* ========================= */
        /* REGISTRA PÁGINA ATUAL */
        /* ========================= */

        window.currentPage =
            pagina;

        /* ========================= */
/* SINCRONIZA DB */
/* ========================= */
if (atualizar) {

    try {

        await loadDB();

    } catch (err) {

        console.error(
            'Erro sincronizar DB:',
            err
        );

    }

}

/* ========================= */
/* SESSÃO / PERMISSÃO */
/* ========================= */

if(
    !sincronizarSessaoComBanco()
){

    return;
}

aplicarPermissoesMenu();

if(
    !usuarioPodeAcessarPagina(
        pagina
    )
){

    const destino =
        primeiraPaginaPermitida();

    if(
        !destino
    ){

        const viewPortSemPermissao =
            document.getElementById(
                'view-port'
            );

        if(
            viewPortSemPermissao
        ){

            viewPortSemPermissao.innerHTML = `

                <div class="content-card">

                    <h2>
                        Sem telas liberadas
                    </h2>

                    <p style="margin-top:10px;color:#64748b;">
                        Este login ainda não possui nenhuma tela liberada.
                        Solicite acesso a um Administrador.
                    </p>

                </div>

            `;
        }

        return;
    }

    pagina =
        destino;

    window.currentPage =
        destino;
}

/* ========================= */
/* VIEW PORT */
/* ========================= */

const viewPort =
    document.getElementById(
        'view-port'
    );

if (!viewPort) {

    console.error(
        'view-port não encontrado.'
    );

    return;

}

/* ========================= */
/* RENDER DA PÁGINA */
/* ========================= */

const render =

    window.pages[
        pagina
    ];

if (!render) {

    console.error(

        `Página "${pagina}" não registrada.`

    );

    viewPort.innerHTML = `

        <div class="content-card">

            <h2 style="
                color:#dc2626;
                margin-bottom:10px;
            ">

                Página não encontrada

            </h2>

            <p>

                A página
                <strong>${pagina}</strong>
                não foi registrada.

            </p>

        </div>

    `;

    return;

}

        /* ========================= */
        /* FECHA MODAL */
        /* ========================= */

        closeModal();

        /* ========================= */
        /* RENDERIZA */
        /* ========================= */

        viewPort.innerHTML =

            render();

            /* ========================= */
/* VERSÃO SISTEMA */
/* ========================= */

if(

    pagina === 'atualizacao'

){

    setTimeout(

        async()=>{

            try{

                const versao =

                    await window.api
                    .getVersion();

                const el =

                    document.getElementById(
                        'versao-instalada'
                    );

                if(el){

                    el.innerText =
                        'v' + versao;

                }

            }

            catch(err){

                console.error(err);

            }

        },

        50

    );

}

        /* ========================= */
        /* MENU ATIVO */
        /* ========================= */

        document
        .querySelectorAll(
            '.nav-item'
        )
        .forEach(item=>{

            const onclick =

                item.getAttribute(
                    'onclick'
                ) || '';

            item.classList.toggle(

                'active',

                onclick.includes(

                    `'${pagina}'`

                )

            );

        });

        /* ========================= */
        /* TOPO */
        /* ========================= */

        viewPort.scrollTop =
            0;

    }

    catch(err){

        console.error(err);

        document
        .getElementById(
            'view-port'
        )
        .innerHTML = `

            <div class="content-card">

                <h2 style="
                    color:#dc2626;
                    margin-bottom:10px;
                ">

                    Erro ao carregar página

                </h2>

                <pre style="
                    white-space:pre-wrap;
                    color:#444;
                    margin-top:10px;
                ">

${err}

                </pre>

            </div>

        `;

    }

};
/* ========================= */
/* DELETE GLOBAL */
/* ========================= */

window.deleteItem = function (tipo, index, btn = null) {

    if (!window.db[tipo]) {
        console.error('Tabela inexistente:', tipo);
        return;
    }

    const confirmar =
        confirm(
            'Deseja realmente excluir este registro?'
        );

    if (!confirmar) return;

    window.db[tipo].splice(index, 1);

    save();

    // REMOVE LINHA DIRETO
    if (btn) {

        const tr = btn.closest('tr');

        if (tr) {
            tr.remove();
        }

        return;
    }

    // REDIRECIONAMENTO
    const destinos = {

        contatos: 'clientes',
        financeiro: 'financeiro',
        estoque: 'estoque',
        funcionarios: 'funcionarios',
        orcamentos: 'orcamentos',
        recibos: 'recibos'
    };

    navigate(
        destinos[tipo] || 'dash'
    );
};

/* ========================= */
/* STATUS FINANCEIRO */
/* ========================= */

window.getStatus = function (f) {

    if (!f) return '-';

   if (
    f.status &&
    f.status.toLowerCase() === 'pago'
) {

        return `
            <span class="status pago">
                Pago
            </span>
        `;
    }

    const hoje =
        new Date().toISOString().split('T')[0];

    if (
        f.vencimento &&
        f.vencimento < hoje
    ) {

        return `
            <span class="status vencido">
                Vencido
            </span>
        `;
    }

    return `
        <span class="status pendente">
            Pendente
        </span>
    `;
};

/* ========================= */
/* INICIALIZAÇÃO */
/* ========================= */

window.addEventListener(

    'load',

    async()=>{

        await loadDB();

        if(
            !sincronizarSessaoComBanco()
        ){

            return;
        }

        aplicarPermissoesMenu();

        const primeira =
            primeiraPaginaPermitida();

        if(
            primeira
        ){

            navigate(
                primeira,
                false
            );

            return;
        }

        const viewPort =
            document.getElementById(
                'view-port'
            );

        if(
            viewPort
        ){

            viewPort.innerHTML = `

                <div class="content-card">

                    <h2>
                        Sem telas liberadas
                    </h2>

                    <p style="margin-top:10px;color:#64748b;">
                        Este login ainda não possui nenhuma permissão.
                    </p>

                </div>

            `;
        }

    }

);
/* ========================= */
/* AUTO REFRESH INTELIGENTE */
/* ========================= */

window.isEditing = false;

document.addEventListener(
    'focusin',
    ()=>{

        const el =
            document.activeElement;

        if(
            el && (

                el.tagName === 'INPUT' ||

                el.tagName === 'TEXTAREA' ||

                el.tagName === 'SELECT' ||

                el.isContentEditable

            )
        ){

            window.isEditing =
                true;

        }

    }
);

document.addEventListener(
    'focusout',
    ()=>{

        setTimeout(()=>{

            const el =
                document.activeElement;

            window.isEditing = !!(

                el && (

                    el.tagName === 'INPUT' ||

                    el.tagName === 'TEXTAREA' ||

                    el.tagName === 'SELECT' ||

                    el.isContentEditable

                )

            );

        },150);

    }
);

setInterval(

    async()=>{

        try{

            if(
                !window.currentPage
            ){
                return;
            }

            /* NÃO atualizar digitando */

            if(
                window.isEditing
            ){
                return;
            }

            /* NÃO atualizar modal aberto */

            const modal =
                document.getElementById(
                    'modal-global'
                );

            if(

                modal &&

                !modal.classList.contains(
                    'hidden'
                )

            ){

                return;

            }

            const response =
                await fetch(
                    `${API_URL}/db`
                );

            const novoDB =
                await response.json();

            if(

                JSON.stringify(
                    window.db
                )

                !==

                JSON.stringify(
                    novoDB
                )

            ){

                window.db =
                    novoDB;

                if(
                    !sincronizarSessaoComBanco()
                ){

                    return;
                }

                aplicarPermissoesMenu();

                if(
                    window.currentPage
                    &&
                    !usuarioPodeAcessarPagina(
                        window.currentPage
                    )
                ){

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
                }

            }

        }

        catch(err){

            console.error(
                'Auto Refresh:',
                err
            );

        }

    },

    5000

);