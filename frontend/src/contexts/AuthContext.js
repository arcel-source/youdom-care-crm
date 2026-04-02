import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le token depuis localStorage au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('youdom_token');
    const savedUser = localStorage.getItem('youdom_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('youdom_token');
        localStorage.removeItem('youdom_user');
      }
    }
    setIsLoading(false);
  }, []);

  const saveSession = useCallback((tokenValue, userData) => {
    localStorage.setItem('youdom_token', tokenValue);
    localStorage.setItem('youdom_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  // Login Google OAuth
  const loginWithGoogle = useCallback(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_CLIENT_ID') {
      // Simulation pour développement local
      console.warn('Google Client ID non configuré — simulation login dev');
      const devToken = 'dev_token_' + Date.now();
      const devUser = {
        id: 1,
        email: 'dev@youdomcare.fr',
        nom: 'Dev User',
        prenom: 'Youdom',
        role: 'admin',
        avatar: null,
      };
      saveSession(devToken, devUser);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;
    window.location.href = authUrl;
  }, [saveSession]);

  // Traitement du callback Google
  const handleGoogleCallback = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const response = await authApi.loginWithGoogle(code);
      const { access_token, user: userData } = response.data;
      saveSession(access_token, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de la connexion Google';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  // Envoi OTP par email
  const sendOtp = useCallback(async (email) => {
    try {
      await authApi.loginWithEmail(email);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'envoi du code';
      return { success: false, error: message };
    }
  }, []);

  // Vérification OTP
  const verifyOtp = useCallback(async (email, code) => {
    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp(email, code);
      const { access_token, user: userData } = response.data;
      saveSession(access_token, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Code invalide ou expiré';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Silently ignore logout errors
    } finally {
      localStorage.removeItem('youdom_token');
      localStorage.removeItem('youdom_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Rafraîchir les infos user
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authApi.me();
      const userData = response.data;
      localStorage.setItem('youdom_user', JSON.stringify(userData));
      setUser(userData);
    } catch {
      // Token invalide
    }
  }, [token]);

  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    loginWithGoogle,
    handleGoogleCallback,
    sendOtp,
    verifyOtp,
    logout,
    refreshUser,
    saveSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}

export default AuthContext;
