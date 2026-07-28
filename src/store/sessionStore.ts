/**
 * sessionStore — Zustand store for speech and interview sessions
 *
 * SAVE FLOW (addSpeechSession):
 *  1. Optimistic insert into local state so UI responds immediately.
 *  2. Await the Supabase insert and surface any error — no silent swallow.
 *  3. After a successful insert, re-fetch the full list from Supabase so
 *     the local optimistic object is replaced with the server row (which
 *     includes the real `id`, `created_at`, etc.).
 *
 * SUPABASE RLS NOTE:
 *  The speech_sessions table must have a policy that allows authenticated
 *  users to insert rows where user_id = auth.uid().  Example:
 *
 *    create policy "Users insert own speech sessions"
 *    on speech_sessions for insert
 *    with check (auth.uid() = user_id);
 *
 *    create policy "Users select own speech sessions"
 *    on speech_sessions for select
 *    using (auth.uid() = user_id);
 *
 *  Without these policies the insert will return a 403 / RLS violation
 *  which is now surfaced instead of swallowed.
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ── Speech session ────────────────────────────────────────────────────────────

export interface SpeechSession {
  id?:               string;
  type:              'speech';
  mode:              string;
  score:             number;
  duration:          number;
  wpm:               number;
  filler_count:      number;
  filler_breakdown?: Record<string, number>;
  transcript:        string;
  clarity:           number;
  pace:              number;
  pronunciation:     number;
  confidence:        number;
  created_at?:       string;
}

// ── Interview session ─────────────────────────────────────────────────────────

export interface InterviewSession {
  id?:            string;
  type:           'interview';
  role:           string;
  difficulty:     string;
  interview_type: string;
  avg_score:      number;
  question_count: number;
  created_at?:    string;
}

export type AppSession = SpeechSession | InterviewSession;

// ── Store interface ───────────────────────────────────────────────────────────

interface SessionState {
  sessions:  AppSession[];
  loading:   boolean;
  saveError: string | null;   // exposed so UI can surface it

  addSpeechSession:    (data: Omit<SpeechSession, 'type'>,    userId: string) => Promise<void>;
  addInterviewSession: (data: Omit<InterviewSession, 'type'>, userId: string) => Promise<void>;
  loadSessions:        (userId: string) => Promise<void>;
  clearSaveError:      () => void;
  clearSessions:       () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions:  [],
  loading:   false,
  saveError: null,

  // ── addSpeechSession ────────────────────────────────────────────────────────
  addSpeechSession: async (data, userId) => {
    // 1. Optimistic insert — UI sees the result immediately
    const optimistic: SpeechSession = { ...data, type: 'speech' };
    set(state => ({ sessions: [optimistic, ...state.sessions], saveError: null }));

    console.log('[sessionStore] Saving speech session to Supabase, user_id:', userId);

    // 2. Persist to Supabase — surface any error
    const { error } = await supabase.from('speech_sessions').insert({
      user_id:          userId,
      mode:             data.mode,
      score:            data.score,
      duration:         data.duration,
      wpm:              data.wpm,
      filler_count:     data.filler_count,
      filler_breakdown: data.filler_breakdown ?? {},
      transcript:       data.transcript,
      clarity:          data.clarity,
      pace:             data.pace,
      pronunciation:    data.pronunciation,
      confidence:       data.confidence,
    });

    if (error) {
      // Surface the error — previously this was silently swallowed
      console.error('[sessionStore] speech_sessions insert failed:', error.message, error.code, error.details);
      set({ saveError: error.message });
      // Keep the optimistic row visible so the user still sees their result,
      // but mark the error so the UI can warn them it was not persisted.
      return;
    }

    console.log('[sessionStore] Speech session saved successfully.');

    // 3. Re-fetch from Supabase — replaces the optimistic row with the real one
    //    (includes server-generated id, created_at, etc.)
    await get().loadSessions(userId);
  },

  // ── addInterviewSession ─────────────────────────────────────────────────────
  addInterviewSession: async (data, userId) => {
    const optimistic: InterviewSession = { ...data, type: 'interview' };
    set(state => ({ sessions: [optimistic, ...state.sessions], saveError: null }));

    console.log('[sessionStore] Saving interview session, user_id:', userId);

    const { error } = await supabase.from('interview_sessions').insert({
      user_id:        userId,
      role:           data.role,
      difficulty:     data.difficulty,
      interview_type: data.interview_type,
      avg_score:      data.avg_score,
      question_count: data.question_count,
    });

    if (error) {
      console.error('[sessionStore] interview_sessions insert failed:', error.message, error.code);
      set({ saveError: error.message });
      return;
    }

    await get().loadSessions(userId);
  },

  // ── loadSessions ────────────────────────────────────────────────────────────
  loadSessions: async (userId) => {
    set({ loading: true });
    try {
      const [speechRes, interviewRes] = await Promise.all([
        supabase
          .from('speech_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (speechRes.error) {
        console.error('[sessionStore] loadSessions speech error:', speechRes.error.message);
      }
      if (interviewRes.error) {
        console.error('[sessionStore] loadSessions interview error:', interviewRes.error.message);
      }

      const speechSessions: SpeechSession[] = (speechRes.data ?? []).map(
        (s: any) => ({ ...s, type: 'speech' as const })
      );
      const interviewSessions: InterviewSession[] = (interviewRes.data ?? []).map(
        (s: any) => ({ ...s, type: 'interview' as const })
      );

      const merged = [...speechSessions, ...interviewSessions].sort((a, b) => {
        const tA = new Date(a.created_at ?? 0).getTime();
        const tB = new Date(b.created_at ?? 0).getTime();
        return tB - tA;
      });

      set({ sessions: merged, loading: false });
    } catch (err: any) {
      console.error('[sessionStore] loadSessions threw:', err?.message);
      set({ loading: false });
    }
  },

  clearSaveError: () => set({ saveError: null }),
  clearSessions:  () => set({ sessions: [] }),
}));
