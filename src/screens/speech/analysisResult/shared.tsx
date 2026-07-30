/**
 * Shared utilities, types, and components for the 9-screen Analysis Result flow.
 * All data is passed via route.params from TranscriptResultScreen onward using
 * navigation.navigate() so the stack never grows beyond one new screen per tap.
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FillerWordEntry } from '../../../lib/openai';

export const W = Dimensions.get('window').width;
export const TOTAL_STEPS = 9;

export const STEP_TITLES = [
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

// Route names in order — used by every screen to navigate forward/back
export const STEP_ROUTES = [
  'TranscriptResult',
  'FillerWordBreakdown',
  'ScoreBreakdown',
  'FeedbackResult',
  'ContentSuggestions',
  'SuggestedRephrasings',
  'ImprovementTips',
  'StructureFeedback',
  'SevenDayPlan',
] as const;

export type StepRoute = (typeof STEP_ROUTES)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const s2 = (s % 60).toString().padStart(2, '0');
  return `${m}:${s2}`;
}
export function scoreColor(s: number) {
  return s >= 80 ? '#10B981' : s >= 60 ? '#A78BFA' : s >= 40 ? '#F59E0B' : '#F43F5E';
}
export function scoreLabel(s: number) {
  return s >= 85 ? 'Excellent' : s >= 75 ? 'Great' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';
}

// ── Derived data helpers ──────────────────────────────────────────────────────

export function buildMergedFillers(
  fillerBreakdown: Record<string, number>,
  aiAnalysis: any,
): [string, number][] {
  const merged: Record<string, number> = { ...fillerBreakdown };
  if (aiAnalysis && Array.isArray(aiAnalysis.fillerWordAnalysis)) {
    for (const e of aiAnalysis.fillerWordAnalysis as FillerWordEntry[]) {
      if (e.word && e.count > 0) {
        merged[e.word.toLowerCase()] = Math.max(merged[e.word.toLowerCase()] ?? 0, e.count);
      }
    }
  }
  return Object.entries(merged).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
}

export function generateFeedback(
  fillerCount: number,
  fillerBreakdown: Record<string, number>,
  wpm: number,
  details: { clarity: number; pace: number; pronunciation: number; confidence: number },
) {
  const tips: { type: string; icon: string; color: string; title: string; text: string }[] = [];

  if (fillerCount === 0) {
    tips.push({ type: 'pos', icon: 'checkmark-circle', color: '#10B981', title: 'Zero Filler Words', text: "Exceptional delivery — you spoke your entire session without a single filler word. This level of control puts you in the top 5% of speakers. Filler-free speech signals preparation, confidence, and respect for your audience's time." });
  } else if (fillerCount <= 3) {
    tips.push({ type: 'pos', icon: 'checkmark-circle', color: '#10B981', title: 'Excellent Filler Control', text: `Only ${fillerCount} filler word${fillerCount > 1 ? 's' : ''} — well within the professional range. Research shows that listeners start to lose trust after about 5 fillers per minute, so you are comfortably clear of that threshold.` });
  } else if (fillerCount <= 7) {
    const topFiller = Object.entries(fillerBreakdown).sort((a, b) => b[1] - a[1])[0];
    tips.push({ type: 'warn', icon: 'warning', color: '#F59E0B', title: `${fillerCount} Filler Words Detected`, text: `Your most-used filler was "${topFiller?.[0] ?? 'um'}" (${topFiller?.[1] ?? 3}×). Try the pause technique: whenever you feel a filler coming, close your mouth and breathe for one second, then continue.` });
  } else {
    const top3 = Object.entries(fillerBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, c]) => `"${w}" (${c}×)`).join(', ');
    tips.push({ type: 'neg', icon: 'close-circle', color: '#F43F5E', title: `${fillerCount} Filler Words — Focus Area`, text: `Top fillers: ${top3}. Record two minutes of speech daily, count every filler, and aim to halve the count each attempt.` });
  }

  if (wpm >= 110 && wpm <= 150) tips.push({ type: 'pos', icon: 'speedometer', color: '#8B5CF6', title: `Strong Pace: ${wpm} WPM`, text: `${wpm} WPM sits in the ideal 110–150 WPM range. Listeners can process each idea before the next arrives.` });
  else if (wpm > 150) tips.push({ type: 'warn', icon: 'speedometer', color: '#F59E0B', title: `Speaking Too Fast: ${wpm} WPM`, text: `${wpm} WPM is above comfortable processing for most audiences. Try deliberate 2-second pauses after every major point.` });
  else if (wpm > 0) tips.push({ type: 'warn', icon: 'speedometer', color: '#F59E0B', title: `Speaking Too Slow: ${wpm} WPM`, text: `${wpm} WPM is below natural engaging range. Aim for 120–140 WPM.` });

  if (details.clarity >= 85) tips.push({ type: 'pos', icon: 'mic', color: '#10B981', title: 'Clear Articulation', text: `Clarity ${details.clarity}/100 — your words were consistently well-formed and easy to follow.` });
  else if (details.clarity >= 65) tips.push({ type: 'warn', icon: 'mic', color: '#F59E0B', title: 'Articulation Needs Attention', text: `Clarity ${details.clarity}/100 — some words were blurred. Open your jaw more and exaggerate enunciation on tongue twisters for 5 minutes daily.` });
  else tips.push({ type: 'neg', icon: 'mic', color: '#F43F5E', title: 'Articulation Needs Significant Work', text: `Clarity ${details.clarity}/100 — a meaningful portion was difficult to follow. Focus on slow, deliberate speech before increasing speed.` });

  if (details.confidence >= 80) tips.push({ type: 'pos', icon: 'trending-up', color: '#8B5CF6', title: 'Strong Confidence', text: `Confidence ${details.confidence}/100 — your delivery sounded assured, with steady volume and deliberate pauses.` });
  else if (details.confidence >= 60) tips.push({ type: 'warn', icon: 'trending-up', color: '#F59E0B', title: 'Build Vocal Confidence', text: `Confidence ${details.confidence}/100 — moments of hesitation or dropping volume. Re-record sentences with a flat, declarative ending.` });
  else tips.push({ type: 'neg', icon: 'trending-up', color: '#F43F5E', title: 'Confidence Needs Development', text: `Confidence ${details.confidence}/100 — frequent upward inflections and hesitation gaps. Try a 2-minute power pose before speaking.` });

  const proTips = [
    'Record yourself for two minutes every day. Fix one specific thing per attempt.',
    'Join Toastmasters. Regular practice with peer feedback accelerates improvement faster than solo practice.',
    'Read aloud for ten minutes daily. This trains mouth-to-brain coordination automatically.',
    'Hum for 30 seconds before any session to warm up your vocal cords.',
    'Breathe from your diaphragm — hand on stomach, it should move outward on inhale.',
  ];
  tips.push({ type: 'tip', icon: 'bulb', color: '#A78BFA', title: 'Practice Tip', text: proTips[Math.floor(Math.random() * proTips.length)] });
  return tips;
}

// ── Shared styles factory (call inside each screen with useTheme colors) ──────

export function makeSharedStyles(C: any) {
  return StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 36, paddingBottom: 4 },
    iconBtn:     { width: 40, height: 40, borderRadius: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    stepTitle:   { fontSize: 16, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center' },
    scroll:      { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
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
    warnBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.warning + '18', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.warning + '44' },
    warnTxt:     { flex: 1, fontSize: 12, color: C.warning, lineHeight: 18 },
    transcriptCard:   { backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E8DDD0' },
    transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    transcriptTitle:  { fontSize: 14, fontWeight: '700', color: '#78350F' },
    transcriptText:   { fontSize: 14, color: C.textSec, lineHeight: 22, marginBottom: 8 },
    transcriptMeta:   { fontSize: 12, color: C.textMuted },
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
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    metricCard:  { width: (W - 50) / 2, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 6 },
    metricIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    metricLabel: { fontSize: 12, color: C.textSec },
    metricVal:   { fontSize: 24, fontWeight: '800' },
    metricBarBg: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
    metricBarFill: { height: '100%' as any, borderRadius: 2 },
    feedbackCard:   { borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3 },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    feedbackTitle:  { fontSize: 15, fontWeight: '700' },
    feedbackText:   { fontSize: 14, color: C.textSec, lineHeight: 22 },
    contentSugCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8DDD0' },
    contentSugIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8DDD0', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    contentSugText: { flex: 1, fontSize: 15, color: C.textSec, lineHeight: 23 },
    altCard:     { backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8DDD0' },
    altNum:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#92400E', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    altNumTxt:   { fontSize: 12, fontWeight: '800', color: '#fff' },
    altText:     { fontSize: 15, color: C.textSec, lineHeight: 23 },
    tipCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5EFE6', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8DDD0' },
    tipNum:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#92400E', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    tipNumTxt:   { fontSize: 12, fontWeight: '800', color: '#fff' },
    tipText:     { flex: 1, fontSize: 15, color: C.textSec, lineHeight: 23 },
    structureCard:  { backgroundColor: C.success + '14', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: C.success + '33' },
    structureTitle: { fontSize: 15, fontWeight: '700', color: C.success, marginBottom: 8 },
    structureText:  { fontSize: 15, color: C.textSec, lineHeight: 23 },
    planCard:     { backgroundColor: '#F5EFE6', borderRadius: 14, padding: 18, marginBottom: 8, borderWidth: 1, borderColor: '#E8DDD0' },
    planTitle:    { fontSize: 16, fontWeight: '700', color: '#78350F', marginBottom: 14 },
    planRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    planDayBadge: { backgroundColor: '#92400E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, minWidth: 62, alignItems: 'center' },
    planDay:      { fontSize: 11, fontWeight: '700', color: '#fff' },
    planTask:     { flex: 1, fontSize: 14, color: C.textSec, lineHeight: 21 },
    emptyStep:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyStepTxt: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
    navRow:       { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 },
    prevBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14 },
    prevTxt:      { fontSize: 14, fontWeight: '600', color: C.textSec },
    nextBtn:      { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14 },
    nextTxt:      { fontSize: 14, fontWeight: '700', color: '#fff' },
    retryBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14 },
    retryTxt:     { fontSize: 13, fontWeight: '600', color: C.textSec },
  });
}

// ── StepIndicator ─────────────────────────────────────────────────────────────

export function StepIndicator({ stepIndex, C }: { stepIndex: number; C: any }) {
  const s = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
    dot:  { width: 6, height: 6, borderRadius: 3 },
    txt:  { fontSize: 11, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5, marginLeft: 6 },
  });
  return (
    <View style={s.wrap}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[s.dot, { backgroundColor: i === stepIndex ? C.primary : C.border }]} />
      ))}
      <Text style={s.txt}>{stepIndex + 1} of {TOTAL_STEPS}</Text>
    </View>
  );
}

// ── ScoreSummaryBar ───────────────────────────────────────────────────────────

export function ScoreSummaryBar({
  score, displayScore, mode, duration, wpm, fillerCount, C, s,
}: {
  score: number; displayScore: number; mode: string; duration: number;
  wpm: number; fillerCount: number; C: any; s: any;
}) {
  const color = scoreColor(score);
  const doShare = async () => {
    try { await Share.share({ message: `I scored ${score}/100 on Voxira! Mode: ${mode} | ${formatTime(duration)}` }); } catch {}
  };
  return (
    <View style={s.summaryBar}>
      <View style={[s.scoreCircle, { borderColor: `${color}50` }]}>
        <Text style={[s.scoreNum, { color }]}>{displayScore}</Text>
        <Text style={s.scoreMax}>/100</Text>
      </View>
      <View style={s.summaryMeta}>
        <Text style={s.summaryMode}>{mode}</Text>
        <Text style={[s.summaryLbl, { color }]}>{scoreLabel(score)}</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Ionicons name="time-outline" size={12} color={C.textMuted} />
            <Text style={s.summaryTxt}>{formatTime(duration)}</Text>
          </View>
          {wpm > 0 && <><Text style={[s.summaryTxt, { color: C.border }]}>·</Text><Text style={s.summaryTxt}>{wpm} WPM</Text></>}
          {fillerCount > 0 && <><Text style={[s.summaryTxt, { color: C.border }]}>·</Text><Text style={s.summaryTxt}>{fillerCount} fillers</Text></>}
        </View>
      </View>
      <TouchableOpacity onPress={doShare}>
        <Ionicons name="share-outline" size={20} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ── NavRow ────────────────────────────────────────────────────────────────────
// Use navigation.navigate() not push() so Previous doesn't stack screens.

export function NavRow({
  stepIndex, navigation, params, mode, s,
}: {
  stepIndex: number; navigation: any; params: any; mode: string; s: any;
}) {
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === TOTAL_STEPS - 1;

  const goNext = () =>
    navigation.navigate(STEP_ROUTES[stepIndex + 1], params);
  const goPrev = () =>
    navigation.navigate(STEP_ROUTES[stepIndex - 1], params);
  const onDone  = () => navigation.navigate('SpeechHome');
  const onRetry = () => navigation.navigate('Record', { mode });

  return (
    <View style={s.navRow}>
      {isFirst ? (
        <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={s.retryTxt?.color ?? '#666'} />
          <Text style={s.retryTxt}>Retry</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.prevBtn} onPress={goPrev} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={16} color={s.prevTxt?.color ?? '#666'} />
          <Text style={s.prevTxt}>Previous</Text>
        </TouchableOpacity>
      )}
      {isLast ? (
        <TouchableOpacity style={s.nextBtn} onPress={onDone} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={16} color="#fff" />
          <Text style={s.nextTxt}>Done</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={s.nextTxt}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
