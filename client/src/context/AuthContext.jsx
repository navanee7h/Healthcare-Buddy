import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('hb_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await authAPI.getProfile();
            setUser(res.data.user);
        } catch {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        const res = await authAPI.signup(userData);
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('hb_token', newToken);
        localStorage.setItem('hb_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const signin = async (credentials) => {
        const res = await authAPI.signin(credentials);
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('hb_token', newToken);
        localStorage.setItem('hb_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('hb_token');
        localStorage.removeItem('hb_user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('hb_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, signup, signin, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
