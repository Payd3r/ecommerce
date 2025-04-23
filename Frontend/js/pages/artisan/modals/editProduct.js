import { getProduct, updateProduct } from '../../../../api/products.js';
import { showBootstrapToast } from '../../../components/Toast.js';

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
            <div class="mb-3">
              <label class="form-label">Prezzo *</label>
              <input type="number" min="0" step="0.01" class="form-control" id="productPrice" value="${product.price || ''}" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Sconto (%)</label>
              <input type="number" min="0" max="100" step="1" class="form-control" id="productDiscount" value="${product.discount || ''}" />
            </div>
            <div class="mb-3">
              <label class="form-label">Stock</label>
              <input type="number" min="0" step="1" class="form-control" id="productStock" value="${product.stock || ''}" />
            </div>
            <div class="mb-3">
              <label class="form-label">Categoria *</label>
              <select class="form-select" id="productCategory" required>
                <option value="">Seleziona categoria</option>
                ${categories.map(c => `<option value="${c.id}"${c.id == product.category_id ? ' selected' : ''}>${c.name}</option>`).join('')}
              </select>
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
        // Aggiorna il prodotto
        try {
            await updateProduct(productId, { name, description, price, discount, stock, category_id });
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
            showBootstrapToast('Errore durante l\'aggiornamento del prodotto', 'Errore', 'danger');
        }
    });
}
