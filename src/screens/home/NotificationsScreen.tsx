import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeContext';

type NotifType = 'achievement' | 'reminder' | 'score' | 'streak';

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  icon: string;
  color: string;
  created_at: string;
};

const FILTERS = ['All', 'Unread', 'Achievements', 'Scores', 'Reminders'];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  if (hrs < 48)  return 'Yesterday';
  return `${Math.floor(hrs / 24)} days ago`;
}

function NotifCard({ notif, onRead, onDelete }: {
  notif: Notif;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { colors: C } = useTheme();
  const ns = StyleSheet.create({
    card:      { flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:C.surface, borderRadius:16, padding:14, marginBottom:8, borderWidth:1, borderColor:C.border, position:'relative' },
    cardUnread:{ borderColor:C.primary + '40', backgroundColor:C.primary + '0A' },
    dot:       { position:'absolute', top:16, left:16, width:8, height:8, borderRadius:4, backgroundColor:C.primary, zIndex:1 },
    icon:      { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:8 },
    body:      { flex:1 },
    title:     { fontSize:13, fontWeight:'700', color:C.text, marginBottom:4 },
    bodyTxt:   { fontSize:12, color:C.textMuted, lineHeight:18, marginBottom:6 },
    time:      { fontSize:11, color:C.textMuted },
  });
  return (
    <TouchableOpacity
      style={[ns.card, !notif.read && ns.cardUnread]}
      onPress={() => onRead(notif.id)}
      activeOpacity={0.85}
    >
      {!notif.read && <View style={ns.dot} />}
      <View style={[ns.icon, { backgroundColor: `${notif.color}18` }]}>
        <Ionicons name={notif.icon as any} size={22} color={notif.color} />
      </View>
      <View style={ns.body}>
        <Text style={ns.title}>{notif.title}</Text>
        <Text style={ns.bodyTxt} numberOfLines={2}>{notif.body}</Text>
        <Text style={ns.time}>{timeAgo(notif.created_at)}</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(notif.id)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <Ionicons name="close" size={16} color={C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId = useAuthStore(s => s.user?.id);
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadNotifs = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setNotifs(data as Notif[]);
    } else if (error) {
      // Table may not exist yet — show empty state, not error
      console.log('[NotificationsScreen] fetch error (table may not exist):', error.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
    loadNotifs();
  }, [loadNotifs]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (filter === 'All')          return true;
    if (filter === 'Unread')       return !n.read;
    if (filter === 'Achievements') return n.type === 'achievement';
    if (filter === 'Scores')       return n.type === 'score';
    if (filter === 'Reminders')    return n.type === 'reminder';
    return true;
  });

  const markAllRead = async () => {
    setNotifs(p => p.map(n => ({ ...n, read: true })));
    if (userId) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    }
  };

  const markRead = async (id: string) => {
    setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const deleteNotif = async (id: string) => {
    setNotifs(p => p.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const clearAll = () =>
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        setNotifs([]);
        if (userId) {
          await supabase.from('notifications').delete().eq('user_id', userId);
        }
      }},
    ]);

  const s = StyleSheet.create({
    root:         { flex:1, backgroundColor:C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    headerBg:     { backgroundColor:C.surface, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
    header:       { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, marginBottom:14, gap:10 },
    backBtn:      { width:42, height:42, borderRadius:13, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    headerCenter: { flex:1, flexDirection:'row', alignItems:'center', gap:8 },
    headerTitle:  { fontSize:17, fontWeight:'700', color:C.text },
    badge:        { backgroundColor:C.primary, borderRadius:12, paddingHorizontal:8, paddingVertical:2 },
    badgeTxt:     { fontSize:11, color:'#fff', fontWeight:'600' },
    action:       { fontSize:13, color:C.primary, fontWeight:'500' },
    filterRow:    { paddingHorizontal:20, gap:8 },
    chip:         { paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
    chipActive:   { backgroundColor:C.primaryLight, borderColor:C.primary },
    chipTxt:      { fontSize:12, color:C.textMuted, fontWeight:'500' },
    chipTxtActive:{ color:C.primary, fontWeight:'700' },
    scroll:       { paddingHorizontal:20, paddingTop:16 },
    groupLbl:     { fontSize:11, fontWeight:'700', color:C.textMuted, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:8 },
    empty:        { alignItems:'center', paddingTop:80, gap:12 },
    emptyIcon:    { width:72, height:72, borderRadius:20, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    emptyTitle:   { fontSize:16, fontWeight:'700', color:C.text },
    emptySub:     { fontSize:13, color:C.textMuted, textAlign:'center', paddingHorizontal:20 },
    center:       { flex:1, alignItems:'center', justifyContent:'center', paddingTop:60 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.textMuted} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{unreadCount} new</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={unreadCount > 0 ? markAllRead : clearAll}>
            <Text style={s.action}>{unreadCount > 0 ? 'Mark all read' : 'Clear all'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, filter===f && s.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.chipTxt, filter===f && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <Animated.ScrollView
          style={[{ opacity:fadeAnim }, { flex: 1 }]}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={44} color={C.textMuted} />
              </View>
              <Text style={s.emptyTitle}>No notifications</Text>
              <Text style={s.emptySub}>
                {notifs.length === 0
                  ? 'Complete a speech session to see activity here.'
                  : "You're all caught up!"}
              </Text>
            </View>
          ) : (
            <>
              {filtered.some(n => !n.read) && (
                <>
                  <Text style={s.groupLbl}>NEW</Text>
                  {filtered.filter(n => !n.read).map(n => (
                    <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
                  ))}
                </>
              )}
              {filtered.some(n => n.read) && (
                <>
                  <Text style={s.groupLbl}>EARLIER</Text>
                  {filtered.filter(n => n.read).map(n => (
                    <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
                  ))}
                </>
              )}
            </>
          )}
          <View style={{ height:40 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}
