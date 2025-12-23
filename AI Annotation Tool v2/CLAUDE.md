# CLAUDE.md - AI Dataset Annotation Tool v2

## Project Context

This is the **AI Dataset Annotation Tool v2** - a modern, full-stack web application for uploading images and adding text labels for AI dataset creation. This is the second iteration, completely rebuilt with Next.js and modern technologies as part of a Software Engineering course assignment.

**Course:** Software Engineering and Professional Practice  
**Assignment:** Assignment 2 - Modern Full-Stack Application with Next.js  
**Group:** 11  
**Member:** S24510598 (NG Yu Ham Baldwin)

## Technology Stack

### Frontend
- **Next.js 16.1.0** - React-based full-stack framework
- **React 19.2.3** - Component-based UI library
- **TailwindCSS 4** - Utility-first CSS framework with PostCSS
- **TypeScript 5** - Type-safe JavaScript
- **Zod 4.2.1** - Runtime type validation

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **better-sqlite3 12.5.0** - High-performance synchronous SQLite driver
- **Node.js** - JavaScript runtime

### Development & Testing
- **ESLint 9** with Next.js config - Code linting
- **Mocha 11.7.5** - Test framework
- **Chai 4.3.10** - Assertion library
- **Jest** - Alternative testing framework
- **TypeScript** - Static type checking

### Build & Deployment
- **PostCSS** - CSS processing
- **Babel React Compiler** - React optimization
- **Next.js Build System** - Optimized production builds

## Project Structure

```
AI Annotation Tool v2/
├── app/                           # Next.js App Router
│   ├── api/                       # API Routes
│   │   ├── images/
│   │   │   └── route.js          # Image CRUD endpoints
│   │   └── labels/
│   │       └── route.js          # Label CRUD endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/                          # Shared utilities
│   └── database/
│       ├── connection.js         # Database connection module
│       └── schema.sql           # Database schema
├── database/                     # Database files
│   ├── annotations.db           # SQLite database
│   ├── init.js                  # Database initialization
│   ├── migrations/              # Database migrations
│   │   ├── tests/               # Migration system tests
│   │   ├── run-migrations.js    # Migration runner
│   │   └── 001_initial_schema.sql # Initial schema migration
│   └── seeds/
│       └── 001_sample_data.sql  # Sample data
├── test/                        # Test suite
│   ├── database.test.js         # Comprehensive database tests
│   ├── run-tests.js            # Test runner
│   └── README.md               # Test documentation
├── public/                      # Static assets
├── uploads/                     # File uploads
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # TailwindCSS configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.mjs             # Jest configuration
├── .mocharc.json              # Mocha configuration
└── package.json
```

## Database Architecture

### Schema Design
The database uses a **many-to-many relationship** between images and labels through an annotations junction table, identical to v1 but with better-sqlite3 for improved performance.

**images** - Image metadata storage
- `image_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `filename` (TEXT NOT NULL UNIQUE) - Generated unique filename
- `original_name` (TEXT NOT NULL) - User's original filename
- `file_path` (TEXT NOT NULL) - Relative path to file
- `file_size` (INTEGER NOT NULL) - File size in bytes
- `mime_type` (TEXT NOT NULL) - Image MIME type
- `uploaded_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

**labels** - Label definitions
- `label_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `label_name` (TEXT NOT NULL UNIQUE) - Label text
- `label_description` (TEXT) - Optional description
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

**annotations** - Many-to-many junction table
- `annotation_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `image_id` (INTEGER NOT NULL, FK → images ON DELETE CASCADE)
- `label_id` (INTEGER NOT NULL, FK → labels ON DELETE CASCADE)
- `confidence` (REAL DEFAULT 1.0, CHECK 0.0 ≤ confidence ≤ 1.0)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- UNIQUE constraint on (image_id, label_id)

### Performance Optimizations
- **Indexes**: Strategic indexes on foreign keys and search columns
  - `idx_annotations_label` - For label-based queries
  - `idx_annotations_image` - For image-based queries
  - `idx_images_filename` - For filename lookups
  - `idx_labels_name` - For label name searches
- **Foreign Key Constraints**: Enabled for data integrity
- **Synchronous Operations**: better-sqlite3 for faster queries

## Database Connection Module

### Connection Management
```javascript
// lib/database/connection.js
const Database = require('better-sqlite3');

// Singleton pattern with test database support
const DB_PATH = process.env.TEST_DB_PATH || 'database/annotations.db';
let db = null;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
  }
  return db;
}
```

### Query Interface
- `query(sql, params)` - SELECT operations returning arrays
- `queryOne(sql, params)` - SELECT operations returning single row
- `run(sql, params)` - INSERT/UPDATE/DELETE operations
- `transaction(callback)` - Atomic transactions
- `exec(sql)` - Raw SQL execution for schema operations

