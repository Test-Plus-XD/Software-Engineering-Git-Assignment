# AI Dataset Annotation Tool (Basic Version) - Assignment 1

**Course:** Software Engineering and Professional Practice  
**Assignment:** Assignment 1 - Basic Web Application with AJAX and SQL  
**Group:** [11]  
**Members:** [S24510598]  
**Due Date:** 18-Nov-2025

## Project Overview

The AI Dataset Annotation Tool is a web application that allows users to upload images and add text labels for AI dataset creation. The application demonstrates the integration of front-end technologies (HTML, CSS, JavaScript) with back-end services (Node.js, Express) and database operations (SQLite with SQL queries).

### Key Features

- ✅ Upload image files (JPG, PNG, etc.)
- ✅ Add text labels to images
- ✅ View all labeled images in an organized gallery
- ✅ Edit and remove labels from images
- ✅ Delete images from the dataset
- ✅ Search and filter images by labels
- ✅ Responsive design for mobile and desktop

## Technology Stack

### Frontend

- **HTML5**: Semantic markup and structure
- **TailwindCSS (CDN)**: Utility-first CSS framework
- **JavaScript (ES6+)**: Modern JavaScript features and AJAX
- **Fetch API**: Asynchronous server communication

### Backend

- **Node.js**: JavaScript runtime environment
- **Express.js 5.1.0**: Web application framework
- **SQLite3 5.1.7**: Lightweight relational database
- **Multer 1.4.5**: Middleware for handling file uploads
- **Raw SQL**: Database queries without ORM

### Development Tools

- **Git**: Version control
- **GitHub**: Repository hosting
- **Visual Studio 2026 Insider**: Code editor

## Installation and Setup

### Prerequisites

- Node.js (version 18.x or higher)
- Git
- A modern web browser

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Test-Plus-XD/Software-Engineering-Git-Assignment.git
   cd "AI Annotation Tool"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Initialise the database**

   ```bash
   sqlite3 database/annotations.db < database/schema.sql
   ```

4. **Seed sample data (optional)**

   ```bash
   npm run seed-db
   ```
    Or manually:
   ```bash
   sqlite3 database/annotations.db < database/seed.sql
   ```

5. **Start the application**

   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Project Structure

```
AI Annotation Tool/
├── public/                 # Frontend files
│   ├── css/
│   │   └── styles.css     # Custom CSS styles
│   ├── js/
│   │   └── index.js       # Frontend JavaScript with AJAX
│   └── index.html         # Main HTML interface
├── server/                # Backend files
│   ├── routes/
│   │   ├── images.js      # Image API endpoints
│   │   └── labels.js      # Label API endpoints
│   ├── database.js        # Database connection and queries
│   └── server.js          # Express server setup
├── database/              # Database files
│   ├── annotations.db     # SQLite database file (created on init)
│   ├── schema.sql         # Database schema definition
│   └── seed.sql           # Sample data
├── scripts/               # Utility scripts
│   ├── init-database.js   # Database initialisation
│   └── seed-database.js   # Sample data seeding
├── uploads/               # Uploaded image storage
│   └── images/
├── tests/                 # Test files (for Assignment 2)
│   ├── database.test.js
│   └── server_load.test.js
├── docs/                  # Documentation
│   └── AI_Usage_Declaration.md
├── package.json           # Node.js dependencies
└── README.md             # This file
└ .gitignore            # Git ignore rules
```

## API Documentation

### Base URL

```
http://localhost:3000/API
```

### Endpoints

#### Get All Images

```http
GET /API/images
```

**Response:**

```json
[
  {
    "id": 1,
    "filename": "cat_001.jpg",
    "original_name": "my_cat.jpg",
    "file_path": "/uploads/images/cat_001.jpg",
    "file_size": 245760,
    "mime_type": "image/jpeg",
    "uploaded_at": "2025-10-14T10:00:00Z",
    "labels": [
      { "id": 1, "name": "cat", "confidence": 1.0 },
      { "id": 2, "name": "animal", "confidence": 1.0 }
    ]
  }
]
```

#### Get Image by ID

```http
GET /API/images/:id
```

#### Upload New Image

```http
POST /API/images
Content-Type: multipart/form-data

[image file]
```

#### Add Label to Image

```http
POST /API/images/:id/labels
Content-Type: application/json

{
  "label_name": "cat",
  "confidence": 1.0
}
```

#### Update Image Labels

```http
PUT /API/images/:id
Content-Type: application/json

{
  "labels": [
    {"name": "cat", "confidence": 1.0},
    {"name": "pet", "confidence": 0.9}
  ]
}
```

#### Delete Image

```http
DELETE /API/images/:id
```

#### Search Images by Label

```http
GET /API/images/search?label=cat&confidence=0.8
```

## Database Schema

### Tables

#### Images Table

