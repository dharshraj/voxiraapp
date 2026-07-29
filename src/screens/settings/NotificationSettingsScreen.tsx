/**
 * NotificationSettingsScreen
 *
 * - Cream/beige theme via useTheme()
 * - Loads saved preferences from Supabase `user_preferences` table on mount
 * - Save button writes all toggles + reminder time to Supabase with the
 *   authenticated user_id — no silent failure, inline success/error feedback
 * - If the user_preferences table doesn't exist yet, shows an actionable hint
 *
 * Migration SQL (run once in Supabase SQL Editor if not already done):
 *   create table if not exists public.user_preferences (
 *     id             uuid primary key default uuid_generate_v4(),
 *     user_id        uuid unique not null references auth.users(id) on delete cascade,
 *     notif_master        boolean not null default true,
 *     notif_daily_remind  boolean not null default true,
 *     notif_streak_alert  boolean not null default true,
 *     notif_score_update  boolean not null default true,
 *     notif_tips          boolean not null default true,
 *     notif_achievements  boolean not null default true,
 *     notif_weekly        boolean not null default false,
 *     notif_remind_time   text    not null default '9:00 AM',
 *     updated_at          timestamptz not null default now()
 *   );
 *   alter table public.user_preferences enable row level security;
 *   create policy "Users manage own prefs" on public.user_preferences
 *     using (auth.uid() = user_id) with check (auth.uid() = user_id);
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Switch, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';

const TIMES = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','12:00 PM','5:00 PM','7:00 PM','9:00 PM'];

export default function NotificationSettingsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId = useAuthStore(s => s.user?.id);
  const fade   = useRef(new Animated.Value(0)).current;

  const [master,       setMaster]       = useState(true);
  const [dailyRemind,  setDailyRemind]  = useState(true);
  const [streakAlert,  setStreakAlert]  = useState(true);
  const [scoreUpdate,  setScoreUpdate]  = useState(true);
  const [tips,         setTips]         = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [weeklySummary,setWeeklySummary]= useState(false);
  const [remindTime,   setRemindTime]   = useState('9:00 AM');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saveStatus,   setSaveStatus]   = useState<'idle'|'success'|'error'>('idle');
  const [saveMsg,      setSaveMsg]      = useState('');

  // ── Load saved preferences ────────────────────────────────────────────────
  const loadPrefs = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();   // maybeSingle() returns null instead of error when no row

    if (error) {
      console.log('[NotifSettings] load error (table may not exist yet):', error.message);
    } else if (data) {
      setMaster(data.notif_master ?? true);
      setDailyRemind(data.notif_daily_remind ?? true);
      setStreakAlert(data.notif_streak_alert ?? true);
      setScoreUpdate(data.notif_score_update ?? true);
      setTips(data.notif_tips ?? true);
      setAchievements(data.notif_achievements ?? true);
      setWeeklySummary(data.notif_weekly ?? false);
      setRemindTime(data.notif_remind_time ?? '9:00 AM');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    loadPrefs();
  }, [loadPrefs]);

  // ── Save preferences ──────────────────────────────────────────────────────
  const save = async () => {
    if (!userId) {
      setSaveStatus('error');
      setSaveMsg('Not signed in — please log in again.');
      return;
    }
    setSaving(true);
    setSaveStatus('idle');
    console.log('[NotifSettings] Saving preferences for user:', userId);

    const payload = {
      user_id:            userId,
      notif_master:        master,
      notif_daily_remind:  dailyRemind,
      notif_streak_alert:  streakAlert,
      notif_score_update:  scoreUpdate,
      notif_tips:          tips,
      notif_achievements:  achievements,
      notif_weekly:        weeklySummary,
      notif_remind_time:   remindTime,
      updated_at:          new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    setSaving(false);
    if (error) {
      console.error('[NotifSettings] Save failed:', error.message, error.code);
      const msg = error.message.includes('does not exist') || error.code === '42P01'
        ? 'Table not found. Run the migration SQL in your Supabase dashboard first.'
        : `Save failed: ${error.message}`;
      setSaveStatus('error');
      setSaveMsg(msg);
    } else {
      console.log('[NotifSettings] Preferences saved.');
      setSaveStatus('success');
      setSaveMsg('Preferences saved.');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  const NOTIF_TYPES = [
    { label:'Daily Practice Reminder', icon:'alarm-outline',       color:C.primary, value:dailyRemind,    onToggle:setDailyRemind,   desc:'Remind me to practice daily'          },
    { label:'Streak Alerts',           icon:'flame-outline',        color:C.error,   value:streakAlert,    onToggle:setStreakAlert,    desc:'Alert when streak is at risk'         },
    { label:'Score Updates',           icon:'trending-up-outline',  color:C.success, value:scoreUpdate,    onToggle:setScoreUpdate,   desc:'When my score improves significantly'  },
    { label:'Daily Tips',              icon:'bulb-outline',         color:C.warning, value:tips,           onToggle:setTips,          desc:'A new communication tip each morning'  },
    { label:'Achievement Unlocked',    icon:'trophy-outline',       color:C.warning, value:achievements,   onToggle:setAchievements,  desc:'When I unlock a new achievement'       },
    { label:'Weekly Progress Summary', icon:'bar-chart-outline',    color:C.info,    value:weeklySummary,  onToggle:setWeeklySummary, desc:'Weekly summary of my progress'         },
  ];

  const s = StyleSheet.create({
    root:         { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14 },
    backBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, marginLeft: 10 },
    saveHdrBtn:   { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    saveHdrTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },
    divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },

    // Inline banner
    banner:       { marginHorizontal: 20, borderRadius: 10, padding: 11, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1 },
    bannerTxt:    { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },

    scroll:       { paddingHorizontal: 20, paddingBottom: 60 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },

    // Master toggle
    masterCard:   { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    masterLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
    masterIcon:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    masterTitle:  { fontSize: 14, fontWeight: '700', color: C.text },
    masterSub:    { fontSize: 12, color: C.textMuted, marginTop: 1 },

    // Type rows
    card:         { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    row:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderBottomWidth: 1, borderBottomColor: C.border },
    rowLast:      { borderBottomWidth: 0 },
    rowIcon:      { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    rowMeta:      { flex: 1 },
    rowLabel:     { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 1 },
    rowDesc:      { fontSize: 11, color: C.textMuted },

    // Time picker
    timeDesc:     { fontSize: 12, color: C.textMuted, marginBottom: 12 },
    timeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeChip:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    timeChipActive:{ backgroundColor: C.primary, borderColor: C.primary },
    timeChipTxt:  { fontSize: 12, color: C.textSec, fontWeight: '500' },
    timeChipTxtActive: { color: '#fff', fontWeight: '700' },

    // Save button
    saveBtn:      { marginTop: 24, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    saveBtnTxt:   { fontSize: 15, fontWeight: '700', color: '#fff' },
    saveBtnDisabled: { opacity: 0.6 },

    infoCard:     { flexDirection: 'row', gap: 10, backgroundColor: C.surface, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: C.border, marginTop: 16, alignItems: 'flex-start' },
    infoTxt:      { flex: 1, fontSize: 12, color: C.textSec, lineHeight: 18 },

    loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });

  if (loading) {
    return (
      <View style={[s.root, s.loadingWrap]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notification Settings</Text>
        <TouchableOpacity
          style={[s.saveHdrBtn, saving && s.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveHdrTxt}>Save</Text>}
        </TouchableOpacity>
      </View>
      <View style={s.divider} />

      {/* Inline save banner */}
      {saveStatus !== 'idle' && (
        <View style={[s.banner, {
          backgroundColor: saveStatus === 'success' ? C.success + '14' : C.error + '10',
          borderColor:     saveStatus === 'success' ? C.success + '50' : C.error + '40',
        }]}>
          <Ionicons
            name={saveStatus === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={16}
            color={saveStatus === 'success' ? C.success : C.error}
          />
          <Text style={[s.bannerTxt, { color: saveStatus === 'success' ? C.success : C.error }]}>
            {saveMsg}
          </Text>
        </View>
      )}

      <Animated.ScrollView
        style={[{ opacity: fade }, { flex: 1 }]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Master toggle */}
        <Text style={s.sectionLabel}>Master Switch</Text>
        <View style={s.masterCard}>
          <View style={s.masterLeft}>
            <View style={[s.masterIcon, { backgroundColor: master ? C.primaryLight : C.border }]}>
              <Ionicons name="notifications" size={20} color={master ? C.primary : C.textMuted} />
            </View>
            <View>
              <Text style={s.masterTitle}>All Notifications</Text>
              <Text style={s.masterSub}>{master ? 'Notifications are on' : 'All notifications muted'}</Text>
            </View>
          </View>
          <Switch
            value={master}
            onValueChange={v => { setMaster(v); setSaveStatus('idle'); }}
            trackColor={{ false: C.border, true: C.primary + '80' }}
            thumbColor={master ? C.primary : C.textMuted}
          />
        </View>

        {/* Type rows */}
        <Text style={s.sectionLabel}>Notification Types</Text>
        <View style={s.card}>
          {NOTIF_TYPES.map((n, i) => (
            <View key={i} style={[s.row, i === NOTIF_TYPES.length - 1 && s.rowLast, !master && { opacity: 0.4 }]}>
              <View style={[s.rowIcon, { backgroundColor: n.color + '18' }]}>
                <Ionicons name={n.icon as any} size={17} color={n.color} />
              </View>
              <View style={s.rowMeta}>
                <Text style={s.rowLabel}>{n.label}</Text>
                <Text style={s.rowDesc}>{n.desc}</Text>
              </View>
              <Switch
                value={master && n.value}
                onValueChange={master ? (v => { n.onToggle(v); setSaveStatus('idle'); }) : undefined}
                trackColor={{ false: C.border, true: C.primary + '80' }}
                thumbColor={(master && n.value) ? C.primary : C.textMuted}
                disabled={!master}
              />
            </View>
          ))}
        </View>

        {/* Reminder time */}
        <Text style={s.sectionLabel}>Reminder Time</Text>
        <View style={[s.card, { padding: 14 }]}>
          <Text style={s.timeDesc}>When would you like your daily practice reminder?</Text>
          <View style={s.timeGrid}>
            {TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.timeChip, remindTime === t && s.timeChipActive, !master && { opacity: 0.4 }]}
                onPress={() => { if (master) { setRemindTime(t); setSaveStatus('idle'); } }}
                activeOpacity={0.75}
              >
                <Text style={[s.timeChipTxt, remindTime === t && s.timeChipTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={C.primary} />
          <Text style={s.infoTxt}>
            Make sure notifications are allowed for Voxira in your device's system settings for these to take effect.
          </Text>
        </View>

        {/* Full-width Save button at bottom */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : (<>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={s.saveBtnTxt}>Save Preferences</Text>
              </>)}
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}
