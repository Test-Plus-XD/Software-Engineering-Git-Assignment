/**
 * Authentication Middleware Tests
 * 
 * Tests for Next.js middleware that verifies Firebase ID tokens
 * Following TDD - these tests should FAIL initially
 */

const { authenticate } = require('../auth');

// Mock the firebase-auth utility
jest.mock('../../../lib/auth/firebase-auth', () => ({
    verifyIdToken: jest.fn()
}));

const { verifyIdToken } = require('../../../lib/auth/firebase-auth');

describe('Authentication Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            user: null
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
        verifyIdToken.mockClear();
    });

    describe('authenticate middleware', () => {
        test('should verify Firebase ID tokens from Authorization header', async () => {
            const mockToken = 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...';
            const mockUser = {
                uid: 'abc123xyz',
                email: 'john@example.com',
                displayName: 'John Doe',
                emailVerified: true
            };

            mockRequest.headers.authorization = mockToken;
            verifyIdToken.mockResolvedValueOnce(mockUser);

            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(verifyIdToken).toHaveBeenCalledWith('eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...');
            expect(mockRequest.user).toEqual(mockUser);
            expect(nextFunction).toHaveBeenCalled();
        });

        test('should attach user info to request object', async () => {
            const mockToken = 'Bearer valid.token.here';
            const mockUser = {
                uid: 'user123',
                email: 'test@example.com',
                displayName: 'Test User',
                emailVerified: true
            };

            mockRequest.headers.authorization = mockToken;
            verifyIdToken.mockResolvedValueOnce(mockUser);

            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user.uid).toBe('user123');
            expect(mockRequest.user.email).toBe('test@example.com');
            expect(nextFunction).toHaveBeenCalled();
        });

        test('should reject requests without tokens', async () => {
            // No authorization header
            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authorization token required'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should reject requests with malformed tokens', async () => {
            mockRequest.headers.authorization = 'InvalidTokenFormat';

            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid authorization format'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should reject expired tokens', async () => {
            const expiredToken = 'Bearer expired.token.here';
            mockRequest.headers.authorization = expiredToken;
            verifyIdToken.mockRejectedValueOnce(new Error('Token expired'));

            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Token expired'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should handle invalid tokens gracefully', async () => {
            const invalidToken = 'Bearer invalid.token.here';
            mockRequest.headers.authorization = invalidToken;
            verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid token'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should handle network errors gracefully', async () => {
            const validToken = 'Bearer valid.token.here';
            mockRequest.headers.authorization = validToken;
            verifyIdToken.mockRejectedValueOnce(new Error('Network error'));

            await authenticate(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication service unavailable'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});