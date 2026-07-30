/**
 * ToneAnalysisScreen — uses most-recent session transcript.
 * AI tone analysis is stubbed in mockData.ts pending a real endpoint.
 * Hooked into: sessionStore (real), fetchToneAnalysis (TODO stub).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

export default function ToneAnalysisScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loading      = useSessionStore(s => s.loading);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const speech  = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const latest  = speech[0];

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const TONE_DIMS = [
    { label: 'Confidence', icon: 'trending-up-outline', color: '#8B5CF6', value: latest ? Math.min(100, latest.confidence + 5) : null },
    { label: 'Clarity',    icon: 'eye-outline',          color: '#06B6D4', value: latest ? latest.clarity : null },
    { label: 'Energy',     icon: 'flash-outline',        color: '#F59E0B', value: latest ? Math.min(100, Math.round((latest.pace + latest.confidence) / 2)) : null },
  ];

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: C.bg },
    header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    title:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },
    scroll:  { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 80 },
    lbl:     { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
    dimCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
    dimTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    dimIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    dimLbl:  { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
    dimVal:  { fontSize: 18, fontWeight: '800' },
    barBg:   { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%' as any, borderRadius: 3 },
    stubNote:{ fontSize: 12, color: C.textMuted, fontStyle: 'italic', marginTop: 6 },
    empty:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTxt:{ fontSize: 14, color: C.textMuted, textAlign: 'center' },
    emptyBtn:{ marginTop: 8, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
    emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
    todoBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.warning + '14', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.warning + '44' },
    todoTxt:     { flex: 1, fontSize: 12, color: C.warning, lineHeight: 18 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Tone Analysis</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {speech.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="radio-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyTxt}>Complete a speech session to see your tone analysis.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Record', { mode: 'Free Speech' })} activeOpacity={0.85}>
              <Text style={s.emptyBtnTxt}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.lbl}>Latest Session — Speech</Text>
            {TONE_DIMS.map((dim, i) => (
              <View key={i} style={s.dimCard}>
                <View style={s.dimTop}>
                  <View style={[s.dimIcon, { backgroundColor: dim.color + '18' }]}>
                    <Ionicons name={dim.icon as any} size={18} color={dim.color} />
                  </View>
                  <Text style={s.dimLbl}>{dim.label}</Text>
                  <Text style={[s.dimVal, { color: dim.value != null ? dim.color : C.textMuted }]}>
                    {dim.value != null ? dim.value : '—'}
                  </Text>
                </View>
                {dim.value != null ? (
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${dim.value}%` as any, backgroundColor: dim.color }]} />
                  </View>
                ) : (
                  <Text style={s.stubNote}>Requires AI tone endpoint — see mockData.ts</Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
