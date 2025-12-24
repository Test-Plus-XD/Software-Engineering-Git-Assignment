# AI Dataset Annotation Tool v2

A modern, full-stack web application for uploading images and adding text labels for AI dataset creation. Built with Next.js, SQLite, and Firebase integration.

**Course:** Software Engineering and Professional Practice  
**Assignment:** Assignment 2 - Modern Full-Stack Application with Next.js  
**Group:** 11  
**Member:** S24510598 (NG Yu Ham Baldwin)

## Features

- **Image Upload & Management**: Upload images with Firebase Storage integration
- **Label Management**: Create, edit, and delete labels with confidence scores
- **Annotation System**: Many-to-many relationship between images and labels
- **Authentication**: Firebase Authentication via Vercel API
- **AI Chatbot**: Gemini AI integration for conversational assistance (session-only)
- **Data Export/Import**: CSV backup and restore functionality
- **Creator Tracking**: Full audit trail of who created and modified records
- **Dark Mode**: Complete theming support for light and dark modes
- **Responsive Design**: Mobile-first approach with modern UI/UX

## Technology Stack

### Frontend
- **Next.js 16.1.0** - React-based full-stack framework
- **React 19.2.3** - Component-based UI library
- **TailwindCSS 4** - Utility-first CSS framework
- **TypeScript 5** - Type-safe JavaScript
- **Zod 4.2.1** - Runtime type validation

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **better-sqlite3 12.5.0** - High-performance synchronous SQLite driver
- **Custom ORM Layer** - Type-safe data access with validation
- **Node.js** - JavaScript runtime

### External Services
- **Firebase Authentication** - User authentication via Vercel API
- **Firebase Storage** - Image storage via Vercel API
- **Google Gemini AI** - Conversational chatbot via Vercel API

### Development & Testing
- **ESLint 9** - Code linting with Next.js config
- **Mocha 11.7.5** - Test framework
- **Chai 4.3.10** - Assertion library
- **Jest** - Alternative testing framework
- **TypeScript** - Static type checking

## Architecture Overview

### Database Strategy
- **Primary Database**: SQLite for annotation data (images, labels, annotations)
- **Authentication**: Firebase Auth (token verification only, no user data stored)
- **Storage**: Firebase Storage for image files
- **AI Chatbot**: Google Gemini (session-only, no persistence)

### Integration Approach
All external services (Firebase, Gemini) are accessed through a centralised Vercel API to:
- Maintain security (API keys stay server-side)
- Centralise external service calls
- Enable consistent error handling
- Simplify testing and mocking

### Multi-Layer Architecture
1. **Database Layer** (`lib/database/`) - SQLite connections and migrations
2. **ORM Layer** (`lib/database/proxy.js`) - Custom type-safe ORM
3. **Data Access Layer** (`lib/data-access/`) - Business logic and validation
4. **API Layer** (`app/api/`) - REST endpoints
5. **UI Layer** (`app/components/`) - React components

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **SQLite** (included with better-sqlite3)

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Test-Plus-XD/Software-Engineering-Git-Assignment.git
cd "AI Annotation Tool v2"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` file in the project root:

```bash
# Database Configuration
DATABASE_PATH=database/annotations.db
TEST_DB_PATH=database/test_annotations.db

