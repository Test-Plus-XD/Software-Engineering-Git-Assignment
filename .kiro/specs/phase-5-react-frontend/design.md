# Design Document - Phase 5: React Frontend Components

## Overview

This design document outlines the implementation of React frontend components for the AI Annotation Tool v2. The frontend will provide a modern, responsive user interface that integrates with the existing API endpoints and database layer. The design emphasizes component reusability, proper state management, comprehensive testing, and visual enhancement through wave animations.

## Architecture

### Component Architecture
The frontend follows a component-based architecture with clear separation of concerns:

- **Presentation Components**: Pure components focused on rendering UI
- **Container Components**: Components that manage state and API interactions
- **Custom Hooks**: Reusable logic for form validation and data fetching
- **Server Components**: Next.js server components for data fetching
- **Client Components**: Interactive components with client-side state

### State Management Strategy
- **Server State**: Managed through Next.js Server Components and API routes
- **Client State**: Managed through React hooks (useState, useEffect)
- **Form State**: Managed through custom validation hooks
- **Global State**: Minimal global state, preferring prop drilling and composition

### Integration Points
- **API Layer**: Existing REST endpoints (/api/images, /api/labels)
- **Database**: SQLite via existing data access layer
- **Storage**: Firebase Storage via existing utilities
- **Styling**: TailwindCSS with custom components

## Components and Interfaces

### ImageCard Component
**Purpose**: Display individual images with labels and loading states

**Props Interface**:
```typescript
interface ImageCardProps {
  image: {
    image_id: number;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
    labels: string[];
    confidences: number[];
    label_count: number;
  };
  onLabelClick?: (label: string) => void;
  className?: string;
}
```

**Key Features**:
- Loading skeleton while image loads
- Error boundary for failed image loads
- Label display with confidence scores
- Responsive image sizing
- Hover effects and animations

### ImageGallery Component
**Purpose**: Display grid of images with pagination and empty states

**Props Interface**:
```typescript
interface ImageGalleryProps {
  page?: number;
  limit?: number;
  searchQuery?: string;
  selectedLabel?: string;
}
```

**Key Features**:
- Server-side data fetching
- Responsive grid layout (1-3 columns based on screen size)
- Empty state when no images
- Pagination controls
- Loading states

### UploadForm Component
**Purpose**: Handle file uploads with validation and progress tracking

**Props Interface**:
```typescript
interface UploadFormProps {
  onUploadSuccess?: (image: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
}
```

**Key Features**:
- Drag and drop file upload
- File type and size validation
- Upload progress indication
- Preview before upload
- Success/error notifications

### LabelSelector Component
**Purpose**: Multi-select label interface with inline creation

**Props Interface**:
```typescript
interface LabelSelectorProps {
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  allowCreate?: boolean;
  placeholder?: string;
}
```

**Key Features**:
- Dropdown with search functionality
- Multiple selection with visual chips
- Inline label creation
- Duplicate prevention
- Keyboard navigation

### SearchBar Component
**Purpose**: Search and filter interface

**Props Interface**:
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterByLabel: (label: string | null) => void;
  availableLabels: string[];
  initialQuery?: string;
  initialLabel?: string;
}
```

**Key Features**:
- Real-time search input
- Label filter dropdown
- Clear filters functionality
- URL state synchronization

## Data Models

### Image Data Model
```typescript
interface Image {
  image_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  updated_at?: string;
  labels: string[];
  confidences: number[];
  label_count: number;
}
```

### Label Data Model
```typescript
interface Label {
  label_id: number;
  label_name: string;
  label_description?: string;
  created_at: string;
  usage_count?: number;
}
```

### API Response Models
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    totalImages: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

### Upload Progress Model
```typescript
interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, several can be consolidated to eliminate redundancy:

- **Responsive Layout Properties (6.1-6.3)**: These can be combined into a single comprehensive responsive design property
- **Upload Validation Properties (2.1-2.2)**: These can be combined into a comprehensive file validation property
- **API Integration Properties (8.1-8.3)**: These can be combined into a single API endpoint usage property
- **Label Selection Properties (3.2-3.4)**: These can be combined into comprehensive label management property

### Correctness Properties

**Property 1: Responsive grid layout adaptation**
*For any* viewport size, the ImageGallery component should display the appropriate number of columns (1 for mobile, 2 for tablet, 3+ for desktop)
**Validates: Requirements 1.1, 6.1, 6.2, 6.3**

**Property 2: Image loading state management**
*For any* image in the ImageCard component, loading states should be displayed while the image loads and error states should be shown for failed loads
**Validates: Requirements 1.2, 1.3**

**Property 3: Label display completeness**
*For any* image with associated labels, the ImageCard component should display all labels with their confidence scores
**Validates: Requirements 1.5**

**Property 4: File upload validation**
*For any* file selected for upload, the UploadForm component should validate file type and size, rejecting invalid files with appropriate error messages
**Validates: Requirements 2.1, 2.2**

**Property 5: Upload progress tracking**
*For any* file upload operation, the UploadForm component should display progress indication during upload and appropriate success/error messages upon completion
**Validates: Requirements 2.3, 2.4, 2.5**

