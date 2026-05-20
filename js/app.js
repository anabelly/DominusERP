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

window.navigate = function (pagina) {

    try {

        const viewPort =
            document.getElementById('view-port');

        if (!viewPort) {
            console.error('view-port não encontrado.');
            return;
        }

        const render =
            window.pages[pagina];

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

        // FECHA MODAL AO TROCAR DE TELA
        closeModal();

        // RENDERIZA PÁGINA
        viewPort.innerHTML =
            render();

        // MENU ATIVO
        document
            .querySelectorAll('.nav-item')
            .forEach(item => {

                const onclick =
                    item.getAttribute('onclick') || '';

                item.classList.toggle(
                    'active',
                    onclick.includes(`'${pagina}'`)
                );
            });

        // VOLTA TOPO
        viewPort.scrollTop = 0;

    } catch (err) {

        console.error(err);

        document.getElementById('view-port').innerHTML = `

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