const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    conditionName: {
        type: String,
        required: true
    },
    probability: {
        type: Number,
        default: 0
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
    },
    description: String,
    recommendation: String,
    // Tracking
    status: {
        type: String,
        enum: ['active', 'improving', 'resolved'],
        default: 'active'
    },
    wellbeingNotes: [{
        note: String,
        feeling: { type: String, enum: ['worse', 'same', 'better', 'resolved'] },
        date: { type: Date, default: Date.now }
    }],
    medications: [{
        name: String,
        dosage: String,
        startDate: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    diagnosedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

diagnosisSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
