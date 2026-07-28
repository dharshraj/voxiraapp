import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

// ── Policy content (unchanged) ────────────────────────────────────────────────

const SECTIONS = [
  {
    title: '1. Information We Collect',
    icon: 'information-circle-outline',
    content: [
      { heading: 'Account Information', body: 'When you register, we collect your name, email address, and password (stored securely via Supabase Auth). We never store plain-text passwords.' },
      { heading: 'Speech Data', body: 'When you record a speech session, the audio is sent to our AI provider for transcription and analysis. We do not store raw audio files. Only the analysed results (score, transcript text, filler word count, duration) are saved to your account.' },
      { heading: 'Writing Data', body: 'Text you submit for writing analysis is sent to our AI provider. We store the original text, corrections, and scores in your account for your history and progress tracking.' },
      { heading: 'Interview Data', body: 'Your spoken or typed answers during mock interviews are processed by AI. We store question–answer pairs and scores for your review and progress tracking.' },
      { heading: 'Usage Data', body: 'We collect anonymised usage analytics such as which features are used, session frequency, and app performance data. This data cannot identify you personally.' },
    ],
  },
  {
    title: '2. How We Use Your Data',
    icon: 'cog-outline',
    content: [
      { heading: 'Personalise your experience', body: 'We use your history and scores to show your progress, calculate streaks, and make personalised improvement suggestions.' },
      { heading: 'Improve the product', body: 'Anonymised, aggregated usage data helps us understand which features are most useful and where to focus development efforts.' },
      { heading: 'Send notifications', body: 'With your permission, we send practice reminders, streak alerts, and achievement notifications. You can manage these in Settings → Notifications.' },
      { heading: 'Customer support', body: 'When you contact us, we use your account information and usage history to help resolve issues faster.' },
    ],
  },
  {
    title: '3. Data Storage & Security',
    icon: 'shield-checkmark-outline',
    content: [
      { heading: 'Where data is stored', body: 'Your data is stored on Supabase infrastructure hosted on AWS. Servers are located in Singapore (Southeast Asia region) for best performance for Indian users.' },
      { heading: 'Encryption', body: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Auth tokens are stored securely using your device\'s secure keychain (iOS) or Keystore (Android).' },
      { heading: 'Access controls', body: 'Only you can access your personal data. Voxira employees do not have access to individual user data unless required for support and only with your permission.' },
      { heading: 'Retention', body: 'We retain your data as long as your account is active. If you delete your account, all personal data is permanently deleted within 30 days.' },
    ],
  },
  {
    title: '4. Third-Party Services',
    icon: 'git-network-outline',
    content: [
      { heading: 'Supabase', body: 'Our backend provider for authentication, database, and storage. Supabase is SOC 2 Type II certified. Privacy policy: supabase.com/privacy' },
      { heading: 'AssemblyAI', body: 'Used to transcribe your speech recordings into text. Audio is processed in real-time and not stored by the provider beyond the API request.' },
      { heading: 'Groq / LLaMA', body: 'Used to generate speech analysis feedback and suggestions. Text submitted is processed server-side and not stored by the provider.' },
      { heading: 'Expo / React Native', body: 'Our app framework. Expo collects minimal crash and performance analytics. See expo.dev/privacy for details.' },
    ],
  },
  {
    title: '5. Your Rights',
    icon: 'person-circle-outline',
    content: [
      { heading: 'Access your data', body: 'You can view all your session history, scores, and profile data within the app at any time.' },
      { heading: 'Export your data', body: 'Go to Settings → Privacy → Export My Data. We will email you a JSON file of all your data within 24 hours.' },
      { heading: 'Delete your data', body: 'Go to Profile → Settings → Delete Account to permanently remove all your data from our systems.' },
      { heading: 'Correct your data', body: 'Update your name and profile information any time in Profile → Edit Profile.' },
      { heading: 'Opt out of analytics', body: 'Go to Settings → Privacy & Data → Analytics to opt out of anonymised usage tracking.' },
    ],
  },
  {
    title: '6. Children\'s Privacy',
    icon: 'happy-outline',
    content: [
      { heading: 'Age requirement', body: 'Voxira is intended for users aged 13 and above. We do not knowingly collect personal data from children under 13. If we discover such data has been collected, it will be deleted immediately.' },
    ],
  },
  {
    title: '7. Changes to This Policy',
    icon: 'document-text-outline',
    content: [
      { heading: 'Updates', body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of Voxira after changes constitutes acceptance of the updated policy.' },
      { heading: 'Last updated', body: 'This policy was last updated on 1 January 2025.' },
    ],
  },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PrivacyPolicyScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: 60 },

    header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider:       { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },

    // Hero card
    heroCard:      { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    heroIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    heroTitle:     { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
    heroSub:       { fontSize: 12, color: C.textMuted },

    // Intro
    introCard:     { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
    introTxt:      { fontSize: 13, color: C.textSec, lineHeight: 21 },

    scroll:        { paddingHorizontal: 20 },

    // Accordion
    accordion:     { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8, overflow: 'hidden' },
    accordionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    secIconBox:    { width: 34, height: 34, borderRadius: 9, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    secTitle:      { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
    accordionBody: { borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
    contentItem:   { paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    contentLast:   { borderBottomWidth: 0, marginBottom: 0 },
    contentHead:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4 },
    contentBody:   { fontSize: 13, color: C.textSec, lineHeight: 20 },

    // Contact
    contactCard:   { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 20, alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 20 },
    contactTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
    contactSub:    { fontSize: 13, color: C.textMuted },
    contactBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 },
    contactBtnTxt: { fontSize: 14, fontWeight: '600', color: '#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
      </View>
      <View style={s.divider} />

      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ flex: 1, overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroIcon}>
            <Ionicons name="shield-checkmark-outline" size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Your Privacy Matters</Text>
            <Text style={s.heroSub}>Last updated: 1 January 2025 · Effective immediately</Text>
          </View>
        </View>

        {/* Intro */}
        <View style={s.introCard}>
          <Text style={s.introTxt}>
            Voxira is committed to protecting your privacy. This policy explains what data we collect, why we collect it, how we use it, and your rights over your own data.{'\n\n'}
            We never sell your personal data to third parties. We do not use your data for advertising. Everything we collect is used solely to improve your experience with Voxira.
          </Text>
        </View>

        {/* Accordion sections */}
        <View style={s.scroll}>
          {SECTIONS.map((sec, i) => (
            <View key={i} style={s.accordion}>
              <TouchableOpacity
                style={s.accordionHead}
                onPress={() => setOpenIdx(openIdx === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={s.secIconBox}>
                  <Ionicons name={sec.icon as any} size={16} color={C.primary} />
                </View>
                <Text style={s.secTitle}>{sec.title}</Text>
                <Ionicons name={openIdx === i ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
              </TouchableOpacity>

              {openIdx === i && (
                <View style={s.accordionBody}>
                  {sec.content.map((item, j) => (
                    <View key={j} style={[s.contentItem, j === sec.content.length - 1 && s.contentLast]}>
                      <Text style={s.contentHead}>{item.heading}</Text>
                      <Text style={s.contentBody}>{item.body}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Contact */}
          <View style={s.contactCard}>
            <Text style={s.contactTitle}>Questions about your privacy?</Text>
            <Text style={s.contactSub}>Contact our Data Protection Officer</Text>
            <TouchableOpacity
              style={s.contactBtn}
              onPress={() => Linking.openURL('mailto:privacy@voxira.app')}
              activeOpacity={0.85}
            >
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={s.contactBtnTxt}>privacy@voxira.app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
