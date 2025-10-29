import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticate } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
});

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only images (JPEG, JPG, PNG, GIF) and PDF files are allowed"));
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 8 * 1024 * 1024, // 8MB max file size
    }
});

/**
 * @route   POST /api/upload
 * @desc    Upload single or multiple files
 * @access  Private
 */
router.post("/", authenticate, upload.array("files", 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }

        // Generate URLs for uploaded files
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 8080}`;
        const fileData = req.files.map(file => ({
            url: `${serverUrl}/uploads/${file.filename}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype
        }));

        res.status(200).json({
            success: true,
            message: "Files uploaded successfully",
            data: fileData
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to upload files"
        });
    }
});

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete an uploaded file
 * @access  Private
 */
router.delete("/:filename", authenticate, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        // Delete file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: "File deleted successfully"
        });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete file"
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum size is 8MB"
            });
        }
        if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                success: false,
                message: "Too many files. Maximum is 10 files"
            });
        }
    }
    res.status(400).json({
        success: false,
        message: error.message || "File upload failed"
    });
});

export default router;
