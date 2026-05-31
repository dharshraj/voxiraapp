import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = { bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C', primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E', gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444', text:'#F0F4FF', muted:'rgba(240,244,255,0.50)', hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)' };
const sc=(s:number)=>s>=80?C.green:s>=65?C.accent:s>=50?C.gold:C.danger;

const SESSIONS=[
  {id:'1',role:'Software Engineer',type:'Behavioral',difficulty:'Medium',score:82,date:'Today, 2:30 PM',questions:7,duration:'11:20'},
  {id:'2',role:'Product Manager',type:'Technical',difficulty:'Hard',score:74,date:'Yesterday',questions:10,duration:'16:45'},
  {id:'3',role:'Data Analyst',type:'Behavioral',difficulty:'Medium',score:88,date:'3 days ago',questions:7,duration:'10:55'},
  {id:'4',role:'Software Engineer',type:'Mixed',difficulty:'Easy',score:91,date:'5 days ago',questions:5,duration:'8:10'},
  {id:'5',role:'Marketing Manager',type:'Situational',difficulty:'Medium',score:67,date:'1 week ago',questions:6,duration:'9:30'},
  {id:'6',role:'Product Manager',type:'Behavioral',difficulty:'Medium',score:79,date:'2 weeks ago',questions:7,duration:'12:00'},
];

export default function InterviewHistoryScreen({ navigation }:any){
  const [filter,setFilter]=useState('All');
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{ Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start(); },[]);

  const filtered=SESSIONS.filter(s=>filter==='All'||s.role===filter||s.type===filter);
  const avg=filtered.length?Math.round(filtered.reduce((a,b)=>a+b.score,0)/filtered.length):0;
  const best=filtered.length?Math.max(...filtered.map(s=>s.score)):0;

  const FILTERS=['All','Software Engineer','Product Manager','Behavioral','Technical'];

  return(
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Interview History</Text>
            <Text style={s.headerSub}>{filtered.length} sessions</Text>
          </View>
          <View style={{width:42}}/>
        </View>
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}><Text style={[s.statVal,{color:sc(avg)}]}>{avg}</Text><Text style={s.statLbl}>Avg Score</Text></View>
          <View style={[s.statItem,{borderRightWidth:0}]}><Text style={[s.statVal,{color:C.green}]}>{best}</Text><Text style={s.statLbl}>Best Score</Text></View>
          <View style={s.statItem}><Text style={[s.statVal,{color:C.purple}]}>{SESSIONS.length}</Text><Text style={s.statLbl}>Total</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} style={[s.chip,filter===f&&s.chipActive]} onPress={()=>setFilter(f)}>
              <Text style={[s.chipTxt,filter===f&&s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.sessionList}>
          {filtered.map((sess,i)=>{
            const col=sc(sess.score);
            const diffCol=sess.difficulty==='Easy'?C.green:sess.difficulty==='Medium'?C.gold:C.danger;
            return(
              <TouchableOpacity key={sess.id} style={[s.sessionRow,i===filtered.length-1&&{borderBottomWidth:0}]}
                onPress={()=>navigation.navigate('Feedback',{role:sess.role,type:sess.type,difficulty:sess.difficulty,scores:[sess.score],answers:[`${sess.role} Question`],avgScore:sess.score})}
                activeOpacity={0.8}>
                <View style={[s.sessionIcon,{backgroundColor:'rgba(124,58,237,0.18)'}]}>
                  <Ionicons name="people-outline" size={20} color={C.purple}/>
                </View>
                <View style={s.sessionMeta}>
                  <Text style={s.sessionRole}>{sess.role}</Text>
                  <View style={s.sessionSubRow}>
                    <View style={[s.typeBadge]}><Text style={s.typeBadgeTxt}>{sess.type}</Text></View>
                    <View style={[s.diffBadge,{backgroundColor:`${diffCol}18`}]}><Text style={[s.diffBadgeTxt,{color:diffCol}]}>{sess.difficulty}</Text></View>
                  </View>
                  <View style={s.sessionInfo}>
                    <Ionicons name="time-outline" size={11} color={C.hint}/>
                    <Text style={s.sessionInfoTxt}>{sess.date} · {sess.duration} · {sess.questions}Q</Text>
                  </View>
                </View>
                <View style={[s.scoreBadge,{backgroundColor:`${col}15`}]}>
                  <Text style={[s.scoreBadgeTxt,{color:col}]}>{sess.score}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  headerBg:{paddingBottom:12},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:32,marginBottom:12,gap:10},
  backBtn:{width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerCenter:{flex:1},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.text},
  headerSub:{fontSize:12,color:C.muted,marginTop:2},
  statsRow:{flexDirection:'row',marginHorizontal:20,backgroundColor:'rgba(255,255,255,0.05)',borderRadius:14,borderWidth:1,borderColor:C.border,overflow:'hidden',marginBottom:12},
  statItem:{flex:1,alignItems:'center',paddingVertical:10,borderRightWidth:1,borderRightColor:C.border},
  statVal:{fontSize:18,fontWeight:'800',marginBottom:2},
  statLbl:{fontSize:10,color:C.muted},
  filterRow:{paddingHorizontal:20,gap:8,paddingBottom:4},
  chip:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  chipActive:{backgroundColor:C.primary,borderColor:C.primary},
  chipTxt:{fontSize:12,color:C.muted,fontWeight:'500'},
  chipTxtActive:{color:'#fff'},
  scroll:{paddingHorizontal:20,paddingTop:16},
  sessionList:{backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border},
  sessionRow:{flexDirection:'row',alignItems:'flex-start',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border},
  sessionIcon:{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center',flexShrink:0},
  sessionMeta:{flex:1,gap:6},
  sessionRole:{fontSize:13,fontWeight:'700',color:C.text},
  sessionSubRow:{flexDirection:'row',gap:6},
  typeBadge:{backgroundColor:'rgba(255,255,255,0.08)',borderRadius:8,paddingHorizontal:8,paddingVertical:2},
  typeBadgeTxt:{fontSize:10,color:C.muted,fontWeight:'600'},
  diffBadge:{borderRadius:8,paddingHorizontal:8,paddingVertical:2},
  diffBadgeTxt:{fontSize:10,fontWeight:'700'},
  sessionInfo:{flexDirection:'row',alignItems:'center',gap:5},
  sessionInfoTxt:{fontSize:11,color:C.hint},
  scoreBadge:{paddingHorizontal:10,paddingVertical:5,borderRadius:10,alignSelf:'flex-start'},
  scoreBadgeTxt:{fontSize:14,fontWeight:'800'},
});
