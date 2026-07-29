/**
 * CompareSessionsScreen — compares two sessions side by side.
 * Pulls from sessionStore (real data). No AI/stub needed.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`;
}

export default function CompareSessionsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(1);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const A = speech[idxA];
  const B = speech[idxB];

  const METRICS = [
    { key:'score',        label:'Score'        },
    { key:'clarity',      label:'Clarity'      },
    { key:'confidence',   label:'Confidence'   },
    { key:'pace',         label:'Pace'         },
    { key:'pronunciation',label:'Pronunciation'},
    { key:'wpm',          label:'WPM'          },
    { key:'filler_count', label:'Fillers'      },
  ] as const;

  const diff = (key: typeof METRICS[number]['key']) => {
    if (!A || !B) return null;
    const a = (A as any)[key] as number;
    const b = (B as any)[key] as number;
    if (key === 'filler_count') return b - a; // lower is better for fillers
    return a - b;
  };

  const s = StyleSheet.create({
    root:     { flex:1, backgroundColor:C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:   { paddingHorizontal:20, paddingBottom:80 },
    lbl:      { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, marginTop:16 },
    pickRow:  { flexDirection:'row', gap:10, marginBottom:4 },
    pickCard: { flex:1, backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:12 },
    pickLabel:{ fontSize:10, color:C.textMuted, fontWeight:'700', marginBottom:4 },
    pickMode: { fontSize:13, fontWeight:'700', color:C.text },
    pickSub:  { fontSize:11, color:C.textMuted, marginTop:2 },
    pickScore:{ fontSize:22, fontWeight:'800', color:C.primary, marginTop:4 },
    pickBtns: { flexDirection:'row', gap:6, marginTop:8, flexWrap:'wrap' },
    pickBtn:  { paddingHorizontal:8, paddingVertical:4, borderRadius:8, backgroundColor:C.bg, borderWidth:1, borderColor:C.border },
    pickBtnA: { borderColor:C.primary, backgroundColor:C.primaryLight },
    pickBtnTxt:{ fontSize:11, color:C.textMuted },
    pickBtnATxt:{ color:C.primary, fontWeight:'700' },
    table:    { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, overflow:'hidden', marginBottom:10 },
    row:      { flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.border, paddingVertical:11, paddingHorizontal:14, alignItems:'center' },
    rowLast:  { borderBottomWidth:0 },
    metricLbl:{ flex:1, fontSize:13, color:C.textSec },
    metricVal:{ width:44, fontSize:14, fontWeight:'700', textAlign:'center' },
    delta:    { width:44, fontSize:12, fontWeight:'700', textAlign:'center' },
    empty:    { alignItems:'center', paddingVertical:60, gap:12 },
    emptyTxt: { fontSize:14, color:C.textMuted, textAlign:'center' },
    emptyBtn: { marginTop:8, backgroundColor:C.primary, borderRadius:12, paddingHorizontal:20, paddingVertical:11 },
    emptyBtnTxt:{ fontSize:14, fontWeight:'700', color:'#fff' },
    colHdr:   { flexDirection:'row', paddingHorizontal:14, paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.border },
    colHdrTxt:{ fontSize:11, fontWeight:'700', color:C.textMuted, textAlign:'center' },
  });

  if (speech.length < 2) return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Compare Sessions</Text>
      </View>
      <View style={s.divider} />
      <View style={s.empty}>
        <Ionicons name="git-compare-outline" size={48} color={C.textMuted} />
        <Text style={s.emptyTxt}>You need at least 2 sessions to compare. Complete more recordings to unlock this feature.</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Record', { mode:'Free Speech' })} activeOpacity={0.85}>
          <Text style={s.emptyBtnTxt}>Start Recording</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Compare Sessions</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.lbl}>Select Sessions</Text>
        <View style={s.pickRow}>
          {(['A','B'] as const).map(slot => {
            const idx  = slot === 'A' ? idxA : idxB;
            const sess = speech[idx];
            const sessNum = speech.length - idx;
            return (
              <View key={slot} style={s.pickCard}>
                <Text style={s.pickLabel}>SESSION {slot}</Text>
                <Text style={s.pickMode}>Session {sessNum}</Text>
                <Text style={s.pickSub}>{timeAgo(sess?.created_at)}</Text>
                <Text style={s.pickScore}>{sess?.score}</Text>
                <View style={s.pickBtns}>
                  {speech.slice(0,6).map((_, i) => {
                    const active = slot === 'A' ? i === idxA : i === idxB;
                    return (
                      <TouchableOpacity key={i}
                        style={[s.pickBtn, active && s.pickBtnA]}
                        onPress={() => slot === 'A' ? setIdxA(i) : setIdxB(i)}
                        activeOpacity={0.75}>
                        <Text style={[s.pickBtnTxt, active && s.pickBtnATxt]}>#{i+1}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
        <Text style={s.lbl}>Metric Comparison</Text>
        <View style={s.table}>
          <View style={s.colHdr}>
            <Text style={[s.colHdrTxt, {flex:1}]}>METRIC</Text>
            <Text style={[s.colHdrTxt, {width:44}]}>A</Text>
            <Text style={[s.colHdrTxt, {width:44}]}>B</Text>
            <Text style={[s.colHdrTxt, {width:44}]}>DIFF</Text>
          </View>
          {METRICS.map((m, i) => {
            const d = diff(m.key);
            const dColor = d == null ? C.textMuted : d > 0 ? C.success : d < 0 ? C.error : C.textMuted;
            const dTxt   = d == null ? '—' : d > 0 ? `+${d}` : String(d);
            return (
              <View key={m.key} style={[s.row, i === METRICS.length-1 && s.rowLast]}>
                <Text style={s.metricLbl}>{m.label}</Text>
                <Text style={s.metricVal}>{A ? (A as any)[m.key] : '—'}</Text>
                <Text style={s.metricVal}>{B ? (B as any)[m.key] : '—'}</Text>
                <Text style={[s.delta, { color: dColor }]}>{dTxt}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
