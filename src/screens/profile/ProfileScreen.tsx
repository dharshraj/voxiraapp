import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';

const MENU_SECTIONS = [
  {
    title: 'PROGRESS',
    items: [
      { label: 'Progress Overview', icon: 'trending-up',  screen: 'ProgressOverview' },
      { label: 'Achievements',      icon: 'trophy',        screen: 'Achievements'     },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Edit Profile',          icon: 'person',        screen: 'EditProfile'          },
      { label: 'Notification Settings', icon: 'notifications', screen: 'NotificationSettings' },
      { label: 'Settings',              icon: 'settings',      screen: 'Settings'             },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Privacy Policy', icon: 'shield-checkmark', screen: 'PrivacyPolicy' },
    ],
  },
];

export default function ProfileScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const profile    = useUserStore(s => s.profile);
  const signOut    = useAuthStore(s => s.signOut);
  const [signingOut, setSigningOut] = useState(false);
  const fade       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Something went wrong.');
    } finally {
      setSigningOut(false);
    }
  };

  const initials = (profile?.full_name ?? 'V')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
    scrollContent: { paddingBottom: 100 },
    header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 20 },
    headerTitle:   { fontSize: 22, fontWeight: '700', color: C.text },
    settingsBtn:   { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    avatarSection: { alignItems: 'center', gap: 10, marginBottom: 24 },
    avatarWrap:    { position: 'relative' },
    avatarGrad:    { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    avatarTxt:     { fontSize: 32, fontWeight: '800', color: '#fff' },
    editBadge:     { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    profileName:   { fontSize: 22, fontWeight: '700', color: C.text },
    profileEmail:  { fontSize: 13, color: C.textMuted },
    levelBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.warning + '20', borderWidth: 1, borderColor: C.warning + '40', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    levelTxt:      { fontSize: 12, color: C.warning, fontWeight: '600' },
    statsRow:      { flexDirection: 'row', marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
    statItem:      { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statVal:       { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    statLbl:       { fontSize: 10, color: C.textMuted },
    section:       { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle:  { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    menuCard:      { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, overflow: 'hidden' },
    menuRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    menuRowLast:   { borderBottomWidth: 0 },
    menuIconBox:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryLight },
    menuLabel:     { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },
    signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.error + '40', padding: 18 },
    signOutBtnDisabled: { opacity: 0.5 },
    signOutTxt:    { fontSize: 15, fontWeight: '600', color: C.error },
    version:       { textAlign: 'center', fontSize: 12, color: C.textMuted, marginTop: 16 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'auto' } as any)]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.75}>
            <Ionicons name={'settings-outline' as any} size={22} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* AVATAR SECTION */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={[C.primary, C.primaryPressed]} style={s.avatarGrad}>
              <Text style={s.avatarTxt}>{initials}</Text>
            </LinearGradient>
            <TouchableOpacity style={s.editBadge} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.75}>
              <Ionicons name={'pencil' as any} size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={s.profileName}>{profile?.full_name ?? 'Loading...'}</Text>
          <Text style={s.profileEmail}>{profile?.email ?? ''}</Text>
          <View style={s.levelBadge}>
            <Ionicons name={'trophy-outline' as any} size={13} color={C.warning} />
            <Text style={s.levelTxt}>{profile?.level ?? 'Beginner'} Speaker</Text>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={s.statsRow}>
          {[
            { val: '0',                               lbl: 'Sessions', color: C.primary  },
            { val: String(profile?.streak_days ?? 0), lbl: 'Streak',   color: C.warning  },
            { val: '—',                               lbl: 'Avg Score',color: C.primary  },
            { val: profile?.level?.slice(0, 3) ?? 'Beg', lbl: 'Level', color: C.success  },
          ].map((st, i) => (
            <View key={i} style={[s.statItem, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* MENU SECTIONS */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[s.menuRow, ii === section.items.length - 1 && s.menuRowLast]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.75}
                >
                  <View style={s.menuIconBox}>
                    <Ionicons name={item.icon as any} size={20} color={C.primary} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Ionicons name={'chevron-forward' as any} size={16} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* SIGN OUT */}
        <TouchableOpacity
          style={[s.signOutBtn, signingOut && s.signOutBtnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.75}
        >
          {signingOut
            ? <ActivityIndicator size="small" color={C.error} />
            : (
              <>
                <Ionicons name={'log-out-outline' as any} size={20} color={C.error} />
                <Text style={s.signOutTxt}>Sign Out</Text>
              </>
            )
          }
        </TouchableOpacity>

        <Text style={s.version}>Voxira v1.0.0</Text>
      </Animated.ScrollView>
    </View>
  );
}
