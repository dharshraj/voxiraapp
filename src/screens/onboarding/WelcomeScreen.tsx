import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      {/* Static background glow — no animation */}
      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      <ScrollView
        style={[s.scroll, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'auto' } as any)]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.topBar}>
          <LinearGradient colors={['#8B5CF6', '#4338CA']} style={s.logoMark}>
            <Text style={s.logoEmoji}>🎙️</Text>
          </LinearGradient>
          <Text style={s.logoText}>
            VOX<Text style={s.logoAccent}>IRA</Text>
          </Text>
        </View>

        {/* Badge */}
        <View style={s.badgeWrap}>
          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeTxt}>AI Communication Coach</Text>
          </View>
        </View>

        {/* Headline */}
        <Text style={s.headline}>
          {'MASTER\nEVERY\n'}
          <Text style={s.headlineAccent}>CONVO.</Text>
        </Text>

        {/* Subheadline */}
        <Text style={s.subline}>
          AI-powered coaching for speech, writing, and interviews.
        </Text>

        {/* Feature pills */}
        <View style={s.featureRow}>
          {[
            { icon: 'mic-outline',       label: 'Speech Analysis' },
            { icon: 'create-outline',    label: 'Writing Coach'   },
            { icon: 'people-outline',    label: 'Interview Prep'  },
          ].map((f, i) => (
            <View key={i} style={s.featurePill}>
              <Ionicons name={f.icon as any} size={14} color="#A78BFA" />
              <Text style={s.featurePillTxt}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
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

        {/* Primary CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => navigation.navigate('Feature1')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#8B5CF6', '#4338CA']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.ctaBtnInner}
          >
            <Text style={s.ctaBtnTxt}>Get Started Free</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity
          style={s.signInLink}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={s.signInLinkTxt}>
            Already have an account?{'  '}
            <Text style={s.signInLinkAccent}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05050F',
  },
  scroll: { flex: 1 },

  // Static background glows (no animation)
  glowTop: {
    position: 'absolute',
    width: 340, height: 340,
    borderRadius: 170,
    top: -120, left: -80,
    backgroundColor: '#8B5CF6',
    opacity: 0.12,
  },
  glowBottom: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    bottom: -80,
    right: -60,
    backgroundColor: '#06B6D4',
    opacity: 0.09,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    justifyContent: 'center',
  },

  // Logo
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logoMark:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoEmoji:  { fontSize: 20 },
  logoText:   { fontSize: 24, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5 },
  logoAccent: { color: '#06B6D4' },

  // Badge
  badgeWrap: { marginBottom: 16 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6' },
  badgeTxt:  { fontSize: 11, color: '#A78BFA', fontWeight: '600', letterSpacing: 0.3 },

  // Headline
  headline: {
    fontSize: Platform.OS === 'web' ? 56 : 48,
    fontWeight: '900',
    color: '#F1F5F9',
    lineHeight: Platform.OS === 'web' ? 60 : 52,
    letterSpacing: -2,
    marginBottom: 14,
  },
  headlineAccent: { color: '#8B5CF6' },

  subline: {
    fontSize: 15,
    color: 'rgba(241,245,249,0.50)',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 320,
  },

  // Feature pills
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.18)',
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6,
  },
  featurePillTxt: { fontSize: 12, color: '#A78BFA', fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    marginBottom: 28,
    overflow: 'hidden',
  },
  statsItem:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  statsVal:     { fontSize: 18, fontWeight: '800', color: '#F1F5F9', marginBottom: 2 },
  statsLbl:     { fontSize: 10, color: 'rgba(241,245,249,0.38)', fontWeight: '500' },

  // CTA
  ctaBtn: {
    borderRadius: 18, overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  ctaBtnInner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },

  // Sign in
  signInLink:       { alignItems: 'center', paddingVertical: 8 },
  signInLinkTxt:    { fontSize: 14, color: 'rgba(241,245,249,0.40)' },
  signInLinkAccent: { color: '#06B6D4', fontWeight: '600' },
});
