import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FillerWordEntry } from '../../lib/openai';
import { useTheme } from '../../theme/ThemeContext';

const { width: W } = Dimensions.get('window');

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const s2 = (s % 60).toString().padStart(2, '0');
  return `${m}:${s2}`;
}
function scoreColor(s: number) {
  return s >= 80 ? '#10B981' : s >= 60 ? '#A78BFA' : s >= 40 ? '#F59E0B' : '#F43F5E';
}
function scoreLabel(s: number) {
  return s >= 85 ? 'Excellent' : s >= 75 ? 'Great' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────
function StepIndicator({ step, total, C }: { step: number; total: number; C: any }) {
  const s = StyleSheet.create({
    wrap:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
    dot:   { width: 6, height: 6, borderRadius: 3 },
    txt:   { fontSize: 11, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  });
  return (
    <View style={s.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, { backgroundColor: i === step ? C.primary : C.border }]} />
      ))}
      <Text style={[s.txt, { marginLeft: 6 }]}>{step + 1} of {total}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav buttons (Prev / Next / Done)
// ─────────────────────────────────────────────────────────────────────────────
function NavButtons({
  step, total, onPrev, onNext, onDone, onRetry, mode, C,
}: {
  step: number; total: number;
  onPrev: () => void; onNext: () => void;
  onDone: () => void; onRetry: () => void;
  mode: string; C: any;
}) {
  const isFirst = step === 0;
  const isLast  = step === total - 1;
  const s = StyleSheet.create({
    row:       { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 },
    prevBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14 },
    prevTxt:   { fontSize: 14, fontWeight: '600', color: C.textSec },
    nextBtn:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14 },
    nextTxt:   { fontSize: 14, fontWeight: '700', color: '#fff' },
    retryBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14 },
    retryTxt:  { fontSize: 13, fontWeight: '600', color: C.textSec },
  });
  return (
    <View style={s.row}>
      {!isFirst && (
        <TouchableOpacity style={s.prevBtn} onPress={onPrev} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={16} color={C.textSec} />
          <Text style={s.prevTxt}>Previous</Text>
        </TouchableOpacity>
      )}
      {isFirst && (
        <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={C.textSec} />
          <Text style={s.retryTxt}>Retry</Text>
        </TouchableOpacity>
      )}
      {isLast ? (
        <TouchableOpacity style={s.nextBtn} onPress={onDone} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={16} color="#fff" />
          <Text style={s.nextTxt}>Done</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.nextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={s.nextTxt}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 9;
const STEP_TITLES = [
  'Your Transcript',
  'Filler Word Breakdown',
  'Score Breakdown',
  'Feedback',
  'Content Suggestions',
  'Suggested Rephrasings',
  'Improvement Tips',
  'Structure Feedback',
  '7-Day Plan',
];

export default function AnalysisResultScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();
  const {
    score = 0, duration = 0, fillerCount = 0, fillerBreakdown = {},
    mode = 'Free Speech', wpm = 0, transcript = '',
    details = { clarity: 0, pace: 0, pronunciation: 0, confidence: 0 },
    aiAnalysis = null,
    persistError = '',
  } = route?.params ?? {};

  const [step, setStep]             = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const color     = scoreColor(score);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    let current = 0;
    const iv = setInterval(() => {
      current += Math.ceil(score / 30);
      if (current >= score) { current = score; clearInterval(iv); }
      setDisplayScore(current);
    }, 40);
    return () => clearInterval(iv);
  }, []);

  // Scroll to top and fade in whenever step changes
  const goToStep = useCallback((next: number) => {
    fadeAnim.setValue(0);
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const onNext  = () => step < TOTAL_STEPS - 1 && goToStep(step + 1);
  const onPrev  = () => step > 0 && goToStep(step - 1);
  const onDone  = () => navigation.navigate('SpeechHome');
  const onRetry = () => navigation.navigate('Record', { mode });
  const doShare = async () => {
    try { await Share.share({ message: `I scored ${score}/100 on Voxira! Mode: ${mode} | ${formatTime(duration)}` }); } catch {}
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 4 },
    iconBtn:     { width: 40, height: 40, borderRadius: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    stepTitle:   { fontSize: 16, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center' },
    scroll:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

    // Score summary (shown on every step)
    summaryBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16, gap: 14 },
    scoreCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    scoreNum:    { fontSize: 20, fontWeight: '800' },
    scoreMax:    { fontSize: 9, color: C.textMuted, marginTop: -2 },
    summaryMeta: { flex: 1 },
    summaryMode: { fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    summaryLbl:  { fontSize: 15, fontWeight: '700' },
    summaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    summaryTxt:  { fontSize: 11, color: C.textSec },

    // Warn banner
    warnBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.warning + '18', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.warning + '44' },
    warnTxt:     { flex: 1, fontSize: 12, color: C.warning, lineHeight: 18 },

    // Transcript
    transcriptCard:   { backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E8DDD0' },
    transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    transcriptTitle:  { fontSize: 14, fontWeight: '700', color: '#78350F' },
    transcriptText:   { fontSize: 14, color: C.textSec, lineHeight: 22, marginBottom: 8 },
    transcriptMeta:   { fontSize: 12, color: C.textMuted },

    // Filler chips
    fillerCard:  { borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F0E0BE', backgroundColor: '#FFFBEB' },
    fillerTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
    fillerGrid:  { gap: 10, marginBottom: 12 },
    fillerChip:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, paddingLeft: 14, paddingRight: 8, paddingVertical: 10, gap: 10, borderWidth: 1, borderColor: '#E8C880' },
    fillerWord:  { fontSize: 16, fontWeight: '700', color: '#92400E', flex: 1 },
    fillerBadge: { backgroundColor: '#92400E', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    fillerCount: { fontSize: 13, fontWeight: '700', color: '#fff' },
    fillerNote:  { fontSize: 13, color: C.textSec, lineHeight: 20 },
    noFillerWrap:{ alignItems: 'center', padding: 24, gap: 8 },
    noFillerTxt: { fontSize: 14, color: C.success, fontWeight: '600' },
    noFillerSub: { fontSize: 12, color: C.textMuted, textAlign: 'center' },

    // Metrics
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    metricCard:  { width: (W - 50) / 2, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 6 },
    metricIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    metricLabel: { fontSize: 12, color: C.textSec },
    metricVal:   { fontSize: 24, fontWeight: '800' },
    metricBarBg: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
    metricBarFill: { height: '100%' as any, borderRadius: 2 },

    // Feedback
    feedbackCard:   { borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3 },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    feedbackTitle:  { fontSize: 15, fontWeight: '700' },
    feedbackText:   { fontSize: 14, color: C.textSec, lineHeight: 22 },

    // Content suggestions
    contentSugCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8DDD0' },
    contentSugIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8DDD0', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    contentSugText: { flex: 1, fontSize: 15, color: C.textSec, lineHeight: 23 },

    // Alt / Tip cards
    altCard:     { backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8DDD0' },
    altNum:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#92400E', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    altNumTxt:   { fontSize: 12, fontWeight: '800', color: '#fff' },
    altText:     { fontSize: 15, color: C.textSec, lineHeight: 23 },
    tipCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8DDD0' },
    tipNum:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#92400E', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    tipNumTxt:   { fontSize: 12, fontWeight: '800', color: '#fff' },
    tipText:     { flex: 1, fontSize: 15, color: C.textSec, lineHeight: 23 },

    // Structure
    structureCard:  { backgroundColor: C.success + '14', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: C.success + '33' },
    structureTitle: { fontSize: 15, fontWeight: '700', color: C.success, marginBottom: 8 },
    structureText:  { fontSize: 15, color: C.textSec, lineHeight: 23 },

    // Plan
    planCard:     { backgroundColor: '#F5EFE6', borderRadius: 14, padding: 18, marginBottom: 8, borderWidth: 1, borderColor: '#E8DDD0' },
    planTitle:    { fontSize: 16, fontWeight: '700', color: '#78350F', marginBottom: 14 },
    planRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    planDayBadge: { backgroundColor: '#92400E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, minWidth: 62, alignItems: 'center' },
    planDay:      { fontSize: 11, fontWeight: '700', color: '#fff' },
    planTask:     { flex: 1, fontSize: 14, color: C.textSec, lineHeight: 21 },

    // Empty step
    emptyStep:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyStepTxt: { fontSize: 14, color: C.textMuted, textAlign: 'center' },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  });

  // ── Derived data (computed once, used across steps) ──────────────────────
  const METRICS = [
    { label: 'Clarity',       value: details.clarity,       icon: 'eye-outline',         color: '#A78BFA' },
    { label: 'Pace',          value: details.pace,          icon: 'speedometer-outline',  color: '#06B6D4' },
    { label: 'Pronunciation', value: details.pronunciation, icon: 'volume-high-outline',  color: '#10B981' },
    { label: 'Confidence',    value: details.confidence,    icon: 'trending-up-outline',  color: '#F59E0B' },
  ];

  const generateFeedback = () => {
    const tips: { type: string; icon: string; color: string; title: string; text: string }[] = [];
    if (fillerCount === 0) {
      tips.push({ type: 'pos', icon: 'checkmark-circle', color: '#10B981', title: 'Zero Filler Words', text: 'Exceptional delivery — you spoke your entire session without a single filler word. This level of control puts you in the top 5% of speakers. Filler-free speech signals preparation, confidence, and respect for your audience\'s time.' });
    } else if (fillerCount <= 3) {
      tips.push({ type: 'pos', icon: 'checkmark-circle', color: '#10B981', title: 'Excellent Filler Control', text: `Only ${fillerCount} filler word${fillerCount > 1 ? 's' : ''} — well within the professional range. Research shows that listeners start to lose trust after about 5 fillers per minute, so you are comfortably clear of that threshold.` });
    } else if (fillerCount <= 7) {
      const topFiller = Object.entries(fillerBreakdown as Record<string, number>).sort((a, b) => b[1] - a[1])[0];
      tips.push({ type: 'warn', icon: 'warning', color: '#F59E0B', title: `${fillerCount} Filler Words Detected`, text: `Your most-used filler was "${topFiller?.[0] ?? 'um'}" (${topFiller?.[1] ?? 3}×). Try the pause technique: whenever you feel a filler coming, close your mouth and breathe for one second, then continue.` });
    } else {
      const top3 = Object.entries(fillerBreakdown as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, c]) => `"${w}" (${c}×)`).join(', ');
      tips.push({ type: 'neg', icon: 'close-circle', color: '#F43F5E', title: `${fillerCount} Filler Words — Focus Area`, text: `Top fillers: ${top3}. Record two minutes of speech daily, count every filler, and aim to halve the count each attempt. Most speakers cut their rate by 60–70% within two weeks.` });
    }
    if (wpm >= 110 && wpm <= 150) tips.push({ type: 'pos', icon: 'speedometer', color: '#8B5CF6', title: `Strong Pace: ${wpm} WPM`, text: `${wpm} WPM sits in the ideal 110–150 WPM range. Listeners can process each idea before the next arrives, improving comprehension and retention.` });
    else if (wpm > 150) tips.push({ type: 'warn', icon: 'speedometer', color: '#F59E0B', title: `Speaking Too Fast: ${wpm} WPM`, text: `${wpm} WPM is above comfortable processing for most audiences. Try deliberate 2-second pauses after every major point.` });
    else if (wpm > 0) tips.push({ type: 'warn', icon: 'speedometer', color: '#F59E0B', title: `Speaking Too Slow: ${wpm} WPM`, text: `${wpm} WPM is below natural engaging range. Aim for 120–140 WPM. Reading aloud daily builds pace muscle memory.` });
    if (details.clarity >= 85) tips.push({ type: 'pos', icon: 'mic', color: '#10B981', title: 'Clear Articulation', text: `Clarity ${details.clarity}/100 — your words were consistently well-formed and easy to follow.` });
    else if (details.clarity >= 65) tips.push({ type: 'warn', icon: 'mic', color: '#F59E0B', title: 'Articulation Needs Attention', text: `Clarity ${details.clarity}/100 — some words were blurred. Open your jaw more and exaggerate enunciation on tongue twisters for 5 minutes daily.` });
    else tips.push({ type: 'neg', icon: 'mic', color: '#F43F5E', title: 'Articulation Needs Significant Work', text: `Clarity ${details.clarity}/100 — a meaningful portion was difficult to follow. Focus on slow, deliberate speech before increasing speed.` });
    if (details.confidence >= 80) tips.push({ type: 'pos', icon: 'trending-up', color: '#8B5CF6', title: 'Strong Confidence', text: `Confidence ${details.confidence}/100 — your delivery sounded assured, with steady volume and deliberate pauses.` });
    else if (details.confidence >= 60) tips.push({ type: 'warn', icon: 'trending-up', color: '#F59E0B', title: 'Build Vocal Confidence', text: `Confidence ${details.confidence}/100 — moments of hesitation or dropping volume. Record yourself and re-record sentences with a flat, declarative ending.` });
    else tips.push({ type: 'neg', icon: 'trending-up', color: '#F43F5E', title: 'Confidence Needs Development', text: `Confidence ${details.confidence}/100 — frequent upward inflections and hesitation gaps. Try a 2-minute power pose before speaking and memorise your opening three sentences.` });
    const proTips = [
      'Record yourself for two minutes every day. Fix one specific thing per attempt — not five.',
      'Join Toastmasters. Regular practice with peer feedback accelerates improvement faster than solo practice.',
      'Read aloud for ten minutes daily. This trains mouth-to-brain coordination automatically.',
      'Hum for 30 seconds before any session to warm up your vocal cords.',
      'Breathe from your diaphragm — hand on stomach, it should move outward on inhale.',
    ];
    tips.push({ type: 'tip', icon: 'bulb', color: '#A78BFA', title: 'Practice Tip', text: proTips[Math.floor(Math.random() * proTips.length)] });
    return tips;
  };
  const feedback = generateFeedback();

  // Build merged filler breakdown (LLM + AssemblyAI)
  const mergedFillers: Record<string, number> = { ...(fillerBreakdown as Record<string, number>) };
  if (aiAnalysis && Array.isArray(aiAnalysis.fillerWordAnalysis)) {
    for (const e of aiAnalysis.fillerWordAnalysis as FillerWordEntry[]) {
      if (e.word && e.count > 0) {
        mergedFillers[e.word.toLowerCase()] = Math.max(mergedFillers[e.word.toLowerCase()] ?? 0, e.count);
      }
    }
  }
  const fillerEntries = Object.entries(mergedFillers).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);

  // ── Compact score summary bar (shown on every step) ───────────────────────
  const ScoreSummary = (
    <View style={s.summaryBar}>
      <View style={[s.scoreCircle, { borderColor: `${color}50` }]}>
        <Text style={[s.scoreNum, { color }]}>{displayScore}</Text>
        <Text style={s.scoreMax}>/100</Text>
      </View>
      <View style={s.summaryMeta}>
        <Text style={s.summaryMode}>{mode}</Text>
        <Text style={[s.summaryLbl, { color }]}>{scoreLabel(score)}</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}><Ionicons name="time-outline" size={12} color={C.textMuted} /><Text style={s.summaryTxt}>{formatTime(duration)}</Text></View>
          {wpm > 0 && <><Text style={[s.summaryTxt, { color: C.border }]}>·</Text><Text style={s.summaryTxt}>{wpm} WPM</Text></>}
          {fillerCount > 0 && <><Text style={[s.summaryTxt, { color: C.border }]}>·</Text><Text style={s.summaryTxt}>{fillerCount} fillers</Text></>}
        </View>
      </View>
      <TouchableOpacity onPress={doShare}>
        <Ionicons name="share-outline" size={20} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  );

  // ── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── 0: Transcript ────────────────────────────────────────────────────
      case 0:
        return (
          <>
            {ScoreSummary}
            {!!persistError && (
              <View style={s.warnBanner}>
                <Ionicons name="warning-outline" size={16} color={C.warning} />
                <Text style={s.warnTxt}>Result shown but not saved — {persistError}</Text>
              </View>
            )}
            {transcript && transcript.length > 10 ? (
              <View style={s.transcriptCard}>
                <View style={s.transcriptHeader}>
                  <Ionicons name="document-text-outline" size={16} color="#78350F" />
                  <Text style={s.transcriptTitle}>Your Transcript</Text>
                </View>
                <Text style={s.transcriptText}>{transcript}</Text>
                <Text style={s.transcriptMeta}>
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words · {formatTime(duration)}{wpm > 0 ? ` · ${wpm} WPM` : ''}
                </Text>
              </View>
            ) : (
              <View style={s.emptyStep}>
                <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
                <Text style={s.emptyStepTxt}>No transcript captured for this session.</Text>
              </View>
            )}
          </>
        );

      // ── 1: Filler Word Breakdown ─────────────────────────────────────────
      case 1:
        return (
          <>
            {ScoreSummary}
            {fillerEntries.length > 0 ? (
              <View style={s.fillerCard}>
                <Text style={s.fillerTitle}>Filler Word Breakdown</Text>
                <View style={s.fillerGrid}>
                  {fillerEntries.map(([word, count]) => (
                    <View key={word} style={s.fillerChip}>
                      <Text style={s.fillerWord}>"{word}"</Text>
                      <View style={s.fillerBadge}><Text style={s.fillerCount}>{count}×</Text></View>
                    </View>
                  ))}
                </View>
                <Text style={s.fillerNote}>
                  These were found by scanning your actual transcript. Replacing each filler with a deliberate 1-second pause can improve your score by up to 2 points per occurrence.
                </Text>
              </View>
            ) : (
              <View style={[s.fillerCard, { alignItems: 'center' }]}>
                <View style={s.noFillerWrap}>
                  <Ionicons name="checkmark-circle" size={40} color={C.success} />
                  <Text style={s.noFillerTxt}>No filler words detected!</Text>
                  <Text style={s.noFillerSub}>You spoke without any detectable filler words. This is a top-5% result.</Text>
                </View>
              </View>
            )}
          </>
        );

      // ── 2: Score Breakdown ───────────────────────────────────────────────
      case 2:
        return (
          <>
            {ScoreSummary}
            <Text style={s.sectionTitle}>Score Breakdown</Text>
            <View style={s.metricsGrid}>
              {METRICS.map((m, i) => (
                <View key={i} style={s.metricCard}>
                  <View style={[s.metricIcon, { backgroundColor: `${m.color}18` }]}>
                    <Ionicons name={m.icon as any} size={18} color={m.color} />
                  </View>
                  <Text style={s.metricLabel}>{m.label}</Text>
                  <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                  <View style={s.metricBarBg}>
                    <View style={[s.metricBarFill, { width: `${m.value}%` as any, backgroundColor: m.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </>
        );

      // ── 3: Feedback ──────────────────────────────────────────────────────
      case 3:
        return (
          <>
            {ScoreSummary}
            <Text style={s.sectionTitle}>Feedback</Text>
            {feedback.map((fb, i) => (
              <View key={i} style={[s.feedbackCard, { borderLeftColor: fb.color, backgroundColor: `${fb.color}12` }]}>
                <View style={s.feedbackHeader}>
                  <Ionicons name={fb.icon as any} size={18} color={fb.color} />
                  <Text style={[s.feedbackTitle, { color: fb.color }]}>{fb.title}</Text>
                </View>
                <Text style={s.feedbackText}>{fb.text}</Text>
              </View>
            ))}
          </>
        );

      // ── 4: Content Suggestions ───────────────────────────────────────────
      case 4:
        return (
          <>
            {ScoreSummary}
            {aiAnalysis && Array.isArray(aiAnalysis.contentSuggestions) && aiAnalysis.contentSuggestions.length > 0 ? (
              <>
                <Text style={s.sectionTitle}>Content-Specific Suggestions</Text>
                {(aiAnalysis.contentSuggestions as string[]).map((s_: string, i: number) => (
                  <View key={i} style={s.contentSugCard}>
                    <View style={s.contentSugIcon}>
                      <Ionicons name="arrow-forward-outline" size={16} color="#92400E" />
                    </View>
                    <Text style={s.contentSugText}>{s_}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={s.emptyStep}>
                <Ionicons name="bulb-outline" size={40} color={C.textMuted} />
                <Text style={s.emptyStepTxt}>No content-specific suggestions available for this session.</Text>
              </View>
            )}
          </>
        );

      // ── 5: Suggested Rephrasings ─────────────────────────────────────────
      case 5:
        return (
          <>
            {ScoreSummary}
            {aiAnalysis?.alternateAnswers?.length > 0 ? (
              <>
                <Text style={s.sectionTitle}>Suggested Rephrasings</Text>
                {(aiAnalysis.alternateAnswers as string[]).map((alt: string, i: number) => (
                  <View key={i} style={s.altCard}>
                    <View style={s.altNum}><Text style={s.altNumTxt}>{i + 1}</Text></View>
                    <Text style={s.altText}>{alt}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={s.emptyStep}>
                <Ionicons name="chatbubbles-outline" size={40} color={C.textMuted} />
                <Text style={s.emptyStepTxt}>No rephrasing suggestions available for this session.</Text>
              </View>
            )}
          </>
        );

      // ── 6: Improvement Tips ──────────────────────────────────────────────
      case 6:
        return (
          <>
            {ScoreSummary}
            {aiAnalysis?.improvementTips?.length > 0 ? (
              <>
                <Text style={s.sectionTitle}>Improvement Tips</Text>
                {(aiAnalysis.improvementTips as string[]).map((tip: string, i: number) => (
                  <View key={i} style={s.tipCard}>
                    <View style={s.tipNum}><Text style={s.tipNumTxt}>{i + 1}</Text></View>
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={s.emptyStep}>
                <Ionicons name="trending-up-outline" size={40} color={C.textMuted} />
                <Text style={s.emptyStepTxt}>No improvement tips available for this session.</Text>
              </View>
            )}
          </>
        );

      // ── 7: Structure Feedback ────────────────────────────────────────────
      case 7:
        return (
          <>
            {ScoreSummary}
            {aiAnalysis?.structureFeedback ? (
              <View style={s.structureCard}>
                <Ionicons name="git-branch-outline" size={16} color={C.success} style={{ marginBottom: 6 }} />
                <Text style={s.structureTitle}>Structure Feedback</Text>
                <Text style={s.structureText}>{aiAnalysis.structureFeedback}</Text>
              </View>
            ) : (
              <View style={s.emptyStep}>
                <Ionicons name="git-branch-outline" size={40} color={C.textMuted} />
                <Text style={s.emptyStepTxt}>No structure feedback available for this session.</Text>
              </View>
            )}
          </>
        );

      // ── 8: 7-Day Plan ────────────────────────────────────────────────────
      case 8:
        return (
          <>
            {ScoreSummary}
            <View style={s.planCard}>
              <Text style={s.planTitle}>Your 7-Day Improvement Plan</Text>
              {[
                { day: 'Day 1–2', task: 'Record 2-minute speeches daily. Count your filler words each time and note your WPM.' },
                { day: 'Day 3–4', task: 'Practice the PAUSE technique. Every time you feel a filler coming, pause for 1 second instead.' },
                { day: 'Day 5–6', task: 'Read aloud for 10 minutes. Focus on clear enunciation of every syllable and consonant.' },
                { day: 'Day 7',   task: 'Record a 3-minute speech on any topic and compare it with your Day 1 recording.' },
              ].map((item, i) => (
                <View key={i} style={s.planRow}>
                  <View style={s.planDayBadge}><Text style={s.planDay}>{item.day}</Text></View>
                  <Text style={s.planTask}>{item.task}</Text>
                </View>
              ))}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Fixed header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('SpeechHome')}>
          <Ionicons name="home-outline" size={20} color={C.textSec} />
        </TouchableOpacity>
        <Text style={s.stepTitle}>{STEP_TITLES[step]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <StepIndicator step={step} total={TOTAL_STEPS} C={C} />

      <Animated.ScrollView
        ref={scrollRef}
        style={[{ opacity: fadeAnim }, Platform.OS === 'web' && ({ height: '100%', overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}

        <NavButtons
          step={step}
          total={TOTAL_STEPS}
          onPrev={onPrev}
          onNext={onNext}
          onDone={onDone}
          onRetry={onRetry}
          mode={mode}
          C={C}
        />

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}
