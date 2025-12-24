/**
 * Firebase Authentication Utility
 * 
 * Handles Firebase ID token verification via Vercel API
 */

const VERCEL_API_BASE = 'https://vercel-express-api-alpha.vercel.app';
const API_PASSCODE = 'PourRice';

/**
 * Verifies a Firebase ID token using the Vercel API
 * @param {string} idToken - Firebase ID token to verify
 * @returns {Promise<Object>} Verified user information
 * @throws {Error} If token is invalid or verification fails
 */
async function verifyIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
        throw new Error('Invalid token format');
    }

    try {
        const response = await fetch(`${VERCEL_API_BASE}/API/Auth/verify`, {
            method: 'POST',
            headers: {
                'x-api-passcode': API_PASSCODE,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idToken })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}`;

            if (response.status === 401) {
                throw new Error('Token expired');
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.valid) {
            throw new Error('Invalid token');
        }

        return {
            valid: data.valid,
            uid: data.uid,
            email: data.email,
            displayName: data.displayName,
            emailVerified: data.emailVerified,
            photoURL: data.photoURL,
            profile: data.profile
        };
    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error('Network error');
        }
        throw error;
    }
}

module.exports = {
    verifyIdToken
};