import { createProduct } from '../../../../api/products.js';
import { showBootstrapToast } from '../../../components/Toast.js';
import { uploadProductImages } from '../../../../api/images.js';

export function showAddProductModal(categories, onSuccess) {
    // Rimuovi eventuale modal precedente
    const existing = document.getElementById('addProductModal');
    if (existing) existing.remove();

    // Crea il modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addProductModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Aggiungi Prodotto</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <form id="addProductForm">
          <div class="modal-body">
            <div class="row">
              <div class="col-12 col-md-8">
                <div class="mb-3">
                  <label class="form-label">Nome *</label>
                  <input type="text" class="form-control" id="productName" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Descrizione *</label>
                  <textarea class="form-control" id="productDescription" rows="4" required></textarea>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Prezzo *</label>
                    <input type="number" min="0" step="0.01" class="form-control" id="productPrice" required />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Sconto (%)</label>
                    <input type="number" min="0" max="100" step="1" class="form-control" id="productDiscount" />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Stock</label>
                    <input type="number" min="0" step="1" class="form-control" id="productStock" />
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label">Categoria *</label>
                <div id="category-tree-checkbox"></div>
              </div>
            </div>
            <div class="mb-3 mt-2">
              <label class="form-label">Immagini (max 10)</label>
              <input type="file" class="form-control" id="productImages" accept="image/*" multiple />
              <div id="imagePreviewList" class="d-flex flex-wrap gap-2 mt-2"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
            <button type="submit" class="btn btn-success">Aggiungi</button>
          </div>
        </form>
        <div id="addProductLoading" class="d-none text-center py-4">
          <div class="spinner-border text-success" role="status"></div>
          <div>Salvataggio in corso...</div>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(modal);

    // Mostra il modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Gestione immagini selezionate
    let selectedImages = [];
    const fileInput = modal.querySelector('#productImages');
    const previewList = modal.querySelector('#imagePreviewList');

    function renderPreviews() {
        previewList.innerHTML = '';
        selectedImages.forEach((file, idx) => {
            const url = URL.createObjectURL(file);
            const wrapper = document.createElement('div');
            wrapper.className = 'position-relative';
            wrapper.style.width = '80px';
            wrapper.style.height = '80px';
            wrapper.innerHTML = `
              <img src="${url}" class="rounded border" style="width: 100%; height: 100%; object-fit: cover;" />
              <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="z-index:2;" title="Rimuovi" data-idx="${idx}"><i class="bi bi-x"></i></button>
            `;
            previewList.appendChild(wrapper);
        });
        // Eventi rimozione
        previewList.querySelectorAll('button[data-idx]').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                selectedImages.splice(idx, 1);
                renderPreviews();
            });
        });
    }

    fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        // Unisci e limita a 10
        selectedImages = selectedImages.concat(files).slice(0, 10);
        renderPreviews();
        // Reset input per permettere di riaggiungere la stessa immagine
        fileInput.value = '';
    });

    // Dopo aver inserito il modal nel DOM, renderizza il tree checkbox categorie (selezione singola, struttura ad albero, caret e indentazione come Products.js)
    function renderCategoryTreeSingleCheckbox(categories, selectedId, level = 1) {
        function renderTree(nodes, level = 1) {
            let html = '<ul class="list-unstyled mb-0' + (level === 1 ? ' show' : '') + '">';
            nodes.forEach(cat => {
                const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
                const collapseId = `collapse-cat-modal-add-${cat.id}`;
                html += `<li class="category-li position-relative">
                    <div class="form-check d-flex align-items-center gap-1" style="margin-bottom: 0.2rem; min-height: 1.8rem;">
                        ${hasChildren
                        ? `<button type=\"button\" class=\"btn btn-sm btn-link p-0 me-1 ms-0 category-collapse-btn d-flex align-items-center\" data-target=\"${collapseId}\" aria-expanded=\"false\" aria-controls=\"${collapseId}\"><i class=\"bi bi-caret-right-fill\"></i></button>`
                        : '<span class=\"category-empty-icon me-1\" style=\"display:inline-block;width:1.5rem;\"></span>'}
                        <input class="form-check-input ms-0" type="checkbox" id="cat-checkbox-add-${cat.id}" name="category_id_single" value="${cat.id}" ${cat.id == selectedId ? 'checked' : ''}>
                        <label class="form-check-label ms-1" for="cat-checkbox-add-${cat.id}">${cat.name}</label>
                    </div>`;
                if (hasChildren) {
                    html += `<ul class='ms-0' id='${collapseId}' style='display:none;'>`;
                    html += renderTree(cat.children, level + 1);
                    html += '</ul>';
                }
                html += '</li>';
            });
            html += '</ul>';
            return html;
        }
        return renderTree(categories, level);
    }
    const catTreeDiv = modal.querySelector('#category-tree-checkbox');
    if (catTreeDiv) {
        catTreeDiv.innerHTML = renderCategoryTreeSingleCheckbox(categories, null);
        // Gestione selezione singola: deseleziona tutte le altre al click
        catTreeDiv.querySelectorAll('input[type="checkbox"][name="category_id_single"]').forEach(cb => {
            cb.addEventListener('change', function() {
                if (cb.checked) {
                    catTreeDiv.querySelectorAll('input[type="checkbox"][name="category_id_single"]').forEach(other => {
                        if (other !== cb) other.checked = false;
                    });
                }
            });
        });
        // Gestione collapse/expand caret
        catTreeDiv.querySelectorAll('.category-collapse-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const target = document.getElementById(targetId);
                if (!target) return;
                const isOpen = target.style.display !== 'none';
                if (isOpen) {
                    target.style.display = 'none';
                    btn.querySelector('i').className = 'bi bi-caret-right-fill';
                } else {
                    target.style.display = 'block';
                    btn.querySelector('i').className = 'bi bi-caret-down-fill';
                }
                btn.setAttribute('aria-expanded', String(!isOpen));
            });
        });
    }

    // Gestione submit
    const form = modal.querySelector('#addProductForm');
    const loadingDiv = modal.querySelector('#addProductLoading');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        // Prendi i valori
        const name = form.productName.value.trim();
        const description = form.productDescription.value.trim();
        const price = parseFloat(form.productPrice.value);
        const discount = form.productDiscount.value ? parseFloat(form.productDiscount.value) : null;
        const stock = form.productStock.value ? parseInt(form.productStock.value) : null;
        const category_id = form.querySelector('input[name="category_id_single"]:checked')?.value;
        // Validazione
        if (!name || !description || !price || !category_id) {
            showBootstrapToast('Compila tutti i campi obbligatori!', 'Errore', 'danger');
            return;
        }
        if (price < 0) {
            showBootstrapToast('Il prezzo deve essere positivo', 'Errore', 'danger');
            return;
        }
        if (discount !== null && (discount < 0 || discount > 100)) {
            showBootstrapToast('Lo sconto deve essere tra 0 e 100', 'Errore', 'danger');
            return;
        }
        if (stock !== null && stock < 0) {
            showBootstrapToast('Lo stock deve essere positivo', 'Errore', 'danger');
            return;
        }
        // Modal in loading
        form.classList.add('d-none');
        loadingDiv.classList.remove('d-none');
        try {
            // 1. Crea il prodotto
            const product = await createProduct({ name, description, price, discount, stock, category_id });
            // 2. Upload immagini se presenti
            if (selectedImages.length > 0) {
                await uploadProductImages(product.id, selectedImages);
            }
            showBootstrapToast('Prodotto aggiunto con successo!', 'Successo', 'success');
            bsModal.hide();
            modal.remove();
            if (onSuccess) onSuccess();
        } catch (err) {
            showBootstrapToast('Errore durante la creazione del prodotto o upload immagini', 'Errore', 'danger');
            form.classList.remove('d-none');
            loadingDiv.classList.add('d-none');
        }
    });

    // Rimuovi il modal dal DOM quando viene chiuso
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}
