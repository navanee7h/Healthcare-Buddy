const mongoose = require('mongoose');

const exerciseLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    exerciseName: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    category: {
        type: String,
        enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
        default: 'other'
    },
    intensity: {
        type: String,
        enum: ['light', 'moderate', 'intense'],
        default: 'moderate'
    },
    caloriesBurned: {
        type: Number,
        default: 0
    },
    sets: {
        type: Number,
        default: 0
    },
    reps: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    isManualOverride: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

exerciseLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('ExerciseLog', exerciseLogSchema);
