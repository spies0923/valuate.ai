import express from "express";
import joi from "joi";
import School from "../models/School.js";
import Grade from "../models/Grade.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Valuator from "../models/Valuator.js";
import { createLimiter, readLimiter } from "../middleware/rateLimiter.js";
import { cacheMiddleware, invalidateCache } from "../utils/cache.js";
import logger from "../utils/logger.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ============== SCHOOLS ==============

/**
 * GET /schools
 * Get all schools for a user
 */
router.get("/", readLimiter, cacheMiddleware(300), asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const schools = await School.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

    res.json({
        success: true,
        data: schools
    });
}));

/**
 * POST /schools
 * Create a new school
 */
router.post("/", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().required().trim(),
        userId: joi.string().required(),
        description: joi.string().allow("").default("")
    });

    const data = await schema.validateAsync(req.body);

    const newSchool = new School({
        name: data.name,
        userId: data.userId,
        description: data.description
    });

    const savedSchool = await newSchool.save();

    invalidateCache("/schools*");
    logger.info(`New school created: ${savedSchool._id} by user: ${data.userId}`);

    res.status(201).json({
        success: true,
        data: savedSchool,
        message: "School created successfully"
    });
}));

/**
 * PUT /schools/:id
 * Update a school
 */
router.put("/:id", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().trim(),
        description: joi.string().allow(""),
        userId: joi.string().required()
    });

    const data = await schema.validateAsync(req.body);
    const school = await School.findOne({ _id: req.params.id, userId: data.userId });

    if (!school) {
        return res.status(404).json({
            success: false,
            message: "School not found"
        });
    }

    if (data.name) school.name = data.name;
    if (data.description !== undefined) school.description = data.description;

    await school.save();

    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`School updated: ${school._id}`);

    res.json({
        success: true,
        data: school,
        message: "School updated successfully"
    });
}));

/**
 * DELETE /schools/:id
 * Delete a school (and cascade delete related entities)
 */
router.delete("/:id", createLimiter, asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const school = await School.findOne({ _id: req.params.id, userId });

    if (!school) {
        return res.status(404).json({
            success: false,
            message: "School not found"
        });
    }

    // Delete all related entities
    await Subject.deleteMany({ schoolId: req.params.id });
    await Class.deleteMany({ schoolId: req.params.id });
    await Grade.deleteMany({ schoolId: req.params.id });
    await school.deleteOne();

    invalidateCache("/schools*");
    invalidateCache("/grades*");
    invalidateCache("/classes*");
    invalidateCache("/subjects*");
    invalidateCache("/valuators*");
    logger.info(`School deleted: ${req.params.id} with all related entities`);

    res.json({
        success: true,
        message: "School and related entities deleted successfully"
    });
}));

// ============== GRADES ==============

/**
 * GET /schools/:schoolId/grades
 * Get all grades for a school
 */
router.get("/:schoolId/grades", readLimiter, cacheMiddleware(300), asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const grades = await Grade.find({ schoolId: req.params.schoolId, userId })
        .sort({ createdAt: -1 })
        .lean();

    res.json({
        success: true,
        data: grades
    });
}));

/**
 * POST /schools/:schoolId/grades
 * Create a new grade for a school
 */
router.post("/:schoolId/grades", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().required().trim(),
        userId: joi.string().required(),
        description: joi.string().allow("").default("")
    });

    const data = await schema.validateAsync(req.body);

    // Verify school exists and belongs to user
    const school = await School.findOne({ _id: req.params.schoolId, userId: data.userId });
    if (!school) {
        return res.status(404).json({
            success: false,
            message: "School not found"
        });
    }

    const newGrade = new Grade({
        name: data.name,
        schoolId: req.params.schoolId,
        userId: data.userId,
        description: data.description
    });

    const savedGrade = await newGrade.save();

    invalidateCache("/schools*");
    invalidateCache("/grades*");
    logger.info(`New grade created: ${savedGrade._id} for school: ${req.params.schoolId}`);

    res.status(201).json({
        success: true,
        data: savedGrade,
        message: "Grade created successfully"
    });
}));

/**
 * PUT /schools/:schoolId/grades/:gradeId
 * Update a grade
 */
router.put("/:schoolId/grades/:gradeId", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().trim(),
        description: joi.string().allow(""),
        userId: joi.string().required()
    });

    const data = await schema.validateAsync(req.body);
    const grade = await Grade.findOne({
        _id: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId
    });

    if (!grade) {
        return res.status(404).json({
            success: false,
            message: "Grade not found"
        });
    }

    if (data.name) grade.name = data.name;
    if (data.description !== undefined) grade.description = data.description;

    await grade.save();

    invalidateCache("/grades*");
    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`Grade updated: ${grade._id}`);

    res.json({
        success: true,
        data: grade,
        message: "Grade updated successfully"
    });
}));

