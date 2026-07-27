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

  // Race-condition-safe initialization.
  // Whichever resolves first (listener or getSession) wins the initial loading→false
  // transition; the safety timeout unblocks after 5 s on slow networks.
  // Returns a cleanup function — call it from your root component on unmount.
  initialize: () => {
    let resolved = false;

    const resolve = (sess: Session | null) => {
      if (resolved) return;
      resolved = true;
      set({ session: sess, user: sess?.user ?? null, loading: false });
    };

    // 1. Subscribe first — fires INITIAL_SESSION on web if session already exists
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        // Always reflect subsequent auth changes (login / logout / token refresh)
        set({ session: sess, user: sess?.user ?? null });
        resolve(sess);
      }
    );

    // 2. getSession as a backup — needed when the listener fires late on web
    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => resolve(sess))
      .catch(() => resolve(null));

    // 3. Safety timeout — unblocks the loading state after 5 s regardless
    const timeout = setTimeout(() => resolve(null), 5_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  },
}));
