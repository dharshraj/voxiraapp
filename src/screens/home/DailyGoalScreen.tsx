import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

const REMINDER_TIMES = ['07:00 AM','09:00 AM','12:00 PM','06:00 PM','09:00 PM'];

// Days of the week labels
const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/** Returns 'YYYY-MM-DD' in local time for a given Date */
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Returns the Monday of the week containing `d` */
function weekMonday(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

export default function DailyGoalScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId       = useAuthStore(s => s.user?.id);
  const sessions     = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);

  const [speechTarget, setSpeechTarget] = useState(2);
  const [reminder,     setReminder]     = useState('09:00 AM');
  const [notifOn,      setNotifOn]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [savedOk,      setSavedOk]      = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load prefs + sessions on focus
  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
      if (userId) {
        loadSessions(userId);
        // Load saved goal from user_preferences
        supabase.from('user_preferences')
          .select('speech_daily_target, notif_remind_time, notif_master')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              if (data.speech_daily_target) setSpeechTarget(data.speech_daily_target);
              if (data.notif_remind_time)   setReminder(data.notif_remind_time);
              if (data.notif_master != null) setNotifOn(data.notif_master);
            }
          });
      }
    }, [userId])
  );

  // ── Derive real data from sessions ──────────────────────────────────────────

  const speechSessions = sessions.filter(s => s.type === 'speech') as SpeechSession[];

  // Today's session count
  const todayStr = toDateStr(new Date());
  const todayCount = speechSessions.filter(s =>
    s.created_at && toDateStr(new Date(s.created_at)) === todayStr
  ).length;

  const goalReached = todayCount >= speechTarget;

  // This week's active days (Mon–Sun of current week)
  const monday = weekMonday(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });

  const activeDatesSet = new Set(
    speechSessions
      .filter(s => s.created_at)
      .map(s => toDateStr(new Date(s.created_at!)))
  );

  const weekData = weekDays.map((dateStr, i) => ({
    label:  WEEK_DAYS[i],
    done:   activeDatesSet.has(dateStr),
    isToday: dateStr === todayStr,
  }));

  const weekActiveDays = weekData.filter(d => d.done).length;

  // ── Save goals ───────────────────────────────────────────────────────────────

  const saveGoals = async () => {
    if (!userId) return;
    setSaving(true);
    setSavedOk(false);

    const { error } = await supabase.from('user_preferences').upsert({
      user_id:             userId,
      speech_daily_target: speechTarget,
      notif_remind_time:   notifOn ? reminder : null,
      notif_master:        notifOn,
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'user_id' });

    setSaving(false);
    if (!error) {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    }
  };

  // ── Goal-reached notification ─────────────────────────────────────────────
  // Fires once per day when today's count exactly hits the target
  const prevTodayCount = useRef<number>(-1);
  if (prevTodayCount.current !== todayCount) {
    prevTodayCount.current = todayCount;
    if (todayCount === speechTarget && userId && todayCount > 0) {
      // Insert notification — best effort, non-blocking
      supabase.from('notifications').insert({
        user_id: userId,
        type:    'achievement',
        title:   'Daily Goal Reached!',
        body:    `You've completed ${speechTarget} speech session${speechTarget > 1 ? 's' : ''} today. Keep it up!`,
        icon:    'trophy-outline',
        color:   '#15803D',
        read:    false,
      }).then(({ error: ne }) => {
        if (ne) console.log('[DailyGoal] notification insert:', ne.message);
        else    console.log('[DailyGoal] Goal-reached notification inserted.');
      });
    }
  }

  const s = StyleSheet.create({
    root:          { flex:1, backgroundColor:C.bg, ...(Platform.OS==='web' && { height:'100%' as any }) },
    headerBg:      { backgroundColor:C.surface, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
    header:        { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, gap:12 },
    backBtn:       { width:38, height:38, borderRadius:10, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    headerCenter:  { flex:1, alignItems:'center' },
    headerTitle:   { fontSize:17, fontWeight:'700', color:C.text },
    headerSub:     { fontSize:12, color:C.textMuted, marginTop:2 },
    scroll:        { paddingHorizontal:20, paddingTop:16, paddingBottom:60 },
    sectionLabel:  { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, marginTop:20 },
    card:          { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:16, marginBottom:10 },

    // ── Week streak
    streakHead:    { flexDirection:'row', alignItems:'center', gap:8, marginBottom:14 },
    streakTitle:   { flex:1, fontSize:14, fontWeight:'700', color:C.text },
    streakBadge:   { backgroundColor:C.warning+'26', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
    streakBadgeTxt:{ fontSize:12, color:C.warning, fontWeight:'600' },
    weekRow:       { flexDirection:'row', justifyContent:'space-between' },
    dayCol:        { alignItems:'center', gap:5, flex:1 },
    dayCircle:     { width:34, height:34, borderRadius:17, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    dayDone:       { backgroundColor:C.success, borderColor:C.success },
    dayToday:      { borderColor:C.primary, borderWidth:2 },
    dayLbl:        { fontSize:10, color:C.textMuted },
    dayLblToday:   { color:C.primary, fontWeight:'700' },

    // ── Goal row
    goalCard:      { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
    goalLeft:      { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
    goalIcon:      { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
    goalLabel:     { fontSize:14, fontWeight:'600', color:C.text, marginBottom:2 },
    goalSub:       { fontSize:12, color:C.textMuted },
    goalBtns:      { flexDirection:'row', alignItems:'center', gap:8 },
    goalBtn:       { width:30, height:30, borderRadius:8, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    goalBtnDis:    { opacity:0.35 },
    goalCountBox:  { width:34, height:34, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
    goalCountTxt:  { fontSize:16, fontWeight:'800' },

    // ── Today progress
    progressCard:  { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:16, marginBottom:10 },
    progressHead:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
    progressTitle: { fontSize:14, fontWeight:'700', color:C.text },
    progressBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:C.success+'18', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
    progressBadgeTxt: { fontSize:12, color:C.success, fontWeight:'600' },
    progressBarBg: { height:8, backgroundColor:C.border, borderRadius:4, overflow:'hidden' },
    progressBarFill: { height:'100%' as any, borderRadius:4, backgroundColor:C.success },
    progressFill:  { height:'100%' as any, borderRadius:4, backgroundColor:C.primary },
    progressMeta:  { flexDirection:'row', justifyContent:'space-between', marginTop:6 },
    progressMetaTxt:{ fontSize:12, color:C.textMuted },

    // ── Summary
    summaryCard:   { backgroundColor:C.primaryLight, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, marginBottom:10 },
    summaryRow:    { flexDirection:'row', justifyContent:'space-around', alignItems:'center' },
    summaryItem:   { alignItems:'center', flex:1 },
    summaryVal:    { fontSize:20, fontWeight:'800', color:C.text, marginBottom:3 },
    summaryLbl:    { fontSize:11, color:C.textMuted },
    summaryDiv:    { width:1, height:36, backgroundColor:C.border },

    // ── Reminder
    reminderTop:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
    reminderLeft:  { flexDirection:'row', alignItems:'center', gap:12 },
    reminderIcon:  { width:38, height:38, borderRadius:10, backgroundColor:C.primaryLight, alignItems:'center', justifyContent:'center' },
    reminderTitle: { fontSize:14, fontWeight:'600', color:C.text },
    reminderSub:   { fontSize:12, color:C.textMuted },
    divider:       { height:1, backgroundColor:C.border, marginVertical:12 },
    timeLbl:       { fontSize:12, color:C.textMuted, marginBottom:8 },
    timeRow:       { flexDirection:'row', gap:8 },
    timeChip:      { paddingHorizontal:12, paddingVertical:7, borderRadius:10, borderWidth:1, borderColor:C.border, backgroundColor:C.bg },
    timeChipActive:{ backgroundColor:C.primary, borderColor:C.primary },
    timeChipTxt:   { fontSize:12, color:C.textMuted, fontWeight:'500' },
    timeChipTxtActive: { color:'#fff', fontWeight:'700' },

    // ── Motivational
    motivCard:     { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14, marginTop:8 },
    motivTitle:    { fontSize:14, fontWeight:'700', color:C.text, marginBottom:3 },
    motivSub:      { fontSize:12, color:C.textMuted, lineHeight:18 },

    // ── Save button
    saveBtn:       { backgroundColor:C.primary, borderRadius:14, marginTop:20, overflow:'hidden' },
    saveBtnInner:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:15 },
    saveBtnTxt:    { fontSize:15, fontWeight:'700', color:'#fff' },

    // ── Banner
    banner:        { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:C.success+'18', borderRadius:10, padding:10, marginTop:10, borderWidth:1, borderColor:C.success+'40' },
    bannerTxt:     { fontSize:13, color:C.success, fontWeight:'500' },
  });

  const fillPct = Math.min(1, todayCount / Math.max(1, speechTarget));

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={18} color={C.textMuted} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Daily Goals</Text>
            <Text style={s.headerSub}>Set your daily practice targets</Text>
          </View>
          <View style={{ width:38 }} />
        </View>
      </View>

      <Animated.ScrollView
        style={[{ opacity:fadeAnim }, { flex: 1 }]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── This week's streak (real data) */}
        <Text style={s.sectionLabel}>This Week</Text>
        <View style={s.card}>
          <View style={s.streakHead}>
            <Ionicons name="flame-outline" size={17} color={C.warning} />
            <Text style={s.streakTitle}>Active Days</Text>
            <View style={s.streakBadge}>
              <Text style={s.streakBadgeTxt}>{weekActiveDays} / 7 days</Text>
            </View>
          </View>
          <View style={s.weekRow}>
            {weekData.map((d, i) => (
              <View key={i} style={s.dayCol}>
                <View style={[s.dayCircle, d.done && s.dayDone, (!d.done && d.isToday) && s.dayToday]}>
                  {d.done
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={{ fontSize:10, color:d.isToday ? C.primary : C.textMuted }}>{d.label[0]}</Text>}
                </View>
                <Text style={[s.dayLbl, d.isToday && s.dayLblToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Today's progress (real data) */}
        <Text style={s.sectionLabel}>Today's Progress</Text>
        <View style={s.progressCard}>
          <View style={s.progressHead}>
            <Text style={s.progressTitle}>Speech Sessions</Text>
            {goalReached && (
              <View style={s.progressBadge}>
                <Ionicons name="checkmark-circle" size={13} color={C.success} />
                <Text style={s.progressBadgeTxt}>Goal Reached!</Text>
              </View>
            )}
          </View>
          <View style={s.progressBarBg}>
            <View style={[goalReached ? s.progressBarFill : s.progressFill, { width:`${fillPct*100}%` as any }]} />
          </View>
          <View style={s.progressMeta}>
            <Text style={s.progressMetaTxt}>{todayCount} completed today</Text>
            <Text style={s.progressMetaTxt}>Target: {speechTarget}</Text>
          </View>
        </View>

        {/* ── Set target */}
        <Text style={s.sectionLabel}>Daily Session Target</Text>
        <View style={s.goalCard}>
          <View style={s.goalLeft}>
            <View style={[s.goalIcon, { backgroundColor:C.primary+'18' }]}>
              <Ionicons name="mic-outline" size={20} color={C.primary} />
            </View>
            <View>
              <Text style={s.goalLabel}>Speech Sessions</Text>
              <Text style={s.goalSub}>{speechTarget} session{speechTarget > 1 ? 's' : ''} per day</Text>
            </View>
          </View>
          <View style={s.goalBtns}>
            <TouchableOpacity
              style={[s.goalBtn, speechTarget <= 1 && s.goalBtnDis]}
              onPress={() => setSpeechTarget(t => Math.max(1, t-1))}
              disabled={speechTarget <= 1}
              activeOpacity={0.75}
            >
              <Ionicons name="remove" size={16} color={speechTarget <= 1 ? C.textMuted : C.text} />
            </TouchableOpacity>
            <View style={[s.goalCountBox, { borderColor:C.primary+'55' }]}>
              <Text style={[s.goalCountTxt, { color:C.primary }]}>{speechTarget}</Text>
            </View>
            <TouchableOpacity
              style={[s.goalBtn, speechTarget >= 5 && s.goalBtnDis]}
              onPress={() => setSpeechTarget(t => Math.min(5, t+1))}
              disabled={speechTarget >= 5}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={16} color={speechTarget >= 5 ? C.textMuted : C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Summary */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryVal}>{speechTarget}</Text>
              <Text style={s.summaryLbl}>Sessions/day</Text>
            </View>
            <View style={s.summaryDiv} />
            <View style={s.summaryItem}>
              <Text style={s.summaryVal}>{speechTarget * 7}</Text>
              <Text style={s.summaryLbl}>Sessions/week</Text>
            </View>
            <View style={s.summaryDiv} />
            <View style={s.summaryItem}>
              <Text style={s.summaryVal}>~{speechTarget * 15}m</Text>
              <Text style={s.summaryLbl}>Est. time/day</Text>
            </View>
          </View>
        </View>

        {/* ── Reminder */}
        <Text style={s.sectionLabel}>Daily Reminder</Text>
        <View style={s.card}>
          <View style={s.reminderTop}>
            <View style={s.reminderLeft}>
              <View style={s.reminderIcon}>
                <Ionicons name="notifications-outline" size={18} color={C.primary} />
              </View>
              <View>
                <Text style={s.reminderTitle}>Push Notifications</Text>
                <Text style={s.reminderSub}>Get daily practice reminders</Text>
              </View>
            </View>
            <Switch
              value={notifOn}
              onValueChange={setNotifOn}
              trackColor={{ false:C.border, true:C.primary+'80' }}
              thumbColor={notifOn ? C.primary : C.textMuted}
            />
          </View>
          {notifOn && (
            <>
              <View style={s.divider} />
              <Text style={s.timeLbl}>Reminder Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.timeRow}>
                {REMINDER_TIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.timeChip, reminder===t && s.timeChipActive]}
                    onPress={() => setReminder(t)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.timeChipTxt, reminder===t && s.timeChipTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* ── Motivational message */}
        <View style={s.motivCard}>
          <Text style={s.motivTitle}>
            {goalReached ? 'Goal reached today!' : speechTarget <= 2 ? 'Steady Pace' : speechTarget <= 4 ? 'Balanced Grind' : 'High Intensity'}
          </Text>
          <Text style={s.motivSub}>
            {goalReached
              ? `You've hit your target of ${speechTarget} session${speechTarget>1?'s':''} today. A notification has been sent.`
              : speechTarget <= 2
              ? 'Great for building a consistent habit. Show up every day.'
              : speechTarget <= 4
              ? 'A strong commitment. Balance practice with rest.'
              : 'Serious effort. Results will compound quickly with this frequency.'}
          </Text>
        </View>

        {/* ── Save */}
        <TouchableOpacity style={s.saveBtn} onPress={saveGoals} disabled={saving} activeOpacity={0.85}>
          <View style={s.saveBtnInner}>
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={18} color="#fff" />
            <Text style={s.saveBtnTxt}>{saving ? 'Saving…' : 'Save Goals'}</Text>
          </View>
        </TouchableOpacity>

        {savedOk && (
          <View style={s.banner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={C.success} />
            <Text style={s.bannerTxt}>Goals saved successfully.</Text>
          </View>
        )}

        <View style={{ height:40 }} />
      </Animated.ScrollView>
    </View>
  );
}
