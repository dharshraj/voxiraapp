import React, { useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';

const ACTIONS = [
  { label: 'Speech',    sub: 'Voice analysis', icon: 'mic',         screen: 'Speech'    },
  { label: 'Writing',   sub: 'AI feedback',    icon: 'create',      screen: 'Writing'   },
  { label: 'Interview', sub: 'Mock sessions',  icon: 'people',      screen: 'Interview' },
  { label: 'Progress',  sub: 'Your stats',     icon: 'trending-up', screen: 'Profile'   },
];

export default function DashboardScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId  = useAuthStore(s => s.user?.id);
  const profile = useUserStore(s => s.profile);
  const profileLoading = useUserStore(s => s.loading);
  const fadeAnim = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleRefresh = useCallback(async () => {
    if (userId) await useUserStore.getState().loadProfile(userId);
  }, [userId]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const dynamicStats = [
    { icon: 'mic-outline', color: C.primary,  value: '0',                                label: 'Sessions' },
    { icon: 'flame',       color: C.warning,  value: String(profile?.streak_days ?? 0), label: 'Streak'   },
    { icon: 'star',        color: C.primary,  value: '—',                                label: 'Score'    },
    { icon: 'trophy',      color: C.success,  value: profile?.level?.slice(0, 3) ?? 'Beg', label: 'Level' },
  ];

  const s = StyleSheet.create({
    root:           { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
    scrollContent:  { paddingBottom: 100 },
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingHorizontal: 20, paddingBottom: 20 },
    greeting:       { fontSize: 13, color: C.textMuted },
    userName:       { fontSize: 26, fontWeight: '800', color: C.text },
    headerBtns:     { flexDirection: 'row', gap: 10 },
    iconBtn:        { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    heroBannerWrap: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 16, backgroundColor: C.primary },
    heroOrb:        { position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroBannerContent: { padding: 24, gap: 8 },
    heroEmoji:      { fontSize: 32 },
    heroTitle:      { fontSize: 18, fontWeight: '700', color: '#fff' },
    heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    statCard:       { flex: 1, padding: 14, borderRadius: 18, gap: 6, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    statIconBox:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryLight },
    statValue:      { fontSize: 16, fontWeight: '800' },
    statLabel:      { fontSize: 10, color: C.textMuted },
    sectionTitle:   { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
    grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
    actionCard:     { width: '48%', borderRadius: 18, overflow: 'hidden', height: 88, backgroundColor: C.primary, borderWidth: 1, borderColor: C.border },
    actionInner:    { padding: 14, height: '100%', justifyContent: 'space-between', position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionIconBox:  { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
    actionBottom:   { flex: 1 },
    actionLabel:    { fontSize: 14, fontWeight: '700', color: '#fff' },
    actionSub:      { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
    sectionTitleRecent: { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },
    emptyCard:      { marginHorizontal: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
    emptyTitle:     { fontSize: 15, fontWeight: '600', color: C.text },
    emptySub:       { fontSize: 13, color: C.textMuted },
    tipCard:        { marginHorizontal: 20, marginTop: 8, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: C.primary },
    tipInner:       { padding: 18, gap: 8 },
    tipHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipLabel:       { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    tipText:        { fontSize: 14, color: '#fff', lineHeight: 22 },
    secTitle:       { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12, marginTop: 4 },
    statsStrip:     { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    stripCard:      { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    stripIconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    stripValue:     { fontSize: 18, fontWeight: '800' },
    stripLabel:     { fontSize: 10, color: C.textMuted, textAlign: 'center' },
    skillsCard:     { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border },
    skillRow:       { marginBottom: 14 },
    skillInfo:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    skillName:      { fontSize: 13, fontWeight: '600', color: C.text },
    skillLevel:     { fontSize: 11, fontWeight: '500' },
    skillBarBg:     { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    skillBarFill:   { height: '100%', borderRadius: 3 },
    skillNote:      { fontSize: 12, color: C.textMuted, marginTop: 4, textAlign: 'center' },
    learnRow:       { gap: 10, paddingLeft: 20, paddingRight: 4, paddingBottom: 4 },
    learnCard:      { width: 160, borderRadius: 14, padding: 14, gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    learnEmoji:     { fontSize: 24 },
    learnTitle:     { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18 },
    learnTime:      { fontSize: 11, color: C.textMuted },
  });

  const SKILLS = [
    { skill: 'Public Speaking',     level: 'Beginner', progress: 15, color: C.primary },
    { skill: 'Writing Quality',     level: 'Beginner', progress: 10, color: C.success },
    { skill: 'Interview Readiness', level: 'Beginner', progress: 8,  color: C.warning },
  ];

  const STAT_STRIP = [
    { icon: 'mic-outline',    label: 'Sessions',     val: '0',                                color: C.primary },
    { icon: 'flame-outline',  label: 'Day Streak',   val: String(profile?.streak_days ?? 0), color: C.error   },
    { icon: 'star-outline',   label: 'Avg Score',    val: '—',                                color: C.warning },
    { icon: 'trophy-outline', label: 'Achievements', val: '0',                                color: C.success },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{ opacity: fadeAnim }, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'auto' } as any)]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={profileLoading}
            onRefresh={handleRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.userName}>{firstName} </Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.75}>
              <Ionicons name={'search-outline' as any} size={20} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.75}>
              <Ionicons name={'notifications-outline' as any} size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.heroBannerWrap}>
          <View style={s.heroOrb} />
          <View style={s.heroBannerContent}>
            <Text style={s.heroEmoji}>🎯</Text>
            <Text style={s.heroTitle}>Welcome to Voxira!</Text>
            <Text style={s.heroSub}>Complete your first session to unlock insights.</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          {dynamicStats.map((st, i) => (
            <View key={i} style={s.statCard}>
              <View style={s.statIconBox}>
                <Ionicons name={st.icon as any} size={17} color={st.color} />
              </View>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Quick Start</Text>
        <View style={s.grid}>
          {ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={s.actionCard}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.75}
            >
              <View style={s.actionInner}>
                <View style={s.actionIconBox}>
                  <Ionicons name={a.icon as any} size={18} color="#fff" />
                </View>
                <View style={s.actionBottom}>
                  <Text style={s.actionLabel}>{a.label}</Text>
                  <Text style={s.actionSub}>{a.sub}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.tipCard}>
          <View style={s.tipInner}>
            <View style={s.tipHeader}>
              <Text style={{ fontSize: 20 }}>💡</Text>
              <Text style={s.tipLabel}>DAILY TIP</Text>
            </View>
            <Text style={s.tipText}>
              {[
                'Pause for 1 second instead of saying "um". Silence sounds more confident than filler words.',
                'The best speakers speak at 120-140 words per minute. Record yourself to check your pace.',
                "Start every email with what you want — don't bury the main point at the end.",
                "Use the 3-point structure: Tell them what you'll say, say it, tell them what you said.",
                'Confident speakers make eye contact 60-70% of the time. Practice in your next meeting.',
              ][new Date().getDay() % 5]}
            </Text>
          </View>
        </View>

        <Text style={s.secTitle}>Your Stats</Text>
        <View style={s.statsStrip}>
          {STAT_STRIP.map((stat, i) => (
            <View key={i} style={s.stripCard}>
              <View style={s.stripIconWrap}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={[s.stripValue, { color: stat.color }]}>{stat.val}</Text>
              <Text style={s.stripLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.secTitle}>Skills Overview</Text>
        <View style={s.skillsCard}>
          {SKILLS.map((item, i) => (
            <View key={i} style={s.skillRow}>
              <View style={s.skillInfo}>
                <Text style={s.skillName}>{item.skill}</Text>
                <Text style={[s.skillLevel, { color: item.color }]}>{item.level}</Text>
              </View>
              <View style={s.skillBarBg}>
                <View style={[s.skillBarFill, { width: `${item.progress}%` as any, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
          <Text style={s.skillNote}>Complete sessions to level up your skills 🚀</Text>
        </View>

        <Text style={s.secTitle}>Learn</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.learnRow}>
          {[
            { title: 'How to Eliminate Filler Words',    emoji: '🎯', time: '3 min read' },
            { title: 'The STAR Method for Interviews',    emoji: '⭐', time: '5 min read' },
            { title: 'Email Writing Best Practices',      emoji: '✉️', time: '4 min read' },
            { title: 'Speak at the Perfect Pace',         emoji: '⏱️', time: '3 min read' },
            { title: 'Body Language Tips for Confidence', emoji: '💪', time: '4 min read' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.learnCard} activeOpacity={0.8}>
              <Text style={s.learnEmoji}>{item.emoji}</Text>
              <Text style={s.learnTitle}>{item.title}</Text>
              <Text style={s.learnTime}>{item.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.sectionTitleRecent}>Recent Activity</Text>
        <View style={s.emptyCard}>
          <Ionicons name={'rocket-outline' as any} size={28} color={C.primary} />
          <Text style={s.emptyTitle}>No sessions yet</Text>
          <Text style={s.emptySub}>Tap a module above to start</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
