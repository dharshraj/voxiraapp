import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const C = {
  bg:        '#05050F',
  bgCard:    '#0C0C1E',
  surface:   '#12122A',
  purple:    '#8B5CF6',
  purpleGlow:'rgba(139,92,246,0.35)',
  purpleSoft:'rgba(139,92,246,0.12)',
  cyan:      '#06B6D4',
  cyanSoft:  'rgba(6,182,212,0.12)',
  amber:     '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.12)',
  emerald:   '#10B981',
  emeraldSoft:'rgba(16,185,129,0.12)',
  text:      '#F1F5F9',
  textSec:   'rgba(241,245,249,0.65)',
  textMuted: 'rgba(241,245,249,0.38)',
  textHint:  'rgba(241,245,249,0.22)',
  border:    'rgba(255,255,255,0.07)',
  borderMed: 'rgba(255,255,255,0.12)',
};

const STATS = [
  { icon:'mic-outline',     color:C.cyan,    softBg:C.cyanSoft,    value:'0',    label:'Sessions' },
  { icon:'flame',           color:C.amber,   softBg:C.amberSoft,   value:'0',    label:'Streak'   },
  { icon:'star',            color:C.purple,  softBg:C.purpleSoft,  value:'—',    label:'Score'    },
  { icon:'trophy',          color:C.emerald, softBg:C.emeraldSoft, value:'Beg',  label:'Level'    },
];

const ACTIONS = [
  { label:'Speech',    sub:'Voice analysis',  icon:'mic',         grad:['#8B5CF6','#4338CA'] as const,       screen:'Speech'    },
  { label:'Writing',   sub:'AI feedback',     icon:'create',      grad:['#06B6D4','#0891B2'] as const,       screen:'Writing'   },
  { label:'Interview', sub:'Mock sessions',   icon:'people',      grad:['#F59E0B','#D97706'] as const,       screen:'Interview' },
  { label:'Progress',  sub:'Your stats',      icon:'trending-up', grad:['#10B981','#059669'] as const,       screen:'Profile'   },
];

export default function DashboardScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name,level,streak_days')
        .eq('id', user.id)
        .single();
      setProfile(data ?? {
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there',
      });
    } catch {
      setProfile({ full_name: 'there' });
    }
  }, []);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const dynamicStats = [
    { ...STATS[0] },
    { ...STATS[1], value: String(profile?.streak_days ?? 0) },
    { ...STATS[2] },
    { ...STATS[3], value: profile?.level ?? 'Beg' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView
        style={[
          { opacity: fadeAnim },
          Platform.OS === 'web' && ({ height: '100vh', overflowY: 'auto' } as any),
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.userName}>{firstName} 👋</Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.75}
            >
              <Ionicons name={'search-outline' as any} size={20} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.75}
            >
              <Ionicons name={'notifications-outline' as any} size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO BANNER */}
        <View style={s.heroBannerWrap}>
          <LinearGradient
            colors={['#8B5CF6', '#4338CA', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroBannerGrad}
          >
            <View style={s.heroOrb} />
            <View style={s.heroBannerContent}>
              <Text style={s.heroEmoji}>🎯</Text>
              <Text style={s.heroTitle}>Welcome to Voxira!</Text>
              <Text style={s.heroSub}>Complete your first session to unlock insights.</Text>
            </View>
          </LinearGradient>
        </View>

        {/* STATS ROW */}
        <View style={s.statsRow}>
          {dynamicStats.map((st, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIconBox, { backgroundColor: st.softBg }]}>
                <Ionicons name={st.icon as any} size={17} color={st.color} />
              </View>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <Text style={s.sectionTitle}>Quick Start</Text>
        <View style={s.grid}>
          {ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={s.actionCard}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={a.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.actionGrad}
              >
                <View style={s.actionOrb} />
                <View style={s.actionIconBox}>
                  <Ionicons name={a.icon as any} size={22} color="#fff" />
                </View>
                <View style={s.actionBottom}>
                  <Text style={s.actionLabel}>{a.label}</Text>
                  <Text style={s.actionSub}>{a.sub}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT ACTIVITY */}
        <Text style={s.sectionTitleRecent}>Recent Activity</Text>
        <View style={s.emptyCard}>
          <Ionicons name={'rocket-outline' as any} size={28} color={C.purple} />
          <Text style={s.emptyTitle}>No sessions yet</Text>
          <Text style={s.emptySub}>Tap a module above to start</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
  scrollContent:  { paddingBottom: 100 },
  header:         {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting:       { fontSize: 13, color: C.textMuted },
  userName:       { fontSize: 26, fontWeight: '800', color: C.text },
  headerBtns:     { flexDirection: 'row', gap: 10 },
  iconBtn:        {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBannerWrap: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  heroBannerGrad: {},
  heroOrb:        {
    position: 'absolute', right: -40, top: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBannerContent: { padding: 24, gap: 8 },
  heroEmoji:      { fontSize: 32 },
  heroTitle:      { fontSize: 18, fontWeight: '700', color: '#fff' },
  heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  statCard:       {
    flex: 1, padding: 14, borderRadius: 18, gap: 6, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
  },
  statIconBox:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue:      { fontSize: 16, fontWeight: '800' },
  statLabel:      { fontSize: 10, color: C.textMuted },
  sectionTitle:   { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  actionCard:     { width: '48%', borderRadius: 22, overflow: 'hidden', height: 130 },
  actionGrad:     { padding: 16, height: '100%', justifyContent: 'space-between', position: 'relative' },
  actionOrb:      {
    position: 'absolute', right: -12, top: -12,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  actionIconBox:  {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBottom:   {},
  actionLabel:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  actionSub:      { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  sectionTitleRecent: {
    fontSize: 17, fontWeight: '700', color: C.text,
    paddingHorizontal: 20, marginTop: 8, marginBottom: 12,
  },
  emptyCard:      {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8,
  },
  emptyTitle:     { fontSize: 15, fontWeight: '600', color: C.text },
  emptySub:       { fontSize: 13, color: C.textMuted },
});
