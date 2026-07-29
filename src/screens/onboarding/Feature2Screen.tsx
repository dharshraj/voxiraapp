import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function Feature2Screen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const BULLETS = [
    { icon: 'mic-outline',         text: 'Detects filler words in real time' },
    { icon: 'speedometer-outline', text: 'Measures your WPM against the ideal range' },
    { icon: 'trending-up-outline', text: 'Tracks confidence and clarity per session' },
    { icon: 'bar-chart-outline',   text: 'Shows improvement trends over time' },
  ];

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: C.bg },
    inner:   { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 40 },
    badge:   { alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20, borderWidth: 1, borderColor: C.border },
    badgeTxt:{ fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 1, textTransform: 'uppercase' },
    heading: { fontSize: 30, fontWeight: '800', color: C.text, marginBottom: 10, lineHeight: 38 },
    sub:     { fontSize: 15, color: C.textSec, lineHeight: 24, marginBottom: 36 },
    iconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 32 },
    bullets: { gap: 16, marginBottom: 40 },
    bullet:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
    bIcon:   { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    bTxt:    { fontSize: 14, color: C.textSec, flex: 1, lineHeight: 20 },
    footer:  { marginTop: 'auto' as any, gap: 12 },
    nextBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    nextTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipTxt: { fontSize: 14, color: C.textMuted },
    dots:    { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
    dotActive:{ backgroundColor: C.primary, width: 18 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[s.inner, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <View style={s.badge}><Text style={s.badgeTxt}>Feature 2 of 3</Text></View>
        <View style={s.iconBox}>
          <Ionicons name="analytics-outline" size={38} color={C.primary} />
        </View>
        <Text style={s.heading}>Deep Speech{'\n'}Analysis</Text>
        <Text style={s.sub}>Every session gives you a complete breakdown of exactly how you speak — not just a score.</Text>
        <View style={s.bullets}>
          {BULLETS.map((b, i) => (
            <View key={i} style={s.bullet}>
              <View style={s.bIcon}><Ionicons name={b.icon as any} size={20} color={C.primary} /></View>
              <Text style={s.bTxt}>{b.text}</Text>
            </View>
          ))}
        </View>
        <View style={s.footer}>
          <View style={s.dots}>
            {[0,1,2].map(i => <View key={i} style={[s.dot, i === 1 && s.dotActive]} />)}
          </View>
          <TouchableOpacity style={s.nextBtn} onPress={() => navigation.navigate('Feature3')} activeOpacity={0.85}>
            <Text style={s.nextTxt}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.skipBtn} onPress={() => navigation.navigate('GoalSelection')} activeOpacity={0.75}>
            <Text style={s.skipTxt}>Skip intro</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
