/**
 * PermissionsScreen — calls real Expo permissions APIs.
 * Mic: expo-av Audio.requestPermissionsAsync()
 * Notifications: expo-notifications requestPermissionsAsync()
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../theme/ThemeContext';

// expo-av Audio for mic permission
let Audio: any = null;
try { Audio = require('expo-av').Audio; } catch {}

type PermState = 'unknown' | 'granted' | 'denied';

export default function PermissionsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [mic,   setMic]   = useState<PermState>('unknown');
  const [notif, setNotif] = useState<PermState>('unknown');

  useEffect(() => {
    // Check current status without prompting
    (async () => {
      if (Audio) {
        const { status } = await Audio.getPermissionsAsync();
        if (status === 'granted') setMic('granted');
      }
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') setNotif('granted');
      } else {
        setNotif('granted'); // web doesn't need push permissions for in-app notifs
      }
    })();
  }, []);

  const requestMic = async () => {
    if (!Audio) { setMic('denied'); return; }
    const { status } = await Audio.requestPermissionsAsync();
    setMic(status === 'granted' ? 'granted' : 'denied');
  };

  const requestNotif = async () => {
    if (Platform.OS === 'web') { setNotif('granted'); return; }
    const { status } = await Notifications.requestPermissionsAsync();
    setNotif(status === 'granted' ? 'granted' : 'denied');
  };

  const canContinue = mic === 'granted';

  const PERMS = [
    {
      key: 'mic',
      icon: 'mic-outline',
      label: 'Microphone',
      sub: 'Required to record and analyse your speech sessions.',
      required: true,
      state: mic,
      onRequest: requestMic,
    },
    {
      key: 'notif',
      icon: 'notifications-outline',
      label: 'Notifications',
      sub: 'Optional — for daily practice reminders and goal alerts.',
      required: false,
      state: notif,
      onRequest: requestNotif,
    },
  ];

  const s = StyleSheet.create({
    root:      { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
    header:    { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 28 },
    heading:   { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 8 },
    sub:       { fontSize: 14, color: C.textSec, lineHeight: 21 },
    cards:     { gap: 14, marginBottom: 'auto' as any },
    card:      { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
    cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    iconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 15, fontWeight: '700', color: C.text },
    required:  { fontSize: 10, color: C.error, fontWeight: '600', backgroundColor: C.error + '14', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    cardSub:   { fontSize: 13, color: C.textMuted, lineHeight: 19, marginBottom: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusTxt: { fontSize: 13, fontWeight: '600' },
    reqBtn:    { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1 },
    reqBtnTxt: { fontSize: 13, fontWeight: '700' },
    footer:    { paddingBottom: 36, paddingTop: 24, gap: 12 },
    btn:       { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    btnDis:    { opacity: 0.4 },
    btnTxt:    { fontSize: 16, fontWeight: '700', color: '#fff' },
    skip:      { alignItems: 'center' },
    skipTxt:   { fontSize: 14, color: C.textMuted },
  });

  const stateColor = (st: PermState) =>
    st === 'granted' ? C.success : st === 'denied' ? C.error : C.textMuted;
  const stateLabel = (st: PermState) =>
    st === 'granted' ? 'Granted' : st === 'denied' ? 'Denied' : 'Not requested';
  const stateIcon  = (st: PermState): any =>
    st === 'granted' ? 'checkmark-circle' : st === 'denied' ? 'close-circle' : 'ellipse-outline';

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <Text style={s.heading}>Allow Permissions</Text>
        <Text style={s.sub}>Voxira needs microphone access to analyse your speech. Notifications are optional.</Text>
      </View>
      <View style={s.cards}>
        {PERMS.map(p => (
          <View key={p.key} style={s.card}>
            <View style={s.cardTop}>
              <View style={s.iconBox}><Ionicons name={p.icon as any} size={22} color={C.primary} /></View>
              <View>
                <Text style={s.cardLabel}>{p.label}</Text>
                {p.required && <Text style={s.required}>REQUIRED</Text>}
              </View>
            </View>
            <Text style={s.cardSub}>{p.sub}</Text>
            <View style={s.statusRow}>
              <Ionicons name={stateIcon(p.state)} size={16} color={stateColor(p.state)} />
              <Text style={[s.statusTxt, { color: stateColor(p.state), flex: 1 }]}>{stateLabel(p.state)}</Text>
              {p.state !== 'granted' && (
                <TouchableOpacity
                  style={[s.reqBtn, { borderColor: C.primary, backgroundColor: C.primaryLight }]}
                  onPress={p.onRequest} activeOpacity={0.8}
                >
                  <Text style={[s.reqBtnTxt, { color: C.primary }]}>Allow</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btn, !canContinue && s.btnDis]}
          onPress={() => navigation.navigate('Register')}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={s.btnTxt}>Continue</Text>
        </TouchableOpacity>
        {!canContinue && (
          <TouchableOpacity style={s.skip} onPress={() => navigation.navigate('Register')} activeOpacity={0.75}>
            <Text style={s.skipTxt}>Skip (microphone required for speech analysis)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
