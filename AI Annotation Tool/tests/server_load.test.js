import autocannon from 'autocannon';

/// Load testing script using AutoCannon
/// This tests how well the API performs under concurrent requests
/// Useful for identifying performance bottlenecks and capacity limits

// Configuration for the load test
const baseUrl = 'http://localhost:3000';
const duration = 10; // Test duration in seconds
const connections = 10; // Number of concurrent connections
const pipelining = 1; // Number of pipelined requests per connection

/// Runs a load test against the images endpoint
/// This simulates multiple users fetching the list of images simultaneously
async function testGetImagesEndpoint() {
    console.log('\n========================================');
    console.log('Testing GET /API/images endpoint');
    console.log('========================================\n');

    const result = await autocannon({
        url: `${baseUrl}/API/images`,
        connections: connections,
        pipelining: pipelining,
        duration: duration,
        method: 'GET'
    });

    // Display results
    console.log('\n--- Results for GET /API/images ---');
    console.log(`Total requests: ${result.requests.total}`);
    console.log(`Average requests/sec: ${result.requests.average}`);
    console.log(`Average latency: ${result.latency.mean}ms`);
    console.log(`Max latency: ${result.latency.max}ms`);
    console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
    console.log(`Errors: ${result.errors}`);

    return result;
}

/// Runs a load test against the labels endpoint
/// Tests the performance of retrieving all labels with usage statistics
async function testGetLabelsEndpoint() {
    console.log('\n========================================');
    console.log('Testing GET /API/labels endpoint');
    console.log('========================================\n');

    const result = await autocannon({
        url: `${baseUrl}/API/labels`,
        connections: connections,
        pipelining: pipelining,
        duration: duration,
        method: 'GET'
    });

    console.log('\n--- Results for GET /API/labels ---');
    console.log(`Total requests: ${result.requests.total}`);
    console.log(`Average requests/sec: ${result.requests.average}`);
    console.log(`Average latency: ${result.latency.mean}ms`);
    console.log(`Max latency: ${result.latency.max}ms`);
    console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
    console.log(`Errors: ${result.errors}`);

    return result;
}

/// Runs a load test against the SQLite statistics endpoint
/// This tests the custom endpoint that demonstrates SQLite integration
async function testSqliteEndpoint() {
    console.log('\n========================================');
    console.log('Testing GET /SQLite/Images endpoint');
    console.log('========================================\n');

    const result = await autocannon({
        url: `${baseUrl}/SQLite/Images`,
        connections: connections,
        pipelining: pipelining,
        duration: duration,
        method: 'GET'
    });

    console.log('\n--- Results for GET /SQLite/Images ---');
    console.log(`Total requests: ${result.requests.total}`);
    console.log(`Average requests/sec: ${result.requests.average}`);
    console.log(`Average latency: ${result.latency.mean}ms`);
    console.log(`Max latency: ${result.latency.max}ms`);
    console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
    console.log(`Errors: ${result.errors}`);

    return result;
}

/// Main function that orchestrates all load tests
/// Runs tests sequentially to avoid overwhelming the server
async function runAllLoadTests() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  API Load Testing with AutoCannon    ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`\nConfiguration:`);
    console.log(`  Base URL: ${baseUrl}`);
    console.log(`  Duration: ${duration} seconds per test`);
    console.log(`  Connections: ${connections} concurrent`);
    console.log(`  Pipelining: ${pipelining} request(s) per connection`);

    try {
        // Run each test sequentially
        const imagesResult = await testGetImagesEndpoint();
        const labelsResult = await testGetLabelsEndpoint();
        const sqliteResult = await testSqliteEndpoint();

        // Summary of all tests
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║          Summary of All Tests        ║');
        console.log('╚══════════════════════════════════════╝\n');

        console.log('Endpoint Performance Comparison:');
        console.log('─────────────────────────────────────────');
        console.log(`GET /API/images:`);
        console.log(`  • ${imagesResult.requests.average.toFixed(2)} req/sec`);
        console.log(`  • ${imagesResult.latency.mean.toFixed(2)}ms avg latency`);
        console.log('');
        console.log(`GET /API/labels:`);
        console.log(`  • ${labelsResult.requests.average.toFixed(2)} req/sec`);
        console.log(`  • ${labelsResult.latency.mean.toFixed(2)}ms avg latency`);
        console.log('');
        console.log(`GET /SQLite/Images:`);
        console.log(`  • ${sqliteResult.requests.average.toFixed(2)} req/sec`);
        console.log(`  • ${sqliteResult.latency.mean.toFixed(2)}ms avg latency`);
        console.log('─────────────────────────────────────────');

        // Determine the fastest endpoint
        const results = [
            { name: 'GET /API/images', rps: imagesResult.requests.average },
            { name: 'GET /API/labels', rps: labelsResult.requests.average },
            { name: 'GET /SQLite/Images', rps: sqliteResult.requests.average }
        ];

        const fastest = results.reduce((prev, current) =>
            (current.rps > prev.rps) ? current : prev
        );

        console.log(`\n🏆 Fastest endpoint: ${fastest.name} (${fastest.rps.toFixed(2)} req/sec)`);

        console.log('\n✅ All load tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Error during load testing:', error);
        process.exit(1);
    }
}

// Execute all tests
runAllLoadTests();