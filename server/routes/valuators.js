import express from "express";
import joi from "joi";
import Valuator from "../models/Valuator.js";
import aiPrompt from "../utils/utils.js";
import Valuation from "../models/Valuation.js";
import { callOpenAIWithRetry, parseAIResponse } from "../utils/openai.js";
import { aiLimiter, createLimiter, readLimiter } from "../middleware/rateLimiter.js";
import { cacheMiddleware, invalidateCache } from "../utils/cache.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * Async handler wrapper to catch errors and pass to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /valuators
 * Get all valuators with pagination
 * Query params: page (default 1), limit (default 20)
 * Cached for 5 minutes
 */
router.get("/", readLimiter, cacheMiddleware(300), asyncHandler(async (req, res) => {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
            success: false,
            message: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100."
        });
    }

    // Get total count for pagination metadata
    const total = await Valuator.countDocuments();

    // Get paginated valuators
    const valuators = await Valuator.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Get valuation counts in parallel to avoid N+1 queries
    const valuatorIds = valuators.map(v => v._id);
    const valuationCounts = await Valuation.aggregate([
        { $match: { valuatorId: { $in: valuatorIds.map(id => id.toString()) } } },
        { $group: { _id: "$valuatorId", count: { $sum: 1 } } }
    ]);

    // Create a map for quick lookup
    const countMap = {};
    valuationCounts.forEach(item => {
        countMap[item._id] = item.count;
    });

    // Attach counts to valuators
    valuators.forEach(valuator => {
        valuator.valuations = countMap[valuator._id.toString()] || 0;
    });

    res.json({
        success: true,
        data: valuators,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + valuators.length < total
        }
    });
}));

/**
 * POST /valuators
 * Create a new valuator
 * Rate limited to 20 per 15 minutes
 */
router.post("/", createLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        title: joi.string().required(),
        questionPaper: joi.string().uri().required(),
        answerKey: joi.string().uri().required(),
    });

    const data = await schema.validateAsync(req.body);
    const newValuator = new Valuator({
        title: data.title,
        questionPaper: data.questionPaper,
        answerKey: data.answerKey,
    });

    const savedValuator = await newValuator.save();

    // Invalidate valuators list cache
    invalidateCache("/valuators*");
    logger.info(`New valuator created: ${savedValuator._id}`);

    res.status(201).json({
        success: true,
        data: savedValuator,
        message: "Valuator created successfully"
    });
}));

/**
 * POST /valuators/byId
 * Get valuator by ID
 * Cached for 10 minutes (valuators rarely change)
 */
router.post("/byId", readLimiter, cacheMiddleware(600), asyncHandler(async (req, res) => {
    const schema = joi.object({
        id: joi.string().required(),
    });

    const data = await schema.validateAsync(req.body);
    const valuator = await Valuator.findById(data.id);

    if (!valuator) {
        return res.status(404).json({
            success: false,
            message: "Valuator not found"
        });
    }

    res.json({
        success: true,
        data: valuator
    });
}));


/**
 * POST /valuators/valuate
 * Grade an answer sheet using AI
 * Rate limited to 10 per 15 minutes (expensive operation)
 */
router.post("/valuate", aiLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        valuatorId: joi.string().required(),
        answerSheet: joi.string().uri().required(),
    });

    const data = await schema.validateAsync(req.body);
    const valuator = await Valuator.findById(data.valuatorId);

    if (!valuator) {
        return res.status(404).json({
            success: false,
            message: "Valuator not found"
        });
    }

    logger.info(`Starting valuation for valuator: ${data.valuatorId}`);
    const startTime = Date.now();

    // Call OpenAI with retry logic
    const completion = await callOpenAIWithRetry([
        {
            role: "system",
            content: aiPrompt,
        },
        {
            role: "user",
            content: [
                { type: "text", text: "Question Paper:" },
                {
                    type: "image_url",
                    image_url: {
                        "url": valuator.questionPaper,
                    },
                },
            ],
        },
        {
            role: "user",
            content: [
                { type: "text", text: "Answer Keys:" },
                {
                    type: "image_url",
                    image_url: {
                        "url": valuator.answerKey,
                    },
                },
            ]
        },
        {
            role: "user",
            content: [
                { type: "text", text: "Answer Sheet:" },
                {
                    type: "image_url",
                    image_url: {
                        "url": data.answerSheet,
                    },
                },
            ]
        }
    ], 2000);

    const resp = completion.choices[0].message.content;

    // Parse AI response with robust error handling
    const respData = parseAIResponse(resp);

    const newValuation = new Valuation({
        valuatorId: data.valuatorId,
        data: respData,
        answerSheet: data.answerSheet,
    });

    await newValuation.save();

    const duration = Date.now() - startTime;
    logger.info(`Valuation completed in ${duration}ms for valuator: ${data.valuatorId}`);

    // Invalidate valuations cache for this valuator
    invalidateCache(`*valuations*${data.valuatorId}*`);

    res.json({
        success: true,
        data: respData,
        message: "Answer sheet graded successfully"
    });
}));

/**
 * POST /valuators/valuations
 * Get all valuations for a valuator
 * Cached for 2 minutes (updates frequently)
 */
