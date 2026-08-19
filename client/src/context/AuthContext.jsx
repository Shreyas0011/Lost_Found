import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser, getToken, setToken, setUser as setStoredUser, clearToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getUser();
    const token = getToken();
    if (stored && token) {
      setUserState(stored);
    }
    setLoading(false);
  }, []);

  const loginStudent = (userData, token) => {
    setToken(token);
    const u = { ...userData, role: 'student' };
    setStoredUser(u);
    setUserState(u);
  };

  const loginAdmin = (username, token, role = 'admin') => {
    setToken(token);
    const u = { username, role };
    setStoredUser(u);
    setUserState(u);
  };

  const logout = () => {
    clearToken();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginStudent, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
