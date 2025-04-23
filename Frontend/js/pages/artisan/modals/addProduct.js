import { createProduct } from '../../../../api/products.js';
import { showBootstrapToast } from '../../../components/Toast.js';

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
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Aggiungi Prodotto</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <form id="addProductForm">
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nome *</label>
              <input type="text" class="form-control" id="productName" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Descrizione *</label>
              <textarea class="form-control" id="productDescription" required></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Prezzo *</label>
              <input type="number" min="0" step="0.01" class="form-control" id="productPrice" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Sconto (%)</label>
              <input type="number" min="0" max="100" step="1" class="form-control" id="productDiscount" />
            </div>
            <div class="mb-3">
              <label class="form-label">Stock</label>
              <input type="number" min="0" step="1" class="form-control" id="productStock" />
            </div>
            <div class="mb-3">
              <label class="form-label">Categoria *</label>
              <select class="form-select" id="productCategory" required>
                <option value="">Seleziona categoria</option>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
            <button type="submit" class="btn btn-success">Aggiungi</button>
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
    const form = modal.querySelector('#addProductForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        // Prendi i valori
        const name = form.productName.value.trim();
        const description = form.productDescription.value.trim();
        const price = parseFloat(form.productPrice.value);
        const discount = form.productDiscount.value ? parseFloat(form.productDiscount.value) : null;
        const stock = form.productStock.value ? parseInt(form.productStock.value) : null;
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
        // Crea il prodotto
        try {
            await createProduct({ name, description, price, discount, stock, category_id });
            showBootstrapToast('Prodotto aggiunto con successo!', 'Successo', 'success');
            bsModal.hide();
            modal.remove();
            if (onSuccess) onSuccess();
        } catch (err) {
            showBootstrapToast('Errore durante la creazione del prodotto', 'Errore', 'danger');
        }
    });

    // Rimuovi il modal dal DOM quando viene chiuso
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}
