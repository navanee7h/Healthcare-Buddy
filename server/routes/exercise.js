const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ExerciseLog = require('../models/ExerciseLog');
const WeeklyExercisePlan = require('../models/WeeklyExercisePlan');
const Meal = require('../models/Meal');
const { callGrok, buildUserContext } = require('../services/grokService');

const router = express.Router();

// ============================================================
// AI EXERCISE PLAN GENERATION
// ============================================================

// POST /api/exercise/plan
router.post('/plan', auth, async (req, res) => {
    try {
        const { goal, daysPerWeek, duration, equipment, additionalNotes, saveAsPlan, weekStartDate } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userContext = buildUserContext(user);

        const systemPrompt = `You are an expert fitness trainer and exercise planner for Healthcare Buddy.

${userContext}

Create a personalized exercise plan based on the patient's profile and their goals. Follow these rules:

1. Consider the patient's medical conditions, current fitness level, age, and physical limitations.
2. Start at an appropriate intensity based on their fitness level.
3. Include warm-up and cool-down routines.
4. Provide alternatives for exercises that may be difficult.
5. Be cautious about conditions that may limit certain exercises.
6. Include estimated calories burned per session.

ALWAYS respond with valid JSON in this EXACT format:
{
  "planName": "Custom Plan Name",
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedCaloriesBurned": 400,
  "dailyTargets": {
    "caloriesBurned": 400,
    "duration": 45
  },
  "schedule": [
    {
      "day": "Day 1 - Monday",
      "focus": "Upper Body & Cardio",
      "estimatedCalories": 350,
      "warmup": {
        "duration": "5-10 minutes",
        "exercises": ["Light jogging in place", "Arm circles", "Shoulder rolls"]
      },
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "12-15",
          "duration": "N/A",
          "restBetweenSets": "60 seconds",
          "caloriesBurned": 50,
          "notes": "Form tips or modifications",
          "alternative": "Easier alternative exercise"
        }
      ],
      "cooldown": {
        "duration": "5-10 minutes",
        "exercises": ["Static stretches", "Deep breathing"]
      }
    }
  ],
  "restDays": ["Saturday", "Sunday"],
  "tips": ["Tip 1", "Tip 2"],
  "warnings": ["Any warnings based on medical conditions"],
  "progressionPlan": "How to gradually increase intensity over time"
}`;

        const userMessage = `Please create an exercise plan for me.
Goal: ${goal || 'General fitness improvement'}
${daysPerWeek ? `Days Per Week: ${daysPerWeek}` : 'Days Per Week: 3-4'}
${duration ? `Session Duration: ${duration} minutes` : 'Session Duration: 30-45 minutes'}
${equipment ? `Available Equipment: ${equipment}` : 'Available Equipment: No equipment (bodyweight only)'}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}`;

        const response = await callGrok(systemPrompt, [{ role: 'user', content: userMessage }]);

        let parsed;
        try {
            parsed = JSON.parse(response.trim());
        } catch {
            try {
                let jsonStr = response;
                const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1].trim();
                    parsed = JSON.parse(jsonStr);
                } else {
                    const objMatch = response.match(/\{[\s\S]*"planName"[\s\S]*"schedule"[\s\S]*\}/);
                    if (objMatch) {
                        parsed = JSON.parse(objMatch[0]);
                    } else {
                        throw new Error('No JSON found');
                    }
                }
            } catch {
                parsed = { rawResponse: response };
            }
        }

        // Save as weekly plan if requested
        if (saveAsPlan && !parsed.rawResponse) {
            await WeeklyExercisePlan.updateMany(
                { userId: req.userId, isActive: true },
                { isActive: false }
            );

            const plan = new WeeklyExercisePlan({
                userId: req.userId,
                weekStartDate: weekStartDate || new Date().toISOString().split('T')[0],
                goal: goal || 'general-fitness',
                dailyTargets: parsed.dailyTargets || {
                    caloriesBurned: parsed.estimatedCaloriesBurned || 300,
                    duration: 45
                },
                plan: parsed,
                isActive: true
            });
            await plan.save();
            parsed._savedPlanId = plan._id;
        }

        res.json({ plan: parsed });
    } catch (error) {
        console.error('Exercise plan error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate exercise plan' });
    }
});

