import CategoriesAPI from '../../../api/categories.js';
import { loader } from '../../components/Loader.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { router } from '../../router.js';

/**
 * Carica la pagina delle categorie con visualizzazione ad accordion
 */
export async function loadCategoryPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'category-page';

    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row mb-4">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold mb-2">Categorie</h1>
                    <p class="text-muted">Scopri tutte le categorie e sottocategorie disponibili</p>
                </div>
            </div>
            <div class="row justify-content-center">
                <div class="col-12 col-md-8">
                    <div class="accordion shadow-sm rounded-4 overflow-hidden" id="categoriesAccordion"></div>
                </div>
            </div>
        </div>
    `;

    // Funzione per renderizzare l'albero delle categorie
    function renderCategoryAccordion(categories) {
        const accordion = pageElement.querySelector('#categoriesAccordion');
        if (!categories.length) {
            accordion.innerHTML = '<div class="text-center text-muted py-5">Nessuna categoria trovata.</div>';
            return;
        }
        accordion.innerHTML = categories.map((cat, idx) => `
            <div class="accordion-item border-0  rounded-3 shadow-sm">
                <h2 class="accordion-header" id="heading${cat.id}">
                    <button class="accordion-button fw-semibold bg-white text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${cat.id}" aria-expanded="${idx === 0 ? 'true' : 'false'}" aria-controls="collapse${cat.id}">
                        <i class="bi bi-folder me-2"></i> ${cat.name}
                    </button>
                </h2>
                <div id="collapse${cat.id}" class="accordion-collapse collapse${idx === 0 ? ' show' : ''}" aria-labelledby="heading${cat.id}" data-bs-parent="#categoriesAccordion">
                    <div class="accordion-body bg-light rounded-bottom-3">
                        <div class="d-flex flex-wrap gap-3">
                            ${cat.children && cat.children.length ? cat.children.map(child => `
                                <button class="btn btn-outline-primary rounded-pill px-4 py-2 d-flex align-items-center gap-2 category-leaf-btn" data-id="${child.id}">
                                    <i class="bi bi-tag"></i> ${child.name}
                                </button>
                            `).join('') : '<span class="text-muted">Nessuna sottocategoria</span>'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        if (categories.length < 20) {
            pageElement.innerHTML += '<div class="col-12" style="height: 18vh;"></div>';
        }
    }

    
    // Carica le categorie
    async function loadCategories() {
        loader.show();
        try {
            const categories = await CategoriesAPI.getCategoryTree();
            renderCategoryAccordion(categories);
        } catch (error) {
            showBootstrapToast('Errore nel caricamento delle categorie', 'Errore', 'error');
        } finally {
            loader.hide();
        }
    }

    // Dopo il caricamento delle categorie
    function mount() {
        pageElement.addEventListener('click', (e) => {
            const btn = e.target.closest('.category-leaf-btn');
            if (btn) {
                const categoryId = btn.getAttribute('data-id');
                router.navigate(`/products?category=${categoryId}`);
            }
        });
    }

    await loadCategories();

    return {
        render: () => pageElement,
        mount
    };
}
