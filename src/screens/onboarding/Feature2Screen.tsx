import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const FEATURES = [
  { icon: 'checkmark-circle-outline' as const, label: 'Grammar Fix',   color: '#10B981', sub: 'Instant corrections'  },
  { icon: 'color-palette-outline' as const,    label: 'Tone Analysis', color: '#06B6D4', sub: 'Formal / casual mode'  },
  { icon: 'refresh-outline' as const,          label: 'AI Rewrite',    color: '#8B5CF6', sub: 'Smarter phrasing'      },
  { icon: 'document-text-outline' as const,    label: '20+ Templates', color: '#F59E0B', sub: 'Ready to use'          },
];

const CORRECTIONS = [
  { original: 'Their going to the meeting',  fixed: "They're going to the meeting", bad: true },
  { original: 'Please revert back to me',    fixed: 'Please respond to me',          bad: true },
  { original: 'Best regards, Alex',          fixed: null,                            bad: false },
];

export default function Feature2Screen({ navigation }: any) {
  const cardFloat = useRef(new Animated.Value(0)).current;
  const orb1x = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;

  const opacities  = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const translates = useRef(Array.from({ length: 5 }, () => new Animated.Value(28))).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(cardFloat, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(cardFloat, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ])).start();

    [orb1x, orb2x].forEach((v, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 3100 + i * 400, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 3100 + i * 400, useNativeDriver: true }),
      ])).start();
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
  const entry  = (i: number) => ({
    opacity: opacities[i],
    transform: [{ translateY: translates[i] }],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1x.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] }) }] }]}>
        <LinearGradient colors={['#10B981', '#059669']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2x.interpolate({ inputRange: [0, 1], outputRange: [22, -22] }) }] }]}>
        <LinearGradient colors={['#06B6D4', '#0891B2']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Progress */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipPill} onPress={() => navigation.navigate('Register')}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <LinearGradient colors={['#10B981', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progressFill, { width: '66%' }]} />
        </View>
        <Text style={s.stepTxt}>2 / 3</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 0 — Hero card: editor */}
        <Animated.View style={[s.heroWrap, entry(0), { transform: [{ translateY: floatY }] }]}>
          <LinearGradient
            colors={['#0A1F14', '#0D1628', '#0A0D1E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            {/* Editor header */}
            <View style={s.editorHeader}>
              <View style={s.editorDots}>
                <View style={[s.editorDot, { backgroundColor: '#EF4444' }]} />
                <View style={[s.editorDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[s.editorDot, { backgroundColor: '#22C55E' }]} />
              </View>
              <Text style={s.editorTitle}>Writing Coach</Text>
              <View style={s.grammarBadge}>
                <Text style={s.grammarBadgeTxt}>97%</Text>
              </View>
            </View>

            {/* Corrections */}
            {CORRECTIONS.map((c, i) => (
              <View key={i} style={[s.corrRow, { backgroundColor: c.bad ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }]}>
                <Ionicons
                  name={c.bad ? 'close-circle' : 'checkmark-circle'}
                  size={16}
                  color={c.bad ? '#EF4444' : '#22C55E'}
                />
                <View style={s.corrContent}>
                  <Text style={[s.corrText, c.bad && s.corrStrike]}>{c.original}</Text>
                  {c.fixed && <Text style={s.corrFixed}>{c.fixed}</Text>}
                </View>
              </View>
            ))}

            <View style={s.grammarRow}>
              <Ionicons name="sparkles" size={12} color="#10B981" />
              <Text style={s.grammarText}>Grammar improved — professional tone detected</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 1 */}
        <Animated.View style={[s.labelWrap, entry(1)]}>
          <Text style={s.eyebrow}>WRITING COACH</Text>
        </Animated.View>

        {/* 2 */}
        <Animated.View style={entry(2)}>
          <Text style={s.title}>
            {'WRITE\n'}
            <Text style={s.titleAccent}>SHARP.</Text>
          </Text>
          <Text style={s.desc}>
            AI grammar correction, tone detection, smart rewrites, and 20+ professional templates.
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
            onPress={() => navigation.navigate('Feature3')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.nextGrad}
            >
              <Text style={s.nextTxt}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050F' },
  orb:  { position: 'absolute', borderRadius: 9999, overflow: 'hidden', opacity: 0.18 },
  orb1: { width: 240, height: 240, top: -60, left: -60 },
  orb2: { width: 220, height: 220, bottom: 100, right: -60 },

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
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.20)',
    padding: 16, gap: 10,
  },
  editorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  editorDots:   { flexDirection: 'row', gap: 5 },
  editorDot:    { width: 8, height: 8, borderRadius: 4 },
  editorTitle:  { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginLeft: 4 },
  grammarBadge: {
    backgroundColor: 'rgba(16,185,129,0.20)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  grammarBadgeTxt: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  corrRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  corrContent: { flex: 1 },
  corrText: { fontSize: 11, color: 'rgba(255,255,255,0.80)', marginBottom: 2 },
  corrStrike: { textDecorationLine: 'line-through', color: '#EF4444' },
  corrFixed: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  grammarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grammarText: { fontSize: 11, color: 'rgba(16,185,129,0.80)', fontStyle: 'italic' },

  labelWrap: { marginBottom: 6 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: '#10B981', textTransform: 'uppercase' },
  title: { fontSize: 44, fontWeight: '900', color: '#F1F5F9', lineHeight: 48, letterSpacing: -1.5, marginBottom: 10 },
  titleAccent: { color: '#10B981' },
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

  bottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28, paddingTop: 12 },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  backBtn: {
    width: 52, height: 52, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flex: 1, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#10B981', shadowOpacity: 0.45, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  nextGrad: {
    height: 58, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  nextTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
