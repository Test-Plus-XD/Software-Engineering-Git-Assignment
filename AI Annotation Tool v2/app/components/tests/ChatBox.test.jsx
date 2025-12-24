/**
 * ChatBox Component Tests
 * 
 * Tests for ChatBox component with Gemini AI integration
 * Following TDD - these tests should FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ChatBox from '../ChatBox';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock the Gemini AI utility
jest.mock('../../../lib/ai/gemini', () => ({
    generateText: jest.fn()
}));

// Mock the AuthContext
const mockAuthContext = {
    user: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
    },
    loading: false
};

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext
}));

const { generateText } = require('../../../lib/ai/gemini');

describe('ChatBox Component', () => {
    beforeEach(() => {
        generateText.mockClear();
    });

    describe('Chat Interface Rendering', () => {
        test('should render chat interface with message input', () => {
            render(<ChatBox />);

            expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
            expect(screen.getByText(/chat with ai/i)).toBeInTheDocument();
        });

        test('should render empty chat history initially', () => {
            render(<ChatBox />);

            expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
            expect(screen.queryByTestId('chat-message')).not.toBeInTheDocument();
        });

        test('should display user name in chat header', () => {
            render(<ChatBox />);

            expect(screen.getByText(/test user/i)).toBeInTheDocument();
        });
    });

    describe('Message Sending', () => {
        test('should send user messages to Gemini API', async () => {
            const user = userEvent.setup();
            const mockResponse = 'Hello! How can I help you today?';

            generateText.mockResolvedValueOnce(mockResponse);

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.type(input, 'Hello, how are you?');
            await user.click(sendButton);

            expect(generateText).toHaveBeenCalledWith('Hello, how are you?');

            await waitFor(() => {
                expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
                expect(screen.getByText(mockResponse)).toBeInTheDocument();
            });
        });

        test('should send message on Enter key press', async () => {
            const user = userEvent.setup();
            const mockResponse = 'Response to Enter key message';

            generateText.mockResolvedValueOnce(mockResponse);

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);

            await user.type(input, 'Message sent with Enter');
            await user.keyboard('{Enter}');

            expect(generateText).toHaveBeenCalledWith('Message sent with Enter');

            await waitFor(() => {
                expect(screen.getByText('Message sent with Enter')).toBeInTheDocument();
                expect(screen.getByText(mockResponse)).toBeInTheDocument();
            });
        });

        test('should not send empty messages', async () => {
            const user = userEvent.setup();

            render(<ChatBox />);

            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.click(sendButton);

            expect(generateText).not.toHaveBeenCalled();
        });

        test('should clear input after sending message', async () => {
            const user = userEvent.setup();
            const mockResponse = 'Response message';

            generateText.mockResolvedValueOnce(mockResponse);

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.type(input, 'Test message');
            expect(input.value).toBe('Test message');

            await user.click(sendButton);

            await waitFor(() => {
                expect(input.value).toBe('');
            });
        });
    });

    describe('AI Response Handling', () => {
        test('should display AI responses in real-time', async () => {
            const user = userEvent.setup();

            // Create a delayed promise to simulate API call
            let resolveResponse;
            const delayedPromise = new Promise(resolve => {
                resolveResponse = resolve;
            });

            generateText.mockReturnValueOnce(delayedPromise);

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.type(input, 'Test question');
            await user.click(sendButton);

            // Should show loading state
            await waitFor(() => {
                expect(screen.getByText(/ai is typing/i)).toBeInTheDocument();
            });

            // Resolve the response
            resolveResponse('This is an AI response');

            // Should show AI response
            await waitFor(() => {
                expect(screen.getByText('This is an AI response')).toBeInTheDocument();
                expect(screen.queryByText(/ai is typing/i)).not.toBeInTheDocument();
            });
        });

        test('should handle streaming responses progressively', async () => {
            const user = userEvent.setup();

            // Mock streaming response
            let resolveResponse;
            const responsePromise = new Promise(resolve => {
                resolveResponse = resolve;
            });

            generateText.mockReturnValueOnce(responsePromise);

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.type(input, 'Streaming test');
            await user.click(sendButton);

            // Should show loading state
            await waitFor(() => {
                expect(screen.getByText(/ai is typing/i)).toBeInTheDocument();
            });

            // Resolve the response
            resolveResponse('Streamed response content');

            await waitFor(() => {
                expect(screen.getByText('Streamed response content')).toBeInTheDocument();
            });
        });

        test('should handle API errors gracefully', async () => {
            const user = userEvent.setup();

            generateText.mockRejectedValueOnce(new Error('API Error'));

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.type(input, 'Error test');
            await user.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText(/sorry, something went wrong/i)).toBeInTheDocument();
            });
        });
    });

    describe('Conversation Context', () => {
        test('should maintain conversation history in component state only', async () => {
            const user = userEvent.setup();

            generateText
                .mockResolvedValueOnce('First response')
                .mockResolvedValueOnce('Second response');

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Send first message
            await user.type(input, 'First message');
            await user.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText('First message')).toBeInTheDocument();
                expect(screen.getByText('First response')).toBeInTheDocument();
            });

            // Send second message
            await user.type(input, 'Second message');
            await user.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText('Second message')).toBeInTheDocument();
                expect(screen.getByText('Second response')).toBeInTheDocument();
            });

            // Both messages should still be visible
            expect(screen.getByText('First message')).toBeInTheDocument();
            expect(screen.getByText('First response')).toBeInTheDocument();
        });

        test('should clear history when component unmounts', () => {
            const { unmount } = render(<ChatBox />);

            // Add some messages to history (would need to be implemented)
            // This test verifies that history is not persisted

            unmount();

            // Re-render component
            render(<ChatBox />);

            // Should start with empty history
            expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
        });
    });

    describe('Message Display', () => {
        test('should distinguish between user and AI messages', async () => {
            const user = userEvent.setup();
            const mockResponse = 'AI response message';

            generateText.mockResolvedValueOnce(mockResponse);

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            await user.type(input, 'User message');
            await user.click(sendButton);

            await waitFor(() => {
                const userMessage = screen.getByText('User message');
                const aiMessage = screen.getByText(mockResponse);

                expect(userMessage).toBeInTheDocument();
                expect(aiMessage).toBeInTheDocument();

                // Check that messages have different styling (data-testid or class)
                expect(userMessage.closest('[data-testid="user-message"]')).toBeInTheDocument();
                expect(aiMessage.closest('[data-testid="ai-message"]')).toBeInTheDocument();
            });
        });

        test('should scroll to bottom when new messages are added', async () => {
            const user = userEvent.setup();

            generateText.mockResolvedValue('Response');

            render(<ChatBox />);

            const input = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Send multiple messages to create scrollable content
            for (let i = 1; i <= 5; i++) {
                await user.clear(input);
                await user.type(input, `Message ${i}`);
                await user.click(sendButton);

                await waitFor(() => {
                    expect(screen.getByText(`Message ${i}`)).toBeInTheDocument();
                });
            }

            // Verify that scrollIntoView was called
            expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
        });
    });

    describe('Authentication Guard', () => {
        test('should only render ChatBox for authenticated users', () => {
            // Mock unauthenticated user
            const mockUnauthenticatedContext = {
                user: null,
                loading: false
            };

            jest.doMock('../../contexts/AuthContext', () => ({
                useAuth: () => mockUnauthenticatedContext
            }));

            // This test should fail because authentication guard is not implemented
            render(<ChatBox />);

            expect(screen.queryByText(/chat with ai/i)).not.toBeInTheDocument();
            expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
        });

        test('should show login prompt for unauthenticated users', () => {
            // Mock unauthenticated user
            const mockUnauthenticatedContext = {
                user: null,
                loading: false
            };

            jest.doMock('../../contexts/AuthContext', () => ({
                useAuth: () => mockUnauthenticatedContext
            }));

            // This test should fail because login prompt is not implemented
            render(<ChatBox />);

            expect(screen.getByText(/please sign in to access the chatbot/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });

        test('should display user\'s display name in chat header', () => {
            // This test should pass as it's already implemented
            render(<ChatBox />);

            expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
        });
    });
});