/* ========================================================= */
/* DOMINUS ERP - MODAL.JS                                    */
/* ========================================================= */
/*
    CONTROLE DO MODAL GLOBAL DO SISTEMA

    Este arquivo concentra as funções responsáveis por
    abrir, fechar, resetar e configurar o modal reutilizado
    por diversas telas do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Abrir o modal global
    2. Fechar o modal global
    3. Limpar título, campos e botão
    4. Configurar título e conteúdo
    5. Configurar botão de confirmação
    6. Executar ação ao confirmar
    7. Permitir fechar o modal com a tecla ESC

    IMPORTANTE:
    Apenas a organização e os comentários foram alterados.
    A lógica original foi preservada.
*/


/* ========================================================= */
/* 01. ABRIR MODAL GLOBAL                                    */
/* ========================================================= */
/*
    showModal()

    Localiza o elemento #modal-global e remove a classe
    "hidden", tornando o modal visível.

    Se o modal não existir no HTML, registra o erro no console.
*/

window.showModal = function () {

    const modal = document.getElementById('modal-global');

    if (!modal) {
        console.error('Modal global não encontrado.');
        return;
    }

    modal.classList.remove('hidden');
};


/* ========================================================= */
/* 02. FECHAR MODAL GLOBAL                                   */
/* ========================================================= */
/*
    closeModal()

    Adiciona novamente a classe "hidden" ao modal
    e chama resetModal() para limpar o estado anterior.
*/

window.closeModal = function () {

    const modal = document.getElementById('modal-global');

    if (!modal) return;

    modal.classList.add('hidden');

    resetModal();
};


/* ========================================================= */
/* 03. RESETAR MODAL                                         */
/* ========================================================= */
/*
    resetModal()

    Limpa o conteúdo reutilizável do modal sem destruir
    a estrutura principal do DOM.

    O reset atua em:
    - título
    - inputs
    - textareas
    - selects
    - checkboxes
    - radios
    - estado disabled/readOnly
    - botão de confirmação
*/

window.resetModal = function () {

    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm');

    /* ===================================================== */
    /* 03.1 LIMPAR TÍTULO                                    */
    /* ===================================================== */
    if (title) {
        title.innerText = '';
    }

    /* ===================================================== */
    /* 03.2 LIMPAR CAMPOS SEM DESTRUIR O DOM                 */
    /* ===================================================== */
    /*
        Percorre os campos existentes dentro de #modal-body.

        Checkbox e radio:
            desmarca.

        Outros campos:
            limpa o valor.

        Depois reativa os campos, removendo disabled/readOnly.
    */
    if (body) {

        const fields = body.querySelectorAll('input, textarea, select');

        fields.forEach(el => {

            /* LIMPAR VALOR DO CAMPO */
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = false;
            } else {
                el.value = '';
            }

            /* RESTAURAR ESTADO NORMAL DO CAMPO */
            el.disabled = false;
            el.readOnly = false;

        });
    }

    /* ===================================================== */
    /* 03.3 RESETAR BOTÃO DE CONFIRMAÇÃO                     */
    /* ===================================================== */
    /*
        Volta o botão para o estado padrão:
        - texto "Salvar"
        - visível
        - habilitado
        - sem ação onclick anterior
    */
    if (confirmBtn) {

        confirmBtn.innerText = 'Salvar';
        confirmBtn.style.display = 'inline-flex';
        confirmBtn.disabled = false;
        confirmBtn.onclick = null;
    }
};


/* ========================================================= */
/* 04. CONFIGURAR MODAL                                      */
/* ========================================================= */
/*
    configModal({...})

    Parâmetros disponíveis:
    - title
    - body
    - confirmText
    - onConfirm
    - hideConfirm

    A função:
    1. define o título
    2. insere o HTML no corpo
    3. configura o botão
    4. associa a ação de confirmação
    5. abre o modal
*/

window.configModal = function ({
    title = '',
    body = '',
    confirmText = 'Salvar',
    onConfirm = null,
    hideConfirm = false
}) {

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm');

    /* ===================================================== */
    /* 04.1 DEFINIR TÍTULO                                   */
    /* ===================================================== */
    if (modalTitle) {
        modalTitle.innerText = title;
    }

    /* ===================================================== */
    /* 04.2 DEFINIR CONTEÚDO DO MODAL                        */
    /* ===================================================== */
    /*
        O parâmetro body é inserido através de innerHTML.
    */
    if (modalBody) {
        modalBody.innerHTML = body;
    }

    /* ===================================================== */
    /* 04.3 CONFIGURAR BOTÃO DE CONFIRMAÇÃO                  */
    /* ===================================================== */
    /*
        Define:
        - texto
        - visibilidade
        - estado habilitado
        - ação executada no clique
    */
    if (confirmBtn) {

        confirmBtn.innerText = confirmText;

        confirmBtn.style.display = hideConfirm ? 'none' : 'inline-flex';

        confirmBtn.disabled = false;

        confirmBtn.onclick = function (e) {

            e.preventDefault();
            e.stopPropagation();

            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        };
    }

    showModal();
};


/* ========================================================= */
/* 05. FECHAR MODAL COM A TECLA ESC                         */
/* ========================================================= */
/*
    Escuta o evento keydown do documento.

    Se a tecla pressionada for Escape e o modal estiver aberto,
    chama closeModal().
*/

document.addEventListener('keydown', function (e) {

    if (e.key === 'Escape') {

        const modal = document.getElementById('modal-global');

        if (modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    }
});