# Vercel API Configuration (for Firebase & Gemini integration)
VERCEL_API_BASE_URL=https://vercel-express-api-alpha.vercel.app
VERCEL_API_PASSCODE=PourRice

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Initialisation
```bash
# Initialise database with schema and seed data
npm run db:init

# Alternative commands:
npm run db:reset      # Reset database (keeps file)
npm run db:hardreset  # Delete and recreate database
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

### Core Tables

**images** - Image metadata storage
- `image_id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `filename` (TEXT NOT NULL UNIQUE) - Generated unique filename
- `original_name` (TEXT NOT NULL) - User's original filename
- `file_path` (TEXT NOT NULL) - Firebase Storage URL
- `file_size` (INTEGER NOT NULL) - File size in bytes
- `mime_type` (TEXT NOT NULL) - Image MIME type
- `uploaded_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `created_by` (TEXT NULL) - User who uploaded the image
- `last_edited_by` (TEXT NULL) - User who last modified the image

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
- `created_by` (TEXT NULL) - User who created the annotation
- `last_edited_by` (TEXT NULL) - User who last modified the annotation
- UNIQUE constraint on (image_id, label_id)

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

### Database Management
```bash
npm run db:init     # Initialise database with schema and seeds
npm run db:reset    # Reset database (keeps file)
npm run db:hardreset # Delete and recreate database
```

### Testing
```bash
npm test            # Run all tests
npm run test:db     # Database tests only
npm run test:watch  # Watch mode for development
npm run test:ci     # CI testing with Jest
```

## Authentication Flow

### Firebase Authentication Integration
The application uses Firebase Authentication through a centralised Vercel API:

1. **User Registration/Login**: Handled by Vercel API endpoints
2. **Token Verification**: Firebase ID tokens verified server-side
3. **Session Management**: Tokens stored in localStorage with automatic refresh
4. **Protected Routes**: API middleware validates tokens for protected operations

### Authentication Endpoints (via Vercel API)
- `POST /API/Auth/register` - Create new user accounts
- `POST /API/Auth/login` - Authenticate existing users
- `POST /API/Auth/google` - Google OAuth authentication
- `POST /API/Auth/verify` - Validate Firebase ID tokens
- `POST /API/Auth/reset-password` - Password reset emails
- `POST /API/Auth/logout` - Revoke refresh tokens
- `DELETE /API/Auth/delete-account` - Permanent account deletion

## Chatbot Integration

### Gemini AI Chatbot
The application includes a conversational AI chatbot with the following characteristics:

- **Access**: Only available to authenticated users
- **Integration**: Google Gemini via Vercel API
- **Session-Only**: Chat history stored in React state only
- **No Persistence**: History cleared on component unmount or page refresh
- **Separate from Annotation Tool**: Completely independent functionality

## TDD Workflow

This project was developed using Test-Driven Development methodology:

### TDD Cycle
1. **Red Phase**: Write failing tests first
2. **Green Phase**: Write minimal code to make tests pass
3. **Refactor Phase**: Improve code while keeping tests passing

### Test Coverage
- **Database Layer**: 24 tests (connection, CRUD operations)
- **Migration System**: 11 tests (schema versioning)
- **Data Access Layer**: 38 tests (business logic)
- **API Routes**: 27 tests (endpoint functionality)
- **UI Components**: 23 tests (React component behaviour)
- **Authentication**: 13 tests (Firebase integration)

**Total: 136 tests with 100% pass rate**

## Project Structure

```
AI Annotation Tool v2/
├── app/                           # Next.js App Router
│   ├── api/                       # API Routes
│   │   ├── annotations/           # Annotation CRUD endpoints
│   │   ├── export/csv/           # CSV export functionality
│   │   ├── import/csv/           # CSV import functionality
│   │   ├── images/               # Image CRUD endpoints
│   │   └── labels/               # Label CRUD endpoints
│   ├── components/               # React Components
│   │   ├── ImageCard.tsx         # Image display with label editing
│   │   ├── ImageGallery.tsx      # Responsive image grid
│   │   ├── UploadForm.tsx        # File upload with validation
│   │   ├── LabelSelector.tsx     # Multi-select label interface
│   │   ├── CsvExportImport.tsx   # Data backup/restore
│   │   └── tests/                # Component tests
│   ├── contexts/                 # React Contexts
│   │   └── AuthContext.jsx       # Authentication state management
│   ├── middleware/               # API Middleware
│   │   └── auth.js              # Authentication middleware
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── lib/                          # Shared utilities
│   ├── auth/                     # Authentication utilities
│   │   └── firebase-auth.js      # Firebase token verification
│   ├── database/                 # Database layer
│   │   ├── connection.js         # Database connection module
│   │   ├── proxy.js             # Custom ORM implementation
│   │   ├── schemas.js           # Table schema definitions
│   │   └── tests/               # Database layer tests
│   ├── data-access/             # Data access layer
│   │   ├── annotations.js        # Annotation operations
│   │   ├── images.js            # Image operations
│   │   ├── labels.js            # Label operations
│   │   └── tests/               # Data access tests
│   └── utils/                   # Utility functions
│       ├── firebase-storage.js   # Firebase Storage integration
│       └── data-sync.ts         # Component refresh utilities
├── database/                     # Database files
│   ├── annotations.db           # SQLite database
│   ├── init.js                  # Database initialisation
│   ├── migrations/              # Database migrations
│   └── seeds/                   # Sample data
├── docs/                        # Documentation
│   ├── API.md                   # API documentation
│   └── DEPLOYMENT.md            # Deployment guide
├── tests/                       # Test suite
│   ├── e2e/                     # End-to-end tests
│   └── [various test files]    # Unit and integration tests
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # TailwindCSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Key Features & Improvements over v1