**Property 6: Label selection management**
*For any* label selection operation, the LabelSelector component should prevent duplicates, allow multiple selections, and provide visual feedback for selected labels
**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

**Property 7: Form validation feedback**
*For any* form with validation rules, the system should provide real-time feedback for invalid inputs and prevent submission when validation fails
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 8: Network error handling**
*For any* API call that fails, the system should display user-friendly error messages and handle errors gracefully
**Validates: Requirements 4.4, 8.4**

**Property 9: Motion accessibility**
*For any* user with reduced motion preferences, the system should respect those preferences and reduce or disable animations
**Validates: Requirements 5.5**

**Property 10: Touch interaction responsiveness**
*For any* touch interaction, the system should provide appropriate touch targets and feedback
**Validates: Requirements 6.5**

**Property 11: Screen orientation adaptation**
*For any* screen orientation change, the system should adapt the layout appropriately
**Validates: Requirements 6.4**

**Property 12: API endpoint consistency**
*For any* data operation (fetch, upload, label management), the system should use the correct existing API endpoints
**Validates: Requirements 8.1, 8.2, 8.3**

**Property 13: UI data synchronization**
*For any* data update operation, the UI should refresh to reflect the changes immediately
**Validates: Requirements 8.5**

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Retry mechanisms with exponential backoff
- **Validation Errors**: Real-time feedback with clear error messages
- **File Upload Errors**: Specific error messages for different failure types
- **Image Loading Errors**: Fallback images and error states

### Error Boundary Implementation
- Global error boundary for unhandled React errors
- Component-specific error boundaries for critical sections
- Error logging and reporting for debugging
- Graceful degradation when components fail

### User Feedback Strategy
- Toast notifications for success/error messages
- Inline validation messages for forms
- Loading states for async operations
- Progress indicators for long-running operations

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements

Unit tests will cover:
- Component rendering with specific props
- User interaction handlers (clicks, form submissions)
- Error boundary behavior
- Integration points between components
- Specific edge cases (empty states, error states)

### Property-Based Testing Requirements

Property-based testing will use **@fast-check/jest** for JavaScript/React testing. Each property-based test will:
- Run a minimum of 100 iterations to ensure thorough testing
- Be tagged with comments explicitly referencing the correctness property
- Use the format: **Feature: phase-5-react-frontend, Property {number}: {property_text}**
- Generate random but valid inputs to test universal properties

Each correctness property will be implemented by a single property-based test that validates the property holds across all valid inputs.

### Testing Tools and Framework
- **Jest**: Primary testing framework
- **React Testing Library**: Component testing utilities
- **@fast-check/jest**: Property-based testing library
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **@testing-library/user-event**: User interaction simulation

## Visual Design and Wave Integration

### Wave Animation Implementation
- **Library**: react-wavify for smooth wave animations
- **Placement**: Background elements that don't interfere with content
- **Performance**: Optimized animations with CSS transforms
- **Accessibility**: Respect prefers-reduced-motion settings

### Design System
- **Colors**: Consistent with existing TailwindCSS theme
- **Typography**: Clear hierarchy with readable fonts
- **Spacing**: Consistent spacing scale using Tailwind utilities
- **Components**: Reusable component library with consistent styling

### Responsive Design
- **Mobile-first**: Design starts with mobile and scales up
- **Breakpoints**: Standard Tailwind breakpoints (sm, md, lg, xl)
- **Grid System**: CSS Grid for image gallery, Flexbox for components
- **Touch Targets**: Minimum 44px touch targets for mobile

## Performance Considerations

### Image Optimization
- **Next.js Image Component**: Automatic optimization and lazy loading
- **Responsive Images**: Multiple sizes for different screen densities
- **Loading States**: Skeleton screens while images load
- **Error Handling**: Fallback images for failed loads

### Bundle Optimization
- **Code Splitting**: Dynamic imports for non-critical components
- **Tree Shaking**: Remove unused code from bundles
- **Lazy Loading**: Load components only when needed
- **Caching**: Proper cache headers for static assets

### Runtime Performance
- **React Optimization**: useMemo and useCallback for expensive operations
- **Virtual Scrolling**: For large image galleries (future enhancement)
- **Debounced Search**: Prevent excessive API calls during typing
- **Optimistic Updates**: Update UI before API confirmation

## Security Considerations

### File Upload Security
- **Client-side Validation**: File type and size validation
- **Server-side Validation**: Additional validation on the server
- **Sanitization**: Proper file name sanitization
- **Content-Type Checking**: Verify actual file content matches extension

### API Security
- **Authentication**: Proper token handling for authenticated requests
- **Input Validation**: Validate all user inputs before API calls
- **Error Handling**: Don't expose sensitive information in error messages
- **CSRF Protection**: Use Next.js built-in CSRF protection

### XSS Prevention
- **Input Sanitization**: Sanitize user-generated content
- **Content Security Policy**: Implement proper CSP headers
- **React Safety**: Leverage React's built-in XSS protection
- **Validation**: Validate all props and user inputs