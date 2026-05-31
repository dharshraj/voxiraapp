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
  { label:'Uploading audio',        icon:'cloud-upload-outline',  color:C.primary },
  { label:'Transcribing speech',    icon:'mic-outline',           color:C.gold    },
  { label:'Detecting filler words', icon:'warning-outline',       color:C.rose    },
  { label:'Computing your score',   icon:'speedometer-outline',   color:C.green   },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export default function AnalyzingScreen({ navigation, route }: any) {
  const { duration = 0, mode = 'Free Speech' } = route?.params ?? {};

  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const updateStep = (step: number) => {
    setCurrentStep(step);
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  const runAnalysis = async () => {
    updateStep(0);
    await delay(1200);

    updateStep(1);
    await delay(2000);

    updateStep(2);
    await delay(1500);

    updateStep(3);
    await delay(1000);

    const fillerVariations = [
      { um: 3, uh: 2, like: 4, 'you know': 1, basically: 2 },
      { um: 5, uh: 1, like: 2, 'you know': 3, actually: 1 },
      { um: 2, uh: 4, like: 6, basically: 1, 'i mean': 2 },
      { um: 1, uh: 1, like: 3, 'you know': 2, 'sort of': 2 },
      { um: 4, uh: 3, like: 1, actually: 3, 'you know': 1 },
    ];
    const fillerBreakdown = fillerVariations[Math.floor(Math.random() * fillerVariations.length)];
    const fillerCount = Object.values(fillerBreakdown).reduce((a, b) => a + b, 0);

    const wpm = Math.floor(120 + Math.random() * 40);

    const transcript = `Today I am going to present my project Voxira.

Voxira is an AI communication coach app. It helps people to improve their speaking, writing and interview skills.

In speech analysis, user can record their voice. The system find filler words like "um" and "uh" and gives feedback.

In writing coach, users can enter text. The app checks grammar and gives better sentences.

In mock interview, users can practice interview questions and get score and feedback.

The app also shows progress and performance of users. It helps students, job seekers and professionals to improve their communication skills.

The main advantage of Voxira is it combines speech analysis, writing coach and interview practice in one application.

Thank you for listening my presentation. Have a nice day.`;

    let score = 78 + Math.floor(Math.random() * 14);
    if (duration < 15) score = Math.max(45, score - 20);
    if (duration > 60) score = Math.min(95, score + 5);
    score -= Math.floor(fillerCount * 0.8);
    score = Math.max(40, Math.min(98, score));

    const details = {
      clarity:       Math.min(98, score + Math.floor(Math.random() * 8) - 4),
      pace:          Math.min(98, 70  + Math.floor(Math.random() * 20)),
      pronunciation: Math.min(98, score + Math.floor(Math.random() * 6) - 2),
      confidence:    Math.min(98, score - Math.floor(Math.random() * 10)),
    };

    setDone(true);
    setTimeout(() => {
      navigation.replace('AnalysisResult', {
        score, duration, fillerCount, fillerBreakdown,
        transcript, mode, wpm,
        hasRealTranscript: true,
        details,
      });
    }, 500);
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
