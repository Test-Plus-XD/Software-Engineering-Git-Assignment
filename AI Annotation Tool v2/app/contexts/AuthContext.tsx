/**
 * Authentication Context
 * 
 * React Context for managing Firebase authentication state on the client side
 * Provides user state and authentication methods throughout the application
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase/config';

// Define types for the authentication context
interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
    type: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    idToken: string | null;
    signIn: (email: string, password: string) => Promise<User>;
    signUp: (email: string, password: string, displayName: string) => Promise<User>;
    signInWithGoogle: () => Promise<User>;
    signOut: () => Promise<void>;
    verifyToken: () => Promise<boolean>;
    refreshToken: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Manages Firebase authentication state and provides auth methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [idToken, setIdToken] = useState<string | null>(null);

    /**
     * Convert Firebase user to our User type and sync with Vercel API
     */
    const processFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
        try {
            // Get Firebase ID token
            const token = await firebaseUser.getIdToken();

            // Send to Vercel API for processing
            const response = await fetch('https://vercel-express-api-alpha.vercel.app/API/Auth/login', {
                method: 'POST',
                headers: {
                    'x-api-passcode': 'PourRice',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: firebaseUser.email,
                    idToken: token
                })
            });

            let userData;
            if (response.ok) {
                userData = await response.json();
            } else {
                // If user doesn't exist in API, create basic user data
                userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || 'User',
                    photoURL: firebaseUser.photoURL,
                    emailVerified: firebaseUser.emailVerified,
                    profile: { type: 'customer' }
                };
            }

            const mappedUser: User = {
                uid: userData.uid || firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                displayName: userData.displayName || firebaseUser.displayName || 'User',
                photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
                emailVerified: userData.emailVerified ?? firebaseUser.emailVerified,
                type: userData.profile?.type || 'customer'
            };

            setUser(mappedUser);
            setIdToken(token);

            return mappedUser;
        } catch (error) {
            console.error('Error processing Firebase user:', error);
            throw error;
        }
    };

    /**
     * Sign in with email and password
     */
    const signIn = async (email: string, password: string): Promise<User> => {
        try {
            setLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return await processFirebaseUser(userCredential.user);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign up with email and password
     */
    const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
        try {
            setLoading(true);

            // Create user with Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with display name
            await updateProfile(userCredential.user, { displayName });

            // Register with Vercel API
            const token = await userCredential.user.getIdToken();

            try {
                await fetch('https://vercel-express-api-alpha.vercel.app/API/Auth/register', {
                    method: 'POST',
                    headers: {
                        'x-api-passcode': 'PourRice',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password, // Note: In production, don't send password to your API
                        displayName,
                        type: 'customer'
                    })
                });
            } catch (apiError) {
                console.warn('Failed to register with API:', apiError);
                // Continue even if API registration fails
            }

            return await processFirebaseUser(userCredential.user);
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign in with Google
     */
    const signInWithGoogle = async (): Promise<User> => {
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, googleProvider);

            // Get Firebase ID token
            const token = await result.user.getIdToken();

            // Send to Vercel API Google endpoint
            try {
                const response = await fetch('https://vercel-express-api-alpha.vercel.app/API/Auth/google', {
                    method: 'POST',
                    headers: {
                        'x-api-passcode': 'PourRice',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ idToken: token })
                });

                if (response.ok) {
                    const userData = await response.json();
                    const mappedUser: User = {
                        uid: userData.uid,
                        email: userData.email,
                        displayName: userData.displayName,
                        photoURL: userData.photoURL,
                        emailVerified: userData.emailVerified,
                        type: userData.profile?.type || 'customer'
                    };

                    setUser(mappedUser);
                    setIdToken(userData.customToken || token);
                    return mappedUser;
                }
            } catch (apiError) {
                console.warn('API call failed, using Firebase data:', apiError);
            }

            // Fallback to Firebase user data
            return await processFirebaseUser(result.user);
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign out current user
     */
    const signOut = async (): Promise<void> => {
        try {
            setLoading(true);

            if (user?.uid) {
                try {
                    await fetch('https://vercel-express-api-alpha.vercel.app/API/Auth/logout', {
                        method: 'POST',
                        headers: {
                            'x-api-passcode': 'PourRice',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ uid: user.uid })
                    });
                } catch (apiError) {
                    console.warn('API logout failed:', apiError);
                }
            }

            await firebaseSignOut(auth);
            setUser(null);
            setIdToken(null);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reset password
     */
    const resetPassword = async (email: string): Promise<void> => {
        try {
            // Try Vercel API first
            try {
                await fetch('https://vercel-express-api-alpha.vercel.app/API/Auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'x-api-passcode': 'PourRice',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
            } catch (apiError) {
                console.warn('API reset failed, using Firebase:', apiError);
                // Fallback to Firebase
                await sendPasswordResetEmail(auth, email);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    /**
     * Verify current ID token
     */
    const verifyToken = async (): Promise<boolean> => {
        if (!idToken) return false;

        try {
            const response = await fetch('https://vercel-express-api-alpha.vercel.app/API/Auth/verify', {
                method: 'POST',
                headers: {
                    'x-api-passcode': 'PourRice',
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
     */
    const refreshToken = async (): Promise<void> => {
        try {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken(true); // Force refresh
                setIdToken(token);
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            await signOut();
        }
    };

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    await processFirebaseUser(firebaseUser);
                } else {
                    setUser(null);
                    setIdToken(null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                setUser(null);
                setIdToken(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Set up token refresh interval
    useEffect(() => {
        if (user && idToken) {
            // Refresh token every 50 minutes (Firebase tokens expire after 1 hour)
            const interval = setInterval(refreshToken, 50 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user, idToken]);

    const value: AuthContextType = {
        user,
        loading,
        idToken,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        verifyToken,
        refreshToken,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export default AuthContext;