const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Meal = require('../models/Meal');
const ExerciseLog = require('../models/ExerciseLog');
const Diagnosis = require('../models/Diagnosis');
const WeeklyPlan = require('../models/WeeklyPlan');
const WeeklyExercisePlan = require('../models/WeeklyExercisePlan');

const router = express.Router();

// GET /api/dashboard/stats — Aggregated dashboard data
router.get('/stats', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get last 7 days
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        // Fetch today's data
        const [todayMeals, todayExercises] = await Promise.all([
            Meal.find({ userId: req.userId, date: today }),
            ExerciseLog.find({ userId: req.userId, date: today })
        ]);

        const todayCaloriesConsumed = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
        const todayCaloriesBurned = todayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
        const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
        const todayDuration = todayExercises.reduce((s, e) => s + (e.duration || 0), 0);

        // Weekly chart data
        const weeklyData = await Promise.all(dates.map(async (date) => {
            const meals = await Meal.find({ userId: req.userId, date });
            const exercises = await ExerciseLog.find({ userId: req.userId, date });
            const consumed = meals.reduce((s, m) => s + (m.calories || 0), 0);
            const burned = exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
            return {
                date,
                label: new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
                consumed: Math.round(consumed),
                burned: Math.round(burned),
                logged: meals.length > 0 || exercises.length > 0
            };
        }));

        // Streak calculation
        let streak = 0;
        for (let i = dates.length - 1; i >= 0; i--) {
            if (weeklyData[i].logged) streak++;
            else break;
        }

        // Calculate daily calorie requirement (Harris-Benedict)
        const user = await User.findById(req.userId);
        let dailyCalorieReq = 2000;
        if (user) {
            const w = user.weight || 70;
            const h = user.height || 170;
            const a = user.age || 25;
            if (user.gender === 'male') {
                dailyCalorieReq = Math.round(88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a));
            } else {
                dailyCalorieReq = Math.round(447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a));
            }
            // Activity multiplier
            const actMultipliers = {
                'sedentary': 1.2, 'lightly-active': 1.375, 'moderately-active': 1.55,
                'very-active': 1.725, 'athlete': 1.9
            };
            dailyCalorieReq = Math.round(dailyCalorieReq * (actMultipliers[user.fitnessLevel] || 1.2));
        }

        // Active targets
        const [dietPlan, exercisePlan] = await Promise.all([
            WeeklyPlan.findOne({ userId: req.userId, isActive: true }),
            WeeklyExercisePlan.findOne({ userId: req.userId, isActive: true })
        ]);

        // Active diagnoses
        const diagnoses = await Diagnosis.find({
            userId: req.userId,
            status: { $ne: 'resolved' }
        }).sort({ createdAt: -1 });

        res.json({
            today: {
                caloriesConsumed: Math.round(todayCaloriesConsumed),
                caloriesBurned: Math.round(todayCaloriesBurned),
                netCalories: Math.round(todayCaloriesConsumed - todayCaloriesBurned),
                protein: Math.round(todayProtein),
                mealCount: todayMeals.length,
                exerciseCount: todayExercises.length,
                exerciseDuration: todayDuration
            },
            dailyCalorieReq,
            weeklyData,
            streak,
            targets: {
                diet: dietPlan?.dailyTargets || null,
                exercise: exercisePlan?.dailyTargets || null
            },
            diagnoses
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// GET /api/dashboard/diagnoses — All diagnoses
router.get('/diagnoses', auth, async (req, res) => {
    try {
        const diagnoses = await Diagnosis.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ diagnoses });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch diagnoses' });
    }
});

// PUT /api/dashboard/diagnosis/:id/wellbeing — Add wellbeing check-in
router.put('/diagnosis/:id/wellbeing', auth, async (req, res) => {
    try {
        const { note, feeling } = req.body;
        const diagnosis = await Diagnosis.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            {
                $push: { wellbeingNotes: { note, feeling, date: new Date() } },
                ...(feeling === 'resolved' ? { status: 'resolved' } : {}),
                ...(feeling === 'better' ? { status: 'improving' } : {})
            },
            { new: true }
        );
        if (!diagnosis) return res.status(404).json({ error: 'Diagnosis not found' });
        res.json({ diagnosis });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update wellbeing' });
    }
});

// POST /api/dashboard/diagnosis/:id/medication — Add medication
router.post('/diagnosis/:id/medication', auth, async (req, res) => {
    try {
        const { name, dosage } = req.body;
        const diagnosis = await Diagnosis.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $push: { medications: { name, dosage, startDate: new Date(), isActive: true } } },
            { new: true }
        );
        if (!diagnosis) return res.status(404).json({ error: 'Diagnosis not found' });
        res.json({ diagnosis });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add medication' });
    }
});

// PUT /api/dashboard/diagnosis/:id/medication/:medId — Toggle medication
router.put('/diagnosis/:id/medication/:medId', auth, async (req, res) => {
    try {
        const diagnosis = await Diagnosis.findOne({ _id: req.params.id, userId: req.userId });
        if (!diagnosis) return res.status(404).json({ error: 'Diagnosis not found' });

        const med = diagnosis.medications.id(req.params.medId);
        if (med) {
            med.isActive = !med.isActive;
            await diagnosis.save();
        }
        res.json({ diagnosis });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update medication' });
    }
});

module.exports = router;
