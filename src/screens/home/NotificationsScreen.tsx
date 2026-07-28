import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

type Notif = {
  id:string; type:'achievement'|'reminder'|'tip'|'score'|'streak';
  title:string; body:string; time:string; read:boolean;
  icon:string; color:string;
};

const INITIAL_NOTIFS: Notif[] = [
  { id:'1', type:'achievement', title:'New Achievement Unlocked!', body:"You've completed 10 speech sessions!", time:'2 min ago',  read:false, icon:'trophy',      color:'#F59E0B' },
  { id:'2', type:'score',       title:'Speech Score Improved',     body:'Your clarity score jumped from 74 to 87.', time:'1 hour ago', read:false, icon:'trending-up', color:'#06B6D4' },
  { id:'3', type:'reminder',    title:'Daily Goal Reminder',       body:"You have 1 more session to hit today's goal.", time:'3 hours ago', read:false, icon:'notifications', color:'#4F6EF7' },
  { id:'4', type:'streak',      title:'4-Day Streak!',             body:"Amazing! You've practised 4 days in a row.", time:'Yesterday',  read:true, icon:'flame',       color:'#EF4444' },
  { id:'5', type:'tip',         title:"Today's Tip",               body:'Replace "I think" with "I believe" to sound confident.', time:'Yesterday', read:true, icon:'bulb', color:'#A855F7' },
  { id:'6', type:'score',       title:'Interview Complete',        body:'You scored 82/100 on your Software Engineer mock.', time:'2 days ago', read:true, icon:'people', color:'#A855F7' },
  { id:'7', type:'tip',         title:'Writing Tip',               body:'Use active voice: "The team finished it" not "It was finished".', time:'2 days ago', read:true, icon:'create', color:'#22C55E' },
  { id:'8', type:'reminder',    title:'Weekly Summary',            body:'6 speech, 4 writing, 2 interviews this week. Top 20%!', time:'3 days ago', read:true, icon:'bar-chart', color:'#06B6D4' },
];

const FILTERS = ['All', 'Unread', 'Achievements', 'Reminders', 'Tips'];

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
        <Text style={ns.time}>{notif.time}</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(notif.id)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <Ionicons name="close" size={16} color={C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [notifs,  setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);
  const [filter,  setFilter] = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (filter === 'All')          return true;
    if (filter === 'Unread')       return !n.read;
    if (filter === 'Achievements') return n.type === 'achievement';
    if (filter === 'Reminders')    return n.type === 'reminder';
    if (filter === 'Tips')         return n.type === 'tip';
    return true;
  });

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read:true })));
  const markRead    = (id: string) => setNotifs(p => p.map(n => n.id===id ? { ...n, read:true } : n));
  const deleteNotif = (id: string) => setNotifs(p => p.filter(n => n.id !== id));
  const clearAll    = () =>
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text:'Cancel', style:'cancel' },
      { text:'Clear',  style:'destructive', onPress: () => setNotifs([]) },
    ]);

  const s = StyleSheet.create({
    root:        { flex:1, backgroundColor:C.bg },
    headerBg:    { backgroundColor:C.surface, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
    header:      { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, marginBottom:14, gap:10 },
    backBtn:     { width:42, height:42, borderRadius:13, backgroundColor:C.bg, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    headerCenter:{ flex:1, flexDirection:'row', alignItems:'center', gap:8 },
    headerTitle: { fontSize:17, fontWeight:'700', color:C.text },
    badge:       { backgroundColor:C.primary, borderRadius:12, paddingHorizontal:8, paddingVertical:2 },
    badgeTxt:    { fontSize:11, color:'#fff', fontWeight:'600' },
    action:      { fontSize:13, color:C.primary, fontWeight:'500' },
    filterRow:   { paddingHorizontal:20, gap:8 },
    chip:        { paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
    chipActive:  { backgroundColor:C.primaryLight, borderColor:C.primary },
    chipTxt:     { fontSize:12, color:C.textMuted, fontWeight:'500' },
    chipTxtActive:{ color:C.primary, fontWeight:'700' },
    scroll:      { paddingHorizontal:20, paddingTop:16 },
    groupLbl:    { fontSize:11, fontWeight:'700', color:C.textMuted, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:8 },
    empty:       { alignItems:'center', paddingTop:80, gap:12 },
    emptyIcon:   { width:72, height:72, borderRadius:20, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    emptyTitle:  { fontSize:16, fontWeight:'700', color:C.text },
    emptySub:    { fontSize:13, color:C.textMuted },
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

      <Animated.ScrollView
        style={[{ flex: 1, opacity: fadeAnim }, Platform.OS === 'web' && ({ overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={44} color={C.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptySub}>You're all caught up!</Text>
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
    </View>
  );
}
