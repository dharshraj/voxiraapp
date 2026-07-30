import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  StatusBar, Platform, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useTheme } from '../../theme/ThemeContext';

const MENU_SECTIONS = [
  {
    title: 'PROGRESS',
    items: [
      { label: 'Progress Overview', icon: 'trending-up-outline',  screen: 'ProgressOverview' },
      { label: 'Achievements',      icon: 'trophy-outline',       screen: 'Achievements'     },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Edit Profile',          icon: 'person-outline',        screen: 'EditProfile'          },
      { label: 'Notification Settings', icon: 'notifications-outline', screen: 'NotificationSettings' },
      { label: 'Settings',              icon: 'settings-outline',      screen: 'Settings'             },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Privacy Policy', icon: 'shield-checkmark-outline', screen: 'PrivacyPolicy' },
    ],
  },
];

export default function ProfileScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId      = useAuthStore(s => s.user?.id);
  const profile     = useUserStore(s => s.profile);
  const loadProfile = useUserStore(s => s.loadProfile);
  const signOut     = useAuthStore(s => s.signOut);
  const sessions    = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const [signingOut, setSigningOut] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  // Re-fetch profile AND sessions on every visit so Edit Profile changes
  // reflect immediately without an app restart
  useFocusEffect(
    useCallback(() => {
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      if (userId) {
        loadProfile(userId);
        loadSessions(userId);
      }
    }, [userId])
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Something went wrong.');
    } finally { setSigningOut(false); }
  };

  const initials = (profile?.full_name ?? 'V')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const speechSessions = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const sessionCount   = speechSessions.length;
  const avgScore       = sessionCount > 0
    ? Math.round(speechSessions.reduce((a, s) => a + s.score, 0) / sessionCount)
    : null;
  const streakDays = profile?.streak_days ?? 0;

  const level = sessionCount === 0 ? null
    : avgScore != null && avgScore >= 85 ? 'Advanced'
    : avgScore != null && avgScore >= 65 ? 'Intermediate'
    : 'Beginner';

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    scrollContent: { flexGrow: 1, paddingBottom: 120 },
    header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14 },
    headerTitle:   { fontSize: 22, fontWeight: '700', color: C.text },
    settingsBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    divider:       { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },
    avatarSection: { alignItems: 'center', gap: 6, marginBottom: 20, paddingHorizontal: 20 },
    avatarCircle:  { width: 72, height: 72, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
    avatarImg:     { width: 72, height: 72, borderRadius: 22 },
    avatarTxt:     { fontSize: 26, fontWeight: '800', color: '#fff' },
    editBadge:     { position: 'absolute', bottom: -3, right: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    profileName:   { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 4 },
    profileEmail:  { fontSize: 12, color: C.textMuted },
    levelBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
    levelTxt:      { fontSize: 11, color: C.primary, fontWeight: '600' },
    statsRow:      { flexDirection: 'row', marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    statItem:      { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statVal:       { fontSize: 16, fontWeight: '700', color: C.text },
    statLbl:       { fontSize: 10, color: C.textMuted, marginTop: 1 },
    statDivider:   { width: 1, backgroundColor: C.border, marginVertical: 8 },
    sectionLabel:  { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8, marginTop: 16 },
    menuCard:      { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden', marginHorizontal: 20 },
    menuRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
    menuRowLast:   { borderBottomWidth: 0 },
    menuIconBox:   { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryLight },
    menuLabel:     { flex: 1, fontSize: 13, fontWeight: '500', color: C.text },
    signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.error + '40', paddingVertical: 14 },
    signOutTxt:    { fontSize: 14, fontWeight: '600', color: C.error },
    version:       { textAlign: 'center', fontSize: 11, color: C.textMuted, marginTop: 14 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{ opacity: fade }, { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.75}>
            <Ionicons name="settings-outline" size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={s.divider} />

        {/* Avatar — shows uploaded photo if available, otherwise initials */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarTxt}>{initials}</Text>
            )}
            <TouchableOpacity style={s.editBadge} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.75}>
              <Ionicons name="pencil" size={11} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={s.profileName}>{profile?.full_name ?? 'Loading...'}</Text>
          <Text style={s.profileEmail}>{profile?.email ?? ''}</Text>
          {level && (
            <View style={s.levelBadge}>
              <Ionicons name="trending-up-outline" size={12} color={C.primary} />
              <Text style={s.levelTxt}>{level} Speaker</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{sessionCount}</Text>
            <Text style={s.statLbl}>Sessions</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{streakDays}</Text>
            <Text style={s.statLbl}>Streak</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{avgScore ?? '—'}</Text>
            <Text style={s.statLbl}>Avg Score</Text>
          </View>
        </View>

        {/* Menu */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={si}>
            <Text style={s.sectionLabel}>{section.title}</Text>
            <View style={s.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[s.menuRow, ii === section.items.length - 1 && s.menuRowLast]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.75}
                >
                  <View style={s.menuIconBox}>
                    <Ionicons name={item.icon as any} size={16} color={C.primary} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity
          style={[s.signOutBtn, signingOut && { opacity: 0.5 }]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.75}
        >
          {signingOut
            ? <ActivityIndicator size="small" color={C.error} />
            : (<>
                <Ionicons name="log-out-outline" size={18} color={C.error} />
                <Text style={s.signOutTxt}>Sign Out</Text>
              </>)}
        </TouchableOpacity>
        <Text style={s.version}>Voxira v1.0.0</Text>
      </Animated.ScrollView>
    </View>
  );
}
