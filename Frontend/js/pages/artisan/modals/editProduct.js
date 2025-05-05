import { getProduct, updateProduct } from '../../../../api/products.js';
import { showBootstrapToast } from '../../../components/Toast.js';
import { uploadProductImages, deleteProductImages } from '../../../../api/images.js';

export async function showEditProductModal(productId, categories, onSuccess) {
    // Rimuovi eventuale modal precedente
    const existing = document.getElementById('editProductModal');
    if (existing) existing.remove();

    // Carica i dati del prodotto
    let product;
    try {
        product = await getProduct(productId);
    } catch (e) {
        showBootstrapToast('Errore nel caricamento del prodotto', 'Errore', 'danger');
        return;
    }

    // Stato immagini
    let existingImages = (product.images || []).map(img => ({ ...img, toDelete: false }));
    let newImages = [];

    // Crea il modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editProductModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Modifica Prodotto</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <form id="editProductForm">
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nome *</label>
              <input type="text" class="form-control" id="productName" value="${product.name || ''}" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Descrizione *</label>
              <textarea class="form-control" id="productDescription" required>${product.description || ''}</textarea>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Prezzo *</label>
                <input type="number" min="0" step="0.01" class="form-control" id="productPrice" value="${product.price || ''}" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Sconto (%)</label>
                <input type="number" min="0" max="100" step="1" class="form-control" id="productDiscount" value="${product.discount || ''}" />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Categoria *</label>
                <select class="form-select" id="productCategory" required>
                  <option value="">Seleziona categoria</option>
                  ${categories.map(c => `<option value="${c.id}"${c.id == product.category_id ? ' selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Stock</label>
                <input type="number" min="0" step="1" class="form-control" id="productStock" value="${product.stock || ''}" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Immagini (max 10)</label>
              <input type="file" class="form-control" id="productImages" accept="image/*" multiple />
              <div id="imagePreviewList" class="d-flex flex-wrap gap-2 mt-2"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
            <button type="submit" class="btn btn-success">Salva modifiche</button>
          </div>
        </form>
      </div>
    </div>
    `;
    document.body.appendChild(modal);

    // Mostra il modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Gestione immagini
    const fileInput = modal.querySelector('#productImages');
    const previewList = modal.querySelector('#imagePreviewList');

    function renderPreviews() {
        previewList.innerHTML = '';
        // Immagini già esistenti
        existingImages.forEach((img, idx) => {
            if (img.toDelete) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'position-relative';
            wrapper.style.width = '80px';
            wrapper.style.height = '80px';
            wrapper.innerHTML = `
              <img src="http://localhost:3005${img.url}" class="rounded border" style="width: 100%; height: 100%; object-fit: cover;" />
              <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="z-index:2;" title="Rimuovi" data-type="existing" data-idx="${idx}"><i class="bi bi-x"></i></button>
            `;
            previewList.appendChild(wrapper);
        });
        // Nuove immagini
        newImages.forEach((file, idx) => {
            const url = URL.createObjectURL(file);
            const wrapper = document.createElement('div');
            wrapper.className = 'position-relative';
            wrapper.style.width = '80px';
            wrapper.style.height = '80px';
            wrapper.innerHTML = `
              <img src="${url}" class="rounded border" style="width: 100%; height: 100%; object-fit: cover;" />
              <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="z-index:2;" title="Rimuovi" data-type="new" data-idx="${idx}"><i class="bi bi-x"></i></button>
            `;
            previewList.appendChild(wrapper);
        });
        // Eventi rimozione
        previewList.querySelectorAll('button[data-type]').forEach(btn => {
            btn.addEventListener('click', e => {
                const type = btn.getAttribute('data-type');
                const idx = parseInt(btn.getAttribute('data-idx'));
                if (type === 'existing') {
                    existingImages[idx].toDelete = true;
                } else {
                    newImages.splice(idx, 1);
                }
                renderPreviews();
            });
        });
    }

    fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        // Unisci e limita a 10 (tra nuove e già esistenti non cancellate)
        const max = 10 - existingImages.filter(img => !img.toDelete).length;
        newImages = newImages.concat(files).slice(0, max);
        renderPreviews();
        fileInput.value = '';
    });

    renderPreviews();

    // Gestione submit
    const form = modal.querySelector('#editProductForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        // Prendi i valori
        const name = form.productName.value.trim();
        const description = form.productDescription.value.trim();
        const price = parseFloat(form.productPrice.value);
        const discount = form.productDiscount.value ? parseFloat(form.productDiscount.value) : 0;
        const stock = form.productStock.value ? parseInt(form.productStock.value) : 0;
        const category_id = form.productCategory.value;
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
        try {
            await updateProduct(productId, { name, description, price, discount, stock, category_id });
            // Elimina immagini se necessario
            const toDeleteIds = existingImages.filter(img => img.toDelete).map(img => img.id);
            if (toDeleteIds.length > 0) {
                await deleteProductImages(productId, toDeleteIds);
            }
            // Upload nuove immagini se presenti
            if (newImages.length > 0) {
                await uploadProductImages(productId, newImages);
            }
            showBootstrapToast('Prodotto aggiornato con successo!', 'Successo', 'success');
            // Unico listener per chiusura modal: rimuove il modal e aggiorna la tabella
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 1000);
            }, { once: true });
            document.activeElement.blur();
            bsModal.hide();
        } catch (err) {
            showBootstrapToast('Errore durante l\'aggiornamento del prodotto o upload immagini', 'Errore', 'danger');
        }
    });
}
