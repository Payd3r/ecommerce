const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, aggregatedResults) {
    const { testResults, numTotalTests, numPassedTests, numFailedTests, numPendingTests, success, startTime } = aggregatedResults;
    
    const results = {
      testType: 'backend-integrativi',
      timestamp: new Date().toISOString(),
      summary: {
        numTotalTests,
        numPassedTests,
        numFailedTests,
        numPendingTests,
        numSkippedTests: numTotalTests - numPassedTests - numFailedTests - numPendingTests,
        success,
        duration: Date.now() - startTime
      },
      testResults: testResults.map(result => ({
        name: result.testFilePath.split('/').pop(),
        status: result.numFailingTests === 0 ? 'passed' : 'failed',
        message: result.failureMessage || '',
        duration: result.perfStats.end - result.perfStats.start,
        numFailingTests: result.numFailingTests,
        numPassingTests: result.numPassingTests,
        numPendingTests: result.numPendingTests,
        assertionResults: result.testResults.map(test => ({
          title: test.title,
          status: test.status,
          failureMessages: test.failureMessages || [],
          duration: test.duration || 0
        }))
      }))
    };

    // Scrivi direttamente il file JSON
    try {
      const outputDir = path.join(__dirname, '..', 'Output');
      const outputFile = path.join(outputDir, 'backend-integrativi-results.json');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log(`\n✅ Report JSON generato dal custom reporter: ${outputFile}`);
      console.log(`📊 Test Summary (Reporter): ${results.summary.numPassedTests}/${results.summary.numTotalTests} passed`);
    } catch (error) {
      console.error('❌ Errore nel custom reporter:', error.message);
    }

    // Salva anche in una variabile globale per il generate-test-report.js
    global.jestResults = results;
  }
}

module.exports = CustomReporter; 