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

const registerSchema = z
  .object({
    fullName:        z.string().min(2, 'Full name must be at least 2 characters'),
    email:           z.string().email('Enter a valid email'),
    password:        z.string()
                       .min(8, 'Min 8 chars')
                       .regex(/[A-Z]/, 'Need uppercase')
                       .regex(/[0-9]/, 'Need number'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (p.length >= 8)              score++;
  if (/[A-Z]/.test(p))            score++;
  if (/[0-9]/.test(p))            score++;
  if (/[^A-Za-z0-9]/.test(p))    score++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: '',       color: 'transparent' },
    1: { label: 'Weak',   color: '#EF4444' },
    2: { label: 'Fair',   color: '#F59E0B' },
    3: { label: 'Good',   color: '#3B82F6' },
    4: { label: 'Strong', color: '#22C55E' },
  };
  return { score, ...map[score] };
}

const PILLS = ['🎤 Speech AI', '✍️ Writing', '🤝 Interviews'];

export default function RegisterScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [formError,     setFormError]     = useState<string | null>(null);

  const strength = getStrength(passwordValue);

  const orb1x = useRef(new Animated.Value(0)).current;
  const orb1y = useRef(new Animated.Value(0)).current;
  const orb2x = useRef(new Animated.Value(0)).current;
  const orb2y = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(Platform.OS === 'web' ? 0 : 24)).current;
  const pillAnims = useRef(PILLS.map(() => new Animated.Value(Platform.OS === 'web' ? 1 : 0))).current;

  useEffect(() => {
    const loop = (v: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start();
    loop(orb1x, 3500); loop(orb1y, 4200);
    loop(orb2x, 3900); loop(orb2y, 4700);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    pillAnims.forEach((anim, i) => {
      Animated.timing(anim, { toValue: 1, duration: 400, delay: 300 + i * 80, useNativeDriver: true }).start();
    });
  }, []);

  const orb1TX = orb1x.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orb1TY = orb1y.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const orb2TX = orb2x.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orb2TY = orb2y.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

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

  const onRegister = async (data: RegisterForm) => {
    setFormError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options:  { data: { full_name: data.fullName } },
      });
      if (error) {
        setFormError(
          error.message.toLowerCase().includes('already registered')
            ? 'An account with this email already exists. Try signing in.'
            : error.message
        );
      } else {
        setFormError(null);
        navigation.navigate('Login', { notice: 'Account created! Check your email to verify before signing in.' });
      }
    } catch (e: any) {
      setFormError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: C.bg },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    orb1: { position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140, opacity: 0.15, backgroundColor: C.primary },
    orb2: { position: 'absolute', bottom: -60, right: -40, width: 240, height: 240, borderRadius: 120, opacity: 0.10, backgroundColor: C.primaryPressed },
    backBtn: {
      marginTop: Platform.OS === 'ios' ? 56 : 24,
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    heading: { fontSize: 30, fontWeight: '800', color: C.text, marginTop: 24, marginBottom: 6 },
    subheading: { fontSize: 14, color: C.textMuted, marginBottom: 20 },
    pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
    pill: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: C.primary + '50', backgroundColor: C.primaryLight,
    },
    pillText: { color: C.primary, fontSize: 12 },
    form: { width: '100%' },
    fieldWrap: { marginBottom: 16 },
    label: {
      fontSize: 11, fontWeight: '600', color: C.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
    },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 16, height: 56, paddingHorizontal: 14,
    },
    inputError: { borderColor: C.error },
    inputIcon:  { marginRight: 10 },
    input: { flex: 1, color: C.text, fontSize: 15 },
    errorText: { color: C.error, fontSize: 12, marginTop: 5 },
    strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 3, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '600', width: 44, textAlign: 'right' },
    formErrorWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.error + '14', borderWidth: 1, borderColor: C.error + '40',
      borderRadius: 12, padding: 12, marginBottom: 12,
    },
    formErrorText: { flex: 1, color: C.error, fontSize: 13 },
    termsText: { color: C.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 20, textAlign: 'center' },
    termsLink: { color: C.primary },
    createBtnOuter: { borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    createBtn: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { color: C.textMuted, fontSize: 12, marginHorizontal: 12 },
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      height: 54, borderRadius: 16, backgroundColor: '#fff',
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    googleG: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
    googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
    footerText: { color: C.textSec, fontSize: 14 },
    footerLink: { color: C.primary, fontSize: 14, fontWeight: '600' },
  });

  const wrapperStyle: any[] = [s.wrapper, Platform.OS === 'web' && ({ height: '100vh' } as any)];
  const Wrapper = Platform.OS === 'web'
    ? ({ children }: any) => <View style={wrapperStyle}>{children}</View>
    : ({ children }: any) => <KeyboardAvoidingView style={wrapperStyle} behavior="padding">{children}</KeyboardAvoidingView>;

  return (
    <Wrapper>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View pointerEvents="none" style={[s.orb1, { transform: [{ translateX: orb1TX }, { translateY: orb1TY }] }]} />
      <Animated.View pointerEvents="none" style={[s.orb2, { transform: [{ translateX: orb2TX }, { translateY: orb2TY }] }]} />

      <ScrollView
        style={Platform.OS === 'web' ? ({ height: '100vh', overflowY: 'scroll' } as any) : s.flex}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.textMuted} />
          </TouchableOpacity>

          <Text style={s.heading}>Create Account</Text>
          <Text style={s.subheading}>Join thousands mastering communication</Text>

          <View style={s.pillRow}>
            {PILLS.map((pill, i) => (
              <Animated.View
                key={pill}
                style={[s.pill, { opacity: pillAnims[i], transform: [{ translateY: pillAnims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
              >
                <Text style={s.pillText}>{pill}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={s.form}>
            <View style={s.fieldWrap}>
              <Text style={s.label}>FULL NAME</Text>
              <Controller control={control} name="fullName" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.fullName && s.inputError]}>
                  <Ionicons name="person-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="Enter your full name" placeholderTextColor={C.textMuted}
                    autoCapitalize="words" onBlur={onBlur} onChangeText={onChange} value={value} />
                </View>
              )} />
              {errors.fullName && <Text style={s.errorText}>{errors.fullName.message}</Text>}
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.email && s.inputError]}>
                  <Ionicons name="mail-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="you@email.com" placeholderTextColor={C.textMuted}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                    onBlur={onBlur} onChangeText={onChange} value={value} />
                </View>
              )} />
              {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>PASSWORD</Text>
              <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.password && s.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="Create a strong password" placeholderTextColor={C.textMuted}
                    secureTextEntry={!showPassword} autoCapitalize="none" onBlur={onBlur}
                    onChangeText={text => { onChange(text); setPasswordValue(text); }} value={value} />
                  <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              )} />
              {passwordValue.length > 0 && (
                <View style={s.strengthWrap}>
                  <View style={s.strengthBars}>
                    {[1, 2, 3, 4].map(i => (
                      <View key={i} style={[s.strengthBar, { backgroundColor: i <= strength.score ? strength.color : C.border }]} />
                    ))}
                  </View>
                  {strength.label ? <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text> : null}
                </View>
              )}
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>CONFIRM PASSWORD</Text>
              <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.confirmPassword && s.inputError]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="Repeat your password" placeholderTextColor={C.textMuted}
                    secureTextEntry={!showConfirm} autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
                  <TouchableOpacity onPress={() => setShowConfirm(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              )} />
              {errors.confirmPassword && <Text style={s.errorText}>{errors.confirmPassword.message}</Text>}
            </View>

            <Text style={s.termsText}>
              By signing up, you agree to our <Text style={s.termsLink}>Terms of Service</Text> and <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>

            {formError && (
              <View style={s.formErrorWrap}>
                <Ionicons name="alert-circle-outline" size={15} color={C.error} style={{ marginRight: 7 }} />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleSubmit(onRegister)} disabled={loading} activeOpacity={0.85} style={s.createBtnOuter}>
              <View style={s.createBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="rocket-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={s.createBtnText}>Create My Account</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity onPress={onGoogleSignIn} disabled={googleLoading} activeOpacity={0.85} style={s.googleBtn}>
              {googleLoading
                ? <ActivityIndicator color="#1a1a1a" size="small" />
                : (<><Text style={s.googleG}>G</Text><Text style={s.googleBtnText}>Continue with Google</Text></>)
              }
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' && <View style={{ height: 40 }} />}
        </Animated.View>
      </ScrollView>
    </Wrapper>
  );
}
