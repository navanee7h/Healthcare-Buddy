const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Meal = require('../models/Meal');
const WeeklyPlan = require('../models/WeeklyPlan');
const { callGrok, buildUserContext } = require('../services/grokService');

const router = express.Router();

// ============================================================
// AI DIET PLAN GENERATION
// ============================================================

// POST /api/diet/plan — Generate AI diet plan (and optionally save as weekly plan)
router.post('/plan', auth, async (req, res) => {
    try {
        const { goal, preferences, mealsPerDay, additionalNotes, saveAsPlan, weekStartDate } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userContext = buildUserContext(user);

        const systemPrompt = `You are an expert nutritionist and diet planner for Healthcare Buddy.

${userContext}

Create a personalized diet plan based on the patient's profile and their goals. Follow these rules:

1. Consider the patient's medical conditions, allergies, medications, and dietary preferences.
2. Take into account their nationality for culturally appropriate food suggestions.
3. Calculate approximate daily caloric needs based on their age, weight, height, gender, and activity level.
4. Provide a structured meal plan.

ALWAYS respond with valid JSON in this EXACT format:
{
  "dailyCalories": 2000,
  "macros": {
    "protein": "30%",
    "carbs": "45%",
    "fats": "25%"
  },
  "dailyTargets": {
    "calories": 2000,
    "protein": 150,
    "carbs": 225,
    "fats": 55
  },
  "waterIntake": "2.5 liters",
  "meals": [
    {
      "name": "Breakfast",
      "time": "7:00 AM - 8:00 AM",
      "items": [
        {"food": "Food item name", "portion": "1 cup", "grams": 200, "calories": 300, "protein": 10, "carbs": 40, "fats": 8, "notes": "Optional note"}
      ]
    }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "warnings": ["Any warnings based on medical conditions or allergies"],
  "weeklyVariations": "Brief suggestions for varying meals throughout the week"
}`;

        const userMessage = `Please create a diet plan for me.
Goal: ${goal || 'Maintain a healthy diet'}
${preferences ? `Additional Preferences: ${preferences}` : ''}
${mealsPerDay ? `Preferred Meals Per Day: ${mealsPerDay}` : ''}
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
                    const objMatch = response.match(/\{[\s\S]*"dailyCalories"[\s\S]*"meals"[\s\S]*\}/);
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
            // Deactivate any existing active plans
            await WeeklyPlan.updateMany(
                { userId: req.userId, isActive: true },
                { isActive: false }
            );

            const weeklyPlan = new WeeklyPlan({
                userId: req.userId,
                weekStartDate: weekStartDate || new Date().toISOString().split('T')[0],
                goal: goal || 'general-health',
                dailyTargets: parsed.dailyTargets || {
                    calories: parsed.dailyCalories || 2000,
                    protein: 50,
                    carbs: 250,
                    fats: 65
                },
                plan: parsed,
                isActive: true
            });
            await weeklyPlan.save();
            parsed._savedPlanId = weeklyPlan._id;
        }

        res.json({ plan: parsed });
    } catch (error) {
        console.error('Diet plan error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate diet plan' });
    }
});

// GET /api/diet/plans — Get user's saved weekly plans
router.get('/plans', auth, async (req, res) => {
    try {
        const plans = await WeeklyPlan.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ plans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// GET /api/diet/plans/active — Get the active weekly plan
router.get('/plans/active', auth, async (req, res) => {
    try {
        const plan = await WeeklyPlan.findOne({ userId: req.userId, isActive: true });
        res.json({ plan: plan || null });
    } catch (error) {
        console.error('Get active plan error:', error);
        res.status(500).json({ error: 'Failed to fetch active plan' });
    }
});

// DELETE /api/diet/plans/:id
router.delete('/plans/:id', auth, async (req, res) => {
    try {
        await WeeklyPlan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ message: 'Plan deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// ============================================================
// MEAL LOGGING
// ============================================================

// POST /api/diet/meal — Add a meal and estimate nutrition via AI
router.post('/meal', auth, async (req, res) => {
    try {
        const { foodName, grams, mealType, date, manualNutrition } = req.body;

        if (!foodName || !grams) {
            return res.status(400).json({ error: 'Food name and grams are required' });
        }

        let nutrition = {};

        if (manualNutrition) {
            // User provided manual values
            nutrition = {
                calories: manualNutrition.calories || 0,
                protein: manualNutrition.protein || 0,
                carbs: manualNutrition.carbs || 0,
                fats: manualNutrition.fats || 0,
                fiber: manualNutrition.fiber || 0,
                isManualOverride: true
            };
        } else {
            // AI estimates nutrition
            const prompt = `Estimate the nutritional content. Respond ONLY with valid JSON, no other text.

Food: ${foodName}
Amount: ${grams} grams

{
  "calories": <number>,
  "protein": <grams as number>,
  "carbs": <grams as number>,
  "fats": <grams as number>,
  "fiber": <grams as number>
}`;

            try {
                const aiResponse = await callGrok(
                    'You are a nutrition database. Return ONLY valid JSON with nutritional estimates. No explanations, no markdown, just the JSON object.',
                    [{ role: 'user', content: prompt }]
                );

                let jsonStr = aiResponse.trim();
                const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) jsonStr = jsonMatch[1].trim();
                // Also try to extract just the JSON object
                const objMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (objMatch) jsonStr = objMatch[0];

                nutrition = JSON.parse(jsonStr);
                nutrition.isManualOverride = false;
            } catch {
                // Fallback rough estimate if AI fails
                nutrition = {
                    calories: Math.round(grams * 1.5),
                    protein: Math.round(grams * 0.05),
                    carbs: Math.round(grams * 0.2),
                    fats: Math.round(grams * 0.03),
                    fiber: Math.round(grams * 0.02),
                    isManualOverride: false
                };
            }
        }

        const meal = new Meal({
            userId: req.userId,
            date: date || new Date().toISOString().split('T')[0],
            mealType: mealType || 'snack',
            foodName,
            grams,
            ...nutrition
        });

        await meal.save();
        res.status(201).json({ meal });
    } catch (error) {
        console.error('Add meal error:', error);
        res.status(500).json({ error: 'Failed to add meal' });
    }
});

// GET /api/diet/meals?date=YYYY-MM-DD — Get meals for a specific date
router.get('/meals', auth, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const meals = await Meal.find({ userId: req.userId, date }).sort({ createdAt: 1 });
        res.json({ meals, date });
    } catch (error) {
        console.error('Get meals error:', error);
        res.status(500).json({ error: 'Failed to fetch meals' });
    }
});

// PUT /api/diet/meal/:id — Update a meal (for manual override)
router.put('/meal/:id', auth, async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ['foodName', 'grams', 'mealType', 'calories', 'protein', 'carbs', 'fats', 'fiber'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // If user is updating nutrition values, mark as manual override
        const nutritionFields = ['calories', 'protein', 'carbs', 'fats', 'fiber'];
        if (nutritionFields.some(f => updates[f] !== undefined)) {
            updates.isManualOverride = true;
        }

        const meal = await Meal.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: updates },
            { new: true }
        );

        if (!meal) return res.status(404).json({ error: 'Meal not found' });
        res.json({ meal });
    } catch (error) {
        console.error('Update meal error:', error);
        res.status(500).json({ error: 'Failed to update meal' });
    }
});

// DELETE /api/diet/meal/:id — Delete a meal
router.delete('/meal/:id', auth, async (req, res) => {
    try {
        const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!meal) return res.status(404).json({ error: 'Meal not found' });
        res.json({ message: 'Meal deleted' });
    } catch (error) {
        console.error('Delete meal error:', error);
        res.status(500).json({ error: 'Failed to delete meal' });
    }
});

// GET /api/diet/summary?date=YYYY-MM-DD — Daily nutrition summary
router.get('/summary', auth, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const meals = await Meal.find({ userId: req.userId, date });

        const totals = meals.reduce((acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fats: acc.fats + (meal.fats || 0),
            fiber: acc.fiber + (meal.fiber || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

        // Round values
        for (const key in totals) {
            totals[key] = Math.round(totals[key] * 10) / 10;
        }

        // Get active plan targets if any
        const activePlan = await WeeklyPlan.findOne({ userId: req.userId, isActive: true });

        res.json({
            date,
            totals,
            mealCount: meals.length,
            targets: activePlan?.dailyTargets || null
        });
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
});

module.exports = router;
