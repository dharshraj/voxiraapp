import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg:          '#05050F',
  purpleSoft:  'rgba(139,92,246,0.12)',
  cyanSoft:    'rgba(6,182,212,0.12)',
  amberSoft:   'rgba(245,158,11,0.12)',
  emeraldSoft: 'rgba(16,185,129,0.12)',
  roseSoft:    'rgba(244,63,94,0.12)',
  purple:      '#8B5CF6',
  cyan:        '#06B6D4',
  amber:       '#F59E0B',
  emerald:     '#10B981',
  rose:        '#F43F5E',
  text:        '#F1F5F9',
  textMuted:   'rgba(241,245,249,0.38)',
  textHint:    'rgba(241,245,249,0.22)',
  textSec:     'rgba(241,245,249,0.65)',
  border:      'rgba(255,255,255,0.07)',
};

const MODES = [
  { id: 'Free Speech',  icon: 'mic-outline',         color: '#8B5CF6', grad: ['#8B5CF6', '#4338CA'] as const },
  { id: 'Presentation', icon: 'easel-outline',        color: '#06B6D4', grad: ['#06B6D4', '#0891B2'] as const },
  { id: 'Conversation', icon: 'chatbubbles-outline',  color: '#F43F5E', grad: ['#F43F5E', '#BE123C'] as const },
  { id: 'Read Aloud',   icon: 'book-outline',         color: '#F59E0B', grad: ['#F59E0B', '#D97706'] as const },
];

const FEATURES = [
  { icon: 'warning-outline',      color: '#F59E0B', title: 'Filler Words',    sub: 'Detects um, uh, like' },
  { icon: 'speedometer-outline',  color: '#06B6D4', title: 'Pace & Clarity',  sub: '110–150 WPM ideal'    },
  { icon: 'volume-high-outline',  color: '#10B981', title: 'Pronunciation',   sub: 'Clarity scoring'      },
  { icon: 'trending-up-outline',  color: '#8B5CF6', title: 'Confidence',      sub: 'Tone analysis'        },
];

