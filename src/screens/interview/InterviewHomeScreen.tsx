import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const INTERVIEW_TYPES = [
  { name: 'Behavioral',  icon: 'chatbubbles',       color: '#8B5CF6', sub: 'STAR Method'    },
  { name: 'Technical',   icon: 'code-slash',         color: '#06B6D4', sub: 'Problem Solving'},
  { name: 'Situational', icon: 'bulb-outline',       color: '#F59E0B', sub: 'Scenarios'      },
  { name: 'Case Study',  icon: 'briefcase',          color: '#F43F5E', sub: 'Business Cases' },
];

const POPULAR_ROLES = [
  { name: 'Software Engineer',  icon: 'laptop-outline',        color: '#06B6D4' },
  { name: 'Product Manager',    icon: 'rocket-outline',        color: '#8B5CF6' },
  { name: 'Data Analyst',       icon: 'bar-chart-outline',     color: '#10B981' },
  { name: 'UX Designer',        icon: 'color-palette-outline', color: '#F43F5E' },
  { name: 'Marketing Manager',  icon: 'megaphone-outline',     color: '#F59E0B' },
  { name: 'Business Analyst',   icon: 'analytics-outline',     color: '#6366F1' },
];

const TIPS = [
  'Use STAR method: Situation, Task, Action, Result',
  'Research the company before your interview',
  'Ask thoughtful questions at the end',
];

export default function InterviewHomeScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    scrollContent: { paddingBottom: 100 },
    header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16 },
    headerTitle:   { fontSize: 22, fontWeight: '800', color: C.text },
    headerSub:     { fontSize: 13, color: C.textMuted, marginTop: 2 },
    statsPill:     { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    statsPillTxt:  { fontSize: 13, color: C.textMuted, fontWeight: '500' },
    heroWrap:      { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 140, marginBottom: 24, backgroundColor: C.warning },
    heroOrb:       { position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroInner:     { padding: 20, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
    aiAvatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    heroTextWrap:  { flex: 1 },
    heroTitle:     { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
    heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
    ctaBtn:        { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    ctaBtnTxt:     { fontSize: 13, fontWeight: '700', color: '#fff' },
    sectionTitle:  { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
    grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
    typeCard:      { width: '48%', borderRadius: 18, height: 80, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14, gap: 6 },
    typeIconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    typeName:      { fontSize: 13, fontWeight: '700', color: C.text },
    typeSub:       { fontSize: 11, color: C.textMuted },
    rolesList:     { marginHorizontal: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    roleRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.divider },
    roleRowLast:   { borderBottomWidth: 0 },
    roleIconBox:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    roleName:      { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
    roleCta:       { fontSize: 12, color: C.textMuted },
    tipCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, padding: 16, borderRadius: 18, backgroundColor: C.warning + '0F', borderWidth: 1, borderColor: C.warning + '33' },
    tipTxt:        { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 20 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        {...(Platform.OS === 'web' ? ({ style: { height: '100%', overflowY: 'auto' } } as any) : {})}
      >
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>AI Interviews</Text>
            <Text style={s.headerSub}>Practice with your AI coach</Text>
          </View>
          <View style={s.statsPill}>
            <Text style={s.statsPillTxt}>0 Sessions</Text>
          </View>
        </View>

        <TouchableOpacity style={s.heroWrap} onPress={() => navigation.navigate('ChooseRole')} activeOpacity={0.75}>
          <View style={s.heroOrb} />
          <View style={s.heroInner}>
            <View style={s.aiAvatar}>
              <Ionicons name={'logo-electron' as any} size={26} color="#fff" />
            </View>
            <View style={s.heroTextWrap}>
              <Text style={s.heroTitle}>Start Interview</Text>
              <Text style={s.heroSub}>Practice with AI interviewer</Text>
              <View style={s.ctaBtn}>
                <Text style={s.ctaBtnTxt}>Start Now</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Interview Type</Text>
        <View style={s.grid}>
          {INTERVIEW_TYPES.map((type, i) => (
            <TouchableOpacity
              key={i}
              style={s.typeCard}
              onPress={() => navigation.navigate('InterviewSetup', { type: type.name })}
              activeOpacity={0.75}
            >
              <View style={[s.typeIconBox, { backgroundColor: type.color + '26' }]}>
                <Ionicons name={type.icon as any} size={18} color={type.color} />
              </View>
              <Text style={s.typeName}>{type.name}</Text>
              <Text style={s.typeSub}>{type.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Popular Roles</Text>
        <View style={s.rolesList}>
          {POPULAR_ROLES.map((role, i) => (
            <TouchableOpacity
              key={i}
              style={[s.roleRow, i === POPULAR_ROLES.length - 1 && s.roleRowLast]}
              onPress={() => navigation.navigate('InterviewSetup', { role: role.name })}
              activeOpacity={0.75}
            >
              <View style={[s.roleIconBox, { backgroundColor: role.color + '26' }]}>
                <Ionicons name={role.icon as any} size={20} color={role.color} />
              </View>
              <Text style={s.roleName}>{role.name}</Text>
              <Text style={s.roleCta}>Practice →</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.tipCard}>
          <Ionicons name={'bulb-outline' as any} size={20} color={C.warning} />
          <Text style={s.tipTxt}>{TIPS[tipIndex]}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
