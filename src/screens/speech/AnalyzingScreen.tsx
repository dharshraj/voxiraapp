import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeSpeech, FillerWordEntry } from '../../lib/openai';
import { useSessionStore } from '../../store/sessionStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeContext';

const { width: W } = Dimensions.get('window');

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export default function AnalyzingScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();
  const {
    duration    = 0,
    mode        = 'Free Speech',
    transcript  = '',
    fillerWords = [],   // WordItem[] from AssemblyAI — used as a seed/cross-check
  } = route?.params ?? {};

  const userId    = useAuthStore(s => s.user?.id);
  const addSpeech = useSessionStore(s => s.addSpeechSession);
  const savedRef  = useRef(false);

  // Step labels — now 5 steps including the LLM filler analysis
  const STEPS = [
    { label: 'Processing audio',          icon: 'cloud-upload-outline', color: C.primary  },
    { label: 'Reading transcript',        icon: 'mic-outline',          color: C.warning   },
    { label: 'Detecting filler words',    icon: 'warning-outline',      color: C.error     },
    { label: 'Running AI speech analysis',icon: 'sparkles-outline',     color: C.info      },
    { label: 'Generating suggestions',    icon: 'bulb-outline',         color: C.success   },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [done,        setDone]        = useState(false);
  const [statusMsg,   setStatusMsg]   = useState('');
  const [hasError,    setHasError]    = useState<string | null>(null);

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const updateStep = (step: number) => {
    setCurrentStep(step);
    Animated.timing(progressAnim, {
      toValue:  (step + 1) / STEPS.length,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

  const runAnalysis = async () => {
    // ── Step 0: Processing audio ─────────────────────────────────────────────
    updateStep(0);
    await delay(600);

    if (!transcript || transcript.length < 10) {
      setHasError(
        'No transcript was captured.\n\nTranscription may have failed — go back and try recording again.\n\nCheck the browser console for detailed error logs.'
      );
      return;
    }

    // ── Step 1: Reading transcript ───────────────────────────────────────────
    updateStep(1);
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const wpm       = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;
    setStatusMsg(`${wordCount} words · ${wpm > 0 ? wpm + ' WPM' : 'calculating pace…'}`);
    await delay(700);

    // ── Step 2: Detecting filler words ───────────────────────────────────────
    // Build a preliminary count from the AssemblyAI word list (fast, no network).
    // The LLM pass in step 3 will produce the definitive count from the transcript text.
    updateStep(2);
    const seedBreakdown: Record<string, number> = {};
    for (const w of fillerWords as Array<{ text: string }>) {
      const word = w.text.toLowerCase().trim();
      if (word) seedBreakdown[word] = (seedBreakdown[word] ?? 0) + 1;
    }
    setStatusMsg('');
    await delay(500);

    // ── Step 3: AI speech analysis ───────────────────────────────────────────
    updateStep(3);
    console.log('[AnalyzingScreen] Calling analyzeSpeech, transcript length:', transcript.length);

    let aiAnalysis;
    try {
      aiAnalysis = await analyzeSpeech(transcript, duration, mode);
      console.log('[AnalyzingScreen] analyzeSpeech done — clarity:', aiAnalysis.clarityScore,
        '| fillerWordAnalysis entries:', aiAnalysis.fillerWordAnalysis?.length ?? 0);
    } catch (e: any) {
      console.error('[AnalyzingScreen] analyzeSpeech failed:', e.message);

      // Produce a clear, actionable message for every known failure mode
      let uiMessage: string;
      const msg = e.message ?? '';
      if (msg.includes('rate limit') || msg.includes('rate_limit')) {
        uiMessage = 'Groq rate limit reached.\n\nPlease wait 30–60 seconds and try again.';
      } else if (msg.includes('quota') || msg.includes('429')) {
        uiMessage = 'Groq usage quota exceeded.\n\nCheck your account at console.groq.com.';
      } else if (msg.includes('invalid') && msg.toLowerCase().includes('key')) {
        uiMessage = 'Groq API key is invalid.\n\nRun: supabase secrets set GROQ_API_KEY=gsk_... then redeploy.';
      } else if (msg.includes('not configured')) {
        uiMessage = 'GROQ_API_KEY is not set on the server.\n\nRun: supabase secrets set GROQ_API_KEY=gsk_... then deploy the groq-analysis function.';
      } else if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('AbortError')) {
        uiMessage = 'The AI analysis request timed out.\n\nThis can happen with longer recordings — please try again.';
      } else if (msg.includes('edge function') || msg.includes('Edge Function') || msg.includes('FunctionsFetchError')) {
        uiMessage = 'Could not reach the groq-analysis function.\n\nMake sure it is deployed: supabase functions deploy groq-analysis';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        uiMessage = 'Network error while calling the AI.\n\nCheck your internet connection and try again.';
      } else {
        uiMessage = `AI analysis failed: ${msg}\n\nCheck the browser console for details.`;
      }

      setHasError(uiMessage);
      return;
    }

    // ── Step 4: Generating suggestions ──────────────────────────────────────
    updateStep(4);
    setStatusMsg('Building your personalised report…');

    // Resolve the definitive filler breakdown:
    // Prefer the LLM's analysis (which scans the full transcript text) but
    // merge it with the seed from AssemblyAI word tags as a safety net.
    const llmFillerBreakdown: Record<string, number> = {};
    for (const entry of (aiAnalysis.fillerWordAnalysis ?? []) as FillerWordEntry[]) {
      if (entry.word && entry.count > 0) {
        llmFillerBreakdown[entry.word.toLowerCase()] = entry.count;
      }
    }
    // Merge seed counts for any fillers AssemblyAI tagged but the LLM missed
    for (const [word, count] of Object.entries(seedBreakdown)) {
      if (!llmFillerBreakdown[word]) {
        llmFillerBreakdown[word] = count;
      }
    }
    const fillerCount = Object.values(llmFillerBreakdown).reduce((a, b) => a + b, 0);

    console.log('[AnalyzingScreen] Final filler breakdown:', llmFillerBreakdown, '| total:', fillerCount);

    // ── Derive numeric scores ────────────────────────────────────────────────
    const paceScore = wpm > 0
      ? Math.round(Math.max(40, 100 - Math.abs(wpm - 130) / 1.2))
      : 65;

    const clarity        = aiAnalysis.clarityScore;
    const confidence     = aiAnalysis.confidenceScore;
    const structureScore = aiAnalysis.structureScore;
    const pronunciation  = Math.min(96, Math.round(clarity * 0.93 + 5));

    const fillerPenalty = Math.min(25, fillerCount * 2);
    let score = Math.round(
      (clarity * 0.3 + confidence * 0.2 + structureScore * 0.2 + paceScore * 0.15 + pronunciation * 0.15)
      - fillerPenalty
    );
    if (duration < 10) score = Math.max(40, score - 15);
    score = Math.max(35, Math.min(98, score));

    const details = {
      clarity:       Math.round(clarity),
      pace:          paceScore,
      pronunciation: Math.round(pronunciation),
      confidence:    Math.round(confidence),
    };

    // ── Save session ─────────────────────────────────────────────────────────
    if (!savedRef.current && userId) {
      savedRef.current = true;
      addSpeech({
        mode, score, duration, wpm,
        filler_count:     fillerCount,
        filler_breakdown: llmFillerBreakdown,
        transcript,
        clarity:       details.clarity,
        pace:          details.pace,
        pronunciation: details.pronunciation,
        confidence:    details.confidence,
      }, userId).catch(e => console.warn('[AnalyzingScreen] Session save error:', e));
    }

    await delay(400);
    setDone(true);

    setTimeout(() => {
      navigation.replace('AnalysisResult', {
        score, duration, fillerCount,
        fillerBreakdown: llmFillerBreakdown,
        transcript, mode, wpm, details, aiAnalysis,
      });
    }, 600);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    runAnalysis();
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, W - 80] });

  const s = StyleSheet.create({
    root:         { flex: 1, backgroundColor: C.bg },
    content:      { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 100 : 80, alignItems: 'center' },
    iconArea:     { height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    spinnerOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    title:        { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 6, textAlign: 'center' },
    sub:          { fontSize: 14, color: C.textSec, marginBottom: 24, textAlign: 'center', paddingHorizontal: 16 },
    progressTrack:{ width: '100%', height: 6, backgroundColor: C.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 28 },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: C.primary },
    stepList:     { width: '100%', gap: 14 },
    stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepDot:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    stepLabel:    { flex: 1, fontSize: 14, color: C.textMuted },
    errorWrap:    { alignItems: 'center', gap: 16, paddingHorizontal: 8, marginTop: 20 },
    errorTitle:   { fontSize: 20, fontWeight: '700', color: C.error, textAlign: 'center' },
    errorMsg:     { fontSize: 13, color: C.textSec, lineHeight: 20, textAlign: 'center' },
    retryBtn:     { marginTop: 8, backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
    retryTxt:     { fontSize: 14, fontWeight: '700', color: '#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>

        {hasError ? (
          <View style={s.errorWrap}>
            <Ionicons name="alert-circle" size={60} color={C.error} />
            <Text style={s.errorTitle}>Analysis Failed</Text>
            <Text style={s.errorMsg}>{hasError}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
              <Text style={s.retryTxt}>Go Back & Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.iconArea}>
              {!done ? (
                <View style={s.spinnerOuter}>
                  <Ionicons
                    name={(STEPS[currentStep]?.icon ?? 'mic') as any}
                    size={32}
                    color={STEPS[currentStep]?.color ?? C.primary}
                  />
                </View>
              ) : (
                <Ionicons name="checkmark-circle" size={64} color={C.success} />
              )}
            </View>
            <Text style={s.title}>{done ? 'Analysis Complete' : 'Analysing Your Speech'}</Text>
            <Text style={s.sub}>{done ? 'Your results are ready' : (statusMsg || 'Please wait…')}</Text>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressWidth }]} />
            </View>
            <View style={s.stepList}>
              {STEPS.map((step, i) => {
                const isDone    = i < currentStep || done;
                const isCurrent = i === currentStep && !done;
                return (
                  <View key={i} style={s.stepRow}>
                    <View style={[
                      s.stepDot,
                      isDone    && { backgroundColor: C.success },
                      isCurrent && { backgroundColor: step.color },
                    ]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={12} color="#fff" />
                        : isCurrent
                          ? <Ionicons name={step.icon as any} size={14} color="#fff" />
                          : null}
                    </View>
                    <Text style={[
                      s.stepLabel,
                      isDone    && { color: C.textSec },
                      isCurrent && { color: C.text, fontWeight: '600' },
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}
