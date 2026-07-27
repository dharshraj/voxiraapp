import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)', danger:'#EF4444',
};

const GOALS  = ['Improve public speaking','Ace job interviews','Better workplace communication','Write better emails','Build confidence'];
const LEVELS = ['Beginner','Intermediate','Advanced','Expert'];

export default function EditProfileScreen({ navigation }: any) {
  const user          = useAuthStore(s => s.user);
  const profile       = useUserStore(s => s.profile);
  const profileLoading= useUserStore(s => s.loading);
  const updateProfile = useUserStore(s => s.updateProfile);

  const [fullName, setFullName] = useState('');
  const [bio,      setBio]      = useState('');
  const [level,    setLevel]    = useState('Beginner');
  const [goals,    setGoals]    = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);

  // Populate form from store profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
      setLevel(profile.level ?? 'Beginner');
      setGoals(profile.goals ?? []);
    } else if (user) {
      setFullName(user.user_metadata?.full_name ?? '');
    }
  }, [profile, user]);

  const email = profile?.email ?? user?.email ?? '';

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    setSaving(true);
    try {
      const ok = await updateProfile({
        full_name: fullName.trim(),
        bio:       bio.trim(),
        level,
        goals,
        email,
      });
      if (ok) {
        Alert.alert('Saved!', 'Your profile has been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Could not save. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  if (profileLoading && !profile) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'V';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={Platform.OS === 'web' ? ({ height: '100vh', overflowY: 'scroll' } as any) : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveTxt}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <LinearGradient colors={['#8B5CF6', '#F43F5E']} style={s.avatarGrad}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </LinearGradient>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.label}>FULL NAME</Text>
          <TextInput
            style={s.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={C.hint}
            autoCapitalize="words"
          />

          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={[s.input, { opacity: 0.5 }]}
            value={email}
            editable={false}
            placeholderTextColor={C.hint}
          />

          <Text style={s.label}>BIO</Text>
          <TextInput
            style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={C.hint}
            multiline
          />
        </View>

        {/* Level */}
        <Text style={s.sectionTitle}>Skill Level</Text>
        <View style={s.levelRow}>
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l}
              style={[s.levelCard, level === l && s.levelCardActive]}
              onPress={() => setLevel(l)}
              activeOpacity={0.8}
            >
              <Text style={[s.levelTxt, level === l && s.levelTxtActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals */}
        <Text style={s.sectionTitle}>Learning Goals</Text>
        <View style={s.goalsWrap}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g}
              style={[s.goalChip, goals.includes(g) && s.goalChipActive]}
              onPress={() => toggleGoal(g)}
              activeOpacity={0.8}
            >
              {goals.includes(g) && (
                <Ionicons name="checkmark-circle" size={14} color={C.primary} style={{ marginRight: 4 }} />
              )}
              <Text style={[s.goalTxt, goals.includes(g) && s.goalTxtActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { paddingBottom: 40 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, marginBottom: 24, gap: 10 },
  backBtn:       { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, textAlign: 'center' },
  saveBtn:       { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveTxt:       { fontSize: 14, fontWeight: '700', color: '#fff' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarGrad:    { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 28, fontWeight: '800', color: '#fff' },
  form:          { paddingHorizontal: 20, marginBottom: 24 },
  label:         { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input:         { backgroundColor: C.bgCard, borderRadius: 14, padding: 14, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12, paddingHorizontal: 20 },
  levelRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 24 },
  levelCard:     { flex: 1, backgroundColor: C.bgCard, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  levelCardActive: { borderColor: C.primary, backgroundColor: 'rgba(21,101,255,0.12)' },
  levelTxt:      { fontSize: 11, fontWeight: '600', color: C.muted },
  levelTxtActive:{ color: C.primary },
  goalsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  goalChip:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  goalChipActive:{ borderColor: 'rgba(21,101,255,0.5)', backgroundColor: 'rgba(21,101,255,0.10)' },
  goalTxt:       { fontSize: 13, color: C.muted },
  goalTxtActive: { color: C.text },
});
