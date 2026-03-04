import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from './supabase';
import { setSession, setRole, clearAuth } from './authSlice';

const AuthContext = createContext(null);

// Fetch role from profiles table - returns plain value
async function fetchRole(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return data?.role || null;
  } catch (error) {
    console.error('Error fetching role:', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setLocalSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    let isActive = true;

    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isActive) return;

        dispatch(setSession(initialSession));
        setLocalSession(initialSession);

        if (initialSession?.user?.id) {
          const role = await fetchRole(initialSession.user.id);
          if (isActive && role) {
            dispatch(setRole(role));
          }
        }

        if (isActive) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return;

      console.log('Auth state changed:', event, session ? 'has session' : 'no session');

      if (session) {
        dispatch(setSession(session));
        setLocalSession(session);

        if (session.user?.id) {
          fetchRole(session.user.id).then((role) => {
            if (isActive && role) {
              dispatch(setRole(role));
            }
          });
        }
      } else {
        dispatch(clearAuth());
        setLocalSession(null);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
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
