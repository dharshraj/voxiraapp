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
  gold:'#F59E0B', purple:'#A855F7', silver:'#94A3B8', bronze:'#CD7C32',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

type User = { rank:number; name:string; score:number; sessions:number; isMe?:boolean };

function initials(name:string){ return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2); }
function avatarColor(rank:number): [string, string] { return rank===1 ? ['#F59E0B','#D97706'] : rank===2 ? ['#94A3B8','#64748B'] : rank===3 ? ['#CD7C32','#92400E'] : ['#1565FF','#0D47A1']; }

const GLOBAL: User[] = [
  { rank:1,  name:'Kavitha R',       score:94, sessions:71 },
  { rank:2,  name:'Deepak M',        score:91, sessions:63 },
  { rank:3,  name:'Sneha P',         score:89, sessions:58 },
  { rank:4,  name:'Arun K',          score:87, sessions:52 },
  { rank:5,  name:'Meera S',         score:86, sessions:49 },
  { rank:6,  name:'Rahul J',         score:84, sessions:46 },
  { rank:7,  name:'You',             score:82, sessions:42, isMe:true },
  { rank:8,  name:'Preethi V',       score:81, sessions:40 },
  { rank:9,  name:'Karthik N',       score:79, sessions:38 },
  { rank:10, name:'Divya L',         score:78, sessions:35 },
  { rank:11, name:'Suresh B',        score:76, sessions:33 },
  { rank:12, name:'Anjali T',        score:74, sessions:30 },
];

const WEEKLY: User[] = [
  { rank:1,  name:'Deepak M',        score:93, sessions:9 },
  { rank:2,  name:'You',             score:89, sessions:8, isMe:true },
  { rank:3,  name:'Kavitha R',       score:87, sessions:7 },
  { rank:4,  name:'Sneha P',         score:85, sessions:7 },
  { rank:5,  name:'Meera S',         score:83, sessions:6 },
  { rank:6,  name:'Arun K',          score:80, sessions:5 },
  { rank:7,  name:'Rahul J',         score:78, sessions:5 },
  { rank:8,  name:'Karthik N',       score:76, sessions:4 },
  { rank:9,  name:'Preethi V',       score:74, sessions:4 },
  { rank:10, name:'Divya L',         score:71, sessions:3 },
];

