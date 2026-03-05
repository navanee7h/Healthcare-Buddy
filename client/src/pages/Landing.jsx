import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

function Landing() {
    const { user } = useAuth();

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-icon">🏥</span>
                            <span className="logo-text">Healthcare<span className="text-accent">Buddy</span></span>
                        </div>
                        <div className="nav-links">
                            {user ? (
                                <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                            ) : (
                                <>
                                    <Link to="/signin" className="btn btn-secondary">Sign In</Link>
                                    <Link to="/signup" className="btn btn-primary">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg-effects">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-orb hero-orb-3"></div>
                </div>
                <div className="container">
                    <div className="hero-content animate-fadeInUp">
                        <div className="hero-badge">
                            <span>🤖</span> AI-Powered Health Companion
                        </div>
                        <h1 className="hero-title">
                            Your Personal<br />
                            <span className="gradient-text">Healthcare Buddy</span>
                        </h1>
                        <p className="hero-subtitle">
                            Get AI-powered symptom analysis, personalized diet plans, and custom exercise routines —
                            all tailored to your unique health profile.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn btn-primary btn-lg">
                                Start Your Journey →
                            </Link>
                            <Link to="/signin" className="btn btn-secondary btn-lg">
                                Welcome Back
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">3</span>
                                <span className="stat-label">AI Tools</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Available</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">Personalized</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
                <div className="container">
                    <div className="features-header animate-fadeInUp">
                        <h2>Powered by Advanced AI</h2>
                        <p className="text-secondary">Three powerful tools designed to keep you healthy and informed</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="feature-icon feature-icon-symptom">🩺</div>
                            <h3>Symptom Checker</h3>
                            <p>Describe your symptoms and our AI asks intelligent follow-up questions to analyze possible conditions with probability scores.</p>
                            <ul className="feature-list">
                                <li>Interactive diagnosis flow</li>
                                <li>Multiple condition analysis</li>
                                <li>Severity assessment</li>
                                <li>Personalized recommendations</li>
                            </ul>
                        </div>
                        <div className="feature-card feature-card-highlight animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <div className="feature-icon feature-icon-diet">🥗</div>
                            <h3>Diet Planner</h3>
                            <p>Get a nutrition plan tailored to your health conditions, allergies, dietary preferences, and cultural background.</p>
                            <ul className="feature-list">
                                <li>Calorie-optimized meals</li>
                                <li>Allergy-safe options</li>
                                <li>Culturally relevant foods</li>
                                <li>Macro tracking</li>
                            </ul>
                        </div>
                        <div className="feature-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <div className="feature-icon feature-icon-exercise">💪</div>
                            <h3>Exercise Planner</h3>
                            <p>Receive workout routines that respect your fitness level, medical conditions, and available equipment.</p>
                            <ul className="feature-list">
                                <li>Custom workout schedules</li>
                                <li>Medical-aware planning</li>
                                <li>Progressive difficulty</li>
                                <li>Alternative exercises</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="text-center animate-fadeInUp">How It Works</h2>
                    <div className="steps-grid">
                        <div className="step-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="step-number">01</div>
                            <h4>Create Your Profile</h4>
                            <p>Sign up and tell us about your health — age, weight, conditions, allergies, and more.</p>
                        </div>
                        <div className="step-connector">→</div>
                        <div className="step-card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <div className="step-number">02</div>
                            <h4>Choose Your Tool</h4>
                            <p>Pick from Symptom Checker, Diet Planner, or Exercise Planner based on your needs.</p>
                        </div>
                        <div className="step-connector">→</div>
                        <div className="step-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <div className="step-number">03</div>
                            <h4>Get AI Results</h4>
                            <p>Receive personalized, AI-generated recommendations tailored to your unique health profile.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-logo">
                            <span className="logo-icon">🏥</span>
                            <span>Healthcare<span className="text-accent">Buddy</span></span>
                        </div>
                        <p className="footer-disclaimer">
                            ⚠️ Healthcare Buddy is an AI-powered tool for informational purposes only.
                            It does not replace professional medical advice, diagnosis, or treatment.
                        </p>
                        <p className="footer-copy">© 2026 Healthcare Buddy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
