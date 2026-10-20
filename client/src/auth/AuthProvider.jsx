import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    api('/auth/me')
      .then((response) => {
        if (active) {
          setUser(response.data);
          setAuthError(null);
        }
      })
      .catch((error) => {
        if (!active) return;

        if (error.status === 401) {
          setUser(null);
        } else {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function refreshUser() {
    setLoading(true);

    try {
      const response = await api('/auth/me');
      setUser(response.data);
      setAuthError(null);
      return response.data;
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
      } else {
        setAuthError(error.message);
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    setUser,
    loading,
    authError,
    refreshUser,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
