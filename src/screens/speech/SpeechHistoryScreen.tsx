import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSpeechSessions, RawSpeechSession } from '../../hooks/useSupabase';
import { useTheme } from '../../theme/ThemeContext';

const FILTERS      = ['All', 'Free Speech', 'Presentation', 'Conversation', 'Read Aloud'];
const SORT_OPTIONS = ['Newest', 'Highest Score', 'Lowest Score'];

function scoreColor(s: number) { return s >= 85 ? '#22C55E' : s >= 70 ? '#06B6D4' : '#F59E0B'; }
function modeIcon(mode: string) {
  switch (mode) {
    case 'Presentation':  return 'easel-outline';
    case 'Conversation':  return 'chatbubbles-outline';
    case 'Read Aloud':    return 'book-outline';
    default:              return 'mic-outline';
  }
}
function modeColor(mode: string) {
  switch (mode) {
    case 'Presentation':  return '#22C55E';
    case 'Conversation':  return '#A855F7';
    case 'Read Aloud':    return '#F59E0B';
    default:              return '#06B6D4';
  }
}
function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
function formatDate(iso: string) {
  const d   = new Date(iso);
  const now = new Date();
  const diffDay = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDay === 0) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7)   return `${diffDay} days ago`;
  return d.toLocaleDateString();
}

