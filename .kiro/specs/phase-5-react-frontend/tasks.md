# Implementation Plan - Phase 5: React Frontend Components

## Overview

This implementation plan converts the Phase 5 design into a series of TDD-focused tasks for implementing React frontend components. Each task follows the Test-Driven Development cycle: write failing tests first, then implement minimal code to pass, then refactor if needed. The plan builds incrementally, ensuring each component integrates properly with the existing API layer.

## Task List

- [x] 1. Set up component testing infrastructure






  - Create Jest configuration for React component testing
  - Set up React Testing Library and testing utilities
  - Configure MSW for API mocking in tests
  - Set up @fast-check/jest for property-based testing
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Implement ImageCard component with TDD

- [x] 2.1 Write failing tests for ImageCard component


  - **Test renders image with src from Firebase URL**
  - **Test displays all associated labels with confidence scores**
  - **Test shows loading state whilst image loads**
  - **Test handles missing image gracefully with error state**
  - **Test responsive image sizing across different screen sizes**
  - All tests fail (component not implemented)
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 2.2 Write property test for ImageCard label display


  - **Property 3: Label display completeness**
  - **Validates: Requirements 1.5**

- [x] 2.3 Write property test for ImageCard loading states


  - **Property 2: Image loading state management**
  - **Validates: Requirements 1.2, 1.3**

- [x] 2.4 Implement ImageCard component with loading states


  - Create ImageCard displaying image and labels
  - Add loading skeleton using TailwindCSS
  - Add error boundary for failed image loads
  - Implement responsive image sizing
  - Tests now pass
  - _Requirements: 1.2, 1.3, 1.5_

- [-] 3. Implement ImageGallery component with TDD

- [x] 3.1 Write failing tests for ImageGallery component


  - **Test renders grid of ImageCard components**
  - **Test displays empty state when no images**
  - **Test handles pagination with page controls**
  - **Test responsive grid layout (1-3 columns based on screen size)**
  - All tests fail (component not implemented)
  - _Requirements: 1.1, 1.4, 6.1, 6.2, 6.3_

- [x] 3.2 Write property test for responsive grid layout



  - **Property 1: Responsive grid layout adaptation**
  - **Validates: Requirements 1.1, 6.1, 6.2, 6.3**

- [x] 3.3 Implement ImageGallery as Server Component





  - Create ImageGallery with server-side data fetching
  - Fetch images directly from database using existing API
  - Render responsive grid of ImageCard components
  - Implement empty state with proper messaging
  - Add pagination controls
  - Tests now pass
  - _Requirements: 1.1, 1.4, 6.1, 6.2, 6.3, 8.1_

- [x] 4. Implement UploadForm component with TDD


- [x] 4.1 Write failing tests for UploadForm component


  - **Test renders file input and submit button**
  - **Test validates file type before submission**
  - **Test validates file size limits**
  - **Test displays upload progress during upload**
  - **Test shows success message after upload**
  - **Test shows error message on failure with retry option**
  - **Test drag and drop functionality**
  - All unit tests pass (11/11 passing)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [~] 4.2 Write property test for file upload validation


  - **Property 4: File upload validation**
  - **Status: Environment limitation - DOM cleanup incompatible with fast-check**
  - **Validates: Requirements 2.1, 2.2**

- [~] 4.3 Write property test for upload progress tracking



  - **Property 5: Upload progress tracking**
  - **Status: Environment limitation - DOM cleanup incompatible with fast-check**
  - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 4.4 Implement UploadForm as Client Component


  - Create UploadForm with drag and drop support
  - Add file type and size validation before upload
  - Implement progress tracking with progress bar
  - Add success/error toast notifications
  - Connect to existing POST /api/images endpoint
  - All unit tests pass (11/11 passing)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.2_

- [ ] 5. Implement LabelSelector component with TDD




- [x] 5.1 Write failing tests for LabelSelector component


  - **Test renders dropdown of available labels**
  - **Test allows multiple label selection without duplicates**
  - **Test allows creating new labels inline**
  - **Test prevents duplicate label additions with warning**
  - **Test provides visual feedback for selected labels**
  - **Test keyboard navigation support**
  - All tests fail (component not implemented)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.2 Write property test for label selection management




  - **Property 6: Label selection management**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [x] 5.3 Implement LabelSelector with inline label creation


  - Create LabelSelector with multi-select dropdown
  - Add search functionality within dropdown
  - Implement "Create new label" option
  - Add duplicate prevention with user feedback
  - Connect to existing labels API endpoints
  - Tests now pass
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.3_

- [-] 6. Create custom form validation hook


