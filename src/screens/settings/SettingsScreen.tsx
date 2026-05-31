import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const C = {
  bg:          '#05050F',
  purple:      '#8B5CF6',
  purpleSoft:  'rgba(139,92,246,0.12)',
  cyan:        '#06B6D4',
  cyanSoft:    'rgba(6,182,212,0.12)',
  amber:       '#F59E0B',
  amberSoft:   'rgba(245,158,11,0.12)',
  emerald:     '#10B981',
  emeraldSoft: 'rgba(16,185,129,0.12)',
  rose:        '#F43F5E',
  text:        '#F1F5F9',
  textMuted:   'rgba(241,245,249,0.38)',
  textHint:    'rgba(241,245,249,0.22)',
  textSec:     'rgba(241,245,249,0.65)',
  border:      'rgba(255,255,255,0.07)',
};

export default function SettingsScreen({ navigation }: any) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const signOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
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
        style={{ opacity: fade }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* APPEARANCE */}
        <Text style={s.sectionTitle}>APPEARANCE</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.rowIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
              <Ionicons name={'moon-outline' as any} size={19} color={C.textMuted} />
            </View>
            <Text style={s.rowLabel}>Dark Mode</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: C.border, true: 'rgba(139,92,246,0.50)' }}
              thumbColor={C.purple}
            />
          </View>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={s.sectionTitle}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.rowIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Ionicons name={'notifications' as any} size={19} color={C.emerald} />
            </View>
            <Text style={s.rowLabel}>Push Notifications</Text>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: C.border, true: 'rgba(16,185,129,0.50)' }}
              thumbColor={pushNotifs ? C.emerald : C.bg}
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
            <View style={[s.rowIcon, { backgroundColor: 'rgba(6,182,212,0.12)' }]}>
              <Ionicons name={'mail-outline' as any} size={19} color={C.cyan} />
            </View>
            <Text style={s.rowLabel}>Change Email</Text>
            <Ionicons name={'chevron-forward' as any} size={16} color={C.textHint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.row}
            onPress={() => Alert.alert('Coming soon', 'This feature is coming soon.')}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: 'rgba(6,182,212,0.12)' }]}>
              <Ionicons name={'lock-closed' as any} size={19} color={C.cyan} />
            </View>
            <Text style={s.rowLabel}>Change Password</Text>
            <Ionicons name={'chevron-forward' as any} size={16} color={C.textHint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.row, s.rowLast]}
            onPress={() => navigation.navigate('DeleteAccount')}
            activeOpacity={0.75}
          >
            <View style={[s.rowIcon, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
              <Ionicons name={'trash-outline' as any} size={19} color={C.rose} />
            </View>
            <Text style={[s.rowLabel, { color: C.rose }]}>Delete Account</Text>
            <Ionicons name={'chevron-forward' as any} size={16} color={C.textHint} />
          </TouchableOpacity>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.75}>
          <Ionicons name={'log-out-outline' as any} size={20} color={C.rose} />
          <Text style={s.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  header:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16,
  },
  backBtn:       {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:   { fontSize: 20, fontWeight: '700', color: C.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle:  {
    fontSize: 11, fontWeight: '700', color: C.textHint,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 24,
  },
  card:          {
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    backgroundColor: 'rgba(244,63,94,0.06)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.25)',
    padding: 18,
  },
  signOutTxt:    { fontSize: 15, fontWeight: '600', color: C.rose },
});
