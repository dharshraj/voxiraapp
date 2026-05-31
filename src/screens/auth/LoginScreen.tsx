import React, { useState, useRef, useEffect } from 'react';
import {
  Animated, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, ScrollView, KeyboardAvoidingView,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/googleAuth';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

const C = {
  bg: '#05050F', bgCard: '#0C0C1E', surface: '#12122A',
  purple: '#8B5CF6', purpleDark: '#6D28D9',
  cyan: '#06B6D4',  rose: '#F43F5E',
  text: '#F1F5F9',
  textSec:   'rgba(241,245,249,0.65)',
  textMuted: 'rgba(241,245,249,0.38)',
  textHint:  'rgba(241,245,249,0.20)',
  border:    'rgba(255,255,255,0.07)',
  borderMed: 'rgba(255,255,255,0.12)',
};

export default function LoginScreen({ navigation }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const orb1x = useRef(new Animated.Value(0)).current;
  const orb1y = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;
  const orb2y = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(Platform.OS === 'web' ? 0 : 28)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start();
    loop(orb1x, 3500); loop(orb1y, 4200);
    loop(orb2x, 3800); loop(orb2y, 4600);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const orb1X = orb1x.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const orb1Y = orb1y.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });
  const orb2X = orb2x.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const orb2Y = orb2y.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email.trim().toLowerCase(),
        password: data.password,
      });
      if (error) Alert.alert('Sign in failed', error.message);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google Sign-In', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const wrapperStyle: any[] = [s.wrapper, Platform.OS === 'web' && ({ minHeight: '100vh' } as any)];
  const Wrapper = Platform.OS === 'web'
    ? ({ children }: any) => <View style={wrapperStyle}>{children}</View>
    : ({ children }: any) => (
        <KeyboardAvoidingView style={wrapperStyle} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {children}
        </KeyboardAvoidingView>
      );

  return (
    <Wrapper>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Background orbs */}
      <Animated.View pointerEvents="none" style={[s.orb1, { transform: [{ translateX: orb1X }, { translateY: orb1Y }] }]}>
        <LinearGradient colors={['#8B5CF6', '#4338CA']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[s.orb2, { transform: [{ translateX: orb2X }, { translateY: orb2Y }] }]}>
        <LinearGradient colors={['#06B6D4', '#0891B2']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...(Platform.OS === 'web' ? ({ style: { flex: 1, overflowY: 'auto' } } as any) : {})}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.textMuted} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={s.logoArea}>
            <LinearGradient colors={['#8B5CF6', '#4338CA']} style={s.logoBox}>
              <Text style={s.logoEmoji}>🎙️</Text>
            </LinearGradient>
            <Text style={s.logoText}>
              VOX<Text style={s.logoAccent}>IRA</Text>
            </Text>
          </View>

          <Text style={s.heading}>Welcome Back</Text>
          <Text style={s.sub}>Sign in to continue your journey</Text>

          {/* ── Google button ──────────────────────────────────── */}
          <TouchableOpacity
            onPress={onGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
            style={s.googleBtn}
          >
            {googleLoading
              ? <ActivityIndicator color={C.text} size="small" />
              : (
                <>
                  <View style={s.googleIcon}>
                    <Text style={s.googleG}>G</Text>
                  </View>
                  <Text style={s.googleBtnText}>Continue with Google</Text>
                </>
              )
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or sign in with email</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Form */}
          <View style={s.form}>

            <View style={s.fieldWrap}>
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.email && s.inputError]}>
                    <Ionicons name="mail-outline" size={17} color={C.textHint} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="you@email.com"
                      placeholderTextColor="rgba(241,245,249,0.25)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={s.fieldWrap}>
              <View style={s.labelRow}>
                <Text style={s.label}>PASSWORD</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.password && s.inputError]}>
                    <Ionicons name="lock-closed-outline" size={17} color={C.textHint} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Your password"
                      placeholderTextColor="rgba(241,245,249,0.25)"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      onSubmitEditing={handleSubmit(onLogin)}
                      returnKeyType="go"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={C.textHint} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>

            {/* Sign In */}
            <TouchableOpacity
              onPress={handleSubmit(onLogin)}
              disabled={loading}
              activeOpacity={0.85}
              style={s.signInOuter}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.signInBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.signInBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' && <View style={{ height: 40 }} />}
        </Animated.View>
      </ScrollView>
    </Wrapper>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: C.bg },
  flex:    { flex: 1 },
  scroll:  { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  orb1: {
    position: 'absolute', top: -80, right: -60,
    width: 300, height: 300, borderRadius: 150,
    opacity: 0.20, overflow: 'hidden',
  },
  orb2: {
    position: 'absolute', bottom: -60, left: -40,
    width: 260, height: 260, borderRadius: 130,
    opacity: 0.15, overflow: 'hidden',
  },

  backBtn: {
    marginTop: Platform.OS === 'ios' ? 56 : 24,
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: C.borderMed,
    alignItems: 'center', justifyContent: 'center',
  },

  logoArea: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  logoEmoji: { fontSize: 28 },
  logoText: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  logoAccent: { color: C.cyan },

  heading: { fontSize: 30, fontWeight: '800', color: C.text, marginBottom: 6 },
  sub: { fontSize: 14, color: C.textMuted, marginBottom: 28 },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  googleIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  googleG: {
    fontSize: 16, fontWeight: '800',
    color: '#4285F4',
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.textMuted, fontSize: 12, marginHorizontal: 12 },

  form: { width: '100%' },
  fieldWrap: { marginBottom: 18 },
  label: {
    fontSize: 11, fontWeight: '600',
    color: C.textMuted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  forgotText: { fontSize: 13, color: C.cyan },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 16, height: 56, paddingHorizontal: 14,
  },
  inputError: { borderColor: C.rose },
  inputIcon:  { marginRight: 10 },
  input: { flex: 1, color: C.text, fontSize: 15 },
  errorText: { color: C.rose, fontSize: 12, marginTop: 5 },

  signInOuter: {
    borderRadius: 18, overflow: 'hidden',
    marginTop: 4, marginBottom: 8,
    shadowColor: C.purple,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  signInBtn: { height: 56, alignItems: 'center', justifyContent: 'center' },
  signInBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 28,
  },
  footerText: { color: C.textSec, fontSize: 14 },
  footerLink: { color: C.purple, fontSize: 14, fontWeight: '600' },
});
