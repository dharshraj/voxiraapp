/**
 * StreakCalendarScreen — derives active days from real session timestamps.
 * No stubs — entirely from sessionStore.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';

const W = Dimensions.get('window').width;
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getMonthDays(year: number, month: number) {
  const first     = new Date(year, month, 1);
  const last      = new Date(year, month + 1, 0);
  const startDay  = (first.getDay() + 6) % 7; // Mon=0
  const totalDays = last.getDate();
  return { startDay, totalDays };
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function StreakCalendarScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const profile      = useUserStore(s => s.profile);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech      = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const activeDates = new Set(speech.filter(s => s.created_at).map(s => toDateStr(new Date(s.created_at!))));

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const { startDay, totalDays } = getMonthDays(year, month);
  const todayStr = toDateStr(now);

  const streakDays = profile?.streak_days ?? 0;
  const totalActive = activeDates.size;

  const cellSize = Math.floor((W - 48) / 7) - 2;

  const s = StyleSheet.create({
    root:     { flex:1, backgroundColor:C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:   { paddingHorizontal:16, paddingBottom:80 },
    lbl:      { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, marginTop:16, paddingHorizontal:4 },
    statRow:  { flexDirection:'row', gap:10, marginBottom:4, paddingHorizontal:4 },
    stat:     { flex:1, backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, alignItems:'center', gap:4 },
    statVal:  { fontSize:24, fontWeight:'800', color:C.text },
    statLbl:  { fontSize:10, color:C.textMuted },
    calCard:  { backgroundColor:C.surface, borderRadius:16, borderWidth:1, borderColor:C.border, padding:12, marginTop:8, marginHorizontal:4 },
    calMonth: { fontSize:15, fontWeight:'700', color:C.text, textAlign:'center', marginBottom:12 },
    dayHdrRow:{ flexDirection:'row', marginBottom:6 },
    dayHdrTxt:{ textAlign:'center', fontSize:10, fontWeight:'700', color:C.textMuted },
    calGrid:  { flexDirection:'row', flexWrap:'wrap', gap:2 },
    cell:     { width:cellSize, height:cellSize, borderRadius:cellSize/4, alignItems:'center', justifyContent:'center', backgroundColor:C.bg },
    cellDone: { backgroundColor:C.primary },
    cellToday:{ borderWidth:2, borderColor:C.primary },
    cellTxt:  { fontSize:11, color:C.textMuted },
    cellTxtDone:{ color:'#fff', fontWeight:'700' },
    legend:   { flexDirection:'row', gap:16, justifyContent:'center', marginTop:12 },
    legItem:  { flexDirection:'row', alignItems:'center', gap:6 },
    legDot:   { width:10, height:10, borderRadius:5 },
    legTxt:   { fontSize:11, color:C.textMuted },
  });

  const monthName = now.toLocaleString('default', { month:'long', year:'numeric' });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Streak Calendar</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.lbl}>Your Streak</Text>
        <View style={s.statRow}>
          <View style={s.stat}><Text style={s.statVal}>{streakDays}</Text><Text style={s.statLbl}>Current Streak</Text></View>
          <View style={s.stat}><Text style={s.statVal}>{totalActive}</Text><Text style={s.statLbl}>Active Days</Text></View>
        </View>
        <Text style={s.lbl}>{monthName}</Text>
        <View style={s.calCard}>
          <View style={s.dayHdrRow}>
            {DAYS.map(d => <Text key={d} style={[s.dayHdrTxt, { width:cellSize, marginRight:2 }]}>{d[0]}</Text>)}
          </View>
          <View style={s.calGrid}>
            {/* Empty leading cells */}
            {Array.from({ length: startDay }).map((_, i) => (
              <View key={`e${i}`} style={{ width:cellSize, height:cellSize }} />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day  = i + 1;
              const d    = new Date(year, month, day);
              const str  = toDateStr(d);
              const done = activeDates.has(str);
              const isToday = str === todayStr;
              return (
                <View key={day} style={[s.cell, done && s.cellDone, !done && isToday && s.cellToday]}>
                  <Text style={[s.cellTxt, done && s.cellTxtDone]}>{day}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.legend}>
            <View style={s.legItem}><View style={[s.legDot, { backgroundColor:C.primary }]} /><Text style={s.legTxt}>Practised</Text></View>
            <View style={s.legItem}><View style={[s.legDot, { backgroundColor:C.bg, borderWidth:1, borderColor:C.border }]} /><Text style={s.legTxt}>No session</Text></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
