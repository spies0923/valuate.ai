import mongoose from "mongoose";

const GradeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
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

// Index for school's grades
GradeSchema.index({ schoolId: 1, createdAt: -1 });
GradeSchema.index({ userId: 1, schoolId: 1 });

const Grade = mongoose.model("Grade", GradeSchema);

export default Grade;
