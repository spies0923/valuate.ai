import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import valuatorRouter from "./routes/valuators.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["DB_URL", "OPENAI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Valuate.ai API",
        version: "1.0.0"
    });
});

app.use("/valuators", valuatorRouter);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection with error handling
async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}

// Handle MongoDB connection errors after initial connection
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
});

// Start server
const port = process.env.PORT || 8080;

connectDB();
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});