import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated,
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

const TYPES = [
  { id:'behavioral',  label:'Behavioral',   icon:'chatbubbles-outline',   color:C.accent,  desc:'Tell me about yourself, strengths, STAR method answers' },
  { id:'technical',   label:'Technical',    icon:'code-outline',           color:C.green,   desc:'Role-specific technical knowledge and problem solving'   },
  { id:'situational', label:'Situational',  icon:'flash-outline',          color:C.gold,    desc:'How would you handle specific work situations?'          },
  { id:'mixed',       label:'Mixed',        icon:'shuffle-outline',        color:C.purple,  desc:'A mix of all question types — most realistic'           },
];

const DIFFICULTIES = [
  { id:'easy',   label:'Easy',   icon:'leaf-outline',      color:C.green,  desc:'Entry level, internship, fresher positions'   },
  { id:'medium', label:'Medium', icon:'flame-outline',     color:C.gold,   desc:'Mid-level, 1–3 years experience'              },
  { id:'hard',   label:'Hard',   icon:'skull-outline',     color:'#EF4444',desc:'Senior level, 5+ years, leadership roles'     },
];

const DURATIONS = [
  { id:'5',  label:'5 min',   questions:4,  icon:'timer-outline'  },
  { id:'10', label:'10 min',  questions:7,  icon:'time-outline'   },
  { id:'15', label:'15 min',  questions:10, icon:'hourglass-outline'},
  { id:'20', label:'20 min',  questions:14, icon:'alarm-outline'  },
];

