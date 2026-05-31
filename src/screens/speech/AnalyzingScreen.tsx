import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#F8F7F4', bgCard:'#FFFFFF', surface:'#ECECEC',
  primary:'#6C5CE7', accent:'#A29BFE', green:'#00B894', gold:'#FDCB6E', rose:'#E17055',
  text:'#2D3436', textSec:'#636E72', textHint:'#B2BEC3', border:'#E0DDD8',
};

const STEPS = [
  { label:'Transcribing audio',       icon:'mic-outline',         color:C.primary },
  { label:'Detecting filler words',   icon:'warning-outline',     color:C.gold    },
  { label:'Measuring pace & clarity', icon:'speedometer-outline', color:C.rose    },
  { label:'Generating feedback',      icon:'sparkles-outline',    color:C.green   },
];

function calcWPM(transcript: string, dur: number) {
  if (dur <= 0) return 0;
  return Math.round(
    (transcript.trim().split(/\s+/).filter(w => w.length > 0).length / dur) * 60
  );
}

export default function AnalyzingScreen({ navigation, route }: any) {
  const {
    duration = 0,
    transcript = '',
    mode = 'Free Speech',
    fillerWords = [],   // WordItem[] from AssemblyAI via RecordScreen
  } = route?.params ?? {};

  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    let step = 0;
    const advance = () => {
      if (step >= STEPS.length) {
        setDone(true);

        const hasTranscript = transcript && transcript.length > 10;
        let score: number, fillerCount: number, fillerBreakdown: Record<string, number>, wpm: number;
        let clarity: number, pace: number, pronunciation: number, confidence: number;

        if (hasTranscript) {
          // Build real filler breakdown from AssemblyAI's detected filler words
          const breakdown: Record<string, number> = {};
          (fillerWords as any[]).forEach((fw: any) => {
            const word = fw.text.toLowerCase().trim();
            breakdown[word] = (breakdown[word] ?? 0) + 1;
          });
          fillerCount    = (fillerWords as any[]).length;
          fillerBreakdown = breakdown;

          wpm = calcWPM(transcript, duration);

          score = 100;
          score -= fillerCount * 4;
          if (wpm > 0 && (wpm < 100 || wpm > 180)) score -= 10;
          if (duration < 15) score -= 10;
          score = Math.max(20, Math.min(100, Math.round(score)));

          clarity      = Math.max(40, Math.min(100, 95 - fillerCount * 3));
          pace         = wpm === 0 ? 50 : (wpm >= 110 && wpm <= 150) ? 90 : (wpm >= 80 && wpm <= 180) ? 75 : 55;
          pronunciation = Math.max(40, Math.min(100, Math.round(score * 0.95)));
          confidence   = Math.max(40, score - 5);
        } else {
          fillerCount = 0; fillerBreakdown = {}; wpm = 0;
          score        = duration >= 60 ? 78 : duration >= 30 ? 65 : 45;
          clarity      = score - 3; pace = score - 5;
          pronunciation = score - 2; confidence = score - 8;
        }

        setTimeout(() => {
          navigation.replace('AnalysisResult', {
            score, duration, fillerCount, fillerBreakdown,
            transcript: hasTranscript
              ? transcript
              : `Session recorded for ${Math.floor(duration / 60)}m ${duration % 60}s. Connect AssemblyAI for detailed word-by-word analysis.`,
            mode, wpm,
            details: {
              clarity:      Math.min(100, clarity),
              pace:         Math.min(100, pace),
              pronunciation: Math.min(100, pronunciation),
              confidence:   Math.min(100, confidence),
            },
          });
        }, 800);
        return;
      }
      setCurrentStep(step);
      Animated.timing(progressAnim, {
        toValue: (step + 1) / STEPS.length,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      step++;
      setTimeout(advance, 1200);
    };
    setTimeout(advance, 500);
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, W - 80] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
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
        <Text style={s.sub}>{done ? 'Your results are ready' : 'Please wait...'}</Text>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth }]}>
            <LinearGradient
              colors={[C.primary, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
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
  sub:          { fontSize: 14, color: C.textSec, marginBottom: 24, textAlign: 'center' },
  progressTrack:{ width: '100%', height: 6, backgroundColor: C.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 28 },
  progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  stepList:     { width: '100%', gap: 14 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  stepLabel:    { flex: 1, fontSize: 14, color: C.textHint },
});
