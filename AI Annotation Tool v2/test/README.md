# Tests - AI Annotation Tool v2

This directory contains the test suite for the AI Annotation Tool v2, built with Mocha and Chai.

## Structure

```
test/
├── database.test.js           # Comprehensive database tests
├── example.test.js           # Example test file
├── run-tests.js              # Test runner with database initialization
├── helpers/                  # Test utility functions
│   └── database-helper.js    # Database testing helpers
└── README.md                 # This file
```

## Running Tests

### Prerequisites

**Important**: The database must be initialized before running tests. The test runner will automatically initialize the database if it doesn't exist, but you can also initialize it manually:

```bash
# Initialize database with schema and seed data
npm run db:init
```

### All Tests
```bash
npm test
```

### Database Tests Only
```bash
npm run test:db
```

### Watch Mode (re-run tests on file changes)
```bash
npm run test:watch
```

### Direct Mocha (without database initialization)
```bash
# Note: This bypasses automatic database initialization
# Ensure database exists before running
npx mocha test/**/*.test.js --timeout 10000
```

### Manual Database Management

```bash
# Initialize database
npm run db:init

# Reset database (removes existing data)
npm run db:reset

# Hard reset (removes database file and recreates)
npm run db:hardreset
```

## Test Features

### Database Tests (`database.test.js`)

The database test suite includes comprehensive coverage of:

- **Connection Testing**: Verifies database connectivity and table existence
- **CRUD Operations**: Tests Create, Read, Update, Delete operations for all tables
- **Data Integrity**: Validates foreign key constraints and data consistency
- **Schema Validation**: Ensures proper indexes and constraints are in place
- **Complex Queries**: Tests joins, aggregations, and advanced SQL operations
- **Error Handling**: Validates constraint violations and error conditions
- **Performance**: Verifies proper indexing for query optimization

### Test Categories

1. **Database Connection**
   - Connection establishment
   - Table existence verification
   - Foreign key constraint validation

2. **Images Table**
   - Image record insertion and retrieval
   - Unique filename constraint testing
   - File metadata validation

3. **Labels Table**
   - Label creation and management
   - Unique label name constraint testing
   - Sample data verification

4. **Annotations Table**
   - Annotation creation with confidence scores
   - Many-to-many relationship testing
   - Cascade delete verification
   - Confidence range validation

5. **Database Indexes**
   - Performance index verification
   - Query optimization testing

6. **Complex Queries**
   - Images with labels aggregation
   - Label usage statistics
   - Search functionality

7. **Data Integrity**
   - Referential integrity validation
   - Data type consistency checks

## Test Configuration

- **Timeout**: 10 seconds for database operations
- **Test Database**: Uses a separate test database copy to avoid affecting production data
- **Cleanup**: Automatic cleanup of test data after each test suite
- **Isolation**: Each test is independent and doesn't affect others

## Test Helpers

The `helpers/database-helper.js` provides utility functions:

- `cleanupTestData()`: Removes test records from database
- `getDatabaseStats()`: Returns record counts for verification
- `createSampleTestData()`: Creates sample data for testing
- `verifySchemaIntegrity()`: Validates database schema completeness

## Writing New Tests

When adding new tests:

1. Use descriptive test names that explain what is being tested
2. Include both positive and negative test cases
3. Clean up any test data created during the test
4. Use the test helpers for common operations
5. Follow the existing test structure and patterns

### Example Test Structure

```javascript
describe('Feature Name', function() {
  let testDataId;

  before(async function() {
    // Setup code
  });

  it('should perform expected behavior', async function() {
    // Test implementation
    const result = await someOperation();
    expect(result).to.have.property('expectedProperty');
  });

  after(async function() {
    // Cleanup code
    if (testDataId) {
      await cleanup(testDataId);
    }
  });
});
```

## Dependencies

- **Mocha**: Test framework
- **Chai**: Assertion library
- **sqlite3**: Database driver for testing

## Continuous Integration

The test suite is designed to work in CI environments:

- Automatic database initialization
- Self-contained test database
- Proper cleanup and teardown
- Exit codes for CI integration