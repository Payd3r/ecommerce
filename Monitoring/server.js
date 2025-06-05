const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');

// Importa i moduli per raccogliere le metriche
const dockerMetrics = require('./services/dockerMetrics');
const systemMetrics = require('./services/systemMetrics');
const storageMetrics = require('./services/storageMetrics');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3017;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store per le metriche in memoria
let currentMetrics = {
  docker: {},
  system: {},
  storage: {},
  lastUpdate: new Date()
};

// WebSocket per aggiornamenti in tempo reale
wss.on('connection', (ws) => {
  console.log('🔌 Nuova connessione WebSocket stabilita');
  
  // Invia le metriche attuali alla connessione
  ws.send(JSON.stringify({
    type: 'metrics',
    data: currentMetrics
  }));

  ws.on('error', (error) => {
    console.error('❌ Errore WebSocket:', error);
  });
});

// Funzione per aggiornare tutte le metriche
async function updateMetrics() {
  try {
    console.log('📊 Aggiornamento metriche in corso...');
    
    const [docker, system, storage] = await Promise.all([
      dockerMetrics.getDockerMetrics(),
      systemMetrics.getSystemMetrics(),
      storageMetrics.getStorageMetrics()
    ]);

    currentMetrics = {
      docker,
      system,
      storage,
      lastUpdate: new Date()
    };

    // Invia aggiornamenti a tutti i client WebSocket connessi
    const message = JSON.stringify({
      type: 'metrics',
      data: currentMetrics
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log('✅ Metriche aggiornate con successo');
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento delle metriche:', error);
  }
}

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    service: 'ArtigianatoShop Monitoring'
  });
});

app.get('/api/metrics', (req, res) => {
  res.json(currentMetrics);
});

app.get('/api/metrics/docker', (req, res) => {
  res.json(currentMetrics.docker);
});

app.get('/api/metrics/system', (req, res) => {
  res.json(currentMetrics.system);
});

app.get('/api/metrics/storage', (req, res) => {
  res.json(currentMetrics.storage);
});

// Route principale per servire la dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Programma aggiornamenti automatici ogni 10 secondi
cron.schedule('*/10 * * * * *', updateMetrics);

// Avvia il server
server.listen(PORT, () => {
  console.log(`🚀 Sistema di Monitoraggio ArtigianatoShop avviato su porta ${PORT}`);
  console.log(`📈 Dashboard disponibile su: http://localhost:${PORT}`);
  console.log(`🔧 API disponibili su: http://localhost:${PORT}/api/`);
  
  // Primo aggiornamento delle metriche
  updateMetrics();
});

// Gestione graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Arresto del sistema di monitoraggio...');
  server.close(() => {
    console.log('✅ Server chiuso correttamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arresto del sistema di monitoraggio...');
  server.close(() => {
    console.log('✅ Server chiuso correttamente');
    process.exit(0);
  });
}); 