```sql
CREATE TABLE images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Labels Table

```sql
CREATE TABLE labels (
    label_id INTEGER PRIMARY KEY AUTOINCREMENT,
    label_name TEXT NOT NULL UNIQUE,
    label_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Annotations Table (Junction Table)

```sql
CREATE TABLE annotations (
    annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    confidence REAL DEFAULT 1.0 CHECK(confidence >= 0.0 AND confidence <= 1.0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE,
    UNIQUE(image_id, label_id)
);
```

**Relationships:**
- Images → Annotations (one-to-many)
- Labels → Annotations (one-to-many)
- Images ↔ Labels (many-to-many via annotations)

## Individual Contributions

### [NG Yu Ham Baldwin] - [S24510598]

**Primary Responsibilities:**
- Full-stack development of the AI Dataset Annotation Tool
- Database schema design and implementation
- RESTful API development with Express.js
- Frontend interface design with TailwindCSS
- AJAX integration for asynchronous operations
- Project setup

**Code Contributions:**
- `server/server.js` - Express server configuration and middleware setup
- `server/database.js` - SQLite database connection and query wrappers
- `server/routes/images.js` - Image upload, retrieval, labelling, and deletion endpoints
- `server/routes/labels.js` - Label CRUD operations
- `public/index.html` - Frontend HTML structure
- `public/js/index.js` - Frontend JavaScript with AJAX functionality
- `database/schema.sql` - Database schema definition
- `database/seed.sql` - Sample data for testing
- `scripts/init-database.js` - Database initialisation script
- `scripts/seed-database.js` - Data seeding script

**Challenges Faced:**
- Understanding SQLite's callback-based API and converting it to Promises for cleaner async/await syntax
- Implementing proper file upload handling with Multer middleware

**Learning Outcomes:**
- Understood the differences between file-based (SQLite) and server-based databases
- Learned how to implement RESTful API endpoints following HTTP conventions

### Development Process

### Day 1: Core Structure and Backend Foundations
- ✅ Create project directories and placeholder files
- ✅ Add SQLite node package
- ✅ Implement database schema and initial setup
- ✅ Configure API server (Express)
- ✅ Add database connection with error logging
- ✅ Create images and labels tables
- ✅ Add indices for query optimisation

### Day 2: Data Import, API Expansion, Frontend Development
- ✅ Implement image upload route with Multer
- ✅ Add label management endpoints
- ✅ Insert sample data for testing
- ✅ Create HTML structure with TailwindCSS
- ✅ Implement JavaScript AJAX functions
- ✅ Add image gallery with dynamic rendering
- ✅ Implement label modal functionality
- ✅ Add database statistics display
- ✅ Test all CRUD operations

### Day 3: Final Review and Submission
- ✅ Frontend-backend integration testing
- ✅ Bug fixes and code refinement
- ✅ Code cleanup and commenting
- ✅ Documentation completion
- ✅ Final testing across different scenarios
- ✅ Submission preparation

## Testing

### Manual Testing Checklist

- ✅ Image upload works with various file types
- ✅ Labels can be added to and removed from images
- ✅ Database statistics update in real-time
- ✅ AJAX calls handle errors
- ✅ Responsive design works desktop
- ✅ User-friendly error messages display correctly

### Test Data

The application includes sample data with:
- 13 predefined labels (cat, dog, food, etc.)
- 5 sample image records
- 15 sample annotations linking images to labels

## Known Issues and Limitations

1. **Authentication**: No user authentication system implemented
2. **Label Editing**: Cannot edit labels directly from image cards (must use API)
3. **Bulk Operations**: No batch upload or batch labelling functionality
4. **Search Functionality**: Limited search and filtering options
5. **Image Preview**: Placeholder images in seed data don't have actual files

## Future Enhancements

1. **Advanced Search**: Add filtering by label, date, and file type
2. **Batch Operations**: Allow multiple image uploads and bulk labelling
3. **Label Management UI**: Add frontend interface for editing labels
4. **Image Editing**: Basic image cropping and rotation tools
5. **Export Functionality**: Export annotated dataset in common formats (JSON, CSV)
6. **Statistics Dashboard**: More detailed analytics on dataset composition

## Resources and References

### Documentation

- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Git Documentation](https://git-scm.com/doc)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Multer Documentation](https://github.com/expressjs/multer)

### Tutorials Used

- None directly; all code was generated with AI assistance and adapted by the me.

### AI Tools Used

- **Claude (Anthropic)**: Code structure, debugging assistance, documentation
- **ChatGPT**: Conceptual explanations and alternative approaches
- **GitHub Copilot**: Code completion and boilerplate generation

## Group Collaboration

### Git Workflow

- **Branching Strategy**: main branch
- **Commit Convention**: Descriptive commit messages explaining changes
- **Pull Request Process**: [No PR process]

## Academic Integrity

This project was developed as part of the Software Engineering and Professional Practice course. All code is original work developed by the group members, with proper attribution given to any external resources or AI assistance used.

**AI Usage Declaration**: See `docs/AI_Usage_Declaration.md` for detailed information about AI tool usage.

**Group Collaboration**: See `docs/Group_Collaboration_Log.md` for detailed collaboration information.

## Contact Information

**Group Representative**: [NG Yu Ham Baldwin (Baldwon0xd@gmail.com)]
**Repository**: [https://github.com/Test-Plus-XD/Software-Engineering-Git-Assignment/tree/main/AI%20Annotation%20Tool]
**Course**: Software Engineering and Professional Practice 2025-2026
**Lecturer**: Beeno Tung

---

**Last Updated**: [19/11/2025]
**Version**: 1.0.0