// GET /api/exercise/plans
router.get('/plans', auth, async (req, res) => {
    try {
        const plans = await WeeklyExercisePlan.find({ userId: req.userId })
            .sort({ createdAt: -1 }).limit(10);
        res.json({ plans });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// GET /api/exercise/plans/active
router.get('/plans/active', auth, async (req, res) => {
    try {
        const plan = await WeeklyExercisePlan.findOne({ userId: req.userId, isActive: true });
        res.json({ plan: plan || null });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active plan' });
    }
});

// DELETE /api/exercise/plans/:id
router.delete('/plans/:id', auth, async (req, res) => {
    try {
        await WeeklyExercisePlan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ message: 'Plan deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// ============================================================
// EXERCISE LOGGING
// ============================================================

// POST /api/exercise/log — Add a workout and estimate calories burned via AI
router.post('/log', auth, async (req, res) => {
    try {
        const { exerciseName, duration, category, intensity, date, sets, reps, notes, manualCalories } = req.body;

        if (!exerciseName || !duration) {
            return res.status(400).json({ error: 'Exercise name and duration are required' });
        }

        const user = await User.findById(req.userId).select('weight');
        const weight = user?.weight || 70;

        let caloriesBurned = 0;
        let isManualOverride = false;

        if (manualCalories !== undefined && manualCalories !== null) {
            caloriesBurned = manualCalories;
            isManualOverride = true;
        } else {
            // AI estimates calories burned
            const prompt = `Estimate calories burned. Respond ONLY with valid JSON, no other text.

Exercise: ${exerciseName}
Duration: ${duration} minutes
Intensity: ${intensity || 'moderate'}
Person weight: ${weight} kg

{"caloriesBurned": <number>}`;

            try {
                const aiResponse = await callGrok(
                    'You are a fitness calorie calculator. Return ONLY valid JSON with calorie burn estimate. No explanations.',
                    [{ role: 'user', content: prompt }]
                );

                let jsonStr = aiResponse.trim();
                const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) jsonStr = jsonMatch[1].trim();
                const objMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (objMatch) jsonStr = objMatch[0];

                const parsed = JSON.parse(jsonStr);
                caloriesBurned = parsed.caloriesBurned || 0;
            } catch {
                // Rough fallback estimate
                const metMap = { light: 3, moderate: 5, intense: 8 };
                const met = metMap[intensity] || 5;
                caloriesBurned = Math.round((met * weight * duration) / 60);
            }
        }

        const log = new ExerciseLog({
            userId: req.userId,
            date: date || new Date().toISOString().split('T')[0],
            exerciseName,
            duration: Number(duration),
            category: category || 'other',
            intensity: intensity || 'moderate',
            caloriesBurned,
            sets: sets ? Number(sets) : 0,
            reps: reps || '',
            notes: notes || '',
            isManualOverride
        });

        await log.save();
        res.status(201).json({ exercise: log });
    } catch (error) {
        console.error('Add exercise error:', error);
        res.status(500).json({ error: 'Failed to log exercise' });
    }
});

// GET /api/exercise/logs?date=YYYY-MM-DD
router.get('/logs', auth, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const logs = await ExerciseLog.find({ userId: req.userId, date }).sort({ createdAt: 1 });
        res.json({ exercises: logs, date });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
});

// PUT /api/exercise/log/:id — Update exercise (for manual override)
router.put('/log/:id', auth, async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ['exerciseName', 'duration', 'category', 'intensity', 'caloriesBurned', 'sets', 'reps', 'notes'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (updates.caloriesBurned !== undefined) updates.isManualOverride = true;

        const log = await ExerciseLog.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: updates },
            { new: true }
        );
        if (!log) return res.status(404).json({ error: 'Exercise not found' });
        res.json({ exercise: log });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update exercise' });
    }
});

// DELETE /api/exercise/log/:id
router.delete('/log/:id', auth, async (req, res) => {
    try {
        const log = await ExerciseLog.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!log) return res.status(404).json({ error: 'Exercise not found' });
        res.json({ message: 'Exercise deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete exercise' });
    }
});

// GET /api/exercise/summary?date=YYYY-MM-DD — Daily summary with diet integration
router.get('/summary', auth, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const exercises = await ExerciseLog.find({ userId: req.userId, date });

        const exerciseTotals = exercises.reduce((acc, ex) => ({
            caloriesBurned: acc.caloriesBurned + (ex.caloriesBurned || 0),
            totalDuration: acc.totalDuration + (ex.duration || 0),
            workoutCount: acc.workoutCount + 1
        }), { caloriesBurned: 0, totalDuration: 0, workoutCount: 0 });

        // Get diet calories for the same day
        const meals = await Meal.find({ userId: req.userId, date });
        const caloriesConsumed = meals.reduce((sum, m) => sum + (m.calories || 0), 0);

        // Get active exercise plan targets
        const activePlan = await WeeklyExercisePlan.findOne({ userId: req.userId, isActive: true });

        res.json({
            date,
            exercise: exerciseTotals,
            caloriesConsumed: Math.round(caloriesConsumed),
            netCalories: Math.round(caloriesConsumed - exerciseTotals.caloriesBurned),
            targets: activePlan?.dailyTargets || null
        });
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
});

module.exports = router;
