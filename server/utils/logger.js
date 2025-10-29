import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        errors({ stack: true }), // Handle error stack traces
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: combine(
                colorize(),
                logFormat
            )
        }),
        // Write all logs with level 'error' to error.log
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error"
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: "logs/combined.log"
        }),
    ],
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({ filename: "logs/exceptions.log" })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: "logs/rejections.log" })
    ],
});

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
export const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress
        };

        const logMessage = `${logData.method} ${logData.url} - ${logData.status} - ${logData.duration} - ${logData.ip}`;

        if (res.statusCode >= 500) {
            logger.error(logMessage);
        } else if (res.statusCode >= 400) {
            logger.warn(logMessage);
        } else {
            logger.info(logMessage);
        }
    });

    next();
};

export default logger;
