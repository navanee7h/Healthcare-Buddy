import { useState, useEffect } from 'react';
import { exerciseAPI } from '../services/api';
import './Planner.css';
import './ExerciseTracker.css';

function ExercisePlanner() {
    const [activeTab, setActiveTab] = useState('log');

    const tabs = [
        { id: 'log', label: "Today's Workout", icon: '🏋️' },
        { id: 'generate', label: 'Generate Plan', icon: '🤖' },
        { id: 'plans', label: 'Weekly Plans', icon: '📅' },
    ];

    return (
        <div className="planner-page exercise-tracker">
            <div className="page-header">
                <h1>💪 Exercise Planner</h1>
                <p>Log your workouts, track calories burned, and manage your fitness plans.</p>
            </div>

            <div className="tracker-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tracker-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'log' && <TodaysWorkout />}
            {activeTab === 'generate' && <GeneratePlan />}
            {activeTab === 'plans' && <WeeklyPlans />}
        </div>
    );
}

// ============================================================
// Tab 1: Today's Workout Log
// ============================================================
function TodaysWorkout() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [exercises, setExercises] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingExercise, setAddingExercise] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);

    const [newExercise, setNewExercise] = useState({
        exerciseName: '', duration: '', category: 'cardio', intensity: 'moderate', sets: '', reps: '', notes: ''
    });
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => { fetchData(); }, [date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, summaryRes] = await Promise.all([
                exerciseAPI.getLogs(date),
                exerciseAPI.getSummary(date)
            ]);
            setExercises(logsRes.data.exercises);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error('Failed to fetch exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExercise = async (e) => {
        e.preventDefault();
        if (!newExercise.exerciseName || !newExercise.duration) return;
        setAddLoading(true);
        try {
            await exerciseAPI.addLog({ ...newExercise, duration: Number(newExercise.duration), date });
            setNewExercise({ exerciseName: '', duration: '', category: 'cardio', intensity: 'moderate', sets: '', reps: '', notes: '' });
            setAddingExercise(false);
            fetchData();
        } catch (err) {
            console.error('Failed to add exercise:', err);
        } finally {
            setAddLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await exerciseAPI.deleteLog(id);
            fetchData();
        } catch (err) {
            console.error('Failed to delete exercise:', err);
        }
    };

    const handleUpdate = async (id, updates) => {
        try {
            await exerciseAPI.updateLog(id, updates);
            setEditingExercise(null);
            fetchData();
        } catch (err) {
            console.error('Failed to update exercise:', err);
        }
    };

    const categoryLabels = {
        cardio: '🏃 Cardio', strength: '🏋️ Strength', flexibility: '🧘 Flexibility',
        sports: '⚽ Sports', other: '🔄 Other'
    };

    const categoryGroups = {};
    exercises.forEach(ex => {
        if (!categoryGroups[ex.category]) categoryGroups[ex.category] = [];
        categoryGroups[ex.category].push(ex);
    });

    return (
        <div className="todays-log animate-fadeInUp">
            {/* Date Selector */}
            <div className="date-selector">
                <button className="btn btn-sm btn-secondary" onClick={() => {
                    const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]);
                }}>←</button>
                <input type="date" className="form-input date-input" value={date} onChange={(e) => setDate(e.target.value)} />
                <button className="btn btn-sm btn-secondary" onClick={() => {
                    const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]);
                }}>→</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setDate(new Date().toISOString().split('T')[0])}>Today</button>
            </div>

            {/* Daily Summary with Diet Integration */}
            {summary && (
                <div className="exercise-summary">
                    <div className="summary-stats-row">
                        <div className="ex-stat-card burned">
                            <span className="ex-stat-icon">🔥</span>
                            <span className="ex-stat-value">{Math.round(summary.exercise.caloriesBurned)}</span>
                            <span className="ex-stat-label">Burned</span>
                            {summary.targets && <span className="ex-stat-target">/ {summary.targets.caloriesBurned} kcal</span>}
                        </div>
                        <div className="ex-stat-card consumed">
                            <span className="ex-stat-icon">🍽️</span>
                            <span className="ex-stat-value">{summary.caloriesConsumed}</span>
                            <span className="ex-stat-label">Consumed</span>
                        </div>
                        <div className={`ex-stat-card net ${summary.netCalories > 0 ? 'surplus' : 'deficit'}`}>
                            <span className="ex-stat-icon">{summary.netCalories > 0 ? '📈' : '📉'}</span>
                            <span className="ex-stat-value">{summary.netCalories > 0 ? '+' : ''}{summary.netCalories}</span>
                            <span className="ex-stat-label">Net Cal</span>
                        </div>
                        <div className="ex-stat-card duration">
                            <span className="ex-stat-icon">⏱️</span>
                            <span className="ex-stat-value">{summary.exercise.totalDuration}</span>
                            <span className="ex-stat-label">Minutes</span>
                            {summary.targets && <span className="ex-stat-target">/ {summary.targets.duration} min</span>}
                        </div>
                    </div>
                    {!summary.targets && (
                        <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: 8 }}>
                            💡 Generate & save a plan to see daily targets
                        </p>
                    )}
                </div>
            )}

            {/* Add Exercise Button */}
            {!addingExercise && (
                <button className="btn btn-primary add-meal-btn" onClick={() => setAddingExercise(true)}>
                    + Log Exercise
                </button>
            )}

            {/* Add Exercise Form */}
            {addingExercise && (
                <div className="add-meal-form card animate-fadeInUp">
                    <h4>Log an Exercise</h4>
                    <form onSubmit={handleAddExercise}>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Exercise Name</label>
                                <input type="text" className="form-input" placeholder="e.g., Running, Push-ups, Yoga..." value={newExercise.exerciseName} onChange={(e) => setNewExercise({ ...newExercise, exerciseName: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Duration (min)</label>
                                <input type="number" className="form-input" placeholder="30" value={newExercise.duration} onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })} min="1" required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-select" value={newExercise.category} onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}>
                                    <option value="cardio">Cardio</option>
                                    <option value="strength">Strength</option>
                                    <option value="flexibility">Flexibility</option>
                                    <option value="sports">Sports</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Intensity</label>
                                <select className="form-select" value={newExercise.intensity} onChange={(e) => setNewExercise({ ...newExercise, intensity: e.target.value })}>
                                    <option value="light">Light</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="intense">Intense</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Sets (optional)</label>
                                <input type="number" className="form-input" placeholder="3" value={newExercise.sets} onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Reps (optional)</label>
                                <input type="text" className="form-input" placeholder="12-15" value={newExercise.reps} onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })} />
                            </div>
                        </div>
                        <div className="step-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setAddingExercise(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={addLoading}>
                                {addLoading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Estimating...</> : 'Log Exercise'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Exercise List */}
            {loading ? (
                <div className="loading-container"><div className="spinner spinner-lg"></div><p>Loading exercises...</p></div>
            ) : exercises.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🏃</span>
                    <h3>No exercises logged yet</h3>
                    <p>Start logging your workouts to track calories burned</p>
                </div>
            ) : (
                <div className="meals-by-type">
                    {Object.entries(categoryGroups).map(([cat, catExercises]) => (
                        <div key={cat} className="meal-type-group">
                            <h3 className="meal-type-header">{categoryLabels[cat] || cat}</h3>
                            {catExercises.map(ex => (
                                <ExerciseCard
                                    key={ex._id}
                                    exercise={ex}
                                    isEditing={editingExercise === ex._id}
                                    onEdit={() => setEditingExercise(ex._id)}
                                    onCancelEdit={() => setEditingExercise(null)}
                                    onSave={(updates) => handleUpdate(ex._id, updates)}
                                    onDelete={() => handleDelete(ex._id)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Exercise Card
// ============================================================
function ExerciseCard({ exercise, isEditing, onEdit, onCancelEdit, onSave, onDelete }) {
    const [editForm, setEditForm] = useState({
        caloriesBurned: exercise.caloriesBurned,
        duration: exercise.duration
    });

    const intensityColors = {
        light: '#10b981', moderate: '#f59e0b', intense: '#ef4444'
    };

    return (
        <div className="meal-log-card">
            <div className="meal-log-main">
                <div className="meal-log-info">
                    <span className="meal-log-name">{exercise.exerciseName}</span>
                    <span className="meal-log-grams">
                        {exercise.duration} min • {exercise.intensity}
                        {exercise.sets > 0 && ` • ${exercise.sets} sets`}
                        {exercise.reps && ` × ${exercise.reps}`}
                        {exercise.isManualOverride && <span className="tag" style={{ fontSize: '0.7rem', padding: '2px 6px', marginLeft: 4 }}>edited</span>}
                    </span>
                </div>
                <div className="meal-log-actions">
                    <button className="icon-btn" onClick={onEdit} title="Edit">✏️</button>
                    <button className="icon-btn icon-btn-danger" onClick={onDelete} title="Delete">🗑️</button>
                </div>
            </div>

            <div className="meal-log-macros">
                <span className="macro-chip cal">🔥 {Math.round(exercise.caloriesBurned)} cal burned</span>
                <span className="macro-chip" style={{ background: `${intensityColors[exercise.intensity]}20`, color: intensityColors[exercise.intensity] }}>
                    {exercise.intensity}
                </span>
            </div>

            {isEditing && (
                <div className="meal-edit-panel animate-fadeIn">
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Override values:</p>
                    <div className="edit-macros-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <div className="edit-macro">
                            <label>Calories Burned</label>
                            <input type="number" className="form-input" value={editForm.caloriesBurned} onChange={(e) => setEditForm({ ...editForm, caloriesBurned: e.target.value })} />
                        </div>
                        <div className="edit-macro">
                            <label>Duration (min)</label>
                            <input type="number" className="form-input" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
                        </div>
                    </div>
                    <div className="step-actions" style={{ marginTop: 10 }}>
                        <button className="btn btn-secondary btn-sm" onClick={onCancelEdit}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={() => onSave({
                            caloriesBurned: Number(editForm.caloriesBurned),
                            duration: Number(editForm.duration)
                        })}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Tab 2: Generate Plan
// ============================================================
function GeneratePlan() {
    const [form, setForm] = useState({
        goal: '', daysPerWeek: '4', duration: '45', equipment: '', additionalNotes: '', saveAsPlan: true
    });
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setPlan(null);
        try {
            const res = await exerciseAPI.getPlan(form);
            setPlan(res.data.plan);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate exercise plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="generate-plan animate-fadeInUp">
            {!plan && (
                <div className="planner-form-card card">
                    <h3>What's your fitness goal?</h3>
                    {error && <div className="alert alert-error mt-2">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mt-2">
                            <label>Fitness Goal</label>
                            <select name="goal" className="form-select" value={form.goal} onChange={handleChange}>
                                <option value="">Select your goal</option>
                                <option value="weight-loss">Weight Loss / Fat Burn</option>
                                <option value="muscle-gain">Muscle Building</option>
                                <option value="endurance">Endurance / Stamina</option>
                                <option value="flexibility">Flexibility / Mobility</option>
                                <option value="strength">Strength Training</option>
                                <option value="general-fitness">General Fitness</option>
                                <option value="sports-performance">Sports Performance</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Days Per Week</label>
                                <select name="daysPerWeek" className="form-select" value={form.daysPerWeek} onChange={handleChange}>
                                    <option value="3">3 days</option>
                                    <option value="4">4 days</option>
                                    <option value="5">5 days</option>
                                    <option value="6">6 days</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Session Duration (min)</label>
                                <input type="number" name="duration" className="form-input" value={form.duration} onChange={handleChange} min="15" max="120" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Available Equipment</label>
                            <textarea name="equipment" className="form-input" placeholder="e.g., dumbbells, resistance bands, treadmill... or 'none'" value={form.equipment} onChange={handleChange} rows={2} />
                        </div>
                        <div className="form-group">
                            <label>Additional Notes</label>
                            <textarea name="additionalNotes" className="form-input" placeholder="Injuries, preferences, focus areas..." value={form.additionalNotes} onChange={handleChange} rows={2} />
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="saveAsPlan" checked={form.saveAsPlan} onChange={handleChange} />
                                <span>Save as active weekly plan (sets daily targets)</span>
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> Generating...</> : 'Generate Exercise Plan 💪'}
                        </button>
                    </form>
                </div>
            )}

            {loading && (
                <div className="loading-container"><div className="spinner spinner-lg"></div><p>Creating your personalized plan...</p></div>
            )}

            {plan && !plan.rawResponse && (
                <div className="plan-results animate-fadeInUp">
                    {plan._savedPlanId && <div className="alert alert-success">✅ Plan saved! Daily targets are now active.</div>}

                    <div className="plan-overview">
                        <div className="overview-stat"><span className="overview-icon">📋</span><span className="overview-value">{plan.planName}</span><span className="overview-label">Plan</span></div>
                        <div className="overview-stat"><span className="overview-icon">🔥</span><span className="overview-value">{typeof plan.estimatedCaloriesBurned === 'number' ? plan.estimatedCaloriesBurned : plan.estimatedCaloriesBurned}</span><span className="overview-label">Cal/Session</span></div>
                        <div className="overview-stat"><span className="overview-icon">⚡</span><span className="overview-value">{plan.difficulty}</span><span className="overview-label">Level</span></div>
                    </div>

                    <div className="exercise-schedule">
                        <h2>Weekly Schedule</h2>
                        {plan.schedule?.map((day, i) => (
                            <div key={i} className="schedule-day card">
                                <div className="schedule-day-header">
                                    <h3>{day.day}</h3>
                                    <span className="tag">{day.focus}</span>
                                    {day.estimatedCalories && <span className="tag tag-warning">🔥 {day.estimatedCalories} cal</span>}
                                </div>

                                {day.warmup && (
                                    <div className="warmup-section">
                                        <h4>🔄 Warm-up ({day.warmup.duration})</h4>
                                        <div className="warmup-items">{day.warmup.exercises?.map((e, j) => <span key={j} className="expanded-item">{e}</span>)}</div>
                                    </div>
                                )}

                                <div className="exercises-list">
                                    {day.exercises?.map((ex, j) => (
                                        <div key={j} className="exercise-item">
                                            <div className="exercise-item-main">
                                                <strong>{ex.name}</strong>
                                                <div className="exercise-meta">
                                                    {ex.sets && <span>{ex.sets} sets</span>}
                                                    {ex.reps && <span>× {ex.reps}</span>}
                                                    {ex.duration !== 'N/A' && ex.duration && <span>{ex.duration}</span>}
                                                    {ex.restBetweenSets && <span>Rest: {ex.restBetweenSets}</span>}
                                                </div>
                                            </div>
                                            {ex.notes && <p className="exercise-notes">{ex.notes}</p>}
                                            {ex.alternative && <p className="exercise-alt">Alt: {ex.alternative}</p>}
                                        </div>
                                    ))}
                                </div>

                                {day.cooldown && (
                                    <div className="warmup-section" style={{ marginTop: 8 }}>
                                        <h4>🧘 Cool-down ({day.cooldown.duration})</h4>
                                        <div className="warmup-items">{day.cooldown.exercises?.map((e, j) => <span key={j} className="expanded-item">{e}</span>)}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {plan.restDays?.length > 0 && (
                        <div className="card" style={{ padding: 16, marginTop: 16 }}>
                            <strong>🛌 Rest Days:</strong> {plan.restDays.join(', ')}
                        </div>
                    )}

                    {plan.tips?.length > 0 && (
                        <div className="plan-tips card" style={{ marginTop: 16 }}><h3>💡 Tips</h3><ul>{plan.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                    )}

                    {plan.progressionPlan && (
                        <div className="card" style={{ padding: 16, marginTop: 16 }}>
                            <h3>📈 Progression Plan</h3>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>{plan.progressionPlan}</p>
                        </div>
                    )}

                    {plan.warnings?.length > 0 && (
                        <div style={{ marginTop: 16 }}>{plan.warnings.map((w, i) => <div key={i} className="alert alert-error">⚠️ {w}</div>)}</div>
                    )}

                    <button className="btn btn-secondary mt-3" onClick={() => setPlan(null)}>← Generate New Plan</button>
                </div>
            )}

            {plan?.rawResponse && (
                <div className="card animate-fadeInUp">
                    <h3>Your Exercise Plan</h3>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.7 }}>{plan.rawResponse}</div>
                    <button className="btn btn-secondary mt-3" onClick={() => setPlan(null)}>← Generate New Plan</button>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Tab 3: Weekly Plans
// ============================================================
function WeeklyPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlan, setExpandedPlan] = useState(null);

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = async () => {
        try {
            const res = await exerciseAPI.getPlans();
            setPlans(res.data.plans);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try { await exerciseAPI.deletePlan(id); fetchPlans(); } catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div><p>Loading plans...</p></div>;

    return (
        <div className="weekly-plans animate-fadeInUp">
            {plans.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <h3>No saved plans yet</h3>
                    <p>Generate an exercise plan and save it to track your weekly targets</p>
                </div>
            ) : (
                <div className="plans-list">
                    {plans.map(plan => (
                        <div key={plan._id} className={`plan-list-card card ${plan.isActive ? 'plan-active' : ''}`}>
                            <div className="plan-list-header">
                                <div>
                                    <h3>{plan.goal?.replace(/-/g, ' ') || 'Workout Plan'} {plan.isActive && <span className="tag tag-success">Active</span>}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                        Created: {new Date(plan.createdAt).toLocaleDateString()} • Start: {plan.weekStartDate}
                                    </p>
                                </div>
                                <div className="plan-list-actions">
                                    <button className="btn btn-sm btn-secondary" onClick={() => setExpandedPlan(expandedPlan === plan._id ? null : plan._id)}>
                                        {expandedPlan === plan._id ? 'Collapse' : 'View'}
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(plan._id)}>Delete</button>
                                </div>
                            </div>

                            {plan.dailyTargets && (
                                <div className="plan-targets">
                                    <span className="target-chip">🔥 {plan.dailyTargets.caloriesBurned} cal/day</span>
                                    <span className="target-chip">⏱️ {plan.dailyTargets.duration} min/day</span>
                                </div>
                            )}

                            {expandedPlan === plan._id && plan.plan?.schedule && (
                                <div className="plan-expanded animate-fadeIn">
                                    {plan.plan.schedule.map((day, i) => (
                                        <div key={i} className="expanded-meal">
                                            <h4>{day.day} <span className="text-muted" style={{ fontWeight: 400 }}>{day.focus}</span></h4>
                                            <div className="expanded-items">
                                                {day.exercises?.map((ex, j) => (
                                                    <span key={j} className="expanded-item">{ex.name} {ex.sets && `(${ex.sets}×${ex.reps})`}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ExercisePlanner;
