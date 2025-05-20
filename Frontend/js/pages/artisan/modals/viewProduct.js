import { getProduct } from '../../../../api/products.js';
import { getApiUrl } from '../../../../api/config.js';

export async function showViewProductModal(productId, categories) {
    // Rimuovi eventuale modal precedente
    const existing = document.getElementById('viewProductModal');
    if (existing) existing.remove();

    // Carica i dati del prodotto
    let product;
    try {
        product = await getProduct(productId);
    } catch (e) {
        alert('Errore nel caricamento del prodotto');
        return;
    }

    // Immagini prodotto
    const images = product.images && product.images.length > 0 ? product.images : [];

    // Carousel immagini se più di una
    let imagesHtml = '';
    let thumbsHtml = '';
    if (images.length > 1) {
        imagesHtml = `
        <div id="productImagesCarousel" class="carousel slide mb-3" data-bs-ride="false">
          <div class="carousel-inner">
            ${images.map((img, idx) => `
              <div class="carousel-item${idx === 0 ? ' active' : ''}">
                <img src="${getApiUrl()}${img.url}" class="d-block w-100 rounded" alt="${img.alt_text || ''}" style="max-height:320px; object-fit:contain; background:#f8f9fa;">
              </div>
            `).join('')}
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#productImagesCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Precedente</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#productImagesCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Successiva</span>
          </button>
        </div>
        <div class="d-flex justify-content-center gap-2 mb-3" id="productImagesThumbs">
          ${images.map((img, idx) => `
            <img src="${getApiUrl()}${img.url}" data-idx="${idx}" class="rounded border thumb-img" style="width:56px; height:56px; object-fit:cover; cursor:pointer;${idx === 0 ? ' border-primary border-2' : ''}" alt="thumb" />
          `).join('')}
        </div>
        `;
    } else if (images.length === 1) {
        imagesHtml = `<img src="${getApiUrl()}${images[0].url}" class="img-fluid rounded mb-3 d-block mx-auto" alt="${images[0].alt_text || ''}" style="max-height:320px; object-fit:contain; background:#f8f9fa;">`;
    } else {
        imagesHtml = `<div class="d-flex align-items-center justify-content-center bg-light rounded mb-3" style="height:200px;"><i class="bi bi-image fs-1 text-secondary"></i></div>`;
    }

    // Categorie mappa
    const categoryName = product.category_name || '-';

    // Modal HTML
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'viewProductModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Dettagli Prodotto</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row g-4">
            <div class="col-md-6">
              ${imagesHtml}
            </div>
            <div class="col-md-6">
              <h2 class="h4 mb-2">${product.name}</h2>
              <div class="mb-2 text-muted">Categoria: <strong>${categoryName}</strong></div>
              <div class="mb-2">${product.description}</div>
              <div class="mb-2"><span class="fw-bold">Prezzo:</span> ${product.price} €</div>
              ${product.discount ? `<div class="mb-2"><span class="fw-bold">Sconto:</span> ${product.discount}%</div>` : ''}
              <div class="mb-2"><span class="fw-bold">Stock:</span> ${product.stock}</div>
              <div class="mb-2"><span class="fw-bold">Creato il:</span> ${product.created_at ? new Date(product.created_at).toLocaleDateString('it-IT') : '-'}</div>
              <div class="mb-2"><span class="fw-bold">Artigiano:</span> ${product.artisan_name || '-'}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(modal);

    // Mostra il modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Gestione thumbs: click su anteprima per cambiare immagine nel carosello
    if (images.length > 1) {
        setTimeout(() => {
            const thumbs = modal.querySelectorAll('#productImagesThumbs .thumb-img');
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-idx'));
                    const carousel = bootstrap.Carousel.getOrCreateInstance(document.getElementById('productImagesCarousel'));
                    carousel.to(idx);
                    // Aggiorna bordo attivo
                    thumbs.forEach(t => t.classList.remove('border-primary', 'border-2'));
                    this.classList.add('border-primary', 'border-2');
                });
            });
        }, 300);
    }

    // Rimuovi il modal dal DOM quando viene chiuso
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}
