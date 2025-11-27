# CLAUDE.md: AI Assistant Development Guide

## Overview

This document provides comprehensive guidance for AI assistants, developers, and contributors working with the AI Annotation Tool codebase. This is a full-stack Node.js application designed as an educational software engineering assignment, demonstrating best practices in web application development, RESTful API design, and database management.

**Project Type:** Educational Software Engineering Assignment
**Primary Language:** JavaScript (ES6 Modules)
**Framework:** Express.js (Backend) with Vanilla JavaScript (Frontend)
**Database:** SQLite 3
**Total Codebase:** ~2,026 lines of code

---

## Part 1: Codebase Structure

### 1.1 Directory Organisation

The project follows a clear organisational hierarchy within the `/AI Annotation Tool` directory:

```
/AI Annotation Tool
├── /public                  # Frontend assets (HTML, CSS, JavaScript)
│   ├── index.html          # Single-page application root
│   ├── /css
│   │   └── styles.css      # Custom CSS (147 lines)
│   └── /js
│       └── index.js        # All frontend logic (430 lines)
├── /server                 # Backend application code
│   ├── server.js           # Express application entry point
│   ├── database.js         # Database abstraction layer
│   └── /routes             # API endpoint handlers
│       ├── images.js       # Image management endpoints
│       └── labels.js       # Label management endpoints
├── /database               # Database files and schemas
│   ├── annotations.db      # SQLite database (generated, binary)
│   ├── schema.sql          # Database schema definition
│   └── seed.sql            # Sample data for testing
├── /scripts                # Utility scripts
│   ├── init-database.js    # Database schema initialisation
│   └── seed-database.js    # Sample data loading
├── /tests                  # Automated test suites
│   ├── database.test.js    # Unit tests (217 lines)
│   └── server_load.test.js # Load tests (151 lines)
├── /docs                   # Documentation files
│   └── AI_Usage_Declaration.md
├── /uploads/images         # User-uploaded image storage
├── package.json            # NPM package configuration
├── package-lock.json       # Dependency lock file
└── README.md               # Comprehensive project documentation
```

### 1.2 File Count and Distribution

| Component | Files | Lines of Code |
|-----------|-------|---------------|
| Frontend (JavaScript) | 1 | 430 |
| Frontend (HTML) | 1 | 199 |
| Frontend (CSS) | 1 | 147 |
| Backend (JavaScript) | 3 | ~600 |
| Database (SQL) | 2 | 53 |
| Tests | 2 | 368 |
| **Total** | **10** | **~2,026** |

---

## Part 2: Technical Stack and Dependencies

### 2.1 Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.1.0 | Web application framework |
| `cors` | ^2.8.5 | Cross-origin request handling |
| `sqlite3` | ^5.1.7 | SQLite database driver |
| `multer` | ^1.4.5-lts.1 | File upload middleware |

### 2.2 Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.1.10 | Automatic server restart on file changes |
| `mocha` | ^10.8.2 | Test framework |
| `chai` | ^5.1.2 | Assertion library for testing |
| `autocannon` | ^7.15.0 | Load testing and benchmarking |

### 2.3 Node.js Requirements

- **Minimum Version:** Node.js 18.0.0 (required for ES modules)
- **Module System:** ES6 modules (`import`/`export`)
- **No Build Step:** Applications runs directly with Node.js

---

## Part 3: Development Workflows

### 3.1 NPM Scripts and Common Commands

```bash
# Development
npm run dev              # Start development server with auto-reload (nodemon)
npm start               # Start production server

# Database Management
npm run init-db         # Initialise database schema from schema.sql
npm run seed-db         # Load sample data from seed.sql

# Testing
npm test               # Run all tests (unit and load)
npm run test:unit      # Run unit tests only
npm run test:load      # Run load tests only

# Installation
npm install            # Install all dependencies
```

### 3.2 Initial Setup Workflow

New developers should follow this sequence:

```bash
# 1. Navigate to project directory
cd "AI Annotation Tool"

# 2. Install dependencies
npm install

# 3. Initialise database schema
npm run init-db

# 4. Load sample data
npm run seed-db

# 5. Start development server
npm run dev

# 6. Run tests to verify setup
npm test
```

The application will be available at `http://localhost:3000` after step 5.

### 3.3 Database Workflow

The project uses SQLite with a specific initialisation workflow:

