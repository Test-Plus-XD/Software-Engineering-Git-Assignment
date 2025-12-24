/**
 * Authentication Component
 * 
 * Simple authentication interface for sign in/sign up with Google OAuth support
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

const AuthComponent = () => {
    const { user, loading, signIn, signUp, signOut } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                await signUp(email, password, displayName);
            } else {
                await signIn(email, password);
            }
        } catch (error) {
            setError(error.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            setError('Sign out failed');
        }
    };

    const handleGoogleError = (errorMessage) => {
        setError(errorMessage);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
        );
    }

    if (user) {
        return (
            <div data-testid="user-info" className="flex items-center space-x-4">
                {user.photoURL && (
                    <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                    />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {user.displayName || user.email}
                </span>
                <button
                    data-testid="signout-button"
                    onClick={handleSignOut}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div data-testid="auth-container" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
                {isSignUp ? 'Sign Up' : 'Sign In'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
                    {error}
                </div>
            )}

            {/* Google Sign-In Button */}
            <div className="mb-6">
                <GoogleSignInButton onError={handleGoogleError} />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        Or continue with email
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Display Name
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={isSignUp}
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        data-testid="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                    </label>
                    <input
                        id="password"
                        data-testid="password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    data-testid={isSignUp ? "signup-button" : "signin-button"}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-200"
                >
                    {isSubmitting ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                >
                    {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
            </div>
        </div>
    );
};

export default AuthComponent;