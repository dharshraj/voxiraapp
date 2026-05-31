import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ── Speech session — matches AnalysisResultScreen params ─────────────────────

export interface SpeechSession {
  id?: string;
  type: 'speech';
  mode: string;
  score: number;
  duration: number;
  wpm: number;
  filler_count: number;
  filler_breakdown?: Record<string, number>;
  transcript: string;
  clarity: number;
  pace: number;
  pronunciation: number;
  confidence: number;
  created_at?: string;
}

// ── Interview session — matches FeedbackScreen params ────────────────────────

export interface InterviewSession {
  id?: string;
  type: 'interview';
  role: string;
  difficulty: string;
  interview_type: string;
  avg_score: number;
  question_count: number;
  created_at?: string;
}

export type AppSession = SpeechSession | InterviewSession;

interface SessionState {
  sessions: AppSession[];
  loading: boolean;

  // Add a completed speech session (optimistic + Supabase persist)
  addSpeechSession: (
    data: Omit<SpeechSession, 'type'>,
    userId: string
  ) => Promise<void>;

  // Add a completed interview session (optimistic + Supabase persist)
  addInterviewSession: (
    data: Omit<InterviewSession, 'type'>,
    userId: string
  ) => Promise<void>;

  // Load both speech and interview sessions for a user
  loadSessions: (userId: string) => Promise<void>;

  clearSessions: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  loading: false,

  addSpeechSession: async (data, userId) => {
    const session: SpeechSession = { ...data, type: 'speech' };
    // Optimistic update so UI reflects immediately
    set(state => ({ sessions: [session, ...state.sessions] }));

    try {
      await supabase.from('speech_sessions').insert({
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
    } catch {
      // Persisting to Supabase failed — session already visible in local store
    }
  },

  addInterviewSession: async (data, userId) => {
    const session: InterviewSession = { ...data, type: 'interview' };
    set(state => ({ sessions: [session, ...state.sessions] }));

    try {
      await supabase.from('interview_sessions').insert({
        user_id:        userId,
        role:           data.role,
        difficulty:     data.difficulty,
        interview_type: data.interview_type,
        avg_score:      data.avg_score,
        question_count: data.question_count,
      });
    } catch {}
  },

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
    } catch {
      set({ loading: false });
    }
  },

  clearSessions: () => set({ sessions: [] }),
}));