/**
 * DELETE /schools/:schoolId/grades/:gradeId
 * Delete a grade (and cascade delete related entities)
 */
router.delete("/:schoolId/grades/:gradeId", createLimiter, asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const grade = await Grade.findOne({
        _id: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId
    });

    if (!grade) {
        return res.status(404).json({
            success: false,
            message: "Grade not found"
        });
    }

    // Delete all related entities
    await Subject.deleteMany({ gradeId: req.params.gradeId });
    await Class.deleteMany({ gradeId: req.params.gradeId });
    await grade.deleteOne();

    invalidateCache("/grades*");
    invalidateCache("/classes*");
    invalidateCache("/subjects*");
    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`Grade deleted: ${req.params.gradeId} with all related entities`);

    res.json({
        success: true,
        message: "Grade and related entities deleted successfully"
    });
}));

// ============== CLASSES ==============

/**
 * GET /schools/:schoolId/grades/:gradeId/classes
 * Get all classes for a grade
 */
router.get("/:schoolId/grades/:gradeId/classes", readLimiter, cacheMiddleware(300), asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const classes = await Class.find({
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId
    })
        .sort({ createdAt: -1 })
        .lean();

    res.json({
        success: true,
        data: classes
    });
}));

/**
 * POST /schools/:schoolId/grades/:gradeId/classes
 * Create a new class for a grade
 */
router.post("/:schoolId/grades/:gradeId/classes", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().required().trim(),
        userId: joi.string().required(),
        description: joi.string().allow("").default("")
    });

    const data = await schema.validateAsync(req.body);

    // Verify grade exists and belongs to user
    const grade = await Grade.findOne({
        _id: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId
    });
    if (!grade) {
        return res.status(404).json({
            success: false,
            message: "Grade not found"
        });
    }

    const newClass = new Class({
        name: data.name,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId,
        description: data.description
    });

    const savedClass = await newClass.save();

    invalidateCache("/classes*");
    invalidateCache("/grades*");
    invalidateCache("/schools*");
    logger.info(`New class created: ${savedClass._id} for grade: ${req.params.gradeId}`);

    res.status(201).json({
        success: true,
        data: savedClass,
        message: "Class created successfully"
    });
}));

/**
 * PUT /schools/:schoolId/grades/:gradeId/classes/:classId
 * Update a class
 */
router.put("/:schoolId/grades/:gradeId/classes/:classId", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().trim(),
        description: joi.string().allow(""),
        userId: joi.string().required()
    });

    const data = await schema.validateAsync(req.body);
    const classDoc = await Class.findOne({
        _id: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId
    });

    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: "Class not found"
        });
    }

    if (data.name) classDoc.name = data.name;
    if (data.description !== undefined) classDoc.description = data.description;

    await classDoc.save();

    invalidateCache("/classes*");
    invalidateCache("/grades*");
    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`Class updated: ${classDoc._id}`);

    res.json({
        success: true,
        data: classDoc,
        message: "Class updated successfully"
    });
}));

/**
 * DELETE /schools/:schoolId/grades/:gradeId/classes/:classId
 * Delete a class (and cascade delete related entities)
 */
router.delete("/:schoolId/grades/:gradeId/classes/:classId", createLimiter, asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const classDoc = await Class.findOne({
        _id: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId
    });

    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: "Class not found"
        });
    }

    // Delete all related entities
    await Subject.deleteMany({ classId: req.params.classId });
    await classDoc.deleteOne();

    invalidateCache("/classes*");
    invalidateCache("/subjects*");
    invalidateCache("/grades*");
    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`Class deleted: ${req.params.classId} with all related entities`);

    res.json({
        success: true,
        message: "Class and related entities deleted successfully"
    });
}));

// ============== SUBJECTS ==============

/**
 * GET /schools/:schoolId/grades/:gradeId/classes/:classId/subjects
 * Get all subjects for a class
 */
router.get("/:schoolId/grades/:gradeId/classes/:classId/subjects", readLimiter, cacheMiddleware(300), asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const subjects = await Subject.find({
        classId: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId
    })
        .sort({ createdAt: -1 })
        .lean();

    res.json({
        success: true,
        data: subjects
    });
}));

