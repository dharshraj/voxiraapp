import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar,
  Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { localTranscribe }               from '../../services/localSpeechService';
import { transcribeAudio }               from '../../services/speechService';
import { analyzeSpeech, FillerWordEntry } from '../../lib/groq';
import { useSessionStore }               from '../../store/sessionStore';
import { useAuthStore }                  from '../../store/authStore';
import { useTheme }                      from '../../theme/ThemeContext';

const { width: W } = Dimensions.get('window');
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// Clean user-facing step labels — no technical details visible
const STEPS = [
  { label: 'Uploading your recording',   icon: 'cloud-upload-outline',   color: '#4F6EF7' },
  { label: 'Transcribing your speech',   icon: 'mic-outline',            color: '#7C5CFC' },
  { label: 'Measuring pace & clarity',   icon: 'analytics-outline',      color: '#06B6D4' },
  { label: 'Scoring your delivery',      icon: 'star-outline',           color: '#F59E0B' },
  { label: 'Generating your feedback',   icon: 'bulb-outline',           color: '#10B981' },
] as const;

type StepStatus = 'pending' | 'active' | 'done' | 'error';

export default function AnalyzingScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();

  const {
    audioUri               = null,
    duration               = 0,
    mode                   = 'Speech Session',
    transcript: fallbackTranscript = '',
  } = route?.params ?? {};

  const userId    = useAuthStore(s => s.user?.id);
  const addSpeech = useSessionStore(s => s.addSpeechSession);
  const savedRef  = useRef(false);

  const [steps,    setSteps]    = useState<StepStatus[]>(['pending','pending','pending','pending','pending']);
  const [headline, setHeadline] = useState('Analysing your speech…');
  const [subline,  setSubline]  = useState('This usually takes 5–15 seconds');
  const [done,     setDone]     = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const setStep = (i: number, s: StepStatus) =>
    setSteps(prev => { const n = [...prev]; n[i] = s; return n; });

  const advanceProgress = (fraction: number) =>
    Animated.timing(progressAnim, { toValue: fraction, duration: 500, useNativeDriver: false }).start();

  const runAnalysis = async () => {
    await delay(300);
    console.log('[AnalyzingScreen] audioUri:', audioUri ? audioUri.slice(0, 50) : 'NULL');
    console.log('[AnalyzingScreen] duration:', duration, 'mode:', mode);

    // ── Step 0: Uploading ─────────────────────────────────────────────────
    setStep(0, 'active');
    advanceProgress(0.1);

    // ── Step 1: Transcribing ──────────────────────────────────────────────
    setStep(0, 'done');
    setStep(1, 'active');
    advanceProgress(0.25);

    let transcriptForApi = '';

    // Web: try local ML server first (whisper + RF running on your PC)
    // Mobile: skip local server entirely — use AssemblyAI directly
    let localResult: Awaited<ReturnType<typeof localTranscribe>> = {
      status: 'server_down', transcript: '', wpm: 0, paceScore: 60,
      fillerBreakdown: {}, fillerCount: 0, words: [], audioDuration: duration,
      language: null, features: {}, mlPrediction: null, mlAvailable: false, error: 'skipped',
    };

    if (Platform.OS === 'web') {
      console.log('[AnalyzingScreen] Web: trying local ML server…');
      localResult = await localTranscribe(audioUri ?? '', duration);
      console.log('[AnalyzingScreen] ML result: status=', localResult.status, 'err=', localResult.error ?? 'none');
    }

    if (localResult.status === 'ok' && localResult.transcript) {
      transcriptForApi = localResult.transcript;
    } else {
      // Mobile or server down — fall back to AssemblyAI
      console.log('[AnalyzingScreen] Using AssemblyAI for transcription');
      try {
        const aaiResult = await transcribeAudio(audioUri ?? '');
        if (aaiResult.status === 'completed' && aaiResult.text) {
          transcriptForApi = aaiResult.text;
        }
      } catch (e: any) {
        console.warn('[AnalyzingScreen] AssemblyAI failed:', e?.message);
      }
    }

    if (!transcriptForApi || transcriptForApi.length < 5) {
      setStep(1, 'error');
      setHasError('Could not transcribe your recording. Please record again and speak clearly.');
      return;
    }

    // ── Step 2: Measuring pace & clarity ─────────────────────────────────
    setStep(1, 'done');
    setStep(2, 'active');
    advanceProgress(0.45);
    await delay(300);

    // ── Step 3: AI scoring ────────────────────────────────────────────────
    setStep(2, 'done');
    setStep(3, 'active');
    advanceProgress(0.65);

    let aiAnalysis: any = null;
    try {
      aiAnalysis = await analyzeSpeech(transcriptForApi, duration, mode);
      console.log('[AnalyzingScreen] AI done — clarity:', aiAnalysis?.clarityScore);
    } catch (e: any) {
      console.warn('[AnalyzingScreen] AI failed:', e?.message);
      // Non-fatal — we continue with defaults
    }

    // ── Step 4: Generating feedback ───────────────────────────────────────
    setStep(3, 'done');
    setStep(4, 'active');
    advanceProgress(0.85);
    await delay(400);

    // ── Merge results ─────────────────────────────────────────────────────
    const mlOk = localResult.status === 'ok';
    const aiOk = aiAnalysis !== null;

    const wpm = mlOk
      ? Math.round(localResult.wpm)
      : (duration > 0
          ? Math.round((transcriptForApi.trim().split(/\s+/).filter(Boolean).length / duration) * 60)
          : 0);

    const paceScore = mlOk ? localResult.paceScore
      : (wpm > 0 ? Math.round(Math.max(40, Math.min(100, 100 - Math.abs(wpm - 130) / 1.5))) : 60);

    const localFillers: Record<string, number> = mlOk ? localResult.fillerBreakdown : {};
    const llmFillers:   Record<string, number> = {};
    if (aiOk) {
      for (const e of (aiAnalysis.fillerWordAnalysis ?? []) as FillerWordEntry[]) {
        if (e.word && e.count > 0) llmFillers[e.word.toLowerCase()] = e.count;
      }
    }
    const fillerBreakdown: Record<string, number> = { ...llmFillers, ...localFillers };
    const fillerCount = Object.values(fillerBreakdown).reduce((a, b) => a + b, 0);

    const clarity        = aiOk && aiAnalysis.clarityScore     > 0 ? aiAnalysis.clarityScore     : 68;
    const confidence     = aiOk && aiAnalysis.confidenceScore  > 0 ? aiAnalysis.confidenceScore  : 65;
    const structureScore = aiOk && aiAnalysis.structureScore   > 0 ? aiAnalysis.structureScore   : 66;
    const pronunciation  = Math.min(96, Math.round(clarity * 0.93 + 5));

    const fillerPenalty = Math.min(25, fillerCount * 2);
    let score = Math.round(
      clarity * 0.30 + confidence * 0.20 + structureScore * 0.20 +
      paceScore * 0.15 + pronunciation * 0.15 - fillerPenalty
    );
    if (duration < 10) score = Math.max(40, score - 15);
    score = Math.max(35, Math.min(98, score));

    const details = {
      clarity:       Math.round(clarity),
      pace:          paceScore,
      pronunciation: Math.round(pronunciation),
      confidence:    Math.round(confidence),
    };

    // ── Save ──────────────────────────────────────────────────────────────
    if (!savedRef.current && userId) {
      savedRef.current = true;
      try {
        await addSpeech({
          mode, score, duration,
          wpm:              Math.round(wpm),   // always integer — fixes DB type error
          filler_count:     fillerCount,
          filler_breakdown: fillerBreakdown,
          transcript:       transcriptForApi,
          clarity:          details.clarity,
          pace:             details.pace,
          pronunciation:    details.pronunciation,
          confidence:       details.confidence,
        }, userId);
      } catch (e: any) {
        console.error('[AnalyzingScreen] Save error:', e?.message);
      }
    }

    setStep(4, 'done');
    advanceProgress(1.0);
    await delay(300);
    setDone(true);
    setHeadline('Analysis Complete');
    setSubline('Your results are ready');

    await delay(500);
    navigation.replace('TranscriptResult', {
      score, duration, fillerCount, fillerBreakdown,
      transcript: transcriptForApi, mode,
      wpm:        Math.round(wpm),
      details,
      aiAnalysis: aiOk ? aiAnalysis : null,
      mlPrediction: mlOk ? localResult.mlPrediction : null,
    });
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    runAnalysis();
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, W - 80] });

  const s = StyleSheet.create({
    root:         { flex: 1, backgroundColor: C.bg },
    content:      { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 90 : 70, alignItems: 'center' },
    iconArea:     { height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    spinner:      { width: 90, height: 90, borderRadius: 45, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    title:        { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4, textAlign: 'center' },
    sub:          { fontSize: 13, color: C.textSec, marginBottom: 24, textAlign: 'center' },
    progressTrack:{ width: '100%', height: 5, backgroundColor: C.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 28 },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: C.primary },
    stepList:     { width: '100%', gap: 14 },
    stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepDot:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    stepLabel:    { flex: 1, fontSize: 13, color: C.textMuted },
    errorWrap:    { alignItems: 'center', gap: 14, paddingHorizontal: 8, marginTop: 16 },
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
            <Ionicons name="alert-circle" size={56} color={C.error} />
            <Text style={s.errorTitle}>Analysis Failed</Text>
            <Text style={s.errorMsg}>{hasError}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
              <Text style={s.retryTxt}>Go Back & Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.iconArea}>
              {done
                ? <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                : <View style={s.spinner}>
                    <Ionicons name="pulse-outline" size={36} color={C.primary} />
                  </View>
              }
            </View>

            <Text style={s.title}>{headline}</Text>
            <Text style={s.sub}>{subline}</Text>

            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressWidth }]} />
            </View>

            <View style={s.stepList}>
              {STEPS.map((step, i) => {
                const status   = steps[i];
                const isDoneS  = status === 'done' || done;
                const isActive = status === 'active' && !done;
                const isErr    = status === 'error';

                const dotBg = isDoneS ? '#10B981' : isErr ? C.error : isActive ? step.color : C.surface;
                const dotBr = isDoneS ? '#10B981' : isErr ? C.error : isActive ? step.color : C.border;

                return (
                  <View key={i} style={s.stepRow}>
                    <View style={[s.stepDot, { backgroundColor: dotBg, borderColor: dotBr }]}>
                      {isDoneS  && <Ionicons name="checkmark"     size={13} color="#fff" />}
                      {isErr    && <Ionicons name="close"         size={13} color="#fff" />}
                      {isActive && <Ionicons name={step.icon as any} size={13} color="#fff" />}
                    </View>
                    <Text style={[
                      s.stepLabel,
                      isDoneS  && { color: C.textSec },
                      isActive && { color: C.text, fontWeight: '600' },
                      isErr    && { color: C.error },
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
