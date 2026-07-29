/**
 * WeeklyReportScreen — derives entirely from sessionStore (real data).
 * Groups sessions by day-of-week for the current calendar week.
 * No AI endpoint needed — all computation is local.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getWeekSessions(sessions: SpeechSession[]) {
  const now    = new Date();
  const day    = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0,0,0,0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);
  return sessions.filter(s => {
    if (!s.created_at) return false;
    const d = new Date(s.created_at);
    return d >= monday && d <= sunday;
  });
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function WeeklyReportScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loading      = useSessionStore(s => s.loading);
  const loadSessions = useSessionStore(s => s.loadSessions);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const week   = getWeekSessions(speech);

  const now    = new Date();
  const day    = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(monday);
    d.setDate(monday.getDate() + i);
    const str  = toDateStr(d);
    const daySessions = week.filter(s => s.created_at && toDateStr(new Date(s.created_at)) === str);
    const avg  = daySessions.length ? Math.round(daySessions.reduce((a,s) => a+s.score,0)/daySessions.length) : null;
    return { label: DAY_LABELS[i], date: str, count: daySessions.length, avg, isToday: toDateStr(now) === str };
  });

  const totalSessions = week.length;
  const avgScore      = week.length ? Math.round(week.reduce((a,s)=>a+s.score,0)/week.length) : null;
  const activeDays    = days.filter(d => d.count > 0).length;

  const s = StyleSheet.create({
    root:     { flex: 1, backgroundColor: C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:   { paddingHorizontal:20, paddingBottom:80 },
    lbl:      { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, marginTop:16 },
    statRow:  { flexDirection:'row', gap:8, marginBottom:4 },
    stat:     { flex:1, backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, alignItems:'center', gap:4 },
    statVal:  { fontSize:22, fontWeight:'800', color:C.text },
    statLbl:  { fontSize:10, color:C.textMuted, textAlign:'center' },
    barRow:   { flexDirection:'row', alignItems:'flex-end', gap:6, height:100, marginBottom:8 },
    barCol:   { flex:1, alignItems:'center', gap:4 },
    barBg:    { width:'100%', backgroundColor:C.border, borderRadius:4, justifyContent:'flex-end', overflow:'hidden' },
    barFill:  { width:'100%', borderRadius:4, backgroundColor:C.primary },
    barLbl:   { fontSize:9, color:C.textMuted },
    barVal:   { fontSize:9, color:C.primary, fontWeight:'700' },
    todayLbl: { color:C.primary, fontWeight:'700' },
    empty:    { alignItems:'center', paddingVertical:60, gap:12 },
    emptyTxt: { fontSize:14, color:C.textMuted, textAlign:'center' },
    emptyBtn: { marginTop:8, backgroundColor:C.primary, borderRadius:12, paddingHorizontal:20, paddingVertical:11 },
    emptyBtnTxt: { fontSize:14, fontWeight:'700', color:'#fff' },
    sessRow:  { flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border },
    sessRowLast: { borderBottomWidth:0 },
    sessMode: { flex:1, fontSize:13, fontWeight:'600', color:C.text },
    sessSub:  { fontSize:11, color:C.textMuted },
    sessScore:{ fontSize:14, fontWeight:'700', color:C.primary },
    card:     { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, marginBottom:10 },
  });

  const maxAvg = Math.max(1, ...days.map(d => d.avg ?? 0));

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Weekly Report</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {speech.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyTxt}>No sessions this week yet. Start recording to build your weekly report.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Record', { mode:'Free Speech' })} activeOpacity={0.85}>
              <Text style={s.emptyBtnTxt}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.lbl}>This Week</Text>
            <View style={s.statRow}>
              <View style={s.stat}><Text style={s.statVal}>{totalSessions}</Text><Text style={s.statLbl}>Sessions</Text></View>
              <View style={s.stat}><Text style={s.statVal}>{activeDays}/7</Text><Text style={s.statLbl}>Active Days</Text></View>
              <View style={s.stat}><Text style={s.statVal}>{avgScore ?? '—'}</Text><Text style={s.statLbl}>Avg Score</Text></View>
            </View>
            <Text style={s.lbl}>Score by Day</Text>
            <View style={s.card}>
              <View style={s.barRow}>
                {days.map((d, i) => (
                  <View key={i} style={s.barCol}>
                    {d.avg != null && <Text style={s.barVal}>{d.avg}</Text>}
                    <View style={[s.barBg, { height: 72 }]}>
                      {d.avg != null && (
                        <View style={[s.barFill, { height: `${Math.round((d.avg / maxAvg) * 100)}%` as any }]} />
                      )}
                    </View>
                    <Text style={[s.barLbl, d.isToday && s.todayLbl]}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            {week.length > 0 && (
              <>
                <Text style={s.lbl}>Sessions This Week</Text>
                <View style={s.card}>
                  {week.map((sess, i) => {
                    // Session number: position in the full speech list (oldest = 1)
                    const globalIdx = speech.indexOf(sess);
                    const sessNum   = speech.length - globalIdx;
                    return (
                      <View key={sess.id ?? i} style={[s.sessRow, i===week.length-1 && s.sessRowLast]}>
                        <View style={{ flex:1 }}>
                          <Text style={s.sessMode}>Session {sessNum}</Text>
                          <Text style={s.sessSub}>{sess.created_at ? new Date(sess.created_at).toLocaleDateString() : ''} · {sess.wpm > 0 ? `${sess.wpm} WPM` : ''}</Text>
                        </View>
                        <Text style={s.sessScore}>{sess.score}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
