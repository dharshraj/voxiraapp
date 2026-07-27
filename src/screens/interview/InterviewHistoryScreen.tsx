import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useInterviewSessions, RawInterviewSession } from '../../hooks/useSupabase';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

function sc(s: number) { return s >= 80 ? C.green : s >= 65 ? C.accent : s >= 50 ? C.gold : C.danger; }

function formatDate(iso: string) {
  const d   = new Date(iso);
  const now = new Date();
  const diffDay = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDay === 0) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7)   return `${diffDay} days ago`;
  return d.toLocaleDateString();
}

const FILTERS = ['All', 'Behavioral', 'Technical', 'Situational', 'Mixed'];

export default function InterviewHistoryScreen({ navigation }: any) {
  const { fetchInterviewSessions, loading, error } = useInterviewSessions();
  const [sessions, setSessions] = useState<RawInterviewSession[]>([]);
  const [filter,   setFilter]   = useState('All');
  const fade = useRef(new Animated.Value(0)).current;

  const loadSessions = useCallback(async () => {
    const data = await fetchInterviewSessions(50);
    setSessions(data);
  }, [fetchInterviewSessions]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions.filter(s =>
    filter === 'All' || s.interview_type === filter.toLowerCase() || s.role.includes(filter)
  );

  const avg  = filtered.length ? Math.round(filtered.reduce((a, b) => a + b.avg_score, 0) / filtered.length) : 0;
  const best = filtered.length ? Math.max(...filtered.map(s => s.avg_score)) : 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Interview History</Text>
            <Text style={s.headerSub}>{filtered.length} sessions</Text>
          </View>
          <View style={{ width: 42 }} />
        </View>

        {/* Summary stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: sc(avg) }]}>{avg || '—'}</Text>
            <Text style={s.statLbl}>Avg Score</Text>
          </View>
          <View style={[s.statItem, { borderRightWidth: 0 }]}>
            <Text style={[s.statVal, { color: C.green }]}>{best || '—'}</Text>
            <Text style={s.statLbl}>Best Score</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: C.purple }]}>{sessions.length}</Text>
            <Text style={s.statLbl}>Total</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'scroll' } as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && sessions.length === 0 && (
          <View style={s.centerState}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.centerTxt}>Loading sessions…</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={s.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={C.muted} />
            <Text style={s.centerTxt}>Could not load sessions</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadSessions}>
              <Text style={s.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty — no sessions at all */}
        {!loading && !error && sessions.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="people-outline" size={44} color={C.muted} />
            </View>
            <Text style={s.emptyTitle}>No interviews yet</Text>
            <Text style={s.emptySub}>Complete a mock interview to see your history here</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.navigate('ChooseRole')}>
              <Text style={s.retryTxt}>Start Interview</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No filtered results */}
        {!loading && !error && sessions.length > 0 && filtered.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="search-outline" size={44} color={C.muted} />
            </View>
            <Text style={s.emptyTitle}>No sessions found</Text>
            <Text style={s.emptySub}>Try a different filter</Text>
          </View>
        )}

        {/* Session list */}
        {filtered.length > 0 && (
          <View style={s.sessionList}>
            {filtered.map((sess, i) => {
              const col     = sc(sess.avg_score);
              const diffCol = sess.difficulty === 'easy' ? C.green : sess.difficulty === 'medium' ? C.gold : C.danger;
              const typeLabel = sess.interview_type.charAt(0).toUpperCase() + sess.interview_type.slice(1);
              const diffLabel = sess.difficulty.charAt(0).toUpperCase() + sess.difficulty.slice(1);

              return (
                <TouchableOpacity
                  key={sess.id}
                  style={[s.sessionRow, i === filtered.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate('Feedback', {
                    role:       sess.role,
                    type:       sess.interview_type,
                    difficulty: sess.difficulty,
                    scores:     [sess.avg_score],
                    questions:  [],
                    evaluations:[],
                    answers:    [],
                    avgScore:   sess.avg_score,
                  })}
                  activeOpacity={0.8}
                >
                  <View style={[s.sessionIcon, { backgroundColor: 'rgba(124,58,237,0.18)' }]}>
                    <Ionicons name="people-outline" size={20} color={C.purple} />
                  </View>
                  <View style={s.sessionMeta}>
                    <Text style={s.sessionRole}>{sess.role}</Text>
                    <View style={s.sessionSubRow}>
                      <View style={s.typeBadge}>
                        <Text style={s.typeBadgeTxt}>{typeLabel}</Text>
                      </View>
                      <View style={[s.diffBadge, { backgroundColor: `${diffCol}18` }]}>
                        <Text style={[s.diffBadgeTxt, { color: diffCol }]}>{diffLabel}</Text>
                      </View>
                    </View>
                    <View style={s.sessionInfo}>
                      <Ionicons name="time-outline" size={11} color={C.hint} />
                      <Text style={s.sessionInfoTxt}>
                        {formatDate(sess.created_at)} · {sess.question_count}Q
                      </Text>
                    </View>
                  </View>
                  <View style={[s.scoreBadge, { backgroundColor: `${col}15` }]}>
                    <Text style={[s.scoreBadgeTxt, { color: col }]}>{sess.avg_score}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  headerBg:      { paddingBottom: 12 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, marginBottom: 12, gap: 10 },
  backBtn:       { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: C.text },
  headerSub:     { fontSize: 12, color: C.muted, marginTop: 2 },
  statsRow:      { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 12 },
  statItem:      { flex: 1, alignItems: 'center', paddingVertical: 10, borderRightWidth: 1, borderRightColor: C.border },
  statVal:       { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLbl:       { fontSize: 10, color: C.muted },
  filterRow:     { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  chipActive:    { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt:       { fontSize: 12, color: C.muted, fontWeight: '500' },
  chipTxtActive: { color: '#fff' },
  scroll:        { paddingHorizontal: 20, paddingTop: 16 },
  centerState:   { alignItems: 'center', paddingTop: 80, gap: 12 },
  centerTxt:     { fontSize: 15, color: C.muted },
  sessionList:   { backgroundColor: C.bgCard, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sessionRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  sessionIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sessionMeta:   { flex: 1, gap: 6 },
  sessionRole:   { fontSize: 13, fontWeight: '700', color: C.text },
  sessionSubRow: { flexDirection: 'row', gap: 6 },
  typeBadge:     { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeTxt:  { fontSize: 10, color: C.muted, fontWeight: '600' },
  diffBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  diffBadgeTxt:  { fontSize: 10, fontWeight: '700' },
  sessionInfo:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionInfoTxt:{ fontSize: 11, color: C.hint },
  scoreBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' },
  scoreBadgeTxt: { fontSize: 14, fontWeight: '800' },
  empty:         { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:     { width: 88, height: 88, borderRadius: 26, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text },
  emptySub:      { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn:      { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryTxt:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});
