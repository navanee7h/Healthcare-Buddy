const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: String, // YYYY-MM-DD format for easy querying
        required: true,
        index: true
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true
    },
    foodName: {
        type: String,
        required: true,
        trim: true
    },
    grams: {
        type: Number,
        required: true
    },
    calories: {
        type: Number,
        default: 0
    },
    protein: {
        type: Number, // in grams
        default: 0
    },
    carbs: {
        type: Number, // in grams
        default: 0
    },
    fats: {
        type: Number, // in grams
        default: 0
    },
    fiber: {
        type: Number,
        default: 0
    },
    isManualOverride: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for efficient date-based queries per user
mealSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Meal', mealSchema);
