import express from "express";
import mongoose from "mongoose";
import { getCacheStats } from "../utils/cache.js";
import Valuator from "../models/Valuator.js";
import Valuation from "../models/Valuation.js";

const router = express.Router();

/**
 * Basic health check endpoint
 * Returns 200 if service is running
 */
router.get("/", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Detailed health check with dependency status
 * Checks database connection, cache, and provides system stats
 */
router.get("/detailed", async (req, res) => {
    const health = {
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
    };

    // Check MongoDB connection
    try {
        if (mongoose.connection.readyState === 1) {
            health.services.database = {
                status: "healthy",
                message: "MongoDB connected"
            };
        } else {
            health.services.database = {
                status: "unhealthy",
                message: "MongoDB disconnected"
            };
            health.status = "degraded";
            health.success = false;
        }
    } catch (error) {
        health.services.database = {
            status: "unhealthy",
            message: error.message
        };
        health.status = "unhealthy";
        health.success = false;
    }

    // Check OpenAI API key configuration
    health.services.openai = {
        status: process.env.OPENAI_API_KEY ? "configured" : "not configured",
        message: process.env.OPENAI_API_KEY ? "API key present" : "API key missing"
    };

    // Cache statistics
    try {
        const cacheStats = getCacheStats();
        health.services.cache = {
            status: "healthy",
            stats: cacheStats
        };
    } catch (error) {
        health.services.cache = {
            status: "error",
            message: error.message
        };
    }

    // System information
    health.system = {
        memory: {
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB"
        },
        node: process.version,
        platform: process.platform,
        pid: process.pid
    };

    // Database statistics (optional, can be slow)
    if (mongoose.connection.readyState === 1) {
        try {
            const [valuatorCount, valuationCount] = await Promise.all([
                Valuator.countDocuments(),
                Valuation.countDocuments()
            ]);

            health.database = {
                valuators: valuatorCount,
                valuations: valuationCount
            };
        } catch (error) {
            health.database = {
                error: "Failed to fetch database stats"
            };
        }
    }

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 207 : 503;
    res.status(statusCode).json(health);
});

/**
 * Liveness probe - minimal check for k8s/container orchestration
 */
router.get("/live", (req, res) => {
    res.status(200).json({ alive: true });
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get("/ready", async (req, res) => {
    if (mongoose.connection.readyState === 1) {
        res.status(200).json({ ready: true });
    } else {
        res.status(503).json({ ready: false, reason: "Database not connected" });
    }
});

export default router;
