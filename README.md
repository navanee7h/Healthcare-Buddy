# 🩺 Healthcare Buddy

An AI-powered health and fitness companion web application designed to help users track their wellness journey. Built with the robust MERN stack (MongoDB, Express, React, Node.js) and powered by X.AI's intelligent Grok API.

![Healthcare Buddy Dashboard](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white)

---

## ✨ Key Features

1. **🤖 AI Symptom Checker**: A conversational medical assistant that analyzes your symptoms, asks targeted follow-up questions, and provides potential diagnoses with severity ratings and recommendations. Diagnoses are automatically saved to your dashboard for health monitoring.
2. **🥗 Smart Diet Planner**: Generate highly personalized weekly diet plans based on your fitness goals, body metrics, and dietary preferences. Track your daily macronutrients (Protein, Carbs, Fats) and log individual meals with automatic AI-driven nutritional estimations.
3. **💪 Custom Exercise Planner**: Get tailored workout routines designed for your specific equipment, duration constraints, and fitness goals. Log daily activities, track calories burned, and follow weekly progression schedules.
4. **📊 Comprehensive Wellness Dashboard**: Monitor your daily calorie requirements (calculated via the Harris-Benedict equation), view weekly consumed vs. burned charts, track activity streaks, and manage ongoing medical conditions (medications and wellbeing check-ins).

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), React Router, raw CSS for responsive and modern theming.
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI Integration:** X.AI Grok API (`grok-beta` model)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs for secure password hashing.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project running on your local machine for development and testing.

### Prerequisites

You will need the following installed:
- [Node.js](https://nodejs.org/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Cluster (ensure your IP is whitelisted)
- An API Key from [X.AI (Grok)](https://x.ai/api)

### 1. Clone the repository

```bash
git clone https://github.com/navanee7h/Healthcare-Buddy.git
cd Healthcare-Buddy
```

### 2. Backend Setup

Navigate to the `server` directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add the following environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GROK_API_KEY=your_x_ai_grok_api_key
```

Start the backend development server:

```bash
npm start
# or 'node server.js'
```

### 3. Frontend Setup

Open a new terminal window, navigate to the `client` directory, and install dependencies:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Your application should now be running! Open your browser and navigate to `http://localhost:5173`.

---

## 📂 Project Structure

\`\`\`text
Healthcare-Buddy/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Full page views (Dashboard, Planners, etc.)
│   │   ├── services/       # Axios API integration
│   │   ├── App.jsx         # Main routing file
│   │   └── index.css       # Global design variables & base styles
├── server/                 # Node.js/Express Backend
│   ├── middleware/         # Custom Express middleware (Auth verification)
│   ├── models/             # Mongoose schemas (User, Meal, Diagnosis, etc.)
│   ├── routes/             # API endpoints (auth, dashboard, diet, exercise, symptom)
│   ├── services/           # External service integrations (Grok API logic)
│   └── server.js           # Express app entry point
└── README.md
\`\`\`

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).


<img width="1909" height="917" alt="image" src="https://github.com/user-attachments/assets/a435560d-2679-4fde-b592-3ad366bfb9e4" />
<img width="1254" height="912" alt="image" src="https://github.com/user-attachments/assets/093b9e9a-ab4d-4c02-b6ea-69141404e2c8" />
<img width="1148" height="869" alt="image" src="https://github.com/user-attachments/assets/622229c4-498e-4caa-9f0f-70057b6ef85a" />
<img width="1546" height="900" alt="image" src="https://github.com/user-attachments/assets/d4fcee59-b347-4a09-b37f-e077dca7e03d" />
<img width="1580" height="910" alt="image" src="https://github.com/user-attachments/assets/1a445afe-05ee-4ab8-9e41-5d55f049ad87" />
<img width="1543" height="868" alt="image" src="https://github.com/user-attachments/assets/20efa6a2-062c-44cf-b39d-1b953503d007" />
<img width="1363" height="741" alt="image" src="https://github.com/user-attachments/assets/a6bb95a6-1154-4f0e-9b0b-7b8c2417b27c" />


