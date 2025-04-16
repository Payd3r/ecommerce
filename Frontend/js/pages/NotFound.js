/**
 * Carica la pagina 404 (Non trovata)
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadNotFoundPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'not-found-page';
    
    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container text-center">
            <div class="error-container">
                <div class="error-code">404</div>
                <h1>Pagina non trovata</h1>
                <p>La pagina che stai cercando non esiste o è stata spostata.</p>
                <a href="/" class="btn btn-primary" data-route>Torna alla Home</a>
            </div>
        </div>
    `;
    
    return {
        render: () => pageElement,
        mount: () => {}, // Nessuna operazione di mount necessaria
        unmount: () => {} // Nessuna operazione di unmount necessaria
    };
}