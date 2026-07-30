import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, Platform, Animated, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeContext';

export default function SettingsScreen({ navigation }: any) {
  const { colors: C, isDark, toggle } = useTheme();
  const signOutStore = useAuthStore(s => s.signOut);
  const [pushNotifs,   setPushNotifs]   = useState(true);
  const [signingOut,   setSigningOut]   = useState(false);

  // ── Change Email ────────────────────────────────────────────────────────────
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [newEmail,      setNewEmail]      = useState('');
  const [emailLoading,  setEmailLoading]  = useState(false);
  const [emailMsg,      setEmailMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  // ── Change Password ─────────────────────────────────────────────────────────
  const [pwExpanded, setPwExpanded] = useState(false);
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwMsg,      setPwMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    try {
      // Use the authStore action so Zustand state (session, user) is cleared
      // in sync with the Supabase sign-out call. Calling supabase.auth.signOut()
      // directly would leave stale user/session state in the store.
      await signOutStore();
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Something went wrong.');
    } finally {
      setSigningOut(false);
    }
  };

  const changeEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailMsg({ text: 'Enter a valid email address.', ok: false });
      return;
    }
    setEmailLoading(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailLoading(false);
    if (error) {
      setEmailMsg({ text: error.message, ok: false });
    } else {
      setEmailMsg({ text: 'Confirmation sent — check your new email inbox to confirm the change.', ok: true });
      setNewEmail('');
    }
  };

  const changePassword = async () => {
    if (newPw.length < 8) {
      setPwMsg({ text: 'Password must be at least 8 characters.', ok: false });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'Passwords do not match.', ok: false });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) {
      setPwMsg({ text: error.message, ok: false });
    } else {
      setPwMsg({ text: 'Password updated successfully.', ok: true });
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => { setPwExpanded(false); setPwMsg(null); }, 1500);
    }
  };

  const s = StyleSheet.create({
    root:          { flex: 1, backgroundColor: C.bg },
    header:        {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16,
    },
    backBtn:       {
      width: 42, height: 42, borderRadius: 13,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle:   { fontSize: 20, fontWeight: '700', color: C.text },
    scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 120 },
    sectionTitle:  {
      fontSize: 11, fontWeight: '700', color: C.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginBottom: 8, marginTop: 24,
    },
    card:          {
      backgroundColor: C.surface,
      borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, borderColor: C.border,
    },
    row:           {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    rowLast:       { borderBottomWidth: 0 },
    rowIcon:       { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowLabel:      { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },

    // Expandable form panels
    expandPanel:   {
      paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14,
      gap: 8, borderBottomWidth: 1, borderBottomColor: C.border,
      backgroundColor: C.bg + 'CC',
    },
    expandInput:   {
      backgroundColor: C.surface, borderRadius: 10, padding: 12,
      color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border,
    },
    expandBtn:     { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    expandBtnTxt:  { fontSize: 14, fontWeight: '700', color: '#fff' },
    msgRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.bg, borderRadius: 10, padding: 10 },
    msgTxt:        { flex: 1, fontSize: 13, lineHeight: 18 },

    signOutBtn:    {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      marginTop: 24,
      backgroundColor: C.surface,
      borderRadius: 20, borderWidth: 1, borderColor: C.error + '40',
      padding: 18,
    },
    signOutBtnDisabled: { opacity: 0.5 },
    signOutTxt:    { fontSize: 15, fontWeight: '600', color: C.error },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name={'arrow-back' as any} size={22} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 42 }} />
      </View>

      <Animated.ScrollView
        style={[{opacity: fade}, { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* APPEARANCE */}
        <Text style={s.sectionTitle}>APPEARANCE</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.rowIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name={'moon-outline' as any} size={19} color={C.primary} />
            </View>
            <Text style={s.rowLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: C.border, true: C.primary + '80' }}
              thumbColor={C.primary}
            />
          </View>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={s.sectionTitle}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.rowIcon, { backgroundColor: C.success + '20' }]}>
              <Ionicons name={'notifications' as any} size={19} color={C.success} />
            </View>
            <Text style={s.rowLabel}>Push Notifications</Text>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: C.border, true: C.success + '80' }}
              thumbColor={pushNotifs ? C.success : C.textMuted}
            />
          </View>
        </View>

        {/* ACCOUNT */}
        <Text style={s.sectionTitle}>ACCOUNT</Text>
        <View style={s.card}>
          {/* Change Email */}
          <TouchableOpacity
            style={s.row}
            onPress={() => { setEmailExpanded(!emailExpanded); setEmailMsg(null); }}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name={'mail-outline' as any} size={19} color={C.primary} />
            </View>
            <Text style={s.rowLabel}>Change Email</Text>
            <Ionicons name={(emailExpanded ? 'chevron-up' : 'chevron-forward') as any} size={16} color={C.textMuted} />
          </TouchableOpacity>
          {emailExpanded && (
            <View style={s.expandPanel}>
              <TextInput
                style={s.expandInput}
                placeholder="New email address"
                placeholderTextColor={C.textMuted}
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              {emailMsg && (
                <View style={s.msgRow}>
                  <Ionicons
                    name={(emailMsg.ok ? 'checkmark-circle-outline' : 'alert-circle-outline') as any}
                    size={16}
                    color={emailMsg.ok ? C.success : C.error}
                  />
                  <Text style={[s.msgTxt, { color: emailMsg.ok ? C.success : C.error }]}>{emailMsg.text}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.expandBtn, emailLoading && { opacity: 0.6 }]}
                onPress={changeEmail}
                disabled={emailLoading}
                activeOpacity={0.85}
              >
                {emailLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.expandBtnTxt}>Send Confirmation</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Change Password */}
          <TouchableOpacity
            style={s.row}
            onPress={() => { setPwExpanded(!pwExpanded); setPwMsg(null); }}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name={'lock-closed' as any} size={19} color={C.primary} />
            </View>
            <Text style={s.rowLabel}>Change Password</Text>
            <Ionicons name={(pwExpanded ? 'chevron-up' : 'chevron-forward') as any} size={16} color={C.textMuted} />
          </TouchableOpacity>
          {pwExpanded && (
            <View style={s.expandPanel}>
              <TextInput
                style={s.expandInput}
                placeholder="New password (min 8 characters)"
                placeholderTextColor={C.textMuted}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={s.expandInput}
                placeholder="Confirm new password"
                placeholderTextColor={C.textMuted}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
                autoCapitalize="none"
              />
              {pwMsg && (
                <View style={s.msgRow}>
                  <Ionicons
                    name={(pwMsg.ok ? 'checkmark-circle-outline' : 'alert-circle-outline') as any}
                    size={16}
                    color={pwMsg.ok ? C.success : C.error}
                  />
                  <Text style={[s.msgTxt, { color: pwMsg.ok ? C.success : C.error }]}>{pwMsg.text}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.expandBtn, pwLoading && { opacity: 0.6 }]}
                onPress={changePassword}
                disabled={pwLoading}
                activeOpacity={0.85}
              >
                {pwLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.expandBtnTxt}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Delete Account */}
          <TouchableOpacity
            style={[s.row, s.rowLast]}
            onPress={() => navigation.navigate('DeleteAccount')}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: C.error + '20' }]}>
              <Ionicons name={'trash-outline' as any} size={19} color={C.error} />
            </View>
            <Text style={[s.rowLabel, { color: C.error }]}>Delete Account</Text>
            <Ionicons name={'chevron-forward' as any} size={16} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* SUPPORT */}
        <Text style={s.sectionTitle}>SUPPORT</Text>
        <View style={s.card}>
          {[
            { label: 'FAQ',           icon: 'help-circle-outline', screen: 'FAQ'       },
            { label: 'Tutorial',      icon: 'play-circle-outline',  screen: 'Tutorial'  },
            { label: "What's New",    icon: 'sparkles-outline',     screen: 'WhatsNew'  },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.screen}
              style={[s.row, i === arr.length - 1 && s.rowLast]}
              onPress={() => navigation.navigate(item.screen as any)}
              activeOpacity={0.75}
            >
              <View style={[s.rowIcon, { backgroundColor: C.primaryLight }]}>
                <Ionicons name={item.icon as any} size={19} color={C.primary} />
              </View>
              <Text style={s.rowLabel}>{item.label}</Text>
              <Ionicons name={'chevron-forward' as any} size={16} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={[s.signOutBtn, signingOut && s.signOutBtnDisabled]}
          onPress={signOut}
          disabled={signingOut}
          activeOpacity={0.75}
        >
          {signingOut
            ? <ActivityIndicator size="small" color={C.error} />
            : (
              <>
                <Ionicons name={'log-out-outline' as any} size={20} color={C.error} />
                <Text style={s.signOutTxt}>Sign Out</Text>
              </>
            )
          }
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}