### Architecture Enhancements
- Multi-layer database architecture with separation of concerns
- Custom ORM layer with type safety and validation
- Migration system with version-controlled schema changes
- Comprehensive testing with Test-Driven Development
- Firebase integration via centralised Vercel API

### Performance Enhancements
- better-sqlite3 for 2-3x faster database operations
- Strategic indexing for optimised queries
- Transaction support for atomic operations
- Eager loading for efficient data fetching

### User Experience
- Modern responsive design with dark mode support
- Interactive label editing with confidence sliders
- Real-time component updates without page reloads
- Professional UI with gradient effects and smooth transitions
- Comprehensive error handling with user-friendly messages

### Data Management
- Complete audit trail with creator/editor tracking
- CSV export/import for data backup and migration
- Image deletion with Firebase Storage cleanup
- Duplicate prevention and validation

## Common Development Tasks

### Adding New API Endpoints
1. Create route file in `app/api/[endpoint]/route.js`
2. Implement HTTP methods (GET, POST, PUT, DELETE)
3. Add validation using data access layer
4. Write tests in `tests/` directory

### Adding New Components
1. Create component in `app/components/`
2. Add TypeScript types and props validation
3. Implement dark mode theming
4. Write tests in `app/components/tests/`

### Database Schema Changes
1. Create migration file in `database/migrations/`
2. Update schema definitions in `lib/database/schemas.js`
3. Update data access layer methods
4. Run `npm run db:migrate` to apply changes

## Troubleshooting

### Common Issues

**Database not initialised**
```bash
npm run db:init
```

**Port already in use**
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

**Module resolution errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Test failures**
```bash
# Reset test database
npm run db:hardreset
npm test
```

### Debug Commands
```bash
# Check database status
sqlite3 database/annotations.db ".tables"
sqlite3 database/annotations.db "SELECT COUNT(*) FROM images;"

# Check API endpoints
curl http://localhost:3000/api/images
curl http://localhost:3000/api/labels

# Monitor logs
npm run dev # Check terminal output for errors
```

## Contributing

This project follows Test-Driven Development principles:

1. **Write failing tests first** (Red phase)
2. **Implement minimal code to pass** (Green phase)  
3. **Refactor while keeping tests passing** (Refactor phase)
4. **Commit with clear TDD evidence**

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Implement dark mode for all UI components
- Add comprehensive error handling
- Write descriptive commit messages

## Documentation

- **API Documentation**: See `docs/API.md` for detailed endpoint documentation
- **Deployment Guide**: See `docs/DEPLOYMENT.md` for production deployment instructions
- **Architecture Details**: See `CLAUDE.md` for comprehensive technical documentation

## License

This project is part of a Software Engineering course assignment and is for educational purposes.

## Contact

- **Developer**: NG Yu Ham Baldwin (Baldwon0xd@gmail.com)
- **Course**: Software Engineering and Professional Practice 2025-2026
- **Institution**: Hong Kong College of Technology
- **Repository**: https://github.com/Test-Plus-XD/Software-Engineering-Git-Assignment
