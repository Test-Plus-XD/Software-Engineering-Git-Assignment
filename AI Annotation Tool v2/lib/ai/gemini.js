/**
 * Gemini AI API Utility
 * 
 * Handles Gemini AI text generation via Vercel API
 */

const VERCEL_API_BASE = 'https://vercel-express-api-alpha.vercel.app';
const API_PASSCODE = 'PourRice';

/**
 * Generates text using Gemini AI via Vercel API
 * @param {string} prompt - Text prompt for AI generation
 * @returns {Promise<string>} Generated text response
 * @throws {Error} If generation fails or prompt is invalid
 */
async function generateText(prompt) {
    // Validate input prompt
    if (typeof prompt !== 'string') {
        throw new Error('Prompt must be a string');
    }

    if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
    }

    try {
        const response = await fetch(`${VERCEL_API_BASE}/API/Gemini/generate`, {
            method: 'POST',
            headers: {
                'x-api-passcode': API_PASSCODE,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt.trim() })
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (jsonError) {
            throw new Error('Failed to parse API response');
        }

        if (!response.ok) {
            const errorMessage = responseData.error || `HTTP ${response.status}`;

            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }

            if (response.status >= 500) {
                throw new Error('Internal server error');
            }

            throw new Error(errorMessage);
        }

        // Validate response format
        if (typeof responseData.result === 'undefined') {
            throw new Error('Invalid API response format');
        }

        if (typeof responseData.result !== 'string') {
            throw new Error('Invalid API response format');
        }

        return responseData.result;
    } catch (error) {
        // Handle network errors
        if (error.message.includes('fetch') || error.message.includes('Network connection failed') || error.name === 'TypeError') {
            throw new Error('Network error: Unable to connect to AI service');
        }

        // Re-throw other errors as-is
        throw error;
    }
}

/**
 * Generates text with retry logic for rate limiting
 * @param {string} prompt - Text prompt for AI generation
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<string>} Generated text response
 */
async function generateTextWithRetry(prompt, maxRetries = 3, retryDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await generateText(prompt);
        } catch (error) {
            lastError = error;

            // Only retry on rate limit errors
            if (error.message.includes('Rate limit exceeded') && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                continue;
            }

            // Don't retry on other errors
            throw error;
        }
    }

    throw lastError;
}

/**
 * Validates if a prompt is suitable for AI generation
 * @param {string} prompt - Text prompt to validate
 * @returns {Object} Validation result with valid flag and issues array
 */
function validatePrompt(prompt) {
    const issues = [];

    if (typeof prompt !== 'string') {
        issues.push('Prompt must be a string');
    } else {
        if (prompt.trim().length === 0) {
            issues.push('Prompt cannot be empty');
        }

        if (prompt.length > 10000) {
            issues.push('Prompt is too long (maximum 10,000 characters)');
        }

        // Check for potentially harmful content (basic check)
        const harmfulPatterns = [
            /\b(hack|exploit|malware|virus)\b/i,
            /\b(illegal|criminal|fraud)\b/i
        ];

        for (const pattern of harmfulPatterns) {
            if (pattern.test(prompt)) {
                issues.push('Prompt contains potentially harmful content');
                break;
            }
        }
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

module.exports = {
    generateText,
    generateTextWithRetry,
    validatePrompt
};