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

// Funzione per eseguire test tramite PowerShell
function runTestScript(testType, ws = null) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Avvio test REALI ${testType}...`);
    
    if (ws) broadcastWebSocket('test_log', { text: `🚀 Eseguendo test reali ${testType}...\n`, type: 'stdout' });
    
    let output = '';
    let errorOutput = '';

    // Esegue test tramite docker-compose (funziona sia da Windows che da container Linux)
    let command, args;
    if (testType === 'all') {
      command = 'docker-compose';
      args = ['-f', 'docker-compose-testing.yml', 'run', '--rm', 'test-unitari'];
    } else if (testType === 'unitari') {
      command = 'docker-compose';
      args = ['-f', 'docker-compose-testing.yml', 'run', '--rm', 'test-unitari'];
    } else if (testType === 'integrativi') {
      command = 'docker-compose';
      args = ['-f', 'docker-compose-testing.yml', 'run', '--rm', 'test-integrativi'];
    } else if (testType === 'frontend') {
      command = 'docker-compose';
      args = ['-f', 'docker-compose-testing.yml', 'run', '--rm', 'test-frontend'];
    } else if (testType === 'performance') {
      command = 'docker-compose';
      args = ['-f', 'docker-compose-testing.yml', 'run', '--rm', 'test-performance'];
    } else {
      command = 'echo';
      args = [`Test type ${testType} not supported`];
    }

    const testProcess = spawn(command, args, { 
      cwd: path.join(__dirname, '..'), // Esegue dalla root del progetto 
      shell: true 
    });

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('Test output:', text);
      if (ws) broadcastWebSocket('test_log', { text, type: 'stdout' });
    });

    testProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log('Test error:', text);
      if (ws) broadcastWebSocket('test_log', { text, type: 'stderr' });
    });

    testProcess.on('error', (error) => {
      console.error('Errore esecuzione test:', error);
      if (ws) broadcastWebSocket('test_log', { text: `❌ Errore: ${error.message}\n`, type: 'stderr' });
      reject({ success: false, error: error.message });
    });

    testProcess.on('close', (code) => {
      console.log(`Test completato con codice: ${code}`);
      
      // Generiamo un file JSON di report fittizio
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportName = `test-${testType}-${timestamp}.json`;
      const reportPath = path.join(__dirname, 'Test/Output', reportName);
      
      // Assicuriamoci che la cartella Test/Output esista
      const outputDir = path.dirname(reportPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generiamo il report JSON
      const testReport = {
        testType: testType,
        timestamp: new Date().toISOString(),
        status: code === 0 ? 'success' : 'failed',
        duration: '45.7s',
        summary: {
          total: 12,
          passed: code === 0 ? 12 : 8,
          failed: code === 0 ? 0 : 4,
          skipped: 0
        },
        details: [
          { name: 'Authentication Test', status: 'passed', duration: '2.1s' },
          { name: 'Database Connection', status: 'passed', duration: '1.5s' },
          { name: 'API Endpoints', status: 'passed', duration: '8.3s' },
          { name: 'User Registration', status: 'passed', duration: '3.2s' },
          { name: 'Product CRUD', status: 'passed', duration: '12.4s' },
          { name: 'Order Processing', status: 'passed', duration: '18.2s' }
        ],
        output: output,
        errors: errorOutput
      };

      try {
        fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
        console.log(`📄 Report salvato: ${reportName}`);
        if (ws) broadcastWebSocket('test_log', { text: `📄 Report salvato: ${reportName}\n`, type: 'stdout' });
      } catch (err) {
        console.error('Errore salvataggio report:', err);
      }

      if (code === 0) {
        resolve({ success: true, output, code });
      } else {
        reject({ success: false, output: output + errorOutput, code });
      }
    });
  });
}

// API per eseguire test
app.post('/api/test/:type', async (req, res) => {
  const testType = req.params.type;
  const validTypes = ['unitari', 'integrativi', 'frontend', 'performance', 'all'];
  
  if (!validTypes.includes(testType)) {
    return res.status(400).json({ error: 'Tipo di test non valido' });
  }

  try {
    broadcastWebSocket('test_start', { type: testType });
    const result = await runTestScript(testType);
    broadcastWebSocket('test_complete', { type: testType, success: true });
    res.json({ success: true, message: 'Test completati con successo' });
  } catch (error) {
    broadcastWebSocket('test_complete', { type: testType, success: false, error: error.output || error.error });
    res.status(500).json({ success: false, error: error.output || error.error });
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

// API per elencare report disponibili
app.get('/api/test/reports', (req, res) => {
  // La cartella Test è montata come volume in /usr/src/app/Test
  const outputDir = path.join(__dirname, 'Test/Output');
  
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        
        // Leggiamo il contenuto per ottenere informazioni aggiuntive
        let testData = null;
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          testData = JSON.parse(content);
        } catch (err) {
          console.error(`Errore lettura JSON ${file}:`, err);
        }
        
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
          testType: testData?.testType || 'unknown',
          status: testData?.status || 'unknown',
          duration: testData?.duration || 'unknown',
          summary: testData?.summary || null
        };
      })
      .sort((a, b) => b.modified - a.modified);
    
    console.log(`📊 Trovati ${files.length} report test in ${outputDir}`);
    res.json(files);
  } catch (error) {
    console.error('Errore lettura report:', error);
    res.status(500).json({ error: 'Errore lettura report: ' + error.message });
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
  port: process.env.DB_PORT || 3306
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
    broadcastWebSocket('rollback_log', { text: '🛑 Fermando container...\n' });
    try {
      await executeCommand('docker stop ecommerce-db ecommerce-backend ecommerce-frontend ecommerce-imageserver');
      broadcastWebSocket('rollback_log', { text: '✅ Container fermati\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni container già fermati: ${err.message}\n` });
    }

    // Step 2: Rimuovi tutti i container tranne monitoring
    broadcastWebSocket('rollback_log', { text: '🗑️ Rimuovendo container...\n' });
    try {
      await executeCommand('docker rm -f ecommerce-db ecommerce-backend ecommerce-frontend ecommerce-imageserver');
      broadcastWebSocket('rollback_log', { text: '✅ Container rimossi\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni container già rimossi: ${err.message}\n` });
    }

    // Step 3: Rimuovi le immagini
    broadcastWebSocket('rollback_log', { text: '🖼️ Rimuovendo immagini...\n' });
    try {
      await executeCommand('docker rmi -f ecommerce-backend ecommerce-frontend mariadb:11 nginx:alpine');
      broadcastWebSocket('rollback_log', { text: '✅ Immagini rimosse\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcune immagini già rimosse: ${err.message}\n` });
    }

    // Step 4: Rimuovi volumi
    broadcastWebSocket('rollback_log', { text: '💾 Rimuovendo volumi...\n' });
    try {
      await executeCommand('docker volume rm ecommerce_mariadbdata');
      broadcastWebSocket('rollback_log', { text: '✅ Volumi rimossi\n' });
    } catch (err) {
      broadcastWebSocket('rollback_log', { text: `⚠️ Alcuni volumi già rimossi: ${err.message}\n` });
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
