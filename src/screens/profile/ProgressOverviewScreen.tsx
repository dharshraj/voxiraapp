import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

function formatDuration(secs: number) {
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
function scoreColor(score: number, primary: string, warning: string, error: string) {
  if (score >= 80) return primary;
  if (score >= 60) return warning;
  return error;
}

export default function ProgressOverviewScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loading      = useSessionStore(s => s.loading);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const fade = useRef(new Animated.Value(0)).current;

  // Re-fetch every time the screen comes into focus (not just on first mount)
  // so new sessions appear immediately after completing a speech session
  useFocusEffect(
    useCallback(() => {
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      if (userId) {
        console.log('[ProgressOverview] screen focused — loading sessions for', userId);
        loadSessions(userId);
      }
    }, [userId])
  );

  // All real data — no fakes
  const speechSessions = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const count          = speechSessions.length;
  const avgScore       = count > 0 ? Math.round(speechSessions.reduce((a, s) => a + s.score, 0) / count) : null;
  const avgClarity     = count > 0 ? Math.round(speechSessions.reduce((a, s) => a + s.clarity, 0) / count) : null;
  const avgPace        = count > 0 ? Math.round(speechSessions.reduce((a, s) => a + s.pace, 0) / count) : null;
  const avgConfidence  = count > 0 ? Math.round(speechSessions.reduce((a, s) => a + s.confidence, 0) / count) : null;
  const avgWpm         = count > 0 ? Math.round(speechSessions.reduce((a, s) => a + s.wpm, 0) / count) : null;
  const totalFillers   = speechSessions.reduce((a, s) => a + s.filler_count, 0);
  const best           = count > 0 ? Math.max(...speechSessions.map(s => s.score)) : null;

  const s = StyleSheet.create({
    root:         { flex: 1, backgroundColor: C.bg },
    scrollContent:{ paddingBottom: 80 },

    header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },

    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10 },

    // Summary row
    summaryRow:   { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
    sumCard:      { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 3 },
    sumVal:       { fontSize: 18, fontWeight: '700', color: C.text },
    sumLbl:       { fontSize: 10, color: C.textMuted, textAlign: 'center' },

    // Sub-score card
    subScoreCard: { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    subRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    subRowLast:   { borderBottomWidth: 0 },
    subIconBox:   { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    subLabel:     { flex: 1, fontSize: 13, color: C.textSec },
    subVal:       { fontSize: 14, fontWeight: '700' },
    subBarBg:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.border },
    subBarFill:   { height: 2, borderRadius: 1 },

    // Session list
    sessionCard:  { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    sessionRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
    sessionRowLast:{ borderBottomWidth: 0 },
    sessionIconBox:{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    sessionMeta:  { flex: 1 },
    sessionMode:  { fontSize: 13, fontWeight: '600', color: C.text },
    sessionSub:   { fontSize: 11, color: C.textMuted, marginTop: 1 },
    sessionScore: { fontSize: 15, fontWeight: '700' },

    // Empty state
    emptyWrap:    { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 40, alignItems: 'center', gap: 8, marginBottom: 20 },
    emptyIcon:    { width: 48, height: 48, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle:   { fontSize: 14, fontWeight: '600', color: C.text },
    emptySub:     { fontSize: 12, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24 },
  });

  const SUB_SCORES = [
    { label: 'Clarity',       val: avgClarity,    icon: 'eye-outline',          color: '#0369A1' },
    { label: 'Pace',          val: avgPace,        icon: 'speedometer-outline',  color: '#15803D' },
    { label: 'Confidence',    val: avgConfidence,  icon: 'trending-up-outline',  color: '#92400E' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100%', overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.textMuted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Progress Overview</Text>
        </View>
        <View style={s.divider} />

        {/* Summary stats */}
        <Text style={s.sectionLabel}>Summary</Text>
        <View style={s.summaryRow}>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{count}</Text>
            <Text style={s.sumLbl}>Sessions</Text>
          </View>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{avgScore ?? '—'}</Text>
            <Text style={s.sumLbl}>Avg Score</Text>
          </View>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{best ?? '—'}</Text>
            <Text style={s.sumLbl}>Best</Text>
          </View>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{avgWpm ?? '—'}</Text>
            <Text style={s.sumLbl}>Avg WPM</Text>
          </View>
        </View>

        {/* Sub-scores */}
        <Text style={s.sectionLabel}>Average Sub-scores</Text>
        {count === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Ionicons name="bar-chart-outline" size={22} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>No data yet</Text>
            <Text style={s.emptySub}>Complete a speech session to see your sub-scores here.</Text>
          </View>
        ) : (
          <View style={s.subScoreCard}>
            {SUB_SCORES.map((sub, i) => (
              <View key={i} style={[s.subRow, i === SUB_SCORES.length - 1 && s.subRowLast]}>
                <View style={[s.subIconBox, { backgroundColor: sub.color + '18' }]}>
                  <Ionicons name={sub.icon as any} size={15} color={sub.color} />
                </View>
                <Text style={s.subLabel}>{sub.label}</Text>
                {sub.val != null && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.subVal, { color: scoreColor(sub.val, C.primary, C.warning, C.error) }]}>
                      {sub.val}
                    </Text>
                    <View style={{ width: 60, height: 3, backgroundColor: C.border, borderRadius: 2, marginTop: 3 }}>
                      <View style={{ width: `${sub.val}%` as any, height: 3, borderRadius: 2, backgroundColor: sub.color }} />
                    </View>
                  </View>
                )}
              </View>
            ))}
            <View style={[s.subRow, s.subRowLast]}>
              <View style={[s.subIconBox, { backgroundColor: '#B45309' + '18' }]}>
                <Ionicons name="warning-outline" size={15} color="#B45309" />
              </View>
              <Text style={s.subLabel}>Total Filler Words</Text>
              <Text style={[s.subVal, { color: totalFillers === 0 ? C.success : totalFillers > 10 ? C.error : C.warning }]}>
                {totalFillers}
              </Text>
            </View>
          </View>
        )}

        {/* Session history */}
        <Text style={s.sectionLabel}>Session History</Text>
        {count === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Ionicons name="mic-outline" size={22} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>No sessions yet</Text>
            <Text style={s.emptySub}>Record and analyse your first speech to start tracking progress.</Text>
          </View>
        ) : (
          <View style={s.sessionCard}>
            {speechSessions.map((sess, i) => {
              const sc = scoreColor(sess.score, C.primary, C.warning, C.error);
              return (
                <View key={sess.id ?? i} style={[s.sessionRow, i === speechSessions.length - 1 && s.sessionRowLast]}>
                  <View style={s.sessionIconBox}>
                    <Ionicons name="mic-outline" size={15} color={C.primary} />
                  </View>
                  <View style={s.sessionMeta}>
                    <Text style={s.sessionMode}>{sess.mode}</Text>
                    <Text style={s.sessionSub}>
                      {formatDuration(sess.duration)}
                      {sess.wpm > 0 ? `  ·  ${sess.wpm} WPM` : ''}
                      {sess.filler_count > 0 ? `  ·  ${sess.filler_count} fillers` : ''}
                      {sess.created_at ? `  ·  ${timeAgo(sess.created_at)}` : ''}
                    </Text>
                  </View>
                  <Text style={[s.sessionScore, { color: sc }]}>{sess.score}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}
