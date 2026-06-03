/* ========================= */
/* MODAL GLOBAL */
/* ========================= */

window.showModal = function () {

    const modal = document.getElementById('modal-global');

    if (!modal) {
        console.error('Modal global não encontrado.');
        return;
    }

    modal.classList.remove('hidden');
};


/* ========================= */
/* FECHAR MODAL */
/* ========================= */

window.closeModal = function () {

    const modal = document.getElementById('modal-global');

    if (!modal) return;

    modal.classList.add('hidden');

    resetModal();
};


/* ========================= */
/* RESETAR MODAL (CORRIGIDO E SEGURO) */
/* ========================= */

window.resetModal = function () {

    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm');

    /* RESET TÍTULO */
    if (title) {
        title.innerText = '';
    }

    /* RESET CAMPOS (SEM DESTRUIR DOM) */
    if (body) {

        const fields = body.querySelectorAll('input, textarea, select');

        fields.forEach(el => {

            // limpa valor
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = false;
            } else {
                el.value = '';
            }

            // garante estado normal
            el.disabled = false;
            el.readOnly = false;

        });
    }

    /* RESET BOTÃO */
    if (confirmBtn) {

        confirmBtn.innerText = 'Salvar';
        confirmBtn.style.display = 'inline-flex';
        confirmBtn.disabled = false;
        confirmBtn.onclick = null;
    }
};


/* ========================= */
/* CONFIGURAR MODAL */
/* ========================= */

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

    /* TÍTULO */
    if (modalTitle) {
        modalTitle.innerText = title;
    }

    /* BODY */
    if (modalBody) {
        modalBody.innerHTML = body;
    }

    /* BOTÃO */
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


/* ========================= */
/* ESC FECHA MODAL */
/* ========================= */

document.addEventListener('keydown', function (e) {

    if (e.key === 'Escape') {

        const modal = document.getElementById('modal-global');

        if (modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    }
});