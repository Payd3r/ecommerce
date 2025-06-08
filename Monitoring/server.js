const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const fsp = require('fs').promises;
const multer = require('multer');
const archiver = require('archiver');
const mysql = require('mysql2/promise');

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

// Configurazione upload
const upload = multer({ dest: path.join(__dirname, 'temp') });

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

// Funzione per broadcast WebSocket
function broadcastWebSocket(type, data) {
  const message = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

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

    broadcastWebSocket('metrics', currentMetrics);
    console.log('✅ Metriche aggiornate con successo');
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento delle metriche:', error);
  }
}

// Routes API base
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    service: 'Pane e Salame Monitoring'
  });
});

app.get('/api/metrics', (req, res) => {
  res.json(currentMetrics);
});

// === API TESTING ===

// Funzione per eseguire gli script di test
function runTestScript(testType) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Esecuzione test ${testType}...`);
    
    let command;
    let args;
    
    switch(testType) {
      case 'backend-unitari':
      case 'unitari':
        command = 'sh';
        args = ['-c', 'cd /usr/src/app && docker compose -f docker-compose-testing.yml up -d mariadb-test-db && docker compose -f docker-compose-testing.yml run --rm test-unitari'];
        break;
      case 'backend-integrativi':
      case 'integrativi':
        command = 'sh';
        args = ['-c', 'cd /usr/src/app && docker compose -f docker-compose-testing.yml up -d mariadb-test-db backend-test && docker compose -f docker-compose-testing.yml run --rm test-integrativi'];
        break;
      case 'frontend':
        command = 'sh';
        args = ['-c', 'cd /usr/src/app && docker compose -f docker-compose-testing.yml up -d mariadb-test-db backend-test && docker compose -f docker-compose-testing.yml run --rm test-frontend'];
        break;
      case 'performance':
        command = 'sh';
        args = ['-c', 'cd /usr/src/app && docker compose -f docker-compose-testing.yml up -d mariadb-test-db backend-test && docker compose -f docker-compose-testing.yml run --rm test-performance'];
        break;
      case 'cross-browser':
        // Cross-browser test è statico, restituisce successo immediato
        resolve({ 
          success: true, 
          output: 'Cross-browser test completato (report statico)',
          code: 0,
          message: 'Test cross-browser utilizza report pre-generati'
        });
        return;
      case 'all':
        command = 'sh';
        args = ['-c', 'cd /usr/src/app && docker compose -f docker-compose-testing.yml up -d mariadb-test-db backend-test && docker compose -f docker-compose-testing.yml run --rm test-unitari && docker compose -f docker-compose-testing.yml run --rm test-integrativi && docker compose -f docker-compose-testing.yml run --rm test-frontend && docker compose -f docker-compose-testing.yml run --rm test-performance'];
        break;
      default:
        reject(new Error(`Tipo di test non supportato: ${testType}`));
        return;
    }

    console.log(`📝 Comando: ${command} ${args.join(' ')}`);
    
    const testProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: '/usr/src/app'
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log(`📤 Output test ${testType}:`, chunk);
      output += chunk;
    });

    testProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.error(`❌ Errore test ${testType}:`, chunk);
      errorOutput += chunk;
    });

    testProcess.on('close', (code) => {
      console.log(`✅ Test ${testType} completato con codice:`, code);
      if (code === 0) {
        resolve({ success: true, output, code });
      } else {
        reject(new Error(`Test ${testType} fallito: ${errorOutput || output}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Errore esecuzione test ${testType}:`, error);
      reject(error);
    });
  });
}

// API per eseguire test
app.post('/api/test/:testType', async (req, res) => {
  const testType = req.params.testType;
  console.log(`🧪 Richiesta esecuzione test: ${testType}`);
  
  try {
    const result = await runTestScript(testType);
    res.json(result);
  } catch (error) {
    console.error('Errore esecuzione test:', error);
    res.status(500).json({ error: error.message });
  }
});

// API per scaricare report test
app.get('/api/test/report/:filename', (req, res) => {
  const filename = req.params.filename;
  const reportPath = path.join(__dirname, 'Test/Output', filename);
  
  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: 'Report non trovato' });
  }

  res.download(reportPath, filename);
});

// API per ottenere i report dei test
app.get('/api/test/reports', (req, res) => {
  // Nella configurazione Docker, Test/Output viene montato direttamente
  const outputDir = path.join(__dirname, 'Test/Output');
  
  console.log('📊 Richiesta report test, directory:', outputDir);
  
  try {
    // Assicuriamoci che la directory esista
    if (!fs.existsSync(outputDir)) {
      console.log('❌ Directory non esiste:', outputDir);
      return res.json([]);
    }
    
    // Leggi tutti i file JSON nella directory
    const allFiles = fs.readdirSync(outputDir);
    console.log('📁 File trovati:', allFiles);
    
    const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
    console.log('📄 File JSON:', jsonFiles);
    
    const files = jsonFiles.map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`✅ File ${file} parsato correttamente`);
          
          return {
            ...content,
            timestamp: stats.mtime.toISOString()
          };
        } catch (parseError) {
          console.error(`❌ Errore parsing file ${file}:`, parseError.message);
          return null;
        }
      })
      .filter(file => file !== null)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log('📋 Report processati:', files.length);
    res.json(files);
  } catch (error) {
    console.error('❌ Errore lettura report:', error);
    res.status(500).json({ error: 'Errore lettura report' });
  }
});

// API per ottenere i dettagli di un report specifico
app.get('/api/test/reports/:testType/:timestamp', (req, res) => {
  const { testType, timestamp } = req.params;
  const outputDir = path.join(__dirname, 'Test/Output');
  
  try {
    // Assicuriamoci che la directory esista
    if (!fs.existsSync(outputDir)) {
      return res.status(404).json({ error: 'Report non trovato' });
    }
    
    // Cerca il file più recente che corrisponde al tipo di test e timestamp
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        return {
          ...content,
          timestamp: stats.mtime.toISOString()
        };
      })
      .filter(report => 
        report.testType === testType && 
        new Date(report.timestamp).toISOString() === timestamp
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Report non trovato' });
    }
    
    res.json(files[0]);
  } catch (error) {
    console.error('Errore lettura report:', error);
    res.status(500).json({ error: 'Errore lettura report' });
  }
});

// API per scaricare contenuto completo di un report
app.get('/api/test/report/:filename/content', (req, res) => {
  const filename = req.params.filename;
  const reportPath = path.join(__dirname, 'Test/Output', filename);
  
  try {
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: 'Report non trovato' });
    }

    const content = fs.readFileSync(reportPath, 'utf8');
    const reportData = JSON.parse(content);
    
    res.json(reportData);
  } catch (error) {
    console.error('Errore lettura contenuto report:', error);
    res.status(500).json({ error: 'Errore lettura contenuto report' });
  }
});

// API per aggiornare la lista dei report (force refresh)
app.post('/api/test/reports/refresh', (req, res) => {
  try {
    const outputDir = path.join(__dirname, 'Test/Output');
    
    console.log('🔄 Aggiornamento forzato lista report test...');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('📁 Cartella Test/Output creata');
    }
    
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.json'));
    console.log(`📊 Trovati ${files.length} file JSON dopo refresh`);
    
    res.json({ success: true, message: `Lista aggiornata: ${files.length} report trovati` });
  } catch (error) {
    console.error('Errore refresh report:', error);
    res.status(500).json({ error: 'Errore refresh report: ' + error.message });
  }
});

// API per scaricare un report come file
app.get('/api/test/report/:filename/download', (req, res) => {
  try {
    const filename = req.params.filename;
    const reportPath = path.join(__dirname, 'Test/Output', filename);
    
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: 'Report non trovato' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(reportPath);
  } catch (error) {
    console.error('❌ Errore download report:', error);
    res.status(500).json({ error: 'Errore nel download del report' });
  }
});

// === API README ===

// API per ottenere il contenuto del README
app.get('/api/readme', (req, res) => {
  try {
    const readmePath = path.join(__dirname, 'README.md');
    
    if (!fs.existsSync(readmePath)) {
      return res.status(404).json({ error: 'README non trovato' });
    }

    const content = fs.readFileSync(readmePath, 'utf8');
    res.json({ 
      content: content,
      lastModified: fs.statSync(readmePath).mtime.toISOString()
    });
  } catch (error) {
    console.error('❌ Errore lettura README:', error);
    res.status(500).json({ error: 'Errore lettura README' });
  }
});

// API per servire screenshot di test cross-browser
app.get('/api/test/screenshot/:filename', (req, res) => {
  const filename = req.params.filename;
  
  try {
    // Prova prima la cartella Documenti/cross_browser
    const crossBrowserBasePath = path.join(__dirname, '../Documenti/cross_browser');
    let screenshotPath = null;
    
    // Lista delle possibili posizioni per browser
    const browserPaths = ['chrome', 'firefox', 'edge'];
    
    // Cerca nelle cartelle browser
    for (const browser of browserPaths) {
      const possibleExtensions = ['.png', '.jpg', '.jpeg'];
      
      for (const ext of possibleExtensions) {
        const testPath = path.join(crossBrowserBasePath, browser, filename.replace('.png', ext));
        if (fs.existsSync(testPath)) {
          screenshotPath = testPath;
          break;
        }
      }
      
      if (screenshotPath) break;
    }
    
    // Fallback: cerca nella cartella screenshots tradizionale
    if (!screenshotPath) {
      screenshotPath = path.join(__dirname, '../Test/Output/screenshots', filename);
    }
    
    // Se non esiste, crea un placeholder SVG migliorato
    if (!fs.existsSync(screenshotPath)) {
      const svgPlaceholder = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          <rect x="50" y="50" width="300" height="200" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="8"/>
          <text x="50%" y="40%" text-anchor="middle" font-family="Arial" font-size="16" fill="#6c757d" font-weight="bold">
            Ecommerce Screenshot
          </text>
          <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">
            ${filename.replace('.png', '').charAt(0).toUpperCase() + filename.replace('.png', '').slice(1)}
          </text>
          <text x="50%" y="70%" text-anchor="middle" font-family="Arial" font-size="10" fill="#adb5bd">
            Test Cross-Browser Placeholder
          </text>
          <circle cx="120" cy="140" r="8" fill="#007bff"/>
          <circle cx="200" cy="160" r="6" fill="#28a745"/>
          <circle cx="280" cy="140" r="10" fill="#ffc107"/>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(svgPlaceholder);
    }
    
    // Determina il tipo MIME basato sull'estensione
    const ext = path.extname(screenshotPath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg', 
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache per 24 ore
    
    // Serve il file esistente
    res.sendFile(screenshotPath);
  } catch (error) {
    console.error('❌ Errore servizio screenshot:', error);
    res.status(500).json({ error: 'Errore nel servizio screenshot' });
  }
});

// === API CONTAINER LOGS ===

// API per ottenere i log di un container specifico
app.get('/api/container/:containerName/logs', (req, res) => {
  const containerName = req.params.containerName;
  const lines = req.query.lines || '100';
  
  console.log(`📋 Richiesta log per container: ${containerName} (${lines} righe)`);
  
  // Esegue docker logs per ottenere i log del container
  const logProcess = spawn('docker', ['logs', '--tail', lines, containerName], {
    encoding: 'utf8'
  });

  let output = '';
  let errorOutput = '';

  logProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  logProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  logProcess.on('close', (code) => {
    if (code === 0) {
      // Docker logs restituisce i log sia su stdout che stderr
      const logs = output || errorOutput || 'Nessun log disponibile';
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(logs);
    } else {
      console.error(`Errore ottenimento log container ${containerName}:`, errorOutput);
      res.status(500).send(`Errore ottenimento log: ${errorOutput || 'Container non trovato'}`);
    }
  });

  logProcess.on('error', (error) => {
    console.error(`Errore processo docker logs:`, error);
    res.status(500).send(`Errore processo: ${error.message}`);
  });
});

// === API GESTIONE MEDIA ===

// Export cartella Media
app.get('/api/media/export', async (req, res) => {
  try {
    // Nel container Docker, la cartella Media è montata in /usr/src/app/Media
    const mediaPath = path.join(__dirname, 'Media');
    
    // Verifica che la cartella esista
    if (!fs.existsSync(mediaPath)) {
      return res.status(404).json({ error: 'Cartella Media non trovata' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipName = `media-backup-${timestamp}.zip`;
        const zipPath = path.join(__dirname, 'backups/media', zipName);
    
    // Assicurati che la cartella Backups/media esista
    const backupDir = path.dirname(zipPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 Export Media completato: ${archive.pointer()} bytes`);
      res.download(zipPath, zipName, (err) => {
        if (err) console.error('Errore download:', err);
        // Pulisci il file temporaneo dopo il download
        setTimeout(() => {
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }, 60000);
      });
    });

    archive.on('error', (err) => {
      console.error('Errore archivio:', err);
      res.status(500).json({ error: err.message });
    });

    archive.pipe(output);
    archive.directory(mediaPath, false);
    archive.finalize();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import cartella Media
