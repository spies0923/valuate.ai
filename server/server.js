import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import valuatorRouter from "./routes/valuators.js";
import healthRouter from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import logger, { requestLogger } from "./utils/logger.js";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["DB_URL", "OPENAI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const app = express();

// Trust proxy - needed for rate limiting behind reverse proxies (Vercel, Nginx, etc.)
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use(requestLogger);

// Rate limiting - apply to all routes
app.use(generalLimiter);

// Routes
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Valuate.ai API",
        version: "2.0.0",
        docs: "/health for health check endpoints"
    });
});

app.use("/health", healthRouter);
app.use("/valuators", valuatorRouter);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection with error handling
async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URL);
        logger.info("Connected to MongoDB successfully");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

// Handle MongoDB connection errors after initial connection
mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

// Start server
const port = process.env.PORT || 8080;

connectDB();
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});