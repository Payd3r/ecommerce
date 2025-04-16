// Importo le dipendenze
import { authService } from '../../services/authService.js';
import { toast } from '../../components/Toast.js';

/**
 * Carica la dashboard dell'artigiano
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadArtisanDashboardPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'artisan-dashboard-page';
    
    // Ottiene i dati dell'utente
    const user = authService.getUser();
    
    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container">
            <div class="dashboard-header">
                <h1>Dashboard Artigiano</h1>
                <p>Benvenuto, ${user.name}!</p>
            </div>
            
            <div class="dashboard-stats grid grid-4">
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
                
                <div class="stat-card card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">0,00 €</div>
                        <div class="stat-label">Vendite</div>
                    </div>
                </div>
                
                <div class="stat-card card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <div class="stat-value">-</div>
                        <div class="stat-label">Valutazione</div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-actions grid grid-2">
                <div class="card">
                    <h2>Azioni rapide</h2>
                    <div class="action-buttons">
                        <a href="/artisan/products/new" class="btn" data-route>
                            Aggiungi prodotto
                        </a>
                        <a href="/artisan/orders" class="btn" data-route>
                            Gestisci ordini
                        </a>
                        <a href="/artisan/profile" class="btn" data-route>
                            Modifica profilo
                        </a>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Ultimi ordini</h2>
                    <div class="empty-state">
                        <p>Non hai ancora ricevuto nessun ordine.</p>
                    </div>
                </div>
            </div>
            
            <div class="card mt-md">
                <h2>I tuoi prodotti</h2>
                <div class="empty-state">
                    <p>Non hai ancora aggiunto nessun prodotto.</p>
                    <a href="/artisan/products/new" class="btn btn-primary" data-route>
                        Aggiungi il tuo primo prodotto
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // In un'implementazione reale, qui caricheremmo i dati dal backend
    async function loadDashboardData() {
        // Simulazione caricamento dati
        toast.info('Dashboard artigiano caricata con successo');
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