app.post('/api/media/import', upload.single('mediaZip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const mediaPath = path.join(__dirname, 'Media');
    
    // Backup attuale prima dell'import
    await createMediaBackup('pre-import');
    
    // Estrai il file zip usando unzip (disponibile nel container Linux)
    const extractProcess = spawn('unzip', [
      '-o',  // sovrascrivi file esistenti
      '-q',  // modalità quiet
      req.file.path,
      '-d', mediaPath
    ]);

    let errorOutput = '';
    extractProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    extractProcess.on('close', (code) => {
      fs.unlinkSync(req.file.path); // Pulisci file temporaneo
      
      if (code === 0) {
        console.log('📥 Import Media completato con successo');
        res.json({ success: true, message: 'Import completato con successo' });
      } else {
        console.error('Errore estrazione:', errorOutput);
        res.status(500).json({ error: 'Errore durante l\'estrazione' });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backup cartella Media
app.post('/api/media/backup', async (req, res) => {
  try {
    const backupName = await createMediaBackup('manual');
    res.json({ success: true, backup: backupName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lista backup Media
app.get('/api/media/backups', (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups/media');
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }

    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          name: file,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore backup Media
app.post('/api/media/restore/:backupName', async (req, res) => {
  try {
    const backupName = req.params.backupName;
    const backupPath = path.join(__dirname, 'backups/media', backupName);
    const mediaPath = path.join(__dirname, 'Media');

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup non trovato' });
    }

    // Backup attuale prima del restore
    await createMediaBackup('pre-restore');

    // Prima rimuovi tutto dal Media
    const removeProcess = spawn('rm', ['-rf', `${mediaPath}/*`], { shell: true });
    
    removeProcess.on('close', (removeCode) => {
      if (removeCode !== 0) {
        return res.status(500).json({ error: 'Errore durante la rimozione dei file esistenti' });
      }

      // Estrai il backup
      const extractProcess = spawn('unzip', [
        '-o',  // sovrascrivi file esistenti
        '-q',  // modalità quiet
        backupPath,
        '-d', mediaPath
      ]);

      let errorOutput = '';
      extractProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      extractProcess.on('close', (code) => {
        if (code === 0) {
          console.log('🔄 Restore Media completato con successo');
          res.json({ success: true, message: 'Restore completato con successo' });
        } else {
          console.error('Errore restore:', errorOutput);
          res.status(500).json({ error: 'Errore durante il restore' });
        }
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ripristina versione safe Media
app.post('/api/media/restore-safe', async (req, res) => {
  try {
    const safePath = path.join(__dirname, 'safe-versions/media');
    const mediaPath = path.join(__dirname, 'Media');

    if (!fs.existsSync(safePath) || fs.readdirSync(safePath).length === 0) {
      return res.status(404).json({ error: 'Versione safe non trovata' });
    }

    // Backup attuale prima del ripristino
    await createMediaBackup('pre-safe-restore');

    // Prima rimuovi tutto dal Media
    const removeProcess = spawn('rm', ['-rf', `${mediaPath}/*`], { shell: true });
    
    removeProcess.on('close', (removeCode) => {
      if (removeCode !== 0) {
        return res.status(500).json({ error: 'Errore durante la rimozione dei file esistenti' });
      }

      // Copia la versione safe usando cp (Linux)
      const copyProcess = spawn('cp', ['-r', `${safePath}/*`, mediaPath], { shell: true });

      let errorOutput = '';
      copyProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      copyProcess.on('close', (code) => {
        if (code === 0) {
          console.log('🔒 Versione safe Media ripristinata con successo');
          res.json({ success: true, message: 'Versione safe ripristinata con successo' });
        } else {
          console.error('Errore ripristino safe:', errorOutput);
          res.status(500).json({ error: 'Errore durante il ripristino safe' });
        }
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === API GESTIONE DATABASE ===

// Configurazione database
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'ecommerce_db',
  port: process.env.DB_PORT || 3307
};

// Export database
app.get('/api/database/export', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpName = `database-backup-${timestamp}.sql`;
        const dumpPath = path.join(__dirname, 'backups/database', dumpName);
    
    // Assicurati che la cartella Backups/database esista
    const backupDir = path.dirname(dumpPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🗄️ Inizio export database...');

    const dumpProcess = spawn('mariadb-dump', [
      '-h', dbConfig.host,
      '-P', dbConfig.port.toString(),
      '-u', dbConfig.user,
      `-p${dbConfig.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      dbConfig.database
    ]);

    const writeStream = fs.createWriteStream(dumpPath);
    dumpProcess.stdout.pipe(writeStream);

    let errorOutput = '';
    dumpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    dumpProcess.on('error', (error) => {
      console.error('Errore processo mariadb-dump:', error);
      res.status(500).json({ error: 'Comando mariadb-dump non disponibile' });
    });

    dumpProcess.on('close', (code) => {
      writeStream.end();
      
      if (code === 0) {
        console.log('💾 Export database completato con successo');
        res.download(dumpPath, dumpName, (err) => {
          if (err) console.error('Errore download:', err);
          // Pulisci il file dopo il download
          setTimeout(() => {
            if (fs.existsSync(dumpPath)) fs.unlinkSync(dumpPath);
          }, 60000);
        });
      } else {
        console.error('Errore export database:', errorOutput);
        res.status(500).json({ error: `Errore durante l'export del database: ${errorOutput}` });
      }
    });

  } catch (error) {
    console.error('Errore export database:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backup database
app.post('/api/database/backup', async (req, res) => {
  try {
    const backupName = await createDatabaseBackup('manual');
    res.json({ success: true, backup: backupName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lista backup database
app.get('/api/database/backups', (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups/database');
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }

    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          name: file,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import database
app.post('/api/database/import', upload.single('databaseFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    // Backup attuale prima dell'import
    await createDatabaseBackup('pre-import');

    console.log(`📥 Importando database: ${req.file.originalname}`);

    const importProcess = spawn('mariadb', [
      '-h', dbConfig.host,
      '-P', dbConfig.port.toString(),
      '-u', dbConfig.user,
      `-p${dbConfig.password}`,
      dbConfig.database
    ]);

    const readStream = fs.createReadStream(req.file.path);
    readStream.pipe(importProcess.stdin);

    let errorOutput = '';
    importProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    importProcess.on('error', (error) => {
      console.error('Errore processo mariadb import:', error);
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Comando mariadb non disponibile' });
    });

    importProcess.on('close', (code) => {
      fs.unlinkSync(req.file.path); // Pulisci file temporaneo
      
      if (code === 0) {
        console.log('✅ Import database completato con successo');
        res.json({ success: true, message: 'Import database completato con successo' });
      } else {
        console.error('Errore import database:', errorOutput);
        res.status(500).json({ error: `Errore durante l'import del database: ${errorOutput}` });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore backup Database
app.post('/api/database/restore/:backupName', async (req, res) => {
  try {
    const backupName = req.params.backupName;
    const backupPath = path.join(__dirname, 'backups/database', backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup non trovato' });
    }

    // Backup attuale prima del restore
    await createDatabaseBackup('pre-restore');

    console.log(`🔄 Ripristinando backup database: ${backupName}`);

    // Ripristina il backup
    const restoreProcess = spawn('mariadb', [
      '-h', dbConfig.host,
      '-P', dbConfig.port.toString(),
      '-u', dbConfig.user,
      `-p${dbConfig.password}`,
      dbConfig.database
    ]);

    const readStream = fs.createReadStream(backupPath);
    readStream.pipe(restoreProcess.stdin);

    let errorOutput = '';
    restoreProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    restoreProcess.on('error', (error) => {
      console.error('Errore processo mariadb restore:', error);
      res.status(500).json({ error: 'Comando mariadb non disponibile' });
    });

    restoreProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Restore database completato con successo');
        res.json({ success: true, message: 'Restore database completato con successo' });
      } else {
        console.error('Errore restore database:', errorOutput);
        res.status(500).json({ error: `Errore durante il restore del database: ${errorOutput}` });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ripristina versione safe Database
app.post('/api/database/restore-safe', async (req, res) => {
  try {
    const safePath = path.join(__dirname, 'safe-versions/database');
    const safeFile = 'safe-database.sql';
    const safeFilePath = path.join(safePath, safeFile);

    if (!fs.existsSync(safeFilePath)) {
      return res.status(404).json({ error: 'Versione safe database non trovata' });
    }

    // Backup attuale prima del ripristino
    await createDatabaseBackup('pre-safe-restore');

    // Ripristina la versione safe
    const restoreProcess = spawn('mariadb', [
      '-h', dbConfig.host,
      '-P', dbConfig.port,
      '-u', dbConfig.user,
      `-p${dbConfig.password}`,
      dbConfig.database
    ]);

    const readStream = fs.createReadStream(safeFilePath);
    readStream.pipe(restoreProcess.stdin);

    restoreProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, message: 'Versione safe database ripristinata con successo' });
      } else {
        res.status(500).json({ error: 'Errore durante il ripristino safe del database' });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === API ROLLBACK ===

app.post('/api/rollback', async (req, res) => {
  try {
    console.log('🔄 Inizio procedura di rollback completo...');
    broadcastWebSocket('rollback_start', {});
    
    broadcastWebSocket('rollback_log', { text: '🚨 ROLLBACK COMPLETO SISTEMA\n' });
    broadcastWebSocket('rollback_log', { text: '⚠️ Cancellazione di tutti i container e immagini...\n' });
    
    // Step 1: Ferma tutti i container tranne monitoring
    broadcastWebSocket('rollback_log', { text: '🛑 Fermando container produzione...\n' });
    try {
      await executeCommand('docker stop ecommerce-db ecommerce-backend ecommerce-frontend ecommerce-imageserver');
      broadcastWebSocket('rollback_log', { text: '✅ Container produzione fermati\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni container produzione già fermati: ${err.message}\n` });
    }

    // Step 1.5: Ferma e rimuovi tutti i container di testing
    broadcastWebSocket('rollback_log', { text: '🛑 Fermando container di testing...\n' });
    try {
      await executeCommand('docker compose -f docker-compose-testing.yml down --remove-orphans');
      broadcastWebSocket('rollback_log', { text: '✅ Container di testing fermati e rimossi\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Errore rimozione container testing: ${err.message}\n` });
    }

    // Step 2: Rimuovi tutti i container tranne monitoring
    broadcastWebSocket('rollback_log', { text: '🗑️ Rimuovendo container produzione...\n' });
    try {
      await executeCommand('docker rm -f ecommerce-db ecommerce-backend ecommerce-frontend ecommerce-imageserver');
      broadcastWebSocket('rollback_log', { text: '✅ Container produzione rimossi\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni container produzione già rimossi: ${err.message}\n` });
    }

    // Step 3: Rimuovi le immagini
    broadcastWebSocket('rollback_log', { text: '🖼️ Rimuovendo immagini...\n' });
    try {
      await executeCommand('docker rmi -f ecommerce-backend ecommerce-frontend mariadb:11 nginx:alpine');
      broadcastWebSocket('rollback_log', { text: '✅ Immagini rimosse\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcune immagini già rimosse: ${err.message}\n` });
    }

    // Step 4: Rimuovi volumi produzione e testing
    broadcastWebSocket('rollback_log', { text: '💾 Rimuovendo volumi produzione...\n' });
    try {
      await executeCommand('docker volume rm ecommerce_mariadbdata');
      broadcastWebSocket('rollback_log', { text: '✅ Volumi produzione rimossi\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni volumi produzione già rimossi: ${err.message}\n` });
    }

    // Step 4.5: Rimuovi volumi di testing
    broadcastWebSocket('rollback_log', { text: '💾 Rimuovendo volumi di testing...\n' });
    try {
      await executeCommand('docker volume rm testing_test-db-data testing_backend-test-modules testing_backend-test-media testing_test-unitari-modules testing_test-integrativi-modules testing_test-frontend-modules testing_test-performance-modules testing_monitoring-test-modules');
      broadcastWebSocket('rollback_log', { text: '✅ Volumi di testing rimossi\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni volumi di testing già rimossi: ${err.message}\n` });
    }

    // Step 5: Pulisci sistema Docker
    broadcastWebSocket('rollback_log', { text: '🧹 Pulizia sistema Docker...\n' });
    try {
      await executeCommand('docker system prune -f');
      broadcastWebSocket('rollback_log', { text: '✅ Sistema pulito\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Errore pulizia: ${err.message}\n` });
    }

    // Step 6: Ripristina versione safe Media
    broadcastWebSocket('rollback_log', { text: '📁 Ripristinando versione safe Media...\n' });
    const safePath = path.join(__dirname, 'safe-versions/media');
    const mediaPath = path.join(__dirname, 'Media');
    
    if (fs.existsSync(safePath) && fs.readdirSync(safePath).length > 0) {
      try {
        // Rimuovi contenuto Media esistente
        const mediaFiles = fs.readdirSync(mediaPath);
        for (const file of mediaFiles) {
          const filePath = path.join(mediaPath, file);
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
        
        // Copia versione safe
        const safeFiles = fs.readdirSync(safePath);
        for (const file of safeFiles) {
          const srcPath = path.join(safePath, file);
          const destPath = path.join(mediaPath, file);
          if (fs.lstatSync(srcPath).isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
        
        broadcastWebSocket('rollback_log', { text: '✅ Media ripristinato con successo\n' });
      } catch (error) {
        broadcastWebSocket('rollback_log', { text: `⚠️ Errore ripristino Media: ${error.message}\n` });
        // Non bloccare il rollback per questo errore
      }
    }

    // Step 7: Ricostruisci tutto
    broadcastWebSocket('rollback_log', { text: '🚀 Ricostruendo sistema...\n' });
    try {
      await executeCommand('docker-compose up -d --build');
      broadcastWebSocket('rollback_log', { text: '✅ Sistema ricostruito con successo\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `❌ Errore ricostruzione: ${err.message}\n` });
      throw err;
    }

    broadcastWebSocket('rollback_log', { text: '🎉 ROLLBACK COMPLETO TERMINATO CON SUCCESSO!\n' });
    broadcastWebSocket('rollback_log', { text: '🔄 Refreshing pagina in 3 secondi...\n' });
    
    // Refresh della pagina dopo 3 secondi
    setTimeout(() => {
      broadcastWebSocket('page_refresh', {});
    }, 3000);
    
    broadcastWebSocket('rollback_complete', { success: true });
    res.json({ success: true, message: 'Rollback completo terminato con successo - Sistema ricostruito' });
    
  } catch (error) {
    console.error('Errore rollback:', error);
    broadcastWebSocket('rollback_log', { text: `❌ ERRORE CRITICO: ${error.message}\n` });
    broadcastWebSocket('rollback_complete', { success: false, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// === FUNZIONI HELPER ===

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function createMediaBackup(prefix = 'backup') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${prefix}-${timestamp}.zip`;
  const backupPath = path.join(__dirname, 'backups/media', backupName);
  const mediaPath = path.join(__dirname, 'Media');

        // Assicurati che la cartella Backups/media esista
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 Backup Media creato: ${backupName}`);
      resolve(backupName);
    });
    archive.on('error', (err) => {
      console.error('Errore backup Media:', err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(mediaPath, false);
    archive.finalize();
  });
}

async function createDatabaseBackup(prefix = 'backup') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${prefix}-${timestamp}.sql`;
             const backupPath = path.join(__dirname, 'backups/database', backupName);
  
          // Assicurati che la cartella backups/database esista
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    console.log('💾 Creando backup database...');
    
    const dumpProcess = spawn('mariadb-dump', [
      '-h', dbConfig.host,
      '-P', dbConfig.port.toString(),
      '-u', dbConfig.user,
      `-p${dbConfig.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      dbConfig.database
    ]);

    const writeStream = fs.createWriteStream(backupPath);
    dumpProcess.stdout.pipe(writeStream);

    let errorOutput = '';
    dumpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    dumpProcess.on('error', (error) => {
      console.error('Errore processo mariadb-dump:', error);
      reject(new Error('Comando mariadb-dump non disponibile'));
    });

    dumpProcess.on('close', (code) => {
      writeStream.end();
      
      if (code === 0) {
        console.log(`💾 Backup Database creato: ${backupName}`);
        resolve(backupName);
      } else {
        console.error('Errore backup database:', errorOutput);
        reject(new Error(`Errore durante il backup del database: ${errorOutput}`));
      }
    });
  });
}

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Programma aggiornamenti automatici ogni 5 minuti
cron.schedule('0 */5 * * * *', updateMetrics);

// Avvia il server
server.listen(PORT, () => {
  console.log(`🚀 Sistema di Monitoraggio Pane e Salame avviato su porta ${PORT}`);
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
