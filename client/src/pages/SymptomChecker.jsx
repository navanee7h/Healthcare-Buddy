import { useState, useRef, useEffect } from 'react';
import { symptomAPI } from '../services/api';
import './SymptomChecker.css';

function SymptomChecker() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [diagnosis, setDiagnosis] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, diagnosis]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setDiagnosis(null);

        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await symptomAPI.check(newMessages);
            const response = res.data.response;

            if (response.type === 'diagnosis') {
                setDiagnosis(response);
                setMessages([...newMessages, {
                    role: 'assistant',
                    content: 'I have analyzed your symptoms. Here are the possible conditions:'
                }]);
            } else {
                setMessages([...newMessages, {
                    role: 'assistant',
                    content: response.message || response
                }]);
            }
        } catch (err) {
            setMessages([...newMessages, {
                role: 'assistant',
                content: '❌ Sorry, there was an error analyzing your symptoms. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const startOver = () => {
        setMessages([]);
        setDiagnosis(null);
        setInput('');
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'mild': return 'var(--success)';
            case 'moderate': return 'var(--warning)';
            case 'severe': return 'var(--danger)';
            default: return 'var(--info)';
        }
    };

    return (
        <div className="symptom-page">
            <div className="page-header">
                <h1>🩺 Symptom Checker</h1>
                <p>Describe your symptoms and I'll ask follow-up questions to help analyze possible conditions.</p>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="chat-welcome">
                            <div className="chat-welcome-icon">🩺</div>
                            <h3>Start Your Symptom Check</h3>
                            <p>Describe your symptoms below and I'll help analyze them.</p>
                            <div className="chat-suggestions">
                                <button className="suggestion-chip" onClick={() => setInput('I have a headache and feel dizzy')}>
                                    "I have a headache and feel dizzy"
                                </button>
                                <button className="suggestion-chip" onClick={() => setInput('I have been experiencing chest pain')}>
                                    "I have chest pain"
                                </button>
                                <button className="suggestion-chip" onClick={() => setInput('I have a sore throat and fever')}>
                                    "Sore throat and fever"
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-bubble ${msg.role}`}>
                            <div className="bubble-avatar">
                                {msg.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="bubble-content">
                                <div className="bubble-text">{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="chat-bubble assistant">
                            <div className="bubble-avatar">🤖</div>
                            <div className="bubble-content">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnosis Results */}
                    {diagnosis && (
                        <div className="diagnosis-results animate-fadeInUp">
                            <h3>📋 Analysis Results</h3>
                            <div className="diagnosis-cards">
                                {diagnosis.conditions?.map((condition, i) => (
                                    <div key={i} className="diagnosis-card">
                                        <div className="diagnosis-header">
                                            <h4>{condition.name}</h4>
                                            <span className="tag" style={{
                                                background: `${getSeverityColor(condition.severity)}20`,
                                                color: getSeverityColor(condition.severity),
                                                borderColor: `${getSeverityColor(condition.severity)}40`
                                            }}>
                                                {condition.severity}
                                            </span>
                                        </div>
                                        <div className="probability-bar">
                                            <div className="probability-fill" style={{
                                                width: `${condition.probability}%`,
                                                background: condition.probability > 50 ? 'var(--accent-gradient)' : 'var(--info)'
                                            }}></div>
                                            <span className="probability-text">{condition.probability}%</span>
                                        </div>
                                        <p className="diagnosis-desc">{condition.description}</p>
                                        {condition.recommendation && (
                                            <p className="diagnosis-rec">💡 {condition.recommendation}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {diagnosis.generalAdvice && (
                                <div className="general-advice">
                                    <h4>General Advice</h4>
                                    <p>{diagnosis.generalAdvice}</p>
                                </div>
                            )}

                            {diagnosis.seekEmergencyCare && (
                                <div className="alert alert-error mt-2">
                                    🚨 <strong>Seek immediate medical attention!</strong> Your symptoms may indicate a serious condition.
                                </div>
                            )}

                            <div className="alert alert-info mt-2">
                                ⚠️ This analysis is for informational purposes only and is not a substitute for professional medical advice.
                            </div>

                            <button className="btn btn-secondary mt-2" onClick={startOver}>
                                Start New Check
                            </button>
                        </div>
                    )}

                    <div ref={chatEndRef}></div>
                </div>

                {/* Input */}
                <form className="chat-input-container" onSubmit={sendMessage}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Describe your symptoms..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" className="btn btn-primary chat-send" disabled={loading || !input.trim()}>
                        {loading ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SymptomChecker;
