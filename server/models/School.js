import mongoose from "mongoose";

const SchoolSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
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

// Index for user's schools
SchoolSchema.index({ userId: 1, createdAt: -1 });

const School = mongoose.model("School", SchoolSchema);

export default School;
