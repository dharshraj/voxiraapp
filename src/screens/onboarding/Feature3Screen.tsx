import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const FEATURES = [
  { icon: 'person-outline' as const,      label: 'Role-Specific',    color: '#8B5CF6', sub: '50+ job roles'     },
  { icon: 'chatbubbles-outline' as const, label: 'Live AI Chat',     color: '#F43F5E', sub: 'Real-time answers'  },
  { icon: 'bar-chart-outline' as const,   label: 'Score Feedback',   color: '#10B981', sub: 'Instant breakdown'  },
  { icon: 'bulb-outline' as const,        label: 'Smart Tips',       color: '#F59E0B', sub: 'Targeted coaching'  },
];

const CHAT = [
  { ai: true,  text: 'Tell me about a challenge you resolved under pressure.' },
  { ai: false, text: 'I reorganised priorities to hit a critical Q3 deadline...' },
  { ai: true,  text: '🎯 Score: 91/100 — Great STAR structure!', score: true },
];

export default function Feature3Screen({ navigation }: any) {
  const cardFloat = useRef(new Animated.Value(0)).current;
  const orb1x = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;

  const msgAnims = useRef(CHAT.map(() => ({
    opacity: new Animated.Value(0),
    slide: new Animated.Value(16),
  }))).current;

  const opacities  = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const translates = useRef(Array.from({ length: 5 }, () => new Animated.Value(28))).current;

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

    opacities.forEach((op, i) => {
      Animated.sequence([
        Animated.delay(i * 110),
        Animated.parallel([
          Animated.timing(op, { toValue: 1, duration: 520, useNativeDriver: true }),
          Animated.timing(translates[i], { toValue: 0, duration: 520, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  const floatY = cardFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const entry  = (i: number) => ({ opacity: opacities[i], transform: [{ translateY: translates[i] }] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1x.interpolate({ inputRange: [0, 1], outputRange: [22, -22] }) }] }]}>
        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2x.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] }) }] }]}>
        <LinearGradient colors={['#F43F5E', '#BE123C']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Progress */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipPill} onPress={() => navigation.navigate('Register')}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <LinearGradient colors={['#8B5CF6', '#F43F5E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progressFill, { width: '100%' }]} />
        </View>
        <Text style={s.stepTxt}>3 / 3</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 0 — Hero card: chat UI */}
        <Animated.View style={[s.heroWrap, entry(0), { transform: [{ translateY: floatY }] }]}>
          <LinearGradient
            colors={['#1A0824', '#0D0D28', '#0A0A1E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            {/* Chat header */}
            <View style={s.chatHeader}>
              <View style={s.aiAvatar}>
                <LinearGradient colors={['#8B5CF6', '#F43F5E']} style={StyleSheet.absoluteFill} />
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

            {/* Chat messages */}
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
          </LinearGradient>
        </Animated.View>

        {/* 1 */}
        <Animated.View style={[s.labelWrap, entry(1)]}>
          <Text style={s.eyebrow}>AI INTERVIEWS</Text>
        </Animated.View>

        {/* 2 */}
        <Animated.View style={entry(2)}>
          <Text style={s.title}>
            {'ACE\n'}
            <Text style={s.titleAccent}>THE ROOM.</Text>
          </Text>
          <Text style={s.desc}>
            Practice with realistic AI for any role. Get scored and coached after every answer.
          </Text>
        </Animated.View>

        {/* 3 */}
        <Animated.View style={[s.grid, entry(3)]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.gridItem}>
              <View style={[s.gridIcon, { backgroundColor: `${f.color}18` }]}>
                <Ionicons name={f.icon} size={18} color={f.color} />
              </View>
              <View style={s.gridText}>
                <Text style={s.gridLabel}>{f.label}</Text>
                <Text style={s.gridSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

      </ScrollView>

      {/* 4 */}
      <Animated.View style={[s.bottom, entry(4)]}>
        <View style={s.btnRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="rgba(241,245,249,0.60)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.nextBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Register')}
          >
            <LinearGradient
              colors={['#8B5CF6', '#F43F5E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.nextGrad}
            >
              <Text style={s.nextTxt}>Get Started Free</Text>
              <Ionicons name="rocket-outline" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={s.loginLinkTxt}>
            Have an account?  <Text style={s.loginAccent}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050F' },
  orb:  { position: 'absolute', borderRadius: 9999, overflow: 'hidden', opacity: 0.18 },
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
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skipTxt: { fontSize: 12, color: 'rgba(241,245,249,0.45)', fontWeight: '500' },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  stepTxt: { fontSize: 12, color: 'rgba(241,245,249,0.45)', fontWeight: '600', width: 32, textAlign: 'right' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 8 },

  heroWrap: { marginBottom: 20 },
  heroCard: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
    padding: 14, gap: 8,
  },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  aiAvatar: {
    width: 38, height: 38, borderRadius: 12,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarTxt: { fontSize: 11, fontWeight: '800', color: '#fff', zIndex: 1 },
  aiInfo: { flex: 1 },
  aiName: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981' },
  onlineTxt: { fontSize: 10, color: 'rgba(241,245,249,0.45)' },
  interviewBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  interviewBadgeTxt: { fontSize: 12, color: '#10B981', fontWeight: '700' },

  bubble: { borderRadius: 14, padding: 10, maxWidth: '88%' },
  aiBubble:   { backgroundColor: 'rgba(255,255,255,0.06)', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: 'rgba(139,92,246,0.20)', alignSelf: 'flex-end', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  scoreBubble: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', alignSelf: 'flex-start' },
  bubbleTxt: { fontSize: 11, color: 'rgba(255,255,255,0.80)', lineHeight: 17 },
  bubbleTxtUser: { color: '#F1F5F9' },
  bubbleTxtScore: { color: '#10B981', fontWeight: '600' },

  labelWrap: { marginBottom: 6 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: '#F43F5E', textTransform: 'uppercase' },
  title: { fontSize: 44, fontWeight: '900', color: '#F1F5F9', lineHeight: 48, letterSpacing: -1.5, marginBottom: 10 },
  titleAccent: { color: '#F43F5E' },
  desc: { fontSize: 14, color: 'rgba(241,245,249,0.45)', lineHeight: 22, marginBottom: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 12,
  },
  gridIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gridText: { flex: 1 },
  gridLabel: { fontSize: 12, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  gridSub:   { fontSize: 10, color: 'rgba(241,245,249,0.35)' },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 10, gap: 10,
  },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  backBtn: {
    width: 52, height: 52, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flex: 1, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#8B5CF6', shadowOpacity: 0.45, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  nextGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkTxt: { fontSize: 13, color: 'rgba(241,245,249,0.38)' },
  loginAccent: { color: '#06B6D4', fontWeight: '600' },
});
