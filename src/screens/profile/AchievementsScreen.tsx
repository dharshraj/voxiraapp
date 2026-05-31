import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

type Achievement = {
  id:string; title:string; desc:string; icon:string;
  color:string; xp:number; done:boolean; progress?:number; total?:number;
  category:'speech'|'writing'|'interview'|'streak'|'milestone';
};

const ACHIEVEMENTS: Achievement[] = [
  // Speech
  { id:'s1', title:'First Words',         desc:'Complete your first speech session',              icon:'mic',            color:C.accent,  xp:50,  done:true,  category:'speech'    },
  { id:'s2', title:'Smooth Talker',        desc:'Score 90+ in a speech session',                  icon:'star',           color:C.gold,    xp:100, done:true,  category:'speech'    },
  { id:'s3', title:'Filler-Free',          desc:'Complete a session with zero filler words',       icon:'shield-checkmark',color:C.green,  xp:150, done:false, progress:0, total:1,  category:'speech'    },
  { id:'s4', title:'Marathon Speaker',     desc:'Record a speech longer than 10 minutes',         icon:'timer',          color:C.purple,  xp:200, done:false, progress:0, total:1,  category:'speech'    },
  { id:'s5', title:'10 Sessions',          desc:'Complete 10 speech sessions',                    icon:'mic-circle',     color:C.accent,  xp:150, done:true,  category:'speech'    },
  { id:'s6', title:'25 Sessions',          desc:'Complete 25 speech sessions',                    icon:'mic-circle',     color:C.gold,    xp:250, done:false, progress:12, total:25, category:'speech'    },
  // Writing
  { id:'w1', title:'First Draft',          desc:'Submit your first writing session',               icon:'create',         color:C.green,   xp:50,  done:true,  category:'writing'   },
  { id:'w2', title:'Grammar Guru',         desc:'Achieve a grammar score of 95+',                 icon:'checkmark-circle',color:C.green,  xp:100, done:true,  category:'writing'   },
  { id:'w3', title:'Wordsmith',            desc:'Write more than 5000 words total',               icon:'document-text',  color:C.accent,  xp:200, done:false, progress:4200, total:5000, category:'writing' },
  { id:'w4', title:'Template Master',      desc:'Use 5 different writing templates',              icon:'copy',           color:C.purple,  xp:100, done:false, progress:2, total:5, category:'writing'   },
  // Interview
  { id:'i1', title:'First Interview',      desc:'Complete your first mock interview',              icon:'people',         color:C.purple,  xp:50,  done:true,  category:'interview' },
  { id:'i2', title:'Ace It',               desc:'Score 90+ in a mock interview',                  icon:'trophy',         color:C.gold,    xp:200, done:false, progress:82, total:90, category:'interview' },
  { id:'i3', title:'Multi-Role',           desc:'Practice 3 different job roles',                 icon:'briefcase',      color:C.accent,  xp:150, done:true,  category:'interview' },
  { id:'i4', title:'STAR Method Pro',      desc:'Complete 10 behavioral interviews',              icon:'git-branch',     color:C.green,   xp:200, done:false, progress:4, total:10, category:'interview' },
  // Streaks
  { id:'st1', title:'3-Day Streak',        desc:'Practice 3 days in a row',                      icon:'flame',          color:C.danger,  xp:75,  done:true,  category:'streak'    },
  { id:'st2', title:'7-Day Streak',        desc:'Practice 7 days in a row',                      icon:'flame',          color:C.danger,  xp:150, done:false, progress:4, total:7,  category:'streak'    },
  { id:'st3', title:'30-Day Streak',       desc:'Practice 30 days in a row',                     icon:'flame',          color:C.gold,    xp:500, done:false, progress:4, total:30, category:'streak'    },
  // Milestones
  { id:'m1', title:'Rising Star',          desc:'Reach an overall score of 75',                   icon:'star-half',      color:C.gold,    xp:100, done:true,  category:'milestone' },
  { id:'m2', title:'Communication Pro',    desc:'Reach an overall score of 85',                   icon:'star',           color:C.gold,    xp:200, done:false, progress:84, total:85, category:'milestone' },
  { id:'m3', title:'Top 10%',             desc:'Rank in the top 10% of all users',               icon:'podium',         color:C.purple,  xp:300, done:false, progress:0, total:1, category:'milestone' },
];

const FILTERS = ['All','Speech','Writing','Interview','Streak','Milestone'];
const FILTER_MAP: Record<string,string> = {
  'Speech':'speech','Writing':'writing','Interview':'interview',
  'Streak':'streak','Milestone':'milestone',
};

