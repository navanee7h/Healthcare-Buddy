const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Diagnosis = require('../models/Diagnosis');
const { callGrok, buildUserContext } = require('../services/grokService');

const router = express.Router();

// POST /api/symptom/check
router.post('/check', auth, async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Please describe your symptoms' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userContext = buildUserContext(user);

        const systemPrompt = `You are an expert medical symptom analysis assistant for Healthcare Buddy.

${userContext}

Your role is to help analyze symptoms and suggest possible conditions. Follow these rules:

1. ASK ONE QUESTION AT A TIME: This is critical. After the user describes their symptoms, ask only ONE follow-up question per response. Be conversational and empathetic, like a real doctor having a conversation. Do NOT ask multiple questions in a single message.
   
   Topics to cover across multiple exchanges (one per message):
   - Duration and severity of symptoms
   - Associated symptoms
   - When symptoms worsen or improve
   - Recent activities, travel, or exposure
   - Family history if relevant

2. CONVERSATIONAL FLOW: After each answer, briefly acknowledge what the user said, then ask the next single question. After 4-6 exchanges, when you have enough information, provide a diagnosis.

3. DIAGNOSIS FORMAT: When you have enough information (after gathering sufficient answers), provide your analysis in this EXACT JSON format:
{
  "type": "diagnosis",
  "conditions": [
    {"name": "Condition Name", "probability": 85, "description": "Brief explanation", "severity": "mild|moderate|severe", "recommendation": "What to do"},
    {"name": "Another Condition", "probability": 10, "description": "Brief explanation", "severity": "mild|moderate|severe", "recommendation": "What to do"}
  ],
  "generalAdvice": "Overall advice for the patient",
  "seekEmergencyCare": false
}

4. QUESTION FORMAT: When asking a question, use this format:
{
  "type": "questions",
  "message": "Your brief empathetic acknowledgment + single follow-up question"
}

5. Always respond with valid JSON in one of the two formats above.
6. Consider the patient's existing medical conditions, medications, and allergies when analyzing.
7. IMPORTANT: Always include a disclaimer that this is not a substitute for professional medical advice.
8. Probabilities should add up to approximately 100%.
9. Keep each question message SHORT and conversational (2-3 sentences max).`;

        const grokMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        const response = await callGrok(systemPrompt, grokMessages);

        let parsed;
        try {
            // Try direct parse first
            parsed = JSON.parse(response.trim());
        } catch {
            try {
                // Try extracting from markdown code block
                let jsonStr = response;
                const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1].trim();
                    parsed = JSON.parse(jsonStr);
                } else {
                    // Try to find a JSON object in mixed text (text before/after JSON)
                    const objMatch = response.match(/\{[\s\S]*"type"\s*:\s*"(?:diagnosis|questions)"[\s\S]*\}/);
                    if (objMatch) {
                        parsed = JSON.parse(objMatch[0]);
                    } else {
                        throw new Error('No JSON found');
                    }
                }
            } catch {
                // Fallback: treat entire response as a question message
                // Strip any partial JSON from the display text
                const cleanText = response.replace(/\{[\s\S]*\}/, '').trim();
                parsed = {
                    type: 'questions',
                    message: cleanText || response
                };
            }
        }

        // Save diagnoses to database if diagnosis type
        if (parsed.type === 'diagnosis' && parsed.conditions?.length > 0) {
            try {
                for (const condition of parsed.conditions) {
                    if (condition.probability >= 30) { // Only save likely conditions
                        // Check if this condition already exists for the user
                        const existing = await Diagnosis.findOne({
                            userId: req.userId,
                            conditionName: condition.name,
                            status: { $ne: 'resolved' }
                        });

                        if (!existing) {
                            await Diagnosis.create({
                                userId: req.userId,
                                conditionName: condition.name,
                                probability: condition.probability,
                                severity: condition.severity || 'mild',
                                description: condition.description,
                                recommendation: condition.recommendation
                            });
                        }
                    }
                }
            } catch (saveErr) {
                console.error('Failed to save diagnosis:', saveErr);
                // Don't fail the response if save fails
            }
        }

        res.json({ response: parsed });
    } catch (error) {
        console.error('Symptom check error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze symptoms' });
    }
});

module.exports = router;
