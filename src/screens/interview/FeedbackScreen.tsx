import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Share,
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

function scoreColor(s:number){ return s>=80?C.green:s>=65?C.accent:s>=50?C.gold:C.danger; }
function scoreLabel(s:number){ return s>=85?'Excellent':s>=75?'Strong':s>=65?'Good':s>=50?'Fair':'Needs Work'; }

function AnimatedScore({target,color}:{target:number,color:string}){
  const anim=useRef(new Animated.Value(0)).current;
  const [val,setVal]=useState(0);
  useEffect(()=>{
    Animated.timing(anim,{toValue:target,duration:1400,useNativeDriver:false}).start();
    anim.addListener(({value})=>setVal(Math.round(value)));
    return ()=>anim.removeAllListeners();
  },[]);
  return (
    <View style={sc.wrap}>
      <View style={[sc.ring,{borderColor:`${color}55`}]}>
        <Text style={[sc.num,{color}]}>{val}</Text>
        <Text style={sc.max}>/100</Text>
      </View>
      <Text style={[sc.label,{color}]}>{scoreLabel(target)}</Text>
    </View>
  );
}
const sc=StyleSheet.create({
  wrap:{alignItems:'center',gap:10},
  ring:{width:120,height:120,borderRadius:60,borderWidth:6,alignItems:'center',justifyContent:'center'},
  num:{fontSize:40,fontWeight:'800',letterSpacing:-1},
  max:{fontSize:12,color:C.hint},
  label:{fontSize:16,fontWeight:'700'},
});

