import React, { useEffect, useRef } from 'react';
import {
  Animated, View, Text, StyleSheet, StatusBar, Dimensions, Platform, ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

export default function SplashScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();

  const orb1Xa = useRef(new Animated.Value(0)).current;
  const orb1Xb = useRef(new Animated.Value(0)).current;
  const orb1Ya = useRef(new Animated.Value(0)).current;
  const orb1Yb = useRef(new Animated.Value(0)).current;
  const orb2Xa = useRef(new Animated.Value(0)).current;
  const orb2Xb = useRef(new Animated.Value(0)).current;
  const orb2Ya = useRef(new Animated.Value(0)).current;
  const orb2Yb = useRef(new Animated.Value(0)).current;
  const orb3Xa = useRef(new Animated.Value(0)).current;
  const orb3Xb = useRef(new Animated.Value(0)).current;
  const orb3Ya = useRef(new Animated.Value(0)).current;
  const orb3Yb = useRef(new Animated.Value(0)).current;

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
  const progressWidth = useRef(new Animated.Value(0)).current;

  const startOrbLoop = (xa: Animated.Value, xb: Animated.Value, ya: Animated.Value, yb: Animated.Value, dur = 3000) => {
    Animated.loop(Animated.sequence([
      Animated.timing(xa, { toValue: 1, duration: dur, useNativeDriver: true }),
      Animated.timing(xa, { toValue: 0, duration: dur, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(xb, { toValue: 1, duration: dur * 1.3, useNativeDriver: true }),
      Animated.timing(xb, { toValue: 0, duration: dur * 1.3, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(ya, { toValue: 1, duration: dur * 1.1, useNativeDriver: true }),
      Animated.timing(ya, { toValue: 0, duration: dur * 1.1, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(yb, { toValue: 1, duration: dur * 0.9, useNativeDriver: true }),
      Animated.timing(yb, { toValue: 0, duration: dur * 0.9, useNativeDriver: true }),
    ])).start();
  };

  useEffect(() => {
    startOrbLoop(orb1Xa, orb1Xb, orb1Ya, orb1Yb, 3200);
    startOrbLoop(orb2Xa, orb2Xb, orb2Ya, orb2Yb, 2800);
    startOrbLoop(orb3Xa, orb3Xb, orb3Ya, orb3Yb, 3600);

    Animated.loop(Animated.sequence([
      Animated.timing(ringScale, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();

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

    stagger(titleOpacity, titleTranslate, 500);
    stagger(subOpacity,   subTranslate,   700);
    stagger(pill1Opacity, pill1Translate, 900);
    stagger(pill2Opacity, pill2Translate, 1020);
    stagger(pill3Opacity, pill3Translate, 1140);

    Animated.timing(progressWidth, { toValue: 1, duration: 2500, useNativeDriver: false }).start();

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
  const progressWidthInterp = progressWidth.interpolate({ inputRange: [0, 1], outputRange: [0, W - 48] });

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    orb: { position: 'absolute', opacity: 0.15, borderRadius: 9999, backgroundColor: C.primary },
    orb1: { width: 300, height: 300, top: -80, left: -80 },
    orb2: { width: 260, height: 260, top: -60, right: -60, opacity: 0.1 },
    orb3: { width: 280, height: 280, bottom: -80, alignSelf: 'center', opacity: 0.08 },
    center: { alignItems: 'center', paddingHorizontal: 24 },
    glowRing: {
      position: 'absolute', width: 130, height: 130, borderRadius: 65,
      borderWidth: 1, borderColor: C.primary + '60',
    },
    logoWrap: { marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
    logoBox: {
      width: 100, height: 100, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary,
    },
    logoEmoji: { fontSize: 48 },
    title: { fontSize: 52, fontWeight: '900', color: C.text, letterSpacing: -1.5, marginBottom: 10 },
    titleAccent: { color: C.primary },
    sub: { fontSize: 15, color: C.textMuted, letterSpacing: 0.3, marginBottom: 32 },
    pillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
    pill: {
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    },
    pillTxt: { fontSize: 13, color: C.textSec, fontWeight: '500' },
    progressTrack: {
      position: 'absolute', bottom: Platform.OS === 'ios' ? 52 : 36,
      left: 24, right: 24, height: 3,
      backgroundColor: C.border, borderRadius: 3, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: C.primary },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1TranslateX }, { translateY: orb1TranslateY }] }]} />
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2TranslateX }, { translateY: orb2TranslateY }] }]} />
      <Animated.View style={[s.orb, s.orb3, { transform: [{ translateX: orb3TranslateX }, { translateY: orb3TranslateY }] }]} />

      <ScrollView
        style={[, Platform.OS === 'web' && ({ overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.center}>
          <Animated.View style={[s.glowRing, { transform: [{ scale: ringScale }] }]} />

          <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ translateY: logoTranslate }, { scale: logoScale }] }]}>
            <View style={s.logoBox}>
              <Text style={s.logoEmoji}>🎙️</Text>
            </View>
          </Animated.View>

          <Animated.Text style={[s.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
            VOX<Text style={s.titleAccent}>IRA</Text>
          </Animated.Text>

          <Animated.Text style={[s.sub, { opacity: subOpacity, transform: [{ translateY: subTranslate }] }]}>
            Master Every Conversation
          </Animated.Text>

          <View style={s.pillRow}>
            {[
              { label: '🎤 Speech AI', anim: { opacity: pill1Opacity, transform: [{ translateY: pill1Translate }] } },
            ].map((p, i) => (
              <Animated.View key={i} style={[s.pill, p.anim]}>
                <Text style={s.pillTxt}>{p.label}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: progressWidthInterp }]} />
      </View>
    </View>
  );
}
