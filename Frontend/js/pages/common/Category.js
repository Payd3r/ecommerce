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
        <div class="container pb-5 mt-4 category-page">
            <div class="row">
                <div class="col-12 text-md-center text-start">
                    <h1 class="page-title mb-2">Categorie</h1>
                    <p class="page-subtitle">Scopri tutte le categorie e sottocategorie disponibili</p>
                </div>
            </div>
            <div class="row justify-content-center">
                <div class="col-12 col-md-8">
                    <div class="accordion shadow-sm rounded-4 overflow-hidden" id="categoriesAccordion"></div>
                </div>
            </div>
        </div>
    `;

    // Funzione per renderizzare l'albero delle categorie (visualizzazione ad albero con immagini)
    function renderCategoryTree(categories) {
        const container = pageElement.querySelector('.col-12.col-md-8');
        if (!categories.length) {
            container.innerHTML = '<div class="text-center text-muted py-5">Nessuna categoria trovata.</div>';
            return;
        }
        container.innerHTML = renderCategoryNodes(categories);
    }

    // Ricorsiva: genera HTML per ogni nodo e figli (accordion per i nodi con figli)
    function renderCategoryNodes(nodes, level = 0, parentKey = '') {
        return `<ul class="list-group list-group-flush mb-3">
            ${nodes.map((cat, idx) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const nodeKey = parentKey + 'n' + cat.id;
                return `
                    <li class="list-group-item bg-light rounded-3 p-0 ${hasChildren ? 'mb-3' : ''}" style="padding-left: ${level * 16 + 16}px;">
                        <div class="d-flex align-items-center gap-2 ${hasChildren ? 'category-accordion-header' : ''}" data-key="${nodeKey}" style="cursor: ${hasChildren ? 'pointer' : 'default'}; padding: 12px 16px;">
                            ${cat.image ? `<img src=\"${cat.image}\" alt=\"img\" style=\"margin-left:${level * 18}px; width:40px; height:40px; object-fit:cover; border-radius:8px; border:1.5px solid #e0e0e0;\" />` : ''}
                            <strong style=\"padding-left:${level * 18}px;\">${cat.name}</strong>
                            <span class="text-muted small ms-2 d-none d-md-inline">${cat.description || ''}</span>
                            ${hasChildren ? `<span class=\"ms-auto category-accordion-toggle\"><i class=\"bi bi-chevron-down\"></i></span>` : ''}
                        </div>
                        ${hasChildren ? `<div class=\"category-accordion-body collapse\" id=\"${nodeKey}\">${renderCategoryNodes(cat.children, level + 1, nodeKey)}</div>` : ''}
                    </li>
                `;
            }).join('')}
        </ul>`;
    }

    
    // Carica le categorie
    async function loadCategories() {
        loader.show();
        try {
            const categories = await CategoriesAPI.getCategoryTree();
            renderCategoryTree(categories);
        } catch (error) {
            showBootstrapToast('Errore nel caricamento delle categorie', 'Errore', 'error');
        } finally {
            loader.hide();
        }
    }

    // Dopo il caricamento delle categorie
    function mount() {
        pageElement.addEventListener('click', (e) => {
            // Espandi/chiudi accordion
            const header = e.target.closest('.category-accordion-header');
            if (header) {
                const key = header.getAttribute('data-key');
                const body = pageElement.querySelector(`#${key}`);
                if (body) {
                    body.classList.toggle('collapse');
                    body.classList.toggle('show');
                    // Ruota la freccia
                    const icon = header.querySelector('.category-accordion-toggle i');
                    if (icon) {
                        icon.classList.toggle('bi-chevron-down');
                        icon.classList.toggle('bi-chevron-up');
                    }
                }
            }
            // Navigazione prodotti (se vuoi mantenere la funzionalità)
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