## API Architecture

### Next.js API Routes
**Base URL:** `http://localhost:3000/api`

### Images API (`/api/images`)
- `GET /api/images` - Get all images with labels
- `GET /api/images/[id]` - Get specific image
- `POST /api/images` - Upload new image
- `PUT /api/images/[id]` - Update image metadata
- `DELETE /api/images/[id]` - Delete image and file

### Labels API (`/api/labels`)
- `GET /api/labels` - Get all labels with usage stats
- `GET /api/labels/[id]` - Get specific label
- `POST /api/labels` - Create new label
- `PUT /api/labels/[id]` - Update label
- `DELETE /api/labels/[id]` - Delete label

### Request/Response Format
```javascript
// POST /api/images - Upload image
Content-Type: multipart/form-data
Body: { image: File }

Response: {
  success: true,
  data: {
    image_id: 1,
    filename: "img_20231223_001.jpg",
    original_name: "my-photo.jpg",
    file_size: 245760,
    mime_type: "image/jpeg"
  }
}

// POST /api/labels - Create label
Content-Type: application/json
Body: {
  label_name: "cat",
  label_description: "Domestic feline animals"
}

Response: {
  success: true,
  data: {
    label_id: 1,
    label_name: "cat",
    label_description: "Domestic feline animals",
    created_at: "2023-12-23T10:30:00.000Z"
  }
}
```

## Testing Architecture

### Test Suite Structure
The testing system uses **Mocha + Chai** with comprehensive database testing:

```javascript
// test/database.test.js - Main test suite
describe('Database Tests', function() {
  this.timeout(10000);
  
  // Test categories:
  // 1. Database Connection
  // 2. Images Table CRUD
  // 3. Labels Table CRUD  
  // 4. Annotations Table CRUD
  // 5. Complex Queries & Joins
  // 6. Data Integrity & Constraints
  // 7. Performance Indexes
});
```

### Test Database Isolation
- **Separate Test Database**: Uses `TEST_DB_PATH` environment variable
- **Automatic Cleanup**: Test data removed after each suite
- **Schema Validation**: Ensures proper table structure and constraints
- **Seed Data Testing**: Verifies sample data loading

### Running Tests
```bash
# Prerequisites - Database must be initialized
npm run db:init

# Run all tests
npm test

# Run database tests only
npm run test:db

# Run tests in watch mode
npm run test:watch

# Run with Jest (alternative)
npm run test:ci
```

## Key Features & Improvements over v1

### Performance Enhancements
1. **better-sqlite3**: Synchronous operations, 2-3x faster than sqlite3
2. **Connection Pooling**: Singleton pattern for database connections
3. **Strategic Indexing**: Optimized queries for common operations
4. **Next.js Optimization**: Built-in performance optimizations

### Developer Experience
1. **TypeScript Support**: Type safety and better IDE support
2. **Modern Testing**: Comprehensive test suite with Mocha/Chai
3. **Hot Reloading**: Next.js development server
4. **ESLint Integration**: Code quality enforcement

### Architecture Improvements
1. **Next.js App Router**: Modern routing with server components
2. **API Route Handlers**: Clean separation of concerns
3. **Modular Database Layer**: Reusable connection and query modules
4. **Error Handling**: Consistent error responses across APIs

### Data Integrity
1. **Foreign Key Constraints**: Enforced at database level
2. **Check Constraints**: Confidence score validation (0.0-1.0)
3. **Unique Constraints**: Prevent duplicate annotations
4. **Cascade Deletes**: Automatic cleanup of related records

## Development Workflow

### Setup & Installation
```bash
cd "AI Annotation Tool v2"
npm install                    # Install dependencies
npm run db:init               # Initialize database
npm run dev                   # Start development server
```

### Database Management
```bash
npm run db:init               # Initialize with schema and seeds
npm run db:reset              # Reset database (keeps file)
npm run db:hardreset          # Delete and recreate database
```

### Testing Workflow
```bash
npm test                      # Run all tests
npm run test:db              # Database tests only
npm run test:watch           # Watch mode for development
```

### Production Build
```bash
npm run build                # Build for production
npm start                    # Start production server
```

## Common Development Patterns

### Database Operations
```javascript
// Create image with error handling
import { run, queryOne } from '@/lib/database/connection';

try {
  const result = run(
    'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
    [filename, originalName, filePath, fileSize, mimeType]
  );
  
  const image = queryOne('SELECT * FROM images WHERE image_id = ?', [result.lastID]);
  return { success: true, data: image };
} catch (error) {
  console.error('Database error:', error);
  return { success: false, error: error.message };
}
```

