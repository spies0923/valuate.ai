import express from "express";
import joi from "joi";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { createLimiter, readLimiter } from "../middleware/rateLimiter.js";
import logger from "../utils/logger.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "30d" }
    );
};

/**
 * GET /auth/check-setup
 * Check if initial setup is required (no users exist)
 */
router.get("/check-setup", asyncHandler(async (req, res) => {
    const userCount = await User.countDocuments();

    res.json({
        success: true,
        data: {
            setupRequired: userCount === 0,
            hasUsers: userCount > 0
        }
    });
}));

/**
 * POST /auth/setup
 * Initial setup - create first admin user
 * Only works if no users exist
 */
router.post("/setup", createLimiter, asyncHandler(async (req, res) => {
    // Check if setup is already done
    const userCount = await User.countDocuments();

    if (userCount > 0) {
        return res.status(400).json({
            success: false,
            message: "Setup already completed. Please login instead."
        });
    }

    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).required(),
        name: joi.string().required().trim()
    });

    const data = await schema.validateAsync(req.body);

    // Create first admin user
    const adminUser = new User({
        email: data.email,
        password: data.password,
        name: data.name,
        role: "admin"
    });

    await adminUser.save();

    // Generate token
    const token = generateToken(adminUser._id);

    logger.info(`Initial admin user created: ${adminUser.email}`);

    res.status(201).json({
        success: true,
        data: {
            user: adminUser,
            token
        },
        message: "Admin account created successfully"
    });
}));

/**
 * POST /auth/login
 * Login with email and password
 */
router.post("/login", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    const data = await schema.validateAsync(req.body);

    // Find user
    const user = await User.findOne({ email: data.email });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    // Check if account is active
    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: "Account is inactive. Please contact administrator."
        });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(data.password);

    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
        success: true,
        data: {
            user: user,
            token
        },
        message: "Login successful"
    });
}));

/**
 * GET /auth/me
 * Get current user profile
 */
router.get("/me", authenticate, asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: req.user
    });
}));

/**
 * GET /auth/teachers
 * Get all teachers (admin only)
 */
router.get("/teachers", authenticate, requireAdmin, readLimiter, asyncHandler(async (req, res) => {
    const teachers = await User.find({ role: "teacher" })
        .select("-password")
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: teachers
    });
}));

/**
 * POST /auth/teachers
 * Create a new teacher account (admin only)
 */
router.post("/teachers", authenticate, requireAdmin, createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).required(),
        name: joi.string().required().trim()
    });

    const data = await schema.validateAsync(req.body);

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "Email already in use"
        });
    }

    // Create teacher user
    const teacher = new User({
        email: data.email,
        password: data.password,
        name: data.name,
        role: "teacher",
        createdBy: req.user._id
    });

    await teacher.save();

    logger.info(`Teacher created: ${teacher.email} by admin: ${req.user.email}`);

    res.status(201).json({
        success: true,
        data: teacher,
        message: "Teacher account created successfully"
    });
}));

/**
 * PUT /auth/teachers/:id
 * Update teacher account (admin only)
 */
router.put("/teachers/:id", authenticate, requireAdmin, createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().trim(),
        email: joi.string().email(),
        password: joi.string().min(8),
        isActive: joi.boolean()
    });

    const data = await schema.validateAsync(req.body);

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: "Teacher not found"
        });
    }

    // Check if email is being changed and if it's already in use
    if (data.email && data.email !== teacher.email) {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already in use"
            });
        }
        teacher.email = data.email;
    }

    if (data.name) teacher.name = data.name;
    if (data.password) teacher.password = data.password;
    if (data.isActive !== undefined) teacher.isActive = data.isActive;

    await teacher.save();

    logger.info(`Teacher updated: ${teacher.email} by admin: ${req.user.email}`);

    res.json({
        success: true,
        data: teacher,
        message: "Teacher account updated successfully"
    });
}));

/**
 * DELETE /auth/teachers/:id
 * Delete teacher account (admin only)
 */
router.delete("/teachers/:id", authenticate, requireAdmin, createLimiter, asyncHandler(async (req, res) => {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: "Teacher not found"
        });
    }

    await teacher.deleteOne();

    logger.info(`Teacher deleted: ${teacher.email} by admin: ${req.user.email}`);

    res.json({
        success: true,
        message: "Teacher account deleted successfully"
    });
}));

/**
 * POST /auth/change-password
 * Change own password
 */
router.post("/change-password", authenticate, createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        currentPassword: joi.string().required(),
        newPassword: joi.string().min(8).required()
    });

    const data = await schema.validateAsync(req.body);

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isValidPassword = await user.comparePassword(data.currentPassword);

    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            message: "Current password is incorrect"
        });
    }

    // Update password
    user.password = data.newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
        success: true,
        message: "Password changed successfully"
    });
}));

export default router;
