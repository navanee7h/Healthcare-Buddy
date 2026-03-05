import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Automatically attach JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('hb_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('hb_token');
            localStorage.removeItem('hb_user');
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    signin: (data) => api.post('/auth/signin', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

// Symptom API
export const symptomAPI = {
    check: (messages) => api.post('/symptom/check', { messages }),
};

// Diet API
export const dietAPI = {
    getPlan: (data) => api.post('/diet/plan', data),
    getPlans: () => api.get('/diet/plans'),
    getActivePlan: () => api.get('/diet/plans/active'),
    deletePlan: (id) => api.delete(`/diet/plans/${id}`),
    addMeal: (data) => api.post('/diet/meal', data),
    getMeals: (date) => api.get(`/diet/meals?date=${date}`),
    updateMeal: (id, data) => api.put(`/diet/meal/${id}`, data),
    deleteMeal: (id) => api.delete(`/diet/meal/${id}`),
    getSummary: (date) => api.get(`/diet/summary?date=${date}`),
};

// Exercise API
export const exerciseAPI = {
    getPlan: (data) => api.post('/exercise/plan', data),
    getPlans: () => api.get('/exercise/plans'),
    getActivePlan: () => api.get('/exercise/plans/active'),
    deletePlan: (id) => api.delete(`/exercise/plans/${id}`),
    addLog: (data) => api.post('/exercise/log', data),
    getLogs: (date) => api.get(`/exercise/logs?date=${date}`),
    updateLog: (id, data) => api.put(`/exercise/log/${id}`, data),
    deleteLog: (id) => api.delete(`/exercise/log/${id}`),
    getSummary: (date) => api.get(`/exercise/summary?date=${date}`),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getDiagnoses: () => api.get('/dashboard/diagnoses'),
    addWellbeing: (id, data) => api.put(`/dashboard/diagnosis/${id}/wellbeing`, data),
    addMedication: (id, data) => api.post(`/dashboard/diagnosis/${id}/medication`, data),
    toggleMedication: (diagId, medId) => api.put(`/dashboard/diagnosis/${diagId}/medication/${medId}`),
};

export default api;
