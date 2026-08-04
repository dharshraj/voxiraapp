/**
 * ConfidenceScoreScreen — pulls from sessionStore.
 * Shows confidence trends across all sessions.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

export default function ConfidenceScoreScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loading      = useSessionStore(s => s.loading);
  const loadSessions = useSessionStore(s => s.loadSessions);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const count  = speech.length;
  const avg    = count ? Math.round(speech.reduce((a, s) => a + s.confidence, 0) / count) : null;
  const best   = count ? Math.max(...speech.map(s => s.confidence)) : null;
  const latest = speech[0];

  const band = (v: number) => v >= 80 ? { label: 'Strong', color: C.success } : v >= 60 ? { label: 'Building', color: C.warning } : { label: 'Developing', color: C.error };

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: C.bg },
    header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    title:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },
    scroll:  { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 120 },
    lbl:     { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
    statRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    stat:    { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center', gap: 4 },
    statVal: { fontSize: 28, fontWeight: '800', color: C.text },
    statLbl: { fontSize: 11, color: C.textMuted },
    card:    { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    cardLbl: { fontSize: 13, color: C.textSec },
    badge:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    badgeTxt:{ fontSize: 12, fontWeight: '700' },
    barBg:   { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%' as any, borderRadius: 3 },
    empty:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTxt:{ fontSize: 14, color: C.textMuted, textAlign: 'center' },
    emptyBtn:{ marginTop: 8, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
    emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
    sessionRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
    sessionRowLast: { borderBottomWidth: 0 },
    sessionMode: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },
    sessionSub:  { fontSize: 11, color: C.textMuted },
    sessionScore:{ fontSize: 15, fontWeight: '700' },
  });

  if (loading && count === 0) return (
    <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color={C.primary} />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Confidence Score</Text>
      </View>
      <View style={s.divider} />

      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {count === 0 ? (
          <View style={s.empty}>
            <Ionicons name="trending-up-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyTxt}>No sessions yet. Complete your first speech analysis to see your confidence score.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Record', { mode: 'Speech Session' })} activeOpacity={0.85}>
              <Text style={s.emptyBtnTxt}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.lbl}>Overview</Text>
            <View style={s.statRow}>
              <View style={s.stat}>
                <Text style={s.statVal}>{avg ?? '—'}</Text>
                <Text style={s.statLbl}>Avg Confidence</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{best ?? '—'}</Text>
                <Text style={s.statLbl}>Best</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{count}</Text>
                <Text style={s.statLbl}>Sessions</Text>
              </View>
            </View>

            {avg != null && (
              <>
                <Text style={s.lbl}>Current Level</Text>
                <View style={s.card}>
                  <View style={s.cardTop}>
                    <Text style={s.cardLbl}>Confidence level</Text>
                    <View style={[s.badge, { backgroundColor: band(avg).color + '18' }]}>
                      <Text style={[s.badgeTxt, { color: band(avg).color }]}>{band(avg).label}</Text>
                    </View>
                  </View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${avg}%` as any, backgroundColor: band(avg).color }]} />
                  </View>
                  <Text style={[s.cardLbl, { marginTop: 6 }]}>{avg}/100 average across {count} session{count > 1 ? 's' : ''}</Text>
                </View>
              </>
            )}

            <Text style={s.lbl}>Session History</Text>
            <View style={s.card}>
              {speech.slice(0, 8).map((sess, i) => {
                const sessNum = speech.length - i;
                return (
                  <View key={sess.id ?? i} style={[s.sessionRow, i === Math.min(speech.length, 8) - 1 && s.sessionRowLast]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sessionMode}>Session {sessNum}</Text>
                      <Text style={s.sessionSub}>{sess.created_at ? new Date(sess.created_at).toLocaleDateString() : ''}</Text>
                    </View>
                    <Text style={[s.sessionScore, { color: sess.confidence >= 80 ? C.success : sess.confidence >= 60 ? C.warning : C.error }]}>
                      {sess.confidence}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
