#!/usr/bin/env node

/**
 * Comprehensive Test Report Generator for Phase 4
 * Runs all test suites and generates a detailed report
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testSuites = [
  { name: 'Database Core Tests', path: 'test/database.test.js' },
  { name: 'Migration Tests', path: 'database/migrations/tests/migrations.test.js' },
  { name: 'Images Data Access Tests', path: 'lib/data-access/tests/images.test.js' },
  { name: 'Labels Data Access Tests', path: 'lib/data-access/tests/labels.test.js' },
  { name: 'Database Proxy Tests', path: 'lib/database/tests/proxy.test.js' },
  { name: 'Images API Route Tests', path: 'app/api/images/tests/route.test.js' },
  { name: 'Labels API Route Tests', path: 'app/api/labels/tests/route.test.js' },
];

const results = {
  totalSuites: testSuites.length,
  passedSuites: 0,
  failedSuites: 0,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  suites: []
};

function runTest(suite) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Running: ${suite.name}`);
    console.log(`${'='.repeat(80)}\n`);

    const mocha = spawn('npx', ['mocha', suite.path, '--timeout', '10000', '--reporter', 'json'], {
      shell: true,
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    mocha.stdout.on('data', (data) => {
      output += data.toString();
    });

    mocha.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mocha.on('close', (code) => {
      try {
        const jsonOutput = JSON.parse(output);
        const suiteResult = {
          name: suite.name,
          path: suite.path,
          passed: code === 0,
          tests: jsonOutput.tests.length,
          passes: jsonOutput.passes.length,
          failures: jsonOutput.failures.length,
          pending: jsonOutput.pending.length,
          duration: jsonOutput.stats.duration,
          failureDetails: jsonOutput.failures.map(f => ({
            title: f.fullTitle,
            error: f.err.message
          }))
        };

        results.suites.push(suiteResult);

        if (code === 0) {
          results.passedSuites++;
          console.log(`✓ ${suite.name}: PASSED (${suiteResult.passes}/${suiteResult.tests} tests)`);
        } else {
          results.failedSuites++;
          console.log(`✗ ${suite.name}: FAILED (${suiteResult.failures} failures)`);
        }

        results.totalTests += suiteResult.tests;
        results.passedTests += suiteResult.passes;
        results.failedTests += suiteResult.failures;

      } catch (error) {
        // If JSON parsing fails, test suite likely had errors
        const suiteResult = {
          name: suite.name,
          path: suite.path,
          passed: false,
          tests: 0,
          passes: 0,
          failures: 1,
          pending: 0,
          duration: 0,
          error: errorOutput || 'Failed to parse test output',
          failureDetails: []
        };

        results.suites.push(suiteResult);
        results.failedSuites++;
        results.totalTests += 1;
        results.failedTests += 1;

        console.log(`✗ ${suite.name}: ERROR`);
        console.log(`   ${errorOutput.slice(0, 200)}...`);
      }

      resolve();
    });
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('AI ANNOTATION TOOL V2 - PHASE 4 TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Starting test run at: ${new Date().toISOString()}`);

  // Ensure database is initialized
  console.log('\nInitializing databases...');
  const { initializeDatabase } = require('./database/init');
  try {
    initializeDatabase();
    console.log('✓ Main database initialized');
  } catch (error) {
    console.log('✓ Main database already exists');
  }

  // Run all test suites sequentially
  for (const suite of testSuites) {
    await runTest(suite);
  }

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Test Suites: ${results.totalSuites}`);
  console.log(`  ✓ Passed: ${results.passedSuites}`);
  console.log(`  ✗ Failed: ${results.failedSuites}`);
  console.log('');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`  ✓ Passed: ${results.passedTests}`);
  console.log(`  ✗ Failed: ${results.failedTests}`);
  console.log('');

  // Detailed failure report
  if (results.failedTests > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('FAILED TESTS DETAILS');
    console.log('='.repeat(80));

    results.suites.forEach(suite => {
      if (!suite.passed) {
        console.log(`\n${suite.name} (${suite.path})`);
        console.log('-'.repeat(80));

        if (suite.error) {
          console.log(`Error: ${suite.error}`);
        } else {
          suite.failureDetails.forEach((failure, idx) => {
            console.log(`  ${idx + 1}. ${failure.title}`);
            console.log(`     Error: ${failure.error}`);
          });
        }
      }
    });
  }

  // Success/failure determination
  console.log('\n' + '='.repeat(80));
  if (results.failedTests === 0) {
    console.log('✓ ALL TESTS PASSED!');
    console.log('Phase 4 implementation is working correctly.');
  } else {
    console.log('✗ SOME TESTS FAILED');
    console.log(`${results.failedTests} test(s) need attention.`);
  }
  console.log('='.repeat(80));

  // Save results to JSON file
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nDetailed results saved to: test-results.json');

  // Exit with appropriate code
  process.exit(results.failedTests > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
