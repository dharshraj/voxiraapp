/**
 * RewardsScreen — derives from sessionStore + userStore.
 * Coins are summed from unlocked achievements (same logic as AchievementsScreen).
 * Real unlock logic — no pre-unlocked badges.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';

// Mirrors AchievementsScreen achievement definitions
const ACHIEVEMENTS = [
  { id:'s1', title:'First Words',        coins:50,  compute:(d:any) => d.speechCount>=1  },
  { id:'s2', title:'Consistent Speaker', coins:100, compute:(d:any) => d.speechCount>=5  },
  { id:'s3', title:'10 Sessions',        coins:150, compute:(d:any) => d.speechCount>=10 },
  { id:'s4', title:'25 Sessions',        coins:250, compute:(d:any) => d.speechCount>=25 },
  { id:'s5', title:'Smooth Talker',      coins:100, compute:(d:any) => d.bestScore>=80   },
  { id:'s6', title:'High Achiever',      coins:200, compute:(d:any) => d.bestScore>=90   },
  { id:'s7', title:'Filler-Free',        coins:150, compute:(d:any) => d.fillerFreeCount>=1 },
  { id:'st1',title:'3-Day Streak',       coins:75,  compute:(d:any) => d.streakDays>=3   },
  { id:'st2',title:'7-Day Streak',       coins:150, compute:(d:any) => d.streakDays>=7   },
  { id:'st3',title:'30-Day Streak',      coins:500, compute:(d:any) => d.streakDays>=30  },
  { id:'m1', title:'Rising Star',        coins:100, compute:(d:any) => d.avgScore>=70    },
  { id:'m2', title:'Communication Pro',  coins:200, compute:(d:any) => d.avgScore>=85    },
];

const REWARDS = [
  { id:'r1', title:'Bronze Badge',   cost:100,  icon:'medal-outline',       color:'#CD7F32', desc:'First milestone reward' },
  { id:'r2', title:'Silver Badge',   cost:300,  icon:'medal-outline',       color:'#C0C0C0', desc:'Consistent practitioner' },
  { id:'r3', title:'Gold Badge',     cost:600,  icon:'trophy-outline',      color:'#FFD700', desc:'Dedicated speaker' },
  { id:'r4', title:'Streak Shield',  cost:150,  icon:'shield-outline',      color:'#06B6D4', desc:'Protect a streak break' },
  { id:'r5', title:'Pro Certificate',cost:1000, icon:'ribbon-outline',      color:'#7C3AED', desc:'Verified pro communicator' },
];

export default function RewardsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const profile      = useUserStore(s => s.profile);

  useFocusEffect(useCallback(() => { if (userId) loadSessions(userId); }, [userId]));

  const speech    = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const count     = speech.length;
  const bestScore = count ? Math.max(...speech.map(s => s.score)) : 0;
  const avgScore  = count ? speech.reduce((a,s) => a+s.score, 0) / count : 0;
  const fillerFreeCount = speech.filter(s => s.filler_count === 0).length;
  const streakDays = profile?.streak_days ?? 0;
  const liveData  = { speechCount: count, bestScore, avgScore, fillerFreeCount, streakDays };

  const unlocked  = ACHIEVEMENTS.filter(a => a.compute(liveData));
  const totalCoins = unlocked.reduce((a, ac) => a + ac.coins, 0);

  const s = StyleSheet.create({
    root:     { flex:1, backgroundColor:C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:   { paddingHorizontal:20, paddingBottom:80 },
    lbl:      { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, marginTop:16 },
    balCard:  { backgroundColor:C.primary, borderRadius:16, padding:20, alignItems:'center', gap:6 },
    balLbl:   { fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:'600', letterSpacing:0.8 },
    balVal:   { fontSize:48, fontWeight:'800', color:'#fff' },
    balSub:   { fontSize:12, color:'rgba(255,255,255,0.65)' },
    rewardCard:{ backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:12 },
    rewardIcon:{ width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center', flexShrink:0 },
    rewardMeta:{ flex:1 },
    rewardTitle:{ fontSize:14, fontWeight:'700', color:C.text },
    rewardDesc: { fontSize:12, color:C.textMuted, marginTop:2 },
    rewardCost: { flexDirection:'row', alignItems:'center', gap:4 },
    rewardCostTxt:{ fontSize:13, fontWeight:'700' },
    unlockBtn:{ paddingHorizontal:14, paddingVertical:8, borderRadius:10, alignItems:'center' },
    unlockTxt:{ fontSize:12, fontWeight:'700', color:'#fff' },
    lockedTxt:{ fontSize:12, fontWeight:'700', color:C.textMuted },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>Rewards</Text>
      </View>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.balCard}>
          <Text style={s.balLbl}>YOUR COINS</Text>
          <Text style={s.balVal}>{totalCoins}</Text>
          <Text style={s.balSub}>Earned from {unlocked.length} unlocked achievements</Text>
        </View>
        <Text style={s.lbl}>Available Rewards</Text>
        {REWARDS.map(r => {
          const canAfford = totalCoins >= r.cost;
          return (
            <View key={r.id} style={s.rewardCard}>
              <View style={[s.rewardIcon, { backgroundColor: r.color + '18' }]}>
                <Ionicons name={r.icon as any} size={22} color={r.color} />
              </View>
              <View style={s.rewardMeta}>
                <Text style={s.rewardTitle}>{r.title}</Text>
                <Text style={s.rewardDesc}>{r.desc}</Text>
                <View style={s.rewardCost}>
                  <Ionicons name="ellipse" size={8} color={canAfford ? C.success : C.textMuted} />
                  <Text style={[s.rewardCostTxt, { color: canAfford ? C.success : C.textMuted }]}>{r.cost} Coins</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.unlockBtn, { backgroundColor: canAfford ? C.primary : C.border }]}
                disabled={!canAfford} activeOpacity={0.85}
              >
                <Text style={canAfford ? s.unlockTxt : s.lockedTxt}>{canAfford ? 'Unlock' : 'Locked'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
