const fs = require('fs');
const path = require('path');

try {
  console.log('🔍 Generazione del report di test integrativi in corso...');
  
  // Usa i risultati dal custom reporter o crea un report fallback
  let testResults;
  
  if (global.jestResults) {
    console.log('✅ Risultati Jest trovati dal custom reporter');
    testResults = global.jestResults;
  } else {
    console.log('⚠️  Nessun risultato Jest trovato, creazione report fallback...');
    testResults = {
      testType: 'backend-integrativi',
      timestamp: new Date().toISOString(),
      summary: {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        numPendingTests: 0,
        numSkippedTests: 0,
        success: false,
        duration: 0
      },
      testResults: [],
      coverage: null,
      error: 'Nessun risultato Jest trovato - possibile errore durante l\'esecuzione'
    };
  }

  // Percorsi per il salvataggio
  const outputDir = path.join(__dirname, '..', 'Output');
  const outputFile = path.join(outputDir, 'backend-integrativi-results.json');
  
  // Assicurati che la directory esista
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Directory creata: ${outputDir}`);
    } catch (err) {
      console.warn(`⚠️ Impossibile creare la directory ${outputDir}: ${err.message}`);
    }
  }
  
  // Salva il file
  try {
    fs.writeFileSync(outputFile, JSON.stringify(testResults, null, 2));
    console.log(`✅ Report JSON generato con successo: ${outputFile}`);
    console.log(`📊 Test Summary: ${testResults.summary.numPassedTests}/${testResults.summary.numTotalTests} passed`);
    if (testResults.summary.numFailedTests > 0) {
      console.log(`❌ Test falliti: ${testResults.summary.numFailedTests}`);
    }
    
    // Cambia i permessi per rendere il file accessibile
    try {
      fs.chmodSync(outputFile, 0o666);
    } catch (chmodErr) {
      console.warn(`⚠️ Impossibile modificare i permessi del file: ${chmodErr.message}`);
    }
  } catch (err) {
    console.error(`❌ Errore nel salvataggio del file ${outputFile}: ${err.message}`);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Errore durante la generazione del report:', error.message);
  
  // Crea un report di errore
  try {
    const outputDir = path.join(__dirname, '..', 'Output');
    const outputFile = path.join(outputDir, 'backend-integrativi-results.json');
    
    const errorReport = {
      testType: 'backend-integrativi',
      timestamp: new Date().toISOString(),
      summary: {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        numPendingTests: 0,
        numSkippedTests: 0,
        success: false,
        duration: 0
      },
      testResults: [],
      coverage: null,
      error: `Errore durante la generazione del report: ${error.message}`
    };
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(errorReport, null, 2));
    console.log(`📄 Report di errore generato: ${outputFile}`);
  } catch (reportErr) {
    console.error('❌ Impossibile creare anche il report di errore:', reportErr.message);
  }
  
  process.exit(1);
} 