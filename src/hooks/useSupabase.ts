import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { UserProfile } from '../store/userStore';

// ── Profile ────────────────────────────────────────────────────────────────────

export function useProfile() {
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) return null;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (err) throw err;
      return data as UserProfile;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<boolean> => {
      if (!user) return false;
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (err) throw err;
        return true;
      } catch (e: any) {
        setError(e?.message ?? 'Failed to update profile');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { fetchProfile, updateProfile, loading, error };
}

// ── Speech sessions ───────────────────────────────────────────────────────────

export interface RawSpeechSession {
  id: string;
  mode: string;
  score: number;
  duration: number;
  wpm: number;
  filler_count: number;
  filler_breakdown: Record<string, number>;
  transcript: string;
  clarity: number;
  pace: number;
  pronunciation: number;
  confidence: number;
  created_at: string;
}

export function useSpeechSessions() {
  const user    = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const saveSpeechSession = useCallback(
    async (session: Omit<RawSpeechSession, 'id' | 'created_at'>): Promise<void> => {
      if (!user) return;
      try {
        const { error: err } = await supabase
          .from('speech_sessions')
          .insert({ user_id: user.id, ...session });
        if (err) throw err;
      } catch (e: any) {
        console.warn('saveSpeechSession failed:', e?.message);
      }
    },
    [user]
  );

  const fetchSpeechSessions = useCallback(
    async (limit = 50): Promise<RawSpeechSession[]> => {
      if (!user) return [];
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('speech_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (err) throw err;
        return (data ?? []) as RawSpeechSession[];
      } catch (e: any) {
        setError(e?.message ?? 'Failed to fetch sessions');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { saveSpeechSession, fetchSpeechSessions, loading, error };
}

// ── Interview sessions ────────────────────────────────────────────────────────

export interface RawInterviewSession {
  id: string;
  role: string;
  difficulty: string;
  interview_type: string;
  avg_score: number;
  question_count: number;
  created_at: string;
}

export function useInterviewSessions() {
  const user    = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const saveInterviewSession = useCallback(
    async (session: Omit<RawInterviewSession, 'id' | 'created_at'>): Promise<void> => {
      if (!user) return;
      try {
        const { error: err } = await supabase
          .from('interview_sessions')
          .insert({ user_id: user.id, ...session });
        if (err) throw err;
      } catch (e: any) {
        console.warn('saveInterviewSession failed:', e?.message);
      }
    },
    [user]
  );

  const fetchInterviewSessions = useCallback(
    async (limit = 50): Promise<RawInterviewSession[]> => {
      if (!user) return [];
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (err) throw err;
        return (data ?? []) as RawInterviewSession[];
      } catch (e: any) {
        setError(e?.message ?? 'Failed to fetch sessions');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { saveInterviewSession, fetchInterviewSessions, loading, error };
}