router.post("/valuations", readLimiter, cacheMiddleware(120), asyncHandler(async (req, res) => {
    const schema = joi.object({
        valuatorId: joi.string().required(),
    });

    const data = await schema.validateAsync(req.body);

    // Fetch valuator once instead of in a loop
    const valuator = await Valuator.findById(data.valuatorId);

    if (!valuator) {
        return res.status(404).json({
            success: false,
            message: "Valuator not found"
        });
    }

    const valuations = await Valuation.find({ valuatorId: data.valuatorId })
        .sort({ createdAt: -1 })
        .lean();

    // Attach valuator data to all valuations (no N+1 query!)
    valuations.forEach(valuation => {
        valuation.questionPaper = valuator.questionPaper;
        valuation.answerKey = valuator.answerKey;
    });

    res.json({
        success: true,
        data: valuations
    });
}));

/**
 * POST /valuators/total-marks
 * Get total marks for a valuation
 * Cached for 5 minutes (rarely changes)
 */
router.post("/total-marks", readLimiter, cacheMiddleware(300), asyncHandler(async (req, res) => {
    const schema = joi.object({
        valuationId: joi.string().required(),
    });

    const data = await schema.validateAsync(req.body);
    const valuation = await Valuation.findById(data.valuationId);

    if (!valuation) {
        return res.status(404).json({
            success: false,
            message: "Valuation not found"
        });
    }

    let totalScore = 0;
    let maxScore = 0;

    for (const answer of valuation.data.answers) {
        totalScore += answer.score[0];
        maxScore += answer.score[1];
    }

    const valuator = await Valuator.findById(valuation.valuatorId);

    res.json({
        success: true,
        data: {
            examName: valuator ? valuator.title : "Unknown",
            totalScore: totalScore.toString(),
            maxScore: maxScore.toString(),
        }
    });
}));

/**
 * POST /valuators/marksheet
 * Get marksheet for all students in a valuator
 * Cached for 2 minutes
 */
router.post("/marksheet", readLimiter, cacheMiddleware(120), asyncHandler(async (req, res) => {
    const schema = joi.object({
        valuatorId: joi.string().required(),
    });

    const data = await schema.validateAsync(req.body);

    const valuations = await Valuation.find({ valuatorId: data.valuatorId }).lean();

    const marksheet = [];

    for (const valuation of valuations) {
        const answers = valuation.data.answers;
        let totalScore = 0;

        for (const answer of answers) {
            totalScore += answer.score[0];
        }

        marksheet.push({
            name: valuation.data.student_name,
            rollNo: valuation.data.roll_no,
            marks: totalScore,
            isChecked: true
        });
    }

    // Sort by marks (highest first)
    marksheet.sort((a, b) => b.marks - a.marks);

    res.json({
        success: true,
        data: marksheet
    });
}));

/**
 * POST /valuators/revaluate
 * Re-grade an answer sheet with additional remarks
 * Rate limited to 10 per 15 minutes (expensive AI operation)
 */
router.post("/revaluate", aiLimiter, asyncHandler(async (req, res) => {
    const schema = joi.object({
        valuationId: joi.string().required(),
        remarks: joi.string().allow("").default(""),
    });

    const data = await schema.validateAsync(req.body);
    const valuation = await Valuation.findById(data.valuationId);

    if (!valuation) {
        return res.status(404).json({
            success: false,
            message: "Valuation not found"
        });
    }

    const valuator = await Valuator.findById(valuation.valuatorId);

    if (!valuator) {
        return res.status(404).json({
            success: false,
            message: "Valuator not found"
        });
    }

    logger.info(`Starting revaluation for valuation: ${data.valuationId}`);
    const startTime = Date.now();

    // Call OpenAI with retry logic
    const completion = await callOpenAIWithRetry([
        {
            role: "system",
            content: aiPrompt + "\n\nEXTRA REMARKS (VERY IMPORTANT!!): " + data.remarks + (data.remarks ? "\nGive remarks as 'Revaluated' for all questions extra remarks applied to." : ""),
        },
        {
            role: "user",
            content: [
                { type: "text", text: "Question Paper:" },
                {
                    type: "image_url",
                    image_url: {
                        "url": valuator.questionPaper,
                    },
                },
            ],
        },
        {
            role: "user",
            content: [
                { type: "text", text: "Answer Keys:" },
                {
                    type: "image_url",
                    image_url: {
                        "url": valuator.answerKey,
                    },
                },
            ]
        },
        {
            role: "user",
            content: [
                { type: "text", text: "Answer Sheet:" },
                {
                    type: "image_url",
                    image_url: {
                        "url": valuation.answerSheet,
                    },
                },
            ]
        }
    ], 2000);

    const resp = completion.choices[0].message.content;

    // Parse AI response with robust error handling
    const respData = parseAIResponse(resp);

    await Valuation.findByIdAndUpdate(data.valuationId, {
        data: respData,
    });

    const duration = Date.now() - startTime;
    logger.info(`Revaluation completed in ${duration}ms for valuation: ${data.valuationId}`);

    // Invalidate caches for this valuation
    invalidateCache(`*${valuation.valuatorId}*`);

    res.json({
        success: true,
        data: respData,
        message: "Revaluation completed successfully"
    });
}));

export default router;