export default function SpeechHistoryScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const { fetchSpeechSessions, loading, error } = useSpeechSessions();
  const [sessions,  setSessions]  = useState<RawSpeechSession[]>([]);
  const [filter,    setFilter]    = useState('All');
  const [sort,      setSort]      = useState('Newest');
  const [search,    setSearch]    = useState('');
  const [showSort,  setShowSort]  = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const loadSessions = useCallback(async () => {
    const data = await fetchSpeechSessions(50);
    setSessions(data);
  }, [fetchSpeechSessions]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions
    .filter(s => {
      const matchFilter = filter === 'All' || s.mode === filter;
      const matchSearch = !search || s.mode.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'Highest Score') return b.score - a.score;
      if (sort === 'Lowest Score')  return a.score - b.score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const avgScore    = filtered.length ? Math.round(filtered.reduce((a, b) => a + b.score, 0) / filtered.length) : 0;
  const bestScore   = filtered.length ? Math.max(...filtered.map(s => s.score)) : 0;
  const totalFiller = filtered.reduce((a, b) => a + (b.filler_count ?? 0), 0);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg },
    headerBg:      { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 12 },
    header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, marginBottom: 12, gap: 10 },
    backBtn:       { width: 42, height: 42, borderRadius: 13, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerCenter:  { flex: 1 },
    headerTitle:   { fontSize: 17, fontWeight: '700', color: C.text },
    headerSub:     { fontSize: 12, color: C.textMuted, marginTop: 2 },
    sortBtn:       { width: 42, height: 42, borderRadius: 13, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    sortDropdown:  { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
    sortOption:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    sortOptionActive: { backgroundColor: C.primaryLight },
    sortOptionTxt: { fontSize: 13, color: C.textMuted },
    sortOptionTxtActive: { color: C.primary, fontWeight: '600' },
    searchBar:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    searchInput:   { flex: 1, color: C.text, fontSize: 14 },
    summaryRow:    { flexDirection: 'row', marginHorizontal: 20, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 12 },
    summaryItem:   { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4, borderRightWidth: 1, borderRightColor: C.border },
    summaryVal:    { fontSize: 16, fontWeight: '800' },
    summaryLbl:    { fontSize: 10, color: C.textMuted },
    filterRow:     { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
    chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
    chipActive:    { backgroundColor: C.primary, borderColor: C.primary },
    chipTxt:       { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    chipTxtActive: { color: '#fff' },
    scroll:        { paddingHorizontal: 20, paddingTop: 16 },
    centerState:   { alignItems: 'center', paddingTop: 80, gap: 12 },
    centerTxt:     { fontSize: 15, color: C.textMuted },
    trendCard:     { backgroundColor: C.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    trendTitle:    { fontSize: 13, fontWeight: '600', color: C.textMuted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    trendBars:     { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
    trendCol:      { flex: 1, alignItems: 'center', gap: 4 },
    trendVal:      { fontSize: 9, fontWeight: '700' },
    trendBarBg:    { width: '100%', justifyContent: 'flex-end', height: 56, borderRadius: 4, overflow: 'hidden', backgroundColor: C.border },
    trendBar:      { width: '100%', borderRadius: 4 },
    trendDay:      { fontSize: 9, color: C.textMuted },
    listLabel:     { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
    sessionList:   { backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    sessionRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.divider },
    sessionIcon:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sessionMeta:   { flex: 1 },
    sessionMode:   { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 4 },
    sessionSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    sessionSub:    { fontSize: 11, color: C.textMuted },
    dot:           { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textMuted },
    sessionRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scoreBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    scoreBadgeTxt: { fontSize: 13, fontWeight: '800' },
    empty:         { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyIcon:     { width: 88, height: 88, borderRadius: 26, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text },
    emptySub:      { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingHorizontal: 20 },
    retryBtn:      { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    retryTxt:      { fontSize: 14, fontWeight: '700', color: '#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.textMuted} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Speech History</Text>
            <Text style={s.headerSub}>{filtered.length} sessions</Text>
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(!showSort)}>
            <Ionicons name="funnel-outline" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {showSort && (
          <View style={s.sortDropdown}>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity
                key={o}
                style={[s.sortOption, sort === o && s.sortOptionActive]}
                onPress={() => { setSort(o); setShowSort(false); }}
              >
                <Text style={[s.sortOptionTxt, sort === o && s.sortOptionTxtActive]}>{o}</Text>
                {sort === o && <Ionicons name="checkmark" size={16} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search sessions..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.summaryRow}>
          {[
            { val: `${avgScore}`,    lbl: 'Avg Score',     icon: 'star',           color: C.warning },
            { val: `${bestScore}`,   lbl: 'Best',          icon: 'trophy-outline', color: C.success },
            { val: `${totalFiller}`, lbl: 'Total Fillers', icon: 'warning-outline',color: C.error   },
          ].map((st, i) => (
            <View key={i} style={s.summaryItem}>
              <Ionicons name={st.icon as any} size={14} color={st.color} />
              <Text style={[s.summaryVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.summaryLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'scroll' } as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading && sessions.length === 0 && (
          <View style={s.centerState}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.centerTxt}>Loading sessions…</Text>
          </View>
        )}
        {error && !loading && (
          <View style={s.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={C.textMuted} />
            <Text style={s.centerTxt}>Could not load sessions</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadSessions}>
              <Text style={s.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && sessions.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="mic-off-outline" size={44} color={C.textMuted} /></View>
            <Text style={s.emptyTitle}>No sessions yet</Text>
            <Text style={s.emptySub}>Complete a speech session to see your history here</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.navigate('Record', { mode: 'Free Speech' })}>
              <Text style={s.retryTxt}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && sessions.length > 0 && filtered.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="search-outline" size={44} color={C.textMuted} /></View>
            <Text style={s.emptyTitle}>No sessions found</Text>
            <Text style={s.emptySub}>Try a different filter or search term</Text>
          </View>
        )}

        {filtered.length > 0 && (
          <>
            <View style={s.trendCard}>
              <Text style={s.trendTitle}>Recent Scores</Text>
              <View style={s.trendBars}>
                {filtered.slice(0, 7).reverse().map((ss, i) => {
                  const h   = Math.max(8, (ss.score / 100) * 56);
                  const col = scoreColor(ss.score);
                  return (
                    <View key={i} style={s.trendCol}>
                      <Text style={[s.trendVal, { color: col }]}>{ss.score}</Text>
                      <View style={s.trendBarBg}>
                        <View style={[s.trendBar, { height: h, backgroundColor: col }]} />
                      </View>
                      <Text style={s.trendDay}>{new Date(ss.created_at).toLocaleDateString([], { weekday: 'narrow' })}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={s.listLabel}>ALL SESSIONS</Text>
            <View style={s.sessionList}>
              {filtered.map((ss, i) => {
                const col  = scoreColor(ss.score);
                const icon = modeIcon(ss.mode);
                const iclr = modeColor(ss.mode);
                return (
                  <TouchableOpacity
                    key={ss.id}
                    style={[s.sessionRow, i === filtered.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => navigation.navigate('SessionDetail', {
                      score: ss.score, duration: ss.duration, mode: ss.mode,
                      date: formatDate(ss.created_at), fillerCount: ss.filler_count,
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={[s.sessionIcon, { backgroundColor: `${iclr}18` }]}>
                      <Ionicons name={icon as any} size={20} color={iclr} />
                    </View>
                    <View style={s.sessionMeta}>
                      <Text style={s.sessionMode}>{ss.mode}</Text>
                      <View style={s.sessionSubRow}>
                        <Ionicons name="time-outline" size={11} color={C.textMuted} />
                        <Text style={s.sessionSub}>{formatDate(ss.created_at)}</Text>
                        <View style={s.dot} />
                        <Text style={s.sessionSub}>{formatDuration(ss.duration)}</Text>
                        <View style={s.dot} />
                        <Ionicons name="warning-outline" size={11} color={C.textMuted} />
                        <Text style={s.sessionSub}>{ss.filler_count} fillers</Text>
                      </View>
                    </View>
                    <View style={s.sessionRight}>
                      <View style={[s.scoreBadge, { backgroundColor: `${col}15` }]}>
                        <Text style={[s.scoreBadgeTxt, { color: col }]}>{ss.score}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}