export default function LeaderboardScreen({ navigation }:any) {
  const [period, setPeriod] = useState<'global'|'weekly'>('global');
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(()=>{ Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start(); },[]);

  const users   = period==='global' ? GLOBAL : WEEKLY;
  const myEntry = users.find(u=>u.isMe);
  const top3    = users.slice(0,3);
  const rest    = users.slice(3);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Leaderboard</Text>
          <View style={{width:42}}/>
        </View>

        <View style={s.toggleRow}>
          {(['global','weekly'] as const).map(p=>(
            <TouchableOpacity key={p} style={[s.toggleBtn,period===p&&s.toggleBtnActive]} onPress={()=>setPeriod(p)}>
              <Ionicons name={p==='global'?'globe-outline':'calendar-outline'} size={15} color={period===p?'#fff':C.muted}/>
              <Text style={[s.toggleTxt,period===p&&s.toggleTxtActive]}>{p==='global'?'All Time':'This Week'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {myEntry && (
          <View style={s.myRankCard}>
            <LinearGradient colors={['rgba(21,101,255,0.25)','rgba(21,101,255,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:16}]}/>
            <View style={s.myRankItem}><Text style={s.myRankPos}>#{myEntry.rank}</Text><Text style={s.myRankLbl}>Your Rank</Text></View>
            <View style={s.myRankItem}><Text style={s.myRankScore}>{myEntry.score}</Text><Text style={s.myRankLbl}>Score</Text></View>
            <View style={s.myRankItem}><Text style={s.myRankScore}>{myEntry.sessions}</Text><Text style={s.myRankLbl}>Sessions</Text></View>
          </View>
        )}
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        {...(Platform.OS==='web'?{style:{opacity:1,overflowY:'auto'} as any}:{})}
      >
        {/* Podium */}
        <View style={s.podium}>
          {/* 2nd place */}
          <View style={s.podiumItem}>
            <LinearGradient colors={avatarColor(2)} style={s.podiumAvatar}><Text style={s.podiumAvatarTxt}>{initials(top3[1].name)}</Text></LinearGradient>
            <Text style={s.podiumName} numberOfLines={1}>{top3[1].name}</Text>
            <Text style={[s.podiumScore,{color:C.silver}]}>{top3[1].score}</Text>
            <View style={[s.podiumPedestal,{height:55,backgroundColor:'rgba(148,163,184,0.12)'}]}><Text style={s.podiumMedal}>🥈</Text></View>
          </View>
          {/* 1st place */}
          <View style={[s.podiumItem,{marginTop:-20}]}>
            <Text style={{fontSize:18,marginBottom:4}}>👑</Text>
            <LinearGradient colors={avatarColor(1)} style={[s.podiumAvatar,{width:68,height:68,borderRadius:20}]}><Text style={[s.podiumAvatarTxt,{fontSize:24}]}>{initials(top3[0].name)}</Text></LinearGradient>
            <Text style={s.podiumName} numberOfLines={1}>{top3[0].name}</Text>
            <Text style={[s.podiumScore,{color:C.gold,fontSize:18}]}>{top3[0].score}</Text>
            <View style={[s.podiumPedestal,{height:72,backgroundColor:'rgba(245,158,11,0.12)'}]}><Text style={s.podiumMedal}>🏆</Text></View>
          </View>
          {/* 3rd place */}
          <View style={s.podiumItem}>
            <LinearGradient colors={avatarColor(3)} style={s.podiumAvatar}><Text style={s.podiumAvatarTxt}>{initials(top3[2].name)}</Text></LinearGradient>
            <Text style={s.podiumName} numberOfLines={1}>{top3[2].name}</Text>
            <Text style={[s.podiumScore,{color:C.bronze}]}>{top3[2].score}</Text>
            <View style={[s.podiumPedestal,{height:40,backgroundColor:'rgba(205,124,50,0.12)'}]}><Text style={s.podiumMedal}>🥉</Text></View>
          </View>
        </View>

        {/* Rest */}
        <View style={s.listCard}>
          {rest.map((u,i)=>(
            <View key={u.rank} style={[s.listRow,u.isMe&&s.listRowMe,i===rest.length-1&&{borderBottomWidth:0}]}>
              <Text style={[s.listRank,u.isMe&&{color:C.primary}]}>#{u.rank}</Text>
              <LinearGradient colors={u.isMe?['#1565FF','#0D47A1']:['#1A2B3C','#111E30']} style={s.listAvatar}>
                <Text style={s.listAvatarTxt}>{initials(u.name)}</Text>
              </LinearGradient>
              <View style={s.listMeta}>
                <Text style={[s.listName,u.isMe&&{color:C.accent,fontWeight:'700'}]}>{u.name}{u.isMe?' (You)':''}</Text>
                <Text style={s.listSessions}>{u.sessions} sessions</Text>
              </View>
              <Text style={[s.listScore,u.isMe&&{color:C.primary}]}>{u.score}</Text>
            </View>
          ))}
        </View>
        <View style={{height:80}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  headerBg:{paddingBottom:16},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:{width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.text},
  toggleRow:{flexDirection:'row',marginHorizontal:20,backgroundColor:C.surface,borderRadius:14,padding:4,gap:4,marginBottom:14},
  toggleBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:9,borderRadius:10},
  toggleBtnActive:{backgroundColor:C.primary},
  toggleTxt:{fontSize:13,color:C.muted,fontWeight:'500'},
  toggleTxtActive:{color:'#fff',fontWeight:'600'},
  myRankCard:{marginHorizontal:20,borderRadius:16,padding:14,borderWidth:1,borderColor:'rgba(21,101,255,0.25)',overflow:'hidden',flexDirection:'row',justifyContent:'space-around'},
  myRankItem:{alignItems:'center'},
  myRankPos:{fontSize:22,fontWeight:'800',color:C.primary},
  myRankLbl:{fontSize:11,color:C.muted,marginTop:2},
  myRankScore:{fontSize:20,fontWeight:'800',color:C.text},
  scroll:{paddingHorizontal:20,paddingTop:20},
  podium:{flexDirection:'row',justifyContent:'center',alignItems:'flex-end',marginBottom:20,gap:8},
  podiumItem:{alignItems:'center',flex:1,gap:5},
  podiumAvatar:{width:52,height:52,borderRadius:16,alignItems:'center',justifyContent:'center'},
  podiumAvatarTxt:{fontSize:18,fontWeight:'800',color:'#fff'},
  podiumName:{fontSize:12,fontWeight:'600',color:C.text,textAlign:'center'},
  podiumScore:{fontSize:15,fontWeight:'800'},
  podiumPedestal:{width:'100%',borderRadius:10,alignItems:'center',justifyContent:'flex-end',paddingBottom:6},
  podiumMedal:{fontSize:18},
  listCard:{backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border},
  listRow:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border},
  listRowMe:{backgroundColor:'rgba(21,101,255,0.08)'},
  listRank:{fontSize:13,fontWeight:'700',color:C.muted,width:28,textAlign:'center'},
  listAvatar:{width:36,height:36,borderRadius:11,alignItems:'center',justifyContent:'center'},
  listAvatarTxt:{fontSize:12,fontWeight:'700',color:'#fff'},
  listMeta:{flex:1},
  listName:{fontSize:13,fontWeight:'600',color:C.text,marginBottom:2},
  listSessions:{fontSize:11,color:C.hint},
  listScore:{fontSize:15,fontWeight:'800',color:C.text},
});
