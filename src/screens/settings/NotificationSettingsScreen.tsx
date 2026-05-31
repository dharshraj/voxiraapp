import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const TIMES = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','12:00 PM','5:00 PM','7:00 PM','9:00 PM'];

export default function NotificationSettingsScreen({ navigation }:any) {
  const [master,      setMaster]      = useState(true);
  const [dailyRemind, setDailyRemind] = useState(true);
  const [streakAlert, setStreakAlert] = useState(true);
  const [scoreUpdate, setScoreUpdate] = useState(true);
  const [tips,        setTips]        = useState(true);
  const [achievements,setAchievements]= useState(true);
  const [weeklySummary,setWeeklySummary]=useState(false);
  const [remindTime,  setRemindTime]  = useState('9:00 AM');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const save = () => Alert.alert('Saved ✓','Notification preferences updated.');

  const NOTIF_TYPES = [
    { label:'Daily Practice Reminder', icon:'alarm-outline',          color:C.primary,  value:dailyRemind,   onToggle:setDailyRemind,  desc:'Remind me to practice daily'                  },
    { label:'Streak Alerts',           icon:'flame-outline',          color:'#EF4444',   value:streakAlert,   onToggle:setStreakAlert,   desc:'Alert when streak is at risk'                  },
    { label:'Score Updates',           icon:'trending-up-outline',    color:C.green,    value:scoreUpdate,   onToggle:setScoreUpdate,   desc:'When my score improves significantly'          },
    { label:'Daily Tips',              icon:'bulb-outline',           color:C.gold,     value:tips,          onToggle:setTips,          desc:'A new communication tip each morning'          },
    { label:'Achievement Unlocked',    icon:'trophy-outline',         color:C.gold,     value:achievements,  onToggle:setAchievements,  desc:'When I unlock a new achievement'               },
    { label:'Weekly Progress Summary', icon:'bar-chart-outline',      color:C.purple,   value:weeklySummary, onToggle:setWeeklySummary, desc:'Weekly summary of my progress'                 },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={save}>
            <Text style={s.saveBtn}>Save</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)] contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Master toggle */}
        <View style={s.masterCard}>
          <LinearGradient colors={master?['rgba(21,101,255,0.20)','rgba(21,101,255,0.05)']:['rgba(255,255,255,0.04)','rgba(255,255,255,0.02)']}
            style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
          <View style={s.masterLeft}>
            <View style={[s.masterIcon,{backgroundColor:master?'rgba(21,101,255,0.20)':'rgba(255,255,255,0.08)'}]}>
              <Ionicons name="notifications" size={24} color={master?C.primary:C.muted}/>
            </View>
            <View>
              <Text style={s.masterTitle}>All Notifications</Text>
              <Text style={s.masterSub}>{master?'Notifications are on':'All notifications muted'}</Text>
            </View>
          </View>
          <Switch
            value={master} onValueChange={setMaster}
            trackColor={{false:C.border,true:`${C.primary}80`}}
            thumbColor={master?C.primary:C.surface}
          />
        </View>

        {/* Notification types */}
        <Text style={s.sectionTitle}>Notification Types</Text>
        <View style={s.card}>
          {NOTIF_TYPES.map((n,i)=>(
            <View key={i} style={[s.row, i===NOTIF_TYPES.length-1&&{borderBottomWidth:0}, !master&&{opacity:0.4}]}>
              <View style={[s.rowIcon,{backgroundColor:`${n.color}18`}]}>
                <Ionicons name={n.icon as any} size={19} color={n.color}/>
              </View>
              <View style={s.rowMeta}>
                <Text style={s.rowLabel}>{n.label}</Text>
                <Text style={s.rowDesc}>{n.desc}</Text>
              </View>
              <Switch
                value={master && n.value}
                onValueChange={master?n.onToggle:undefined}
                trackColor={{false:C.border,true:`${C.primary}80`}}
                thumbColor={(master&&n.value)?C.primary:C.surface}
                disabled={!master}
              />
            </View>
          ))}
        </View>

        {/* Reminder time */}
        <Text style={s.sectionTitle}>Reminder Time</Text>
        <View style={[s.card,{padding:16}]}>
          <Text style={s.timeDesc}>Choose when you'd like your daily practice reminder</Text>
          <View style={s.timeGrid}>
            {TIMES.map(t=>(
              <TouchableOpacity key={t} style={[s.timeChip, remindTime===t&&s.timeChipActive, !master&&{opacity:0.4}]}
                onPress={()=>master&&setRemindTime(t)}>
                <Text style={[s.timeChipTxt, remindTime===t&&s.timeChipTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info box */}
        <View style={s.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={C.accent}/>
          <Text style={s.infoTxt}>
            Make sure notifications are allowed for Voxira in your phone's system settings for these to work.
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity style={s.saveFullBtn} onPress={save} activeOpacity={0.85}>
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.saveBtnGrad}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff"/>
            <Text style={s.saveBtnTxt}>Save Preferences</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:12},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  saveBtn:       {fontSize:15,fontWeight:'600',color:C.primary},
  scroll:        {paddingHorizontal:20,paddingTop:16},
  masterCard:    {borderRadius:18,padding:16,borderWidth:1,borderColor:C.border,overflow:'hidden',flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8},
  masterLeft:    {flexDirection:'row',alignItems:'center',gap:14},
  masterIcon:    {width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center'},
  masterTitle:   {fontSize:15,fontWeight:'700',color:C.text,marginBottom:2},
  masterSub:     {fontSize:12,color:C.muted},
  sectionTitle:  {fontSize:12,fontWeight:'700',color:C.hint,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,marginTop:20},
  card:          {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border},
  row:           {flexDirection:'row',alignItems:'center',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border},
  rowIcon:       {width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center'},
  rowMeta:       {flex:1},
  rowLabel:      {fontSize:13,fontWeight:'600',color:C.text,marginBottom:2},
  rowDesc:       {fontSize:11,color:C.muted},
  timeDesc:      {fontSize:13,color:C.muted,marginBottom:14},
  timeGrid:      {flexDirection:'row',flexWrap:'wrap',gap:8},
  timeChip:      {paddingHorizontal:14,paddingVertical:8,borderRadius:12,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  timeChipActive:{backgroundColor:C.primary,borderColor:C.primary},
  timeChipTxt:   {fontSize:13,color:C.muted,fontWeight:'500'},
  timeChipTxtActive:{color:'#fff'},
  infoBox:       {flexDirection:'row',gap:10,backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:'rgba(79,195,247,0.20)',marginTop:16,alignItems:'flex-start'},
  infoTxt:       {flex:1,fontSize:13,color:C.muted,lineHeight:20},
  saveFullBtn:   {borderRadius:16,overflow:'hidden',marginTop:20},
  saveBtnGrad:   {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  saveBtnTxt:    {fontSize:16,fontWeight:'700',color:'#fff'},
});

