/**
 * ExperienceLevelScreen
 * Persists selected level to userStore → Supabase profiles.level column.
 * Level is readable via useUserStore(s => s.profile?.level).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

const LEVELS = [
  {
    id: 'Beginner',
    icon: 'leaf-outline',
    label: 'Beginner',
    sub: 'I rarely speak in front of others and want to build a foundation',
    color: '#15803D',
  },
  {
    id: 'Intermediate',
    icon: 'flame-outline',
    label: 'Intermediate',
    sub: 'I speak occasionally and want to polish my delivery',
    color: '#B45309',
  },
  {
    id: 'Advanced',
    icon: 'rocket-outline',
    label: 'Advanced',
    sub: 'I speak regularly and want to eliminate specific weaknesses',
    color: '#7C3AED',
  },
];

export default function ExperienceLevelScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId        = useAuthStore(s => s.user?.id);
  const updateProfile = useUserStore(s => s.updateProfile);
  const [selected, setSelected] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const onContinue = async () => {
    if (!selected) { setError('Please select your experience level.'); return; }
    setError('');
    setSaving(true);
    // Persist to profiles.level — readable via useUserStore anywhere
    if (userId) {
      await updateProfile({ level: selected });
    }
    setSaving(false);
    navigation.navigate('Permissions');
  };

  const s = StyleSheet.create({
    root:     { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
    header:   { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 24 },
    step:     { fontSize: 12, color: C.textMuted, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
    heading:  { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 6 },
    sub:      { fontSize: 14, color: C.textSec, lineHeight: 21 },
    cards:    { gap: 12, marginBottom: 32 },
    card:     { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardActive:{ borderWidth: 2 },
    iconBox:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardText: { flex: 1 },
    cardLabel:{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 3 },
    cardSub:  { fontSize: 13, color: C.textMuted, lineHeight: 18 },
    check:    { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    error:    { fontSize: 13, color: C.error, textAlign: 'center', marginBottom: 10 },
    btn:      { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    btnDis:   { opacity: 0.5 },
    btnTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
    skip:     { alignItems: 'center' },
    skipTxt:  { fontSize: 14, color: C.textMuted },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <Text style={s.step}>STEP 2 OF 2</Text>
        <Text style={s.heading}>Your current level?</Text>
        <Text style={s.sub}>This helps us calibrate your first analysis benchmarks.</Text>
      </View>
      <View style={s.cards}>
        {LEVELS.map(lv => {
          const active = selected === lv.id;
          return (
            <TouchableOpacity
              key={lv.id}
              style={[s.card, active && { ...s.cardActive, borderColor: lv.color }]}
              onPress={() => { setSelected(lv.id); setError(''); }}
              activeOpacity={0.8}
            >
              <View style={[s.iconBox, { backgroundColor: lv.color + '18' }]}>
                <Ionicons name={lv.icon as any} size={24} color={lv.color} />
              </View>
              <View style={s.cardText}>
                <Text style={s.cardLabel}>{lv.label}</Text>
                <Text style={s.cardSub}>{lv.sub}</Text>
              </View>
              {active && (
                <View style={[s.check, { backgroundColor: lv.color }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <TouchableOpacity style={[s.btn, saving && s.btnDis]} onPress={onContinue} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnTxt}>Continue</Text>}
        {!saving && <Ionicons name="chevron-forward" size={18} color="#fff" />}
      </TouchableOpacity>
      <TouchableOpacity style={s.skip} onPress={() => navigation.navigate('Permissions')} activeOpacity={0.75}>
        <Text style={s.skipTxt}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}
