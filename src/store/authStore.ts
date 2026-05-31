import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  // Call once at app startup — returns the unsubscribe fn for cleanup.
  // RootNavigator currently manages auth state itself; call initialize()
  // from there (or App.tsx) to migrate to this shared store.
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false });
    }).catch(() => {
      set({ loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  },
}));
