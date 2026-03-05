import { useState, useEffect } from 'react';
import { dietAPI } from '../services/api';
import './Planner.css';
import './DietTracker.css';

function DietPlanner() {
    const [activeTab, setActiveTab] = useState('log');

    const tabs = [
        { id: 'log', label: "Today's Log", icon: '📋' },
        { id: 'generate', label: 'Generate Plan', icon: '🤖' },
        { id: 'plans', label: 'Weekly Plans', icon: '📅' },
    ];

    return (
        <div className="planner-page diet-tracker">
            <div className="page-header">
                <h1>🥗 Diet Planner</h1>
                <p>Track your meals, generate personalized plans, and monitor your daily nutrition.</p>
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

            {activeTab === 'log' && <TodaysLog />}
            {activeTab === 'generate' && <GeneratePlan />}
            {activeTab === 'plans' && <WeeklyPlans />}
        </div>
    );
}

// ============================================================
// Tab 1: Today's Meal Log
// ============================================================
function TodaysLog() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [meals, setMeals] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingMeal, setAddingMeal] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);

    const [newMeal, setNewMeal] = useState({
        foodName: '', grams: '', mealType: 'breakfast'
    });
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mealsRes, summaryRes] = await Promise.all([
                dietAPI.getMeals(date),
                dietAPI.getSummary(date)
            ]);
            setMeals(mealsRes.data.meals);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error('Failed to fetch meals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMeal = async (e) => {
        e.preventDefault();
        if (!newMeal.foodName || !newMeal.grams) return;
        setAddLoading(true);

        try {
            await dietAPI.addMeal({
                ...newMeal,
                grams: Number(newMeal.grams),
                date
            });
            setNewMeal({ foodName: '', grams: '', mealType: 'breakfast' });
            setAddingMeal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to add meal:', err);
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteMeal = async (id) => {
        try {
            await dietAPI.deleteMeal(id);
            fetchData();
        } catch (err) {
            console.error('Failed to delete meal:', err);
        }
    };

    const handleUpdateMeal = async (id, updates) => {
        try {
            await dietAPI.updateMeal(id, updates);
            setEditingMeal(null);
            fetchData();
        } catch (err) {
            console.error('Failed to update meal:', err);
        }
    };

    const mealGroups = {
        breakfast: meals.filter(m => m.mealType === 'breakfast'),
        lunch: meals.filter(m => m.mealType === 'lunch'),
        dinner: meals.filter(m => m.mealType === 'dinner'),
        snack: meals.filter(m => m.mealType === 'snack'),
    };

    const mealTypeLabels = {
        breakfast: '🌅 Breakfast',
        lunch: '☀️ Lunch',
        dinner: '🌙 Dinner',
        snack: '🍎 Snacks'
    };

    const getProgressPercent = (current, target) => {
        if (!target) return 0;
        return Math.min(100, Math.round((current / target) * 100));
    };

    return (
        <div className="todays-log animate-fadeInUp">
            {/* Date Selector */}
            <div className="date-selector">
                <button className="btn btn-sm btn-secondary" onClick={() => {
                    const d = new Date(date);
                    d.setDate(d.getDate() - 1);
                    setDate(d.toISOString().split('T')[0]);
                }}>←</button>
                <input type="date" className="form-input date-input" value={date} onChange={(e) => setDate(e.target.value)} />
                <button className="btn btn-sm btn-secondary" onClick={() => {
                    const d = new Date(date);
                    d.setDate(d.getDate() + 1);
                    setDate(d.toISOString().split('T')[0]);
                }}>→</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setDate(new Date().toISOString().split('T')[0])}>Today</button>
            </div>

            {/* Daily Summary */}
            {summary && (
                <div className="nutrition-summary">
                    <div className="summary-grid">
                        <NutritionRing label="Calories" value={summary.totals.calories} target={summary.targets?.calories} unit="kcal" color="#06b6d4" />
                        <NutritionRing label="Protein" value={summary.totals.protein} target={summary.targets?.protein} unit="g" color="#10b981" />
                        <NutritionRing label="Carbs" value={summary.totals.carbs} target={summary.targets?.carbs} unit="g" color="#f59e0b" />
                        <NutritionRing label="Fats" value={summary.totals.fats} target={summary.targets?.fats} unit="g" color="#ef4444" />
                    </div>
                    {!summary.targets && (
                        <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: 8 }}>
                            💡 Generate & save a weekly plan to see daily targets
                        </p>
                    )}
                </div>
            )}

            {/* Add Meal Button */}
            {!addingMeal && (
                <button className="btn btn-primary add-meal-btn" onClick={() => setAddingMeal(true)}>
                    + Add Meal
                </button>
            )}

            {/* Add Meal Form */}
            {addingMeal && (
                <div className="add-meal-form card animate-fadeInUp">
                    <h4>Add a Meal</h4>
                    <form onSubmit={handleAddMeal}>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Food Name</label>
                                <input type="text" className="form-input" placeholder="e.g., Chicken Rice, Banana, Dal..." value={newMeal.foodName} onChange={(e) => setNewMeal({ ...newMeal, foodName: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Grams</label>
                                <input type="number" className="form-input" placeholder="200" value={newMeal.grams} onChange={(e) => setNewMeal({ ...newMeal, grams: e.target.value })} min="1" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Meal Type</label>
                            <select className="form-select" value={newMeal.mealType} onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })}>
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>
                        <div className="step-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setAddingMeal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={addLoading}>
                                {addLoading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Estimating...</> : 'Add Meal'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Meal List by Type */}
            {loading ? (
                <div className="loading-container"><div className="spinner spinner-lg"></div><p>Loading meals...</p></div>
            ) : meals.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🍽️</span>
                    <h3>No meals logged yet</h3>
                    <p>Start adding your meals to track nutrition</p>
                </div>
            ) : (
                <div className="meals-by-type">
                    {Object.entries(mealGroups).map(([type, typeMeals]) => (
                        typeMeals.length > 0 && (
                            <div key={type} className="meal-type-group">
                                <h3 className="meal-type-header">{mealTypeLabels[type]}</h3>
                                {typeMeals.map(meal => (
                                    <MealCard
                                        key={meal._id}
                                        meal={meal}
                                        isEditing={editingMeal === meal._id}
                                        onEdit={() => setEditingMeal(meal._id)}
                                        onCancelEdit={() => setEditingMeal(null)}
                                        onSave={(updates) => handleUpdateMeal(meal._id, updates)}
                                        onDelete={() => handleDeleteMeal(meal._id)}
                                    />
                                ))}
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Meal Card Component
// ============================================================
function MealCard({ meal, isEditing, onEdit, onCancelEdit, onSave, onDelete }) {
    const [editForm, setEditForm] = useState({
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        fiber: meal.fiber
    });

    const handleSave = () => {
        onSave({
            calories: Number(editForm.calories),
            protein: Number(editForm.protein),
            carbs: Number(editForm.carbs),
            fats: Number(editForm.fats),
            fiber: Number(editForm.fiber)
        });
    };

    return (
        <div className="meal-log-card">
            <div className="meal-log-main">
                <div className="meal-log-info">
                    <span className="meal-log-name">{meal.foodName}</span>
                    <span className="meal-log-grams">{meal.grams}g {meal.isManualOverride && <span className="tag" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>edited</span>}</span>
                </div>
                <div className="meal-log-actions">
                    <button className="icon-btn" onClick={onEdit} title="Edit nutrition">✏️</button>
                    <button className="icon-btn icon-btn-danger" onClick={onDelete} title="Delete">🗑️</button>
                </div>
            </div>

            <div className="meal-log-macros">
                <span className="macro-chip cal">{Math.round(meal.calories)} cal</span>
                <span className="macro-chip prot">{Math.round(meal.protein)}g P</span>
                <span className="macro-chip carb">{Math.round(meal.carbs)}g C</span>
                <span className="macro-chip fat">{Math.round(meal.fats)}g F</span>
            </div>

            {isEditing && (
                <div className="meal-edit-panel animate-fadeIn">
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Override nutrition values:</p>
                    <div className="edit-macros-grid">
                        <div className="edit-macro">
                            <label>Calories</label>
                            <input type="number" className="form-input" value={editForm.calories} onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })} />
                        </div>
                        <div className="edit-macro">
                            <label>Protein (g)</label>
                            <input type="number" className="form-input" value={editForm.protein} onChange={(e) => setEditForm({ ...editForm, protein: e.target.value })} />
                        </div>
                        <div className="edit-macro">
                            <label>Carbs (g)</label>
                            <input type="number" className="form-input" value={editForm.carbs} onChange={(e) => setEditForm({ ...editForm, carbs: e.target.value })} />
                        </div>
                        <div className="edit-macro">
                            <label>Fats (g)</label>
                            <input type="number" className="form-input" value={editForm.fats} onChange={(e) => setEditForm({ ...editForm, fats: e.target.value })} />
                        </div>
                    </div>
                    <div className="step-actions" style={{ marginTop: 10 }}>
                        <button className="btn btn-secondary btn-sm" onClick={onCancelEdit}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Nutrition Ring Component
// ============================================================
function NutritionRing({ label, value, target, unit, color }) {
    const percent = target ? Math.min(100, Math.round((value / target) * 100)) : null;

    return (
        <div className="nutrition-ring-card">
            <div className="ring-visual" style={{ '--ring-color': color, '--ring-percent': percent ?? 100 }}>
                <svg viewBox="0 0 36 36" className="ring-svg">
                    <path className="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="ring-fill" strokeDasharray={`${percent ?? 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ stroke: color }} />
                </svg>
                <div className="ring-value">{Math.round(value)}</div>
            </div>
            <span className="ring-label">{label}</span>
            {target && <span className="ring-target">/ {target} {unit}</span>}
            {!target && <span className="ring-target">{unit}</span>}
        </div>
    );
}

// ============================================================
// Tab 2: Generate Plan (existing, enhanced to save)
// ============================================================
function GeneratePlan() {
    const [form, setForm] = useState({
        goal: '', preferences: '', mealsPerDay: '3', additionalNotes: '', saveAsPlan: true
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
        setLoading(true);
        setError('');
        setPlan(null);
        try {
            const res = await dietAPI.getPlan(form);
            setPlan(res.data.plan);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate diet plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="generate-plan animate-fadeInUp">
            {!plan && (
                <div className="planner-form-card card">
                    <h3>What's your dietary goal?</h3>
                    {error && <div className="alert alert-error mt-2">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mt-2">
                            <label>Dietary Goal</label>
                            <select name="goal" className="form-select" value={form.goal} onChange={handleChange}>
                                <option value="">Select your goal</option>
                                <option value="weight-loss">Weight Loss</option>
                                <option value="weight-gain">Weight Gain / Muscle Building</option>
                                <option value="maintain">Maintain Current Weight</option>
                                <option value="heart-health">Heart Health</option>
                                <option value="diabetes-management">Diabetes Management</option>
                                <option value="energy-boost">Boost Energy Levels</option>
                                <option value="general-health">General Healthy Eating</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Meals Per Day</label>
                            <select name="mealsPerDay" className="form-select" value={form.mealsPerDay} onChange={handleChange}>
                                <option value="3">3 meals</option>
                                <option value="4">4 meals</option>
                                <option value="5">5 meals (with snacks)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Additional Preferences</label>
                            <textarea name="preferences" className="form-input" placeholder="e.g., home-cooked, budget-friendly..." value={form.preferences} onChange={handleChange} rows={2} />
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="saveAsPlan" checked={form.saveAsPlan} onChange={handleChange} />
                                <span>Save as active weekly plan (sets daily targets)</span>
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> Generating...</> : 'Generate Diet Plan 🥗'}
                        </button>
                    </form>
                </div>
            )}

            {loading && (
                <div className="loading-container"><div className="spinner spinner-lg"></div><p>Creating your personalized plan...</p></div>
            )}

            {plan && !plan.rawResponse && (
                <div className="plan-results animate-fadeInUp">
                    {plan._savedPlanId && (
                        <div className="alert alert-success">✅ Plan saved as your active weekly plan! Daily targets are now active.</div>
                    )}
                    <div className="plan-overview">
                        <div className="overview-stat"><span className="overview-icon">🔥</span><span className="overview-value">{plan.dailyCalories}</span><span className="overview-label">Daily Calories</span></div>
                        <div className="overview-stat"><span className="overview-icon">💧</span><span className="overview-value">{plan.waterIntake}</span><span className="overview-label">Water Intake</span></div>
                        {plan.macros && <>
                            <div className="overview-stat"><span className="overview-icon">🥩</span><span className="overview-value">{plan.macros.protein}</span><span className="overview-label">Protein</span></div>
                            <div className="overview-stat"><span className="overview-icon">🍞</span><span className="overview-value">{plan.macros.carbs}</span><span className="overview-label">Carbs</span></div>
                            <div className="overview-stat"><span className="overview-icon">🥑</span><span className="overview-value">{plan.macros.fats}</span><span className="overview-label">Fats</span></div>
                        </>}
                    </div>
                    <div className="meals-section">
                        <h2>Your Daily Meals</h2>
                        <div className="meals-grid">
                            {plan.meals?.map((meal, i) => (
                                <div key={i} className="meal-card card">
                                    <div className="meal-header"><h3>{meal.name}</h3><span className="meal-time">{meal.time}</span></div>
                                    <div className="meal-items">
                                        {meal.items?.map((item, j) => (
                                            <div key={j} className="meal-item">
                                                <div className="meal-item-info">
                                                    <span className="meal-food">{item.food}</span>
                                                    <span className="meal-portion">{item.portion}{item.grams ? ` (${item.grams}g)` : ''}</span>
                                                </div>
                                                <div className="meal-item-macros">
                                                    <span>{item.calories} cal</span>
                                                    {item.protein && <span>{item.protein}g P</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {plan.tips?.length > 0 && (
                        <div className="plan-tips card"><h3>💡 Tips</h3><ul>{plan.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                    )}
                    {plan.warnings?.length > 0 && (
                        <div className="plan-warnings">{plan.warnings.map((w, i) => <div key={i} className="alert alert-error">⚠️ {w}</div>)}</div>
                    )}
                    <button className="btn btn-secondary mt-3" onClick={() => setPlan(null)}>← Generate New Plan</button>
                </div>
            )}

            {plan?.rawResponse && (
                <div className="card animate-fadeInUp">
                    <h3>Your Diet Plan</h3>
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
            const res = await dietAPI.getPlans();
            setPlans(res.data.plans);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await dietAPI.deletePlan(id);
            fetchPlans();
        } catch (err) {
            console.error('Failed to delete plan:', err);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div><p>Loading plans...</p></div>;

    return (
        <div className="weekly-plans animate-fadeInUp">
            {plans.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <h3>No saved plans yet</h3>
                    <p>Generate a diet plan and save it to track your weekly targets</p>
                </div>
            ) : (
                <div className="plans-list">
                    {plans.map(plan => (
                        <div key={plan._id} className={`plan-list-card card ${plan.isActive ? 'plan-active' : ''}`}>
                            <div className="plan-list-header">
                                <div>
                                    <h3>{plan.goal?.replace(/-/g, ' ') || 'Diet Plan'} {plan.isActive && <span className="tag tag-success">Active</span>}</h3>
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
                                    <span className="target-chip">🔥 {plan.dailyTargets.calories} cal</span>
                                    <span className="target-chip">🥩 {plan.dailyTargets.protein}g protein</span>
                                    <span className="target-chip">🍞 {plan.dailyTargets.carbs}g carbs</span>
                                    <span className="target-chip">🥑 {plan.dailyTargets.fats}g fats</span>
                                </div>
                            )}

                            {expandedPlan === plan._id && plan.plan?.meals && (
                                <div className="plan-expanded animate-fadeIn">
                                    {plan.plan.meals.map((meal, i) => (
                                        <div key={i} className="expanded-meal">
                                            <h4>{meal.name} <span className="text-muted" style={{ fontWeight: 400 }}>{meal.time}</span></h4>
                                            <div className="expanded-items">
                                                {meal.items?.map((item, j) => (
                                                    <span key={j} className="expanded-item">{item.food} ({item.portion})</span>
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

export default DietPlanner;
