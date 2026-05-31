import React, { useRef, useEffect, useState } from 'react';
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
  rose:        '#F43F5E',
  roseSoft:    'rgba(244,63,94,0.12)',
  indigo:      '#6366F1',
  indigoSoft:  'rgba(99,102,241,0.12)',
  text:        '#F1F5F9',
  textMuted:   'rgba(241,245,249,0.38)',
  textHint:    'rgba(241,245,249,0.22)',
  textSec:     'rgba(241,245,249,0.65)',
  border:      'rgba(255,255,255,0.07)',
};

const INTERVIEW_TYPES = [
  { name: 'Behavioral',  icon: 'chatbubbles',      color: '#8B5CF6', softBg: 'rgba(139,92,246,0.12)', sub: 'STAR Method'      },
  { name: 'Technical',   icon: 'code-slash',        color: '#06B6D4', softBg: 'rgba(6,182,212,0.12)',  sub: 'Problem Solving'  },
  { name: 'Situational', icon: 'bulb-outline',      color: '#F59E0B', softBg: 'rgba(245,158,11,0.12)', sub: 'Scenarios'        },
  { name: 'Case Study',  icon: 'briefcase',         color: '#F43F5E', softBg: 'rgba(244,63,94,0.12)',  sub: 'Business Cases'   },
];

const POPULAR_ROLES = [
  { name: 'Software Engineer',  icon: 'laptop-outline',      color: '#06B6D4', softBg: 'rgba(6,182,212,0.12)'    },
  { name: 'Product Manager',    icon: 'rocket-outline',      color: '#8B5CF6', softBg: 'rgba(139,92,246,0.12)'   },
  { name: 'Data Analyst',       icon: 'bar-chart-outline',   color: '#10B981', softBg: 'rgba(16,185,129,0.12)'   },
  { name: 'UX Designer',        icon: 'color-palette-outline',color: '#F43F5E', softBg: 'rgba(244,63,94,0.12)'   },
  { name: 'Marketing Manager',  icon: 'megaphone-outline',   color: '#F59E0B', softBg: 'rgba(245,158,11,0.12)'   },
  { name: 'Business Analyst',   icon: 'analytics-outline',   color: '#6366F1', softBg: 'rgba(99,102,241,0.12)'   },
];

const TIPS = [
  'Use STAR method: Situation, Task, Action, Result',
  'Research the company before your interview',
  'Ask thoughtful questions at the end',
];

export default function InterviewHomeScreen({ navigation }: any) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
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
            <Text style={s.headerTitle}>AI Interviews</Text>
            <Text style={s.headerSub}>Practice with your AI coach</Text>
          </View>
          <View style={s.statsPill}>
            <Text style={s.statsPillTxt}>0 Sessions</Text>
          </View>
        </View>

        {/* HERO CTA */}
        <TouchableOpacity
          style={s.heroWrap}
          onPress={() => navigation.navigate('ChooseRole')}
          activeOpacity={0.75}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroGrad}
          >
            <View style={s.heroOrb} />
            <View style={s.heroInner}>
              <View style={s.aiAvatar}>
                <Ionicons name={'logo-electron' as any} size={48} color="#fff" />
              </View>
              <Text style={s.heroTitle}>Start Interview</Text>
              <Text style={s.heroSub}>Practice with AI interviewer</Text>
              <View style={s.heroPills}>
                <View style={s.pill}><Text style={s.pillTxt}>Behavioral</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}>Technical</Text></View>
                <View style={s.pill}><Text style={s.pillTxt}>Case Study</Text></View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* INTERVIEW TYPES */}
        <Text style={s.sectionTitle}>Interview Type</Text>
        <View style={s.grid}>
          {INTERVIEW_TYPES.map((type, i) => (
            <TouchableOpacity
              key={i}
              style={s.typeCard}
              onPress={() => navigation.navigate('InterviewSetup', { type: type.name })}
              activeOpacity={0.75}
            >
              <View style={[s.typeIconBox, { backgroundColor: type.softBg }]}>
                <Ionicons name={type.icon as any} size={22} color={type.color} />
              </View>
              <Text style={s.typeName}>{type.name}</Text>
              <Text style={s.typeSub}>{type.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* POPULAR ROLES */}
        <Text style={s.sectionTitle}>Popular Roles</Text>
        <View style={s.rolesList}>
          {POPULAR_ROLES.map((role, i) => (
            <TouchableOpacity
              key={i}
              style={[s.roleRow, i === POPULAR_ROLES.length - 1 && s.roleRowLast]}
              onPress={() => navigation.navigate('InterviewSetup', { role: role.name })}
              activeOpacity={0.75}
            >
              <View style={[s.roleIconBox, { backgroundColor: role.softBg }]}>
                <Ionicons name={role.icon as any} size={20} color={role.color} />
              </View>
              <Text style={s.roleName}>{role.name}</Text>
              <Text style={s.roleCta}>Practice →</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TIP ROTATOR */}
        <View style={s.tipCard}>
          <Ionicons name={'bulb-outline' as any} size={20} color={C.amber} />
          <Text style={s.tipTxt}>{TIPS[tipIndex]}</Text>
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
  statsPill:     {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  statsPillTxt:  { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  heroWrap:      { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 200, marginBottom: 24 },
  heroGrad:      { flex: 1 },
  heroOrb:       {
    position: 'absolute', right: -30, top: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroInner:     { padding: 24, flex: 1, justifyContent: 'center' },
  aiAvatar:      {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#F59E0B', shadowOpacity: 0.55, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  heroTitle:     { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  heroPills:     { flexDirection: 'row', gap: 8 },
  pill:          {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  pillTxt:       { fontSize: 11, color: '#fff', fontWeight: '600' },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  typeCard:      {
    width: '48%', borderRadius: 18, height: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 6,
  },
  typeIconBox:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeName:      { fontSize: 13, fontWeight: '700', color: C.text },
  typeSub:       { fontSize: 11, color: C.textMuted },
  rolesList:     {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 20, overflow: 'hidden',
    marginBottom: 16,
  },
  roleRow:       {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  roleRowLast:   { borderBottomWidth: 0 },
  roleIconBox:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleName:      { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  roleCta:       { fontSize: 12, color: C.textMuted },
  tipCard:       {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.20)',
  },
  tipTxt:        { flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 20 },
});
