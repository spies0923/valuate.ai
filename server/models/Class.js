import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
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

// Index for grade's classes
ClassSchema.index({ gradeId: 1, createdAt: -1 });
ClassSchema.index({ schoolId: 1, gradeId: 1 });
ClassSchema.index({ userId: 1, schoolId: 1, gradeId: 1 });

const Class = mongoose.model("Class", ClassSchema);

export default Class;
