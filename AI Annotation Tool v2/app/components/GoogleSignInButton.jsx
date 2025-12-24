/**
 * Google Sign-In Button Component
 * 
 * Handles Google OAuth authentication using Google Identity Services
 * Integrates with Vercel Express API for authentication
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleSignInButton = ({ onError }) => {
    const { signInWithGoogle } = useAuth();
    const buttonRef = useRef(null);
    const [isLoading, setIsLoading] = React.useState(false);

    useEffect(() => {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                // Render the button
                if (buttonRef.current) {
                    window.google.accounts.id.renderButton(buttonRef.current, {
                        theme: 'outline',
                        size: 'large',
                        width: '100%',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                    });
                }
            }
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const handleCredentialResponse = async (response) => {
        try {
            setIsLoading(true);

            // Use the Google ID token with Vercel API
            await signInWithGoogle(response.credential);
        } catch (error) {
            console.error('Google sign-in error:', error);
            if (onError) {
                onError(error.message || 'Google sign-in failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div ref={buttonRef} className="w-full" />
            {isLoading && (
                <div className="flex items-center justify-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Signing in with Google...
                    </span>
                </div>
            )}
        </div>
    );
};

export default GoogleSignInButton;