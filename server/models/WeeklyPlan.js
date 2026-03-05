const mongoose = require('mongoose');

const weeklyPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    weekStartDate: {
        type: String, // YYYY-MM-DD (Monday)
        required: true
    },
    goal: {
        type: String,
        default: 'general-health'
    },
    dailyTargets: {
        calories: { type: Number, default: 2000 },
        protein: { type: Number, default: 50 },
        carbs: { type: Number, default: 250 },
        fats: { type: Number, default: 65 }
    },
    plan: {
        type: mongoose.Schema.Types.Mixed, // full AI-generated plan object
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

weeklyPlanSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);
