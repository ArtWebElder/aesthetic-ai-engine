import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthed: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthed: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthed, setIsAuthed] = useState(() => {
    return localStorage.getItem('magic-idea-auth') === 'true';
  });

  const user = isAuthed ? { name: 'Alex Designer', email: 'alex@example.com' } : null;

  const login = useCallback((_email: string, _password: string) => {
    localStorage.setItem('magic-idea-auth', 'true');
    setIsAuthed(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('magic-idea-auth');
    setIsAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