- [-] 6.1 Write failing tests for useFormValidation hook

  - **Test provides real-time validation feedback**
  - **Test prevents submission when validation fails**
  - **Test allows submission when validation passes**
  - **Test handles different validation rules**
  - All tests fail (hook not implemented)
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 6.2 Write property test for form validation feedback
  - **Property 7: Form validation feedback**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6.3 Implement useFormValidation custom hook
  - Create reusable validation logic
  - Implement real-time validation feedback
  - Add form submission prevention for invalid states
  - Reduce duplication across form components
  - Tests now pass
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 7. Add wave animations and visual enhancements
- [ ] 7.1 Write failing tests for wave animation integration
  - **Test wave components render when application loads**
  - **Test motion reduction preferences are respected**
  - **Test wave animations don't interfere with content**
  - All tests fail (wave integration not implemented)
  - _Requirements: 5.1, 5.5_

- [ ] 7.2 Write property test for motion accessibility
  - **Property 9: Motion accessibility**
  - **Validates: Requirements 5.5**

- [ ] 7.3 Implement wave animations using react-wavify
  - Add wave background components using react-wavify
  - Ensure animations respect prefers-reduced-motion
  - Position waves to complement content without interference
  - Optimize performance with CSS transforms
  - Tests now pass
  - _Requirements: 5.1, 5.5_

- [ ] 8. Implement responsive design and touch interactions
- [ ] 8.1 Write failing tests for responsive behavior
  - **Test layout adapts to different screen sizes**
  - **Test orientation changes trigger layout updates**
  - **Test touch interactions provide appropriate feedback**
  - **Test touch targets meet minimum size requirements**
  - All tests fail (responsive features not fully implemented)
  - _Requirements: 6.4, 6.5_

- [ ] 8.2 Write property test for touch interaction responsiveness
  - **Property 10: Touch interaction responsiveness**
  - **Validates: Requirements 6.5**

- [ ] 8.3 Write property test for screen orientation adaptation
  - **Property 11: Screen orientation adaptation**
  - **Validates: Requirements 6.4**

- [ ] 8.4 Enhance responsive design and touch support
  - Improve touch targets for mobile devices
  - Add touch feedback animations
  - Enhance orientation change handling
  - Optimize layouts for different screen sizes
  - Tests now pass
  - _Requirements: 6.4, 6.5_

- [ ] 9. Add comprehensive error handling and API integration
- [ ] 9.1 Write failing tests for error handling
  - **Test network errors display user-friendly messages**
  - **Test API integration uses correct endpoints**
  - **Test UI synchronization after data updates**
  - **Test error boundaries handle component failures**
  - All tests fail (comprehensive error handling not implemented)
  - _Requirements: 4.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.2 Write property test for network error handling
  - **Property 8: Network error handling**
  - **Validates: Requirements 4.4, 8.4**

- [ ] 9.3 Write property test for API endpoint consistency
  - **Property 12: API endpoint consistency**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 9.4 Write property test for UI data synchronization
  - **Property 13: UI data synchronization**
  - **Validates: Requirements 8.5**

- [ ] 9.5 Implement comprehensive error handling
  - Add global error boundary component
  - Implement network error handling with retry logic
  - Ensure all API calls use correct existing endpoints
  - Add UI refresh mechanisms after data updates
  - Tests now pass
  - _Requirements: 4.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Update main page layout and integrate components
- [ ] 10.1 Write failing tests for main page integration
  - **Test main page renders all components correctly**
  - **Test component integration works seamlessly**
  - **Test page layout is responsive and accessible**
  - All tests fail (main page not updated)
  - _Requirements: All requirements integration_

- [ ] 10.2 Update app/page.tsx with new component layout
  - Replace default Next.js content with annotation tool UI
  - Integrate ImageGallery, UploadForm, and other components
  - Add proper page structure with header and navigation
  - Implement wave background integration
  - Tests now pass
  - _Requirements: All requirements integration_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Testing Strategy Notes

### TDD Workflow for Each Component
1. **Write failing tests first** - Create comprehensive test cases that fail
2. **Run tests** - Verify tests fail for the right reasons
3. **Write minimal implementation** - Code just enough to make tests pass
4. **Run tests again** - Verify tests now pass
5. **Refactor if needed** - Improve code while keeping tests green
6. **Commit** - Commit with the specified message format

### Property-Based Testing Implementation
- Each property test will use @fast-check/jest
- Tests will run minimum 100 iterations
- Tests will be tagged with: **Feature: phase-5-react-frontend, Property {number}: {property_text}**
- Generators will create realistic test data matching API responses

### Component Testing Approach
- Use React Testing Library for component rendering and interaction
- Mock API calls using MSW (Mock Service Worker)
- Test user interactions with @testing-library/user-event
- Focus on behavior testing rather than implementation details

### Integration Testing
- Test component integration with existing API endpoints
- Verify data flow between components
- Test error handling across component boundaries
- Ensure responsive behavior works correctly