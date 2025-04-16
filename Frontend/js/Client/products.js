console.log('products.js caricato');

import { getProducts, getCategories, getArtisans } from '../../api/products.js';

export class ProductsManager {
    constructor() {
        this.currentPage = 1;
        this.filters = {};
        this.productsContainer = document.getElementById('products-grid');
        this.paginationContainer = document.getElementById('pagination');
        this.filtersContainer = document.getElementById('filters-container');
    }

    async init() {
        console.log('Inizializzazione ProductsManager...');
        try {
            await this.loadComponents();
            await this.setupFilters();
            await this.loadProducts();
            this.setupEventListeners();
            console.log('ProductsManager inizializzato con successo');
        } catch (error) {
            console.error('Errore durante l\'inizializzazione:', error);
            this.showError('Errore durante l\'inizializzazione della pagina prodotti');
        }
    }

    async loadComponents() {
        try {
            console.log('Caricamento componenti...');
            // Carica il template dei filtri
            const filtersResponse = await fetch('/Frontend/html/Client/components/filters.html');
            if (!filtersResponse.ok) throw new Error('Errore nel caricamento del template dei filtri');
            const filtersHtml = await filtersResponse.text();
            if (!this.filtersContainer) throw new Error('Elemento filters-container non trovato');
            this.filtersContainer.innerHTML = filtersHtml;

            // Carica il template della card prodotto
            const cardResponse = await fetch('/Frontend/html/Client/components/cardProduct.html');
            if (!cardResponse.ok) throw new Error('Errore nel caricamento del template della card prodotto');
            this.cardTemplate = await cardResponse.text();
            
            console.log('Componenti caricati con successo');
        } catch (error) {
            console.error('Errore nel caricamento dei componenti:', error);
            throw error;
        }
    }

    async setupFilters() {
        try {
            console.log('Configurazione filtri...');
            const categorySelect = document.getElementById('categoryFilter');
            const artisanSelect = document.getElementById('artisanFilter');
            
            if (!categorySelect || !artisanSelect) {
                throw new Error('Elementi dei filtri non trovati');
            }

            // Carica le categorie
            const categories = await getCategories();
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });

            // Carica gli artigiani
            const artisans = await getArtisans();
            artisans.forEach(artisan => {
                const option = document.createElement('option');
                option.value = artisan.id;
                option.textContent = artisan.name;
                artisanSelect.appendChild(option);
            });

            console.log('Filtri configurati con successo');
        } catch (error) {
            console.error('Errore nel caricamento delle opzioni dei filtri:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const filtersForm = document.getElementById('filtersForm');
        if (!filtersForm) {
            console.error('Form dei filtri non trovato');
            return;
        }

        // Gestione submit del form dei filtri
        filtersForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(filtersForm);
            this.filters = {
                name: formData.get('name') || '',
                category_id: formData.get('category') || '',
                artisan_id: formData.get('artisan') || '',
                min_price: formData.get('minPrice') || '',
                max_price: formData.get('maxPrice') || ''
            };
            this.currentPage = 1;
            await this.loadProducts();
        });

        // Gestione reset dei filtri
        const resetButton = document.getElementById('resetFilters');
        if (resetButton) {
            resetButton.addEventListener('click', async () => {
                filtersForm.reset();
                this.filters = {};
                this.currentPage = 1;
                await this.loadProducts();
            });
        }
    }

    async loadProducts() {
        try {
            if (!this.productsContainer) {
                throw new Error('Container dei prodotti non trovato');
            }

            const { products, total_pages } = await getProducts(this.currentPage, this.filters);
            this.renderProducts(products);
            this.renderPagination(total_pages);
        } catch (error) {
            console.error('Errore nel caricamento dei prodotti:', error);
            this.showError('Errore nel caricamento dei prodotti: ' + error.message);
        }
    }

    renderProducts(products) {
        if (!this.productsContainer) return;

        if (!products.length) {
            this.productsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        Nessun prodotto trovato con i filtri selezionati.
                    </div>
                </div>`;
            return;
        }

        this.productsContainer.innerHTML = products.map(product => {
            let template = this.cardTemplate;
            Object.keys(product).forEach(key => {
                const value = product[key] ?? '';
                template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });
            return template;
        }).join('');
    }

    renderPagination(totalPages) {
        if (!this.paginationContainer) return;
        
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        let html = `
            <nav aria-label="Navigazione pagine">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${this.currentPage - 1}">Precedente</a>
                    </li>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }

        html += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${this.currentPage + 1}">Successivo</a>
                    </li>
                </ul>
            </nav>`;

        this.paginationContainer.innerHTML = html;

        // Aggiungi event listener per la paginazione
        this.paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const newPage = parseInt(e.target.dataset.page);
                if (newPage && newPage !== this.currentPage && newPage > 0 && newPage <= totalPages) {
                    this.currentPage = newPage;
                    await this.loadProducts();
                }
            });
        });
    }

    showError(message) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Errore</h4>
                    <p>${message}</p>
                </div>`;
        } else {
            console.error(message);
        }
    }
} 