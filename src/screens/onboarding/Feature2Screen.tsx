import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const FEATURES = [
  { icon: 'checkmark-circle-outline' as const, label: 'Grammar Fix',   sub: 'Instant corrections'  },
  { icon: 'color-palette-outline' as const,    label: 'Tone Analysis', sub: 'Formal / casual mode'  },
  { icon: 'refresh-outline' as const,          label: 'AI Rewrite',    sub: 'Smarter phrasing'      },
  { icon: 'document-text-outline' as const,    label: '20+ Templates', sub: 'Ready to use'          },
];

const CORRECTIONS = [
  { original: 'Their going to the meeting',  fixed: "They're going to the meeting", bad: true },
  { original: 'Please revert back to me',    fixed: 'Please respond to me',          bad: true },
  { original: 'Best regards, Alex',          fixed: null,                            bad: false },
];

export default function Feature2Screen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const cardFloat = useRef(new Animated.Value(0)).current;
  const orb1x = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;

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
  }, []);

  const floatY = cardFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    orb:  { position: 'absolute', borderRadius: 9999, overflow: 'hidden', opacity: 0.12, backgroundColor: C.primary },
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
      padding: 16, gap: 10,
    },
    editorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    editorDots:   { flexDirection: 'row', gap: 5 },
    editorDot:    { width: 8, height: 8, borderRadius: 4 },
    editorTitle:  { flex: 1, fontSize: 12, color: C.textMuted, fontWeight: '500', marginLeft: 4 },
    grammarBadge: {
      backgroundColor: C.success + '30',
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1, borderColor: C.success + '50',
    },
    grammarBadgeTxt: { fontSize: 11, color: C.success, fontWeight: '700' },
    corrRow: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      borderRadius: 10, padding: 10,
      borderWidth: 1, borderColor: C.border,
    },
    corrContent: { flex: 1 },
    corrText: { fontSize: 11, color: C.text, marginBottom: 2 },
    corrStrike: { textDecorationLine: 'line-through', color: C.error },
    corrFixed: { fontSize: 12, color: C.success, fontWeight: '600' },
    grammarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    grammarText: { fontSize: 11, color: C.success, fontStyle: 'italic' },
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
    bottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 48 : 32, paddingTop: 12 },
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
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View style={[s.orb, s.orb1, { transform: [{ translateX: orb1x.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] }) }] }]} />
      <Animated.View style={[s.orb, s.orb2, { transform: [{ translateX: orb2x.interpolate({ inputRange: [0, 1], outputRange: [22, -22] }) }] }]} />

      {/* Progress */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipPill} onPress={() => navigation.navigate('Register')}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: '66%' }]} />
        </View>
        <Text style={s.stepTxt}>2 / 3</Text>
      </View>

      <ScrollView
        style={[s.scroll, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'scroll' } as any)]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card: editor */}
        <Animated.View style={[s.heroWrap, { transform: [{ translateY: floatY }] }]}>
          <View style={s.heroCard}>
            <View style={s.editorHeader}>
              <View style={s.editorDots}>
                <View style={[s.editorDot, { backgroundColor: C.error }]} />
                <View style={[s.editorDot, { backgroundColor: C.warning }]} />
                <View style={[s.editorDot, { backgroundColor: C.success }]} />
              </View>
              <Text style={s.editorTitle}>Writing Coach</Text>
              <View style={s.grammarBadge}>
                <Text style={s.grammarBadgeTxt}>97%</Text>
              </View>
            </View>

            {CORRECTIONS.map((c, i) => (
              <View key={i} style={[s.corrRow, { backgroundColor: c.bad ? C.error + '14' : C.success + '14' }]}>
                <Ionicons
                  name={c.bad ? 'close-circle' : 'checkmark-circle'}
                  size={16}
                  color={c.bad ? C.error : C.success}
                />
                <View style={s.corrContent}>
                  <Text style={[s.corrText, c.bad && s.corrStrike]}>{c.original}</Text>
                  {c.fixed && <Text style={s.corrFixed}>{c.fixed}</Text>}
                </View>
              </View>
            ))}

            <View style={s.grammarRow}>
              <Ionicons name="sparkles" size={12} color={C.success} />
              <Text style={s.grammarText}>Grammar improved — professional tone detected</Text>
            </View>
          </View>
        </Animated.View>

        <View style={s.labelWrap}>
          <Text style={s.eyebrow}>WRITING COACH</Text>
        </View>

        <View>
          <Text style={s.title}>
            {'WRITE\n'}
            <Text style={s.titleAccent}>SHARP.</Text>
          </Text>
          <Text style={s.desc}>
            AI grammar correction, tone detection, smart rewrites, and 20+ professional templates.
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
              onPress={() => navigation.navigate('Feature3')}
            >
              <Text style={s.nextTxt}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
