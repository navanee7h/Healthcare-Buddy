const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const {
            email, password, name, age, gender, weight, height,
            nationality, medicalConditions, medications, allergies,
            dietaryPreferences, fitnessLevel
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Create new user
        const user = new User({
            email, password, name, age, gender, weight, height,
            nationality,
            medicalConditions: medicalConditions || [],
            medications: medications || [],
            allergies: allergies || [],
            dietaryPreferences: dietaryPreferences || 'none',
            fitnessLevel: fitnessLevel || 'sedentary'
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            message: 'Signed in successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Server error during signin' });
    }
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: user.toJSON() });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const allowedUpdates = [
            'name', 'age', 'gender', 'weight', 'height', 'nationality',
            'medicalConditions', 'medications', 'allergies',
            'dietaryPreferences', 'fitnessLevel'
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