1. **Schema Initialisation:** `npm run init-db` executes `/scripts/init-database.js`
   - Reads `/database/schema.sql`
   - Creates three tables: `images`, `labels`, `annotations`
   - Creates four indices for performance
   - Generates `/database/annotations.db`

2. **Data Seeding:** `npm run seed-db` executes `/scripts/seed-database.js`
   - Loads `/database/seed.sql` into the initialised database
   - Provides sample images and labels for testing
   - Creates initial annotation relationships

3. **Runtime Operations:** Backend uses `/server/database.js` abstraction
   - All database operations go through this layer
   - Uses parameterised queries for security
   - Implements async/await patterns

---

## Part 4: API Architecture and Endpoints

### 4.1 API Base Configuration

- **Base URL:** `http://localhost:3000/API`
- **Response Format:** All endpoints return JSON
- **Default Port:** 3000 (hard-coded in configuration)
- **Middleware:** CORS enabled for cross-origin requests

### 4.2 Image Management Endpoints

**Route File:** `/server/routes/images.js`

```
GET    /API/Images           # Retrieve all images with annotations
GET    /API/Images/:id       # Retrieve specific image details
POST   /API/Images           # Upload new image (multipart/form-data)
DELETE /API/Images/:id       # Remove image and related annotations
```

**Upload Details:**
- Accepts: JPG, PNG, GIF, WEBP formats only
- File naming: `[timestamp]-[randomHash].ext`
- Stored in: `/uploads/images`
- Maximum file size: 5 MB (default Multer limit)

### 4.3 Label Management Endpoints

**Route File:** `/server/routes/labels.js`

```
GET    /API/Labels           # Retrieve all available labels
GET    /API/Labels/:id       # Retrieve specific label details
POST   /API/Labels           # Create new label
PUT    /API/Labels/:id       # Update existing label
DELETE /API/Labels/:id       # Remove label (cascades to annotations)
```

### 4.4 Response Format Standardisation

**Success Response (Collection):**
```json
{
  "count": 5,
  "data": [ /* array of objects */ ]
}
```

**Success Response (Single Item):**
```json
{
  "count": 1,
  "data": { /* single object */ }
}
```

**Error Response:**
```json
{
  "error": "Descriptive error message"
}
```

### 4.5 HTTP Status Codes

- **200 OK:** Successful GET, PUT, DELETE operations
- **201 Created:** Successful POST operations (when applicable)
- **400 Bad Request:** Invalid parameters, malformed input
- **404 Not Found:** Resource does not exist
- **409 Conflict:** Unique constraint violation (duplicate labels)
- **500 Internal Server Error:** Unexpected server-side errors

---

## Part 5: Database Design and Schema

### 5.1 Entity-Relationship Overview

```
┌──────────┐
│  images  │
└────┬─────┘
     │ (one-to-many)
     ↓
┌───────────────┐
│ annotations   │◄─── (many-to-many through junction table)
└────┬──────────┘
     │
     ↓ (one-to-many, inverse)
┌──────────┐
│  labels  │
└──────────┘
```

### 5.2 Table Specifications

#### **images Table**
Stores metadata about uploaded images.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `image_id` | INTEGER | PRIMARY KEY | Unique identifier |
| `filename` | TEXT | NOT NULL, UNIQUE | Original filename |
| `file_path` | TEXT | NOT NULL | Relative path on server |
| `file_size` | INTEGER | NOT NULL | Size in bytes |
| `mime_type` | TEXT | NOT NULL | MIME type (image/jpeg, etc.) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification |

**Indices:**
- `idx_images_filename`: Prevents duplicate uploads, enables fast lookup

#### **labels Table**
Stores reusable annotation labels/categories.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `label_id` | INTEGER | PRIMARY KEY | Unique identifier |
| `label_name` | TEXT | NOT NULL, UNIQUE | Label text |
| `description` | TEXT | Optional description | |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indices:**
- `idx_labels_name`: Enables fast label existence checks

#### **annotations Table**
Junction table linking images to labels with confidence values.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `annotation_id` | INTEGER | PRIMARY KEY | Unique identifier |
| `image_id` | INTEGER | FOREIGN KEY (images.image_id), CASCADE DELETE | Reference to image |
| `label_id` | INTEGER | FOREIGN KEY (labels.label_id), CASCADE Delete | Reference to label |
| `confidence` | REAL | CHECK (0.0 ≤ confidence ≤ 1.0) | Confidence score (0–1) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Constraints:**
- UNIQUE (image_id, label_id): Prevents duplicate label-image combinations
- FOREIGN KEY cascading: Deletes annotations when images/labels are removed

