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

const ChatBox = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

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
                        <div
                            key={message.id}
                            data-testid={message.type === 'user' ? 'user-message' : 'ai-message'}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : message.isError
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${message.type === 'user'
                                    ? 'text-blue-100'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {formatTime(message.timestamp)}
                                </p>
                            </div>
                        </div>
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;