import mongoose from "mongoose";

const ValuationSchema = new mongoose.Schema(
    {
        valuatorId: {
            type: String,
            required: true,
            index: true  // Add index for faster queries
        },
        data: {
            type: Object,
            required: true
        },
        answerSheet: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index for common query patterns
ValuationSchema.index({ valuatorId: 1, createdAt: -1 });

const Valuation = mongoose.model("Valuation", ValuationSchema);

export default Valuation;