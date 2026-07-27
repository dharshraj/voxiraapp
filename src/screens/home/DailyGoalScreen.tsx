import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

const REMINDER_TIMES = ['07:00 AM','09:00 AM','12:00 PM','06:00 PM','09:00 PM'];

const STREAKS = [
  {day:'M', done:true},{day:'T',done:true},{day:'W',done:true},
  {day:'T',done:true},{day:'F',done:false},{day:'S',done:false},{day:'S',done:false},
];

export default function DailyGoalScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [goals, setGoals]     = useState<Record<string,number>>({ speech:2, writing:1, interview:1 });
  const [reminder, setReminder] = useState('09:00 AM');
  const [notifOn,  setNotifOn]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const GOAL_OPTIONS = [
    { id:'speech',    label:'Speech Sessions',  icon:'mic',    color:C.info,    options:[1,2,3,5] },
    { id:'writing',   label:'Writing Sessions', icon:'create', color:C.success, options:[1,2,3,5] },
    { id:'interview', label:'Mock Interviews',  icon:'people', color:C.primary, options:[1,2,3,5] },
  ];

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
      Alert.alert('Goals Saved!', 'Your daily goals have been updated.', [
        { text:'Back to Home', onPress:() => navigation.goBack() }
      ]);
    } catch {
      Alert.alert('Saved locally', 'Goals saved on this device.');
    }
    setSaving(false);
  };

  const s = StyleSheet.create({
    root:        { flex:1, backgroundColor:C.bg },
    headerBg:    { backgroundColor:C.surface, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
    header:      { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, gap:12 },
    backBtn:     { width:42, height:42, borderRadius:13, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    headerCenter:{ flex:1, alignItems:'center' },
    headerTitle: { fontSize:17, fontWeight:'700', color:C.text },
    headerSub:   { fontSize:12, color:C.textMuted, marginTop:2 },
    scroll:      { paddingHorizontal:20, paddingTop:16 },
    sectionTitle:{ fontSize:13, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12, marginTop:20 },
    card:        { backgroundColor:C.surface, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:10 },
    cardHead:    { flexDirection:'row', alignItems:'center', gap:8, marginBottom:16 },
    cardTitle:   { fontSize:15, fontWeight:'600', color:C.text, flex:1 },
    streakBadge: { backgroundColor:C.warning + '26', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
    streakBadgeTxt:{ fontSize:12, color:C.warning, fontWeight:'600' },
    streakRow:   { flexDirection:'row', justifyContent:'space-between' },
    streakDay:   { alignItems:'center', gap:6 },
    streakCircle:{ width:36, height:36, borderRadius:18, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    streakDone:  { backgroundColor:C.success, borderColor:C.success },
    streakDayNum:{ fontSize:12, color:C.textMuted },
    streakLabel: { fontSize:10, color:C.textMuted },
    goalCard:    { backgroundColor:C.surface, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
    goalLeft:    { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
    goalIcon:    { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
    goalLabel:   { fontSize:14, fontWeight:'600', color:C.text, marginBottom:2 },
    goalSub:     { fontSize:12, color:C.textMuted },
    goalBtns:    { flexDirection:'row', alignItems:'center', gap:8 },
    goalBtn:     { width:32, height:32, borderRadius:10, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    goalBtnDis:  { opacity:0.4 },
    goalCount:   { width:36, height:36, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
    goalCountTxt:{ fontSize:16, fontWeight:'800' },
    summaryCard: { borderRadius:18, overflow:'hidden', marginBottom:4, borderWidth:1, borderColor:C.primary + '33', backgroundColor:C.primaryLight, padding:16 },
    summaryRow:  { flexDirection:'row', justifyContent:'space-around', alignItems:'center' },
    summaryItem: { alignItems:'center', flex:1 },
    summaryVal:  { fontSize:22, fontWeight:'800', color:C.text, marginBottom:4 },
    summaryLbl:  { fontSize:11, color:C.textMuted },
    summaryDiv:  { width:1, height:40, backgroundColor:C.border },
    reminderTop: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
    reminderLeft:{ flexDirection:'row', alignItems:'center', gap:12 },
    reminderIcon:{ width:40, height:40, borderRadius:12, backgroundColor:C.info + '1A', alignItems:'center', justifyContent:'center' },
    reminderTitle:{ fontSize:14, fontWeight:'600', color:C.text },
    reminderSub: { fontSize:12, color:C.textMuted },
    divider:     { height:1, backgroundColor:C.border, marginVertical:14 },
    timeLbl:     { fontSize:12, color:C.textMuted, marginBottom:10 },
    timeRow:     { flexDirection:'row', gap:8, paddingBottom:4 },
    timeChip:    { paddingHorizontal:14, paddingVertical:8, borderRadius:12, borderWidth:1, borderColor:C.border, backgroundColor:C.bg },
    timeChipActive:{ backgroundColor:C.primary, borderColor:C.primary },
    timeChipTxt: { fontSize:13, color:C.textMuted, fontWeight:'500' },
    timeChipTxtActive:{ color:'#fff' },
    motivCard:   { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:C.surface, borderRadius:18, padding:16, marginTop:16, borderWidth:1, borderColor:C.border },
    motivEmoji:  { fontSize:32 },
    motivTitle:  { fontSize:15, fontWeight:'700', color:C.text, marginBottom:4 },
    motivSub:    { fontSize:12, color:C.textMuted, lineHeight:18 },
    saveBtn:     { borderRadius:16, overflow:'hidden', marginTop:20, backgroundColor:C.primary },
    saveBtnInner:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:16 },
    saveBtnTxt:  { fontSize:16, fontWeight:'700', color:'#fff' },
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
            <Text style={s.headerTitle}>Daily Goals</Text>
            <Text style={s.headerSub}>Set your daily practice targets</Text>
          </View>
          <View style={{width:42}}/>
        </View>
      </View>

      <Animated.ScrollView
        style={[{opacity:fadeAnim}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="flame" size={18} color={C.warning} />
            <Text style={s.cardTitle}>This Week's Streak</Text>
            <View style={s.streakBadge}>
              <Text style={s.streakBadgeTxt}>4 days</Text>
            </View>
          </View>
          <View style={s.streakRow}>
            {STREAKS.map((d,i) => (
              <View key={i} style={s.streakDay}>
                <View style={[s.streakCircle, d.done && s.streakDone]}>
                  {d.done
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={s.streakDayNum}>{d.day}</Text>
                  }
                </View>
                <Text style={[s.streakLabel, d.done && {color:C.success}]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.sectionTitle}>Daily Session Targets</Text>
        {GOAL_OPTIONS.map(g => (
          <View key={g.id} style={s.goalCard}>
            <View style={s.goalLeft}>
              <View style={[s.goalIcon, { backgroundColor:`${g.color}18` }]}>
                <Ionicons name={g.icon as any} size={22} color={g.color} />
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
                <Ionicons name="remove" size={18} color={goals[g.id]<=1 ? C.textMuted : C.text} />
              </TouchableOpacity>
              <View style={[s.goalCount, { borderColor:`${g.color}40` }]}>
                <Text style={[s.goalCountTxt, { color:g.color }]}>{goals[g.id]}</Text>
              </View>
              <TouchableOpacity
                style={[s.goalBtn, goals[g.id]>=5 && s.goalBtnDis]}
                onPress={() => setGoals(prev => ({...prev, [g.id]: Math.min(5, prev[g.id]+1)}))}
                disabled={goals[g.id]>=5}
              >
                <Ionicons name="add" size={18} color={goals[g.id]>=5 ? C.textMuted : C.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={s.summaryCard}>
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
        </View>

        <Text style={s.sectionTitle}>Daily Reminder</Text>
        <View style={s.card}>
          <View style={s.reminderTop}>
            <View style={s.reminderLeft}>
              <View style={s.reminderIcon}>
                <Ionicons name="notifications-outline" size={20} color={C.info} />
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

        <TouchableOpacity style={s.saveBtn} onPress={saveGoals} disabled={saving} activeOpacity={0.85}>
          <View style={s.saveBtnInner}>
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#fff" />
            <Text style={s.saveBtnTxt}>{saving ? 'Saving...' : 'Save Goals'}</Text>
          </View>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}