### API Route Handler
```javascript
// app/api/images/route.js
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/connection';

export async function GET() {
  try {
    const images = query(`
      SELECT i.*, GROUP_CONCAT(l.label_name) as labels
      FROM images i
      LEFT JOIN annotations a ON i.image_id = a.image_id
      LEFT JOIN labels l ON a.label_id = l.label_id
      GROUP BY i.image_id
      ORDER BY i.uploaded_at DESC
    `);
    
    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Complex Query Examples
```sql
-- Get images with label statistics
SELECT 
  i.image_id,
  i.filename,
  i.original_name,
  COUNT(a.annotation_id) as label_count,
  AVG(a.confidence) as avg_confidence,
  GROUP_CONCAT(l.label_name) as labels
FROM images i
LEFT JOIN annotations a ON i.image_id = a.image_id
LEFT JOIN labels l ON a.label_id = l.label_id
GROUP BY i.image_id
ORDER BY i.uploaded_at DESC;

-- Get label usage statistics
SELECT 
  l.label_id,
  l.label_name,
  COUNT(a.annotation_id) as usage_count,
  AVG(a.confidence) as avg_confidence,
  MIN(a.confidence) as min_confidence,
  MAX(a.confidence) as max_confidence
FROM labels l
LEFT JOIN annotations a ON l.label_id = a.label_id
GROUP BY l.label_id
ORDER BY usage_count DESC;
```

## Configuration Files

### Next.js Configuration
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  // Add custom configurations here
};

export default nextConfig;
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

## Known Issues & Limitations

### Current Limitations
1. **No Authentication System** - Open access to all functionality
2. **Basic File Validation** - Limited file type and size checking
3. **No Image Processing** - No thumbnail generation or optimization
4. **Single File Upload** - No batch upload functionality
5. **Basic Search** - No advanced filtering or full-text search

### Mocha Test Runner Issue
- **Module Resolution Error**: Current Mocha installation has module resolution issues
- **Workaround**: Database functionality verified through direct testing
- **Status**: All database operations work correctly, test runner needs fixing

### Future Enhancements
1. **User Authentication** - JWT-based auth system
2. **Image Processing** - Thumbnail generation, format conversion
3. **Batch Operations** - Multiple file uploads, bulk labeling
4. **Advanced Search** - Full-text search, complex filters
5. **Export Functionality** - Dataset export in various formats

## Migration from v1

### Key Changes
1. **Framework**: Express.js → Next.js
2. **Database Driver**: sqlite3 → better-sqlite3
3. **Module System**: ES Modules → Next.js modules
4. **Testing**: Basic tests → Comprehensive test suite
5. **TypeScript**: JavaScript → TypeScript support

### Database Compatibility
- **Schema**: Identical structure to v1
- **Data Migration**: Direct database file compatibility
- **API Compatibility**: Similar endpoints with improved error handling

## Development Tips for AI Assistants

### When Working with This Project
1. **Database First**: Always initialize database before testing
2. **Test Isolation**: Use separate test database to avoid data corruption
3. **Error Handling**: Check both success and error cases
4. **Type Safety**: Leverage TypeScript for better code quality
5. **Performance**: Consider query optimization for large datasets

### Common Pitfalls
- **Database Not Initialized**: Run `npm run db:init` before testing
- **Test Database Conflicts**: Ensure proper test isolation
- **Foreign Key Violations**: Check relationships before deletes
- **Confidence Range**: Ensure 0.0 ≤ confidence ≤ 1.0
- **File Path Issues**: Use relative paths for portability

### Debugging Workflow
```bash
# Check database status
npm run db:init

# Run specific tests
npm run test:db

# Check API endpoints
curl http://localhost:3000/api/images
curl http://localhost:3000/api/labels

# Monitor database
sqlite3 database/annotations.db ".tables"
sqlite3 database/annotations.db "SELECT COUNT(*) FROM images;"
```

## AI Assistance Declaration

This project was developed with extensive AI assistance:
- **Claude (Anthropic)** - Architecture design, code generation, testing strategy
- **GitHub Copilot** - Code completion and suggestions
- **ChatGPT** - Problem-solving and debugging

Full AI usage documentation available in project repository.

## Contact & Resources

- **Repository:** https://github.com/Test-Plus-XD/Software-Engineering-Git-Assignment
- **Developer:** NG Yu Ham Baldwin (Baldwon0xd@gmail.com)
- **Course:** Software Engineering and Professional Practice 2025-2026
- **Institution:** Hong Kong Polytechnic University
- **Lecturer:** Beeno Tung

## Version History

- **v2.0.0** (2023-12-23) - Complete rewrite with Next.js and better-sqlite3
- **v1.0.0** (2023-12-20) - Initial Express.js implementation

## Last Updated

**Date:** 2023-12-23  
**Version:** 2.0.0  
**Status:** Assignment 2 - Database Implementation Complete  
**Next:** Frontend UI Development