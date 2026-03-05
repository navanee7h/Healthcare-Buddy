import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import './Dashboard.css';
import './DashboardHome.css';

function Dashboard() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', icon: '🏠', label: 'Home', exact: true },
        { path: '/dashboard/symptom-checker', icon: '🩺', label: 'Symptom Checker' },
        { path: '/dashboard/diet-planner', icon: '🥗', label: 'Diet Planner' },
        { path: '/dashboard/exercise-planner', icon: '💪', label: 'Exercise Planner' },
        { path: '/dashboard/profile', icon: '👤', label: 'Profile' },
    ];

    const isActive = (path, exact) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <span className="logo-icon">🏥</span>
                        <span className="logo-text">Health<span className="text-accent">Buddy</span></span>
                    </Link>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link key={item.path} to={item.path}
                            className={`sidebar-link ${isActive(item.path, item.exact) ? 'active' : ''}`}>
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.name}</span>
                            <span className="sidebar-user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-sm btn-full" onClick={handleLogout}>Sign Out</button>
                </div>
            </aside>
            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
}

// ============================================================
// Dashboard Home — Rich Analytics
// ============================================================
export function DashboardHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wellbeingForm, setWellbeingForm] = useState({});
    const [medForm, setMedForm] = useState({});
    const [showMedForm, setShowMedForm] = useState(null);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await dashboardAPI.getStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleWellbeingSubmit = async (diagId) => {
        const form = wellbeingForm[diagId];
        if (!form?.feeling) return;
        try {
            await dashboardAPI.addWellbeing(diagId, form);
            setWellbeingForm({ ...wellbeingForm, [diagId]: {} });
            fetchStats();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddMedication = async (diagId) => {
        const form = medForm[diagId];
        if (!form?.name) return;
        try {
            await dashboardAPI.addMedication(diagId, form);
            setMedForm({ ...medForm, [diagId]: {} });
            setShowMedForm(null);
            fetchStats();
        } catch (err) {
            console.error(err);
        }
    };

    const getBMI = () => {
        if (user?.weight && user?.height) {
            const heightM = user.height / 100;
            const bmi = (user.weight / (heightM * heightM)).toFixed(1);
            let category = '', color = '#10b981';
            if (bmi < 18.5) { category = 'Underweight'; color = '#f59e0b'; }
            else if (bmi < 25) { category = 'Normal'; color = '#10b981'; }
            else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; }
            else { category = 'Obese'; color = '#ef4444'; }
            return { value: bmi, category, color };
        }
        return null;
    };

    const bmi = getBMI();

    if (loading) {
        return (
            <div className="dashboard-home">
                <div className="loading-container"><div className="spinner spinner-lg"></div><p>Loading dashboard...</p></div>
            </div>
        );
    }

    const maxChartValue = stats?.weeklyData
        ? Math.max(...stats.weeklyData.map(d => Math.max(d.consumed, d.burned)), 1)
        : 1;

    return (
        <div className="dashboard-home animate-fadeInUp">
            {/* Welcome + Quick Stats */}
            <div className="dash-welcome">
                <div className="dash-welcome-left">
                    <h1>Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋</h1>
                    <p className="text-muted">Here's your health overview for today.</p>
                </div>
                <div className="dash-streak">
                    <span className="streak-fire">🔥</span>
                    <span className="streak-number">{stats?.streak || 0}</span>
                    <span className="streak-label">day streak</span>
                </div>
            </div>

            {/* Today's Summary Cards */}
            <div className="dash-stats-grid">
                <div className="dash-stat-card">
                    <div className="dsc-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>🍽️</div>
                    <div className="dsc-info">
                        <span className="dsc-value">{stats?.today?.caloriesConsumed || 0}</span>
                        <span className="dsc-label">Consumed</span>
                    </div>
                    {stats?.dailyCalorieReq && <span className="dsc-target">/ {stats.dailyCalorieReq} kcal</span>}
                </div>
                <div className="dash-stat-card">
                    <div className="dsc-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>🔥</div>
                    <div className="dsc-info">
                        <span className="dsc-value">{stats?.today?.caloriesBurned || 0}</span>
                        <span className="dsc-label">Burned</span>
                    </div>
                    {stats?.targets?.exercise && <span className="dsc-target">/ {stats.targets.exercise.caloriesBurned} kcal</span>}
                </div>
                <div className="dash-stat-card">
                    <div className="dsc-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>⚡</div>
                    <div className="dsc-info">
                        <span className="dsc-value">{stats?.today?.netCalories || 0}</span>
                        <span className="dsc-label">Net Calories</span>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dsc-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>🥩</div>
                    <div className="dsc-info">
                        <span className="dsc-value">{stats?.today?.protein || 0}g</span>
                        <span className="dsc-label">Protein</span>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dsc-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>⏱️</div>
                    <div className="dsc-info">
                        <span className="dsc-value">{stats?.today?.exerciseDuration || 0}</span>
                        <span className="dsc-label">Minutes Active</span>
                    </div>
                </div>
                {bmi && (
                    <div className="dash-stat-card">
                        <div className="dsc-icon" style={{ background: `${bmi.color}25` }}>📊</div>
                        <div className="dsc-info">
                            <span className="dsc-value">{bmi.value}</span>
                            <span className="dsc-label">BMI ({bmi.category})</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Calorie Requirement Banner */}
            {stats?.dailyCalorieReq && (
                <div className="calorie-req-banner">
                    <div className="crb-info">
                        <span className="crb-label">Daily Calorie Requirement</span>
                        <span className="crb-value">{stats.dailyCalorieReq} kcal</span>
                    </div>
                    <div className="crb-progress">
                        <div className="crb-bar">
                            <div className="crb-fill" style={{
                                width: `${Math.min(100, ((stats.today?.caloriesConsumed || 0) / stats.dailyCalorieReq) * 100)}%`,
                                background: (stats.today?.caloriesConsumed || 0) > stats.dailyCalorieReq ? '#ef4444' : 'var(--accent-gradient)'
                            }}></div>
                        </div>
                        <span className="crb-percent">{Math.round(((stats.today?.caloriesConsumed || 0) / stats.dailyCalorieReq) * 100)}%</span>
                    </div>
                </div>
            )}

            {/* Weekly Chart */}
            <div className="dash-chart card">
                <div className="chart-header">
                    <h3>📊 Weekly Calories</h3>
                    <div className="chart-legend">
                        <span className="legend-item"><span className="legend-dot consumed"></span>Consumed</span>
                        <span className="legend-item"><span className="legend-dot burned"></span>Burned</span>
                    </div>
                </div>
                <div className="chart-body">
                    {stats?.weeklyData?.map((day, i) => (
                        <div key={i} className={`chart-day ${day.logged ? '' : 'chart-day-empty'}`}>
                            <div className="chart-bars">
                                <div className="chart-bar consumed" style={{ height: `${(day.consumed / maxChartValue) * 100}%` }}
                                    title={`${day.consumed} cal consumed`}>
                                    {day.consumed > 0 && <span className="bar-value">{day.consumed}</span>}
                                </div>
                                <div className="chart-bar burned" style={{ height: `${(day.burned / maxChartValue) * 100}%` }}
                                    title={`${day.burned} cal burned`}>
                                    {day.burned > 0 && <span className="bar-value">{day.burned}</span>}
                                </div>
                            </div>
                            <span className="chart-label">{day.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Two Column: Tools + Diagnoses */}
            <div className="dash-two-col">
                {/* Quick Tools */}
                <div className="dash-tools">
                    <h3>Health Tools</h3>
                    <div className="tool-cards-compact">
                        <Link to="/dashboard/symptom-checker" className="tool-card-mini">
                            <span className="tcm-icon" style={{ background: '#ef444420' }}>🩺</span>
                            <div><strong>Symptom Checker</strong><p>AI-powered diagnosis</p></div>
                        </Link>
                        <Link to="/dashboard/diet-planner" className="tool-card-mini">
                            <span className="tcm-icon" style={{ background: '#10b98120' }}>🥗</span>
                            <div><strong>Diet Planner</strong><p>Log meals & plans</p></div>
                        </Link>
                        <Link to="/dashboard/exercise-planner" className="tool-card-mini">
                            <span className="tcm-icon" style={{ background: '#3b82f620' }}>💪</span>
                            <div><strong>Exercise Planner</strong><p>Track workouts</p></div>
                        </Link>
                    </div>
                </div>

                {/* Active Diagnoses */}
                <div className="dash-diagnoses">
                    <h3>🏥 Health Monitoring</h3>
                    {stats?.diagnoses?.length > 0 ? (
                        <div className="diagnoses-list">
                            {stats.diagnoses.map(diag => (
                                <div key={diag._id} className={`diagnosis-card severity-${diag.severity}`}>
                                    <div className="diag-header">
                                        <div>
                                            <h4>{diag.conditionName}</h4>
                                            <span className={`tag tag-${diag.severity === 'severe' ? 'danger' : diag.severity === 'moderate' ? 'warning' : 'success'}`}>
                                                {diag.severity} • {diag.status}
                                            </span>
                                        </div>
                                        <span className="diag-date">{new Date(diag.diagnosedDate).toLocaleDateString()}</span>
                                    </div>

                                    {diag.recommendation && (
                                        <p className="diag-rec">💡 {diag.recommendation}</p>
                                    )}

                                    {/* Medications */}
                                    <div className="diag-meds">
                                        <div className="diag-meds-header">
                                            <span className="dm-label">💊 Medications</span>
                                            <button className="btn btn-sm btn-secondary"
                                                onClick={() => setShowMedForm(showMedForm === diag._id ? null : diag._id)}>
                                                + Add
                                            </button>
                                        </div>
                                        {diag.medications?.length > 0 ? (
                                            <div className="med-list">
                                                {diag.medications.map((med, i) => (
                                                    <div key={med._id || i} className={`med-item ${med.isActive ? '' : 'med-inactive'}`}>
                                                        <span className="med-name">{med.name}</span>
                                                        {med.dosage && <span className="med-dosage">{med.dosage}</span>}
                                                        <span className="med-since">since {new Date(med.startDate).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>No medications tracked</p>
                                        )}
                                        {showMedForm === diag._id && (
                                            <div className="med-add-form animate-fadeIn">
                                                <input type="text" className="form-input" placeholder="Medication name"
                                                    value={medForm[diag._id]?.name || ''}
                                                    onChange={(e) => setMedForm({ ...medForm, [diag._id]: { ...medForm[diag._id], name: e.target.value } })} />
                                                <input type="text" className="form-input" placeholder="Dosage (e.g., 500mg twice daily)"
                                                    value={medForm[diag._id]?.dosage || ''}
                                                    onChange={(e) => setMedForm({ ...medForm, [diag._id]: { ...medForm[diag._id], dosage: e.target.value } })} />
                                                <button className="btn btn-primary btn-sm" onClick={() => handleAddMedication(diag._id)}>Save</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Wellbeing Check-in */}
                                    <div className="diag-wellbeing">
                                        <span className="dm-label">How are you feeling?</span>
                                        <div className="feeling-options">
                                            {['worse', 'same', 'better', 'resolved'].map(f => (
                                                <button key={f}
                                                    className={`feeling-btn ${wellbeingForm[diag._id]?.feeling === f ? 'active' : ''}`}
                                                    onClick={() => setWellbeingForm({
                                                        ...wellbeingForm,
                                                        [diag._id]: { ...wellbeingForm[diag._id], feeling: f }
                                                    })}>
                                                    {f === 'worse' ? '😟' : f === 'same' ? '😐' : f === 'better' ? '😊' : '🎉'} {f}
                                                </button>
                                            ))}
                                        </div>
                                        {wellbeingForm[diag._id]?.feeling && (
                                            <div className="wellbeing-note animate-fadeIn">
                                                <textarea className="form-input" rows={2} placeholder="Add a note (optional)"
                                                    value={wellbeingForm[diag._id]?.note || ''}
                                                    onChange={(e) => setWellbeingForm({
                                                        ...wellbeingForm,
                                                        [diag._id]: { ...wellbeingForm[diag._id], note: e.target.value }
                                                    })} />
                                                <button className="btn btn-primary btn-sm" onClick={() => handleWellbeingSubmit(diag._id)}>
                                                    Submit Check-in
                                                </button>
                                            </div>
                                        )}
                                        {diag.wellbeingNotes?.length > 0 && (
                                            <div className="wellbeing-history">
                                                {diag.wellbeingNotes.slice(-3).reverse().map((n, i) => (
                                                    <div key={i} className="wb-entry">
                                                        <span className="wb-feeling">{n.feeling === 'worse' ? '😟' : n.feeling === 'same' ? '😐' : n.feeling === 'better' ? '😊' : '🎉'}</span>
                                                        <span className="wb-date">{new Date(n.date).toLocaleDateString()}</span>
                                                        {n.note && <span className="wb-note">{n.note}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-diagnoses">
                            <p>✅ No active health conditions</p>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Use the Symptom Checker to analyze any symptoms. Diagnosed conditions will appear here for tracking.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Health Profile */}
            {user?.medicalConditions?.length > 0 && (
                <div className="health-summary">
                    <h3>Your Health Profile</h3>
                    <div className="summary-tags">
                        {user.medicalConditions.length > 0 && (
                            <div className="summary-group">
                                <span className="summary-label">Conditions:</span>
                                {user.medicalConditions.map((c, i) => <span key={i} className="tag tag-warning">{c}</span>)}
                            </div>
                        )}
                        {user.allergies?.length > 0 && (
                            <div className="summary-group">
                                <span className="summary-label">Allergies:</span>
                                {user.allergies.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
                            </div>
                        )}
                        {user.medications?.length > 0 && (
                            <div className="summary-group">
                                <span className="summary-label">Medications:</span>
                                {user.medications.map((m, i) => <span key={i} className="tag">{m}</span>)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