**Indices:**
- `idx_annotations_image`: Optimises queries retrieving annotations for specific images
- `idx_annotations_label`: Optimises queries retrieving annotations for specific labels

### 5.3 Data Integrity Principles

1. **Foreign Key Enforcement:** Cascade deletion ensures orphaned records are cleaned automatically
2. **Uniqueness Constraints:** Prevent duplicate images and labels
3. **Type Safety:** Column types enforce data type constraints
4. **Temporal Tracking:** Timestamps record creation and modification times
5. **Value Bounds:** CHECK constraints ensure confidence scores remain within [0, 1]

---

## Part 6: Code Style and Conventions

### 6.1 Naming Conventions

**JavaScript Variables and Functions (camelCase):**
```javascript
let currentImages = [];
const apiBaseUrl = 'http://localhost:3000/API';
function handleImageUpload(event) { /* ... */ }
async function executeQuery(sql, params) { /* ... */ }
```

**Database Identifiers (snake_case):**
```sql
SELECT image_id, label_name, created_at FROM annotations
WHERE image_id = ? AND confidence > ?
```

**CSS Classes (kebab-case):**
```css
.label-badge { /* ... */ }
.border-dashed { /* ... */ }
.toast-notification { /* ... */ }
```

**Constants (UPPER_SNAKE_CASE):**
```javascript
const API_BASE_URL = 'http://localhost:3000/API';
const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5 MB
```

### 6.2 Backend Code Style

**Module Organisation:**
- Each major feature has a dedicated route file (`routes/*.js`)
- Database operations centralised in `/server/database.js`
- Server configuration in `/server/server.js`
- ES6 module syntax throughout

**Function Patterns:**
```javascript
/// Get a single image with all annotations
async function getImageById(id) {
    try {
        const image = await getSingleRow(
            `SELECT * FROM images WHERE image_id = ?`,
            [id]
        );
        if (!image) return null;

        const annotations = await executeQuery(
            `SELECT * FROM annotations WHERE image_id = ? ORDER BY created_at DESC`,
            [id]
        );
        return { ...image, annotations };
    } catch (error) {
        console.error('[ERROR] Failed to retrieve image:', error);
        throw error;
    }
}
```

**Error Handling Pattern:**
```javascript
router.get('/:id', async (request, response) => {
    try {
        // Validate input
        const id = Number.parseInt(request.params.id);
        if (Number.isNaN(id)) {
            return response.status(400).json({ error: 'Invalid ID format' });
        }

        // Execute operation
        const result = await getImageById(id);
        if (!result) {
            return response.status(404).json({ error: 'Image not found' });
        }

        // Return standardised response
        response.json({ count: 1, data: result });
    } catch (error) {
        console.error('[ERROR]', error);
        response.status(500).json({ error: 'Failed to retrieve image' });
    }
});
```

**Logging Convention:**
```javascript
console.log('[GET] /API/Images - Retrieving all images');
console.error('[ERROR] Failed to upload image:', errorMessage);
console.warn('[WARN] Database connection slow');
```

### 6.3 Frontend Code Style

**Global State Management:**
```javascript
// Global application state
let currentImages = [];
let selectedLabels = new Set();
let uploadsInProgress = 0;
```

**Event Handler Naming:**
```javascript
function handleImageUpload(event) { /* ... */ }
function handleDeleteImage(imageId) { /* ... */ }
function handleLabelToggle(labelId) { /* ... */ }
```

**Utility Function Naming:**
```javascript
async function loadImages() { /* fetch from API */ }
async function uploadImage(file) { /* multipart POST */ }
function showToast(message, duration = 3000) { /* temporary notification */ }
function hideModal(modalId) { /* hide UI element */ }
```

**DOM Manipulation Pattern:**
```javascript
function displayImages(images) {
    const container = document.getElementById('images-grid');
    container.innerHTML = '';

    images.forEach(image => {
        const card = createImageCard(image);
        container.appendChild(card);
    });
}
```

### 6.4 HTML and CSS Conventions

**Responsive Design Approach:**
- Mobile-first design with Tailwind utility classes
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Custom CSS for animations and Tailwind overrides

