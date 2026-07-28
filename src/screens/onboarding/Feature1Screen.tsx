import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const FEATURES = [
  { icon: 'mic-outline' as const,         label: 'Filler Detection',    sub: 'Catch every "um" & "uh"' },
  { icon: 'speedometer-outline' as const, label: 'Pace Analysis',       sub: 'Optimal 110–150 wpm'      },
  { icon: 'volume-high-outline' as const, label: 'Pronunciation',       sub: 'Word-level clarity score'  },
  { icon: 'trending-up-outline' as const, label: 'Confidence Scoring',  sub: 'Real-time feedback'        },
];

const BAR_COUNT = 28;

export default function Feature1Screen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const waveAnims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;
  const micScale  = useRef(new Animated.Value(1)).current;
  const pulseRing = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;
  const orb1x = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start();

    loop(orb1x, 3200);
    loop(orb2x, 2900);

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

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    orb: { position: 'absolute', borderRadius: 9999, overflow: 'hidden', opacity: 0.12, backgroundColor: C.primary },
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
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    skipTxt: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    progressTrack: { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: C.primary },
    stepTxt: { fontSize: 12, color: C.textMuted, fontWeight: '600', width: 32, textAlign: 'right' },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 24 },
    heroWrap: { marginBottom: 20 },
    heroCard: {
      borderRadius: 24, overflow: 'hidden',
      borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surface,
      padding: 20, gap: 14,
    },
    micArea: { alignItems: 'center', justifyContent: 'center', height: 80 },
    pulseRing: {
      position: 'absolute',
      width: 64, height: 64, borderRadius: 32,
      borderWidth: 2, borderColor: C.primary,
    },
    micCircle: {
      width: 52, height: 52, borderRadius: 26,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary,
    },
    waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 50 },
    waveBar: { flex: 1, maxWidth: 6, height: 50, borderRadius: 3, minHeight: 4, backgroundColor: C.primary },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-end',
      backgroundColor: C.success + '25',
      borderWidth: 1, borderColor: C.success + '40',
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
    badgeTxt: { fontSize: 11, color: C.success, fontWeight: '600' },
    labelWrap: { marginBottom: 6 },
    eyebrow: {
      fontSize: 11, fontWeight: '700', letterSpacing: 2,
      color: C.primary, textTransform: 'uppercase',
    },
    title: {
      fontSize: 44, fontWeight: '900',
      color: C.text,
      lineHeight: 48, letterSpacing: -1.5,
      marginBottom: 10,
    },
    titleAccent: { color: C.primary },
    desc: { fontSize: 14, color: C.textMuted, lineHeight: 22, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridItem: {
      width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      borderRadius: 16, padding: 12,
    },
    gridIcon: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    gridText: { flex: 1 },
    gridLabel: { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
    gridSub: { fontSize: 10, color: C.textMuted },
    bottom: {
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 48 : 32,
      paddingTop: 12,
    },
    nextBtn: {
      borderRadius: 18, overflow: 'hidden',
      backgroundColor: C.primary,
      height: 58, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    nextTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1TX }] }]} />
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2TX }] }]} />

      {/* Progress bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipPill} onPress={() => navigation.navigate('Register')}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: '33%' }]} />
        </View>
        <Text style={s.stepTxt}>1 / 3</Text>
      </View>

      <ScrollView
        style={[s.scroll, Platform.OS === 'web' && ({ flex: 1, overflowY: 'auto' } as any)]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card */}
        <Animated.View style={[s.heroWrap, { transform: [{ translateY: floatY }] }]}>
          <View style={s.heroCard}>
            <View style={s.micArea}>
              <Animated.View style={[s.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
              <Animated.View style={[s.micCircle, { transform: [{ scale: micScale }] }]}>
                <Ionicons name="mic" size={22} color="#fff" />
              </Animated.View>
            </View>
            <View style={s.waveContainer}>
              {waveAnims.map((a, i) => (
                <Animated.View key={i} style={[s.waveBar, { transform: [{ scaleY: a }] }]} />
              ))}
            </View>
            <View style={s.badge}>
              <View style={s.badgeDot} />
              <Text style={s.badgeTxt}>Clarity Score: 94/100</Text>
            </View>
          </View>
        </Animated.View>

        <View style={s.labelWrap}>
          <Text style={s.eyebrow}>SPEECH ANALYSIS</Text>
        </View>

        <View>
          <Text style={s.title}>
            {'SPEAK\n'}
            <Text style={s.titleAccent}>LOUD.</Text>
          </Text>
          <Text style={s.desc}>
            AI coaching that detects filler words, measures your pace, and scores your clarity in real time.
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
          <TouchableOpacity
            style={s.nextBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Feature2')}
          >
            <Text style={s.nextTxt}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
