# CLAUDE.md - AI Dataset Annotation Tool

## Project Context

This is an **AI Dataset Annotation Tool** - a web application for uploading images and adding text labels for AI dataset creation. It's part of a Software Engineering course assignment demonstrating full-stack development with AJAX and SQL.

**Course:** Software Engineering and Professional Practice
**Assignment:** Assignment 1 - Basic Web Application with AJAX and SQL
**Group:** 11
**Member:** S24510598 (NG Yu Ham Baldwin)

## Technology Stack

### Backend
- **Node.js** with **Express.js 5.1.0** - Web server and REST API
- **SQLite3 5.1.7** - File-based relational database
- **Multer 1.4.5** - File upload middleware
- **Raw SQL** - No ORM, direct SQL queries

### Frontend
- **Vanilla JavaScript (ES6+)** - No frameworks
- **Fetch API** - AJAX for async server communication
- **TailwindCSS (CDN)** - Utility-first CSS framework
- **HTML5** - Semantic markup

### Development
- **ES Modules** (`"type": "module"` in package.json)
- **Nodemon** - Development server with auto-reload
- **Mocha/Chai** - Testing framework
- **Git/GitHub** - Version control

## Project Structure

```
AI Annotation Tool/
├── server/
│   ├── server.js          # Express app setup, middleware, routes
│   ├── database.js        # SQLite connection & query wrappers
│   └── routes/
│       ├── images.js      # Image CRUD endpoints
│       └── labels.js      # Label CRUD endpoints
├── public/
│   ├── index.html         # Frontend UI
│   ├── js/index.js        # Frontend JS with AJAX
│   └── css/styles.css     # Custom CSS
├── database/
│   ├── annotations.db     # SQLite database file
│   ├── schema.sql         # Table definitions
│   └── seed.sql           # Sample data
├── scripts/
│   ├── init-database.js   # DB initialization
│   └── seed-database.js   # Data seeding
├── uploads/images/        # Uploaded image storage
├── tests/                 # Test files
├── docs/                  # Documentation
└── package.json
```

## Database Schema

### Core Tables

**images** - Stores uploaded image metadata
- `image_id` (PK, AUTO_INCREMENT)
- `filename` (UNIQUE) - Generated filename
- `original_name` - User's original filename
- `file_path` - Relative path to file
- `file_size` - File size in bytes
- `mime_type` - Image MIME type
- `uploaded_at`, `updated_at` - Timestamps

**labels** - Unique label definitions
- `label_id` (PK, AUTO_INCREMENT)
- `label_name` (UNIQUE) - Label text (e.g., "cat", "dog")
- `label_description` - Optional description
- `created_at` - Timestamp

**annotations** - Junction table (many-to-many)
- `annotation_id` (PK, AUTO_INCREMENT)
- `image_id` (FK → images, CASCADE DELETE)
- `label_id` (FK → labels, CASCADE DELETE)
- `confidence` (REAL, 0.0-1.0) - Annotation confidence score
- `created_at` - Timestamp
- UNIQUE constraint on (image_id, label_id)

### Relationships
- **Images ↔ Labels**: Many-to-many via annotations table
- One image can have multiple labels
- One label can be applied to multiple images

## API Endpoints

**Base URL:** `http://localhost:3000/API`

### Images
- `GET /images` - Get all images with their labels
- `GET /images/:id` - Get specific image by ID
- `POST /images` - Upload new image (multipart/form-data)
- `PUT /images/:id` - Update image labels
- `DELETE /images/:id` - Delete image and file
- `GET /images/search?label=<name>&confidence=<val>` - Search by label
- `POST /images/:id/labels` - Add single label to image

### Labels
- `GET /labels` - Get all labels
- `GET /labels/:id` - Get specific label
- `POST /labels` - Create new label
- `PUT /labels/:id` - Update label
- `DELETE /labels/:id` - Delete label

### Database Info
- `GET /SQLite/Images` - Database statistics and connection status

## Key Features

1. **Image Upload**: Upload JPG, PNG, etc. with automatic file management
2. **Label Management**: Create, read, update, delete labels
3. **Annotation**: Link labels to images with confidence scores
4. **Search/Filter**: Find images by label and confidence threshold
5. **Gallery View**: Display all images with their labels
6. **Real-time Stats**: Show database statistics (image count, label count, annotations)
7. **Responsive Design**: Works on desktop and mobile

## Running the Application

