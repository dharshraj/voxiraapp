import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

export default function SettingsScreen({ navigation }: any) {
  const { colors: C, isDark, toggle } = useTheme();
  const [pushNotifs,  setPushNotifs]  = useState(true);
  const [signingOut,  setSigningOut]  = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('Sign out failed', error.message);
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Something went wrong.');
    } finally {
      setSigningOut(false);
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
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
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
        style={[{opacity: fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
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
          <TouchableOpacity
            style={s.row}
            onPress={() => Alert.alert('Coming soon', 'This feature is coming soon.')}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name={'mail-outline' as any} size={19} color={C.primary} />
            </View>
            <Text style={s.rowLabel}>Change Email</Text>
            <Ionicons name={'chevron-forward' as any} size={16} color={C.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.row}
            onPress={() => Alert.alert('Coming soon', 'This feature is coming soon.')}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name={'lock-closed' as any} size={19} color={C.primary} />
            </View>
            <Text style={s.rowLabel}>Change Password</Text>
            <Ionicons name={'chevron-forward' as any} size={16} color={C.textMuted} />
          </TouchableOpacity>

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
