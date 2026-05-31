import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg:          '#05050F',
  purple:      '#8B5CF6',
  purpleSoft:  'rgba(139,92,246,0.12)',
  cyan:        '#06B6D4',
  cyanSoft:    'rgba(6,182,212,0.12)',
  amber:       '#F59E0B',
  amberSoft:   'rgba(245,158,11,0.12)',
  emerald:     '#10B981',
  emeraldSoft: 'rgba(16,185,129,0.12)',
  text:        '#F1F5F9',
  textMuted:   'rgba(241,245,249,0.38)',
  textHint:    'rgba(241,245,249,0.22)',
  textSec:     'rgba(241,245,249,0.65)',
  border:      'rgba(255,255,255,0.07)',
};

const WRITING_TYPES = [
  { id: 'email',  label: 'Email',  icon: 'mail-outline',          color: '#06B6D4', softBg: 'rgba(6,182,212,0.12)'    },
  { id: 'essay',  label: 'Essay',  icon: 'document-text-outline', color: '#8B5CF6', softBg: 'rgba(139,92,246,0.12)'   },
  { id: 'story',  label: 'Story',  icon: 'book-outline',           color: '#F59E0B', softBg: 'rgba(245,158,11,0.12)'  },
  { id: 'report', label: 'Report', icon: 'bar-chart-outline',      color: '#10B981', softBg: 'rgba(16,185,129,0.12)'  },
];

const AI_TOOLS = [
  { icon: 'checkmark-circle',    color: '#10B981', title: 'Grammar Check',  sub: 'Fix errors instantly',       screen: 'GrammarResultScreen'   },
  { icon: 'pulse-outline',       color: '#06B6D4', title: 'Tone Analysis',  sub: 'Understand your tone',       screen: 'ToneAnalysisScreen'    },
  { icon: 'refresh-outline',     color: '#8B5CF6', title: 'AI Rewrite',     sub: 'Improve your writing',       screen: 'RewriteScreen'         },
  { icon: 'color-palette',       color: '#F59E0B', title: 'Style Coach',    sub: 'Elevate your style',         screen: 'StyleSuggestionsScreen'},
];

export default function WritingHomeScreen({ navigation }: any) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        {...(Platform.OS === 'web' ? ({ style: { height: '100vh', overflowY: 'auto' } } as any) : {})}
      >
        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Writing Coach</Text>
            <Text style={s.headerSub}>AI feedback on your text</Text>
          </View>
          <TouchableOpacity
            style={s.histBtn}
            onPress={() => navigation.navigate('WritingHistoryScreen')}
            activeOpacity={0.75}
          >
            <Ionicons name={'time-outline' as any} size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* HERO CTA */}
        <TouchableOpacity
          style={s.heroWrap}
          onPress={() => navigation.navigate('NewWritingScreen')}
          activeOpacity={0.75}
        >
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroGrad}
          >
            <View style={s.heroDecorCircle} />
            <View style={s.heroInner}>
              <Animated.View style={[s.iconCircle, { transform: [{ translateY: floatAnim }] }]}>
                <Ionicons name={'create' as any} size={40} color="#fff" />
              </Animated.View>
              <Text style={s.heroTitle}>Start Writing</Text>
              <Text style={s.heroSub}>Get AI feedback on your text</Text>
              <View style={s.heroPills}>
                <View style={s.pill}><Text style={s.pillTxt}>✍️ Grammar</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}>🎨 Tone</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}>🔄 Rewrite</Text></View>
              </View>
              <View style={s.ctaBtn}>
                <Text style={s.ctaBtnTxt}>Write Now →</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* WRITING TYPES */}
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
                <View style={[s.typeIconBox, { backgroundColor: type.softBg }]}>
                  <Ionicons name={type.icon as any} size={20} color={type.color} />
                </View>
                <Text style={s.typeLabel}>{type.label}</Text>
                <Text style={s.typeSub}>Tap to start</Text>
              </View>
              <View style={[s.typeBorderLeft, { backgroundColor: type.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* AI TOOLS */}
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
              <Ionicons name={'chevron-forward' as any} size={14} color={C.textHint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* TEMPLATES */}
        <TouchableOpacity
          style={s.templatesCard}
          onPress={() => navigation.navigate('TemplatesLibraryScreen')}
          activeOpacity={0.75}
        >
          <Text style={s.templatesTxt}>📋 Browse 20+ Templates →</Text>
        </TouchableOpacity>

        {/* What We Analyze */}
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

        {/* Best Practices */}
        <Text style={s.sectionTitle}>Best Practices</Text>
        <View style={s.practiceCard}>
          {[
            { emoji:'✉️', title:'Professional Emails',  tip:'Subject line + 3 paragraphs max' },
            { emoji:'📝', title:'Cover Letters',         tip:'Lead with value, not "I am applying for..."' },
            { emoji:'📄', title:'Essays & Reports',      tip:'Claim → Evidence → Analysis structure' },
            { emoji:'💬', title:'Casual Writing',        tip:'Short sentences, contractions are fine' },
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

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100vh' as any, overflow: 'hidden' as any }) },
  scrollContent: { paddingBottom: 100 },
  header:        {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16,
  },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: C.text },
  headerSub:     { fontSize: 13, color: C.textMuted, marginTop: 2 },
  histBtn:       {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroWrap:      { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 200, marginBottom: 24 },
  heroGrad:      { flex: 1 },
  heroDecorCircle: {
    position: 'absolute', right: -30, top: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroInner:     { padding: 24, flex: 1 },
  iconCircle:    {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOpacity: 0.55, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  heroTitle:     { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 12 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 16 },
  heroPills:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pill:          {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  pillTxt:       { fontSize: 11, color: '#fff', fontWeight: '600' },
  ctaBtn:        {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  ctaBtnTxt:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  typeCard:      {
    width: '48%', borderRadius: 18, overflow: 'hidden', height: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    position: 'relative',
  },
  typeCardInner: { padding: 16, gap: 8 },
  typeIconBox:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeLabel:     { fontSize: 14, fontWeight: '700', color: C.text },
  typeSub:       { fontSize: 11, color: C.textMuted },
  typeBorderLeft:{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 3 },
  toolsList:     { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  toolRow:       {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
  },
  toolIconBox:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolText:      { flex: 1, marginLeft: 12 },
  toolTitle:     { fontSize: 14, fontWeight: '600', color: C.text },
  toolSub:       { fontSize: 12, color: C.textMuted },
  templatesCard: {
    marginHorizontal: 20, padding: 18, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },
  templatesTxt:  { fontSize: 14, fontWeight: '600', color: C.text },
  metricsCard:   { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E0DDD8', marginHorizontal: 20, marginBottom: 16 },
  metricRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1EFEC' },
  metricIcon:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricLabel:   { fontSize: 13, fontWeight: '600', color: '#2D3436', marginBottom: 1 },
  metricDesc:    { fontSize: 11, color: '#B2BEC3' },
  practiceCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E0DDD8', marginHorizontal: 20, marginBottom: 16, gap: 12 },
  practiceRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  practiceEmoji: { fontSize: 20, marginTop: 2 },
  practiceTitle: { fontSize: 13, fontWeight: '600', color: '#2D3436', marginBottom: 2 },
  practiceTip:   { fontSize: 12, color: '#636E72', lineHeight: 17 },
});
