import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Profile.css';

function Profile() {
    const { user, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: user?.name || '',
        age: user?.age || '',
        gender: user?.gender || '',
        weight: user?.weight || '',
        height: user?.height || '',
        nationality: user?.nationality || '',
        medicalConditions: user?.medicalConditions || [],
        medications: user?.medications || [],
        allergies: user?.allergies || [],
        dietaryPreferences: user?.dietaryPreferences || 'none',
        fitnessLevel: user?.fitnessLevel || 'sedentary'
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

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const updateData = {
                ...form,
                age: Number(form.age),
                weight: Number(form.weight),
                height: Number(form.height)
            };

            const res = await authAPI.updateProfile(updateData);
            updateUser(res.data.user);
            setSuccess('Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const getBMI = () => {
        if (user?.weight && user?.height) {
            const heightM = user.height / 100;
            return (user.weight / (heightM * heightM)).toFixed(1);
        }
        return 'N/A';
    };

    return (
        <div className="profile-page">
            <div className="page-header">
                <h1>👤 My Profile</h1>
                <p>Manage your health information to get better personalized recommendations.</p>
            </div>

            {success && <div className="alert alert-success">✅ {success}</div>}
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div className="profile-grid">
                {/* Profile Card */}
                <div className="profile-card card animate-fadeInUp">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-large">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <h2>{user?.name}</h2>
                        <p className="text-muted">{user?.email}</p>
                    </div>

                    <div className="profile-quick-stats">
                        <div className="quick-stat">
                            <span className="qs-label">BMI</span>
                            <span className="qs-value">{getBMI()}</span>
                        </div>
                        <div className="quick-stat">
                            <span className="qs-label">Age</span>
                            <span className="qs-value">{user?.age}</span>
                        </div>
                        <div className="quick-stat">
                            <span className="qs-label">Weight</span>
                            <span className="qs-value">{user?.weight} kg</span>
                        </div>
                        <div className="quick-stat">
                            <span className="qs-label">Height</span>
                            <span className="qs-value">{user?.height} cm</span>
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className="profile-details card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                    <div className="details-header">
                        <h3>Health Information</h3>
                        <button
                            className={`btn ${editing ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'}`}
                            onClick={() => setEditing(!editing)}
                        >
                            {editing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {editing ? (
                        <div className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Nationality</label>
                                    <input type="text" name="nationality" className="form-input" value={form.nationality} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Age</label>
                                    <input type="number" name="age" className="form-input" value={form.age} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <input type="number" name="weight" className="form-input" value={form.weight} onChange={handleChange} step="0.1" />
                                </div>
                                <div className="form-group">
                                    <label>Height (cm)</label>
                                    <input type="number" name="height" className="form-input" value={form.height} onChange={handleChange} step="0.1" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Medical Conditions</label>
                                <div className="tags-input">
                                    {form.medicalConditions.map((tag, i) => (
                                        <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag('medicalConditions', i)}>×</button></span>
                                    ))}
                                    <input type="text" placeholder="Type & press Enter" value={tagInputs.medicalConditions} onChange={(e) => setTagInputs({ ...tagInputs, medicalConditions: e.target.value })} onKeyDown={(e) => handleTagKeyDown('medicalConditions', e)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Medications</label>
                                <div className="tags-input">
                                    {form.medications.map((tag, i) => (
                                        <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag('medications', i)}>×</button></span>
                                    ))}
                                    <input type="text" placeholder="Type & press Enter" value={tagInputs.medications} onChange={(e) => setTagInputs({ ...tagInputs, medications: e.target.value })} onKeyDown={(e) => handleTagKeyDown('medications', e)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Allergies</label>
                                <div className="tags-input">
                                    {form.allergies.map((tag, i) => (
                                        <span key={i} className="tag">{tag}<button type="button" onClick={() => removeTag('allergies', i)}>×</button></span>
                                    ))}
                                    <input type="text" placeholder="Type & press Enter" value={tagInputs.allergies} onChange={(e) => setTagInputs({ ...tagInputs, allergies: e.target.value })} onKeyDown={(e) => handleTagKeyDown('allergies', e)} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dietary Preference</label>
                                    <select name="dietaryPreferences" className="form-select" value={form.dietaryPreferences} onChange={handleChange}>
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
                                    <label>Fitness Level</label>
                                    <select name="fitnessLevel" className="form-select" value={form.fitnessLevel} onChange={handleChange}>
                                        <option value="sedentary">Sedentary</option>
                                        <option value="lightly-active">Lightly Active</option>
                                        <option value="moderately-active">Moderately Active</option>
                                        <option value="very-active">Very Active</option>
                                        <option value="athlete">Athlete</option>
                                    </select>
                                </div>
                            </div>

                            <button className="btn btn-primary btn-full" onClick={handleSave} disabled={loading}>
                                {loading ? (
                                    <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> Saving...</>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="profile-info-list">
                            <div className="info-item">
                                <span className="info-label">Gender</span>
                                <span className="info-value">{user?.gender}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Nationality</span>
                                <span className="info-value">{user?.nationality}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Dietary Preference</span>
                                <span className="info-value">{user?.dietaryPreferences || 'None'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Fitness Level</span>
                                <span className="info-value">{user?.fitnessLevel}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Medical Conditions</span>
                                <div className="info-tags">
                                    {user?.medicalConditions?.length > 0
                                        ? user.medicalConditions.map((c, i) => <span key={i} className="tag tag-warning">{c}</span>)
                                        : <span className="text-muted">None reported</span>
                                    }
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Medications</span>
                                <div className="info-tags">
                                    {user?.medications?.length > 0
                                        ? user.medications.map((m, i) => <span key={i} className="tag">{m}</span>)
                                        : <span className="text-muted">None reported</span>
                                    }
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Allergies</span>
                                <div className="info-tags">
                                    {user?.allergies?.length > 0
                                        ? user.allergies.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)
                                        : <span className="text-muted">None reported</span>
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
