/**
 * Firebase Authentication Utility Tests
 * 
 * Tests for Firebase ID token verification via Vercel API
 * Following TDD - these tests should FAIL initially
 */

const { verifyIdToken } = require('../firebase-auth');

// Mock fetch globally
global.fetch = jest.fn();

describe('Firebase Authentication Utility', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    describe('verifyIdToken()', () => {
        test('should validate Firebase ID tokens successfully', async () => {
            const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';
            const mockResponse = {
                valid: true,
                uid: 'abc123xyz',
                email: 'john@example.com',
                displayName: 'John Doe',
                emailVerified: true,
                photoURL: 'https://example.com/photo.jpg'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await verifyIdToken(mockToken);

            expect(result).toBeDefined();
            expect(result.uid).toBeDefined();
            expect(result.email).toBeDefined();
            expect(result.valid).toBe(true);
        });

        test('should reject invalid tokens', async () => {
            const invalidToken = 'invalid.token.here';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ error: 'Invalid token format' })
            });

            await expect(verifyIdToken(invalidToken)).rejects.toThrow();
        });

        test('should extract user information from verified tokens', async () => {
            const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';
            const mockResponse = {
                valid: true,
                uid: 'abc123xyz',
                email: 'john@example.com',
                displayName: 'John Doe',
                emailVerified: true,
                photoURL: 'https://example.com/photo.jpg'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await verifyIdToken(mockToken);

            expect(result).toHaveProperty('uid');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('displayName');
            expect(result).toHaveProperty('emailVerified');
        });

        test('should handle token expiration gracefully', async () => {
            const expiredToken = 'expired.token.here';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Token expired' })
            });

            await expect(verifyIdToken(expiredToken)).rejects.toThrow('Token expired');
        });

        test('should handle network errors gracefully', async () => {
            const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';

            fetch.mockRejectedValueOnce(new Error('fetch failed'));

            await expect(verifyIdToken(mockToken)).rejects.toThrow('Network error');
        });

        test('should handle API errors from Vercel endpoint', async () => {
            const mockToken = 'invalid.token';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ error: 'Invalid token' })
            });

            await expect(verifyIdToken(mockToken)).rejects.toThrow('Invalid token');
        });
    });
});