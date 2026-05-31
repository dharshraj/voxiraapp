import React, { useState, useRef, useEffect } from 'react';
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
                <View style={s.pill}><Text style={s.pillTxt}>🎯 Filler</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}>📊 Pace</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}>🔊 Clarity</Text></View>
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
});
