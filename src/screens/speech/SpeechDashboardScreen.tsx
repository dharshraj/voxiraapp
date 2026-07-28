/**
 * SpeechDashboardScreen
 *
 * Dedicated analytics dashboard for speech sessions.
 * Shows composite score, sub-scores (clarity, pace, confidence, filler words),
 * WPM metric, and a full session history list.
 * All data sourced from Supabase via sessionStore — no hardcoded values.
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

function fmtDuration(secs: number) {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}
function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface MetricRowProps {
  icon: string; color: string; label: string;
  value: string | number | null; max?: number;
  subLabel?: string; C: any;
}
function MetricRow({ icon, color, label, value, max = 100, subLabel, C }: MetricRowProps) {
  const numVal = typeof value === 'number' ? value : null;
  const s = StyleSheet.create({
    row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    label:   { flex: 1 },
    labelTxt:{ fontSize: 13, color: C.textSec },
    subTxt:  { fontSize: 10, color: C.textMuted, marginTop: 1 },
    valWrap: { alignItems: 'flex-end' },
    valTxt:  { fontSize: 15, fontWeight: '700' },
    barBg:   { width: 56, height: 3, backgroundColor: C.border, borderRadius: 2, marginTop: 3 },
    barFill: { height: 3, borderRadius: 2 },
  });
  return (
    <View style={s.row}>
      <View style={[s.iconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <View style={s.label}>
        <Text style={s.labelTxt}>{label}</Text>
        {subLabel ? <Text style={s.subTxt}>{subLabel}</Text> : null}
      </View>
      <View style={s.valWrap}>
        <Text style={[s.valTxt, { color: value != null ? color : C.textMuted }]}>
          {value ?? '—'}
        </Text>
        {numVal != null && (
          <View style={s.barBg}>
            <View style={[s.barFill, { width: Math.min(56, (numVal / max) * 56), backgroundColor: color }]} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function SpeechDashboardScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loading      = useSessionStore(s => s.loading);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const fade         = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    if (userId) loadSessions(userId);
  }, [userId]);

  const speechSessions = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const count          = speechSessions.length;

  function avg(fn: (s: SpeechSession) => number) {
    return count > 0 ? Math.round(speechSessions.reduce((a, s) => a + fn(s), 0) / count) : null;
  }

  const avgScore      = avg(s => s.score);
  const avgClarity    = avg(s => s.clarity);
  const avgPace       = avg(s => s.pace);
  const avgConfidence = avg(s => s.confidence);
  const avgWpm        = avg(s => s.wpm);
  const totalFillers  = speechSessions.reduce((a, s) => a + s.filler_count, 0);
  const avgFillersPer = count > 0 ? (totalFillers / count).toFixed(1) : null;
  const bestScore     = count > 0 ? Math.max(...speechSessions.map(s => s.score)) : null;

  // Build filler breakdown across all sessions
  const allFillerBreakdown: Record<string, number> = {};
  for (const sess of speechSessions) {
    for (const [word, cnt] of Object.entries(sess.filler_breakdown ?? {})) {
      allFillerBreakdown[word] = (allFillerBreakdown[word] ?? 0) + cnt;
    }
  }
  const topFillers = Object.entries(allFillerBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: 80 },

    header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider:       { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },
    sectionLabel:  { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10 },

    // Composite score card
    scoreCard:     { marginHorizontal: 20, marginBottom: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
    scoreBig:      { width: 68, height: 68, borderRadius: 16, backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary + '40', alignItems: 'center', justifyContent: 'center' },
    scoreNum:      { fontSize: 28, fontWeight: '800', color: C.primary },
    scoreSlash:    { fontSize: 11, color: C.textMuted, marginTop: -2 },
    scoreMeta:     { flex: 1 },
    scoreTitleTxt: { fontSize: 15, fontWeight: '700', color: C.text },
    scoreSubTxt:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
    scoreBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
    scoreBadge:    { backgroundColor: C.primaryLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
    scoreBadgeTxt: { fontSize: 10, fontWeight: '600', color: C.primary },

    // Stat strip
    statStrip:     { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
    statCard:      { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 3 },
    statVal:       { fontSize: 16, fontWeight: '700', color: C.text },
    statLbl:       { fontSize: 10, color: C.textMuted },

    // Metrics card
    metricCard:    { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    metricDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

    // Filler chips
    fillerWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
    fillerChip:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 20, paddingLeft: 10, paddingRight: 6, paddingVertical: 5, gap: 6, borderWidth: 1, borderColor: C.border },
    fillerWord:    { fontSize: 12, fontWeight: '600', color: C.text },
    fillerBadge:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    fillerBadgeTxt:{ fontSize: 10, fontWeight: '700', color: '#fff' },

    // Session history
    sessionCard:   { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    sessionRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
    sessionRowLast:{ borderBottomWidth: 0 },
    sessionIconBox:{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    sessionMeta:   { flex: 1 },
    sessionMode:   { fontSize: 13, fontWeight: '600', color: C.text },
    sessionSub:    { fontSize: 11, color: C.textMuted, marginTop: 1 },
    sessionScore:  { fontSize: 15, fontWeight: '700', color: C.primary },

    // Empty state
    emptyWrap:     { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 48, alignItems: 'center', gap: 8, marginBottom: 20 },
    emptyIconBox:  { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle:    { fontSize: 15, fontWeight: '600', color: C.text },
    emptySub:      { fontSize: 12, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
    emptyBtn:      { marginTop: 12, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
    emptyBtnTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },

    loadingWrap:   { paddingVertical: 40, alignItems: 'center' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100%', overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={18} color={C.textMuted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Speech Dashboard</Text>
        </View>
        <View style={s.divider} />

        {loading && count === 0 ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : count === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIconBox}>
              <Ionicons name="mic-outline" size={26} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>No sessions recorded yet</Text>
            <Text style={s.emptySub}>
              Complete your first speech session to see your composite score, sub-scores, and filler word analysis here.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Record', { mode: 'Free Speech' })} activeOpacity={0.85}>
              <Text style={s.emptyBtnTxt}>Start First Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Composite score */}
            <Text style={s.sectionLabel}>Composite Score</Text>
            <View style={s.scoreCard}>
              <View style={s.scoreBig}>
                <Text style={s.scoreNum}>{avgScore}</Text>
                <Text style={s.scoreSlash}>/100</Text>
              </View>
              <View style={s.scoreMeta}>
                <Text style={s.scoreTitleTxt}>Average across {count} session{count !== 1 ? 's' : ''}</Text>
                <Text style={s.scoreSubTxt}>
                  {avgScore == null ? '' : avgScore >= 85 ? 'Excellent — keep it up.' : avgScore >= 70 ? 'Good — room to grow.' : avgScore >= 55 ? 'Fair — consistent practice will help.' : 'Needs work — try shorter sessions.'}
                </Text>
                <View style={s.scoreBadgeRow}>
                  {bestScore != null && <View style={s.scoreBadge}><Text style={s.scoreBadgeTxt}>Best: {bestScore}</Text></View>}
                  {avgWpm != null && <View style={s.scoreBadge}><Text style={s.scoreBadgeTxt}>{avgWpm} WPM avg</Text></View>}
                </View>
              </View>
            </View>

            {/* Mini stat strip */}
            <View style={s.statStrip}>
              <View style={s.statCard}>
                <Text style={s.statVal}>{count}</Text>
                <Text style={s.statLbl}>Sessions</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statVal}>{avgWpm ?? '—'}</Text>
                <Text style={s.statLbl}>Avg WPM</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statVal}>{totalFillers}</Text>
                <Text style={s.statLbl}>Fillers</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statVal}>{bestScore ?? '—'}</Text>
                <Text style={s.statLbl}>Best</Text>
              </View>
            </View>

            {/* Sub-scores */}
            <Text style={s.sectionLabel}>Average Sub-scores</Text>
            <View style={s.metricCard}>
              <MetricRow icon="eye-outline"          color="#0369A1" label="Clarity"      value={avgClarity}    subLabel="Word articulation"     C={C} />
              <View style={s.metricDivider} />
              <MetricRow icon="speedometer-outline"  color="#15803D" label="Pace"         value={avgPace}       subLabel="Rhythm and flow"       C={C} />
              <View style={s.metricDivider} />
              <MetricRow icon="trending-up-outline"  color="#92400E" label="Confidence"   value={avgConfidence} subLabel="Tone and delivery"     C={C} />
              <View style={s.metricDivider} />
              <MetricRow icon="mic-outline"          color="#0F5132" label="Avg WPM"      value={avgWpm}        max={200} subLabel="120–150 ideal" C={C} />
              <View style={s.metricDivider} />
              <MetricRow icon="warning-outline"      color="#B45309" label="Avg Fillers"  value={avgFillersPer} max={20} subLabel="per session"   C={C} />
            </View>

            {/* Top filler words across all sessions */}
            {topFillers.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Top Filler Words (all sessions)</Text>
                <View style={s.fillerWrap}>
                  {topFillers.map(([word, cnt]) => (
                    <View key={word} style={s.fillerChip}>
                      <Text style={s.fillerWord}>"{word}"</Text>
                      <View style={s.fillerBadge}><Text style={s.fillerBadgeTxt}>{cnt}×</Text></View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Session history */}
            <Text style={s.sectionLabel}>Session History</Text>
            <View style={s.sessionCard}>
              {speechSessions.map((sess, i) => (
                <View key={sess.id ?? i} style={[s.sessionRow, i === speechSessions.length - 1 && s.sessionRowLast]}>
                  <View style={s.sessionIconBox}>
                    <Ionicons name="mic-outline" size={15} color={C.primary} />
                  </View>
                  <View style={s.sessionMeta}>
                    <Text style={s.sessionMode}>{sess.mode}</Text>
                    <Text style={s.sessionSub}>
                      {fmtDuration(sess.duration)}
                      {sess.wpm > 0 ? `  ·  ${sess.wpm} WPM` : ''}
                      {sess.filler_count > 0 ? `  ·  ${sess.filler_count} fillers` : ''}
                      {sess.created_at ? `  ·  ${timeAgo(sess.created_at)}` : ''}
                    </Text>
                  </View>
                  <Text style={s.sessionScore}>{sess.score}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
