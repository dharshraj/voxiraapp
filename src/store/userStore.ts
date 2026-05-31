import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  streak_days: number;
  avatar_url?: string | null;
  created_at?: string;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => Promise<boolean>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ profile: data as UserProfile, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load profile', loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return false;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data as UserProfile, loading: false });
      return true;
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to update profile', loading: false });
      return false;
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}));