export default function FeedbackScreen({ navigation, route }:any) {
  const {
    role='Software Engineer', type='behavioral', difficulty='medium',
    scores=[], answers=[], avgScore=78,
  } = route?.params ?? {};

  const fade=useRef(new Animated.Value(0)).current;
  const [activeQ,setActiveQ]=useState<number|null>(null);
  const color=scoreColor(avgScore);

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  const METRICS=[
    {label:'Content',    score:Math.min(100,avgScore+5),  icon:'document-text-outline',color:C.accent },
    {label:'Clarity',    score:Math.min(100,avgScore-3),  icon:'eye-outline',           color:C.green  },
    {label:'Structure',  score:Math.min(100,avgScore+8),  icon:'git-branch-outline',    color:C.purple },
    {label:'Confidence', score:Math.min(100,avgScore-8),  icon:'trending-up-outline',   color:C.gold   },
  ];

  const FEEDBACK_ITEMS=[
    {type:'pos',text:'You demonstrated clear communication and stayed on topic throughout the interview.'},
    {type:'pos',text:'Your answers showed relevant experience and practical examples.'},
    avgScore<75
      ?{type:'neg',text:'Some answers lacked the STAR structure. Practice framing with Situation→Task→Action→Result.'}
      :{type:'pos',text:'You used the STAR method effectively in most behavioral answers.'},
    {type:'tip',text:'Add specific metrics and numbers to your answers. "Improved performance by 40%" is more impactful than "improved performance".'},
    difficulty==='hard'
      ?{type:'tip',text:'For senior roles, emphasise strategic thinking and team impact in your answers.'}
      :{type:'pos',text:'Your confidence level was appropriate for the difficulty level.'},
  ];

  const doShare=async()=>{
    try{ await Share.share({message:`I scored ${avgScore}/100 on my ${role} mock interview on Voxira! 🎯\n\nType: ${type} | Difficulty: ${difficulty}\n\nPractise interview skills with Voxira 👉`}); }catch{}
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.navigate('InterviewHome')}>
            <Ionicons name="home-outline" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Interview Feedback</Text>
          <TouchableOpacity style={s.shareBtn} onPress={doShare}>
            <Ionicons name="share-outline" size={22} color={C.muted}/>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Score card */}
        <View style={s.scoreCard}>
          <LinearGradient colors={['rgba(124,58,237,0.18)','rgba(124,58,237,0.04)']} style={[StyleSheet.absoluteFill,{borderRadius:22}]}/>
          <View style={s.scoreTop}>
            <View>
              <Text style={s.scoreRole}>{role}</Text>
              <Text style={s.scoreMeta}>{type} · {difficulty} · {scores.length} questions</Text>
            </View>
            <TouchableOpacity style={s.retryBtn} onPress={()=>navigation.navigate('InterviewSetup',{role,type})}>
              <Ionicons name="refresh-outline" size={16} color={C.accent}/>
              <Text style={s.retryBtnTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
          <AnimatedScore target={avgScore} color={color}/>
        </View>

        {/* Metric breakdown */}
        <Text style={s.sectionTitle}>Score Breakdown</Text>
        <View style={s.metricsGrid}>
          {METRICS.map((m,i)=>(
            <View key={i} style={s.metricCard}>
              <View style={[s.metricIcon,{backgroundColor:`${m.color}18`}]}>
                <Ionicons name={m.icon as any} size={20} color={m.color}/>
              </View>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={[s.metricVal,{color:m.color}]}>{m.score}</Text>
              <View style={s.metricBarBg}>
                <View style={[s.metricBarFill,{width:`${m.score}%` as any,backgroundColor:m.color}]}/>
              </View>
            </View>
          ))}
        </View>

        {/* Per-question scores */}
        <Text style={s.sectionTitle}>Question-by-Question</Text>
        <View style={s.qList}>
          {answers.map((q:string,i:number)=>{
            const sc2=scores[i]??75;
            const col=scoreColor(sc2);
            return(
              <TouchableOpacity key={i} style={[s.qRow,i===answers.length-1&&{borderBottomWidth:0}]}
                onPress={()=>setActiveQ(activeQ===i?null:i)} activeOpacity={0.8}>
                <View style={[s.qBadge,{backgroundColor:`${col}18`}]}>
                  <Text style={[s.qBadgeTxt,{color:col}]}>Q{i+1}</Text>
                </View>
                <Text style={s.qTxt} numberOfLines={activeQ===i?0:2}>{q}</Text>
                <View style={s.qRight}>
                  <Text style={[s.qScore,{color:col}]}>{sc2}</Text>
                  <Ionicons name={activeQ===i?'chevron-up':'chevron-down'} size={14} color={C.hint}/>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI feedback */}
        <Text style={s.sectionTitle}>AI Feedback</Text>
        <View style={s.feedbackList}>
          {FEEDBACK_ITEMS.map((fb,i)=>(
            <View key={i} style={[s.feedbackRow,{
              borderLeftColor:fb.type==='pos'?C.green:fb.type==='neg'?C.danger:C.gold,
              backgroundColor:fb.type==='pos'?`${C.green}08`:fb.type==='neg'?`${C.danger}08`:`${C.gold}08`,
            }]}>
              <Ionicons name={fb.type==='pos'?'checkmark-circle-outline':fb.type==='neg'?'close-circle-outline':'bulb-outline'} size={18}
                color={fb.type==='pos'?C.green:fb.type==='neg'?C.danger:C.gold}/>
              <Text style={s.feedbackTxt}>{fb.text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.secBtn} onPress={()=>navigation.navigate('ScoreBreakdown',{scores,answers,avgScore,role})}>
            <Ionicons name="bar-chart-outline" size={18} color={C.text}/>
            <Text style={s.secBtnTxt}>Full Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primBtn} onPress={()=>navigation.navigate('InterviewHome')} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED','#4C1D95']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primBtnGrad}>
              <Ionicons name="home-outline" size={18} color="#fff"/>
              <Text style={s.primBtnTxt}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:12},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  shareBtn:      {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  scroll:        {paddingHorizontal:20,paddingTop:16},
  scoreCard:     {borderRadius:22,padding:20,marginBottom:24,borderWidth:1,borderColor:'rgba(124,58,237,0.25)',overflow:'hidden',gap:20},
  scoreTop:      {flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  scoreRole:     {fontSize:16,fontWeight:'700',color:C.text,marginBottom:4},
  scoreMeta:     {fontSize:12,color:C.muted},
  retryBtn:      {flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(21,101,255,0.15)',borderRadius:10,paddingHorizontal:12,paddingVertical:6},
  retryBtnTxt:   {fontSize:12,color:C.accent,fontWeight:'600'},
  sectionTitle:  {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  metricsGrid:   {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:24},
  metricCard:    {width:'47%',backgroundColor:C.bgCard,borderRadius:18,padding:14,borderWidth:1,borderColor:C.border,gap:6},
  metricIcon:    {width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center'},
  metricLabel:   {fontSize:12,color:C.muted},
  metricVal:     {fontSize:24,fontWeight:'800'},
  metricBarBg:   {height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  metricBarFill: {height:'100%',borderRadius:2},
  qList:         {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:24},
  qRow:          {flexDirection:'row',alignItems:'flex-start',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border},
  qBadge:        {paddingHorizontal:8,paddingVertical:4,borderRadius:8,flexShrink:0},
  qBadgeTxt:     {fontSize:11,fontWeight:'700'},
  qTxt:          {flex:1,fontSize:13,color:C.muted,lineHeight:20},
  qRight:        {flexDirection:'row',alignItems:'center',gap:6,flexShrink:0},
  qScore:        {fontSize:14,fontWeight:'800'},
  feedbackList:  {gap:10,marginBottom:24},
  feedbackRow:   {flexDirection:'row',gap:12,padding:14,borderRadius:14,borderLeftWidth:3,alignItems:'flex-start'},
  feedbackTxt:   {flex:1,fontSize:13,color:C.text,lineHeight:20},
  actionsRow:    {flexDirection:'row',gap:12},
  secBtn:        {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bgCard,borderRadius:14,borderWidth:1,borderColor:C.border,paddingVertical:14},
  secBtnTxt:     {fontSize:14,fontWeight:'600',color:C.text},
  primBtn:       {flex:2,borderRadius:14,overflow:'hidden'},
  primBtnGrad:   {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14},
  primBtnTxt:    {fontSize:14,fontWeight:'700',color:'#fff'},
});

