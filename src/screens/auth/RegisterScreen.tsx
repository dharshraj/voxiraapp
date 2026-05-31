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
import { signInWithGoogle } from '../../lib/googleAuth';

// ─── Validation ───────────────────────────────────────────────────────────────
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

// ─── Strength helper ──────────────────────────────────────────────────────────
function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (p.length >= 8)              score++;
  if (/[A-Z]/.test(p))            score++;
  if (/[0-9]/.test(p))            score++;
  if (/[^A-Za-z0-9]/.test(p))    score++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: '',       color: 'transparent' },
    1: { label: 'Weak',   color: '#F43F5E' },
    2: { label: 'Fair',   color: '#F59E0B' },
    3: { label: 'Good',   color: '#06B6D4' },
    4: { label: 'Strong', color: '#10B981' },
  };
  return { score, ...map[score] };
}

// ─── Feature pills data ───────────────────────────────────────────────────────
const PILLS = ['🎤 Speech AI', '✍️ Writing', '🤝 Interviews'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: any) {
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [passwordValue,   setPasswordValue]   = useState('');

  const strength = getStrength(passwordValue);

  // Orb 1 — purple, top-right
  const orb1x = useRef(new Animated.Value(0)).current;
  const orb1y = useRef(new Animated.Value(0)).current;
  // Orb 2 — rose, bottom-right
  const orb2x = useRef(new Animated.Value(0)).current;
  const orb2y = useRef(new Animated.Value(0)).current;
  // Content entrance — skip animation on web (rAF throttled in headless/some browsers)
  const fadeAnim  = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(Platform.OS === 'web' ? 0 : 24)).current;
  // Pill stagger — start visible on web
  const pillAnims = useRef(PILLS.map(() => new Animated.Value(Platform.OS === 'web' ? 1 : 0))).current;

  useEffect(() => {
    // Orb 1
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1x, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(orb1x, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1y, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(orb1y, { toValue: 0, duration: 4200, useNativeDriver: true }),
      ])
    ).start();
    // Orb 2
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2x, { toValue: 1, duration: 3900, useNativeDriver: true }),
        Animated.timing(orb2x, { toValue: 0, duration: 3900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2y, { toValue: 1, duration: 4700, useNativeDriver: true }),
        Animated.timing(orb2y, { toValue: 0, duration: 4700, useNativeDriver: true }),
      ])
    ).start();
    // Content entrance
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    // Pill stagger
    pillAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue:  1,
        duration: 400,
        delay:    300 + i * 80,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const orb1TranslateX = orb1x.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orb1TranslateY = orb1y.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const orb2TranslateX = orb2x.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orb2TranslateY = orb2y.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google Sign-In', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  { data: { full_name: data.fullName } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert(
        'Account created!',
        'Check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  const wrapperStyle: any[] = [
    s.wrapper,
    Platform.OS === 'web' && ({ minHeight: '100vh' } as any),
  ];

  const Wrapper = Platform.OS === 'web'
    ? ({ children }: any) => <View style={wrapperStyle}>{children}</View>
    : ({ children }: any) => (
        <KeyboardAvoidingView
          style={wrapperStyle}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {children}
        </KeyboardAvoidingView>
      );

  return (
    <Wrapper>
      <StatusBar barStyle="light-content" backgroundColor="#05050F" />

      {/* Orb 1 — purple, top-right */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.orb1,
          { transform: [{ translateX: orb1TranslateX }, { translateY: orb1TranslateY }] },
        ]}
      >
        <LinearGradient colors={['#8B5CF6', '#4338CA']} style={s.orb1Inner} />
      </Animated.View>

      {/* Orb 2 — rose, bottom-right */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.orb2,
          { transform: [{ translateX: orb2TranslateX }, { translateY: orb2TranslateY }] },
        ]}
      >
        <LinearGradient colors={['#F43F5E', '#BE123C']} style={s.orb2Inner} />
      </Animated.View>

      <ScrollView
        style={s.flex}
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

          {/* Heading */}
          <Text style={s.heading}>Create Account</Text>
          <Text style={s.subheading}>Join thousands mastering communication</Text>

          {/* Feature pills */}
          <View style={s.pillRow}>
            {PILLS.map((pill, i) => (
              <Animated.View
                key={pill}
                style={[
                  s.pill,
                  {
                    opacity: pillAnims[i],
                    transform: [{
                      translateY: pillAnims[i].interpolate({
                        inputRange: [0, 1], outputRange: [12, 0],
                      }),
                    }],
                  },
                ]}
              >
                <Text style={s.pillText}>{pill}</Text>
              </Animated.View>
            ))}
          </View>

          {/* ── Form ───────────────────────────────────────────────────── */}
          <View style={s.form}>

            {/* Full Name */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>FULL NAME</Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.fullName && s.inputError]}>
                    <Ionicons name="person-outline" size={18} color="rgba(241,245,249,0.22)" style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="rgba(241,245,249,0.28)"
                      autoCapitalize="words"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.fullName && <Text style={s.errorText}>{errors.fullName.message}</Text>}
            </View>

            {/* Email */}
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
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>PASSWORD</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.password && s.inputError]}>
                    <Ionicons name="lock-closed-outline" size={18} color="rgba(241,245,249,0.22)" style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Create a strong password"
                      placeholderTextColor="rgba(241,245,249,0.28)"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={text => { onChange(text); setPasswordValue(text); }}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(p => !p)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="rgba(241,245,249,0.22)"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {/* Strength meter */}
              {passwordValue.length > 0 && (
                <View style={s.strengthWrap}>
                  <View style={s.strengthBars}>
                    {[1, 2, 3, 4].map(i => (
                      <View
                        key={i}
                        style={[
                          s.strengthBar,
                          { backgroundColor: i <= strength.score ? strength.color : 'rgba(255,255,255,0.07)' },
                        ]}
                      />
                    ))}
                  </View>
                  {strength.label ? (
                    <Text style={[s.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  ) : null}
                </View>
              )}
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>CONFIRM PASSWORD</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.confirmPassword && s.inputError]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="rgba(241,245,249,0.22)" style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Repeat your password"
                      placeholderTextColor="rgba(241,245,249,0.28)"
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(p => !p)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="rgba(241,245,249,0.22)"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={s.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            {/* Terms */}
            <Text style={s.termsText}>
              By signing up, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Create Account button */}
            <TouchableOpacity
              onPress={handleSubmit(onRegister)}
              disabled={loading}
              activeOpacity={0.85}
              style={s.createBtnOuter}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.createBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="rocket-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={s.createBtnText}>Create My Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              onPress={onGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.85}
              style={s.googleBtn}
            >
              {googleLoading
                ? <ActivityIndicator color="#1a1a1a" size="small" />
                : (
                  <>
                    <Text style={s.googleG}>G</Text>
                    <Text style={s.googleBtnText}>Continue with Google</Text>
                  </>
                )
              }
            </TouchableOpacity>

          </View>

          {/* Footer */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#05050F',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Orbs
  orb1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.22,
    overflow: 'hidden',
  },
  orb1Inner: {
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  orb2: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.18,
    overflow: 'hidden',
  },
  orb2Inner: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },

  // Back button
  backBtn: {
    marginTop: Platform.OS === 'ios' ? 56 : 24,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Heading
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F1F5F9',
    marginTop: 24,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: 'rgba(241,245,249,0.38)',
    marginBottom: 20,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(139,92,246,0.10)',
  },
  pillText: {
    color: '#8B5CF6',
    fontSize: 12,
  },

  // Form
  form: { width: '100%' },
  fieldWrap: { marginBottom: 16 },
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

  // Strength
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 44,
    textAlign: 'right',
  },

  // Terms
  termsText: {
    color: 'rgba(241,245,249,0.22)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  termsLink: { color: '#06B6D4' },

  // Create button
  createBtnOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  createBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dividerText: {
    color: 'rgba(241,245,249,0.38)',
    fontSize: 12,
    marginHorizontal: 12,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: 'rgba(241,245,249,0.65)',
    fontSize: 14,
  },
  footerLink: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
});
