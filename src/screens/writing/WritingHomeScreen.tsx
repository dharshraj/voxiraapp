import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const WRITING_TYPES = [
  { id: 'email',  label: 'Email',  icon: 'mail-outline',          color: '#06B6D4' },
  { id: 'essay',  label: 'Essay',  icon: 'document-text-outline', color: '#8B5CF6' },
  { id: 'story',  label: 'Story',  icon: 'book-outline',          color: '#F59E0B' },
  { id: 'report', label: 'Report', icon: 'bar-chart-outline',     color: '#10B981' },
];

const AI_TOOLS = [
  { icon: 'checkmark-circle',  color: '#10B981', title: 'Grammar Check', sub: 'Fix errors instantly',  screen: 'GrammarResultScreen'    },
  { icon: 'pulse-outline',     color: '#06B6D4', title: 'Tone Analysis', sub: 'Understand your tone', screen: 'ToneAnalysisScreen'     },
  { icon: 'refresh-outline',   color: '#8B5CF6', title: 'AI Rewrite',    sub: 'Improve your writing', screen: 'RewriteScreen'          },
  { icon: 'color-palette',     color: '#F59E0B', title: 'Style Coach',   sub: 'Elevate your style',   screen: 'StyleSuggestionsScreen' },
];

export default function WritingHomeScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 3,  duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
    scrollContent: { paddingBottom: 100 },
    header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16 },
    headerTitle:   { fontSize: 22, fontWeight: '800', color: C.text },
    headerSub:     { fontSize: 13, color: C.textMuted, marginTop: 2 },
    histBtn:       { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    heroWrap:      { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 140, marginBottom: 24, backgroundColor: C.success },
    heroDecorCircle: { position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroInner:     { padding: 20, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconCircle:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    heroTextWrap:  { flex: 1 },
    heroTitle:     { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
    heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
    ctaBtn:        { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    ctaBtnTxt:     { fontSize: 13, fontWeight: '700', color: '#fff' },
    sectionTitle:  { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
    grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
    typeCard:      { width: '48%', borderRadius: 18, overflow: 'hidden', height: 80, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, position: 'relative' },
    typeCardInner: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, height: '100%' },
    typeIconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    typeTextWrap:  { flex: 1 },
    typeLabel:     { fontSize: 13, fontWeight: '700', color: C.text },
    typeSub:       { fontSize: 11, color: C.textMuted },
    typeBorderLeft:{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 3 },
    toolsList:     { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    toolRow:       { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    toolIconBox:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    toolText:      { flex: 1, marginLeft: 12 },
    toolTitle:     { fontSize: 14, fontWeight: '600', color: C.text },
    toolSub:       { fontSize: 12, color: C.textMuted },
    templatesCard: { marginHorizontal: 20, padding: 18, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', marginBottom: 16 },
    templatesTxt:  { fontSize: 14, fontWeight: '600', color: C.text },
    metricsCard:   { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginHorizontal: 20, marginBottom: 16 },
    metricRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: C.divider },
    metricIcon:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    metricLabel:   { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 1 },
    metricDesc:    { fontSize: 11, color: C.textMuted },
    practiceCard:  { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginHorizontal: 20, marginBottom: 16, gap: 12 },
    practiceRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    practiceEmoji: { fontSize: 20, marginTop: 2 },
    practiceTitle: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
    practiceTip:   { fontSize: 12, color: C.textMuted, lineHeight: 17 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        {...(Platform.OS === 'web' ? ({ style: { height: '100vh', overflowY: 'auto' } } as any) : {})}
      >
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Writing Coach</Text>
            <Text style={s.headerSub}>AI feedback on your text</Text>
          </View>
          <TouchableOpacity style={s.histBtn} onPress={() => navigation.navigate('WritingHistoryScreen')} activeOpacity={0.75}>
            <Ionicons name={'time-outline' as any} size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.heroWrap} onPress={() => navigation.navigate('NewWritingScreen')} activeOpacity={0.75}>
          <View style={s.heroDecorCircle} />
          <View style={s.heroInner}>
            <Animated.View style={[s.iconCircle, { transform: [{ translateY: floatAnim }] }]}>
              <Ionicons name={'create' as any} size={26} color="#fff" />
            </Animated.View>
            <View style={s.heroTextWrap}>
              <Text style={s.heroTitle}>Start Writing</Text>
              <Text style={s.heroSub}>Get AI feedback on your text</Text>
              <View style={s.ctaBtn}>
                <Text style={s.ctaBtnTxt}>Write Now</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Writing Type</Text>
        <View style={s.grid}>
          {WRITING_TYPES.map((type, i) => (
            <TouchableOpacity
              key={i}
              style={s.typeCard}
              onPress={() => navigation.navigate('NewWritingScreen', { category: type.id })}
              activeOpacity={0.75}
            >
              <View style={s.typeCardInner}>
                <View style={[s.typeIconBox, { backgroundColor: type.color + '26' }]}>
                  <Ionicons name={type.icon as any} size={18} color={type.color} />
                </View>
                <View style={s.typeTextWrap}>
                  <Text style={s.typeLabel}>{type.label}</Text>
                  <Text style={s.typeSub}>Tap to start</Text>
                </View>
              </View>
              <View style={[s.typeBorderLeft, { backgroundColor: type.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>AI Tools</Text>
        <View style={s.toolsList}>
          {AI_TOOLS.map((tool, i) => (
            <TouchableOpacity
              key={i}
              style={s.toolRow}
              onPress={() => navigation.navigate(tool.screen, { text: '' })}
              activeOpacity={0.75}
            >
              <View style={[s.toolIconBox, { backgroundColor: tool.color + '20' }]}>
                <Ionicons name={tool.icon as any} size={22} color={tool.color} />
              </View>
              <View style={s.toolText}>
                <Text style={s.toolTitle}>{tool.title}</Text>
                <Text style={s.toolSub}>{tool.sub}</Text>
              </View>
              <Ionicons name={'chevron-forward' as any} size={14} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.templatesCard} onPress={() => navigation.navigate('TemplatesLibraryScreen')} activeOpacity={0.75}>
          <Text style={s.templatesTxt}>Browse 20+ Templates</Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>What We Analyze</Text>
        <View style={s.metricsCard}>
          {[
            { icon:'checkmark-circle-outline', label:'Grammar Errors',     desc:'Subject-verb, tense, punctuation', color:'#00B894' },
            { icon:'color-palette-outline',    label:'Tone & Voice',       desc:'Professional, casual, persuasive', color:'#8B5CF6' },
            { icon:'layers-outline',           label:'Sentence Structure', desc:'Length, variety, readability',     color:'#0984E3' },
            { icon:'bulb-outline',             label:'Word Choice',        desc:'Weak words, repetition, clarity',  color:'#F0932B' },
            { icon:'trending-up-outline',      label:'Style Score',        desc:'Overall writing effectiveness',    color:'#E84393' },
          ].map((item, i) => (
            <View key={i} style={[s.metricRow, i === 4 && { borderBottomWidth: 0 }]}>
              <View style={[s.metricIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.metricLabel}>{item.label}</Text>
                <Text style={s.metricDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="checkmark" size={14} color={item.color} />
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Best Practices</Text>
        <View style={s.practiceCard}>
          {[
            { emoji:'✉️', title:'Professional Emails', tip:'Subject line + 3 paragraphs max'               },
            { emoji:'📝', title:'Cover Letters',        tip:'Lead with value, not "I am applying for..."'   },
            { emoji:'📄', title:'Essays & Reports',     tip:'Claim → Evidence → Analysis structure'         },
            { emoji:'💬', title:'Casual Writing',       tip:'Short sentences, contractions are fine'         },
          ].map((item, i) => (
            <View key={i} style={s.practiceRow}>
              <Text style={s.practiceEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.practiceTitle}>{item.title}</Text>
                <Text style={s.practiceTip}>{item.tip}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
