/**
 * Global Error Handler Middleware
 * Centralizes error handling and provides consistent error responses
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error("Error occurred:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method
    });

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }

    // Handle Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: err.details.map(d => d.message)
        });
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token expired"
        });
    }

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate entry found"
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

export { errorHandler, notFoundHandler };
