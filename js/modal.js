/* ========================= */
/* MODAL GLOBAL */
/* ========================= */

window.showModal = function () {

    const modal =
        document.getElementById('modal-global');

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

    const modal =
        document.getElementById('modal-global');

    if (!modal) return;

    modal.classList.add('hidden');

    resetModal();
};

/* ========================= */
/* RESETAR MODAL */
/* ========================= */

window.resetModal = function () {

    const title =
        document.getElementById('modal-title');

    const body =
        document.getElementById('modal-body');

    const confirmBtn =
        document.getElementById('modal-confirm');

    if (title) {
        title.innerText = '';
    }

    if (body) {
        body.innerHTML = '';
    }

    if (confirmBtn) {

        confirmBtn.innerText =
            'Salvar';

        confirmBtn.style.display =
            'inline-flex';

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

    const modalTitle =
        document.getElementById('modal-title');

    const modalBody =
        document.getElementById('modal-body');

    const confirmBtn =
        document.getElementById('modal-confirm');

    if (modalTitle) {
        modalTitle.innerText = title;
    }

    if (modalBody) {
        modalBody.innerHTML = body;
    }

    if (confirmBtn) {

        confirmBtn.innerText =
            confirmText;

        confirmBtn.style.display =
            hideConfirm
                ? 'none'
                : 'inline-flex';

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
/* FECHAR MODAL AO CLICAR FORA */
/* ========================= */

document.addEventListener('click', function (e) {

    const modal =
        document.getElementById('modal-global');

    if (!modal) return;

    if (
        e.target.id === 'modal-global'
    ) {
        closeModal();
    }
});

/* ========================= */
/* ESC FECHA MODAL */
/* ========================= */

document.addEventListener('keydown', function (e) {

    if (e.key === 'Escape') {
        closeModal();
    }
});