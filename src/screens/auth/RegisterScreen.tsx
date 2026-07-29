import React, { useState, useRef, useEffect, memo } from 'react';
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

// ── Validation schema ─────────────────────────────────────────────────────────
// Name: 3–20 chars, letters/spaces/hyphens only (supports "Mary Jane", "Anne-Marie")
// Email: standard RFC email format (any domain, not just gmail.com)
// Password: 8–20 chars, must contain uppercase, lowercase, digit, special char
// ─────────────────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3,  'Name must be at least 3 characters')
      .max(20, 'Name must be 20 characters or less')
      .regex(/^[A-Za-z\s\-]+$/, 'Name must contain letters only (spaces and hyphens allowed)'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address (e.g. you@example.com)'),
    password: z
      .string()
      .min(8,  'Password must be at least 8 characters')
      .max(20, 'Password must be 20 characters or less')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one special character (!@#$% etc.)'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ── Password strength meter ───────────────────────────────────────────────────
function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (p.length >= 8)           score++;
  if (/[A-Z]/.test(p))         score++;
  if (/[0-9]/.test(p))         score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: '',       color: 'transparent' },
    1: { label: 'Weak',   color: '#EF4444' },
    2: { label: 'Fair',   color: '#F59E0B' },
    3: { label: 'Good',   color: '#3B82F6' },
    4: { label: 'Strong', color: '#22C55E' },
  };
  return { score, ...map[score] };
}

// ── Stable wrapper components ─────────────────────────────────────────────────
// CRITICAL: these MUST be defined OUTSIDE RegisterScreen (or memoised as stable
// references). Defining a component inline inside a render function causes React
// to treat it as a new component type on every render, which unmounts + remounts
// the entire subtree — causing every TextInput to lose focus after each keystroke.
//
// By moving them outside (or using memo at module level), the reference is stable
// across renders and React correctly reconciles children without remounting.
const WebWrapper = ({ children, style }: { children: React.ReactNode; style: any }) => (
  <View style={style}>{children}</View>
);

const NativeWrapper = ({ children, style }: { children: React.ReactNode; style: any }) => (
  <KeyboardAvoidingView style={style} behavior="padding">{children}</KeyboardAvoidingView>
);

// Pick once at module level — never changes between renders
const Wrapper = Platform.OS === 'web' ? WebWrapper : NativeWrapper;

