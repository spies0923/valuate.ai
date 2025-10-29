import OpenAI from "openai";

/**
 * Singleton OpenAI client
 */
let openaiClient = null;

const getOpenAIClient = () => {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set in environment variables");
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on certain errors
            if (error.status === 400 || error.status === 401 || error.status === 403) {
                throw error;
            }

            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

/**
 * Parse AI response JSON with robust error handling
 * @param {string} content - Raw response content from OpenAI
 * @returns {Object} Parsed JSON object
 */
const parseAIResponse = (content) => {
    try {
        // Try to find JSON in markdown code block
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }

        // Try to find JSON without markdown
        const jsonOnlyMatch = content.match(/\{[\s\S]*\}/);
        if (jsonOnlyMatch) {
            return JSON.parse(jsonOnlyMatch[0]);
        }

        // If no JSON pattern found, try parsing the entire content
        return JSON.parse(content);
    } catch (error) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Failed to parse AI response. The response format was unexpected.");
    }
};

/**
 * Call OpenAI Vision API with retry logic
 * @param {Array} messages - Chat messages
 * @param {number} maxTokens - Maximum tokens for response
 */
const callOpenAIWithRetry = async (messages, maxTokens = 2000) => {
    const openai = getOpenAIClient();

    return await retryWithBackoff(async () => {
        const completion = await openai.chat.completions.create({
            // Using gpt-4o - the latest stable multimodal model
            // Supports vision, faster, and more cost-effective than gpt-4-vision-preview
            model: "gpt-4o",
            messages: messages,
            max_tokens: maxTokens,
        });

        return completion;
    });
};

export { getOpenAIClient, retryWithBackoff, parseAIResponse, callOpenAIWithRetry };
