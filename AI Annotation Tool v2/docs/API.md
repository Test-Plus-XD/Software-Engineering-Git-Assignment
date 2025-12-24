# API Documentation

This document provides comprehensive documentation for all API endpoints in the AI Dataset Annotation Tool v2.

## Base URL

**Development**: `http://localhost:3000/api`  
**Production**: `https://your-domain.com/api`

## Authentication

### Authentication Requirements

Most endpoints require authentication via Firebase ID tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

### Authentication Flow

1. User signs in via Firebase Authentication (client-side)
2. Client receives Firebase ID token
3. Include token in API requests
4. Server verifies token via Firebase Admin SDK
5. User information attached to request context

### Unauthenticated Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/verify` - Token verification (for testing)

## Images API

### GET /api/images

Retrieve paginated list of images with optional filtering.

**Authentication**: Required

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search term for filename
- `hasLabels` (boolean, optional): Filter by label presence

**Response**:
```json
{
  "images": [
    {
      "id": 1,
      "filename": "image1.jpg",
      "originalName": "original-image1.jpg",
      "firebaseUrl": "https://storage.googleapis.com/...",
      "uploadedAt": "2024-01-01T12:00:00.000Z",
      "uploadedBy": "user@example.com",
      "labels": [
        {
          "id": 1,
          "name": "cat",
          "confidence": 0.95,
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 180
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

### POST /api/images

Upload new image with Firebase Storage integration.

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Body**:
- `file` (File): Image file (JPEG, PNG, WebP)
- `originalName` (string, optional): Original filename

**Response**:
```json
{
  "id": 1,
  "filename": "generated-filename.jpg",
  "originalName": "user-uploaded-image.jpg",
  "firebaseUrl": "https://storage.googleapis.com/...",
  "uploadedAt": "2024-01-01T12:00:00.000Z",
  "uploadedBy": "user@example.com"
}
```

**Status Codes**:
- `201` - Created successfully
- `400` - Invalid file format or missing file
- `401` - Unauthorized
- `413` - File too large (max 10MB)
- `500` - Server error

### GET /api/images/[id]

Retrieve specific image by ID.

**Authentication**: Required

**Path Parameters**:
- `id` (number): Image ID

**Response**:
```json
{
  "id": 1,
  "filename": "image1.jpg",
  "originalName": "original-image1.jpg",
  "firebaseUrl": "https://storage.googleapis.com/...",
  "uploadedAt": "2024-01-01T12:00:00.000Z",
  "uploadedBy": "user@example.com",
  "labels": [
    {
      "id": 1,
      "name": "cat",
      "confidence": 0.95,
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 180,
      "createdAt": "2024-01-01T12:05:00.000Z",
      "createdBy": "user@example.com"
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `404` - Image not found
- `500` - Server error

### PUT /api/images/[id]

Update image metadata (filename only).

**Authentication**: Required

**Path Parameters**:
- `id` (number): Image ID

**Body**:
```json
{
  "filename": "new-filename.jpg"
}
```

**Response**:
```json
{
  "id": 1,
  "filename": "new-filename.jpg",
  "originalName": "original-image1.jpg",
  "firebaseUrl": "https://storage.googleapis.com/...",
  "uploadedAt": "2024-01-01T12:00:00.000Z",
  "uploadedBy": "user@example.com"
}
```

**Status Codes**:
- `200` - Updated successfully
- `400` - Invalid filename
- `401` - Unauthorized
- `404` - Image not found
- `500` - Server error

### DELETE /api/images/[id]

Delete image and all associated labels. Also removes file from Firebase Storage.

**Authentication**: Required

**Path Parameters**:
- `id` (number): Image ID

**Response**:
```json
{
  "message": "Image deleted successfully",
  "deletedLabels": 3
}
```

**Status Codes**:
- `200` - Deleted successfully
- `401` - Unauthorized
- `404` - Image not found
- `500` - Server error

## Labels API

### GET /api/labels

Retrieve all labels with optional filtering.

**Authentication**: Required

**Query Parameters**:
- `imageId` (number, optional): Filter by image ID
- `name` (string, optional): Filter by label name
- `minConfidence` (number, optional): Minimum confidence threshold (0-1)

**Response**:
```json
{
  "labels": [
    {
      "id": 1,
      "imageId": 1,
      "name": "cat",
      "confidence": 0.95,
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 180,
      "createdAt": "2024-01-01T12:05:00.000Z",
      "createdBy": "user@example.com"
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

### POST /api/labels

Create new label for an image.

**Authentication**: Required

**Body**:
```json
{
  "imageId": 1,
  "name": "cat",
  "confidence": 0.95,
  "x": 100,
  "y": 150,
  "width": 200,
  "height": 180
}
```

**Validation Rules**:
- `imageId`: Must exist in database
- `name`: Required, 1-100 characters
- `confidence`: Number between 0 and 1
- `x`, `y`: Non-negative integers
- `width`, `height`: Positive integers

**Response**:
```json
{
  "id": 1,
  "imageId": 1,
  "name": "cat",
  "confidence": 0.95,
  "x": 100,
  "y": 150,
  "width": 200,
  "height": 180,
  "createdAt": "2024-01-01T12:05:00.000Z",
  "createdBy": "user@example.com"
}
```

**Status Codes**:
- `201` - Created successfully
- `400` - Validation error
- `401` - Unauthorized
- `404` - Image not found
- `500` - Server error

### PUT /api/labels/[id]

Update existing label.

**Authentication**: Required

**Path Parameters**:
- `id` (number): Label ID

**Body** (partial update supported):
```json
{
  "name": "dog",
  "confidence": 0.87,
  "x": 120,
  "y": 160,
  "width": 180,
  "height": 160
}
```

**Response**:
```json
{
  "id": 1,
  "imageId": 1,
  "name": "dog",
  "confidence": 0.87,
  "x": 120,
  "y": 160,
  "width": 180,
  "height": 160,
  "createdAt": "2024-01-01T12:05:00.000Z",
  "createdBy": "user@example.com"
}
```

**Status Codes**:
- `200` - Updated successfully
- `400` - Validation error
- `401` - Unauthorized
- `404` - Label not found
- `500` - Server error

### DELETE /api/labels/[id]

Delete specific label.

**Authentication**: Required

**Path Parameters**:
- `id` (number): Label ID

**Response**:
```json
{
  "message": "Label deleted successfully"
}
```

**Status Codes**:
- `200` - Deleted successfully
- `401` - Unauthorized
- `404` - Label not found
- `500` - Server error

## Annotations API

### GET /api/annotations

Retrieve annotations with filtering and export capabilities.

**Authentication**: Required

**Query Parameters**:
- `imageId` (number, optional): Filter by image ID
- `format` (string, optional): Response format ('json' or 'csv')
- `includeImages` (boolean, optional): Include image metadata (default: true)

**Response** (JSON format):
```json
{
  "annotations": [
    {
      "imageId": 1,
      "imageName": "image1.jpg",
      "imageUrl": "https://storage.googleapis.com/...",
      "labels": [
        {
          "id": 1,
          "name": "cat",
          "confidence": 0.95,
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 180
        }
      ]
    }
  ]
}
```

**Response** (CSV format):
```csv
imageId,imageName,imageUrl,labelId,labelName,confidence,x,y,width,height
1,image1.jpg,https://storage.googleapis.com/...,1,cat,0.95,100,150,200,180
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

## CSV Export/Import API

### GET /api/export/csv

Export all annotations as CSV file.

**Authentication**: Required

**Query Parameters**:
- `imageIds` (string, optional): Comma-separated image IDs to export

**Response**: CSV file download
```
Content-Type: text/csv
Content-Disposition: attachment; filename="annotations-export.csv"
```

**Status Codes**:
- `200` - Success (CSV file)
- `401` - Unauthorized
- `500` - Server error

### POST /api/import/csv

Import annotations from CSV file.

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Body**:
- `file` (File): CSV file with annotations

**CSV Format**:
```csv
imageId,labelName,confidence,x,y,width,height
1,cat,0.95,100,150,200,180
1,dog,0.87,300,200,150,120
```

**Response**:
```json
{
  "imported": 2,
  "errors": [],
  "summary": {
    "totalRows": 2,
    "successfulImports": 2,
    "failedImports": 0
  }
}
```

**Status Codes**:
- `200` - Import completed (check response for errors)
- `400` - Invalid CSV format
- `401` - Unauthorized
- `500` - Server error

## Authentication API

### POST /api/auth/verify

Verify Firebase ID token (primarily for testing).

**Authentication**: Optional (token provided in body)

**Body**:
```json
{
  "idToken": "firebase-id-token-string"
}
```

**Response**:
```json
{
  "valid": true,
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Status Codes**:
- `200` - Token valid
- `401` - Token invalid or expired
- `400` - Missing token
- `500` - Server error

## Gemini Chatbot API

### POST /api/chat/gemini

Send message to Gemini AI and receive response.

**Authentication**: Required

**Body**:
```json
{
  "message": "Hello, how are you?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant", 
      "content": "Previous response"
    }
  ]
}
```

**Response**:
```json
{
  "response": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid message format
- `401` - Unauthorized
- `429` - Rate limit exceeded
- `500` - Server error

## Health Check API

### GET /api/health

Check application health and database connectivity.

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected",
  "firebase": "connected"
}
```

**Status Codes**:
- `200` - All systems healthy
- `503` - Service unavailable

## Error Handling

### Standard Error Response Format

All API endpoints return errors in this format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `FILE_TOO_LARGE` - Uploaded file exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file format
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DATABASE_ERROR` - Database operation failed
- `FIREBASE_ERROR` - Firebase service error
- `GEMINI_API_ERROR` - Gemini AI service error

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `413` - Payload Too Large
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

### Limits

- **General API**: 100 requests per minute per user
- **File Upload**: 10 uploads per minute per user
- **Gemini Chat**: 20 messages per minute per user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Models

### Image Model

```typescript
interface Image {
  id: number;
  filename: string;
  originalName: string;
  firebaseUrl: string;
  uploadedAt: string; // ISO 8601
  uploadedBy: string; // User email
  labels?: Label[];
}
```

### Label Model

```typescript
interface Label {
  id: number;
  imageId: number;
  name: string;
  confidence: number; // 0-1
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string; // ISO 8601
  createdBy: string; // User email
}
```

### User Model

```typescript
interface User {
  uid: string; // Firebase UID
  email: string;
  name?: string;
  photoURL?: string;
}
```

## SDK Examples

### JavaScript/TypeScript

```javascript
// Authentication
const token = await firebase.auth().currentUser.getIdToken();

// Upload image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('originalName', 'my-image.jpg');

const response = await fetch('/api/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

// Create label
const label = await fetch('/api/labels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageId: 1,
    name: 'cat',
    confidence: 0.95,
    x: 100,
    y: 150,
    width: 200,
    height: 180
  })
});
```

### Python

```python
import requests

# Authentication
headers = {'Authorization': f'Bearer {firebase_token}'}

# Get images
response = requests.get(
    'http://localhost:3000/api/images',
    headers=headers,
    params={'page': 1, 'limit': 10}
)

# Create label
label_data = {
    'imageId': 1,
    'name': 'cat',
    'confidence': 0.95,
    'x': 100,
    'y': 150,
    'width': 200,
    'height': 180
}

response = requests.post(
    'http://localhost:3000/api/labels',
    headers={**headers, 'Content-Type': 'application/json'},
    json=label_data
)
```

## Testing

### Test Authentication

```bash
# Get Firebase ID token (replace with actual token)
TOKEN="your-firebase-id-token"

# Test token verification
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"idToken": "'$TOKEN'"}'
```

### Test Image Upload

```bash
# Upload image
curl -X POST http://localhost:3000/api/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "originalName=test-image.jpg"
```

### Test Label Creation

```bash
# Create label
curl -X POST http://localhost:3000/api/labels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": 1,
    "name": "cat",
    "confidence": 0.95,
    "x": 100,
    "y": 150,
    "width": 200,
    "height": 180
  }'
```