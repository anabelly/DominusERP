/* ========================= */
/* APP PRINCIPAL */
/* ========================= */

window.pages = {};

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

window.navigate = async function (pagina) {

    try {

        /* ========================= */
        /* REGISTRA PÁGINA ATUAL */
        /* ========================= */

        window.currentPage =
            pagina;

        /* ========================= */
/* SINCRONIZA DB */
/* ========================= */

try{

    await loadDB();

}

catch(err){

    console.error(

        'Erro sincronizar DB:',

        err

    );

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

    if (f.status === 'pago') {

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

        navigate(
            'dash'
        );

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

            window.isEditing =

                !!(

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

            /* NÃO atualizar enquanto edita */

            if(

                window.isEditing

            ){

                return;

            }

            /* NÃO atualizar modal aberto */

            if(

                document.querySelector(

                    '.modal-overlay'

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