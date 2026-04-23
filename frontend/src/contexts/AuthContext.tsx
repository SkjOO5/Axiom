import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl } from '@/services/api';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    phone?: string;
    organization?: string;
    role?: string;
    location?: string;
    bio?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User['user_metadata']>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('axiom_token');
    const savedUser = localStorage.getItem('axiom_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch(e) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('axiom_token');
        localStorage.removeItem('axiom_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const body = new URLSearchParams({ email: normalizedEmail, password });
      const res = await fetch(apiUrl('/api/auth/login'), { method: 'POST', body });
      const data = await res.json();
      
      if (!res.ok || data.error || data.detail) {
        // Dev-only fallback for UI testing
        if (import.meta.env.DEV && normalizedEmail === "test@test.com") {
          const mockUser = { id: "mock_123", email: normalizedEmail };
          setUser(mockUser);
          setToken("mock_token");
          localStorage.setItem('axiom_token', "mock_token");
          localStorage.setItem('axiom_user', JSON.stringify(mockUser));
          return null;
        }
        return data.error || data.detail || "Authentication failed.";
      }

      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem('axiom_token', data.access_token);
      localStorage.setItem('axiom_user', JSON.stringify(data.user));
      return null;
    } catch (err) {
      if (import.meta.env.DEV && normalizedEmail === "test@test.com") {
        const mockUser = { id: "mock_123", email: normalizedEmail };
        setUser(mockUser);
        setToken("mock_token");
        localStorage.setItem('axiom_token', "mock_token");
        localStorage.setItem('axiom_user', JSON.stringify(mockUser));
        return null;
      }
      return "Network error: Could not connect to the server.";
    }
  };

  const signup = async (email: string, password: string): Promise<string | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const body = new URLSearchParams({ email: normalizedEmail, password });
      const res = await fetch(apiUrl('/api/auth/signup'), { method: 'POST', body });
      const data = await res.json();
      
      if (!res.ok || data.error || data.detail) {
        if (import.meta.env.DEV && normalizedEmail === "test@test.com") {
          const mockUser = { id: "mock_123", email: normalizedEmail };
          setUser(mockUser);
          setToken("mock_token");
          localStorage.setItem('axiom_token', "mock_token");
          localStorage.setItem('axiom_user', JSON.stringify(mockUser));
          return null;
        }
        return data.error || data.detail || "Signup failed.";
      }

      if (data.access_token) {
        setUser(data.user);
        setToken(data.access_token);
        localStorage.setItem('axiom_token', data.access_token);
        localStorage.setItem('axiom_user', JSON.stringify(data.user));
      }
      return null;
    } catch (err) {
      if (import.meta.env.DEV && normalizedEmail === "test@test.com") {
        const mockUser = { id: "mock_123", email: normalizedEmail };
        setUser(mockUser);
        setToken("mock_token");
        localStorage.setItem('axiom_token', "mock_token");
        localStorage.setItem('axiom_user', JSON.stringify(mockUser));
        return null;
      }
      return "Network error: Could not connect to the server.";
    }
  };

  const logout = async () => {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('axiom_token');
    localStorage.removeItem('axiom_user');
  };

  const updateUser = async (data: Partial<User['user_metadata']>) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        ...data
      }
    };
    setUser(updatedUser);
    localStorage.setItem('axiom_user', JSON.stringify(updatedUser));
    // In a real app, you would also make an API call to save to Supabase here.
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
