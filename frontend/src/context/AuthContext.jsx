import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('simrs_token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('simrs_role') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('simrs_username') || null);
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authApi.login(credentials);
      // Response: { message, role, token }
      const userRole = res.role;
      const userToken = res.token;
      const userName = credentials.username;

      setToken(userToken);
      setRole(userRole);
      setUsername(userName);

      localStorage.setItem('simrs_token', userToken);
      localStorage.setItem('simrs_role', userRole);
      localStorage.setItem('simrs_username', userName);

      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await authApi.register(payload);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUsername(null);
    localStorage.removeItem('simrs_token');
    localStorage.removeItem('simrs_role');
    localStorage.removeItem('simrs_username');
  };

  const normalizedRole = (role || '').toLowerCase();

  const value = {
    token,
    role,
    username,
    user: { username, role: normalizedRole },
    isAuthenticated: !!token,
    isAdmin: normalizedRole === 'admin',
    isStaff: normalizedRole === 'staff' || normalizedRole === 'admin',
    isPasien: normalizedRole === 'pasien',
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
