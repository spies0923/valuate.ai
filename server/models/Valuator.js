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
    },
    {
        timestamps: true,
    }
);

// Add index for sorting by creation date (most recent first)
ValuatorSchema.index({ createdAt: -1 });

const Valuator = mongoose.model("Valuator", ValuatorSchema);

export default Valuator;