### Setup
```bash
cd "AI Annotation Tool"
npm install
npm run init-db    # Initialize SQLite database
npm run seed-db    # (Optional) Load sample data
npm start          # Start server on http://localhost:3000
```

### Development
```bash
npm run dev        # Start with nodemon (auto-reload)
```

### Testing
```bash
npm test           # Run all tests
npm run test:unit  # Unit tests only
npm run test:load  # Load testing
```

## Important Implementation Details

### ES Modules
- Project uses ES modules (`import`/`export`)
- `package.json` has `"type": "module"`
- File extensions required in imports: `import x from './file.js'`
- `__dirname` not available; use `fileURLToPath(import.meta.url)`

### Database Queries
- All SQL queries are **raw SQL** (no ORM)
- Database operations use Promises/async-await
- `database.js` provides wrapper functions:
  - `executeQuery(sql, params)` - For SELECT queries
  - `executeUpdate(sql, params)` - For INSERT/UPDATE/DELETE

### File Uploads
- Multer handles multipart/form-data
- Files saved to `uploads/images/` with unique names
- Database stores relative paths for portability

### Error Handling
- All endpoints have try-catch blocks
- 404 for not found, 500 for server errors
- Console logging for debugging

## Common Development Tasks

### Adding a New Label
```javascript
// Frontend (AJAX)
fetch('/API/labels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ label_name: 'cat', label_description: 'Feline animal' })
});

// Backend (SQL)
INSERT INTO labels (label_name, label_description) VALUES (?, ?)
```

### Uploading an Image
```javascript
// Frontend
const formData = new FormData();
formData.append('image', fileInput.files[0]);
fetch('/API/images', { method: 'POST', body: formData });

// Backend uses Multer middleware
upload.single('image')
```

### Linking Label to Image
```javascript
// Frontend
fetch(`/API/images/${imageId}/labels`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ label_name: 'cat', confidence: 1.0 })
});

// Backend (SQL)
INSERT INTO annotations (image_id, label_id, confidence)
SELECT ?, label_id, ? FROM labels WHERE label_name = ?
```

### Getting Images with Labels (JOIN)
```sql
SELECT
  i.*,
  GROUP_CONCAT(l.label_name) as labels
FROM images i
LEFT JOIN annotations a ON i.image_id = a.image_id
LEFT JOIN labels l ON a.label_id = l.label_id
GROUP BY i.image_id
```

## Known Issues & Limitations

1. **No Authentication** - Anyone can upload/delete images
2. **No Image Validation** - Relies on browser for file type checking
3. **Limited Search** - Basic label search only
4. **No Batch Operations** - Upload/label one at a time
5. **In-Memory Stats** - Database stats queried on each request

## Git Workflow

- **Branch:** Main branch only (single developer)
- **Commits:** Descriptive messages with conventional format
  - `Feat:` New features
  - `Fix:` Bug fixes
  - `Doc:` Documentation
  - `Update:` Enhancements
- **No PR Process** - Direct commits to main

## AI Assistance Declaration

This project was developed with extensive AI assistance:
- **Claude (Anthropic)** - Architecture, code generation, debugging
- **ChatGPT** - Conceptual explanations
- **GitHub Copilot** - Code completion

See `docs/AI_Usage_Declaration.md` for full details.

## Development Tips for Claude

### When Making Changes
1. **Always read files first** - Don't assume structure
2. **Check ES module syntax** - Remember file extensions in imports
3. **Test SQL queries** - Verify foreign key relationships
4. **Update both frontend and backend** - Changes often need both
5. **Check file paths** - Use relative paths for portability
6. **Maintain error handling** - Keep try-catch blocks

### Common Pitfalls
- Forgetting `.js` extensions in imports
- Using `require()` instead of `import`
- Not handling async database operations
- Breaking foreign key constraints
- Hardcoding absolute file paths

### Testing Changes
```bash
# Quick test workflow
npm start                           # Start server
# Open http://localhost:3000 in browser
# Check browser console for errors
# Check terminal for server logs
```

## Contact & Resources

- **Repository:** https://github.com/Test-Plus-XD/Software-Engineering-Git-Assignment
- **Developer:** NG Yu Ham Baldwin (Baldwon0xd@gmail.com)
- **Course:** Software Engineering and Professional Practice 2025-2026
- **Lecturer:** Beeno Tung

## Last Updated

**Date:** 2025-12-23
**Version:** 1.0.0
**Status:** Assignment 1 Complete, Assignment 2 In Progress
