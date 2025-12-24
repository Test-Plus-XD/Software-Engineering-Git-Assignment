/**
 * Complete User Workflow E2E Tests
 * 
 * End-to-end tests for the complete user workflow using Playwright
 * Following TDD - these tests should FAIL initially
 */

const { test, expect } = require('@playwright/test');

test.describe('Complete User Workflow E2E Tests', () => {
    test.describe('Firebase Authentication Integration', () => {
        test('should allow user to sign in with Firebase authentication', async ({ page }) => {
            // Navigate to the application
            await page.goto('/');

            // Should see login/signup interface
            await expect(page.locator('[data-testid="auth-container"]')).toBeVisible();

            // Fill in authentication form
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');

            // Click sign in button
            await page.click('[data-testid="signin-button"]');

            // Should be redirected to main application
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Should see user's display name or email
            await expect(page.locator('[data-testid="user-info"]')).toContainText('test@example.com');
        });

        test('should persist authentication state across page refreshes', async ({ page }) => {
            // Navigate to the application and sign in first
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');

            // Wait for authentication to complete
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Refresh the page
            await page.reload();

            // Should still be authenticated
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();
            await expect(page.locator('[data-testid="user-info"]')).toContainText('test@example.com');
        });
    });

    test.describe('Image Upload via Firebase Storage', () => {
        test('should allow user to upload image via Firebase Storage', async ({ page }) => {
            // Navigate to the application and sign in
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to upload section
            await page.click('[data-testid="upload-section"]');

            // Should see upload interface
            await expect(page.locator('[data-testid="upload-container"]')).toBeVisible();

            // Upload a test image file
            const fileInput = page.locator('[data-testid="file-input"]');
            await fileInput.setInputFiles('tests/fixtures/test-image.jpg');

            // Click upload button
            await page.click('[data-testid="upload-button"]');

            // Should see upload progress
            await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

            // Should see success message
            await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

            // Should see uploaded image in the gallery
            await expect(page.locator('[data-testid="image-card"]').first()).toBeVisible();
        });

        test('should display uploaded image with correct metadata', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Check that image is displayed correctly
            const imageCard = page.locator('[data-testid="image-card"]').first();
            await expect(imageCard).toBeVisible();

            // Should show image filename
            await expect(imageCard.locator('[data-testid="image-filename"]')).toContainText('test-image.jpg');

            // Should show image preview
            await expect(imageCard.locator('[data-testid="image-preview"]')).toBeVisible();

            // Should have labels section
            await expect(imageCard.locator('[data-testid="labels-section"]')).toBeVisible();
        });
    });

    test.describe('Chatbot Access After Login', () => {
        test('should allow access to chatbot only after user login', async ({ page }) => {
            // Navigate to the application and sign in
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to chatbot section
            await page.click('[data-testid="chatbot-section"]');

            // Should see chatbot interface (user is authenticated)
            await expect(page.locator('[data-testid="chatbox"]')).toBeVisible();

            // Should see chat header with user's name
            await expect(page.locator('[data-testid="chat-header"]')).toContainText('test@example.com');

            // Should see message input
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
        });

        test('should show login prompt for unauthenticated users', async ({ page }) => {
            // Navigate to application without signing in
            await page.goto('/');

            // Navigate to chatbot section
            await page.click('[data-testid="chatbot-section"]');

            // Should see login prompt instead of chatbot
            await expect(page.locator('[data-testid="auth-required"]')).toBeVisible();
            await expect(page.locator('[data-testid="signin-prompt"]')).toContainText('Please sign in to access the chatbot');

            // Should not see chatbot interface
            await expect(page.locator('[data-testid="chat-input"]')).not.toBeVisible();
        });
    });

    test.describe('Chatbot Conversation Workflow', () => {
        test('should allow chatbot conversation to work correctly', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to chatbot
            await page.click('[data-testid="chatbot-section"]');

            // Type a message
            const chatInput = page.locator('[data-testid="chat-input"]');
            await chatInput.fill('Hello, how are you?');

            // Send message
            await page.click('[data-testid="send-button"]');

            // Should see user message in chat
            await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, how are you?');

            // Should see loading indicator
            await expect(page.locator('[data-testid="ai-typing"]')).toBeVisible();

            // Should eventually see AI response
            await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });

            // Input should be cleared
            await expect(chatInput).toHaveValue('');
        });

        test('should maintain conversation history during session', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to chatbot
            await page.click('[data-testid="chatbot-section"]');

            // Send first message
            let chatInput = page.locator('[data-testid="chat-input"]');
            await chatInput.fill('Hello, how are you?');
            await page.click('[data-testid="send-button"]');
            await expect(page.locator('[data-testid="user-message"]').first()).toContainText('Hello, how are you?');

            // Send another message
            await chatInput.fill('What is artificial intelligence?');
            await page.click('[data-testid="send-button"]');

            // Should see both previous and new messages
            await expect(page.locator('[data-testid="user-message"]')).toHaveCount(2);
            await expect(page.locator('[data-testid="user-message"]').first()).toContainText('Hello, how are you?');
            await expect(page.locator('[data-testid="user-message"]').last()).toContainText('What is artificial intelligence?');

            // Should see AI responses
            await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(2);
        });

        test('should clear chat history when page is refreshed', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to chatbot and send a message
            await page.click('[data-testid="chatbot-section"]');
            const chatInput = page.locator('[data-testid="chat-input"]');
            await chatInput.fill('This should not persist');
            await page.click('[data-testid="send-button"]');
            await expect(page.locator('[data-testid="user-message"]')).toContainText('This should not persist');

            // Refresh the page
            await page.reload();

            // Navigate back to chatbot
            await page.click('[data-testid="chatbot-section"]');

            // Should see empty chat (session-only storage)
            await expect(page.locator('[data-testid="empty-chat"]')).toBeVisible();
            await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
            await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(0);
        });
    });

    test.describe('Annotation Data Persistence', () => {
        test('should ensure all annotation data persists correctly in SQLite', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to an image
            await page.click('[data-testid="image-card"]').first();

            // Add a label
            await page.click('[data-testid="add-label-button"]');
            await page.fill('[data-testid="label-input"]', 'Test Label');
            await page.click('[data-testid="save-label-button"]');

            // Should see the label
            await expect(page.locator('[data-testid="label"]')).toContainText('Test Label');

            // Refresh page
            await page.reload();

            // Label should still be there (persisted in SQLite)
            await expect(page.locator('[data-testid="label"]')).toContainText('Test Label');
        });

        test('should verify chat history is not persisted in database', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');
            await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

            // Navigate to chatbot
            await page.click('[data-testid="chatbot-section"]');

            // Send a message
            const chatInput = page.locator('[data-testid="chat-input"]');
            await chatInput.fill('This message should not persist');
            await page.click('[data-testid="send-button"]');

            // Should see the message
            await expect(page.locator('[data-testid="user-message"]')).toContainText('This message should not persist');

            // Refresh page
            await page.reload();

            // Navigate back to chatbot
            await page.click('[data-testid="chatbot-section"]');

            // Message should be gone (not persisted)
            await expect(page.locator('[data-testid="empty-chat"]')).toBeVisible();
            await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
        });
    });

    test.describe('Complete Integration Verification', () => {
        test('should verify all systems work together correctly', async ({ page }) => {
            // Navigate and authenticate
            await page.goto('/');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'testpassword123');
            await page.click('[data-testid="signin-button"]');

            // 1. Authentication works
            await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

            // 2. Image upload and storage works
            await page.click('[data-testid="upload-section"]');
            await expect(page.locator('[data-testid="image-card"]')).toHaveCount.greaterThan(0);

            // 3. Annotation system works
            await page.click('[data-testid="image-card"]').first();
            await expect(page.locator('[data-testid="labels-section"]')).toBeVisible();

            // 4. Chatbot works for authenticated users
            await page.click('[data-testid="chatbot-section"]');
            await expect(page.locator('[data-testid="chatbox"]')).toBeVisible();

            // 5. All data persistence works correctly
            // SQLite for annotations, session-only for chat
            await page.reload();
            await expect(page.locator('[data-testid="image-card"]')).toHaveCount.greaterThan(0);
            await page.click('[data-testid="chatbot-section"]');
            await expect(page.locator('[data-testid="empty-chat"]')).toBeVisible();
        });
    });
});