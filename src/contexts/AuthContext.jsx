import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        apiService.setToken(token);
        const response = await apiService.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be expired, clear it
      localStorage.removeItem('access_token');
      apiService.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const signin = async (credentials) => {
    try {
      setError(null);
      const response = await apiService.signin(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await apiService.signup(userData);
      // Note: User might need to verify email before they can sign in
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signout = async () => {
    try {
      await apiService.signout();
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isVA = () => {
    return user && user.role === 'va';
  };

  const value = {
    user,
    loading,
    error,
    signin,
    signup,
    signout,
    isAdmin,
    isVA,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

