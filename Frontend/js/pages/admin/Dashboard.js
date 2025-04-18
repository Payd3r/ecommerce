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
            <div class="dashboard-header">
                <h1>Dashboard Amministratore</h1>
                <p>Benvenuto, ${user.name}!</p>
            </div>
            
            <div class="dashboard-stats grid grid-4">
                <div class="stat-card card">
                    <div class="stat-icon">👤</div>
                    <div class="stat-content">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Utenti</div>
                    </div>
                </div>
                
                <div class="stat-card card">
                    <div class="stat-icon">🧑‍🎨</div>
                    <div class="stat-content">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Artigiani</div>
                    </div>
                </div>
                
                <div class="stat-card card">
                    <div class="stat-icon">📦</div>
                    <div class="stat-content">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Prodotti</div>
                    </div>
                </div>
                
                <div class="stat-card card">
                    <div class="stat-icon">🛒</div>
                    <div class="stat-content">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Ordini</div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-actions grid grid-2">
                <div class="card">
                    <h2>Gestione piattaforma</h2>
                    <div class="action-buttons">
                        <a href="/admin/users-management" class="btn" data-route>
                            Gestisci utenti
                        </a>
                        <a href="/admin/artisans" class="btn" data-route>
                            Gestisci artigiani
                        </a>
                        <a href="/admin/products" class="btn" data-route>
                            Gestisci prodotti
                        </a>
                        <a href="/admin/categories" class="btn" data-route>
                            Gestisci categorie
                        </a>
                        <a href="/admin/orders" class="btn" data-route>
                            Gestisci ordini
                        </a>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Ultimi utenti registrati</h2>
                    <div class="empty-state">
                        <p>Nessun utente registrato di recente.</p>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-2 mt-md">
                <div class="card">
                    <h2>Ultimi ordini</h2>
                    <div class="empty-state">
                        <p>Nessun ordine recente.</p>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Ultimi prodotti aggiunti</h2>
                    <div class="empty-state">
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