export default function AchievementsScreen({ navigation }:any) {
  const [filter, setFilter] = useState('All');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const filtered = ACHIEVEMENTS.filter(a =>
    filter==='All' || a.category===FILTER_MAP[filter]
  );
  const done   = ACHIEVEMENTS.filter(a=>a.done).length;
  const total  = ACHIEVEMENTS.length;
  const totalXP= ACHIEVEMENTS.filter(a=>a.done).reduce((s,a)=>s+a.xp,0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Achievements</Text>
          <View style={{width:42}}/>
        </View>

        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <LinearGradient colors={['rgba(245,158,11,0.20)','rgba(245,158,11,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <Ionicons name="trophy" size={28} color={C.gold}/>
            <Text style={s.summaryNum}>{done}/{total}</Text>
            <Text style={s.summaryLbl}>Unlocked</Text>
          </View>
          <View style={s.summaryCard}>
            <LinearGradient colors={['rgba(21,101,255,0.20)','rgba(21,101,255,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <Ionicons name="star" size={28} color={C.accent}/>
            <Text style={s.summaryNum}>{totalXP}</Text>
            <Text style={s.summaryLbl}>XP Earned</Text>
          </View>
          <View style={s.summaryCard}>
            <LinearGradient colors={['rgba(34,197,94,0.20)','rgba(34,197,94,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <Ionicons name="trending-up" size={28} color={C.green}/>
            <Text style={s.summaryNum}>{Math.round((done/total)*100)}%</Text>
            <Text style={s.summaryLbl}>Complete</Text>
          </View>
        </View>

        {/* Overall progress bar */}
        <View style={s.overallBar}>
          <View style={s.overallBarBg}>
            <LinearGradient colors={[C.gold,'#D97706']} start={{x:0,y:0}} end={{x:1,y:0}}
              style={[s.overallBarFill,{width:`${(done/total)*100}%` as any}]}/>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} style={[s.chip, filter===f&&s.chipActive]} onPress={()=>setFilter(f)}>
              <Text style={[s.chipTxt, filter===f&&s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)] contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Done */}
        {filtered.some(a=>a.done) && (
          <>
            <Text style={s.groupLbl}>UNLOCKED ✓</Text>
            <View style={s.achGrid}>
              {filtered.filter(a=>a.done).map(a=>(
                <AchCard key={a.id} a={a}/>
              ))}
            </View>
          </>
        )}

        {/* Locked */}
        {filtered.some(a=>!a.done) && (
          <>
            <Text style={s.groupLbl}>IN PROGRESS</Text>
            <View style={s.achGrid}>
              {filtered.filter(a=>!a.done).map(a=>(
                <AchCard key={a.id} a={a}/>
              ))}
            </View>
          </>
        )}

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

function AchCard({ a }:{ a:Achievement }) {
  const hasProgress = a.progress !== undefined && a.total !== undefined;
  const pct = hasProgress ? Math.round((a.progress!/a.total!)*100) : 0;

  return (
    <View style={[ac.card, !a.done && ac.cardLocked]}>
      <View style={[ac.iconWrap,{backgroundColor: a.done ? `${a.color}22` : 'rgba(255,255,255,0.06)'}]}>
        <Ionicons name={a.icon as any} size={28} color={a.done ? a.color : C.hint}/>
        {a.done && <View style={ac.doneCheck}><Ionicons name="checkmark" size={10} color="#fff"/></View>}
      </View>
      <Text style={[ac.title, !a.done && ac.titleLocked]}>{a.title}</Text>
      <Text style={ac.desc} numberOfLines={2}>{a.desc}</Text>
      {hasProgress && !a.done && (
        <>
          <View style={ac.progBg}>
            <View style={[ac.progFill,{width:`${pct}%` as any,backgroundColor:a.color}]}/>
          </View>
          <Text style={ac.progTxt}>{a.progress}/{a.total}</Text>
        </>
      )}
      <View style={[ac.xpBadge,{backgroundColor: a.done ? `${C.gold}20` : 'rgba(255,255,255,0.05)'}]}>
        <Ionicons name="star" size={11} color={a.done ? C.gold : C.hint}/>
        <Text style={[ac.xpTxt,{color: a.done ? C.gold : C.hint}]}>{a.xp} XP</Text>
      </View>
    </View>
  );
}

const CARD_W = (W-52)/2;
const ac = StyleSheet.create({
  card:       {width:CARD_W,backgroundColor:C.bgCard,borderRadius:18,padding:14,borderWidth:1,borderColor:C.border,gap:8,alignItems:'center'},
  cardLocked: {opacity:0.65},
  iconWrap:   {width:60,height:60,borderRadius:18,alignItems:'center',justifyContent:'center',position:'relative'},
  doneCheck:  {position:'absolute',bottom:-2,right:-2,width:18,height:18,borderRadius:9,backgroundColor:C.green,borderWidth:1.5,borderColor:C.bgCard,alignItems:'center',justifyContent:'center'},
  title:      {fontSize:13,fontWeight:'700',color:C.text,textAlign:'center'},
  titleLocked:{color:C.muted},
  desc:       {fontSize:11,color:C.hint,textAlign:'center',lineHeight:16},
  progBg:     {width:'100%',height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  progFill:   {height:'100%',borderRadius:2},
  progTxt:    {fontSize:10,color:C.hint},
  xpBadge:   {flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  xpTxt:      {fontSize:11,fontWeight:'600'},
});

const s = StyleSheet.create({
  root:        {flex:1,backgroundColor:C.bg},
  headerBg:    {paddingBottom:12},
  header:      {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:     {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle: {fontSize:17,fontWeight:'700',color:C.text},
  summaryRow:  {flexDirection:'row',gap:10,paddingHorizontal:20,marginBottom:12},
  summaryCard: {flex:1,borderRadius:18,padding:12,borderWidth:1,borderColor:C.border,overflow:'hidden',alignItems:'center',gap:4},
  summaryNum:  {fontSize:20,fontWeight:'800',color:C.text},
  summaryLbl:  {fontSize:10,color:C.muted},
  overallBar:  {paddingHorizontal:20,marginBottom:14},
  overallBarBg:{height:6,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'},
  overallBarFill:{height:'100%',borderRadius:3},
  filterRow:   {paddingHorizontal:20,gap:8,paddingBottom:4},
  chip:        {paddingHorizontal:14,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  chipActive:  {backgroundColor:C.primary,borderColor:C.primary},
  chipTxt:     {fontSize:12,color:C.muted,fontWeight:'500'},
  chipTxtActive:{color:'#fff'},
  scroll:      {paddingHorizontal:20,paddingTop:16},
  groupLbl:    {fontSize:11,fontWeight:'700',color:C.hint,letterSpacing:1,textTransform:'uppercase',marginBottom:12,marginTop:8},
  achGrid:     {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:8},
});

