/**
 * Authentication Middleware
 * 
 * Middleware for Next.js API routes that verifies Firebase ID tokens
 */

const { verifyIdToken } = require('../../lib/auth/firebase-auth');

/**
 * Authentication middleware for API routes
 * Verifies Firebase ID token and attaches user info to request
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // Check if authorization header exists
        if (!authHeader) {
            return res.status(401).json({
                error: 'Authorization token required'
            });
        }

        // Check if authorization header has correct format (Bearer token)
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Invalid authorization format'
            });
        }

        // Extract token from header
        const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            // Verify token using Firebase auth utility
            const user = await verifyIdToken(idToken);

            // Attach user information to request object
            req.user = user;

            // Continue to next middleware/handler
            next();
        } catch (error) {
            // Handle specific authentication errors
            if (error.message.includes('Token expired')) {
                return res.status(401).json({
                    error: 'Token expired'
                });
            }

            if (error.message.includes('Invalid token')) {
                return res.status(401).json({
                    error: 'Invalid token'
                });
            }

            if (error.message.includes('Network error')) {
                return res.status(500).json({
                    error: 'Authentication service unavailable'
                });
            }

            // Generic authentication error
            return res.status(401).json({
                error: 'Authentication failed'
            });
        }
    } catch (error) {
        // Handle unexpected errors
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}

module.exports = {
    authenticate
};