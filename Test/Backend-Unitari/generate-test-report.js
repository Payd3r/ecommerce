const fs = require('fs');
const path = require('path');

// Leggi il file di risultati generato da Jest
try {
  console.log('🔍 Generazione del report di test unitari in corso...');
  
  const jestResultsPath = path.join(__dirname, '.jest-results.json');
  
  if (!fs.existsSync(jestResultsPath)) {
    console.error(`❌ File ${jestResultsPath} non trovato!`);
    process.exit(1);
  }
  
  const jestResults = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
  
  // Crea un oggetto con i risultati formattati e standardizzati
  const testResults = {
    testType: 'backend-unitari',
    timestamp: new Date().toISOString(),
    summary: {
      numTotalTests: jestResults.numTotalTests || 0,
      numPassedTests: jestResults.numPassedTests || 0,
      numFailedTests: jestResults.numFailedTests || 0,
      numPendingTests: jestResults.numPendingTests || 0,
      numSkippedTests: jestResults.numSkippedTests || 0,
      success: jestResults.success || false,
      duration: jestResults.endTime ? jestResults.endTime - jestResults.startTime : 0
    },
    testResults: (jestResults.testResults || []).map(result => ({
      name: result.name,
      status: result.status,
      message: result.message || '',
      duration: result.endTime - result.startTime,
      numFailingTests: result.numFailingTests || 0,
      numPassingTests: result.numPassingTests || 0,
      numPendingTests: result.numPendingTests || 0,
      assertionResults: (result.assertionResults || []).map(assertion => ({
        title: assertion.title,
        status: assertion.status,
        failureMessages: assertion.failureMessages || [],
        duration: assertion.duration || 0
      }))
    })),
    coverage: jestResults.coverageMap || null
  };

  // Percorsi per il salvataggio
  const outputDir = path.join(__dirname, '..', 'Output');
  const outputFile = path.join(outputDir, 'backend-unitari-results.json');
  
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
  console.error('❌ Errore durante la generazione del report:', error);
  process.exit(1);
} 