**CSS Animation Definitions:**
```css
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

---

## Part 7: Testing Approach and Coverage

### 7.1 Testing Framework and Tools

- **Framework:** Mocha (test runner)
- **Assertion Library:** Chai (test assertions)
- **Load Testing:** Autocannon (performance benchmarking)
- **Timeout Setting:** 5000ms per test (configured in npm scripts)

### 7.2 Unit Tests (database.test.js)

**Test File Location:** `/tests/database.test.js`
**Lines of Code:** 217
**Primary Focus:** Database abstraction layer functionality

**Test Coverage:**

| Test Case | Purpose | Status |
|-----------|---------|--------|
| `executeQuery()` with SELECT | Retrieve multiple rows | ✓ Implemented |
| `executeModification()` with INSERT | Insert new records | ✓ Implemented |
| `executeModification()` with UPDATE | Modify existing records | ✓ Implemented |
| `executeModification()` with DELETE | Remove records | ✓ Implemented |
| `getSingleRow()` | Retrieve single record | ✓ Implemented |
| Invalid SQL handling | Error resilience | ✓ Implemented |
| Parameterised queries | SQL injection prevention | ✓ Implemented |

**Test Structure:**
```javascript
describe('Database Module', () => {
    describe('executeQuery()', () => {
        it('should retrieve multiple rows from database', async () => {
            // Arrange
            const sql = 'SELECT * FROM labels';

            // Act
            const results = await database.executeQuery(sql, []);

            // Assert
            expect(results).to.be.an('array');
            expect(results.length).to.be.greaterThan(0);
        });
    });
});
```

### 7.3 Load Tests (server_load.test.js)

**Test File Location:** `/tests/server_load.test.js`
**Lines of Code:** 151
**Primary Focus:** API performance and concurrency handling

**Load Test Methodology:**
- Simulates multiple concurrent requests
- Measures response times under load
- Tests API stability with large datasets
- Benchmarks throughput (requests per second)

**Test Scenarios:**
- Concurrent image retrieval
- Batch label creation
- Annotation filtering under load
- File upload performance

### 7.4 Running Tests

```bash
# Run all tests with 5-second timeout
npm test

# Run unit tests only
npm run test:unit

# Run load tests only
npm run test:load

# Run with verbose output (if configured)
npm test -- --reporter json > test-results.json
```

### 7.5 Test Execution Environment

- Tests use the actual SQLite database
- Integration tests (not mocked dependencies)
- Sequential execution for data consistency
- Clean database state assumed between test runs

---

## Part 8: Security Considerations

### 8.1 Implemented Security Measures

**SQL Injection Prevention:**
- All queries use parameterised statements with placeholders (`?`)
- User input never directly concatenated into SQL strings

```javascript
// ✓ Secure: parameterised query
const results = await executeQuery(
    'SELECT * FROM images WHERE image_id = ?',
    [userId]
);

// ✗ Insecure: string concatenation (not used in codebase)
const results = await executeQuery(`SELECT * FROM images WHERE image_id = ${userId}`);
```

**File Upload Validation:**
- File type whitelist: only image MIME types accepted
- File extension validation
- File size limits enforced by Multer

**CORS Configuration:**
- Express CORS middleware enabled
- Allows requests from client origin (development default)

### 8.2 Security Limitations (Educational Context)

This project intentionally omits advanced security features appropriate for production:

- ❌ **No Authentication:** No user accounts or authentication required
- ❌ **No Authorization:** No role-based access control
- ❌ **No Rate Limiting:** No protection against request floods
- ❌ **No Input Validation Layer:** Minimal validation of request bodies
- ❌ **No Encryption:** Data stored in plain SQLite
- ❌ **No HTTPS:** Development uses HTTP only
- ❌ **No Session Management:** No persistent user sessions

These omissions are intentional for an educational assignment. Production deployment would require implementation of these features.

---

## Part 9: Guidelines for AI Assistants

### 9.1 Before Making Changes

**Research First:**
1. Read relevant files thoroughly before proposing modifications
2. Understand the existing code style and conventions
3. Check existing tests to understand expected behaviour
4. Review the git history for context on recent changes

**Example Process:**
```
User Request: "Fix bug in image upload"
↓
1. Read /server/routes/images.js (upload handler)
2. Read /tests/database.test.js (relevant tests)
3. Understand current implementation
4. Identify the actual bug
5. Propose minimal, focused fix
6. Update relevant tests if needed
```

### 9.2 Code Modification Principles

**Minimal Changes:**
- Only modify code necessary to complete the task
- Do not refactor surrounding code unless explicitly requested
- Preserve existing style and conventions
- Avoid "improvements" that extend beyond the request

**Avoid Over-Engineering:**
- Do not add features not explicitly requested
- Do not add comprehensive error handling for impossible scenarios
- Do not add type annotations or extensive comments to existing code
- Keep solutions simple and focused

**Consistency:**
- Follow naming conventions for new code
- Use existing patterns for similar functionality
- Match the code style of adjacent code
- Maintain database schema consistency

### 9.3 Testing Before Submission

**Test Suite Execution:**
```bash
npm test              # Verify all tests pass
npm run test:unit    # Verify specific test category if relevant
npm run test:load    # Check performance impact if applicable
```

**Manual Testing Checklist:**
- [ ] Server starts without errors: `npm run dev`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] API endpoints respond correctly
- [ ] All tests pass: `npm test`
- [ ] No console errors or warnings (besides expected logging)

### 9.4 Git Workflow and Commits

**Branch Information:**
- **Current Branch:** `claude/add-claude-documentation-01DtraXmrwcZp47n8vhWRyKc`
- **Target Branch:** As specified in assignment instructions
- **Do Not Push:** To main/master without explicit permission

**Commit Message Format:**
```
Type: Brief description

