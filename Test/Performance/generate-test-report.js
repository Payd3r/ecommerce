const fs = require('fs');
const path = require('path');

// Performance test report generator
try {
  console.log('Generating performance test report...');
  
  const jestResultsPath = path.join(__dirname, '.jest-results.json');
  
  if (!fs.existsSync(jestResultsPath)) {
    console.error(`Jest results file not found: ${jestResultsPath}`);
    process.exit(1);
  }
  
  const jestResults = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
  
  // Parse performance metrics from test output
  const performanceMetrics = extractPerformanceMetrics(jestResults);
  
  const testResults = {
    testType: 'performance',
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
    performanceMetrics: performanceMetrics,
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

  // Save report
  const outputDir = path.join(__dirname, '..', 'Output');
  const outputFile = path.join(outputDir, 'performance-results.json');
  
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    } catch (err) {
      console.warn(`Failed to create output directory: ${err.message}`);
    }
  }
  
  try {
    fs.writeFileSync(outputFile, JSON.stringify(testResults, null, 2));
    console.log(`Performance report generated: ${outputFile}`);
    console.log(`Test Summary: ${testResults.summary.numPassedTests}/${testResults.summary.numTotalTests} passed`);
    
    // Performance summary
    if (performanceMetrics.summary) {
      console.log('Performance Summary:');
      console.log(`  Avg Response Time: ${performanceMetrics.summary.avgResponseTime}ms`);
      console.log(`  Max Response Time: ${performanceMetrics.summary.maxResponseTime}ms`);
      console.log(`  Error Rate: ${performanceMetrics.summary.errorRate}%`);
      console.log(`  Throughput: ${performanceMetrics.summary.throughput} req/sec`);
    }
    
    // File permissions
    try {
      fs.chmodSync(outputFile, 0o666);
    } catch (chmodErr) {
      console.warn(`Failed to set file permissions: ${chmodErr.message}`);
    }
  } catch (err) {
    console.error(`Failed to save report: ${err.message}`);
    process.exit(1);
  }
  
} catch (error) {
  console.error('Report generation failed:', error);
  process.exit(1);
}

// Extract performance metrics from Jest output
function extractPerformanceMetrics(jestResults) {
  const metrics = {
    responseTimes: [],
    errorRates: [],
    throughput: [],
    summary: {}
  };
  
  try {
    // Parse console output for performance stats
    jestResults.testResults?.forEach(testResult => {
      testResult.assertionResults?.forEach(assertion => {
        const output = assertion.failureMessages?.join('\n') || '';
        
        // Extract stats from console.log outputs in tests
        const statsRegex = /Stats:\s*{[^}]+}/g;
        const statMatches = output.match(statsRegex);
        
        if (statMatches) {
          statMatches.forEach(match => {
            try {
              const statsStr = match.replace('Stats:', '').trim();
              const stats = JSON.parse(statsStr);
              
              if (stats.avgResponseTime) metrics.responseTimes.push(stats.avgResponseTime);
              if (stats.errorRate !== undefined) metrics.errorRates.push(stats.errorRate);
              if (stats.successful && stats.avgResponseTime) {
                const throughput = stats.successful / (stats.avgResponseTime / 1000);
                metrics.throughput.push(throughput);
              }
            } catch (e) {
              // Skip malformed stats
            }
          });
        }
      });
    });
    
    // Calculate summary metrics
    if (metrics.responseTimes.length > 0) {
      metrics.summary.avgResponseTime = Math.round(
        metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      );
      metrics.summary.maxResponseTime = Math.round(Math.max(...metrics.responseTimes));
      metrics.summary.minResponseTime = Math.round(Math.min(...metrics.responseTimes));
    }
    
    if (metrics.errorRates.length > 0) {
      metrics.summary.errorRate = Number((
        metrics.errorRates.reduce((a, b) => a + b, 0) / metrics.errorRates.length
      ).toFixed(2));
    }
    
    if (metrics.throughput.length > 0) {
      metrics.summary.throughput = Number((
        metrics.throughput.reduce((a, b) => a + b, 0) / metrics.throughput.length
      ).toFixed(2));
    }
    
  } catch (error) {
    console.warn('Failed to extract performance metrics:', error.message);
  }
  
  return metrics;
} 