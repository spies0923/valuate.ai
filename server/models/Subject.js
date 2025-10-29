import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true
        },
        gradeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grade",
            required: true,
            index: true
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true,
    }
);

// Index for class's subjects
SubjectSchema.index({ classId: 1, createdAt: -1 });
SubjectSchema.index({ gradeId: 1, classId: 1 });
SubjectSchema.index({ schoolId: 1, gradeId: 1, classId: 1 });
SubjectSchema.index({ userId: 1, schoolId: 1, gradeId: 1, classId: 1 });

const Subject = mongoose.model("Subject", SubjectSchema);

export default Subject;
