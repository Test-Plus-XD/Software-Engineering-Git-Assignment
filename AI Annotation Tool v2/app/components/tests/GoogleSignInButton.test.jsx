/**
 * Google Sign-In Button Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleSignInButton from '../GoogleSignInButton';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: jest.fn()
}));

// Mock Google Identity Services
const mockGoogle = {
    accounts: {
        id: {
            initialize: jest.fn(),
            renderButton: jest.fn(),
            prompt: jest.fn()
        }
    }
};

describe('GoogleSignInButton', () => {
    const mockSignInWithGoogle = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock useAuth hook
        useAuth.mockReturnValue({
            signInWithGoogle: mockSignInWithGoogle
        });

        // Mock window.google
        global.window.google = mockGoogle;

        // Mock document.createElement and script loading
        const mockScript = {
            src: '',
            async: false,
            defer: false,
            onload: null
        };

        jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'script') {
                return mockScript;
            }
            return document.createElement(tagName);
        });

        jest.spyOn(document.head, 'appendChild').mockImplementation((element) => {
            if (element === mockScript) {
                // Simulate script loading
                setTimeout(() => {
                    if (element.onload) {
                        element.onload();
                    }
                }, 0);
            }
        });

        jest.spyOn(document.head, 'removeChild').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.window.google;
    });

    it('renders without crashing', () => {
        render(<GoogleSignInButton onError={mockOnError} />);
        expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('loads Google Identity Services script', async () => {
        render(<GoogleSignInButton onError={mockOnError} />);

        await waitFor(() => {
            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(document.head.appendChild).toHaveBeenCalled();
        });
    });

    it('initializes Google Identity Services when script loads', async () => {
        render(<GoogleSignInButton onError={mockOnError} />);

        await waitFor(() => {
            expect(mockGoogle.accounts.id.initialize).toHaveBeenCalledWith({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: expect.any(Function),
                auto_select: false,
                cancel_on_tap_outside: true,
            });
        });
    });

    it('renders Google sign-in button when Google is loaded', async () => {
        render(<GoogleSignInButton onError={mockOnError} />);

        await waitFor(() => {
            expect(mockGoogle.accounts.id.renderButton).toHaveBeenCalledWith(
                expect.any(Object), // button ref
                {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                }
            );
        });
    });

    it('handles credential response correctly', async () => {
        const mockCredential = 'mock_google_id_token';
        mockSignInWithGoogle.mockResolvedValue({ uid: 'test-uid' });

        render(<GoogleSignInButton onError={mockOnError} />);

        await waitFor(() => {
            expect(mockGoogle.accounts.id.initialize).toHaveBeenCalled();
        });

        // Get the callback function passed to initialize
        const initializeCall = mockGoogle.accounts.id.initialize.mock.calls[0];
        const callback = initializeCall[0].callback;

        // Simulate credential response
        await callback({ credential: mockCredential });

        expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockCredential);
    });

    it('handles sign-in errors correctly', async () => {
        const mockCredential = 'mock_google_id_token';
        const mockError = new Error('Sign-in failed');
        mockSignInWithGoogle.mockRejectedValue(mockError);

        render(<GoogleSignInButton onError={mockOnError} />);

        await waitFor(() => {
            expect(mockGoogle.accounts.id.initialize).toHaveBeenCalled();
        });

        // Get the callback function
        const initializeCall = mockGoogle.accounts.id.initialize.mock.calls[0];
        const callback = initializeCall[0].callback;

        // Simulate credential response with error
        await callback({ credential: mockCredential });

        expect(mockOnError).toHaveBeenCalledWith('Sign-in failed');
    });

    it('shows loading state during sign-in', async () => {
        const mockCredential = 'mock_google_id_token';
        let resolveSignIn;
        const signInPromise = new Promise((resolve) => {
            resolveSignIn = resolve;
        });
        mockSignInWithGoogle.mockReturnValue(signInPromise);

        render(<GoogleSignInButton onError={mockOnError} />);

        await waitFor(() => {
            expect(mockGoogle.accounts.id.initialize).toHaveBeenCalled();
        });

        // Get the callback function
        const initializeCall = mockGoogle.accounts.id.initialize.mock.calls[0];
        const callback = initializeCall[0].callback;

        // Start sign-in process
        callback({ credential: mockCredential });

        // Check loading state
        await waitFor(() => {
            expect(screen.getByText('Signing in with Google...')).toBeInTheDocument();
        });

        // Resolve sign-in
        resolveSignIn({ uid: 'test-uid' });

        // Check loading state is gone
        await waitFor(() => {
            expect(screen.queryByText('Signing in with Google...')).not.toBeInTheDocument();
        });
    });

    it('cleans up script on unmount', () => {
        const { unmount } = render(<GoogleSignInButton onError={mockOnError} />);

        unmount();

        expect(document.head.removeChild).toHaveBeenCalled();
    });
});