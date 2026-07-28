import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const MODES = [
  { id: 'Free Speech',  icon: 'mic-outline',        color: '#92400E' },
  { id: 'Presentation', icon: 'easel-outline',       color: '#15803D' },
  { id: 'Conversation', icon: 'chatbubbles-outline', color: '#B91C1C' },
  { id: 'Read Aloud',   icon: 'book-outline',        color: '#0F5132' },
];

const FEATURES = [
  {
    icon: 'warning-outline',
    color: '#B45309',
    title: 'Filler Words',
    sub: 'Filler words — "um", "uh", "like", "you know", "basically", "literally" — are spoken habit fillers that appear when your brain is searching for the next idea. Voxira detects and counts every instance. A lower filler count signals stronger fluency and preparation; professional speakers typically average fewer than 3 fillers per minute.',
  },
  {
    icon: 'speedometer-outline',
    color: '#0369A1',
    title: 'Pace & WPM',
    sub: 'Words per minute measures how quickly you speak. Research consistently places the ideal conversational pace between 120 and 150 WPM — fast enough to hold attention, slow enough for listeners to process each idea. Speaking above 180 WPM causes comprehension to drop; below 100 WPM and audiences disengage. Voxira measures your exact WPM after every session.',
  },
  {
    icon: 'volume-high-outline',
    color: '#15803D',
    title: 'Pronunciation',
    sub: 'Pronunciation clarity measures how consistently your words are articulated and correctly formed. The analysis checks whether speech sounds are crisp and fully enunciated versus blurred, dropped, or merged into neighbouring words. Good pronunciation reduces listener effort and ensures your message lands clearly, even in fast-paced delivery.',
  },
  {
    icon: 'trending-up-outline',
    color: '#92400E',
    title: 'Confidence',
    sub: 'The confidence score reflects how assured your delivery sounds based on a combination of factors: steadiness of pace (nervous speakers often rush), filler word frequency, and tonal consistency. High-confidence speech maintains even pace, uses deliberate pauses, and avoids the hesitation patterns that signal uncertainty to listeners.',
  },
];

const BENCHMARKS = [
  { label: 'Ideal speaking pace',      value: '120–150 WPM', icon: 'speedometer-outline', color: '#0369A1' },
  { label: 'Max fillers (good)',        value: '< 3 per min', icon: 'warning-outline',     color: '#B45309' },
  { label: 'Ideal sentence length',    value: '15–20 words', icon: 'text-outline',         color: '#15803D' },
];

