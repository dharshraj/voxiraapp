/**
 * GoalSelectionScreen
 * Persists selected goals to userStore → Supabase profiles.goals column.
 * Goals are readable anywhere via useUserStore(s => s.profile?.goals).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

const GOAL_OPTIONS = [
  { id: 'public_speaking',   icon: 'mic-outline',           label: 'Improve public speaking',       sub: 'Presentations, speeches, pitches' },
  { id: 'filler_words',      icon: 'warning-outline',       label: 'Reduce filler words',           sub: 'Eliminate um, uh, like, you know' },
  { id: 'confidence',        icon: 'trending-up-outline',   label: 'Build speaking confidence',     sub: 'Sound more assured and authoritative' },
  { id: 'pace',              icon: 'speedometer-outline',   label: 'Control speaking pace',         sub: 'Hit the ideal 120–150 WPM range' },
  { id: 'clarity',           icon: 'volume-high-outline',   label: 'Improve pronunciation clarity', sub: 'Articulate every word cleanly' },
  { id: 'interviews',        icon: 'people-outline',        label: 'Prepare for interviews',        sub: 'Job interviews and presentations' },
  { id: 'daily_habit',       icon: 'calendar-outline',      label: 'Build a daily practice habit',  sub: 'Consistent daily recording sessions' },
];

export default function GoalSelectionScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId        = useAuthStore(s => s.user?.id);
  const updateProfile = useUserStore(s => s.updateProfile);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const onContinue = async () => {
    if (selected.length === 0) { setError('Select at least one goal to continue.'); return; }
    setError('');
    setSaving(true);
    // Persist to profiles.goals — readable via useUserStore anywhere in the app
    if (userId) {
      await updateProfile({ goals: selected });
    }
    setSaving(false);
    navigation.navigate('ExperienceLevel');
  };

  const s = StyleSheet.create({
    root:     { flex: 1, backgroundColor: C.bg },
    header:   { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16 },
    step:     { fontSize: 12, color: C.textMuted, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
    heading:  { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 6 },
    sub:      { fontSize: 14, color: C.textSec, lineHeight: 21 },
    scroll:   { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    card:     { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardActive:{ borderColor: C.primary, backgroundColor: C.primaryLight },
    cardIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardIconA:{ backgroundColor: C.primary + '20' },
    cardText: { flex: 1 },
    cardLabel:{ fontSize: 14, fontWeight: '600', color: C.text },
    cardSub:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
    check:    { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    error:    { fontSize: 13, color: C.error, textAlign: 'center', marginBottom: 8 },
    footer:   { paddingHorizontal: 20, paddingBottom: 32 },
    btn:      { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnDis:   { opacity: 0.5 },
    btnTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <Text style={s.step}>STEP 1 OF 2</Text>
        <Text style={s.heading}>What are your goals?</Text>
        <Text style={s.sub}>Select all that apply — you can change these later in your profile.</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.scroll}
        style={[, Platform.OS === 'web' && ({ overflowY: 'auto' } as any)]}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map(opt => {
          const active = selected.includes(opt.id);
          return (
            <TouchableOpacity key={opt.id} style={[s.card, active && s.cardActive]} onPress={() => toggle(opt.id)} activeOpacity={0.8}>
              <View style={[s.cardIcon, active && s.cardIconA]}>
                <Ionicons name={opt.icon as any} size={20} color={active ? C.primary : C.textMuted} />
              </View>
              <View style={s.cardText}>
                <Text style={s.cardLabel}>{opt.label}</Text>
                <Text style={s.cardSub}>{opt.sub}</Text>
              </View>
              {active && <View style={s.check}><Ionicons name="checkmark" size={14} color="#fff" /></View>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={s.footer}>
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={[s.btn, saving && s.btnDis]} onPress={onContinue} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnTxt}>Continue</Text>}
          {!saving && <Ionicons name="chevron-forward" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
