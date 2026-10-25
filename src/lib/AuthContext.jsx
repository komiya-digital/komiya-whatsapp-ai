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

      // 2. Load or initialize business (fail-proof & local-first)
      const compName = authUser.user_metadata?.company_name || 'Mon Entreprise';
      const localBizKey = 'komiya_business_' + authUser.id;
      let cachedBiz = null;
      try {
        const raw = localStorage.getItem(localBizKey);
        if (raw) cachedBiz = JSON.parse(raw);
      } catch (e) {}

      // Check if user completed onboarding locally or globally
      const isCompletedLocally = localStorage.getItem('komiya_onboarding_done') === 'true' ||
        localStorage.getItem('komiya_onboarding_completed_' + authUser.id) === 'true';

      // Check if we have a real cached business (where id != authUser.id)
      let defaultBiz = null;
      if (cachedBiz?.id && cachedBiz.id !== authUser.id) {
        defaultBiz = {
          ...cachedBiz,
          onboarding_completed: isCompletedLocally ? true : Boolean(cachedBiz.onboarding_completed)
        };
      } else {
        defaultBiz = {
          id: authUser.id,
          owner_id: authUser.id,
          name: compName,
          country: 'Côte d\'Ivoire',
          currency: 'FCFA',
          onboarding_completed: isCompletedLocally,
          whatsapp_connections: []
        };
      }

      // Set business immediately so UI is never blank
      setBusiness(defaultBiz);

      // Resolve real business from Supabase
      try {
        const realBiz = await getOrCreateBusiness(authUser.id, {
          name: compName,
          email: authUser.email,
          fullName: authUser.user_metadata?.full_name || compName,
          country: 'Côte d\'Ivoire',
          currency: 'FCFA'
        });

        if (realBiz?.id) {
          if (isCompletedLocally && !realBiz.onboarding_completed) {
            realBiz.onboarding_completed = true;
            updateBusiness(realBiz.id, { onboarding_completed: true }).catch(() => {});
          }
          setBusiness(realBiz);
          try { localStorage.setItem(localBizKey, JSON.stringify(realBiz)); } catch (e) {}

          // Initialize default AI agent & automations in background
          upsertAiAgent(realBiz.id, {
            name: 'Awa',
            companyDescription: `${realBiz.name || compName} - Boutique et services`,
            country: realBiz.country || 'Côte d\'Ivoire',
            tone: 'Professionnel',
            objective: 'Vendre + qualifier',
            isActive: true
          }).catch(() => {});

          upsertDefaultAutomations(realBiz.id).catch(() => {});

          return { user: authUser, profile: prof, business: realBiz };
        }
      } catch (bizErr) {
        console.warn('Real business sync note in loadUserData:', bizErr.message);
      }

      return { user: authUser, profile: prof, business: defaultBiz };
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
    try { localStorage.setItem('komiya_onboarding_done', 'true'); } catch (e) {}
    if (user?.id) {
      try { localStorage.setItem('komiya_onboarding_completed_' + user.id, 'true'); } catch (e) {}
    }
    if (business?.id) {
      try { localStorage.setItem('komiya_onboarding_completed_' + business.id, 'true'); } catch (e) {}
    }

    setBusiness(prev => {
      const updated = { ...(prev || {}), onboarding_completed: true };
      if (user?.id) {
        try { localStorage.setItem('komiya_business_' + user.id, JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });

    try {
      let targetBiz = business;
      if (!targetBiz?.id || targetBiz.id === user?.id) {
        targetBiz = await ensureBusiness();
      }
      if (targetBiz?.id) {
        await updateBusiness(targetBiz.id, { onboarding_completed: true });
      }
    } catch (e) {
      console.warn('completeOnboarding backend update note:', e);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    await loadUserData(user);
  };

  const ensureBusiness = async () => {
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
    if (!currentUser?.id) return business;

    // If we already have a real business whose id is NOT equal to user id, return it!
    if (business?.id && business.id !== currentUser.id) {
      return business;
    }

    const compName = currentUser.user_metadata?.company_name || 'Mon Entreprise';
    const userEmail = currentUser.email || 'user@komiya.ci';
    const userFullName = currentUser.user_metadata?.full_name || compName;
    const localBizKey = 'komiya_business_' + currentUser.id;

    // Check localStorage for a cached REAL business (where id != currentUser.id)
    try {
      const raw = localStorage.getItem(localBizKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id && parsed.id !== currentUser.id) {
          setBusiness(parsed);
          return parsed;
        }
      }
    } catch (e) {}

    // Await the real business from Supabase
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
        try { localStorage.setItem(localBizKey, JSON.stringify(resolved)); } catch (e) {}
        return resolved;
      }
    } catch (err) {
      console.warn('ensureBusiness getOrCreateBusiness note:', err);
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
