import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { isTokenExpired } from '../utils/tokenUtils'; // adjust path if needed

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  // Poll every 15s for token expiry.
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await AsyncStorage.getItem('authToken');
      const expiresAt = await AsyncStorage.getItem('tokenExpiresAt');
     /* console.log('[DEBUG poll]', {
      token: !!token,
      expiresAt,
      now: new Date().toString(),       // ← add this
      nowEpoch: Date.now(),              // ← add this
      expiryEpoch: new Date(expiresAt).getTime(), // ← add this
      expired: isTokenExpired(expiresAt),
    });*/
      if (token && isTokenExpired(expiresAt)) {
        await forceLogout();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.log('No saved session.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    debugger;
    const response = await authService.login(email, password);
    if (response.success && response.data) {
      setUser(response.data);
    }
    return response;
  };

  const signup = async (userData) => {
    return await authService.signup(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // Same as logout(), but triggered by expiry instead of a user tap.
  // No manual navigation call — setUser(null) flips isAuthenticated to
  // false, which makes AppNavigator re-render and swap to AuthStack,
  // which mounts Login on its own.
  const forceLogout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'userData', 'tokenExpiresAt']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};