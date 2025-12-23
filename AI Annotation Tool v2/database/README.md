# Database Setup - AI Annotation Tool v2

This directory contains the database schema, migrations, seeds, and utilities for the AI Annotation Tool v2.

## Structure

```
database/
├── annotations.db          # SQLite database file (copied from v1)
├── annotations_save.db     # Backup database file (copied from v1)
├── init.js                 # Database initialization script
├── migrations/             # Database schema migrations
│   └── 001_initial_schema.sql
├── seeds/                  # Sample data seeds
│   └── 001_sample_data.sql
└── README.md              # This file
```

## Quick Start

1. **Initialize the database with schema and sample data:**
   ```bash
   npm run db:init
   ```

2. **Reset the database (removes existing data):**
   ```bash
   npm run db:reset
   ```

## Database Schema

The database uses SQLite and implements a many-to-many relationship between images and labels:

- **images**: Stores uploaded image metadata
- **labels**: Stores reusable annotation labels
- **annotations**: Junction table linking images to labels with confidence scores

## Sample Data

The seed data includes:
- 13 predefined labels (cat, dog, animal, person, vehicle, etc.)
- 5 sample image records
- Multiple annotations demonstrating the many-to-many relationships

## Usage in Next.js

Use the database connection utility in your API routes:

```javascript
import { query, queryOne, run } from '../../../lib/database';

// Get all images
const images = await query('SELECT * FROM images');

// Get a specific image
const image = await queryOne('SELECT * FROM images WHERE image_id = ?', [id]);

// Insert new annotation
const result = await run(
  'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
  [imageId, labelId, confidence]
);
```

## Migration from v1

This database structure is compatible with the original AI Annotation Tool. The main differences:
- File paths updated to use Next.js `public/uploads` convention
- Added proper migration and seed structure
- Included database connection utilities for Next.js API routes