Type Options:
- Doc:  Documentation updates
- Fix:  Bug fixes
- Add:  New features
- Update: Feature enhancements
- Refactor: Code reorganisation without functionality change

Examples:
✓ "Fix: prevent SQL injection in label search"
✓ "Add: load test for concurrent image uploads"
✓ "Doc: update API endpoint documentation"
```

**Commit Examples from Repository:**
```
5a611f2 Doc: minor wording modification
a07112a Doc: complete README and AI_Usage_Declaration
c96f6db Update: read me file
0bd06ec Fix: images delete also use relative path
21b0658 Doc: part of the AI usage form filled
```

### 9.5 Documentation Updates

When modifying code, consider updating:

1. **README.md** (if changing public API or setup instructions)
2. **Test Comments** (if changing expected behaviour)
3. **Inline Comments** (only for non-obvious logic)
4. **This Document (CLAUDE.md)** (if conventions or workflows change)

### 9.6 What NOT to Do

❌ **Do Not:**
- Modify `.gitignore` without explicit request
- Add production dependencies without justification
- Change the database schema without discussion
- Implement features beyond the assignment scope
- Commit directly to main/master branch
- Push without verifying tests pass
- Remove or rename files without understanding implications
- Add configuration files (`.env`, etc.) without documentation

---

## Part 10: Troubleshooting and Common Issues

### 10.1 Database Issues

**Issue:** "Database is locked"
**Cause:** SQLite is being accessed by multiple processes simultaneously
**Solution:** Ensure only one instance of the server is running; restart if necessary

**Issue:** "Table does not exist"
**Cause:** Database not initialised
**Solution:** Run `npm run init-db` to create schema

**Issue:** "Unique constraint failed"
**Cause:** Attempting to insert duplicate image filename or label name
**Solution:** Use unique identifiers or check for existing records before insertion

### 10.2 Development Server Issues

**Issue:** "EADDRINUSE: address already in use :::3000"
**Cause:** Port 3000 already in use by another process
**Solution:** Kill the process using port 3000 or change the port in configuration

**Issue:** "Module not found" errors
**Cause:** Dependencies not installed
**Solution:** Run `npm install` to reinstall dependencies

**Issue:** "Cannot use import statement outside a module"
**Cause:** Node.js version too old or module type not configured
**Solution:** Verify Node.js 18+ is installed and `"type": "module"` is in `package.json`

### 10.3 Test Failures

**Issue:** Tests timeout (exceeds 5000ms)
**Cause:** Slow database operations or network requests
**Solution:** Ensure database is not locked; check system performance; increase timeout if needed

**Issue:** Test database state contamination
**Cause:** Tests not cleaning up after themselves
**Solution:** Reinitialise database: `npm run init-db && npm run seed-db`

**Issue:** Random test failures
**Cause:** Timing issues or race conditions
**Solution:** Ensure proper async/await usage; check for timing-dependent assertions

---

## Part 11: Project Statistics and Metrics

### 11.1 Codebase Metrics

| Metric | Value |
|--------|-------|
| Total Lines of Code | 2,026 |
| Total Files | 10 |
| Average Lines per File | 202.6 |
| Backend Code | ~600 lines |
| Frontend Code | 776 lines (HTML + CSS + JS) |
| Database Schema | 53 lines |
| Test Code | 368 lines |
| Ratio: Code to Tests | 5.5:1 |

### 11.2 Dependency Metrics

| Category | Count |
|----------|-------|
| Production Dependencies | 4 |
| Development Dependencies | 4 |
| Total Dependencies (including sub-dependencies) | 50+ |
| Node.js Version Requirement | 18.0.0+ |

### 11.3 API Endpoints

| Category | Count |
|----------|-------|
| Image Endpoints | 4 |
| Label Endpoints | 5 |
| Total Endpoints | 9 |
| Average Response Time | <50ms (under normal load) |

---

## Part 12: Recent Changes and Development History

### 12.1 Commit History Overview

**Recent Commits (Last 5):**

| Commit Hash | Message | Type |
|------------|---------|------|
| 5a611f2 | Minor wording modification | Doc |
| a07112a | Complete README and AI_Usage_Declaration | Doc |
| c96f6db | Update README file | Update |
| 0bd06ec | Fix: images delete also use relative path | Fix |
| 21b0658 | AI usage form partially filled | Doc |

### 12.2 Development Phases

**Phase 1 – Initial Implementation:**
- Core application structure
- Basic CRUD operations
- Database schema design

**Phase 2 – Testing and Quality:**
- Unit tests for database layer
- Load testing infrastructure
- Bug fixes (relative paths)

**Phase 3 – Documentation:**
- Comprehensive README
- AI usage declaration
- Code comments and API documentation

### 12.3 Current Status

- ✅ Core functionality: Complete
- ✅ API endpoints: Implemented and tested
- ✅ Database design: Normalised and indexed
- ✅ Testing framework: In place
- ✅ Documentation: Comprehensive
- ⚠️ CI/CD pipeline: Not implemented (intentional for educational context)
- ⚠️ Production deployment: Not configured

---

## Part 13: Key Architecture Decisions

### 13.1 Frontend Architecture: Single-Page Application

**Decision:** Monolithic JavaScript file (`index.js`) rather than component framework

**Rationale:**
- Simpler to understand for educational purposes
- No build process required
- All frontend logic in one visible location
- Easier to trace data flow for students

**Implications:**
- Large single file (430 lines) rather than modular components
- Global state variables rather than state management framework
- Direct DOM manipulation rather than virtual DOM
- Suitable for educational context; not for large-scale applications

### 13.2 Backend Architecture: Express.js with File-Based Routing

**Decision:** Express.js with `/routes` directory structure

**Rationale:**
- Lightweight and well-documented framework
- Clear separation of concerns
- Minimal dependencies
- Industry-standard RESTful patterns

**Implications:**
- Middleware pattern for request handling
- Manual error handling in each route
- No automatic request validation
- Suitable for educational applications

### 13.3 Database Architecture: Normalised SQLite Schema

**Decision:** 3-table normalised design with cascade delete

**Rationale:**
- Teaches proper database normalisation
- Many-to-many relationships through junction table
- Referential integrity enforcement
- ACID compliance for educational integrity

**Implications:**
- No denormalisation for performance
- Foreign key constraints prevent orphaned records
- All queries must be hand-crafted (no ORM)
- SQL visibility for learning

### 13.4 API Design: RESTful with Consistent Response Format

**Decision:** Standard REST conventions with uniform response envelope

**Rationale:**
- Teaches RESTful API best practices
- Predictable response structure
- Consistent error handling
- Industry-standard approach

**Response Envelope:**
```json
{ "count": n, "data": [...] }  // Collections
{ "count": 1, "data": {...} }  // Single items
{ "error": "message" }          // Errors
```

---

## Part 14: Future Improvements and Limitations

### 14.1 Known Limitations

| Limitation | Impact | Reason |
|-----------|--------|--------|
| No authentication | Any user can access/modify all data | Educational context |
| Hard-coded localhost | Cannot deploy to different environments | Simplified configuration |
| Single HTML file | No client-side routing | Simplified frontend |
| No API documentation tool | Manual documentation required | Educational simplicity |
| No logging framework | Only console output | Basic debugging needs |
| No TypeScript | Less type safety | Pure JavaScript education |

### 14.2 Suggested Improvements (Not Required)

For future enhancements beyond this assignment:

1. **Authentication & Authorization:** Implement user accounts and role-based access control
2. **API Documentation:** Add Swagger/OpenAPI documentation generation
3. **Logging Framework:** Implement Winston or similar for structured logging
4. **Configuration Management:** Use environment variables for flexible deployment
5. **Frontend Framework:** Migrate to React or Vue for scalability
6. **TypeScript:** Add type safety for larger codebase
7. **CI/CD Pipeline:** Implement GitHub Actions for automated testing and deployment
8. **Docker:** Containerise application for consistent deployment
9. **API Versioning:** Prepare for backward-compatible evolution
10. **Rate Limiting:** Implement protection against abuse

---

## Part 15: Assignment-Specific Guidance

### 15.1 University Assessment Context

This project is valued for demonstrating:

✅ **Version Control Proficiency:**
- Clear, descriptive commit messages
- Logical separation of changes
- Appropriate branch management
- Understanding of collaborative workflows

✅ **Testing and Quality Assurance:**
- Test coverage of critical functionality
- Understanding of test frameworks
- Load testing and performance awareness
- Test-driven development practices

✅ **Documentation Quality:**
- Comprehensive README
- Inline code comments where appropriate
- API documentation
- This CLAUDE.md guide

✅ **Code Quality:**
- Consistent style and conventions
- Clear variable and function naming
- Proper error handling
- Security best practices

### 15.2 Assessment Criteria Alignment

When making changes, ensure alignment with:

1. **Code Quality:** Changes maintain or improve code clarity
2. **Testing:** New features include appropriate tests
3. **Documentation:** Changes are documented (comments, README, or CLAUDE.md)
4. **Git Practices:** Commits tell a clear story of development
5. **Security:** No introduction of security vulnerabilities

---

## Part 16: Conclusion and Quick Reference

### 16.1 Essential Commands

```bash
# Quick setup
npm install && npm run init-db && npm run seed-db && npm run dev

