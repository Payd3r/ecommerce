// Pagina Contatti
/**
 * Carica la pagina dei contatti.
 * Mostra indirizzo, email, telefono e una mappa della posizione.
 * @returns {Object} - Oggetto con i metodi del componente (render, mount)
 */
export function loadContactsPage() {
    const page = document.createElement('div');
    page.className = 'contacts-page';
    page.innerHTML = `
        <div class="container py-5">
            <div class="row justify-content-center mb-4">
                <div class="col-12 col-md-8 text-center">
                    <h1 class="page-title mb-2">Contatti</h1>
                    <p class="page-subtitle mb-4">Siamo sempre felici di aiutarti! Qui trovi tutti i nostri riferimenti e la nostra posizione.</p>
                </div>
            </div>
            <div class="row justify-content-center align-items-stretch g-4 mb-4">
                <div class="col-12 col-md-5">
                    <div class="card shadow-sm h-100 border-0 p-4">
                        <h5 class="mb-4"><i class="bi bi-geo-alt-fill me-2 text-primary"></i>Indirizzo</h5>
                        <p class="mb-3">Via dell'Artigianato, 123<br>00100 Roma, Italia</p>
                        <h5 class="mb-3 mt-4"><i class="bi bi-envelope-fill me-2 text-primary"></i>Email</h5>
                        <p class="mb-3"><a href="mailto:info@paneesalame.it" class="text-decoration-none">info@paneesalame.it</a></p>
                        <h5 class="mb-3 mt-4"><i class="bi bi-telephone-fill me-2 text-primary"></i>Telefono</h5>
                        <p class="mb-0">+39 06 1234567</p>
                    </div>
                </div>
                <div class="col-12 col-md-7">
                    <div class="card shadow-sm h-100 border-0 p-2 p-md-3">
                        <h5 class="mb-3"><i class="bi bi-map me-2 text-primary"></i>Dove siamo</h5>
                        <div class="ratio ratio-16x9 rounded-3 overflow-hidden">
                            <iframe src="https://www.google.com/maps?q=Via+dell'Artigianato+123,+Roma,+Italia&output=embed" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <style>
        .contacts-page .card {
            border-radius: 1.2rem;
        }
        .contacts-page h5 {
            font-size: 1.1rem;
            font-weight: 600;
        }
        @media (max-width: 767px) {
            .contacts-page .card { border-radius: 0.8rem; }
            .contacts-page .page-title { font-size: 1.5rem; }
            .contacts-page .page-subtitle { font-size: 1rem; }
        }
        </style>
    `;
    return {
        render: () => page,
        mount: () => {}
    };
}
