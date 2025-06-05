const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const multer = require('multer');

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

// Endpoint per ottenere le ultime N righe di log di un container Docker
app.get('/api/container/:name/logs', (req, res) => {
  const container = req.params.name;
  const lines = req.query.lines || 100;
  // Sanifica il nome del container (solo lettere, numeri, trattini e underscore)
  if (!/^[\w-]+$/.test(container)) return res.status(400).send('Invalid container name');
  exec(`docker logs --tail ${lines} ${container}`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr || err.message);
    res.type('text/plain').send(stdout);
  });
});

// Route principale per servire la dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Programma aggiornamenti automatici ogni 5 minuti
cron.schedule('0 */5 * * * *', updateMetrics);

// NEW SECTION: API BACKUP
app.get('/api/backup', (req, res) => {
  const backup = spawn('sh', [path.join(__dirname, '../scripts/backup.sh')]);
  let zipPath = '';
  backup.stdout.on('data', (data) => { zipPath += data.toString(); });
  backup.stderr.on('data', (data) => { console.error(data.toString()); });
  backup.on('close', (code) => {
    zipPath = zipPath.trim();
    if (code === 0 && fs.existsSync(zipPath)) {
      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(zipPath)}`);
      res.setHeader('Content-Type', 'application/zip');
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(500).send('Errore creazione backup');
    }
  });
});

// NEW SECTION: API RESTORE
app.post('/api/restore-clean-build', (req, res) => {
  const restore = spawn('sh', [path.join(__dirname, '../scripts/restore.sh')]);
  let output = '';
  restore.stdout.on('data', (data) => { output += data.toString(); });
  restore.stderr.on('data', (data) => { output += data.toString(); });
  restore.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, output });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'tasks', data: { event: 'restore', status: 'success', output } }));
        }
      });
    } else {
      res.status(500).json({ success: false, output });
    }
  });
});

// NEW SECTION: API IMPORT
const upload = multer({ dest: '/tmp' });
app.post('/api/import-backup', upload.single('backup'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const importProc = spawn('sh', [path.join(__dirname, '../scripts/import.sh'), req.file.path]);
  let output = '';
  importProc.stdout.on('data', (data) => { output += data.toString(); });
  importProc.stderr.on('data', (data) => { output += data.toString(); });
  importProc.on('close', (code) => {
    fs.unlinkSync(req.file.path);
    if (code === 0) {
      res.json({ success: true, output });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'tasks', data: { event: 'import', status: 'success', output } }));
        }
      });
    } else {
      res.status(500).json({ success: false, output });
    }
  });
});

// NEW SECTION: API TEST RUNNER
app.post('/api/run-test', (req, res) => {
  const testProc = spawn('npm', ['run', 'test'], { cwd: path.join(__dirname, '../Test') });
  res.json({ started: true });
  testProc.stdout.on('data', (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'tasks', data: { event: 'test', stream: data.toString() } }));
      }
    });
  });
  testProc.stderr.on('data', (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'tasks', data: { event: 'test', stream: data.toString() } }));
      }
    });
  });
  testProc.on('close', (code) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'tasks', data: { event: 'test', status: code === 0 ? 'success' : 'fail' } }));
      }
    });
  });
});

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