import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * JWT Authentication Middleware
 * Validates JWT tokens from Authorization header and fetches user from database
 */
export const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please provide a valid token."
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

        // Get user from database
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again."
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive. Please contact administrator."
            });
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Authentication error occurred."
        });
    }
};

/**
 * Admin-only middleware
 * Ensures authenticated user has admin role
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

export default authenticate;
