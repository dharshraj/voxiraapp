import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { analyzeSpeech } from '../../lib/openai';
import { useSessionStore } from '../../store/sessionStore';
import { useAuthStore } from '../../store/authStore';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#F8F7F4', bgCard:'#FFFFFF', surface:'#ECECEC',
  primary:'#6C5CE7', accent:'#A29BFE', green:'#00B894', gold:'#FDCB6E', rose:'#E17055',
  text:'#2D3436', textSec:'#636E72', textHint:'#B2BEC3', border:'#E0DDD8',
};

const STEPS = [
  { label:'Processing audio',       icon:'cloud-upload-outline',  color: C.primary },
  { label:'Reading transcript',     icon:'mic-outline',           color: C.gold    },
  { label:'Detecting filler words', icon:'warning-outline',       color: C.rose    },
  { label:'Running AI analysis',    icon:'sparkles-outline',      color: C.green   },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export default function AnalyzingScreen({ navigation, route }: any) {
  const {
    duration    = 0,
    mode        = 'Free Speech',
    transcript  = '',
    fillerWords = [],
  } = route?.params ?? {};

  const userId       = useAuthStore(s => s.user?.id);
  const addSpeech    = useSessionStore(s => s.addSpeechSession);
  const savedRef     = useRef(false);

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
    updateStep(0);
    await delay(700);

    if (!transcript || transcript.length < 10) {
      setHasError(
        'No transcript was captured.\n\nTranscription may have failed — go back and try recording again.'
      );
      return;
    }

    // Step 1 — transcript preview
    updateStep(1);
    setStatusMsg(`Transcript: ${transcript.slice(0, 60)}…`);
    await delay(900);

    // Step 2 — filler breakdown from AssemblyAI word data
    updateStep(2);
    const fillerBreakdown: Record<string, number> = {};
    for (const w of fillerWords as Array<{ text: string }>) {
      const word = w.text.toLowerCase().trim();
      if (word) fillerBreakdown[word] = (fillerBreakdown[word] ?? 0) + 1;
    }
    const fillerCount = Object.values(fillerBreakdown).reduce((a, b) => a + b, 0);
    await delay(600);

    // Step 3 — OpenAI analysis on real transcript
    updateStep(3);
    setStatusMsg('');

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const wpm       = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;
    const paceScore = wpm > 0
      ? Math.round(Math.max(40, 100 - Math.abs(wpm - 130) / 1.2))
      : 65;

    let aiAnalysis;
    try {
      aiAnalysis = await analyzeSpeech(transcript, duration, mode);
      console.log('[AnalyzingScreen] AI analysis done:', aiAnalysis.clarityScore);
    } catch (e: any) {
      console.error('[AnalyzingScreen] AI analysis failed:', e.message);
      setHasError(
        `AI analysis failed: ${e.message}\n\nCheck EXPO_PUBLIC_OPENAI_KEY in your .env file.`
      );
      return;
    }

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

    // Persist session exactly once before navigating away
    if (!savedRef.current && userId) {
      savedRef.current = true;
      addSpeech({
        mode,
        score,
        duration,
        wpm,
        filler_count:     fillerCount,
        filler_breakdown: fillerBreakdown,
        transcript,
        clarity:      details.clarity,
        pace:         details.pace,
        pronunciation:details.pronunciation,
        confidence:   details.confidence,
      }, userId).catch(console.warn);
    }

    setDone(true);
    setTimeout(() => {
      navigation.replace('AnalysisResult', {
        score, duration, fillerCount, fillerBreakdown,
        transcript, mode, wpm, details, aiAnalysis,
      });
    }, 600);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    runAnalysis();
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, W - 80] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>

        {hasError ? (
          <View style={s.errorWrap}>
            <Ionicons name="alert-circle" size={60} color={C.rose} />
            <Text style={s.errorTitle}>Analysis Failed</Text>
            <Text style={s.errorMsg}>{hasError}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
              <Text style={s.retryTxt}>← Go Back & Try Again</Text>
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
                <Ionicons name="checkmark-circle" size={64} color={C.green} />
              )}
            </View>
            <Text style={s.title}>{done ? 'Analysis Complete' : 'Analyzing Your Speech'}</Text>
            <Text style={s.sub}>{done ? 'Your results are ready' : (statusMsg || 'Please wait…')}</Text>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressWidth }]}>
                <LinearGradient colors={[C.primary, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
            <View style={s.stepList}>
              {STEPS.map((step, i) => {
                const isDone    = i < currentStep || done;
                const isCurrent = i === currentStep && !done;
                return (
                  <View key={i} style={s.stepRow}>
                    <View style={[
                      s.stepDot,
                      isDone    && { backgroundColor: C.green },
                      isCurrent && { backgroundColor: step.color },
                    ]}>
                      {isDone && <Ionicons name="checkmark" size={12} color="#fff" />}
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

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  content:      { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 100 : 80, alignItems: 'center' },
  iconArea:     { height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  spinnerOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 6, textAlign: 'center' },
  sub:          { fontSize: 14, color: C.textSec, marginBottom: 24, textAlign: 'center', paddingHorizontal: 16 },
  progressTrack:{ width: '100%', height: 6, backgroundColor: C.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 28 },
  progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  stepList:     { width: '100%', gap: 14 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  stepLabel:    { flex: 1, fontSize: 14, color: C.textHint },
  errorWrap:    { alignItems: 'center', gap: 16, paddingHorizontal: 8, marginTop: 20 },
  errorTitle:   { fontSize: 20, fontWeight: '700', color: C.rose, textAlign: 'center' },
  errorMsg:     { fontSize: 13, color: C.textSec, lineHeight: 20, textAlign: 'center' },
  retryBtn:     { marginTop: 8, backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  retryTxt:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});
