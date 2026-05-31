import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

type Notif = {
  id:string; type:'achievement'|'reminder'|'tip'|'score'|'streak';
  title:string; body:string; time:string; read:boolean;
  icon:string; color:string;
};

const INITIAL_NOTIFS: Notif[] = [
  { id:'1', type:'achievement', title:'New Achievement Unlocked! 🏆', body:"You've completed 10 speech sessions!", time:'2 min ago', read:false, icon:'trophy', color:C.gold },
  { id:'2', type:'score', title:'Speech Score Improved 📈', body:'Your clarity score jumped from 74 to 87.', time:'1 hour ago', read:false, icon:'trending-up', color:C.accent },
  { id:'3', type:'reminder', title:'Daily Goal Reminder ⏰', body:"You have 1 more session to hit today's goal.", time:'3 hours ago', read:false, icon:'notifications', color:C.primary },
  { id:'4', type:'streak', title:'4-Day Streak! 🔥', body:"Amazing! You've practised 4 days in a row.", time:'Yesterday', read:true, icon:'flame', color:C.danger },
  { id:'5', type:'tip', title:"Today's Tip 💡", body:'Replace "I think" with "I believe" to sound confident.', time:'Yesterday', read:true, icon:'bulb', color:C.purple },
  { id:'6', type:'score', title:'Interview Complete ✅', body:'You scored 82/100 on your Software Engineer mock.', time:'2 days ago', read:true, icon:'people', color:C.purple },
  { id:'7', type:'tip', title:'Writing Tip ✍️', body:'Use active voice: "The team finished it" not "It was finished".', time:'2 days ago', read:true, icon:'create', color:C.green },
  { id:'8', type:'reminder', title:'Weekly Summary 📊', body:'6 speech, 4 writing, 2 interviews this week. Top 20%!', time:'3 days ago', read:true, icon:'bar-chart', color:C.accent },
];

const FILTERS = ['All', 'Unread', 'Achievements', 'Reminders', 'Tips'];

function NotifCard({ notif, onRead, onDelete }: {
  notif: Notif;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
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
      <TouchableOpacity
        onPress={() => onDelete(notif.id)}
        hitSlop={{ top:10, bottom:10, left:10, right:10 }}
      >
        <Ionicons name="close" size={16} color={C.hint} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const ns = StyleSheet.create({
  card:       { flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:C.bgCard, borderRadius:16, padding:14, marginBottom:8, borderWidth:1, borderColor:C.border, position:'relative' },
  cardUnread: { borderColor:'rgba(21,101,255,0.25)', backgroundColor:'rgba(21,101,255,0.06)' },
  dot:        { position:'absolute', top:16, left:16, width:8, height:8, borderRadius:4, backgroundColor:C.primary, zIndex:1 },
  icon:       { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:8 },
  body:       { flex:1 },
  title:      { fontSize:13, fontWeight:'700', color:C.text, marginBottom:4 },
  bodyTxt:    { fontSize:12, color:C.muted, lineHeight:18, marginBottom:6 },
  time:       { fontSize:11, color:C.hint },
});

export default function NotificationsScreen({ navigation }: any) {
  const [notifs,  setNotifs]  = useState<Notif[]>(INITIAL_NOTIFS);
  const [filter,  setFilter]  = useState('All');
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

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
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
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fadeAnim}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={44} color={C.muted} />
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

const s = StyleSheet.create({
  root:        { flex:1, backgroundColor:C.bg },
  headerBg:    { paddingBottom:16 },
  header:      { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, marginBottom:14, gap:10 },
  backBtn:     { width:42, height:42, borderRadius:13, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  headerCenter:{ flex:1, flexDirection:'row', alignItems:'center', gap:8 },
  headerTitle: { fontSize:17, fontWeight:'700', color:C.text },
  badge:       { backgroundColor:C.primary, borderRadius:12, paddingHorizontal:8, paddingVertical:2 },
  badgeTxt:    { fontSize:11, color:'#fff', fontWeight:'600' },
  action:      { fontSize:13, color:C.accent, fontWeight:'500' },
  filterRow:   { paddingHorizontal:20, gap:8 },
  chip:        { paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
  chipActive:  { backgroundColor:C.primary, borderColor:C.primary },
  chipTxt:     { fontSize:12, color:C.muted, fontWeight:'500' },
  chipTxtActive:{ color:'#fff' },
  scroll:      { paddingHorizontal:20, paddingTop:16 },
  groupLbl:    { fontSize:11, fontWeight:'700', color:C.hint, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:8 },
  empty:       { alignItems:'center', paddingTop:80, gap:12 },
  emptyIcon:   { width:88, height:88, borderRadius:26, backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  emptyTitle:  { fontSize:18, fontWeight:'700', color:C.text },
  emptySub:    { fontSize:13, color:C.muted },
});