const PILLS = ['🎤 Speech AI'];

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [formError,     setFormError]     = useState<string | null>(null);

  // Track which fields have been touched so we only show errors after
  // the user has interacted with a field (not on an untouched empty field)
  const [touched, setTouched] = useState({
    fullName: false,
    email:    false,
    password: false,
    confirmPassword: false,
  });

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
    resolver:   zodResolver(registerSchema),
    mode:       'onChange',   // validate as user types — after field is touched
    reValidateMode: 'onChange',
  });

  const touch = (field: keyof typeof touched) =>
    setTouched(prev => ({ ...prev, [field]: true }));

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
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already in use')) {
          setFormError('An account with this email already exists. Try signing in.');
        } else if (msg.includes('email sending') || msg.includes('rate limit') || msg.includes('email limit')) {
          // Supabase free plan email rate limit — guide user to the fix
          setFormError(
            'Email sending limit reached. ' +
            'To fix this permanently: go to Supabase Dashboard → Authentication → Providers → Email → disable "Confirm email". ' +
            'This allows immediate signups without confirmation emails.'
          );
        } else {
          setFormError(error.message);
        }
      } else {
        // If email confirmation is disabled in Supabase, the user is signed in immediately.
        // If it is still enabled, direct them to check their inbox.
        navigation.navigate('Login', {
          notice: 'Account created! Check your email to verify before signing in, or sign in directly if confirmation is disabled.',
        });
      }
    } catch (e: any) {
      setFormError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    wrapper:      { flex: 1, backgroundColor: C.bg },
    flex:         { flex: 1 },
    scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    orb1:         { position: 'absolute', top: -80,  right: -60, width: 280, height: 280, borderRadius: 140, opacity: 0.15, backgroundColor: C.primary },
    orb2:         { position: 'absolute', bottom: -60, right: -40, width: 240, height: 240, borderRadius: 120, opacity: 0.10, backgroundColor: C.primaryPressed },
    backBtn:      { marginTop: Platform.OS === 'ios' ? 56 : 24, width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    heading:      { fontSize: 30, fontWeight: '800', color: C.text, marginTop: 24, marginBottom: 6 },
    subheading:   { fontSize: 14, color: C.textMuted, marginBottom: 20 },
    pillRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
    pill:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.primary + '50', backgroundColor: C.primaryLight },
    pillText:     { color: C.primary, fontSize: 12 },
    form:         { width: '100%' },
    fieldWrap:    { marginBottom: 16 },
    label:        { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
    inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, height: 56, paddingHorizontal: 14 },
    inputError:   { borderColor: C.error },
    inputIcon:    { marginRight: 10 },
    input:        { flex: 1, color: C.text, fontSize: 15 },
    errorText:    { color: C.error, fontSize: 12, marginTop: 5 },
    // Password strength bar
    strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar:  { flex: 1, height: 3, borderRadius: 2 },
    strengthLabel:{ fontSize: 11, fontWeight: '600', width: 44, textAlign: 'right' },
    // Password requirements list
    reqWrap:      { marginTop: 8, gap: 4 },
    reqRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
    reqTxt:       { fontSize: 11, color: C.textMuted },
    reqMet:       { color: '#22C55E' },
    // Form-level error banner
    formErrorWrap:{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.error + '14', borderWidth: 1, borderColor: C.error + '40', borderRadius: 12, padding: 12, marginBottom: 12 },
    formErrorText:{ flex: 1, color: C.error, fontSize: 13, lineHeight: 19 },
    termsText:    { color: C.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 20, textAlign: 'center' },
    termsLink:    { color: C.primary },
    createBtnOuter: { borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    createBtn:    { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary },
    createBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
    dividerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
    dividerText:  { color: C.textMuted, fontSize: 12, marginHorizontal: 12 },
    googleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    googleG:      { fontSize: 18, fontWeight: '800', color: '#4285F4' },
    googleBtnText:{ fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    footer:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
    footerText:   { color: C.textSec, fontSize: 14 },
    footerLink:   { color: C.primary, fontSize: 14, fontWeight: '600' },
  });

  const wrapperStyle: any[] = [
    s.wrapper,
    Platform.OS === 'web' && ({ height: '100%' } as any),
  ];

  // Password requirement checks (shown as checklist once user starts typing)
  const pw = passwordValue;
  const pwReqs = [
    { label: '8–20 characters',             met: pw.length >= 8 && pw.length <= 20 },
    { label: 'One uppercase letter (A–Z)',   met: /[A-Z]/.test(pw) },
    { label: 'One lowercase letter (a–z)',   met: /[a-z]/.test(pw) },
    { label: 'One number (0–9)',             met: /[0-9]/.test(pw) },
    { label: 'One special character (!@#$)', met: /[^A-Za-z0-9]/.test(pw) },
  ];

  return (
    <Wrapper style={wrapperStyle}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View pointerEvents="none" style={[s.orb1, { transform: [{ translateX: orb1TX }, { translateY: orb1TY }] }]} />
      <Animated.View pointerEvents="none" style={[s.orb2, { transform: [{ translateX: orb2TX }, { translateY: orb2TY }] }]} />

      <ScrollView
        style={s.flex}
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
                style={[s.pill, {
                  opacity: pillAnims[i],
                  transform: [{ translateY: pillAnims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                }]}
              >
                <Text style={s.pillText}>{pill}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={s.form}>

            {/* ── Full Name ───────────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Full Name</Text>
              <Controller control={control} name="fullName" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, touched.fullName && errors.fullName && s.inputError]}>
                  <Ionicons name="person-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={C.textMuted}
                    autoCapitalize="words"
                    onBlur={() => { onBlur(); touch('fullName'); }}
                    onChangeText={v => { onChange(v); if (v.length >= 1) touch('fullName'); }}
                    value={value}
                  />
                </View>
              )} />
              {/* Only show error if field has been touched AND has value */}
              {touched.fullName && errors.fullName && (
                <Text style={s.errorText}>{errors.fullName.message}</Text>
              )}
            </View>

            {/* ── Email ───────────────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Email Address</Text>
              <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, touched.email && errors.email && s.inputError]}>
                  <Ionicons name="mail-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="you@example.com"
                    placeholderTextColor={C.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={() => { onBlur(); touch('email'); }}
                    onChangeText={v => { onChange(v); if (v.length >= 1) touch('email'); }}
                    value={value}
                  />
                </View>
              )} />
              {touched.email && errors.email && (
                <Text style={s.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* ── Password ────────────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, touched.password && errors.password && s.inputError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Create a strong password"
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      onBlur={() => { onBlur(); touch('password'); }}
                      onChangeText={text => {
                        onChange(text);
                        setPasswordValue(text);
                        if (text.length >= 1) touch('password');
                      }}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(p => !p)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {/* Strength bar — shown while typing */}
              {pw.length > 0 && (
                <View style={s.strengthWrap}>
                  <View style={s.strengthBars}>
                    {[1, 2, 3, 4].map(i => (
                      <View key={i} style={[s.strengthBar, { backgroundColor: i <= strength.score ? strength.color : C.border }]} />
                    ))}
                  </View>
                  {strength.label ? <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text> : null}
                </View>
              )}
              {/* Requirements checklist — shown while typing, replaces cryptic error messages */}
              {pw.length > 0 && (
                <View style={s.reqWrap}>
                  {pwReqs.map((req, i) => (
                    <View key={i} style={s.reqRow}>
                      <Ionicons
                        name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                        size={12}
                        color={req.met ? '#22C55E' : C.textMuted}
                      />
                      <Text style={[s.reqTxt, req.met && s.reqMet]}>{req.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Confirm Password ────────────────────────────────────────── */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Confirm Password</Text>
              <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, touched.confirmPassword && errors.confirmPassword && s.inputError]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={C.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Repeat your password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    onBlur={() => { onBlur(); touch('confirmPassword'); }}
                    onChangeText={v => { onChange(v); if (v.length >= 1) touch('confirmPassword'); }}
                    value={value}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(p => !p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              )} />
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={s.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            <Text style={s.termsText}>
              By signing up, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text> and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>

            {formError && (
              <View style={s.formErrorWrap}>
                <Ionicons name="alert-circle-outline" size={15} color={C.error} style={{ marginRight: 7, marginTop: 1 }} />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit(onRegister)}
              disabled={loading}
              activeOpacity={0.85}
              style={s.createBtnOuter}
            >
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
                : (<><Text style={s.googleG}>G</Text><Text style={s.googleBtnText}>Continue with Google</Text></>)}
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
