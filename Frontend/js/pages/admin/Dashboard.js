// Importo le dipendenze
import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';

/**
 * Carica la dashboard dell'amministratore
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadAdminDashboardPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'admin-dashboard-page';
    
    // Ottiene i dati dell'utente
    const user = authService.getUser();
    
    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container">
            <div class="dashboard-header mb-4 pb-2 border-bottom">
                <h1 class="mb-1">Dashboard Amministratore</h1>
                <p class="text-muted">Benvenuto, <strong>${authService.getUser().name}</strong>!</p>
            </div>
            <div class="dashboard-stats grid grid-4 mb-4">
                <div class="stat-card card text-center py-3">
                    <div class="stat-icon display-5 mb-2">👤</div>
                    <div class="stat-content">
                        <div class="stat-value fs-3">0</div>
                        <div class="stat-label text-muted">Utenti</div>
                    </div>
                </div>
                <div class="stat-card card text-center py-3">
                    <div class="stat-icon display-5 mb-2">🧑‍🎨</div>
                    <div class="stat-content">
                        <div class="stat-value fs-3">0</div>
                        <div class="stat-label text-muted">Artigiani</div>
                    </div>
                </div>
                <div class="stat-card card text-center py-3">
                    <div class="stat-icon display-5 mb-2">📦</div>
                    <div class="stat-content">
                        <div class="stat-value fs-3">0</div>
                        <div class="stat-label text-muted">Prodotti</div>
                    </div>
                </div>
                <div class="stat-card card text-center py-3">
                    <div class="stat-icon display-5 mb-2">🛒</div>
                    <div class="stat-content">
                        <div class="stat-value fs-3">0</div>
                        <div class="stat-label text-muted">Ordini</div>
                    </div>
                </div>
            </div>
            <div class="dashboard-actions grid grid-2 mb-4 gap-4">
                <div class="card p-4">
                    <h2 class="h5 mb-3">Azioni rapide</h2>
                    <div class="action-buttons d-flex flex-column gap-2">
                        <a href="/admin/users-management" class="btn btn-outline-primary w-100" data-route>
                            Gestisci utenti
                        </a>
                        <a href="/admin/artisans" class="btn btn-outline-primary w-100" data-route>
                            Gestisci artigiani
                        </a>
                        <a href="/admin/products" class="btn btn-outline-primary w-100" data-route>
                            Gestisci prodotti
                        </a>
                        <a href="/admin/categories-management" class="btn btn-outline-primary w-100" data-route>
                            Gestisci categorie
                        </a>
                        <a href="/admin/orders" class="btn btn-outline-primary w-100" data-route>
                            Gestisci ordini
                        </a>
                    </div>
                </div>
                <div class="card p-4">
                    <h2 class="h5 mb-3">Ultimi utenti registrati</h2>
                    <div class="empty-state text-center text-muted">
                        <p>Nessun utente registrato di recente.</p>
                    </div>
                </div>
            </div>
            <div class="grid grid-2 gap-4 mt-md">
                <div class="card p-4">
                    <h2 class="h5 mb-3">Ultimi ordini</h2>
                    <div class="empty-state text-center text-muted">
                        <p>Nessun ordine recente.</p>
                    </div>
                </div>
                <div class="card p-4">
                    <h2 class="h5 mb-3">Ultimi prodotti aggiunti</h2>
                    <div class="empty-state text-center text-muted">
                        <p>Nessun prodotto aggiunto di recente.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // In un'implementazione reale, qui caricheremmo i dati dal backend
    async function loadDashboardData() {
        // Simulazione caricamento dati
        showBootstrapToast('Dashboard amministratore caricata con successo', 'Info', 'info');
    }
    
    /**
     * Inizializza gli event listener
     */
    function mount() {
        loadDashboardData();
    }
    
    /**
     * Rimuove gli event listener
     */
    function unmount() {
        // Nessun event listener da rimuovere
    }
    
    return {
        render: () => pageElement,
        mount,
        unmount
    };
}