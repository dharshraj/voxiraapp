import React, { useState, useRef, useEffect } from 'react';
import {
  Animated, View, Text, TouchableOpacity,
  StyleSheet, Platform, ScrollView,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

const TIPS = [
  'Check your Spam or Junk folder if you don\'t see it',
  'The verification link expires in 24 hours',
  'After verifying, return here and sign in',
];

// Cooldown between resend attempts (seconds)
const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();
  const email: string = route?.params?.email ?? '';

  const [resending,  setResending]  = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [cooldown,   setCooldown]   = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);

  const orbX = useRef(new Animated.Value(0)).current;
  const orbY = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(Platform.OS === 'web' ? 0 : 24)).current;
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(orbX, { toValue: 1, duration: 3500, useNativeDriver: true }),
      Animated.timing(orbX, { toValue: 0, duration: 3500, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(orbY, { toValue: 1, duration: 4300, useNativeDriver: true }),
      Animated.timing(orbY, { toValue: 0, duration: 4300, useNativeDriver: true }),
    ])).start();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onResend = async () => {
    if (resending || cooldown > 0 || !email) return;
    setResendError(null);
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type:  'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate') || msg.includes('limit')) {
          setResendError('Too many attempts. Please wait a few minutes before trying again.');
        } else {
          setResendError('Could not resend the email. Please try again.');
        }
      } else {
        setResendDone(true);
        startCooldown();
      }
    } catch {
      setResendError('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const orbTranslateX = orbX.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orbTranslateY = orbY.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });

  // Mask the email for display: show first 2 chars + *** + domain
  const maskedEmail = (() => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  })();

  const s = StyleSheet.create({
    root:   { flex: 1, backgroundColor: C.bg },
    scroll: { flexGrow: 1, padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 48 },
    orb: {
      position: 'absolute', bottom: -60, right: -40,
      width: 260, height: 260, borderRadius: 130, opacity: 0.12,
      backgroundColor: C.primary,
    },
    backBtn: {
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: 36,
    },
    iconBox: {
      width: 80, height: 80, borderRadius: 24, borderWidth: 1,
      backgroundColor: C.primary + '1A', borderColor: C.primary + '50',
      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    title:    { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 10, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: C.textMuted, lineHeight: 22, marginBottom: 8 },
    emailPill: {
      alignSelf: 'flex-start',
      backgroundColor: C.primary + '14', borderWidth: 1, borderColor: C.primary + '40',
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
      marginBottom: 28,
    },
    emailPillText: { color: C.primary, fontSize: 13, fontWeight: '600' },
    tipsCard: {
      backgroundColor: C.surface, borderRadius: 16, borderWidth: 1,
      borderColor: C.border, paddingHorizontal: 16, marginBottom: 24,
    },
    tipRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
    tipRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    tipIcon:      { marginRight: 12, marginTop: 1 },
    tipText:      { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 20 },
    // Success banner after resend
    successBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: C.success + '14', borderWidth: 1, borderColor: C.success + '40',
      borderRadius: 12, padding: 12, marginBottom: 16,
    },
    successText: { flex: 1, color: C.success, fontSize: 13, lineHeight: 19 },
    // Error banner
    errorBanner: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      backgroundColor: C.error + '14', borderWidth: 1, borderColor: C.error + '40',
      borderRadius: 12, padding: 12, marginBottom: 16,
    },
    errorText: { flex: 1, color: C.error, fontSize: 13, lineHeight: 19 },
    // Resend button
    resendBtnOuter: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    resendBtn: {
      height: 56, alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary, opacity: 1,
    },
    resendBtnDisabled: { opacity: 0.5 },
    resendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // Sign in button
    signInBtnOuter: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    signInBtn: {
      height: 56, alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    },
    signInBtnText: { color: C.text, fontSize: 16, fontWeight: '700' },
  });

  const resendDisabled = resending || cooldown > 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View
        pointerEvents="none"
        style={[s.orb, { transform: [{ translateX: orbTranslateX }, { translateY: orbTranslateY }] }]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.textMuted} />
          </TouchableOpacity>

          <View style={s.iconBox}>
            <Ionicons name="mail-outline" size={40} color={C.primary} />
          </View>

          <Text style={s.title}>Check your email</Text>
          <Text style={s.subtitle}>We sent a verification link to</Text>

          {maskedEmail ? (
            <View style={s.emailPill}>
              <Text style={s.emailPillText}>{maskedEmail}</Text>
            </View>
          ) : (
            <Text style={[s.subtitle, { marginBottom: 28 }]}>your email address.</Text>
          )}

          {/* Tips card */}
          <View style={s.tipsCard}>
            {TIPS.map((tip, i) => (
              <View key={i} style={[s.tipRow, i < TIPS.length - 1 && s.tipRowBorder]}>
                <Ionicons name="information-circle" size={18} color={C.primary} style={s.tipIcon} />
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Resend success banner */}
          {resendDone && (
            <View style={s.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={C.success} />
              <Text style={s.successText}>
                Verification email resent!{cooldown > 0 ? ` You can resend again in ${cooldown}s.` : ''}
              </Text>
            </View>
          )}

          {/* Resend error banner */}
          {resendError && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.errorText}>{resendError}</Text>
            </View>
          )}

          {/* Resend button */}
          <TouchableOpacity
            onPress={onResend}
            disabled={resendDisabled}
            activeOpacity={0.85}
            style={s.resendBtnOuter}
          >
            <View style={[s.resendBtn, resendDisabled && s.resendBtnDisabled]}>
              {resending
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.resendBtnText}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                  </Text>
              }
            </View>
          </TouchableOpacity>

          {/* Go to sign in */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
            style={s.signInBtnOuter}
          >
            <View style={s.signInBtn}>
              <Text style={s.signInBtnText}>Go to Sign In</Text>
            </View>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}
