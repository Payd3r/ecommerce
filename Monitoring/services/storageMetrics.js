const fs = require('fs-extra');
const path = require('path');

async function getStorageMetrics() {
  try {
    // Percorso della cartella Media
    const mediaPath = '/data/Media';
    const mediaExists = await fs.pathExists(mediaPath);
    
    let mediaMetrics = {
      path: mediaPath,
      exists: mediaExists,
      size: 0,
      files: 0,
      directories: 0,
      details: []
    };

    if (mediaExists) {
      mediaMetrics = await analyzePath(mediaPath);
    }

    // Analizza anche altre cartelle importanti del progetto
    const projectPaths = [
      '/data/Backend',   // <--- MODIFICA QUI
      '/data/Frontend',  // <--- MODIFICA QUI
      '/data/Test',      // <--- MODIFICA QUI
      '/usr/src/app'     // Lasciamo questo per analizzare il codice del monitoring stesso
    ];

    const projectMetrics = [];
    for (const projectPath of projectPaths) {
      const exists = await fs.pathExists(projectPath);
      if (exists) {
        const metrics = await analyzePath(projectPath);
        projectMetrics.push(metrics);
      }
    }

    // Calcola totali
    const totalSize = [mediaMetrics, ...projectMetrics].reduce((sum, item) => sum + item.size, 0);
    const totalFiles = [mediaMetrics, ...projectMetrics].reduce((sum, item) => sum + item.files, 0);

    return {
      media: mediaMetrics,
      project: projectMetrics,
      summary: {
        totalSize: totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        totalFiles: totalFiles,
        paths: projectPaths.length + 1
      },
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Errore nel recupero metriche storage:', error);
    return {
      error: error.message,
      timestamp: new Date()
    };
  }
}

async function analyzePath(targetPath) {
  const stats = {
    path: targetPath,
    exists: false,
    size: 0,
    files: 0,
    directories: 0,
    details: [],
    sizeFormatted: '0 B'
  };

  try {
    const pathExists = await fs.pathExists(targetPath);
    if (!pathExists) {
      return stats;
    }

    stats.exists = true;
    const pathStats = await fs.stat(targetPath);
    
    if (pathStats.isDirectory()) {
      const result = await analyzeDirectory(targetPath);
      stats.size = result.size;
      stats.files = result.files;
      stats.directories = result.directories;
      stats.details = result.details;
      stats.sizeFormatted = formatBytes(result.size);
    } else {
      stats.size = pathStats.size;
      stats.files = 1;
      stats.sizeFormatted = formatBytes(pathStats.size);
    }

  } catch (error) {
    console.error(`Errore nell'analisi del percorso ${targetPath}:`, error);
    stats.error = error.message;
  }

  return stats;
}

async function analyzeDirectory(dirPath, maxDepth = 3, currentDepth = 0) {
  let totalSize = 0;
  let totalFiles = 0;
  let totalDirectories = 0;
  const details = [];

  try {
    if (currentDepth >= maxDepth) {
      return { size: totalSize, files: totalFiles, directories: totalDirectories, details };
    }

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      try {
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          totalDirectories++;
          const subResult = await analyzeDirectory(itemPath, maxDepth, currentDepth + 1);
          totalSize += subResult.size;
          totalFiles += subResult.files;
          totalDirectories += subResult.directories;
          
          if (currentDepth === 0) { // Solo per il livello principale
            details.push({
              name: item,
              type: 'directory',
              size: subResult.size,
              sizeFormatted: formatBytes(subResult.size),
              files: subResult.files,
              directories: subResult.directories,
              path: itemPath
            });
          }
        } else {
          totalFiles++;
          totalSize += itemStats.size;
          
          if (currentDepth === 0) { // Solo per il livello principale
            details.push({
              name: item,
              type: 'file',
              size: itemStats.size,
              sizeFormatted: formatBytes(itemStats.size),
              extension: path.extname(item),
              modified: itemStats.mtime,
              path: itemPath
            });
          }
        }
      } catch (error) {
        console.error(`Errore nell'analisi dell'elemento ${itemPath}:`, error);
      }
    }

    // Ordina i dettagli per dimensione (decrescente)
    details.sort((a, b) => b.size - a.size);

  } catch (error) {
    console.error(`Errore nella lettura della directory ${dirPath}:`, error);
  }

  return { size: totalSize, files: totalFiles, directories: totalDirectories, details };
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Funzione per ottenere metriche specifiche di un file/directory
async function getPathMetrics(targetPath) {
  try {
    const metrics = await analyzePath(targetPath);
    return metrics;
  } catch (error) {
    return {
      path: targetPath,
      error: error.message,
      timestamp: new Date()
    };
  }
}

// Funzione per pulire cache o file temporanei
async function cleanupTemporaryFiles() {
  const tempPaths = [
    '/tmp',
    '/var/tmp',
    '/usr/src/app/node_modules/.cache'
  ];

  const results = [];
  
  for (const tempPath of tempPaths) {
    try {
      const exists = await fs.pathExists(tempPath);
      if (exists) {
        const beforeStats = await analyzePath(tempPath);
        // Qui potresti implementare la logica di pulizia se necessario
        results.push({
          path: tempPath,
          sizeBefore: beforeStats.size,
          sizeBeforeFormatted: formatBytes(beforeStats.size),
          cleaned: false, // Imposta su true se effettui pulizia
          message: 'Path analyzed but not cleaned'
        });
      }
    } catch (error) {
      results.push({
        path: tempPath,
        error: error.message
      });
    }
  }

  return {
    results,
    timestamp: new Date()
  };
}

module.exports = {
  getStorageMetrics,
  getPathMetrics,
  cleanupTemporaryFiles,
  formatBytes
}; 