import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import UsersAPI from '../../../api/categories.js';
import { uploadCategoryImages } from '../../../api/images.js';
import { getApiUrl } from '../../../api/config.js';

/**
 * Carica la dashboard dell'amministratore per la gestione delle categorie.
 * Inizializza la pagina, gestisce la paginazione, il rendering dell'albero categorie,
 * la visualizzazione delle modali per aggiunta/modifica/spostamento/eliminazione categorie,
 * e la gestione degli eventi principali.
 * @returns {Object} - Oggetto con i metodi del componente (render, mount, unmount)
 */
export async function loadCategoriesManagementPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'categories-management-page';

    // Stato locale per la paginazione
    let allCategories = [];
    let currentPage = 1;
    const pageSize = 10;
    let totalPages = 1;

    // Imposta l'HTML della pagina, inclusi header, bottoni e contenitori
    pageElement.innerHTML = `
        <div class="container pb-5 mt-4">
            <div class="row">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold">Gestione Categorie</h1>
                </div>
            </div>
            <div class="row mb-4 align-items-center mx-5 d-none d-md-flex">
                <div class="col-6 d-flex align-items-center">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <div class="col-6 d-flex justify-content-end">
                    <button class="btn btn-success" id="addRootCategoryBtn"><i class="bi bi-plus-circle"></i> Nuova Categoria</button>
                </div>
            </div>
            <div class="row mb-3 d-flex d-md-none">
                <div class="col-12 d-flex flex-column gap-2">
                    <button class="btn btn-outline-secondary w-100" id="back-btn-mobile"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                    <button class="btn btn-success w-100" id="addRootCategoryBtnMobile"><i class="bi bi-plus-circle"></i> Nuova Categoria</button>
                </div>
            </div>
            <div class="row justify-content-center mx-5">
                <div class="col-12 mb-2 d-md-none"></div>
                <div class="col-12" id="categories-tree-wrapper" style="display:block;">
                    <div id="categoriesTree"></div>
                    <div id="categories-pagination" class="mt-3 d-flex justify-content-center"></div>
                </div>
            </div>
        </div>
        <div id="categoryModalContainer"></div>
        <style>
        @media (max-width: 767.98px) {
            #categories-tree-wrapper { margin-top: 1.5rem !important; }
            .categories-management-page .container,
            .categories-management-page .row,
            .categories-management-page .col-12 {
                padding-left: 0 !important;
                padding-right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
            #categories-tree-wrapper {
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
            #categoriesTree .category-description { display: none !important; }
        }
        </style>
    `;

    /**
     * Renderizza l'albero delle categorie all'interno del contenitore.
     * Se non ci sono categorie, mostra un messaggio.
     * @param {Array} categories - Lista delle categorie da visualizzare
     */
    function renderCategoriesTree(categories) {
        const treeContainer = pageElement.querySelector('#categoriesTree');
        if (!categories.length) {
            treeContainer.innerHTML = '<div class="text-center text-muted py-5">Nessuna categoria trovata.</div>';
            return;
        }
        treeContainer.innerHTML = renderCategoryNodes(categories);
    }

    /**
     * Funzione ricorsiva che genera l'HTML per ogni nodo categoria e i suoi figli.
     * @param {Array} nodes - Lista delle categorie/nodi
     * @param {number} level - Livello di profondità nell'albero (per padding)
     * @returns {string} - HTML dell'albero categorie
     */
    function renderCategoryNodes(nodes, level = 0) {
        return `<ul class="list-group list-group-flush">
            ${nodes.map(cat => `
                <li class="list-group-item d-flex align-items-center justify-content-between bg-light mb-1 rounded-3" style="padding-left: ${level * 32 + 32}px;">
                    <div class="d-flex align-items-center gap-2">
                        ${cat.image ? `<img src=\"${cat.image}\" alt=\"img\" style=\"width:40px; height:40px; object-fit:cover; border-radius:8px; border:1.5px solid #e0e0e0;\" />` : ''}
                        <strong>${cat.name}</strong>
                        <span class="text-muted small ms-2">${cat.description || ''}</span>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-category-btn" data-id="${cat.id}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-outline-danger delete-category-btn" data-id="${cat.id}"><i class="bi bi-trash"></i></button>
                    </div>
                </li>
                ${cat.children && cat.children.length ? renderCategoryNodes(cat.children, level + 1) : ''}
            `).join('')}
        </ul>`;
    }

    /**
     * Renderizza la paginazione in base al numero di pagine totali e alla pagina corrente.
     * Gestisce i bottoni di navigazione e il cambio pagina.
     */
    function renderPagination() {
        const paginationEl = pageElement.querySelector('#categories-pagination');
        paginationEl.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Container per i bottoni
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        
        // Bottone Precedente
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-sm btn-outline-primary';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                currentPage--;
                loadAndRenderPaginatedCategories();
            };
            btnGroup.appendChild(prevBtn);
        }
        
        // Bottoni pagina (massimo 5)
        const maxButtons = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            
            // Solo per le pagine diverse da quella corrente
            if (i !== currentPage) {
                pageBtn.onclick = function() {
                    currentPage = i;
                    loadAndRenderPaginatedCategories();
                };
            }
            
            btnGroup.appendChild(pageBtn);
        }
        
        // Bottone Successivo
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-sm btn-outline-primary';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                currentPage++;
                loadAndRenderPaginatedCategories();
            };
            btnGroup.appendChild(nextBtn);
        }
        
        // Aggiungiamo i bottoni al container
        paginationEl.appendChild(btnGroup);
    }

    /**
     * Restituisce un oggetto con le categorie della pagina corrente e il numero totale di pagine.
     * @param {Array} categories - Tutte le categorie
     * @param {number} page - Pagina corrente
     * @param {number} size - Numero di elementi per pagina
     * @returns {Object} - { categories, totalPages }
     */
    function paginateCategories(categories, page, size) {
        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;
        return {
            categories: categories.slice(startIndex, endIndex),
            totalPages: Math.ceil(categories.length / size)
        };
    }

    /**
     * Carica tutte le categorie dall'API e aggiorna la visualizzazione paginata.
     * Gestisce eventuali errori di caricamento.
     */
    async function loadAndRenderCategories() {
        try {
            allCategories = await UsersAPI.getCategoryTree();
            loadAndRenderPaginatedCategories();
        } catch (error) {
            showBootstrapToast('Errore nel caricamento delle categorie', 'Errore', 'error');
        }
    }

    /**
     * Renderizza le categorie della pagina corrente e aggiorna la paginazione.
     */
    function loadAndRenderPaginatedCategories() {
        const paginatedData = paginateCategories(allCategories, currentPage, pageSize);
        totalPages = paginatedData.totalPages;
        renderCategoriesTree(paginatedData.categories);
        renderPagination();
    }

    /**
     * Mostra una modale per aggiungere, modificare o spostare una categoria.
     * Gestisce anche l'upload e l'anteprima dell'immagine, e la selezione della categoria padre.
     * @param {Object} options - { mode, category, parentId, allCategories }
     */
    function showCategoryModal({ mode, category = {}, parentId = null, allCategories = [] }) {
        const modalContainer = pageElement.querySelector('#categoryModalContainer');
        let title = '';
        let submitText = '';
        let name = category.name || '';
        let description = category.description || '';
        let dad_id = parentId || category.dad_id || '';
        let imageUrl = category.image || '';
        let imageToDelete = false;
        let newImageFile = null;
        console.log(imageUrl);
        if (mode === 'add') { title = 'Nuova Categoria'; submitText = 'Aggiungi'; }
        if (mode === 'edit') { title = 'Modifica Categoria'; submitText = 'Salva'; }
        if (mode === 'move') { title = 'Sposta Categoria'; submitText = 'Sposta'; }
        // Opzioni padre (escludi la categoria stessa e i suoi figli per evitare loop)
        function getParentOptions(categories, excludeId) {
            let opts = '<option value="1">(Root)</option>';
            function walk(nodes) {
                for (const c of nodes) {
                    if (c.id !== excludeId) {
                        opts += `<option value="${c.id}"${dad_id == c.id ? ' selected' : ''}>${c.name}</option>`;
                        if (c.children) walk(c.children);
                    }
                }
            }
            walk(allCategories);
            return opts;
        }
        modalContainer.innerHTML = `
        <div class="modal fade show" id="categoryModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.3)">
            <div class="modal-dialog">
                <form class="modal-content" id="categoryForm">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" id="closeModalBtn"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Nome</label>
                            <input type="text" class="form-control" name="name" value="${name}" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Descrizione</label>
                            <input type="text" class="form-control" name="description" value="${description}" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Categoria Padre</label>
                            <select class="form-select" name="dad_id" required>${getParentOptions(allCategories, category.id)}</select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Immagine categoria</label>
                            <input type="file" class="form-control" id="categoryImageInput" accept="image/*" />
                            <div id="categoryImagePreviewWrapper" class="mt-2">
                                ${imageUrl ? `
                                    <div style=\"position:relative; display:inline-block;\">
                                        <img src=\"${imageUrl}\" alt=\"img\" style=\"width:80px; height:80px; object-fit:cover; border-radius:8px; border:1.5px solid #e0e0e0;\" />
                                        <button type=\"button\" id=\"deleteCategoryImgBtn\" style=\"position:absolute; top:0; right:0; background:rgba(255,255,255,0.8); border:none; border-radius:50%;\"><i class=\"bi bi-x-lg\"></i></button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="closeModalBtn2">Annulla</button>
                        <button type="submit" class="btn btn-primary">${submitText}</button>
                    </div>
                </form>
            </div>
        </div>`;
        // Chiudi modale
        modalContainer.querySelectorAll('#closeModalBtn,#closeModalBtn2').forEach(btn => btn.onclick = () => modalContainer.innerHTML = '');
        // Gestione anteprima/eliminazione immagine
        const imgInput = modalContainer.querySelector('#categoryImageInput');
        const imgPreviewWrapper = modalContainer.querySelector('#categoryImagePreviewWrapper');
        if (imgInput) {
            imgInput.addEventListener('change', e => {
                const file = imgInput.files[0];
                if (file) {
                    newImageFile = file;
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        imgPreviewWrapper.innerHTML = `<div style=\"position:relative; display:inline-block;\"><img src=\"${ev.target.result}\" alt=\"img\" style=\"width:80px; height:80px; object-fit:cover; border-radius:8px; border:1.5px solid #e0e0e0;\" /></div>`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        if (imgPreviewWrapper && imgPreviewWrapper.querySelector('#deleteCategoryImgBtn')) {
            imgPreviewWrapper.querySelector('#deleteCategoryImgBtn').onclick = () => {
                imgPreviewWrapper.innerHTML = '';
                imageToDelete = true;
                imageUrl = '';
            };
        }
        // Submit
        modalContainer.querySelector('#categoryForm').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const data = {
                name: form.name.value,
                description: form.description.value,
                dad_id: parseInt(form.dad_id.value)
            };
            try {
                if (mode === 'add') {
                    const created = await UsersAPI.createCategory(data);
                    if (imgInput && imgInput.files[0]) {
                        await uploadCategoryImages(created.id, [imgInput.files[0]]);
                    }
                }
                if (mode === 'edit') {
                    await UsersAPI.updateCategory(category.id, data);
                    if (imageToDelete && category.images && category.images.length > 0) {
                        // Chiamata DELETE per eliminare immagine categoria (da implementare lato API se non esiste)
                        await fetch(`${getApiUrl()}/images/category/${category.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${authService.getToken()}` }
                        });
                    }
                    if (imgInput && imgInput.files[0]) {
                        await uploadCategoryImages(category.id, [imgInput.files[0]]);
                    }
                }
                showBootstrapToast('Operazione completata', 'Successo', 'success');
                modalContainer.innerHTML = '';
                await loadAndRenderCategories();
            } catch (err) {
                showBootstrapToast(err.message, 'Errore', 'error');
            }
        };
    }

    // Event delegation per i bottoni dell'albero categorie e azioni principali
    let pendingDeleteId = null;
    /**
     * Gestisce le azioni sui bottoni dell'albero categorie (aggiungi, modifica, sposta, elimina).
     * Mostra le relative modali o esegue le azioni richieste.
     * @param {Event} e - Evento click
     */
    async function handleTreeActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (btn.classList.contains('add-subcategory-btn')) {
            const allCategories = await UsersAPI.getCategoryTree();
            showCategoryModal({ mode: 'add', parentId: parseInt(id), allCategories });
        }
        if (btn.classList.contains('edit-category-btn')) {
            const allCategories = await UsersAPI.getCategoryTree();
            const cat = await UsersAPI.getCategory(id);
            showCategoryModal({ mode: 'edit', category: cat, allCategories });
        }
        if (btn.classList.contains('move-category-btn')) {
            const allCategories = await UsersAPI.getCategoryTree();
            const cat = await UsersAPI.getCategory(id);
            showCategoryModal({ mode: 'move', category: cat, allCategories });
        }
        if (btn.classList.contains('delete-category-btn')) {
            pendingDeleteId = id;
            showDeleteModal();
        }
        if (btn.id === 'addRootCategoryBtn') {
            const allCategories = await UsersAPI.getCategoryTree();
            showCategoryModal({ mode: 'add', parentId: 1, allCategories });
        }
    }

    /**
     * Mostra una modale di conferma per l'eliminazione di una categoria.
     * Gestisce la conferma o l'annullamento dell'operazione.
     */
    function showDeleteModal() {
        const modalContainer = pageElement.querySelector('#categoryModalContainer');
        modalContainer.innerHTML = `
        <div class="modal fade show" id="deleteModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.3)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Conferma eliminazione</h5>
                        <button type="button" class="btn-close" id="closeDeleteModalBtn"></button>
                    </div>
                    <div class="modal-body">
                        <p>Sei sicuro di voler eliminare questa categoria? L'operazione non è reversibile.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="closeDeleteModalBtn2">Annulla</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Elimina</button>
                    </div>
                </div>
            </div>
        </div>`;
        // Chiudi modale
        modalContainer.querySelectorAll('#closeDeleteModalBtn,#closeDeleteModalBtn2').forEach(btn => btn.onclick = () => {
            modalContainer.innerHTML = '';
            pendingDeleteId = null;
        });
        // Conferma eliminazione
        modalContainer.querySelector('#confirmDeleteBtn').onclick = async () => {
            if (!pendingDeleteId) return;
            try {
                await UsersAPI.deleteCategory(pendingDeleteId);
                showBootstrapToast('Categoria eliminata', 'Successo', 'success');
                await loadAndRenderCategories();
            } catch (err) {
                showBootstrapToast(err.message, 'Errore', 'error');
            }
            modalContainer.innerHTML = '';
            pendingDeleteId = null;
        };
    }

    /**
     * Funzione di mount: aggiunge i listener ai bottoni principali e carica le categorie.
     * Gestisce sia la versione desktop che mobile dei bottoni.
     */
    async function mount() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        // Bottoni mobile
        const backBtnMobile = document.getElementById('back-btn-mobile');
        if (backBtnMobile) {
            backBtnMobile.addEventListener('click', () => {
                window.history.back();
            });
        }
        const addRootCategoryBtnMobile = document.getElementById('addRootCategoryBtnMobile');
        if (addRootCategoryBtnMobile) {
            addRootCategoryBtnMobile.addEventListener('click', () => {
                const allCategories = [];
                showCategoryModal({ mode: 'add', parentId: 1, allCategories });
            });
        }
        await loadAndRenderCategories();
        pageElement.addEventListener('click', handleTreeActions);
    }

    /**
     * Funzione di unmount: placeholder per eventuale cleanup (non usata qui).
     */
    function unmount() {
        // Nessun event listener da rimuovere
    }

    // Ritorna i metodi principali del componente
    return {
        render: () => pageElement,
        mount,
        unmount
    };
}