/**
 * POST /schools/:schoolId/grades/:gradeId/classes/:classId/subjects
 * Create a new subject for a class
 */
router.post("/:schoolId/grades/:gradeId/classes/:classId/subjects", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().required().trim(),
        userId: joi.string().required(),
        description: joi.string().allow("").default("")
    });

    const data = await schema.validateAsync(req.body);

    // Verify class exists and belongs to user
    const classDoc = await Class.findOne({
        _id: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId
    });
    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: "Class not found"
        });
    }

    const newSubject = new Subject({
        name: data.name,
        classId: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId,
        description: data.description
    });

    const savedSubject = await newSubject.save();

    invalidateCache("/subjects*");
    invalidateCache("/classes*");
    invalidateCache("/grades*");
    invalidateCache("/schools*");
    logger.info(`New subject created: ${savedSubject._id} for class: ${req.params.classId}`);

    res.status(201).json({
        success: true,
        data: savedSubject,
        message: "Subject created successfully"
    });
}));

/**
 * PUT /schools/:schoolId/grades/:gradeId/classes/:classId/subjects/:subjectId
 * Update a subject
 */
router.put("/:schoolId/grades/:gradeId/classes/:classId/subjects/:subjectId", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        name: joi.string().trim(),
        description: joi.string().allow(""),
        userId: joi.string().required()
    });

    const data = await schema.validateAsync(req.body);
    const subject = await Subject.findOne({
        _id: req.params.subjectId,
        classId: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId: data.userId
    });

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: "Subject not found"
        });
    }

    if (data.name) subject.name = data.name;
    if (data.description !== undefined) subject.description = data.description;

    await subject.save();

    invalidateCache("/subjects*");
    invalidateCache("/classes*");
    invalidateCache("/grades*");
    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`Subject updated: ${subject._id}`);

    res.json({
        success: true,
        data: subject,
        message: "Subject updated successfully"
    });
}));

/**
 * DELETE /schools/:schoolId/grades/:gradeId/classes/:classId/subjects/:subjectId
 * Delete a subject
 */
router.delete("/:schoolId/grades/:gradeId/classes/:classId/subjects/:subjectId", createLimiter, asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const subject = await Subject.findOne({
        _id: req.params.subjectId,
        classId: req.params.classId,
        gradeId: req.params.gradeId,
        schoolId: req.params.schoolId,
        userId
    });

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: "Subject not found"
        });
    }

    await subject.deleteOne();

    invalidateCache("/subjects*");
    invalidateCache("/classes*");
    invalidateCache("/grades*");
    invalidateCache("/schools*");
    invalidateCache("/valuators*");
    logger.info(`Subject deleted: ${req.params.subjectId}`);

    res.json({
        success: true,
        message: "Subject deleted successfully"
    });
}));

// ============== HIERARCHY VIEW ==============

/**
 * GET /schools/hierarchy
 * Get complete organizational hierarchy for a user
 */
router.get("/hierarchy", readLimiter, cacheMiddleware(180), asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    // Fetch all organizational entities for the user
    const [schools, grades, classes, subjects, valuators] = await Promise.all([
        School.find({ userId }).sort({ createdAt: -1 }).lean(),
        Grade.find({ userId }).sort({ createdAt: -1 }).lean(),
        Class.find({ userId }).sort({ createdAt: -1 }).lean(),
        Subject.find({ userId }).sort({ createdAt: -1 }).lean(),
        Valuator.find({ userId }).sort({ createdAt: -1 }).lean()
    ]);

    // Build hierarchical structure
    const hierarchy = schools.map(school => ({
        ...school,
        grades: grades
            .filter(g => g.schoolId.toString() === school._id.toString())
            .map(grade => ({
                ...grade,
                classes: classes
                    .filter(c => c.gradeId.toString() === grade._id.toString())
                    .map(classDoc => ({
                        ...classDoc,
                        subjects: subjects
                            .filter(s => s.classId.toString() === classDoc._id.toString())
                            .map(subject => ({
                                ...subject,
                                valuators: valuators.filter(v =>
                                    v.subjectId && v.subjectId.toString() === subject._id.toString()
                                )
                            }))
                    }))
            }))
    }));

    // Also include unorganized valuators (no school/grade/class/subject)
    const unorganizedValuators = valuators.filter(v => !v.schoolId && !v.gradeId && !v.classId && !v.subjectId);

    res.json({
        success: true,
        data: {
            organized: hierarchy,
            unorganized: unorganizedValuators
        }
    });
}));

export default router;
