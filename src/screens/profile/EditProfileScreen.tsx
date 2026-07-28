/**
 * EditProfileScreen
 *
 * - Cream/beige theme via useTheme()
 * - Profile photo: pick from device gallery (expo-image-picker),
 *   upload to Supabase Storage bucket "avatars", save URL to profiles table
 * - Save button wired with await + inline success/error banner (no silent failure)
 * - All form state initialised from real profile data
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';

const GOALS  = ['Improve public speaking', 'Better workplace communication', 'Build confidence', 'Prepare for presentations', 'Reduce filler words'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function EditProfileScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const user           = useAuthStore(s => s.user);
  const profile        = useUserStore(s => s.profile);
  const profileLoading = useUserStore(s => s.loading);
  const updateProfile  = useUserStore(s => s.updateProfile);

  const [fullName,   setFullName]   = useState('');
  const [bio,        setBio]        = useState('');
  const [level,      setLevel]      = useState('Beginner');
  const [goals,      setGoals]      = useState<string[]>([]);
  const [avatarUri,  setAvatarUri]  = useState<string | null>(null); // local preview URI
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null); // persisted remote URL
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMsg,    setSaveMsg]    = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
      setLevel(profile.level ?? 'Beginner');
      setGoals(profile.goals ?? []);
      setAvatarUrl(profile.avatar_url ?? null);
    } else if (user) {
      setFullName(user.user_metadata?.full_name ?? '');
    }
  }, [profile, user]);

  const email    = profile?.email ?? user?.email ?? '';
  const initials = fullName.trim()
    ? fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (email[0] ?? 'V').toUpperCase();

  // ── Photo picker + upload ─────────────────────────────────────────────────

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setSaveStatus('error');
      setSaveMsg('Gallery permission is required to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setAvatarUri(asset.uri);
    setSaveStatus('idle');

    // Upload immediately so we have a URL ready when Save is tapped
    await uploadAvatar(asset.uri);
  };

  const uploadAvatar = async (localUri: string) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      // On web, ImagePicker returns a blob: or data: URI.
      // fetch() on a blob: URI works in browser but NOT in the Expo web
      // runtime on some environments. Use base64 instead — universally safe.
      let base64Data: string;
      let mimeType = 'image/jpeg';

      if (localUri.startsWith('data:')) {
        // data URI — split header from data
        const [header, data] = localUri.split(',');
        base64Data = data;
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
      } else {
        // blob: or file: URI — use ImagePicker's base64 field when available,
        // otherwise re-launch with base64:true. For now fetch as blob then
        // convert to base64 via FileReader (works reliably in browsers).
        const res = await fetch(localUri);
        if (!res.ok) throw new Error(`Could not read image (HTTP ${res.status})`);
        const blob = await res.blob();
        mimeType = blob.type || 'image/jpeg';
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(blob);
        });
      }

      const ext  = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      // Decode base64 → Uint8Array for the Supabase storage upload
      const byteChars = atob(base64Data);
      const byteNums  = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, byteNums, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error('[EditProfile] Avatar upload error:', uploadError.message);
        // If bucket doesn't exist yet, give an actionable message
        const msg = uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')
          ? 'Storage bucket "avatars" not found. Run the migration SQL in your Supabase dashboard first.'
          : `Photo upload failed: ${uploadError.message}`;
        setSaveStatus('error');
        setSaveMsg(msg);
        setUploading(false);
        return;
      }

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = publicData?.publicUrl ?? null;
      console.log('[EditProfile] Avatar uploaded, public URL:', url);
      setAvatarUrl(url);
    } catch (err: any) {
      console.error('[EditProfile] Avatar upload threw:', err?.message);
      setSaveStatus('error');
      setSaveMsg(`Photo upload failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // ── Save profile ──────────────────────────────────────────────────────────

  const save = async () => {
    if (!fullName.trim()) {
      setSaveStatus('error');
      setSaveMsg('Full name is required.');
      return;
    }
    setSaving(true);
    setSaveStatus('idle');
    try {
      const ok = await updateProfile({
        full_name:  fullName.trim(),
        bio:        bio.trim(),
        level,
        goals,
        email,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      if (ok) {
        console.log('[EditProfile] Profile saved successfully.');
        setSaveStatus('success');
        setSaveMsg('Profile updated successfully.');
        // Navigate back after a short delay so the user sees the confirmation
        setTimeout(() => navigation.goBack(), 1200);
      } else {
        const storeErr = useUserStore.getState().error;
        console.error('[EditProfile] updateProfile returned false. Store error:', storeErr);
        setSaveStatus('error');
        setSaveMsg(storeErr ?? 'Could not save. Please try again.');
      }
    } catch (err: any) {
      console.error('[EditProfile] save threw:', err?.message);
      setSaveStatus('error');
      setSaveMsg(err?.message ?? 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg },
    scroll:        { paddingBottom: 60 },

    header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
    saveBtn:       { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    saveBtnDisabled:{ opacity: 0.5 },
    saveTxt:       { fontSize: 14, fontWeight: '700', color: '#fff' },
    divider:       { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },

    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: 24, gap: 10 },
    avatarWrap:    { position: 'relative' },
    avatarCircle:  { width: 80, height: 80, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImg:     { width: 80, height: 80, borderRadius: 22 },
    avatarTxt:     { fontSize: 28, fontWeight: '800', color: '#fff' },
    cameraBtn:     { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    photoLabel:    { fontSize: 13, fontWeight: '600', color: C.primary },
    uploadingTxt:  { fontSize: 11, color: C.textMuted },

    // Banner
    banner:        { marginHorizontal: 20, borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerTxt:     { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

    // Form
    form:          { paddingHorizontal: 20, marginBottom: 20 },
    label:         { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 16 },
    input:         { backgroundColor: C.surface, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
    inputDisabled: { opacity: 0.5 },

    sectionLabel:  { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10 },

    // Level
    levelRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20, flexWrap: 'wrap' },
    levelCard:     { flex: 1, minWidth: 72, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    levelActive:   { borderColor: C.primary, backgroundColor: C.primaryLight },
    levelTxt:      { fontSize: 11, fontWeight: '600', color: C.textSec },
    levelTxtActive:{ color: C.primary },

    // Goals
    goalsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 24 },
    goalChip:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
    goalActive:    { borderColor: C.primary, backgroundColor: C.primaryLight },
    goalTxt:       { fontSize: 13, color: C.textSec },
    goalTxtActive: { color: C.primary, fontWeight: '600' },
  });

  if (profileLoading && !profile) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const displayUri = avatarUri ?? avatarUrl;

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[s.saveBtn, (saving || uploading) && s.saveBtnDisabled]}
          onPress={save}
          disabled={saving || uploading}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveTxt}>Save</Text>}
        </TouchableOpacity>
      </View>
      <View style={s.divider} />

      <ScrollView
        style={Platform.OS === 'web' ? ({ height: '100vh', overflowY: 'scroll' } as any) : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarWrap} onPress={pickPhoto} activeOpacity={0.8}>
            <View style={s.avatarCircle}>
              {displayUri
                ? <Image source={{ uri: displayUri }} style={s.avatarImg} />
                : <Text style={s.avatarTxt}>{initials}</Text>}
            </View>
            <View style={s.cameraBtn}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          {uploading
            ? <Text style={s.uploadingTxt}>Uploading photo…</Text>
            : <TouchableOpacity onPress={pickPhoto} activeOpacity={0.75}>
                <Text style={s.photoLabel}>Change Photo</Text>
              </TouchableOpacity>}
        </View>

        {/* Status banner */}
        {saveStatus !== 'idle' && (
          <View style={[s.banner, {
            backgroundColor: saveStatus === 'success' ? C.success + '18' : C.error + '12',
            borderWidth: 1,
            borderColor:    saveStatus === 'success' ? C.success + '55' : C.error + '40',
          }]}>
            <Ionicons
              name={saveStatus === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={saveStatus === 'success' ? C.success : C.error}
            />
            <Text style={[s.bannerTxt, { color: saveStatus === 'success' ? C.success : C.error }]}>
              {saveMsg}
            </Text>
          </View>
        )}

        {/* Form fields */}
        <View style={s.form}>
          <Text style={s.label}>Full Name</Text>
          <TextInput
            style={s.input}
            value={fullName}
            onChangeText={t => { setFullName(t); setSaveStatus('idle'); }}
            placeholder="Your full name"
            placeholderTextColor={C.textMuted}
            autoCapitalize="words"
          />

          <Text style={s.label}>Email</Text>
          <TextInput
            style={[s.input, s.inputDisabled]}
            value={email}
            editable={false}
            placeholderTextColor={C.textMuted}
          />

          <Text style={s.label}>Bio</Text>
          <TextInput
            style={[s.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            value={bio}
            onChangeText={t => { setBio(t); setSaveStatus('idle'); }}
            placeholder="Tell us about yourself…"
            placeholderTextColor={C.textMuted}
            multiline
          />
        </View>

        {/* Skill level */}
        <Text style={s.sectionLabel}>Skill Level</Text>
        <View style={s.levelRow}>
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l}
              style={[s.levelCard, level === l && s.levelActive]}
              onPress={() => { setLevel(l); setSaveStatus('idle'); }}
              activeOpacity={0.8}
            >
              <Text style={[s.levelTxt, level === l && s.levelTxtActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Learning goals */}
        <Text style={s.sectionLabel}>Learning Goals</Text>
        <View style={s.goalsWrap}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g}
              style={[s.goalChip, goals.includes(g) && s.goalActive]}
              onPress={() => { toggleGoal(g); setSaveStatus('idle'); }}
              activeOpacity={0.8}
            >
              {goals.includes(g) && (
                <Ionicons name="checkmark-circle" size={14} color={C.primary} style={{ marginRight: 5 }} />
              )}
              <Text style={[s.goalTxt, goals.includes(g) && s.goalTxtActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
