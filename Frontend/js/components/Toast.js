/**
 * Toast Bootstrap 5 - Notifiche
 * Usa il container #toast-container già presente in index.html
 * Tipi supportati: success, error, warning, info
 */

export function showBootstrapToast(message, title = '', type = 'info', delay = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Colori Bootstrap
    const typeClass = {
        success: 'bg-success text-white',
        error: 'bg-danger text-white',
        warning: 'bg-warning text-dark',
        info: 'bg-info text-white'
    }[type] || 'bg-info text-white';

    // Crea l'elemento toast
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center border-0 ${typeClass}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.setAttribute('data-bs-delay', delay);

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${title ? `<strong class="me-2">${title}</strong>` : ''}${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(toastEl);

    // Mostra il toast con l'API Bootstrap
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Rimuovi il toast dal DOM dopo la chiusura
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
} 