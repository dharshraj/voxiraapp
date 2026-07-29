import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function WelcomeScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    glowTop: {
      position: 'absolute', width: 340, height: 340, borderRadius: 170,
      top: -120, left: -80, backgroundColor: C.primary, opacity: 0.10,
    },
    glowBottom: {
      position: 'absolute', width: 280, height: 280, borderRadius: 140,
      bottom: -80, right: -60, backgroundColor: C.primaryPressed, opacity: 0.07,
    },
    content: {
      flexGrow: 1, paddingHorizontal: 28,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: Platform.OS === 'ios' ? 48 : 32,
      justifyContent: 'center',
    },
    topBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
    logoMark:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary },
    logoEmoji:  { fontSize: 20 },
    logoText:   { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    logoAccent: { color: C.primary },
    badgeWrap: { marginBottom: 16 },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
      backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary + '40',
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    },
    badgeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
    badgeTxt:  { fontSize: 11, color: C.primary, fontWeight: '600', letterSpacing: 0.3 },
    headline: {
      fontSize: Platform.OS === 'web' ? 56 : 48, fontWeight: '900', color: C.text,
      lineHeight: Platform.OS === 'web' ? 60 : 52, letterSpacing: -2, marginBottom: 14,
    },
    headlineAccent: { color: C.primary },
    subline: { fontSize: 15, color: C.textMuted, lineHeight: 24, marginBottom: 24, maxWidth: 320 },
    featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    featurePill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary + '30',
      borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6,
    },
    featurePillTxt: { fontSize: 12, color: C.primary, fontWeight: '600' },
    statsRow: {
      flexDirection: 'row', backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border, borderRadius: 18, marginBottom: 28, overflow: 'hidden',
    },
    statsItem:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statsDivider: { width: 1, backgroundColor: C.border },
    statsVal:     { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
    statsLbl:     { fontSize: 10, color: C.textMuted, fontWeight: '500' },
    ctaBtn: {
      borderRadius: 18, overflow: 'hidden', marginBottom: 16,
      backgroundColor: C.primary,
    },
    ctaBtnInner: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    ctaBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
    signInLink:       { alignItems: 'center', paddingVertical: 8 },
    signInLinkTxt:    { fontSize: 14, color: C.textMuted },
    signInLinkAccent: { color: C.primary, fontWeight: '600' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      <ScrollView
        style={[s.scroll, { flex: 1 }]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topBar}>
          <View style={s.logoMark}>
            <Text style={s.logoEmoji}>🎙️</Text>
          </View>
          <Text style={s.logoText}>
            VOX<Text style={s.logoAccent}>IRA</Text>
          </Text>
        </View>

        <View style={s.badgeWrap}>
          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeTxt}>AI Communication Coach</Text>
          </View>
        </View>

        <Text style={s.headline}>
          {'MASTER\nEVERY\n'}
          <Text style={s.headlineAccent}>CONVO.</Text>
        </Text>

        <Text style={s.subline}>
          AI-powered speech coaching.
        </Text>

        <View style={s.featureRow}>
          {[
            { icon: 'mic-outline', label: 'Speech Analysis' },
          ].map((f, i) => (
            <View key={i} style={s.featurePill}>
              <Ionicons name={f.icon as any} size={14} color={C.primary} />
              <Text style={s.featurePillTxt}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.statsRow}>
          {[
            { val: '50K+', lbl: 'Users'        },
            { val: '95%',  lbl: 'Satisfaction' },
            { val: '4.9★', lbl: 'Rating'       },
          ].map((st, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={s.statsDivider} />}
              <View style={s.statsItem}>
                <Text style={s.statsVal}>{st.val}</Text>
                <Text style={s.statsLbl}>{st.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Feature1')} activeOpacity={0.85}>
          <View style={s.ctaBtnInner}>
            <Text style={s.ctaBtnTxt}>Get Started Free</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.signInLink} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={s.signInLinkTxt}>
            Already have an account?{'  '}
            <Text style={s.signInLinkAccent}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
