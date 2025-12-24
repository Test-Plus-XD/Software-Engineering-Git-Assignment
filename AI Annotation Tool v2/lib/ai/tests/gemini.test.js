/**
 * Gemini AI API Utility Tests
 * 
 * Tests for Gemini AI text generation via Vercel API
 * Following TDD - these tests should FAIL initially
 */

const { generateText } = require('../gemini');

// Mock fetch globally
global.fetch = jest.fn();

describe('Gemini AI API Utility', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    describe('generateText()', () => {
        test('should call Vercel API with prompt and return AI-generated content', async () => {
            const mockPrompt = 'Hello, how are you?';
            const mockResponse = {
                success: true,
                response: 'Hello! I\'m doing well, thank you for asking. How can I help you today?'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await generateText(mockPrompt);

            expect(fetch).toHaveBeenCalledWith(
                'https://vercel-express-api-alpha.vercel.app/API/Gemini/generate',
                {
                    method: 'POST',
                    headers: {
                        'x-api-passcode': 'PourRice',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: mockPrompt })
                }
            );

            expect(result).toBe(mockResponse.response);
        });

        test('should return AI-generated content for various prompts', async () => {
            const testCases = [
                {
                    prompt: 'What is artificial intelligence?',
                    response: 'Artificial intelligence (AI) is a branch of computer science...'
                },
                {
                    prompt: 'Tell me a joke',
                    response: 'Why don\'t scientists trust atoms? Because they make up everything!'
                },
                {
                    prompt: 'Explain quantum physics simply',
                    response: 'Quantum physics is the study of matter and energy at the smallest scales...'
                }
            ];

            for (const testCase of testCases) {
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        response: testCase.response
                    })
                });

                const result = await generateText(testCase.prompt);
                expect(result).toBe(testCase.response);
            }
        });

        test('should handle API errors gracefully', async () => {
            const mockPrompt = 'Test prompt';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid prompt format'
                })
            });

            await expect(generateText(mockPrompt)).rejects.toThrow('Invalid prompt format');
        });

        test('should handle network errors gracefully', async () => {
            const mockPrompt = 'Test prompt';

            fetch.mockRejectedValueOnce(new Error('Network connection failed'));

            await expect(generateText(mockPrompt)).rejects.toThrow('Network error: Unable to connect to AI service');
        });

        test('should respect rate limiting', async () => {
            const mockPrompt = 'Test prompt';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Rate limit exceeded'
                })
            });

            await expect(generateText(mockPrompt)).rejects.toThrow('Rate limit exceeded');
        });

        test('should handle server errors gracefully', async () => {
            const mockPrompt = 'Test prompt';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Internal server error'
                })
            });

            await expect(generateText(mockPrompt)).rejects.toThrow('Internal server error');
        });

        test('should validate prompt input', async () => {
            // Test empty prompt
            await expect(generateText('')).rejects.toThrow('Prompt cannot be empty');

            // Test null prompt
            await expect(generateText(null)).rejects.toThrow('Prompt must be a string');

            // Test undefined prompt
            await expect(generateText(undefined)).rejects.toThrow('Prompt must be a string');

            // Test non-string prompt
            await expect(generateText(123)).rejects.toThrow('Prompt must be a string');
        });

        test('should handle malformed API responses', async () => {
            const mockPrompt = 'Test prompt';

            // Test response without success field
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    response: 'Some response'
                })
            });

            await expect(generateText(mockPrompt)).rejects.toThrow('Invalid API response format');

            // Test response without response field
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true
                })
            });

            await expect(generateText(mockPrompt)).rejects.toThrow('Invalid API response format');
        });

        test('should handle JSON parsing errors', async () => {
            const mockPrompt = 'Test prompt';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON'))
            });

            await expect(generateText(mockPrompt)).rejects.toThrow('Failed to parse API response');
        });
    });
});