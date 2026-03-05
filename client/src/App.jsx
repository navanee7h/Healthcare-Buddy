import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Dashboard, { DashboardHome } from './pages/Dashboard';
import SymptomChecker from './pages/SymptomChecker';
import DietPlanner from './pages/DietPlanner';
import ExercisePlanner from './pages/ExercisePlanner';
import Profile from './pages/Profile';

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)'
            }}>
                <div className="loading-container">
                    <div className="spinner spinner-lg"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    return children;
}

// Public Route wrapper (redirect to dashboard if logged in)
function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;

    return children;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/signin" element={
                        <PublicRoute><Signin /></PublicRoute>
                    } />
                    <Route path="/signup" element={
                        <PublicRoute><Signup /></PublicRoute>
                    } />

                    {/* Protected Dashboard Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    }>
                        <Route index element={<DashboardHome />} />
                        <Route path="symptom-checker" element={<SymptomChecker />} />
                        <Route path="diet-planner" element={<DietPlanner />} />
                        <Route path="exercise-planner" element={<ExercisePlanner />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
