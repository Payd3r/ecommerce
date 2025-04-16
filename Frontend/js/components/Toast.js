/**
 * Componente Toast per le notifiche
 */
class Toast {
    constructor() {
        this.container = document.getElementById('toast-container');
        
        // Se il container non esiste, lo creo
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
        
        // Timeout predefinito per i toast
        this.defaultDuration = 3000;
    }
    
    /**
     * Mostra un toast di successo
     * @param {string} message - Messaggio da mostrare
     * @param {string} title - Titolo del toast (opzionale)
     * @param {number} duration - Durata in millisecondi (opzionale)
     */
    success(message, title = 'Successo', duration = this.defaultDuration) {
        this.show(message, title, 'success', duration);
    }
    
    /**
     * Mostra un toast di errore
     * @param {string} message - Messaggio da mostrare
     * @param {string} title - Titolo del toast (opzionale)
     * @param {number} duration - Durata in millisecondi (opzionale)
     */
    error(message, title = 'Errore', duration = this.defaultDuration) {
        this.show(message, title, 'error', duration);
    }
    
    /**
     * Mostra un toast di avviso
     * @param {string} message - Messaggio da mostrare
     * @param {string} title - Titolo del toast (opzionale)
     * @param {number} duration - Durata in millisecondi (opzionale)
     */
    warning(message, title = 'Attenzione', duration = this.defaultDuration) {
        this.show(message, title, 'warning', duration);
    }
    
    /**
     * Mostra un toast informativo
     * @param {string} message - Messaggio da mostrare
     * @param {string} title - Titolo del toast (opzionale)
     * @param {number} duration - Durata in millisecondi (opzionale)
     */
    info(message, title = 'Informazione', duration = this.defaultDuration) {
        this.show(message, title, 'info', duration);
    }
    
    /**
     * Mostra un toast personalizzato
     * @param {string} message - Messaggio da mostrare
     * @param {string} title - Titolo del toast
     * @param {string} type - Tipo di toast ('success', 'error', 'warning', 'info')
     * @param {number} duration - Durata in millisecondi
     */
    show(message, title, type, duration) {
        // Creo l'elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Definisco le icone per ogni tipo di toast
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        // Struttura HTML del toast
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        // Aggiungo il toast al container
        this.container.appendChild(toast);
        
        // Mostro il toast con un leggero ritardo per far partire l'animazione
        setTimeout(() => {
            toast.classList.add('active');
        }, 10);
        
        // Aggiungo event listener per il pulsante di chiusura
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            this.closeToast(toast);
        });
        
        // Imposto il timeout per la chiusura automatica
        const timeout = setTimeout(() => {
            this.closeToast(toast);
        }, duration);
        
        // Interrompo il timeout se l'utente passa sopra al toast
        toast.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
        });
        
        // Ripristino il timeout se l'utente esce dal toast
        toast.addEventListener('mouseleave', () => {
            setTimeout(() => {
                this.closeToast(toast);
            }, duration / 2);
        });
    }
    
    /**
     * Chiude un toast con animazione
     * @param {HTMLElement} toast - Elemento toast da chiudere
     */
    closeToast(toast) {
        // Rimuovo la classe active per avviare l'animazione di uscita
        toast.classList.remove('active');
        
        // Rimuovo l'elemento dal DOM dopo l'animazione
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Esporto un'istanza singola del componente Toast
export const toast = new Toast(); 