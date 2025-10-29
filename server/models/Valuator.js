import mongoose from "mongoose";

const ValuatorSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        questionPaper: {
            type: String,
            required: true
        },
        answerKey: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            default: null,
            index: true
        },
        gradeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grade",
            default: null,
            index: true
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            default: null,
            index: true
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            default: null,
            index: true
        },
    },
    {
        timestamps: true,
    }
);

// Add index for sorting by creation date (most recent first)
ValuatorSchema.index({ createdAt: -1 });
// Add compound indexes for organizational queries
ValuatorSchema.index({ userId: 1, createdAt: -1 });
ValuatorSchema.index({ userId: 1, schoolId: 1 });
ValuatorSchema.index({ userId: 1, schoolId: 1, gradeId: 1 });
ValuatorSchema.index({ userId: 1, schoolId: 1, gradeId: 1, classId: 1 });
ValuatorSchema.index({ userId: 1, schoolId: 1, gradeId: 1, classId: 1, subjectId: 1 });

const Valuator = mongoose.model("Valuator", ValuatorSchema);

export default Valuator;