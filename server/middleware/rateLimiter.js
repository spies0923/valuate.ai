import rateLimit from "express-rate-limit";

/**
 * General rate limiter for all API endpoints
 * Limits to 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for AI valuation endpoints
 * These are expensive operations that consume OpenAI credits
 * Limits to 10 requests per 15 minutes per IP
 */
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 AI requests per windowMs
    message: {
        success: false,
        message: "AI valuation rate limit exceeded. Please wait before submitting more answer sheets."
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests that fail early (before hitting OpenAI)
    skipFailedRequests: true,
});

/**
 * Moderate rate limiter for creation endpoints
 * Limits to 20 requests per 15 minutes per IP
 */
export const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        success: false,
        message: "Too many creation requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Lenient rate limiter for read-only endpoints
 * Limits to 200 requests per 15 minutes per IP
 */
export const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});
