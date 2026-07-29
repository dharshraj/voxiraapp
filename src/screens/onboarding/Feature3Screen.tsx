import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function Feature3Screen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const s = StyleSheet.create({
    root:     { flex: 1, backgroundColor: C.bg },
    inner:    { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 40 },
    badge:    { alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20, borderWidth: 1, borderColor: C.border },
    badgeTxt: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 1, textTransform: 'uppercase' },
    heading:  { fontSize: 30, fontWeight: '800', color: C.text, marginBottom: 10, lineHeight: 38 },
    sub:      { fontSize: 15, color: C.textSec, lineHeight: 24, marginBottom: 36 },
    iconBox:  { width: 80, height: 80, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 32 },
    card:     { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 12, gap: 10 },
    cardRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    cardTxt:  { flex: 1 },
    cardTitle:{ fontSize: 14, fontWeight: '700', color: C.text },
    cardSub:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
    footer:   { marginTop: 'auto' as any, gap: 12 },
    nextBtn:  { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    nextTxt:  { fontSize: 16, fontWeight: '700', color: '#fff' },
    dots:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
    dotActive:{ backgroundColor: C.primary, width: 18 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[s.inner, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <View style={s.badge}><Text style={s.badgeTxt}>Feature 3 of 3</Text></View>
        <View style={s.iconBox}>
          <Ionicons name="trophy-outline" size={38} color={C.primary} />
        </View>
        <Text style={s.heading}>Track Progress{'\n'}& Earn Coins</Text>
        <Text style={s.sub}>Stay motivated with streaks, achievements, and a clear picture of how far you've come.</Text>

        {[
          { icon: 'flame-outline',         title: 'Daily Streaks',       sub: 'Build a habit with day-by-day consistency tracking' },
          { icon: 'trophy-outline',         title: 'Achievements',        sub: 'Unlock coins as you hit real milestones' },
          { icon: 'trending-up-outline',    title: 'Progress Over Time',  sub: 'See your scores, WPM, and clarity improve weekly' },
        ].map((item, i) => (
          <View key={i} style={s.card}>
            <View style={s.cardRow}>
              <View style={s.cardIcon}><Ionicons name={item.icon as any} size={20} color={C.primary} /></View>
              <View style={s.cardTxt}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardSub}>{item.sub}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={s.footer}>
          <View style={s.dots}>
            {[0,1,2].map(i => <View key={i} style={[s.dot, i === 2 && s.dotActive]} />)}
          </View>
          <TouchableOpacity style={s.nextBtn} onPress={() => navigation.navigate('GoalSelection')} activeOpacity={0.85}>
            <Text style={s.nextTxt}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
