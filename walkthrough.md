# Healthcare Buddy
An AI-powered health and fitness companion application built with the MERN stack (MongoDB, Express, React, Node.js) and Grok AI.

## Features
- Symptom Checker: Intelligent AI-driven chat that analyzes symptoms, asks follow-up questions, and diagnoses potential conditions.
- Diet Planner: Custom meal plan generation, macro tracking, and logging for individual meals.
- Exercise Planner: Personalized workout routines, exercise logging, and weekly targeting.
- Health Dashboard: Analytics and tracking for your wellnessjourney, including activity streaks and condition monitoring.

## Tech Stack
- Frontend: React (Vite), React Router
- Backend: Node.js, Express
- Database: MongoDB Atlas
- AI Integration: Groq API
- Authentication: JWT and bcryptjs

## Prerequisites
- Node.js installed
- MongoDB Atlas account (with your IP whitelisted)
- API Key for Groq 

## Running the Application
### Backend
1. Navigate to the `server` directory
2. Create a `.env` file with `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and `PORT`.
3. Run `npm install`
4. Run `node server.js`

### Frontend
1. Navigate to the `client` directory
2. Run `npm install`
3. Run `npm run dev`
4. Open the displayed localhost URL in your browser.
