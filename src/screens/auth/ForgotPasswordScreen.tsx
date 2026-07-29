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
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type Form = z.infer<typeof schema>;

const TIPS = [
  'Check your Spam or Junk folder',
  'The reset link expires in 1 hour',
  'Click the link to create a new password',
];

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const orbX = useRef(new Animated.Value(0)).current;
  const orbY = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

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

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { flexGrow: 1, padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 48 },
    orb: {
      position: 'absolute', bottom: -60, right: -40,
      width: 240, height: 240, borderRadius: 120, opacity: 0.12,
      backgroundColor: C.primary,
    },
    backBtn: {
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: 36,
    },
    iconBox: {
      width: 80, height: 80, borderRadius: 24, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    title: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 12, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: C.textMuted, lineHeight: 22, marginBottom: 32 },
    fieldWrap: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 16, height: 56, paddingHorizontal: 14,
    },
    inputError: { borderColor: C.error },
    inputIcon:  { marginRight: 10 },
    input: { flex: 1, color: C.text, fontSize: 15 },
    errorText: { color: C.error, fontSize: 12, marginTop: 5 },
    sendBtnOuter: { borderRadius: 16, overflow: 'hidden' },
    sendBtn: { height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    tipsCard: {
      backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 16, marginBottom: 20,
    },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
    tipRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    tipIcon: { marginRight: 12, marginTop: 1 },
    tipText: { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 20 },
    backToLoginOuter: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    backToLoginBtn: { height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.success },
    backToLoginText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ghostRow: { alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 8 },
    ghostText: { color: C.textMuted, fontSize: 14 },
  });

  const rootStyle = s.root;

  return (
    <KeyboardAvoidingView style={rootStyle} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View pointerEvents="none" style={[s.orb, { transform: [{ translateX: orbTranslateX }, { translateY: orbTranslateY }] }]} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.textMuted} />
          </TouchableOpacity>

          <View style={[s.iconBox, sent
            ? { backgroundColor: C.success + '1A', borderColor: C.success + '50' }
            : { backgroundColor: C.primary + '1A', borderColor: C.primary + '50' }
          ]}>
            <Ionicons name={sent ? 'checkmark-circle' : 'lock-open-outline'} size={40} color={sent ? C.success : C.primary} />
          </View>

          <Text style={s.title}>{sent ? 'Email Sent!' : 'Forgot Password?'}</Text>
          <Text style={s.subtitle}>
            {sent
              ? 'We sent a password reset link to your inbox. Open the email and follow the instructions to set a new password.'
              : "No worries! Enter your email address and we'll send you a secure link to reset your password."}
          </Text>

          {!sent && (
            <>
              <View style={s.fieldWrap}>
                <Text style={s.label}>EMAIL ADDRESS</Text>
                <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, errors.email && s.inputError]}>
                    <Ionicons name="mail-outline" size={18} color={C.textMuted} style={s.inputIcon} />
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
                      onSubmitEditing={handleSubmit(onSubmit)}
                      returnKeyType="go"
                    />
                  </View>
                )} />
                {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
              </View>

              <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading} activeOpacity={0.85} style={s.sendBtnOuter}>
                <View style={s.sendBtn}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Send Reset Link</Text>}
                </View>
              </TouchableOpacity>
            </>
          )}

          {sent && (
            <>
              <View style={s.tipsCard}>
                {TIPS.map((tip, i) => (
                  <View key={i} style={[s.tipRow, i < TIPS.length - 1 && s.tipRowBorder]}>
                    <Ionicons name="information-circle" size={18} color={C.primary} style={s.tipIcon} />
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.85} style={s.backToLoginOuter}>
                <View style={s.backToLoginBtn}>
                  <Text style={s.backToLoginText}>Back to Login</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={s.ghostRow} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={s.ghostText}>← Return to Login</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
