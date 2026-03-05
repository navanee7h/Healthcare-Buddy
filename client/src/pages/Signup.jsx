import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const STEPS = [
    { title: 'Account', subtitle: 'Create your credentials' },
    { title: 'Basic Info', subtitle: 'Tell us about yourself' },
    { title: 'Health Profile', subtitle: 'Your medical information' }
];

function Signup() {
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        age: '',
        gender: '',
        weight: '',
        height: '',
        nationality: '',
        medicalConditions: [],
        medications: [],
        allergies: [],
        dietaryPreferences: 'none',
        fitnessLevel: 'sedentary'
    });

    const [tagInputs, setTagInputs] = useState({
        medicalConditions: '',
        medications: '',
        allergies: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleTagKeyDown = (field, e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInputs[field].trim();
            if (val && !form[field].includes(val)) {
                setForm({ ...form, [field]: [...form[field], val] });
                setTagInputs({ ...tagInputs, [field]: '' });
            }
        }
    };

    const removeTag = (field, index) => {
        setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });
    };

    const validateStep = () => {
        setError('');
        if (step === 0) {
            if (!form.email || !form.password || !form.confirmPassword) {
                setError('All fields are required');
                return false;
            }
            if (form.password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
            if (form.password !== form.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        }
        if (step === 1) {
            if (!form.name || !form.age || !form.gender || !form.weight || !form.height || !form.nationality) {
                setError('All fields are required');
                return false;
            }
            if (form.age < 1 || form.age > 150) {
                setError('Please enter a valid age');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { confirmPassword, ...submitData } = form;
            submitData.age = Number(submitData.age);
            submitData.weight = Number(submitData.weight);
            submitData.height = Number(submitData.height);

            await signup(submitData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-effects">
                <div className="auth-orb auth-orb-1"></div>
                <div className="auth-orb auth-orb-2"></div>
            </div>

            <div className="auth-container signup-container animate-fadeInUp">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🏥</span>
                        <span>Healthcare<span className="text-accent">Buddy</span></span>
                    </Link>
                    <h2>Create Your Account</h2>
                </div>

                {/* Step Indicator */}
                <div className="step-indicator">
                    {STEPS.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className={`step-dot ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'active' : ''}`}></div>}
                        </div>
                    ))}
                </div>

                <div className="step-title">
                    <h3>{STEPS[step].title}</h3>
                    <p>{STEPS[step].subtitle}</p>
                </div>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Account */}
                    {step === 0 && (
                        <div className="animate-fadeIn">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" name="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" name="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" className="form-input" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} required />
                            </div>
                            <div className="step-actions">
                                <button type="button" className="btn btn-primary btn-full" onClick={nextStep}>Next →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Basic Info */}
                    {step === 1 && (
                        <div className="animate-fadeIn">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input type="text" id="name" name="name" className="form-input" placeholder="Your full name" value={form.name} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="age">Age</label>
                                    <input type="number" id="age" name="age" className="form-input" placeholder="25" value={form.age} onChange={handleChange} min="1" max="150" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gender">Gender</label>
                                    <select id="gender" name="gender" className="form-select" value={form.gender} onChange={handleChange} required>
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="weight">Weight (kg)</label>
                                    <input type="number" id="weight" name="weight" className="form-input" placeholder="70" value={form.weight} onChange={handleChange} step="0.1" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="height">Height (cm)</label>
                                    <input type="number" id="height" name="height" className="form-input" placeholder="175" value={form.height} onChange={handleChange} step="0.1" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="nationality">Nationality</label>
                                <input type="text" id="nationality" name="nationality" className="form-input" placeholder="e.g., Indian, American, British" value={form.nationality} onChange={handleChange} required />
                            </div>
                            <div className="step-actions">
                                <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                <button type="button" className="btn btn-primary" onClick={nextStep}>Next →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Health Profile */}
                    {step === 2 && (
                        <div className="animate-fadeIn">
                            <div className="form-group">
                                <label>Medical Conditions</label>
                                <div className="tags-input">
                                    {form.medicalConditions.map((tag, i) => (
                                        <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag('medicalConditions', i)}>×</button></span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Type & press Enter (e.g., Diabetes)"
                                        value={tagInputs.medicalConditions}
                                        onChange={(e) => setTagInputs({ ...tagInputs, medicalConditions: e.target.value })}
                                        onKeyDown={(e) => handleTagKeyDown('medicalConditions', e)}
                                    />
                                </div>
                                <p className="form-hint">Press Enter or comma to add. Leave empty if none.</p>
                            </div>

                            <div className="form-group">
                                <label>Current Medications</label>
                                <div className="tags-input">
                                    {form.medications.map((tag, i) => (
                                        <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag('medications', i)}>×</button></span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Type & press Enter (e.g., Metformin)"
                                        value={tagInputs.medications}
                                        onChange={(e) => setTagInputs({ ...tagInputs, medications: e.target.value })}
                                        onKeyDown={(e) => handleTagKeyDown('medications', e)}
                                    />
                                </div>
                                <p className="form-hint">Press Enter or comma to add. Leave empty if none.</p>
                            </div>

                            <div className="form-group">
                                <label>Allergies</label>
                                <div className="tags-input">
                                    {form.allergies.map((tag, i) => (
                                        <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag('allergies', i)}>×</button></span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Type & press Enter (e.g., Peanuts)"
                                        value={tagInputs.allergies}
                                        onChange={(e) => setTagInputs({ ...tagInputs, allergies: e.target.value })}
                                        onKeyDown={(e) => handleTagKeyDown('allergies', e)}
                                    />
                                </div>
                                <p className="form-hint">Press Enter or comma to add. Leave empty if none.</p>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="dietaryPreferences">Dietary Preference</label>
                                    <select id="dietaryPreferences" name="dietaryPreferences" className="form-select" value={form.dietaryPreferences} onChange={handleChange}>
                                        <option value="none">No preference</option>
                                        <option value="vegetarian">Vegetarian</option>
                                        <option value="vegan">Vegan</option>
                                        <option value="keto">Keto</option>
                                        <option value="paleo">Paleo</option>
                                        <option value="gluten-free">Gluten Free</option>
                                        <option value="halal">Halal</option>
                                        <option value="kosher">Kosher</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fitnessLevel">Fitness Level</label>
                                    <select id="fitnessLevel" name="fitnessLevel" className="form-select" value={form.fitnessLevel} onChange={handleChange}>
                                        <option value="sedentary">Sedentary</option>
                                        <option value="lightly-active">Lightly Active</option>
                                        <option value="moderately-active">Moderately Active</option>
                                        <option value="very-active">Very Active</option>
                                        <option value="athlete">Athlete</option>
                                    </select>
                                </div>
                            </div>

                            <div className="step-actions">
                                <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> Creating...</>
                                    ) : (
                                        'Create Account 🚀'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;
