import NodeCache from "node-cache";
import logger from "./logger.js";

/**
 * In-memory cache with TTL (Time To Live)
 * stdTTL: 300 seconds (5 minutes) default
 * checkperiod: 60 seconds - check for expired keys every 60 seconds
 */
const cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
    useClones: false // Better performance, don't clone objects
});

/**
 * Cache middleware factory
 * Creates middleware that caches responses for GET requests
 *
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET" && req.method !== "POST") {
            return next();
        }

        // Create cache key from URL and request body
        const cacheKey = req.method === "GET"
            ? req.originalUrl
            : `${req.originalUrl}_${JSON.stringify(req.body)}`;

        // Try to get cached response
        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse) {
            logger.debug(`Cache HIT: ${cacheKey}`);
            return res.json(cachedResponse);
        }

        logger.debug(`Cache MISS: ${cacheKey}`);

        // Store original res.json function
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = (body) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(cacheKey, body, duration);
                logger.debug(`Cache SET: ${cacheKey} (TTL: ${duration}s)`);
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Invalidate cache by pattern
 * Useful when data is updated and cache needs to be cleared
 *
 * @param {string} pattern - Pattern to match cache keys (supports wildcards)
 */
export const invalidateCache = (pattern) => {
    const keys = cache.keys();
    const matchedKeys = keys.filter(key => {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(key);
    });

    matchedKeys.forEach(key => cache.del(key));

    if (matchedKeys.length > 0) {
        logger.info(`Cache invalidated: ${matchedKeys.length} keys matching "${pattern}"`);
    }

    return matchedKeys.length;
};

/**
 * Clear all cache
 */
export const clearCache = () => {
    const keyCount = cache.keys().length;
    cache.flushAll();
    logger.info(`Cache cleared: ${keyCount} keys removed`);
    return keyCount;
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    return cache.getStats();
};

export default cache;
