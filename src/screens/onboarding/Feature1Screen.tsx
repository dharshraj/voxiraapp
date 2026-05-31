import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');

const FEATURES = [
  { icon: 'mic-outline' as const,         label: 'Filler Detection',    color: '#8B5CF6', sub: 'Catch every "um" & "uh"' },
  { icon: 'speedometer-outline' as const, label: 'Pace Analysis',       color: '#06B6D4', sub: 'Optimal 110–150 wpm'      },
  { icon: 'volume-high-outline' as const, label: 'Pronunciation',       color: '#10B981', sub: 'Word-level clarity score'  },
  { icon: 'trending-up-outline' as const, label: 'Confidence Scoring',  color: '#F59E0B', sub: 'Real-time feedback'        },
];

const BAR_COUNT = 28;

export default function Feature1Screen({ navigation }: any) {
  const waveAnims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;
  const micScale  = useRef(new Animated.Value(1)).current;
  const pulseRing = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;


  const orb1x = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, dur: number, [a, b]: [number, number]) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start();

    loop(orb1x, 3200, [-20, 20]);
    loop(orb2x, 2900, [20, -20]);

    Animated.loop(Animated.sequence([
      Animated.timing(cardFloat, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(cardFloat, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(micScale,  { toValue: 1.08, duration: 900, useNativeDriver: true }),
      Animated.timing(micScale,  { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseRing, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulseRing, { toValue: 0, duration: 200,  useNativeDriver: true }),
    ])).start();

    waveAnims.forEach((a, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 40),
        Animated.timing(a, { toValue: 0.3 + Math.random() * 0.7, duration: 380 + i * 22, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.1 + Math.random() * 0.3, duration: 340 + i * 18, useNativeDriver: true }),
      ])).start();
    });

  }, []);

  const floatY = cardFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const orb1TX = orb1x.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] });
  const orb2TX = orb2x.interpolate({ inputRange: [0, 1], outputRange: [22, -22] });
  const ringScale   = pulseRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulseRing.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.5, 0.1, 0] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1TX }] }]}>
        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2TX }] }]}>
        <LinearGradient colors={['#06B6D4', '#0891B2']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Progress bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipPill} onPress={() => navigation.navigate('Register')}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <LinearGradient colors={['#8B5CF6', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progressFill, { width: '33%' }]} />
        </View>
        <Text style={s.stepTxt}>1 / 3</Text>
      </View>

      <ScrollView
        style={[s.scroll, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'scroll' } as any)]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 0 — Hero card with waveform */}
        <Animated.View style={[s.heroWrap, entry(0), { transform: [{ translateY: floatY }] }]}>
          <LinearGradient
            colors={['#1A0A2E', '#0D1628', '#0A0D1E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            {/* Mic with pulse ring */}
            <View style={s.micArea}>
              <Animated.View style={[s.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
              <Animated.View style={[s.micCircle, { transform: [{ scale: micScale }] }]}>
                <LinearGradient colors={['#8B5CF6', '#4338CA']} style={StyleSheet.absoluteFill} />
                <Ionicons name="mic" size={26} color="#fff" />
              </Animated.View>
            </View>

            {/* Waveform */}
            <View style={s.waveContainer}>
              {waveAnims.map((a, i) => (
                <Animated.View
                  key={i}
                  style={[
                    s.waveBar,
                    {
                      transform: [{ scaleY: a }],
                      backgroundColor:
                        i % 5 === 0 ? '#8B5CF6' :
                        i % 5 === 1 ? '#A78BFA' :
                        i % 5 === 2 ? '#06B6D4' :
                        i % 5 === 3 ? '#7C3AED' :
                        'rgba(139,92,246,0.35)',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Clarity score badge */}
            <View style={s.badge}>
              <View style={s.badgeDot} />
              <Text style={s.badgeTxt}>Clarity Score: 94/100</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 1 — Label */}
        <View style={s.labelWrap}>
          <Text style={s.eyebrow}>SPEECH ANALYSIS</Text>
        </View>

        {/* 2 — Title */}
        <View>
          <Text style={s.title}>
            {'SPEAK\n'}
            <Text style={s.titleAccent}>LOUD.</Text>
          </Text>
          <Text style={s.desc}>
            AI coaching that detects filler words, measures your pace, and scores your clarity in real time.
          </Text>
        </View>

        {/* 3 — Feature grid */}
        <View style={s.grid}>
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
        </View>

      </ScrollView>

      {/* 4 — Bottom CTA */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.nextBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Feature2')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#4338CA']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.nextGrad}
          >
            <Text style={s.nextTxt}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050F' },
  orb: { position: 'absolute', borderRadius: 9999, overflow: 'hidden', opacity: 0.18 },
  orb1: { width: 250, height: 250, top: -80, left: -70 },
  orb2: { width: 220, height: 220, bottom: 80, right: -60 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
  },
  skipPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skipTxt: { fontSize: 12, color: 'rgba(241,245,249,0.45)', fontWeight: '500' },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepTxt: { fontSize: 12, color: 'rgba(241,245,249,0.45)', fontWeight: '600', width: 32, textAlign: 'right' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 8 },

  heroWrap: { marginBottom: 20 },
  heroCard: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
    padding: 20, gap: 14,
  },
  micArea: { alignItems: 'center', justifyContent: 'center', height: 80 },
  pulseRing: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: '#8B5CF6',
  },
  micCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 50 },
  waveBar: { flex: 1, maxWidth: 6, height: 50, borderRadius: 3, minHeight: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  badgeTxt: { fontSize: 11, color: '#10B981', fontWeight: '600' },

  labelWrap: { marginBottom: 6 },
  eyebrow: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2,
    color: '#8B5CF6', textTransform: 'uppercase',
  },
  title: {
    fontSize: 44, fontWeight: '900',
    color: '#F1F5F9',
    lineHeight: 48, letterSpacing: -1.5,
    marginBottom: 10,
  },
  titleAccent: { color: '#8B5CF6' },
  desc: { fontSize: 14, color: 'rgba(241,245,249,0.45)', lineHeight: 22, marginBottom: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 12,
  },
  gridIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  gridText: { flex: 1 },
  gridLabel: { fontSize: 12, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  gridSub: { fontSize: 10, color: 'rgba(241,245,249,0.35)' },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 12,
  },
  nextBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#8B5CF6', shadowOpacity: 0.5, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  nextGrad: {
    height: 58, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  nextTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