export default function SpeechHomeScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    scrollContent: { paddingBottom: 80 },

    header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14 },
    headerLeft:    {},
    headerTitle:   { fontSize: 22, fontWeight: '700', color: C.text },
    headerSub:     { fontSize: 12, color: C.textMuted, marginTop: 2 },
    histBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

    divider:       { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },

    sectionLabel:  { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10 },

    // Primary record button — compact banner
    recordCard:    { marginHorizontal: 20, marginBottom: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
    recordIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    recordText:    { flex: 1 },
    recordTitle:   { fontSize: 15, fontWeight: '700', color: '#fff' },
    recordSub:     { fontSize: 12, color: 'rgba(255,255,255,0.70)', marginTop: 1 },

    // Dashboard link
    dashCard:      { marginHorizontal: 20, marginBottom: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
    dashIconBox:   { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    dashText:      { flex: 1 },
    dashTitle:     { fontSize: 13, fontWeight: '600', color: C.text },
    dashSub:       { fontSize: 11, color: C.textMuted },

    // Mode grid — 2-up compact
    grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
    modeCard:      { width: '48.5%', borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
    modeIconBox:   { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    modeLabel:     { fontSize: 12, fontWeight: '600', color: C.text },
    modeSub:       { fontSize: 10, color: C.textMuted },

    // Feature list
    featureCard:   { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    featRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    featRowLast:   { borderBottomWidth: 0 },
    featIconBox:   { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
    featTitle:     { fontSize: 13, fontWeight: '600', color: C.text },
    featSub:       { fontSize: 12, color: C.textMuted, marginTop: 3, lineHeight: 18 },

    // Benchmarks
    benchCard:     { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    benchRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    benchRowLast:  { borderBottomWidth: 0 },
    benchIcon:     { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    benchLabel:    { flex: 1, fontSize: 12, color: C.textSec },
    benchValue:    { fontSize: 12, fontWeight: '700', color: C.text },

    // Filler word chips
    fillerWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, marginBottom: 20 },
    fillerChip:    { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
    fillerTxt:     { fontSize: 12, color: C.textSec },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        {...(Platform.OS === 'web' ? ({ style: { height: '100%', overflowY: 'auto' } } as any) : {})}
      >
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Speech</Text>
            <Text style={s.headerSub}>AI-powered voice coaching</Text>
          </View>
          <TouchableOpacity style={s.histBtn} onPress={() => navigation.navigate('SpeechHistory')} activeOpacity={0.75}>
            <Ionicons name="time-outline" size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* Record CTA */}
        <Text style={s.sectionLabel}>Record</Text>
        <TouchableOpacity style={s.recordCard} onPress={() => navigation.navigate('Record', { mode: 'Free Speech' })} activeOpacity={0.85}>
          <View style={s.recordIconBox}>
            <Ionicons name="mic" size={20} color="#fff" />
          </View>
          <View style={s.recordText}>
            <Text style={s.recordTitle}>Start Recording</Text>
            <Text style={s.recordSub}>Analyse your speech with AI</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Dashboard link */}
        <TouchableOpacity style={s.dashCard} onPress={() => navigation.navigate('SpeechDashboard')} activeOpacity={0.75}>
          <View style={s.dashIconBox}>
            <Ionicons name="bar-chart-outline" size={16} color={C.primary} />
          </View>
          <View style={s.dashText}>
            <Text style={s.dashTitle}>Speech Analysis Dashboard</Text>
            <Text style={s.dashSub}>Scores, filler words, pace, session history</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </TouchableOpacity>

        {/* Mode picker */}
        <Text style={s.sectionLabel}>Choose Mode</Text>
        <View style={s.grid}>
          {MODES.map((mode, i) => (
            <TouchableOpacity key={i} style={s.modeCard} onPress={() => navigation.navigate('Record', { mode: mode.id })} activeOpacity={0.75}>
              <View style={[s.modeIconBox, { backgroundColor: mode.color + '18' }]}>
                <Ionicons name={mode.icon as any} size={16} color={mode.color} />
              </View>
              <View>
                <Text style={s.modeLabel}>{mode.id}</Text>
                <Text style={s.modeSub}>Tap to start</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* What we analyse */}
        <Text style={s.sectionLabel}>What We Analyse</Text>
        <View style={s.featureCard}>
          {FEATURES.map((feat, i) => (
            <View key={i} style={[s.featRow, i === FEATURES.length - 1 && s.featRowLast]}>
              <View style={[s.featIconBox, { backgroundColor: feat.color + '18' }]}>
                <Ionicons name={feat.icon as any} size={18} color={feat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featTitle}>{feat.title}</Text>
                <Text style={s.featSub}>{feat.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benchmarks */}
        <Text style={s.sectionLabel}>Speaking Benchmarks</Text>
        <View style={s.benchCard}>
          {BENCHMARKS.map((b, i) => (
            <View key={i} style={[s.benchRow, i === BENCHMARKS.length - 1 && s.benchRowLast]}>
              <View style={[s.benchIcon, { backgroundColor: b.color + '14' }]}>
                <Ionicons name={b.icon as any} size={14} color={b.color} />
              </View>
              <Text style={s.benchLabel}>{b.label}</Text>
              <Text style={s.benchValue}>{b.value}</Text>
            </View>
          ))}
        </View>

        {/* Filler word reference */}
        <Text style={s.sectionLabel}>Watch Out For</Text>
        <View style={s.fillerWrap}>
          {['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'i mean', 'sort of', 'right?'].map((w, i) => (
            <View key={i} style={s.fillerChip}>
              <Text style={s.fillerTxt}>"{w}"</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
