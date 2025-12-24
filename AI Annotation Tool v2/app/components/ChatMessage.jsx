/**
 * ChatMessage Component
 * 
 * Individual chat message display component
 * Handles both user and AI messages with appropriate styling
 */

'use client';

import React from 'react';

const ChatMessage = ({ message }) => {
    // Format timestamp for display
    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
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
    );
};

export default ChatMessage;