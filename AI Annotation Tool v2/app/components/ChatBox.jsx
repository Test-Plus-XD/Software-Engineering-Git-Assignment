/**
 * ChatBox Component
 * 
 * React component for AI chatbot interface with Gemini integration
 * Maintains conversation history in React state only (session-only)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateText } from '../../lib/ai/gemini';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatBox = () => {
    const { user, loading } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Show loading state while authentication is being checked
    if (loading) {
        return (
            <div className="flex flex-col h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show login prompt for unauthenticated users
    if (!user) {
        return (
            <div className="flex flex-col h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Authentication Required
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Please sign in to access the chatbot
                        </p>
                        <button
                            onClick={() => {
                                // This would typically redirect to login page or open login modal
                                console.log('Redirect to sign in');
                            }}
                            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                     transition-colors duration-200"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Scroll to bottom when new messages are added
    const scrollToBottom = () => {
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending messages
    const handleSendMessage = async () => {
        const trimmedMessage = inputMessage.trim();

        if (!trimmedMessage) {
            return; // Don't send empty messages
        }

        // Add user message to chat
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: trimmedMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage(''); // Clear input immediately
        setIsLoading(true);

        try {
            // Generate AI response
            const aiResponse = await generateText(trimmedMessage);

            // Add AI response to chat
            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: aiResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI generation error:', error);

            // Add error message to chat
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Sorry, something went wrong. Please try again.',
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Format timestamp for display
    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">AI</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Chat with AI
                        </h3>
                        {user && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Welcome, {user.displayName || user.email}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div
                ref={chatContainerRef}
                data-testid="chat-messages"
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <p>Start a conversation with the AI assistant!</p>
                        <p className="text-sm mt-2">Ask questions, get help, or just chat.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">AI is typing...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
            />
        </div>
    );
};

export default ChatBox;