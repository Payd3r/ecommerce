import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import UsersAPI from '../../../api/categories.js';

/**
 * Carica la dashboard dell'amministratore
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadCategoriesManagementPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'categories-management-page';

    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row mb-4">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold mb-2">Gestione Categorie</h1>
                </div>
            </div>
            <div class="row mb-2 align-items-center">
                <div class="col-6 d-flex align-items-center">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <div class="col-6 d-flex justify-content-end">
                    <button class="btn btn-success" id="addRootCategoryBtn"><i class="bi bi-plus-circle"></i> Nuova Categoria</button>
                </div>
            </div>
            <div class="row justify-content-center">
                <div class="col-12 col-md-10">
                    <div id="categoriesTree"></div>
                </div>
            </div>
        </div>
        <div id="categoryModalContainer"></div>
    `;

    // Funzione per renderizzare l'albero delle categorie con controlli admin
    function renderCategoriesTree(categories) {
        const treeContainer = pageElement.querySelector('#categoriesTree');
        if (!categories.length) {
            treeContainer.innerHTML = '<div class="text-center text-muted py-5">Nessuna categoria trovata.</div>';
            return;
        }
        treeContainer.innerHTML = renderCategoryNodes(categories);
    }

    // Ricorsiva: genera HTML per ogni nodo e figli
    function renderCategoryNodes(nodes, level = 0) {
        return `<ul class="list-group list-group-flush">
            ${nodes.map(cat => `
                <li class="list-group-item d-flex align-items-center justify-content-between bg-light mb-1 rounded-3" style="padding-left: ${level * 32 + 32}px;">
                    <div>
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

    // Carica e mostra l'albero categorie
    async function loadAndRenderCategories() {
        try {
            const categories = await UsersAPI.getCategoryTree();
            renderCategoriesTree(categories);
        } catch (error) {
            showBootstrapToast('Errore nel caricamento delle categorie', 'Errore', 'error');
        }
    }

    // Mostra modale per aggiunta/modifica/spostamento categoria
    function showCategoryModal({ mode, category = {}, parentId = null, allCategories = [] }) {
        const modalContainer = pageElement.querySelector('#categoryModalContainer');
        let title = '';
        let submitText = '';
        let name = category.name || '';
        let description = category.description || '';
        let dad_id = parentId || category.dad_id || '';
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
                if (mode === 'add') await UsersAPI.createCategory(data);
                if (mode === 'edit') await UsersAPI.updateCategory(category.id, data);
                if (mode === 'move') await UsersAPI.updateCategory(category.id, { ...category, dad_id: data.dad_id });
                showBootstrapToast('Operazione completata', 'Successo', 'success');
                modalContainer.innerHTML = '';
                await loadAndRenderCategories();
            } catch (err) {
                showBootstrapToast(err.message, 'Errore', 'error');
            }
        };
    }

    // Event delegation per i bottoni
    let pendingDeleteId = null;
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

    // Modal di conferma eliminazione
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

    // Mount
    async function mount() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        await loadAndRenderCategories();
        pageElement.addEventListener('click', handleTreeActions);
    }

    function unmount() {
        // Nessun event listener da rimuovere
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}