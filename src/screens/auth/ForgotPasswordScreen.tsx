import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type Form = z.infer<typeof schema>;

// ─── Tips data ────────────────────────────────────────────────────────────────
const TIPS = [
  'Check your Spam or Junk folder',
  'The reset link expires in 1 hour',
  'Click the link to create a new password',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  // Orb — cyan, bottom-right
  const orbX = useRef(new Animated.Value(0)).current;
  const orbY = useRef(new Animated.Value(0)).current;
  // Content entrance
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbX, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(orbX, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbY, { toValue: 1, duration: 4300, useNativeDriver: true }),
        Animated.timing(orbY, { toValue: 0, duration: 4300, useNativeDriver: true }),
      ])
    ).start();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const orbTranslateX = orbX.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orbTranslateY = orbY.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: Form) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'voxira://reset-password',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setSent(true);
  };

  const rootStyle: any[] = [
    s.root,
    Platform.OS === 'web' && ({ minHeight: '100vh' } as any),
  ];

  return (
    <KeyboardAvoidingView
      style={rootStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      {/* Orb — cyan, bottom-right */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.orb,
          { transform: [{ translateX: orbTranslateX }, { translateY: orbTranslateY }] },
        ]}
      >
        <LinearGradient colors={['#06B6D4', '#0891B2']} style={s.orbInner} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...(Platform.OS === 'web' ? ({ style: { flex: 1, overflowY: 'auto' } } as any) : {})}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(241,245,249,0.38)" />
          </TouchableOpacity>

          {/* Icon box */}
          <View
            style={[
              s.iconBox,
              sent
                ? { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.30)' }
                : { backgroundColor: 'rgba(6,182,212,0.10)',  borderColor: 'rgba(6,182,212,0.30)'  },
            ]}
          >
            <Ionicons
              name={sent ? 'checkmark-circle' : 'lock-open-outline'}
              size={40}
              color={sent ? '#10B981' : '#06B6D4'}
            />
          </View>

          {/* Title */}
          <Text style={s.title}>{sent ? 'Email Sent!' : 'Forgot Password?'}</Text>

          {/* Subtitle */}
          <Text style={s.subtitle}>
            {sent
              ? 'We sent a password reset link to your inbox. Open the email and follow the instructions to set a new password.'
              : "No worries! Enter your email address and we'll send you a secure link to reset your password."}
          </Text>

          {/* ── Not-sent state ──────────────────────────────────────────── */}
          {!sent && (
            <>
              {/* Email field */}
              <View style={s.fieldWrap}>
                <Text style={s.label}>EMAIL ADDRESS</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputWrap, errors.email && s.inputError]}>
                      <Ionicons name="mail-outline" size={18} color="rgba(241,245,249,0.22)" style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="you@email.com"
                        placeholderTextColor="rgba(241,245,249,0.28)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        onSubmitEditing={handleSubmit(onSubmit)}
                        returnKeyType="go"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
              </View>

              {/* Send Reset Link button */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                activeOpacity={0.85}
                style={s.sendBtnOuter}
              >
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.sendBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.sendBtnText}>Send Reset Link</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* ── Sent state ──────────────────────────────────────────────── */}
          {sent && (
            <>
              {/* Tips card */}
              <View style={s.tipsCard}>
                {TIPS.map((tip, i) => (
                  <View key={i} style={[s.tipRow, i < TIPS.length - 1 && s.tipRowBorder]}>
                    <Ionicons name="information-circle" size={18} color="#06B6D4" style={s.tipIcon} />
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* Back to Login button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
                style={s.backToLoginOuter}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.backToLoginBtn}
                >
                  <Text style={s.backToLoginText}>Back to Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* Ghost return link */}
          <TouchableOpacity
            style={s.ghostRow}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={s.ghostText}>← Return to Login</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05050F',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 48,
  },

  // Orb
  orb: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.18,
    overflow: 'hidden',
  },
  orbInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },

  // Back button
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },

  // Icon box
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  // Title + subtitle
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(241,245,249,0.38)',
    lineHeight: 22,
    marginBottom: 32,
  },

  // Form
  fieldWrap: { marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(241,245,249,0.38)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 14,
  },
  inputError: { borderColor: '#F43F5E' },
  inputIcon:  { marginRight: 10 },
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 15,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    marginTop: 5,
  },

  // Send button
  sendBtnOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#06B6D4',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sendBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Tips card
  tipsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 0,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  tipRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  tipIcon: { marginRight: 12, marginTop: 1 },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(241,245,249,0.65)',
    lineHeight: 20,
  },

  // Back to Login button
  backToLoginOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 20,
  },
  backToLoginBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Ghost
  ghostRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  ghostText: {
    color: 'rgba(241,245,249,0.38)',
    fontSize: 14,
  },
});
