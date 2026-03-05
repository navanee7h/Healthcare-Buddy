const axios = require('axios');

const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROK_MODEL = 'llama-3.3-70b-versatile';

/**
 * Call the Grok API with messages and return the AI response
 * @param {string} systemPrompt - The system prompt with context
 * @param {Array} messages - Array of {role, content} message objects
 * @returns {string} The AI response text
 */
async function callGrok(systemPrompt, messages) {
    try {
        const response = await axios.post(
            GROK_API_URL,
            {
                model: GROK_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Grok API Error:', error.response?.data || error.message);
        throw new Error('Failed to get AI response. Please try again.');
    }
}

/**
 * Build a user health context string for system prompts
 * @param {Object} user - The user document from MongoDB
 * @returns {string} Formatted user health context
 */
function buildUserContext(user) {
    const parts = [
        `Patient Profile:`,
        `- Name: ${user.name}`,
        `- Age: ${user.age} years old`,
        `- Gender: ${user.gender}`,
        `- Weight: ${user.weight} kg`,
        `- Height: ${user.height} cm`,
        `- Nationality: ${user.nationality}`,
    ];

    if (user.medicalConditions.length > 0) {
        parts.push(`- Medical Conditions: ${user.medicalConditions.join(', ')}`);
    }
    if (user.medications.length > 0) {
        parts.push(`- Current Medications: ${user.medications.join(', ')}`);
    }
    if (user.allergies.length > 0) {
        parts.push(`- Allergies: ${user.allergies.join(', ')}`);
    }
    if (user.dietaryPreferences && user.dietaryPreferences !== 'none') {
        parts.push(`- Dietary Preferences: ${user.dietaryPreferences}`);
    }
    if (user.fitnessLevel) {
        parts.push(`- Fitness Level: ${user.fitnessLevel}`);
    }

    return parts.join('\n');
}

module.exports = { callGrok, buildUserContext };
