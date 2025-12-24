/**
 * Authentication Context
 * 
 * React Context for managing Firebase authentication state on the client side
 * Provides user state and authentication methods throughout the application
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

/**
 * Authentication Provider Component
 * Manages Firebase authentication state and provides auth methods
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [idToken, setIdToken] = useState(null);

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data
     */
    const signIn = async (email, password) => {
        try {
            setLoading(true);

            // This would typically use Firebase Auth SDK
            // For now, we'll simulate the authentication flow
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const userData = await response.json();
            setUser(userData);
            setIdToken(userData.customToken);

            return userData;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign up with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} displayName - User display name
     * @returns {Promise<Object>} User data
     */
    const signUp = async (email, password, displayName) => {
        try {
            setLoading(true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, displayName })
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const userData = await response.json();
            setUser(userData);
            setIdToken(userData.customToken);

            return userData;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign in with Google OAuth
     * @param {string} googleIdToken - Google ID token
     * @returns {Promise<Object>} User data
     */
    const signInWithGoogle = async (googleIdToken) => {
        try {
            setLoading(true);

            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idToken: googleIdToken })
            });

            if (!response.ok) {
                throw new Error('Google authentication failed');
            }

            const userData = await response.json();
            setUser(userData);
            setIdToken(userData.customToken);

            return userData;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign out current user
     */
    const signOut = async () => {
        try {
            setLoading(true);

            if (user?.uid) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ uid: user.uid })
                });
            }

            setUser(null);
            setIdToken(null);
        } catch (error) {
            console.error('Sign out error:', error);
            // Still clear local state even if API call fails
            setUser(null);
            setIdToken(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verify current ID token
     * @returns {Promise<boolean>} Token validity
     */
    const verifyToken = async () => {
        if (!idToken) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idToken })
            });

            return response.ok;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    };

    /**
     * Refresh authentication token
     * This would typically handle token refresh automatically
     */
    const refreshToken = async () => {
        try {
            if (!user) return;

            // In a real implementation, this would refresh the Firebase token
            // For now, we'll just verify the current token
            const isValid = await verifyToken();

            if (!isValid) {
                // Token is invalid, sign out user
                await signOut();
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            await signOut();
        }
    };

    // Initialize authentication state on mount
    useEffect(() => {
        // Check for stored authentication state
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');

        if (storedUser && storedToken) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIdToken(storedToken);

                // Verify token is still valid
                verifyToken().then(isValid => {
                    if (!isValid) {
                        localStorage.removeItem('auth_user');
                        localStorage.removeItem('auth_token');
                        setUser(null);
                        setIdToken(null);
                    }
                });
            } catch (error) {
                console.error('Error parsing stored auth data:', error);
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
            }
        }

        setLoading(false);
    }, []);

    // Store authentication state in localStorage when it changes
    useEffect(() => {
        if (user && idToken) {
            localStorage.setItem('auth_user', JSON.stringify(user));
            localStorage.setItem('auth_token', idToken);
        } else {
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
        }
    }, [user, idToken]);

    // Set up token refresh interval
    useEffect(() => {
        if (user && idToken) {
            // Refresh token every 50 minutes (Firebase tokens expire after 1 hour)
            const interval = setInterval(refreshToken, 50 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user, idToken]);

    const value = {
        user,
        loading,
        idToken,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        verifyToken,
        refreshToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export default AuthContext;