/**
 * LevelUpScreen — shows current level, next level requirements, and progress.
 * Derives from sessionStore + userStore (real data, no stubs).
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';

const LEVELS = [
  { name:'Beginner',     minSessions:0,  minAvg:0,  icon:'leaf-outline',     color:'#15803D' },
  { name:'Intermediate', minSessions:5,  minAvg:60, icon:'flame-outline',     color:'#B45309' },
  { name:'Advanced',     minSessions:15, minAvg:75, icon:'rocket-outline',    color:'#7C3AED' },
  { name:'Expert',       minSessions:30, minAvg:85, icon:'trophy-outline',    color:'#F59E0B' },
];

export default function LevelUpScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const profile      = useUserStore(s => s.profile);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech    = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const count     = speech.length;
  const avgScore  = count ? Math.round(speech.reduce((a,s)=>a+s.score,0)/count) : 0;

  const currentLevelIdx = LEVELS.reduce((best, lv, i) =>
    count >= lv.minSessions && avgScore >= lv.minAvg ? i : best, 0);
  const currentLevel = LEVELS[currentLevelIdx];
  const nextLevel    = LEVELS[currentLevelIdx + 1];

  const sessProgress = nextLevel ? Math.min(1, count / nextLevel.minSessions) : 1;
  const scoreProgress = nextLevel ? Math.min(1, avgScore / nextLevel.minAvg) : 1;

  const s = StyleSheet.create({
    root:      { flex:1, backgroundColor:C.bg },
    header:    { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:   { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:     { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:   { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:    { paddingHorizontal:20, paddingBottom:80 },
    lbl:       { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, marginTop:16 },
    curCard:   { borderRadius:18, padding:24, alignItems:'center', gap:8 },
    curIcon:   { width:72, height:72, borderRadius:22, alignItems:'center', justifyContent:'center', marginBottom:4 },
    curName:   { fontSize:26, fontWeight:'800', color:'#fff' },
    curSub:    { fontSize:14, color:'rgba(255,255,255,0.75)' },
    nextCard:  { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:16, marginBottom:10 },
    nextTitle: { fontSize:14, fontWeight:'700', color:C.text, marginBottom:14 },
    reqRow:    { marginBottom:14 },
    reqLbl:    { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
    reqLblTxt: { fontSize:12, color:C.textSec },
    reqVal:    { fontSize:12, fontWeight:'700', color:C.text },
    barBg:     { height:6, backgroundColor:C.border, borderRadius:3, overflow:'hidden' },
    barFill:   { height:'100%' as any, borderRadius:3, backgroundColor:C.primary },
    allCard:   { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, overflow:'hidden' },
    lvRow:     { flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:1, borderBottomColor:C.border },
    lvRowLast: { borderBottomWidth:0 },
    lvIcon:    { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
    lvName:    { flex:1, fontSize:14, fontWeight:'600', color:C.text },
    lvBadge:   { borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
    lvBadgeTxt:{ fontSize:11, fontWeight:'700' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Level Up</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={[{ flex: 1 }, Platform.OS === 'web' && ({ overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.lbl}>Current Level</Text>
        <View style={[s.curCard, { backgroundColor: currentLevel.color }]}>
          <View style={[s.curIcon, { backgroundColor:'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={currentLevel.icon as any} size={36} color="#fff" />
          </View>
          <Text style={s.curName}>{currentLevel.name}</Text>
          <Text style={s.curSub}>{count} sessions · {avgScore} avg score</Text>
        </View>
        {nextLevel && (
          <>
            <Text style={s.lbl}>Progress to {nextLevel.name}</Text>
            <View style={s.nextCard}>
              <Text style={s.nextTitle}>Requirements for {nextLevel.name}</Text>
              <View style={s.reqRow}>
                <View style={s.reqLbl}>
                  <Text style={s.reqLblTxt}>Sessions</Text>
                  <Text style={s.reqVal}>{count} / {nextLevel.minSessions}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.round(sessProgress*100)}%` as any }]} />
                </View>
              </View>
              <View style={s.reqRow}>
                <View style={s.reqLbl}>
                  <Text style={s.reqLblTxt}>Average Score</Text>
                  <Text style={s.reqVal}>{avgScore} / {nextLevel.minAvg}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.round(scoreProgress*100)}%` as any }]} />
                </View>
              </View>
            </View>
          </>
        )}
        <Text style={s.lbl}>All Levels</Text>
        <View style={s.allCard}>
          {LEVELS.map((lv, i) => {
            const unlocked = count >= lv.minSessions && avgScore >= lv.minAvg;
            return (
              <View key={lv.name} style={[s.lvRow, i===LEVELS.length-1 && s.lvRowLast]}>
                <View style={[s.lvIcon, { backgroundColor: lv.color + '18' }]}>
                  <Ionicons name={lv.icon as any} size={18} color={lv.color} />
                </View>
                <Text style={s.lvName}>{lv.name}</Text>
                <View style={[s.lvBadge, { backgroundColor: unlocked ? lv.color + '18' : C.border }]}>
                  <Text style={[s.lvBadgeTxt, { color: unlocked ? lv.color : C.textMuted }]}>
                    {unlocked ? 'Unlocked' : `${lv.minSessions}+ sessions`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
