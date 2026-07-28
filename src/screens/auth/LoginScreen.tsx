import React, { useState, useRef, useEffect } from 'react';
import {
  Animated, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, ScrollView, KeyboardAvoidingView,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/googleAuth';
import { useTheme } from '../../theme/ThemeContext';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);
  const notice: string | undefined        = route?.params?.notice;

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
    setFormError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email.trim().toLowerCase(),
        password: data.password,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('credentials')) {
          setFormError('Incorrect email or password. Please try again.');
        } else if (msg.includes('not confirmed') || msg.includes('email not confirmed') || msg.includes('verified')) {
          // Account exists but email_confirmed_at is null — created before
          // email confirmation was disabled in Supabase.
          // Fix: run in Supabase SQL Editor:
          //   update auth.users set email_confirmed_at = now()
          //   where email = 'your_email@example.com';
          setFormError(
            'Your account email is not verified. ' +
            'To fix this, go to Supabase Dashboard → Authentication → Users → find your account → click "Send confirmation email", or ask the admin to run: ' +
            "update auth.users set email_confirmed_at = now() where email = '" + data.email.trim().toLowerCase() + "';"
          );
        } else {
          setFormError(error.message);
        }
      }
    } catch (e: any) {
      setFormError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) setFormError(error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const s = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: C.bg },
    flex:    { flex: 1 },
    scroll:  { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    orb1: {
      position: 'absolute', top: -80, right: -60,
      width: 300, height: 300, borderRadius: 150,
      opacity: 0.15, backgroundColor: C.primary,
    },
    orb2: {
      position: 'absolute', bottom: -60, left: -40,
      width: 260, height: 260, borderRadius: 130,
      opacity: 0.10, backgroundColor: C.primaryPressed,
    },
    backBtn: {
      marginTop: Platform.OS === 'ios' ? 56 : 24,
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    logoArea: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
    logoBox: {
      width: 64, height: 64, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 10, backgroundColor: C.primary,
    },
    logoEmoji: { fontSize: 28 },
    logoText: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    logoAccent: { color: C.primary },
    heading: { fontSize: 30, fontWeight: '800', color: C.text, marginBottom: 6 },
    sub: { fontSize: 14, color: C.textMuted, marginBottom: 28 },
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
      height: 56, borderRadius: 16, backgroundColor: '#fff', marginBottom: 20,
      shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    googleIcon: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
    },
    googleG: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
    googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { color: C.textMuted, fontSize: 12, marginHorizontal: 12 },
    form: { width: '100%' },
    fieldWrap: { marginBottom: 18 },
    label: {
      fontSize: 11, fontWeight: '600', color: C.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    forgotText: { fontSize: 13, color: C.primary },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 16, height: 56, paddingHorizontal: 14,
    },
    inputError: { borderColor: C.error },
    inputIcon:  { marginRight: 10 },
    input: { flex: 1, color: C.text, fontSize: 15 },
    errorText: { color: C.error, fontSize: 12, marginTop: 5 },
    noticeWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.success + '14', borderWidth: 1, borderColor: C.success + '40',
      borderRadius: 12, padding: 12, marginBottom: 16,
    },
    noticeText: { flex: 1, color: C.success, fontSize: 13 },
    formErrorWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.error + '14', borderWidth: 1, borderColor: C.error + '40',
      borderRadius: 12, padding: 12, marginBottom: 12,
    },
    formErrorText: { flex: 1, color: C.error, fontSize: 13 },
    signInOuter: {
      borderRadius: 18, overflow: 'hidden', marginTop: 4, marginBottom: 8,
    },
    signInBtn: {
      height: 56, alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary,
    },
    signInBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
    footerText: { color: C.textSec, fontSize: 14 },
    footerLink: { color: C.primary, fontSize: 14, fontWeight: '600' },
  });

  const wrapperStyle: any[] = [s.wrapper, Platform.OS === 'web' && ({ height: '100%' } as any)];
  const Wrapper = Platform.OS === 'web'
    ? ({ children }: any) => <View style={wrapperStyle}>{children}</View>
    : ({ children }: any) => (
        <KeyboardAvoidingView style={wrapperStyle} behavior="padding">
          {children}
        </KeyboardAvoidingView>
      );

  return (
    <Wrapper>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View pointerEvents="none" style={[s.orb1, { transform: [{ translateX: orb1X }, { translateY: orb1Y }] }]} />
      <Animated.View pointerEvents="none" style={[s.orb2, { transform: [{ translateX: orb2X }, { translateY: orb2Y }] }]} />

      <ScrollView
        style={Platform.OS === 'web' ? ({ height: '100%', overflowY: 'auto' } as any) : s.flex}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.textMuted} />
          </TouchableOpacity>

          <View style={s.logoArea}>
            <View style={s.logoBox}>
              <Text style={s.logoEmoji}>🎙️</Text>
            </View>
            <Text style={s.logoText}>
              VOX<Text style={s.logoAccent}>IRA</Text>
            </Text>
          </View>

          <Text style={s.heading}>Welcome Back</Text>
          <Text style={s.sub}>Sign in to continue your journey</Text>

          {notice && (
            <View style={s.noticeWrap}>
              <Ionicons name="checkmark-circle-outline" size={15} color={C.success} style={{ marginRight: 7 }} />
              <Text style={s.noticeText}>{notice}</Text>
            </View>
          )}

          <TouchableOpacity onPress={onGoogleSignIn} disabled={googleLoading} activeOpacity={0.85} style={s.googleBtn}>
            {googleLoading
              ? <ActivityIndicator color="#1a1a1a" size="small" />
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

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or sign in with email</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.form}>
            <View style={s.fieldWrap}>
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.email && s.inputError]}>
                    <Ionicons name="mail-outline" size={17} color={C.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="you@email.com"
                      placeholderTextColor={C.textMuted}
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
                    <Ionicons name="lock-closed-outline" size={17} color={C.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Your password"
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      onSubmitEditing={handleSubmit(onLogin)}
                      returnKeyType="go"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>

            {formError && (
              <View style={s.formErrorWrap}>
                <Ionicons name="alert-circle-outline" size={15} color={C.error} style={{ marginRight: 7 }} />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleSubmit(onLogin)} disabled={loading} activeOpacity={0.85} style={s.signInOuter}>
              <View style={s.signInBtn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.signInBtnText}>Sign In</Text>
                }
              </View>
            </TouchableOpacity>
          </View>

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
