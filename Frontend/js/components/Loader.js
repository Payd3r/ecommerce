/**
 * Componente Loader per gestire gli indicatori di caricamento
 */
class Loader {
    constructor() {
        this.container = document.getElementById('loader-container');
        
        // Se il container non esiste, lo creo
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'loader-container';
            
            // Creo l'elemento loader
            const loader = document.createElement('div');
            loader.className = 'loader';
            this.container.appendChild(loader);
            
            document.body.appendChild(this.container);
        }
        
        // Contatore delle richieste attive
        this.activeRequests = 0;
    }
    
    /**
     * Mostra il loader globale
     */
    show() {
        this.activeRequests++;
        this.container.classList.add('active');
        document.body.style.overflow = 'hidden'; // Blocca lo scroll
    }
    
    /**
     * Nasconde il loader globale
     */
    hide() {
        this.activeRequests--;
        
        // Nascondo il loader solo se non ci sono altre richieste attive
        if (this.activeRequests <= 0) {
            this.activeRequests = 0;
            this.container.classList.remove('active');
            document.body.style.overflow = ''; // Ripristina lo scroll
        }
    }
    
    /**
     * Crea un loader da aggiungere a un elemento specifico
     * @param {HTMLElement} element - Elemento a cui aggiungere il loader
     * @param {Object} options - Opzioni di configurazione
     * @returns {HTMLElement} - Elemento loader creato
     */
    createElementLoader(element, options = {}) {
        const defaults = {
            size: 'medium', // small, medium, large
            color: 'primary', // primary, secondary, accent
            absolute: false // se true, il loader è posizionato in modo assoluto rispetto all'elemento
        };
        
        const config = { ...defaults, ...options };
        
        // Creo l'elemento loader
        const loaderElement = document.createElement('div');
        loaderElement.className = `element-loader ${config.size} ${config.color}`;
        
        if (config.absolute) {
            loaderElement.style.position = 'absolute';
            
            // Verifico se l'elemento ha position relative
            const elementPosition = window.getComputedStyle(element).position;
            if (elementPosition !== 'relative' && elementPosition !== 'absolute') {
                element.style.position = 'relative';
            }
        }
        
        // Creo lo spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loaderElement.appendChild(spinner);
        
        // Aggiungo il loader all'elemento
        element.appendChild(loaderElement);
        
        // Ritorno l'elemento loader per poterlo rimuovere in seguito
        return loaderElement;
    }
    
    /**
     * Rimuove un loader creato con createElementLoader
     * @param {HTMLElement} loaderElement - Elemento loader da rimuovere
     */
    removeElementLoader(loaderElement) {
        if (loaderElement && loaderElement.parentNode) {
            loaderElement.parentNode.removeChild(loaderElement);
        }
    }
}

// Esporto un'istanza singola del componente Loader
export const loader = new Loader(); 