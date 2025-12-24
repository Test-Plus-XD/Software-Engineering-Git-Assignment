/**
 * Firebase Authentication Utility Tests
 * 
 * Tests for Firebase ID token verification via Vercel API
 * Following TDD - these tests should FAIL initially
 */

const { verifyIdToken } = require('../firebase-auth');

describe('Firebase Authentication Utility', () => {
    describe('verifyIdToken()', () => {
        test('should validate Firebase ID tokens successfully', async () => {
            const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';

            const result = await verifyIdToken(mockToken);

            expect(result).toBeDefined();
            expect(result.uid).toBeDefined();
            expect(result.email).toBeDefined();
            expect(result.valid).toBe(true);
        });

        test('should reject invalid tokens', async () => {
            const invalidToken = 'invalid.token.here';

            await expect(verifyIdToken(invalidToken)).rejects.toThrow();
        });

        test('should extract user information from verified tokens', async () => {
            const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';

            const result = await verifyIdToken(mockToken);

            expect(result).toHaveProperty('uid');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('displayName');
            expect(result).toHaveProperty('emailVerified');
        });

        test('should handle token expiration gracefully', async () => {
            const expiredToken = 'expired.token.here';

            await expect(verifyIdToken(expiredToken)).rejects.toThrow('Token expired');
        });

        test('should handle network errors gracefully', async () => {
            // Mock network failure
            const originalFetch = global.fetch;
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';

            await expect(verifyIdToken(mockToken)).rejects.toThrow('Network error');

            global.fetch = originalFetch;
        });

        test('should handle API errors from Vercel endpoint', async () => {
            // Mock API error response
            const originalFetch = global.fetch;
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Invalid token' })
            });

            const mockToken = 'invalid.token';

            await expect(verifyIdToken(mockToken)).rejects.toThrow('Invalid token');

            global.fetch = originalFetch;
        });
    });
});