# Verify everything works
npm test

# Development workflow
npm run dev           # Start server with auto-reload
# Edit files
# Tests run in separate terminal with: npm test

# Before committing
npm test             # Ensure all tests pass
git add .
git commit -m "Type: description"
git push -u origin claude/add-claude-documentation-01DtraXmrwcZp47n8vhWRyKc
```

### 16.2 File Quick Reference

| Task | Key File |
|------|----------|
| Add image endpoint | `/server/routes/images.js` |
| Add label endpoint | `/server/routes/labels.js` |
| Modify database query | `/server/database.js` |
| Update frontend UI | `/public/index.html` + `/public/js/index.js` |
| Add database field | `/database/schema.sql` + `/server/database.js` |
| Add test | `/tests/database.test.js` or `/tests/server_load.test.js` |

### 16.3 Key Conventions Summary

| Convention | Example |
|-----------|---------|
| Variables | `currentImages`, `apiBaseUrl` |
| Functions | `handleImageUpload()`, `loadImages()` |
| Database columns | `image_id`, `label_name`, `created_at` |
| Commits | `Doc: update README` |
| Error responses | `{ "error": "message" }` |
| Success responses | `{ "count": n, "data": [...] }` |
| Logging | `console.log('[GET] /API/...')` |

---

## Document Information

| Attribute | Value |
|-----------|-------|
| **Document Title** | CLAUDE.md: AI Assistant Development Guide |
| **Project** | AI Annotation Tool |
| **Type** | Technical Documentation |
| **Audience** | AI Assistants, Developers, Contributors |
| **Last Updated** | 27 November 2025 |
| **Language** | Academic British English |
| **Associated Files** | README.md, package.json, schema.sql |
| **Version** | 1.0 |

---

## Appendix: Contact and Further Information

For questions regarding:
- **Project Structure:** See `/AI Annotation Tool/README.md`
- **AI Usage Declaration:** See `/AI Annotation Tool/docs/AI_Usage_Declaration.md`
- **API Documentation:** See relevant sections in `/AI Annotation Tool/README.md`
- **Testing Details:** Refer to test files in `/tests/`
- **Database Schema:** Consult `/database/schema.sql`

---

**End of CLAUDE.md**

This document serves as the authoritative guide for understanding and working with the AI Annotation Tool codebase. It is intended to ensure consistency, quality, and effective collaboration across all development efforts.
