import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

// ─── 3D floating card animation helper ─────────────────────────────────────
function useFloat(amplitude = 10, duration = 2200) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration, easing: (t) => Math.sin(t * Math.PI), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration, easing: (t) => Math.sin(t * Math.PI), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return val.interpolate({ inputRange: [0, 1], outputRange: [0, -amplitude] });
}

export default function WelcomeScreen({ navigation }: any) {

  // ── Orb drifts ─────────────────────────────────────────────────────────────
  const orbAnims = Array.from({ length: 3 }, () => ({
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
  }));

  // ── Hero card float ─────────────────────────────────────────────────────────
  const cardFloat = useFloat(10, 2400);
  const cardTilt  = useRef(new Animated.Value(0)).current;

  // ── Waveform bars ────────────────────────────────────────────────────────────
  const BAR_COUNT = 24;
  const waveAnims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.25))).current;


  useEffect(() => {
    // Orbs
    orbAnims.forEach(({ x, y }, i) => {
      const dur = 3000 + i * 400;
      Animated.loop(Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: dur * 1.2, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: dur * 1.2, useNativeDriver: true }),
      ])).start();
    });

    // Card tilt oscillation
    Animated.loop(Animated.sequence([
      Animated.timing(cardTilt, { toValue: 1, duration: 3600, useNativeDriver: true }),
      Animated.timing(cardTilt, { toValue: 0, duration: 3600, useNativeDriver: true }),
    ])).start();

    // Waveform animation
    waveAnims.forEach((a, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 50),
        Animated.timing(a, { toValue: 0.3 + Math.random() * 0.7, duration: 350 + i * 25, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.15 + Math.random() * 0.35, duration: 320 + i * 20, useNativeDriver: true }),
      ])).start();
    });

  }, []);

  const orbRanges: Array<[[number, number], [number, number]]> = [
    [[-24, 24], [-20, 20]],
    [[20, -20], [-24, 24]],
    [[-16, 16], [20, -20]],
  ];
  const orbTransforms = orbAnims.map(({ x, y }, i) => ({
    tx: x.interpolate({ inputRange: [0, 1], outputRange: orbRanges[i][0] }),
    ty: y.interpolate({ inputRange: [0, 1], outputRange: orbRanges[i][1] }),
  }));

  const cardRotate = cardTilt.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      {/* ── Background mesh orbs ─────────────────────────────────────────────── */}
      <Animated.View style={[s.orb, s.orb1, {
        transform: [{ translateX: orbTransforms[0].tx }, { translateY: orbTransforms[0].ty }],
      }]}>
        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[s.orb, s.orb2, {
        transform: [{ translateX: orbTransforms[1].tx }, { translateY: orbTransforms[1].ty }],
      }]}>
        <LinearGradient colors={['#06B6D4', '#0891B2']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[s.orb, s.orb3, {
        transform: [{ translateX: orbTransforms[2].tx }, { translateY: orbTransforms[2].ty }],
      }]}>
        <LinearGradient colors={['#F43F5E', '#BE123C']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* ── Noise texture grid (web only) ────────────────────────────────────── */}
      {Platform.OS === 'web' && (
        <View
          style={s.noiseOverlay}
          {...({ dangerouslySetInnerHTML: undefined } as any)}
        />
      )}

      <ScrollView
        style={[s.scrollView, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'scroll' } as any)]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 0 — Logo mark */}
        <View style={s.topBar}>
          <LinearGradient colors={['#8B5CF6', '#4338CA']} style={s.logoMark}>
            <Text style={s.logoMarkEmoji}>🎙️</Text>
          </LinearGradient>
          <Text style={s.logoMarkText}>
            VOX<Text style={s.logoMarkAccent}>IRA</Text>
          </Text>
        </View>

        {/* 1 — Hero card (3D floating) */}
        <Animated.View
          style={[
            s.heroCardWrap,
            {
              transform: [
                { translateY: cardFloat },
                { rotate: cardRotate },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#1A0A2E', '#0D0D2B', '#0A1628']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            {/* Glowing border */}
            <View style={s.heroCardBorderGlow} />

            {/* Waveform visualizer */}
            <View style={s.heroCardInner}>
              <View style={s.micRow}>
                <View style={s.micCircle}>
                  <Ionicons name="mic" size={22} color="#fff" />
                </View>
                <View style={s.micInfo}>
                  <Text style={s.micLabel}>Live Analysis</Text>
                  <View style={s.micDotRow}>
                    <View style={s.micDotActive} />
                    <Text style={s.micStatus}>Recording...</Text>
                  </View>
                </View>
                <View style={s.scoreChip}>
                  <Text style={s.scoreChipTxt}>94</Text>
                  <Text style={s.scoreChipSub}>score</Text>
                </View>
              </View>

              <View style={s.waveRow}>
                {waveAnims.map((a, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.waveBar,
                      {
                        transform: [{ scaleY: a }],
                        backgroundColor: i % 4 === 0
                          ? '#8B5CF6'
                          : i % 4 === 1
                            ? '#A78BFA'
                            : i % 4 === 2
                              ? '#06B6D4'
                              : 'rgba(139,92,246,0.4)',
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={s.statsChipRow}>
                {[
                  { label: 'Pace',       val: '142 wpm', color: '#06B6D4' },
                  { label: 'Clarity',    val: '96%',     color: '#10B981' },
                  { label: 'Fillers',    val: '2',       color: '#F59E0B' },
                ].map((chip, i) => (
                  <View key={i} style={s.statsChip}>
                    <Text style={[s.statsChipVal, { color: chip.color }]}>{chip.val}</Text>
                    <Text style={s.statsChipLabel}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Sign In button — below Live Analysis card */}
        <TouchableOpacity
          style={s.signInBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={18} color="#A78BFA" />
          <Text style={s.signInBtnTxt}>Sign In</Text>
        </TouchableOpacity>

        {/* 2 — Eyebrow label */}
        <View style={s.eyebrowWrap}>
          <View style={s.eyebrowPill}>
            <View style={s.eyebrowDot} />
            <Text style={s.eyebrowTxt}>AI Communication Coach</Text>
          </View>
        </View>

        {/* 3 — Headline (Nike-style bold editorial) */}
        <View>
          <Text style={s.headline}>
            {'MASTER\nEVERY\n'}
            <Text style={s.headlineAccent}>CONVO.</Text>
          </Text>
        </View>

        {/* 4 — Subheadline */}
        <Text style={s.subline}>
          AI-powered coaching for speech, writing, and interviews.
        </Text>

        {/* 5 — Stats bar */}
        <View style={s.statsBar}>
          {[
            { val: '50K+', lbl: 'Users' },
            { val: '95%',  lbl: 'Satisfaction' },
            { val: '4.9★', lbl: 'Rating' },
          ].map((st, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={s.statsBarDivider} />}
              <View style={s.statsBarItem}>
                <Text style={s.statsBarVal}>{st.val}</Text>
                <Text style={s.statsBarLbl}>{st.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* 6 — CTA buttons */}
        <View style={s.ctaWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={s.ctaBtn}
            onPress={() => navigation.navigate('Feature1')}
          >
            <LinearGradient
              colors={['#8B5CF6', '#4338CA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.ctaBtnInner}
            >
              <Text style={s.ctaBtnTxt}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={s.loginLinkTxt}>
              Already have an account?{'  '}<Text style={s.loginLinkAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05050F',
  },
  scrollView: { flex: 1 },
  noiseOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.03,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
  } as any,

  orb: { position: 'absolute', borderRadius: 9999, overflow: 'hidden' },
  orb1: { width: 320, height: 320, top: -100, left: -80,  opacity: 0.22 },
  orb2: { width: 280, height: 280, top: -60,  right: -60, opacity: 0.18 },
  orb3: { width: 300, height: 300, bottom: -80, alignSelf: 'center', opacity: 0.15 },

  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    justifyContent: 'center',
  },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.50)',
    borderRadius: 18, paddingVertical: 15,
    backgroundColor: 'rgba(139,92,246,0.09)',
    marginBottom: 20,
  },
  signInBtnTxt: { fontSize: 16, fontWeight: '700', color: '#A78BFA', letterSpacing: 0.2 },
  logoMark: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMarkEmoji: { fontSize: 20 },
  logoMarkText: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5 },
  logoMarkAccent: { color: '#06B6D4' },

  // Hero 3D card
  heroCardWrap: { marginBottom: 24 },
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  heroCardBorderGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
  },
  heroCardInner: { padding: 18, gap: 14 },
  micRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  micCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.30)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  micInfo: { flex: 1 },
  micLabel: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  micDotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  micDotActive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F43F5E' },
  micStatus: { fontSize: 11, color: 'rgba(241,245,249,0.50)' },
  scoreChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  scoreChipTxt: { fontSize: 18, fontWeight: '800', color: '#10B981' },
  scoreChipSub: { fontSize: 9, color: 'rgba(16,185,129,0.7)', fontWeight: '600' },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 44, overflow: 'hidden' },
  waveBar: { flex: 1, maxWidth: 5, height: 44, borderRadius: 2, minHeight: 4 },
  statsChipRow: { flexDirection: 'row', gap: 8 },
  statsChip: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statsChipVal: { fontSize: 13, fontWeight: '800' },
  statsChipLabel: { fontSize: 9, color: 'rgba(241,245,249,0.40)', fontWeight: '500' },

  // Eyebrow
  eyebrowWrap: { marginBottom: 14 },
  eyebrowPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6' },
  eyebrowTxt: { fontSize: 11, color: '#A78BFA', fontWeight: '600', letterSpacing: 0.3 },

  // Nike-style headline
  headline: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F1F5F9',
    lineHeight: 52,
    letterSpacing: -2,
    marginBottom: 12,
  },
  headlineAccent: {
    color: '#8B5CF6',
  },

  subline: {
    fontSize: 15,
    color: 'rgba(241,245,249,0.45)',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    marginBottom: 24,
    overflow: 'hidden',
  },
  statsBarItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statsBarDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  statsBarVal: { fontSize: 18, fontWeight: '800', color: '#F1F5F9', marginBottom: 2 },
  statsBarLbl: { fontSize: 10, color: 'rgba(241,245,249,0.38)', fontWeight: '500' },

  // CTA
  ctaWrap: { gap: 12 },
  ctaBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.55, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  ctaBtnInner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },

  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkTxt: { fontSize: 14, color: 'rgba(241,245,249,0.40)' },
  loginLinkAccent: { color: '#06B6D4', fontWeight: '600' },
});
