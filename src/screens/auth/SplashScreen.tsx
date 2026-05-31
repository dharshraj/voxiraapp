import React, { useEffect, useRef } from 'react';
import {
  Animated, View, Text, StyleSheet, StatusBar, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

export default function SplashScreen({ navigation }: any) {
  // ── Orb animations ──────────────────────────────────────────
  const orbXa = useRef(new Animated.Value(0)).current;
  const orbXb = useRef(new Animated.Value(0)).current;
  const orbYa = useRef(new Animated.Value(0)).current;
  const orbYb = useRef(new Animated.Value(0)).current;

  // Orb 1 (purple top-left)
  const orb1Xa = useRef(new Animated.Value(0)).current;
  const orb1Xb = useRef(new Animated.Value(0)).current;
  const orb1Ya = useRef(new Animated.Value(0)).current;
  const orb1Yb = useRef(new Animated.Value(0)).current;

  // Orb 2 (cyan top-right)
  const orb2Xa = useRef(new Animated.Value(0)).current;
  const orb2Xb = useRef(new Animated.Value(0)).current;
  const orb2Ya = useRef(new Animated.Value(0)).current;
  const orb2Yb = useRef(new Animated.Value(0)).current;

  // Orb 3 (rose bottom-center)
  const orb3Xa = useRef(new Animated.Value(0)).current;
  const orb3Xb = useRef(new Animated.Value(0)).current;
  const orb3Ya = useRef(new Animated.Value(0)).current;
  const orb3Yb = useRef(new Animated.Value(0)).current;

  // ── Entrance animations ──────────────────────────────────────
  const logoOpacity   = useRef(new Animated.Value(1)).current;
  const logoTranslate = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(1)).current;
  const ringScale     = useRef(new Animated.Value(1)).current;

  const titleOpacity   = useRef(new Animated.Value(1)).current;
  const titleTranslate = useRef(new Animated.Value(0)).current;

  const subOpacity   = useRef(new Animated.Value(1)).current;
  const subTranslate = useRef(new Animated.Value(0)).current;

  const pill1Opacity   = useRef(new Animated.Value(1)).current;
  const pill1Translate = useRef(new Animated.Value(0)).current;
  const pill2Opacity   = useRef(new Animated.Value(1)).current;
  const pill2Translate = useRef(new Animated.Value(0)).current;
  const pill3Opacity   = useRef(new Animated.Value(1)).current;
  const pill3Translate = useRef(new Animated.Value(0)).current;

  // ── Progress bar ─────────────────────────────────────────────
  const progressWidth = useRef(new Animated.Value(0)).current;

  const startOrbLoop = (xa: Animated.Value, xb: Animated.Value, ya: Animated.Value, yb: Animated.Value, dur = 3000) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(xa, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(xa, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(xb, { toValue: 1, duration: dur * 1.3, useNativeDriver: true }),
        Animated.timing(xb, { toValue: 0, duration: dur * 1.3, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ya, { toValue: 1, duration: dur * 1.1, useNativeDriver: true }),
        Animated.timing(ya, { toValue: 0, duration: dur * 1.1, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(yb, { toValue: 1, duration: dur * 0.9, useNativeDriver: true }),
        Animated.timing(yb, { toValue: 0, duration: dur * 0.9, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    // Orb loops
    startOrbLoop(orb1Xa, orb1Xb, orb1Ya, orb1Yb, 3200);
    startOrbLoop(orb2Xa, orb2Xb, orb2Ya, orb2Yb, 2800);
    startOrbLoop(orb3Xa, orb3Xb, orb3Ya, orb3Yb, 3600);

    // Ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Staggered entrance
    const stagger = (opVal: Animated.Value, transVal: Animated.Value, delay: number) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opVal,    { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(transVal, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    };

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity,   { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.spring(logoScale,     { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();

    stagger(titleOpacity,   titleTranslate,   500);
    stagger(subOpacity,     subTranslate,     700);
    stagger(pill1Opacity,   pill1Translate,   900);
    stagger(pill2Opacity,   pill2Translate,   1020);
    stagger(pill3Opacity,   pill3Translate,   1140);

    // Progress bar over 2500ms
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Navigate after 3000ms
    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Welcome');
        }
      } catch {
        navigation.replace('Welcome');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const orb1TranslateX = orb1Xa.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const orb1TranslateY = orb1Ya.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const orb2TranslateX = orb2Xa.interpolate({ inputRange: [0, 1], outputRange: [20, -20] });
  const orb2TranslateY = orb2Ya.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const orb3TranslateX = orb3Xa.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const orb3TranslateY = orb3Ya.interpolate({ inputRange: [0, 1], outputRange: [20, -20] });

  const { width: W } = Dimensions.get('window');
  const progressWidthInterp = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, W - 48],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      {/* Orb 1 — purple top-left */}
      <Animated.View
        style={[
          s.orb, s.orb1,
          { transform: [{ translateX: orb1TranslateX }, { translateY: orb1TranslateY }] },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6D28D9']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Orb 2 — cyan top-right */}
      <Animated.View
        style={[
          s.orb, s.orb2,
          { transform: [{ translateX: orb2TranslateX }, { translateY: orb2TranslateY }] },
        ]}
      >
        <LinearGradient
          colors={['#06B6D4', '#0891B2']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Orb 3 — rose bottom-center */}
      <Animated.View
        style={[
          s.orb, s.orb3,
          { transform: [{ translateX: orb3TranslateX }, { translateY: orb3TranslateY }] },
        ]}
      >
        <LinearGradient
          colors={['#F43F5E', '#BE123C']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Central content */}
      <View style={s.center}>
        {/* Glow ring */}
        <Animated.View style={[s.glowRing, { transform: [{ scale: ringScale }] }]} />

        {/* Logo */}
        <Animated.View style={[
          s.logoWrap,
          {
            opacity: logoOpacity,
            transform: [
              { translateY: logoTranslate },
              { scale: logoScale },
            ],
          },
        ]}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.logoBox}
          >
            <Text style={s.logoEmoji}>🎙️</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[
          s.title,
          { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
        ]}>
          VOX<Text style={s.titleAccent}>IRA</Text>
        </Animated.Text>

        {/* Sub */}
        <Animated.Text style={[
          s.sub,
          { opacity: subOpacity, transform: [{ translateY: subTranslate }] },
        ]}>
          Master Every Conversation
        </Animated.Text>

        {/* Pills */}
        <View style={s.pillRow}>
          {[
            { label: '🎤 Speech AI', anim: { opacity: pill1Opacity, transform: [{ translateY: pill1Translate }] } },
            { label: '✍️ Writing',   anim: { opacity: pill2Opacity, transform: [{ translateY: pill2Translate }] } },
            { label: '🤝 Interviews',anim: { opacity: pill3Opacity, transform: [{ translateY: pill3Translate }] } },
          ].map((p, i) => (
            <Animated.View key={i} style={[s.pill, p.anim]}>
              <Text style={s.pillTxt}>{p.label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: progressWidthInterp }]}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05050F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Orbs
  orb: {
    position: 'absolute',
    opacity: 0.2,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  orb1: { width: 300, height: 300, top: -80, left: -80 },
  orb2: { width: 260, height: 260, top: -60, right: -60 },
  orb3: { width: 280, height: 280, bottom: -80, alignSelf: 'center' },

  // Center
  center: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  logoWrap: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 48 },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  titleAccent: { color: '#06B6D4' },
  sub: {
    fontSize: 15,
    color: 'rgba(241,245,249,0.38)',
    letterSpacing: 0.3,
    marginBottom: 32,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillTxt: {
    fontSize: 13,
    color: 'rgba(241,245,249,0.65)',
    fontWeight: '500',
  },
  // Progress
  progressTrack: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 36,
    left: 24,
    right: 24,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
});
