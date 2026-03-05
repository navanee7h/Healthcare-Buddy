const mongoose = require('mongoose');

const weeklyExercisePlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    weekStartDate: {
        type: String,
        required: true
    },
    goal: {
        type: String,
        default: 'general-fitness'
    },
    dailyTargets: {
        caloriesBurned: { type: Number, default: 300 },
        duration: { type: Number, default: 45 } // minutes
    },
    plan: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

weeklyExercisePlanSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('WeeklyExercisePlan', weeklyExercisePlanSchema);
