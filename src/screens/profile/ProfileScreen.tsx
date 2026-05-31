import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const C = {
  bg:          '#05050F',
  bgCard:      '#0C0C1E',
  purple:      '#8B5CF6',
  purpleSoft:  'rgba(139,92,246,0.12)',
  cyan:        '#06B6D4',
  cyanSoft:    'rgba(6,182,212,0.12)',
  amber:       '#F59E0B',
  amberSoft:   'rgba(245,158,11,0.12)',
  emerald:     '#10B981',
  emeraldSoft: 'rgba(16,185,129,0.12)',
  rose:        '#F43F5E',
  text:        '#F1F5F9',
  textMuted:   'rgba(241,245,249,0.38)',
  textHint:    'rgba(241,245,249,0.22)',
  textSec:     'rgba(241,245,249,0.65)',
  border:      'rgba(255,255,255,0.07)',
  borderMed:   'rgba(255,255,255,0.12)',
};

const MENU_SECTIONS = [
  {
    title: 'PROGRESS',
    items: [
      { label: 'Progress Overview', icon: 'trending-up',       color: '#06B6D4', softBg: 'rgba(6,182,212,0.12)',   screen: 'ProgressOverview' },
      { label: 'Achievements',      icon: 'trophy',             color: '#F59E0B', softBg: 'rgba(245,158,11,0.12)', screen: 'Achievements'     },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Edit Profile',          icon: 'person',          color: '#06B6D4', softBg: 'rgba(6,182,212,0.12)',   screen: 'EditProfile'          },
      { label: 'Subscription',          icon: 'diamond',         color: '#F59E0B', softBg: 'rgba(245,158,11,0.12)', screen: 'Subscription'         },
      { label: 'Notification Settings', icon: 'notifications',   color: '#10B981', softBg: 'rgba(16,185,129,0.12)', screen: 'NotificationSettings' },
      { label: 'Settings',              icon: 'settings',        color: 'rgba(241,245,249,0.38)', softBg: 'rgba(255,255,255,0.06)', screen: 'Settings' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Help',           icon: 'help-circle',      color: '#06B6D4', softBg: 'rgba(6,182,212,0.12)',   screen: 'Help'          },
      { label: 'Privacy Policy', icon: 'shield-checkmark', color: '#10B981', softBg: 'rgba(16,185,129,0.12)', screen: 'PrivacyPolicy' },
    ],
  },
];

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data ?? {
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Voxira User',
        level: 'Beginner',
        streak_days: 0,
        email: user.email,
      });
    } catch {
      setProfile({ full_name: 'Voxira User', level: 'Beginner', streak_days: 0 });
    }
  };

  const signOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const initials = (profile?.full_name ?? 'V')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'auto' } as any)]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={s.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.75}
          >
            <Ionicons name={'settings-outline' as any} size={22} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* AVATAR SECTION */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={['#8B5CF6', '#F43F5E']} style={s.avatarGrad}>
              <Text style={s.avatarTxt}>{initials}</Text>
            </LinearGradient>
            <TouchableOpacity
              style={s.editBadge}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.75}
            >
              <Ionicons name={'pencil' as any} size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={s.profileName}>{profile?.full_name ?? 'Loading...'}</Text>
          <Text style={s.profileEmail}>{profile?.email ?? ''}</Text>
          <View style={s.levelBadge}>
            <Ionicons name={'trophy-outline' as any} size={13} color={C.amber} />
            <Text style={s.levelTxt}>{profile?.level ?? 'Beginner'} Speaker</Text>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={s.statsRow}>
          {[
            { val: '0',                               lbl: 'Sessions', color: C.cyan    },
            { val: String(profile?.streak_days ?? 0), lbl: 'Streak',   color: C.amber   },
            { val: '—',                               lbl: 'Avg Score',color: C.purple  },
            { val: profile?.level ?? 'Beg',           lbl: 'Level',    color: C.emerald },
          ].map((st, i) => (
            <View
              key={i}
              style={[s.statItem, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}
            >
              <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* PRO BANNER */}
        <TouchableOpacity
          style={s.proBanner}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.75}
        >
          <LinearGradient
            colors={['#8B5CF6', '#4338CA', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.proOrb} />
          <View style={s.proIconBox}>
            <Ionicons name={'diamond-outline' as any} size={24} color="#fff" />
          </View>
          <View style={s.proText}>
            <Text style={s.proTitle}>Upgrade to Pro</Text>
            <Text style={s.proSub}>Unlimited sessions · AI features</Text>
          </View>
          <Ionicons name={'arrow-forward-circle' as any} size={28} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

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
                  <View style={[s.menuIconBox, { backgroundColor: item.softBg }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Ionicons name={'chevron-forward' as any} size={16} color={C.textHint} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* SIGN OUT */}
        <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.75}>
          <Ionicons name={'log-out-outline' as any} size={20} color={C.rose} />
          <Text style={s.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Voxira v1.0.0</Text>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
  scrollContent: { paddingBottom: 100 },
  header:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 20,
  },
  headerTitle:   { fontSize: 22, fontWeight: '700', color: C.text },
  settingsBtn:   {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSection: { alignItems: 'center', gap: 10, marginBottom: 24 },
  avatarWrap:    { position: 'relative' },
  avatarGrad:    { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 32, fontWeight: '800', color: '#fff' },
  editBadge:     {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.purple, borderWidth: 2, borderColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName:   { fontSize: 22, fontWeight: '700', color: C.text },
  profileEmail:  { fontSize: 13, color: C.textMuted },
  levelBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  levelTxt:      { fontSize: 12, color: C.amber, fontWeight: '600' },
  statsRow:      {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 20,
  },
  statItem:      { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal:       { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statLbl:       { fontSize: 10, color: C.textMuted },
  proBanner:     {
    marginHorizontal: 20, borderRadius: 20, height: 88,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 20,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    marginBottom: 8,
  },
  proOrb:        {
    position: 'absolute', right: -20, top: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  proIconBox:    {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  proText:       { flex: 1, marginLeft: 14 },
  proTitle:      { fontSize: 14, fontWeight: '700', color: '#fff' },
  proSub:        { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  section:       { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle:  {
    fontSize: 11, fontWeight: '700', color: C.textHint,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  menuCard:      {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 20, overflow: 'hidden',
  },
  menuRow:       {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  menuRowLast:   { borderBottomWidth: 0 },
  menuIconBox:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },
  signOutBtn:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 24, marginHorizontal: 20,
    backgroundColor: 'rgba(244,63,94,0.06)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.25)',
    padding: 18,
  },
  signOutTxt:    { fontSize: 15, fontWeight: '600', color: C.rose },
  version:       { textAlign: 'center', fontSize: 12, color: C.textHint, marginTop: 16 },
});
