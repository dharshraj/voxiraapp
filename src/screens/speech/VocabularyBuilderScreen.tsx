/**
 * VocabularyBuilderScreen — derives data from session transcripts.
 * Word frequency and vocabulary richness is computed client-side.
 * AI vocabulary insights stubbed in mockData.ts → fetchVocabularyInsights.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','it','i','you','we','they','this','that','with','from','was','are','be','been','have','has']);

function computeVocabStats(sessions: SpeechSession[]) {
  const allText = sessions.map(s => s.transcript).join(' ').toLowerCase();
  const words   = allText.match(/\b[a-z]{3,}\b/g) ?? [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!STOP_WORDS.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  }
  const sorted  = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const unique  = Object.keys(freq).length;
  const total   = words.length;
  const richness = total > 0 ? Math.round((unique / total) * 100) : 0;
  return { topWords: sorted.slice(0, 12), unique, total, richness };
}

export default function VocabularyBuilderScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loading      = useSessionStore(s => s.loading);
  const loadSessions = useSessionStore(s => s.loadSessions);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const stats  = useMemo(() => computeVocabStats(speech), [speech]);

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: C.bg },
    header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    title:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },
    scroll:  { paddingHorizontal: 20, paddingBottom: 80 },
    lbl:     { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
    statRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    stat:    { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center', gap: 4 },
    statVal: { fontSize: 24, fontWeight: '800', color: C.text },
    statLbl: { fontSize: 11, color: C.textMuted, textAlign: 'center' },
    wordCloud:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:    { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
    chipTxt: { fontSize: 13, fontWeight: '600', color: C.text },
    chipCnt: { fontSize: 11, color: C.textMuted },
    empty:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTxt:{ fontSize: 14, color: C.textMuted, textAlign: 'center' },
    emptyBtn:{ marginTop: 8, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
    emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
    todoBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.warning + '14', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.warning + '44' },
    todoTxt:     { flex: 1, fontSize: 12, color: C.warning, lineHeight: 18 },
  });

  if (loading && speech.length === 0) return (
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
        <Text style={s.title}>Vocabulary Builder</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {speech.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="book-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyTxt}>Complete speech sessions to build your vocabulary profile from real transcripts.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Record', { mode: 'Free Speech' })} activeOpacity={0.85}>
              <Text style={s.emptyBtnTxt}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.lbl}>Vocabulary Stats</Text>
            <View style={s.statRow}>
              <View style={s.stat}><Text style={s.statVal}>{stats.unique}</Text><Text style={s.statLbl}>Unique Words</Text></View>
              <View style={s.stat}><Text style={s.statVal}>{stats.total}</Text><Text style={s.statLbl}>Total Words</Text></View>
              <View style={s.stat}><Text style={s.statVal}>{stats.richness}%</Text><Text style={s.statLbl}>Richness</Text></View>
            </View>
            <Text style={s.lbl}>Most Used Words (across all sessions)</Text>
            <View style={s.wordCloud}>
              {stats.topWords.map(([word, count]) => (
                <View key={word} style={s.chip}>
                  <Text style={s.chipTxt}>{word}</Text>
                  <Text style={s.chipCnt}>{count}×</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
