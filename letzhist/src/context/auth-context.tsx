'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/components/data_types';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Define the fetching logic as a reusable function
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null); // 401/404 means logged out
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the context
export const useAuth = () => useContext(AuthContext);