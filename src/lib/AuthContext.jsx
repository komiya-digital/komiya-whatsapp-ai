import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  supabase, 
  getProfile, 
  getBusiness, 
  upsertProfile, 
  createBusiness, 
  getOrCreateBusiness,
  updateBusiness,
  upsertAiAgent,
  upsertDefaultAutomations
} from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setBusiness(null);
      return null;
    }

    setUser(authUser);

    try {
      // 1. Load or initialize profile
      let prof = null;
      try {
        prof = await getProfile(authUser.id);
      } catch (e) {
        console.warn('Profile fetch note:', e.message);
      }

      if (!prof) {
        try {
          prof = await upsertProfile(authUser.id, {
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          });
        } catch (e) {
          console.warn('Profile upsert note:', e.message);
        }
      }
      setProfile(prof);

      // 2. Load or initialize business (fail-proof)
      let biz = null;
      try {
        const compName = authUser.user_metadata?.company_name || 'Mon Entreprise';
        biz = await getOrCreateBusiness(authUser.id, {
          name: compName,
          country: 'Côte d\'Ivoire',
          currency: 'FCFA'
        });

        // Initialize default AI agent & automations in background if new business
        if (biz?.id) {
          upsertAiAgent(biz.id, {
            name: 'Awa',
            companyDescription: `${biz.name || compName} - Boutique et services`,
            country: biz.country || 'Côte d\'Ivoire',
            tone: 'Professionnel',
            objective: 'Vendre + qualifier',
            isActive: true
          }).catch(() => {});

          upsertDefaultAutomations(biz.id).catch(() => {});
        }
      } catch (e) {
        console.warn('Business load note:', e.message);
      }
      setBusiness(biz);

      return { user: authUser, profile: prof, business: biz };
    } catch (err) {
      console.error('Error loading user data:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        loadUserData(session?.user ?? null).finally(() => {
          if (mounted) setLoading(false);
        });
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setBusiness(null);
          setLoading(false);
        } else if (session?.user) {
          await loadUserData(session.user);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  // ─── AUTH ACTIONS ─────────────────────────────────────────────

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      await loadUserData(data.user);
    }
    return data;
  };

  const signUp = async (email, password, fullName, companyName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName
        }
      }
    });
    if (error) throw error;

    if (data?.user) {
      // Ensure profile and business are created
      let prof = null;
      try {
        prof = await upsertProfile(data.user.id, {
          email,
          full_name: fullName,
        });
        setProfile(prof);
      } catch (err) {
        console.warn('Profile create on signup error:', err);
      }

      try {
        const biz = await createBusiness(data.user.id, {
          name: companyName || `${fullName}'s Business`,
          country: 'Côte d\'Ivoire',
          currency: 'FCFA'
        });
        setBusiness(biz);

        if (biz?.id) {
          await upsertAiAgent(biz.id, {
            name: 'Awa',
            companyDescription: `${companyName || 'Notre boutique'}`,
            country: 'Côte d\'Ivoire',
            tone: 'Professionnel',
            objective: 'Vendre + qualifier',
            isActive: true
          }).catch(() => {});

          await upsertDefaultAutomations(biz.id).catch(() => {});
        }
      } catch (err) {
        console.warn('Business create on signup error:', err);
      }

      setUser(data.user);
    }

    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut notice:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setBusiness(null);
    }
  };

  const forgotPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  };

  const updateProfileData = async (updates) => {
    if (!user) return null;
    const payload = {
      email: user.email,
      ...updates
    };
    const updated = await upsertProfile(user.id, payload);
    setProfile(prev => ({ ...prev, ...updated }));
    return updated;
  };

  const updateBusinessData = async (updates) => {
    if (!user) return null;
    let targetBiz = business;
    if (!targetBiz?.id) {
      targetBiz = await createBusiness(user.id, updates);
      setBusiness(targetBiz);
      return targetBiz;
    }
    const updated = await updateBusiness(targetBiz.id, updates);
    setBusiness(prev => ({ ...prev, ...updated }));
    return updated;
  };

  const updateWhatsAppConnectionState = (conn) => {
    setBusiness(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        whatsapp_connections: [conn]
      };
    });
  };

  const completeOnboarding = async () => {
    if (!business?.id) return;
    await updateBusinessData({ onboarding_completed: true });
  };

  const refreshUserData = async () => {
    if (!user) return;
    await loadUserData(user);
  };

  const ensureBusiness = async () => {
    if (business?.id) return business;
    let currentUser = user;
    if (!currentUser?.id) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
        if (currentUser) setUser(currentUser);
      } catch (e) {
        console.warn('Session check in ensureBusiness failed:', e);
      }
    }
    if (!currentUser?.id) return null;

    const compName = currentUser.user_metadata?.company_name || 'Mon Entreprise';
    const userEmail = currentUser.email || 'user@komiya.ci';
    const userFullName = currentUser.user_metadata?.full_name || compName;

    // 1. Ensure profile exists first
    try {
      const prof = await upsertProfile(currentUser.id, {
        email: userEmail,
        full_name: userFullName,
      });
      if (prof) setProfile(prof);
    } catch (e) {
      console.warn('Profile sync in ensureBusiness note:', e.message);
    }

    // 2. Resolve business
    try {
      const resolved = await getOrCreateBusiness(currentUser.id, {
        name: compName,
        email: userEmail,
        fullName: userFullName,
        country: 'Côte d\'Ivoire',
        currency: 'FCFA'
      });
      if (resolved?.id) {
        setBusiness(resolved);
        return resolved;
      }
    } catch (e) {
      console.error('ensureBusiness error:', e);
      throw e;
    }
    return business;
  };

  const value = {
    user,
    profile,
    business,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfileData,
    updateBusinessData,
    updateWhatsAppConnectionState,
    completeOnboarding,
    refreshUserData,
    ensureBusiness,
    setBusiness,
    setProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
