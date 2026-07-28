import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const FEATURES = [
  { icon: 'person-outline' as const,      label: 'Role-Specific',    sub: '50+ job roles'     },
  { icon: 'chatbubbles-outline' as const, label: 'Live AI Chat',     sub: 'Real-time answers'  },
  { icon: 'bar-chart-outline' as const,   label: 'Score Feedback',   sub: 'Instant breakdown'  },
  { icon: 'bulb-outline' as const,        label: 'Smart Tips',       sub: 'Targeted coaching'  },
];

const CHAT = [
  { ai: true,  text: 'Tell me about a challenge you resolved under pressure.' },
  { ai: false, text: 'I reorganised priorities to hit a critical Q3 deadline...' },
  { ai: true,  text: '🎯 Score: 91/100 — Great STAR structure!', score: true },
];

export default function Feature3Screen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const cardFloat = useRef(new Animated.Value(0)).current;
  const orb1x = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;

  const msgAnims = useRef(CHAT.map(() => ({
    opacity: new Animated.Value(0),
    slide: new Animated.Value(16),
  }))).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(cardFloat, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(cardFloat, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ])).start();

    [orb1x, orb2x].forEach((v, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 3000 + i * 500, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 3000 + i * 500, useNativeDriver: true }),
      ])).start();
    });

    msgAnims.forEach(({ opacity, slide }, i) => {
      Animated.sequence([
        Animated.delay(300 + i * 350),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slide,   { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  const floatY = cardFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    orb:  { position: 'absolute', borderRadius: 9999, overflow: 'hidden', opacity: 0.12, backgroundColor: C.primary },
    orb1: { width: 240, height: 240, top: -60, right: -60 },
    orb2: { width: 220, height: 220, bottom: 100, left: -60 },
    topBar: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 56 : 36,
      paddingBottom: 16,
    },
    skipPill: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
      borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surface,
    },
    skipTxt: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    progressTrack: { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
    progressFill:  { height: '100%', borderRadius: 2, backgroundColor: C.primary },
    stepTxt: { fontSize: 12, color: C.textMuted, fontWeight: '600', width: 32, textAlign: 'right' },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 24 },
    heroWrap: { marginBottom: 20 },
    heroCard: {
      borderRadius: 22, overflow: 'hidden',
      borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surface,
      padding: 14, gap: 8,
    },
    chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    aiAvatar: {
      width: 38, height: 38, borderRadius: 12,
      overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary,
    },
    aiAvatarTxt: { fontSize: 11, fontWeight: '800', color: '#fff', zIndex: 1 },
    aiInfo: { flex: 1 },
    aiName: { fontSize: 13, fontWeight: '700', color: C.text },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    onlineDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.success },
    onlineTxt: { fontSize: 10, color: C.textMuted },
    interviewBadge: {
      backgroundColor: C.success + '25',
      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: C.success + '50',
    },
    interviewBadgeTxt: { fontSize: 12, color: C.success, fontWeight: '700' },
    bubble: { borderRadius: 14, padding: 10, maxWidth: '88%' },
    aiBubble:   { backgroundColor: C.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border },
    userBubble: { backgroundColor: C.primaryLight, alignSelf: 'flex-end', borderWidth: 1, borderColor: C.primary + '40' },
    scoreBubble: { backgroundColor: C.success + '20', borderWidth: 1, borderColor: C.success + '40', alignSelf: 'flex-start' },
    bubbleTxt: { fontSize: 11, color: C.textSec, lineHeight: 17 },
    bubbleTxtUser: { color: C.text },
    bubbleTxtScore: { color: C.success, fontWeight: '600' },
    labelWrap: { marginBottom: 6 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.primary, textTransform: 'uppercase' },
    title: { fontSize: 44, fontWeight: '900', color: C.text, lineHeight: 48, letterSpacing: -1.5, marginBottom: 10 },
    titleAccent: { color: C.primary },
    desc: { fontSize: 14, color: C.textMuted, lineHeight: 22, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridItem: {
      width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      borderRadius: 16, padding: 12,
    },
    gridIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryLight },
    gridText: { flex: 1 },
    gridLabel: { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
    gridSub:   { fontSize: 10, color: C.textMuted },
    bottom: {
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 48 : 32,
      paddingTop: 10, gap: 10,
    },
    btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    backBtn: {
      width: 52, height: 52, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    nextBtn: {
      flex: 1, borderRadius: 18, overflow: 'hidden',
      backgroundColor: C.primary,
      height: 58, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    nextTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
    loginLink: { alignItems: 'center', paddingVertical: 4 },
    loginLinkTxt: { fontSize: 13, color: C.textMuted },
    loginAccent: { color: C.primary, fontWeight: '600' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1x.interpolate({ inputRange: [0, 1], outputRange: [22, -22] }) }] }]} />
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2x.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] }) }] }]} />

      {/* Progress */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipPill} onPress={() => navigation.navigate('Register')}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: '100%' }]} />
        </View>
        <Text style={s.stepTxt}>3 / 3</Text>
      </View>

      <ScrollView
        style={[s.scroll, Platform.OS === 'web' && ({ height: '100%', overflowY: 'auto' } as any)]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card: chat UI */}
        <Animated.View style={[s.heroWrap, { transform: [{ translateY: floatY }] }]}>
          <View style={s.heroCard}>
            <View style={s.chatHeader}>
              <View style={s.aiAvatar}>
                <Text style={s.aiAvatarTxt}>AI</Text>
              </View>
              <View style={s.aiInfo}>
                <Text style={s.aiName}>Voxira Interviewer</Text>
                <View style={s.onlineRow}>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineTxt}>Ready to interview</Text>
                </View>
              </View>
              <View style={s.interviewBadge}>
                <Text style={s.interviewBadgeTxt}>91/100</Text>
              </View>
            </View>

            {CHAT.map((msg, i) => (
              <Animated.View
                key={i}
                style={[
                  s.bubble,
                  msg.ai ? s.aiBubble : s.userBubble,
                  msg.score && s.scoreBubble,
                  { opacity: msgAnims[i].opacity, transform: [{ translateY: msgAnims[i].slide }] },
                ]}
              >
                <Text style={[s.bubbleTxt, !msg.ai && s.bubbleTxtUser, msg.score && s.bubbleTxtScore]}>
                  {msg.text}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <View style={s.labelWrap}>
          <Text style={s.eyebrow}>AI INTERVIEWS</Text>
        </View>

        <View>
          <Text style={s.title}>
            {'ACE\n'}
            <Text style={s.titleAccent}>THE ROOM.</Text>
          </Text>
          <Text style={s.desc}>
            Practice with realistic AI for any role. Get scored and coached after every answer.
          </Text>
        </View>

        <View style={s.grid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.gridItem}>
              <View style={s.gridIcon}>
                <Ionicons name={f.icon} size={18} color={C.primary} />
              </View>
              <View style={s.gridText}>
                <Text style={s.gridLabel}>{f.label}</Text>
                <Text style={s.gridSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom CTA — moved inside ScrollView */}
        <View style={s.bottom}>
          <View style={s.btnRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={18} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.nextBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={s.nextTxt}>Get Started Free</Text>
              <Ionicons name="rocket-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={s.loginLinkTxt}>
              Have an account?  <Text style={s.loginAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
