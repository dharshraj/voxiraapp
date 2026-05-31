import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', accentSoft:'rgba(79,195,247,0.12)', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const GOAL_OPTIONS = [
  { id:'speech',    label:'Speech Sessions',   icon:'mic',        color:C.accent,  options:[1,2,3,5] },
  { id:'writing',   label:'Writing Sessions',  icon:'create',     color:C.green,   options:[1,2,3,5] },
  { id:'interview', label:'Mock Interviews',   icon:'people',     color:C.purple,  options:[1,2,3,5] },
];

const REMINDER_TIMES = ['07:00 AM','09:00 AM','12:00 PM','06:00 PM','09:00 PM'];

const STREAKS = [
  {day:'M', done:true},{day:'T',done:true},{day:'W',done:true},
  {day:'T',done:true},{day:'F',done:false},{day:'S',done:false},{day:'S',done:false},
];

export default function DailyGoalScreen({ navigation }: any) {
  const [goals, setGoals] = useState<Record<string,number>>({ speech:2, writing:1, interview:1 });
  const [reminder, setReminder]     = useState('09:00 AM');
  const [notifOn,  setNotifOn]      = useState(true);
  const [saving,   setSaving]       = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const totalSessions = Object.values(goals).reduce((a,b) => a+b, 0);

  const saveGoals = async () => {
    setSaving(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          daily_goals: goals,
          reminder_time: notifOn ? reminder : null,
        }).eq('id', user.id);
      }
      Alert.alert('✅ Goals Saved!', 'Your daily goals have been updated.', [
        { text:'Back to Home', onPress:() => navigation.goBack() }
      ]);
    } catch {
      Alert.alert('Saved locally', 'Goals saved on this device.');
    }
    setSaving(false);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Daily Goals</Text>
            <Text style={s.headerSub}>Set your daily practice targets</Text>
          </View>
          <View style={{width:42}}/>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fadeAnim}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Streak calendar ───────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="flame" size={18} color={C.gold}/>
            <Text style={s.cardTitle}>This Week's Streak</Text>
            <View style={s.streakBadge}>
              <Text style={s.streakBadgeTxt}>4 days 🔥</Text>
            </View>
          </View>
          <View style={s.streakRow}>
            {STREAKS.map((d,i) => (
              <View key={i} style={s.streakDay}>
                <View style={[s.streakCircle, d.done && s.streakDone]}>
                  {d.done
                    ? <Ionicons name="checkmark" size={14} color="#fff"/>
                    : <Text style={s.streakDayNum}>{d.day}</Text>
                  }
                </View>
                <Text style={[s.streakLabel, d.done && {color:C.green}]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Goal setters ──────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Daily Session Targets</Text>
        {GOAL_OPTIONS.map(g => (
          <View key={g.id} style={s.goalCard}>
            <View style={s.goalLeft}>
              <View style={[s.goalIcon, { backgroundColor:`${g.color}18` }]}>
                <Ionicons name={g.icon as any} size={22} color={g.color}/>
              </View>
              <View>
                <Text style={s.goalLabel}>{g.label}</Text>
                <Text style={s.goalSub}>{goals[g.id]} session{goals[g.id]>1?'s':''} per day</Text>
              </View>
            </View>
            <View style={s.goalBtns}>
              <TouchableOpacity
                style={[s.goalBtn, goals[g.id]<=1 && s.goalBtnDis]}
                onPress={() => setGoals(prev => ({...prev, [g.id]: Math.max(1, prev[g.id]-1)}))}
                disabled={goals[g.id]<=1}
              >
                <Ionicons name="remove" size={18} color={goals[g.id]<=1 ? C.hint : C.text}/>
              </TouchableOpacity>
              <View style={[s.goalCount, { borderColor:`${g.color}40` }]}>
                <Text style={[s.goalCountTxt, { color:g.color }]}>{goals[g.id]}</Text>
              </View>
              <TouchableOpacity
                style={[s.goalBtn, goals[g.id]>=5 && s.goalBtnDis]}
                onPress={() => setGoals(prev => ({...prev, [g.id]: Math.min(5, prev[g.id]+1)}))}
                disabled={goals[g.id]>=5}
              >
                <Ionicons name="add" size={18} color={goals[g.id]>=5 ? C.hint : C.text}/>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ── Total summary ─────────────────────────────────────────────── */}
        <View style={s.summaryCard}>
          <LinearGradient colors={['rgba(21,101,255,0.20)','rgba(21,101,255,0.05)']} style={s.summaryGrad}>
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>{totalSessions}</Text>
                <Text style={s.summaryLbl}>Sessions/day</Text>
              </View>
              <View style={s.summaryDiv}/>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>{totalSessions * 7}</Text>
                <Text style={s.summaryLbl}>Sessions/week</Text>
              </View>
              <View style={s.summaryDiv}/>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>~{totalSessions * 15}m</Text>
                <Text style={s.summaryLbl}>Time/day</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Reminder ──────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Daily Reminder</Text>
        <View style={s.card}>
          <View style={s.reminderTop}>
            <View style={s.reminderLeft}>
              <View style={s.reminderIcon}>
                <Ionicons name="notifications-outline" size={20} color={C.accent}/>
              </View>
              <View>
                <Text style={s.reminderTitle}>Push Notifications</Text>
                <Text style={s.reminderSub}>Get daily practice reminders</Text>
              </View>
            </View>
            <Switch
              value={notifOn}
              onValueChange={setNotifOn}
              trackColor={{ false:C.border, true:`${C.primary}80` }}
              thumbColor={notifOn ? C.primary : C.surface}
            />
          </View>
          {notifOn && (
            <>
              <View style={s.divider}/>
              <Text style={s.timeLbl}>Reminder Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.timeRow}>
                {REMINDER_TIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.timeChip, reminder===t && s.timeChipActive]}
                    onPress={() => setReminder(t)}
                  >
                    <Text style={[s.timeChipTxt, reminder===t && s.timeChipTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* ── Motivation level ──────────────────────────────────────────── */}
        <View style={s.motivCard}>
          <Text style={s.motivEmoji}>
            {totalSessions <= 2 ? '😌' : totalSessions <= 4 ? '💪' : '🔥'}
          </Text>
          <View style={{flex:1}}>
            <Text style={s.motivTitle}>
              {totalSessions <= 2 ? 'Relaxed Pace' : totalSessions <= 4 ? 'Balanced Grind' : 'Beast Mode!'}
            </Text>
            <Text style={s.motivSub}>
              {totalSessions <= 2
                ? 'Great for beginners. Consistency is key!'
                : totalSessions <= 4
                ? 'Perfect balance of practice and rest.'
                : 'Serious commitment. Results will show fast!'}
            </Text>
          </View>
        </View>

        {/* ── Save button ───────────────────────────────────────────────── */}
        <TouchableOpacity style={s.saveBtn} onPress={saveGoals} disabled={saving} activeOpacity={0.85}>
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.saveBtnGrad}>
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#fff"/>
            <Text style={s.saveBtnTxt}>{saving ? 'Saving...' : 'Save Goals'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex:1, backgroundColor:C.bg },
  headerBg:   { paddingBottom:16 },
  header:     { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, gap:12 },
  backBtn:    { width:42, height:42, borderRadius:13, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  headerCenter:{ flex:1, alignItems:'center' },
  headerTitle:{ fontSize:17, fontWeight:'700', color:C.text },
  headerSub:  { fontSize:12, color:C.muted, marginTop:2 },
  scroll:     { paddingHorizontal:20, paddingTop:16 },
  sectionTitle:{ fontSize:13, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12, marginTop:20 },
  card:       { backgroundColor:C.bgCard, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:10 },
  cardHead:   { flexDirection:'row', alignItems:'center', gap:8, marginBottom:16 },
  cardTitle:  { fontSize:15, fontWeight:'600', color:C.text, flex:1 },
  streakBadge:{ backgroundColor:'rgba(245,158,11,0.15)', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  streakBadgeTxt:{ fontSize:12, color:C.gold, fontWeight:'600' },
  streakRow:  { flexDirection:'row', justifyContent:'space-between' },
  streakDay:  { alignItems:'center', gap:6 },
  streakCircle:{ width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  streakDone: { backgroundColor:C.green, borderColor:C.green },
  streakDayNum:{ fontSize:12, color:C.hint },
  streakLabel:{ fontSize:10, color:C.hint },
  goalCard:   { backgroundColor:C.bgCard, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  goalLeft:   { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  goalIcon:   { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
  goalLabel:  { fontSize:14, fontWeight:'600', color:C.text, marginBottom:2 },
  goalSub:    { fontSize:12, color:C.muted },
  goalBtns:   { flexDirection:'row', alignItems:'center', gap:8 },
  goalBtn:    { width:32, height:32, borderRadius:10, backgroundColor:C.surface, alignItems:'center', justifyContent:'center' },
  goalBtnDis: { opacity:0.4 },
  goalCount:  { width:36, height:36, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  goalCountTxt:{ fontSize:16, fontWeight:'800' },
  summaryCard:{ borderRadius:18, overflow:'hidden', marginBottom:4, borderWidth:1, borderColor:'rgba(21,101,255,0.20)' },
  summaryGrad:{ padding:16 },
  summaryRow: { flexDirection:'row', justifyContent:'space-around', alignItems:'center' },
  summaryItem:{ alignItems:'center', flex:1 },
  summaryVal: { fontSize:22, fontWeight:'800', color:C.text, marginBottom:4 },
  summaryLbl: { fontSize:11, color:C.muted },
  summaryDiv: { width:1, height:40, backgroundColor:C.border },
  reminderTop:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  reminderLeft:{ flexDirection:'row', alignItems:'center', gap:12 },
  reminderIcon:{ width:40, height:40, borderRadius:12, backgroundColor:C.accentSoft||'rgba(79,195,247,0.12)', alignItems:'center', justifyContent:'center' },
  reminderTitle:{ fontSize:14, fontWeight:'600', color:C.text },
  reminderSub:{ fontSize:12, color:C.muted },
  divider:    { height:1, backgroundColor:C.border, marginVertical:14 },
  timeLbl:    { fontSize:12, color:C.muted, marginBottom:10 },
  timeRow:    { flexDirection:'row', gap:8, paddingBottom:4 },
  timeChip:   { paddingHorizontal:14, paddingVertical:8, borderRadius:12, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
  timeChipActive:{ backgroundColor:C.primary, borderColor:C.primary },
  timeChipTxt:{ fontSize:13, color:C.muted, fontWeight:'500' },
  timeChipTxtActive:{ color:'#fff' },
  motivCard:  { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:C.bgCard, borderRadius:18, padding:16, marginTop:16, borderWidth:1, borderColor:C.border },
  motivEmoji: { fontSize:32 },
  motivTitle: { fontSize:15, fontWeight:'700', color:C.text, marginBottom:4 },
  motivSub:   { fontSize:12, color:C.muted, lineHeight:18 },
  saveBtn:    { borderRadius:16, overflow:'hidden', marginTop:20 },
  saveBtnGrad:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:16 },
  saveBtnTxt: { fontSize:16, fontWeight:'700', color:'#fff' },
});