export default function InterviewSetupScreen({ navigation, route }:any) {
  const { role='Software Engineer', type:presetType } = route?.params ?? {};
  const [intType,   setIntType]   = useState(presetType?.toLowerCase()||'behavioral');
  const [difficulty,setDifficulty]= useState('medium');
  const [duration,  setDuration]  = useState('10');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const selType  = TYPES.find(t=>t.id===intType)!;
  const selDiff  = DIFFICULTIES.find(d=>d.id===difficulty)!;
  const selDur   = DURATIONS.find(d=>d.id===duration)!;

  const startInterview = () => {
    navigation.navigate('LiveInterview',{
      role, type:intType, difficulty, duration:parseInt(duration),
      questions:selDur.questions,
    });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Interview Setup</Text>
            <Text style={s.headerSub}>{role}</Text>
          </View>
          <View style={{width:42}}/>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)] contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Summary preview */}
        <View style={s.previewCard}>
          <LinearGradient colors={['rgba(21,101,255,0.18)','rgba(21,101,255,0.04)']} style={[StyleSheet.absoluteFill,{borderRadius:20}]}/>
          <View style={s.previewRow}>
            <View style={s.previewItem}>
              <Ionicons name="briefcase-outline" size={18} color={C.accent}/>
              <Text style={s.previewLbl}>Role</Text>
              <Text style={s.previewVal} numberOfLines={1}>{role}</Text>
            </View>
            <View style={s.previewDivider}/>
            <View style={s.previewItem}>
              <Ionicons name="help-circle-outline" size={18} color={C.accent}/>
              <Text style={s.previewLbl}>Questions</Text>
              <Text style={s.previewVal}>{selDur.questions}</Text>
            </View>
            <View style={s.previewDivider}/>
            <View style={s.previewItem}>
              <Ionicons name="time-outline" size={18} color={C.accent}/>
              <Text style={s.previewLbl}>Duration</Text>
              <Text style={s.previewVal}>{duration} min</Text>
            </View>
          </View>
        </View>

        {/* Interview type */}
        <Text style={s.sectionTitle}>Interview Type</Text>
        <View style={s.optGrid}>
          {TYPES.map(t=>(
            <TouchableOpacity key={t.id} style={[s.optCard, intType===t.id&&s.optCardActive]} onPress={()=>setIntType(t.id)} activeOpacity={0.8}>
              <View style={[s.optIcon,{backgroundColor:`${t.color}18`}]}>
                <Ionicons name={t.icon as any} size={22} color={t.color}/>
              </View>
              <Text style={s.optLabel}>{t.label}</Text>
              <Text style={s.optDesc} numberOfLines={2}>{t.desc}</Text>
              {intType===t.id&&<View style={s.optCheck}><Ionicons name="checkmark-circle" size={18} color={C.green}/></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty */}
        <Text style={s.sectionTitle}>Difficulty Level</Text>
        <View style={s.diffRow}>
          {DIFFICULTIES.map(d=>(
            <TouchableOpacity key={d.id} style={[s.diffCard, difficulty===d.id&&{borderColor:`${d.color}60`,backgroundColor:`${d.color}10`}]} onPress={()=>setDifficulty(d.id)} activeOpacity={0.8}>
              <Ionicons name={d.icon as any} size={20} color={difficulty===d.id?d.color:C.muted}/>
              <Text style={[s.diffLabel,{color:difficulty===d.id?d.color:C.muted}]}>{d.label}</Text>
              <Text style={s.diffDesc}>{d.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={s.sectionTitle}>Session Duration</Text>
        <View style={s.durRow}>
          {DURATIONS.map(d=>(
            <TouchableOpacity key={d.id} style={[s.durCard, duration===d.id&&s.durCardActive]} onPress={()=>setDuration(d.id)} activeOpacity={0.8}>
              <Ionicons name={d.icon as any} size={18} color={duration===d.id?C.primary:C.muted}/>
              <Text style={[s.durLabel,{color:duration===d.id?C.primary:C.text}]}>{d.label}</Text>
              <Text style={s.durQ}>{d.questions}Q</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips box */}
        <View style={s.tipsBox}>
          <Ionicons name="bulb-outline" size={16} color={C.gold}/>
          <View style={{flex:1}}>
            <Text style={s.tipsTitle}>Before you start</Text>
            <Text style={s.tipsTxt}>Find a quiet room · Speak clearly · Use the STAR method for behavioral questions · Take a deep breath before answering</Text>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity style={s.startBtn} onPress={startInterview} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED','#4C1D95']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.startBtnGrad}>
            <Ionicons name="people" size={20} color="#fff"/>
            <Text style={s.startBtnTxt}>Start Interview</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex:1,backgroundColor:C.bg},
  headerBg:     {paddingBottom:12},
  header:       {flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:32,gap:10},
  backBtn:      {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerCenter: {flex:1},
  headerTitle:  {fontSize:17,fontWeight:'700',color:C.text},
  headerSub:    {fontSize:12,color:C.muted,marginTop:2},
  scroll:       {paddingHorizontal:20,paddingTop:16},
  previewCard:  {borderRadius:20,padding:16,marginBottom:24,borderWidth:1,borderColor:'rgba(21,101,255,0.20)',overflow:'hidden'},
  previewRow:   {flexDirection:'row',justifyContent:'space-around'},
  previewItem:  {alignItems:'center',gap:4,flex:1},
  previewLbl:   {fontSize:11,color:C.muted},
  previewVal:   {fontSize:13,fontWeight:'700',color:C.text,textAlign:'center'},
  previewDivider:{width:1,backgroundColor:C.border,marginVertical:4},
  sectionTitle: {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  optGrid:      {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:24},
  optCard:      {width:'47%',backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border,gap:8,position:'relative'},
  optCardActive:{borderColor:'rgba(21,101,255,0.6)',backgroundColor:'rgba(21,101,255,0.08)'},
  optIcon:      {width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},
  optLabel:     {fontSize:13,fontWeight:'700',color:C.text},
  optDesc:      {fontSize:11,color:C.muted,lineHeight:16},
  optCheck:     {position:'absolute',top:10,right:10},
  diffRow:      {flexDirection:'row',gap:10,marginBottom:24},
  diffCard:     {flex:1,backgroundColor:C.bgCard,borderRadius:16,padding:12,borderWidth:1,borderColor:C.border,alignItems:'center',gap:6},
  diffLabel:    {fontSize:13,fontWeight:'700'},
  diffDesc:     {fontSize:10,color:C.hint,textAlign:'center',lineHeight:14},
  durRow:       {flexDirection:'row',gap:8,marginBottom:20},
  durCard:      {flex:1,backgroundColor:C.bgCard,borderRadius:14,padding:12,borderWidth:1,borderColor:C.border,alignItems:'center',gap:4},
  durCardActive:{borderColor:'rgba(21,101,255,0.6)',backgroundColor:'rgba(21,101,255,0.10)'},
  durLabel:     {fontSize:13,fontWeight:'700'},
  durQ:         {fontSize:10,color:C.hint},
  tipsBox:      {flexDirection:'row',gap:10,backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:'rgba(245,158,11,0.20)',marginBottom:20,alignItems:'flex-start'},
  tipsTitle:    {fontSize:13,fontWeight:'700',color:C.gold,marginBottom:4},
  tipsTxt:      {fontSize:12,color:C.muted,lineHeight:18},
  startBtn:     {borderRadius:16,overflow:'hidden'},
  startBtnGrad: {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  startBtnTxt:  {fontSize:16,fontWeight:'700',color:'#fff'},
});

