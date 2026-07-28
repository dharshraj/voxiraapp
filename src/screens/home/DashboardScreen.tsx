import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

export default function DashboardScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId        = useAuthStore(s => s.user?.id);
  const profile       = useUserStore(s => s.profile);
  const profileLoading = useUserStore(s => s.loading);
  const sessions      = useSessionStore(s => s.sessions);
  const loadSessions  = useSessionStore(s => s.loadSessions);
  const fadeAnim      = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    if (userId) loadSessions(userId);
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    if (userId) {
      await Promise.all([
        useUserStore.getState().loadProfile(userId),
        loadSessions(userId),
      ]);
    }
  }, [userId]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Real computed stats — all from actual data
  const speechSessions = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const sessionCount   = speechSessions.length;
  const avgScore       = sessionCount > 0
    ? Math.round(speechSessions.reduce((acc, s) => acc + s.score, 0) / sessionCount)
    : null;
  const streakDays     = profile?.streak_days ?? 0;
  const recentSessions = speechSessions.slice(0, 3);

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

  const s = StyleSheet.create({
    root:           { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    scrollContent:  { paddingBottom: 80 },

    // Header
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingHorizontal: 20, paddingBottom: 14 },
    greetingTxt:    { fontSize: 12, color: C.textMuted, letterSpacing: 0.2 },
    nameTxt:        { fontSize: 22, fontWeight: '700', color: C.text, marginTop: 1 },
    headerBtns:     { flexDirection: 'row', gap: 8 },
    iconBtn:        { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

    // Divider
    divider:        { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },

    // Stat row — compact 4-up
    statsRow:       { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
    statCard:       { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 3 },
    statVal:        { fontSize: 17, fontWeight: '700', color: C.text },
    statLbl:        { fontSize: 10, color: C.textMuted, textAlign: 'center' },

    // Section label
    sectionLabel:   { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10 },

    // Primary CTA — compact
    ctaCard:        { marginHorizontal: 20, marginBottom: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
    ctaIconBox:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    ctaTextWrap:    { flex: 1 },
    ctaTitle:       { fontSize: 14, fontWeight: '700', color: '#fff' },
    ctaSub:         { fontSize: 12, color: 'rgba(255,255,255,0.70)', marginTop: 1 },
    ctaChevron:     { opacity: 0.7 },

    // Daily tip — minimal
    tipCard:        { marginHorizontal: 20, marginBottom: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
    tipHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    tipBadge:       { backgroundColor: C.primaryLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    tipBadgeTxt:    { fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 0.5 },
    tipTxt:         { fontSize: 13, color: C.textSec, lineHeight: 20 },

    // Recent sessions
    sessionCard:    { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    sessionRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
    sessionRowLast: { borderBottomWidth: 0 },
    sessionIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    sessionMeta:    { flex: 1 },
    sessionMode:    { fontSize: 13, fontWeight: '600', color: C.text },
    sessionSub:     { fontSize: 11, color: C.textMuted, marginTop: 1 },
    sessionScore:   { fontSize: 15, fontWeight: '700', color: C.primary },

    // Empty state
    emptyCard:      { marginHorizontal: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 6, marginBottom: 20 },
    emptyIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle:     { fontSize: 14, fontWeight: '600', color: C.text },
    emptySub:       { fontSize: 12, color: C.textMuted, textAlign: 'center' },

    // Quick tips list
    tipsCard:       { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    tipsRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    tipsRowLast:    { borderBottomWidth: 0 },
    tipsDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, flexShrink: 0 },
    tipsTxt:        { fontSize: 12, color: C.textSec, flex: 1, lineHeight: 18 },
  });

  const TIPS = [
    'Pause for 1 second instead of saying "um" — silence signals confidence.',
    'Speak at 120–140 words per minute for maximum clarity.',
    'Lead with your main point — don\'t bury it at the end.',
    'Use the 3-point structure: state it, explain it, summarise it.',
    'Record yourself for 2 minutes daily — review for one improvement.',
  ];
  const todayTip = TIPS[new Date().getDay() % TIPS.length];

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{ opacity: fadeAnim }, Platform.OS === 'web' && ({ height: '100%', overflowY: 'auto' } as any)]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={profileLoading} onRefresh={handleRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greetingTxt}>{greeting}</Text>
            <Text style={s.nameTxt}>{firstName}</Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.75}>
              <Ionicons name="search-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.75}>
              <Ionicons name="notifications-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.divider} />

        {/* Compact stat strip — real data only */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="mic-outline" size={14} color={C.textMuted} />
            <Text style={s.statVal}>{sessionCount}</Text>
            <Text style={s.statLbl}>Sessions</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="flame-outline" size={14} color={C.textMuted} />
            <Text style={s.statVal}>{streakDays}</Text>
            <Text style={s.statLbl}>Streak</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="star-outline" size={14} color={C.textMuted} />
            <Text style={s.statVal}>{avgScore ?? '—'}</Text>
            <Text style={s.statLbl}>Avg Score</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="trending-up-outline" size={14} color={C.textMuted} />
            <Text style={[s.statVal, { fontSize: 13 }]}>
              {sessionCount === 0 ? '—' : avgScore != null && avgScore >= 85 ? 'Pro' : avgScore != null && avgScore >= 65 ? 'Mid' : 'Beg'}
            </Text>
            <Text style={s.statLbl}>Level</Text>
          </View>
        </View>

        {/* Primary CTA */}
        <Text style={s.sectionLabel}>Start</Text>
        <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('Speech')} activeOpacity={0.85}>
          <View style={s.ctaIconBox}>
            <Ionicons name="mic" size={18} color="#fff" />
          </View>
          <View style={s.ctaTextWrap}>
            <Text style={s.ctaTitle}>New Speech Session</Text>
            <Text style={s.ctaSub}>Record, transcribe and analyse</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#fff" style={s.ctaChevron} />
        </TouchableOpacity>

        {/* Daily tip — rotates by day, labelled clearly as a tip not as generated data */}
        <Text style={s.sectionLabel}>Today's Tip</Text>
        <View style={s.tipCard}>
          <View style={s.tipHeader}>
            <Ionicons name="information-circle-outline" size={15} color={C.primary} />
            <View style={s.tipBadge}><Text style={s.tipBadgeTxt}>SPEAKING TIP</Text></View>
          </View>
          <Text style={s.tipTxt}>{todayTip}</Text>
        </View>

        {/* Recent sessions — real data */}
        <Text style={s.sectionLabel}>Recent Sessions</Text>
        {recentSessions.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="mic-outline" size={22} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>No sessions yet</Text>
            <Text style={s.emptySub}>Complete your first recording to see your results here.</Text>
          </View>
        ) : (
          <View style={s.sessionCard}>
            {recentSessions.map((sess, i) => (
              <View key={i} style={[s.sessionRow, i === recentSessions.length - 1 && s.sessionRowLast]}>
                <View style={s.sessionIconBox}>
                  <Ionicons name="mic-outline" size={15} color={C.primary} />
                </View>
                <View style={s.sessionMeta}>
                  <Text style={s.sessionMode}>{sess.mode}</Text>
                  <Text style={s.sessionSub}>
                    {formatDuration(sess.duration)}
                    {sess.wpm > 0 ? `  ·  ${sess.wpm} WPM` : ''}
                    {sess.created_at ? `  ·  ${timeAgo(sess.created_at)}` : ''}
                  </Text>
                </View>
                <Text style={s.sessionScore}>{sess.score}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick improvement tips — clearly static coaching content */}
        <Text style={s.sectionLabel}>Coaching Tips</Text>
        <View style={s.tipsCard}>
          {[
            'Replace filler words with a deliberate 1-second pause.',
            'Record yourself daily for 2 minutes and note one thing to improve.',
            'Vary your sentence length — mix short punchy sentences with longer ones.',
            'Breathe from your diaphragm for a steadier, more authoritative voice.',
          ].map((tip, i, arr) => (
            <View key={i} style={[s.tipsRow, i === arr.length - 1 && s.tipsRowLast]}>
              <View style={s.tipsDot} />
              <Text style={s.tipsTxt}>{tip}</Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
