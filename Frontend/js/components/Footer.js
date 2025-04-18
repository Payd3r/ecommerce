/**
 * Componente Footer per il piè di pagina del sito
 */
class Footer {
    constructor() {
        this.container = document.getElementById('footer-container');
    }
    
    /**
     * Renderizza il footer nell'elemento container
     */
    render() {
        const currentYear = new Date().getFullYear();
        
        // Crea il footer principale con Bootstrap
        const footer = document.createElement('footer');
        footer.className = 'bg-light border-top pt-5 pb-3';
        footer.innerHTML = `
            <div class="container">
                <div class="row gy-4">
                    <div class="col-12 col-md-5">
                        <div class="mb-2 h4">ArtigianatoShop</div>
                        <p class="text-muted">Il meglio dell'artigianato italiano, direttamente a casa tua. Scopri prodotti unici realizzati da artigiani locali con passione e tradizione.</p>
                        <div class="d-flex gap-3 mt-3">
                            <a href="#" aria-label="Facebook" class="text-secondary fs-5"><i class="bi bi-facebook"></i></a>
                            <a href="#" aria-label="Instagram" class="text-secondary fs-5"><i class="bi bi-instagram"></i></a>
                            <a href="#" aria-label="Twitter" class="text-secondary fs-5"><i class="bi bi-twitter"></i></a>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <h5 class="mb-3">Link utili</h5>
                        <ul class="list-unstyled">
                            <li><a href="/products" data-route class="text-decoration-none text-secondary">Prodotti</a></li>
                            <li><a href="/categories" data-route class="text-decoration-none text-secondary">Categorie</a></li>
                            <li><a href="/artisans" data-route class="text-decoration-none text-secondary">Artigiani</a></li>
                            <li><a href="/about" data-route class="text-decoration-none text-secondary">Chi siamo</a></li>
                            <li><a href="/contact" data-route class="text-decoration-none text-secondary">Contatti</a></li>
                        </ul>
                    </div>
                    <div class="col-12 col-md-3">
                        <h5 class="mb-3">Contatti</h5>
                        <p class="mb-1">Via dell'Artigianato, 123<br>00100 Roma, Italia</p>
                        <p class="mb-1">Email: <a href="mailto:info@artigianatoshop.it" class="text-decoration-none">info@artigianatoshop.it</a></p>
                        <p>Telefono: +39 06 1234567</p>
                    </div>
                </div>
                <hr class="my-4">
                <div class="text-center text-muted small">&copy; ${currentYear} ArtigianatoShop. Tutti i diritti riservati.</div>
            </div>
        `;
        
        // Pulisce e aggiunge il footer al container
        this.container.innerHTML = '';
        this.container.appendChild(footer);
    }
}

// Esporto un'istanza singola del componente Footer
export const footer = new Footer(); 