export default function SpeechHomeScreen({ navigation }: any) {
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        {...(Platform.OS === 'web' ? ({ style: { height: '100vh', overflowY: 'auto' } } as any) : {})}
      >
        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Speech Analysis</Text>
            <Text style={s.headerSub}>AI-powered voice coaching</Text>
          </View>
          <TouchableOpacity
            style={s.histBtn}
            onPress={() => navigation.navigate('SpeechHistory')}
            activeOpacity={0.75}
          >
            <Ionicons name={'time-outline' as any} size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* HERO CTA */}
        <TouchableOpacity
          style={s.heroWrap}
          onPress={() => navigation.navigate('Record', { mode: 'Free Speech' })}
          activeOpacity={0.75}
        >
          <LinearGradient
            colors={['#8B5CF6', '#4338CA', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroGrad}
          >
            <View style={s.heroDecorCircle} />
            <View style={s.heroInner}>
              <Animated.View style={[s.micCircle, { transform: [{ scale: micPulse }] }]}>
                <Ionicons name={'mic' as any} size={40} color="#fff" />
              </Animated.View>
              <Text style={s.heroTitle}>Start Recording</Text>
              <Text style={s.heroSub}>Analyze your speech with AI</Text>
              <View style={s.heroPills}>
                <View style={s.pill}><Text style={s.pillTxt}> Filler</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}> Pace</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}> Clarity</Text></View>
              </View>
              <View style={s.ctaBtn}>
                <Text style={s.ctaBtnTxt}>Record Now →</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* MODES SECTION */}
        <Text style={s.sectionTitle}>Choose Mode</Text>
        <View style={s.grid}>
          {MODES.map((mode, i) => (
            <TouchableOpacity
              key={i}
              style={s.modeCard}
              onPress={() => navigation.navigate('Record', { mode: mode.id })}
              activeOpacity={0.75}
            >
              <View style={s.modeCardInner}>
                <View style={[s.modeIconBox, { backgroundColor: mode.color + '26' }]}>
                  <Ionicons name={mode.icon as any} size={20} color={mode.color} />
                </View>
                <Text style={s.modeLabel}>{mode.id}</Text>
                <Text style={s.modeSub}>Tap to start</Text>
              </View>
              <View style={[s.modeBorderLeft, { backgroundColor: mode.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* WHAT WE ANALYZE */}
        <Text style={s.sectionTitle}>What We Analyze</Text>
        <View style={s.featuresList}>
          {FEATURES.map((feat, i) => (
            <View key={i} style={s.featRow}>
              <View style={[s.featIconBox, { backgroundColor: feat.color + '20' }]}>
                <Ionicons name={feat.icon as any} size={22} color={feat.color} />
              </View>
              <View style={s.featText}>
                <Text style={s.featTitle}>{feat.title}</Text>
                <Text style={s.featSub}>{feat.sub}</Text>
              </View>
              <Ionicons name={'chevron-forward' as any} size={14} color={C.textHint} />
            </View>
          ))}
        </View>

        {/* Speaking Benchmarks */}
        <Text style={s.sectionTitle}>Speaking Benchmarks</Text>
        <View style={s.benchCard}>
          {[
            { label:'Ideal Speaking Pace',      value:'120-150 WPM', icon:'speedometer-outline', color:'#6C5CE7' },
            { label:'Max Filler Words (good)',   value:'< 3 per min', icon:'warning-outline',     color:'#E17055' },
            { label:'Ideal Sentence Length',     value:'15-20 words', icon:'text-outline',         color:'#00B894' },
            { label:'Eye Contact',               value:'60-70% time', icon:'eye-outline',          color:'#F0932B' },
          ].map((item, i) => (
            <View key={i} style={[s.benchRow, i === 3 && { borderBottomWidth: 0 }]}>
              <View style={[s.benchIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={s.benchLabel}>{item.label}</Text>
              <Text style={[s.benchValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Watch Out For */}
        <Text style={s.sectionTitle}>Watch Out For</Text>
        <View style={s.fillerRef}>
          {['um','uh','like','you know','basically','literally','actually','i mean','sort of','right?'].map((w, i) => (
            <View key={i} style={s.fillerRefChip}>
              <Text style={s.fillerRefText}>"{w}"</Text>
            </View>
          ))}
        </View>

        {/* Improvement Tips */}
        <View style={s.improvCard}>
          <Text style={s.improvTitle}>🎯 Quick Improvement Tips</Text>
          {[
            { tip: 'Record yourself daily',    desc: 'Even 2 minutes a day improves speaking by 40% in 30 days' },
            { tip: 'Use the pause technique',  desc: 'Replace every filler word with a 1-second pause' },
            { tip: 'Vary your tone',           desc: 'Monotone speech loses listeners after 30 seconds' },
            { tip: 'Practice tongue twisters', desc: 'Improves articulation and pronunciation clarity' },
          ].map((item, i) => (
            <View key={i} style={s.improvRow}>
              <View style={s.improvDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.improvTipText}>{item.tip}</Text>
                <Text style={s.improvDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* PROGRESS CARD */}
        <TouchableOpacity
          style={s.progressCard}
          onPress={() => navigation.navigate('SpeechProgress')}
          activeOpacity={0.75}
        >
          <Ionicons name={'bar-chart-outline' as any} size={22} color={C.purple} />
          <View style={s.progressText}>
            <Text style={s.progressTitle}>View Your Progress</Text>
            <Text style={s.progressSub}>Sessions, scores &amp; trends</Text>
          </View>
          <Ionicons name={'arrow-forward' as any} size={16} color={C.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
  scrollContent: { paddingBottom: 100 },
  header:        {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16,
  },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: C.text },
  headerSub:     { fontSize: 13, color: C.textMuted, marginTop: 2 },
  histBtn:       {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroWrap:      { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 200, marginBottom: 24 },
  heroGrad:      { flex: 1 },
  heroDecorCircle: {
    position: 'absolute', right: -30, top: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroInner:     { padding: 24, flex: 1 },
  micCircle:     {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5CF6', shadowOpacity: 0.55, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 12,
    marginBottom: 0,
  },
  heroTitle:     { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 12 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 16 },
  heroPills:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pill:          {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  pillTxt:       { fontSize: 11, color: '#fff', fontWeight: '600' },
  ctaBtn:        {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  ctaBtnTxt:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  modeCard:      {
    width: '48%', borderRadius: 18, overflow: 'hidden',
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    position: 'relative',
  },
  modeCardInner: { padding: 16, gap: 8 },
  modeIconBox:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeLabel:     { fontSize: 14, fontWeight: '700', color: C.text },
  modeSub:       { fontSize: 11, color: C.textMuted },
  modeBorderLeft:{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 3 },
  featuresList:  { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  featRow:       {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
  },
  featIconBox:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featText:      { flex: 1, marginLeft: 12 },
  featTitle:     { fontSize: 14, fontWeight: '600', color: C.text },
  featSub:       { fontSize: 12, color: C.textMuted },
  progressCard:  {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    marginBottom: 8,
  },
  progressText:  { flex: 1, marginLeft: 12 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  progressSub:   { fontSize: 12, color: C.textMuted },
  benchCard:     { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, marginBottom: 16 },
  benchRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  benchIcon:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benchLabel:    { flex: 1, fontSize: 13, color: 'rgba(241,245,249,0.55)' },
  benchValue:    { fontSize: 13, fontWeight: '700' },
  fillerRef:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  fillerRefChip: { backgroundColor: 'rgba(244,63,94,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(244,63,94,0.25)' },
  fillerRefText: { fontSize: 12, color: '#F43F5E', fontWeight: '500' },
  improvCard:    { backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)' },
  improvTitle:   { fontSize: 14, fontWeight: '700', color: '#A78BFA', marginBottom: 12 },
  improvRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  improvDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginTop: 5, flexShrink: 0 },
  improvTipText: { fontSize: 13, fontWeight: '600', color: '#F1F5F9', marginBottom: 2 },
  improvDesc:    { fontSize: 11, color: 'rgba(241,245,249,0.50)', lineHeight: 17 },
});
