import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnswerEvaluation } from '../../lib/openai';
import { useTheme } from '../../theme/ThemeContext';

const { width: W } = Dimensions.get('window');

function formatTime(s:number){ const m=Math.floor(s/60).toString().padStart(2,'0'); const s2=(s%60).toString().padStart(2,'0'); return `${m}:${s2}`; }
function scoreColor(s:number){ return s>=80?'#10B981':s>=60?'#A78BFA':s>=40?'#F59E0B':'#F43F5E'; }
function scoreLabel(s:number){ return s>=85?'Excellent':s>=75?'Great':s>=60?'Good':s>=40?'Fair':'Needs Work'; }

// keep the type reference to avoid unused import error
type _AE = AnswerEvaluation;

export default function AnalysisResultScreen({ navigation, route }:any) {
  const { colors: C, isDark } = useTheme();
  const {
    score=0, duration=0, fillerCount=0, fillerBreakdown={},
    mode='Free Speech', wpm=0, transcript='',
    details={ clarity:0, pace:0, pronunciation:0, confidence:0 },
    aiAnalysis=null,
  } = route?.params ?? {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const color = scoreColor(score);

  useEffect(()=>{
    Animated.timing(fadeAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
    let current = 0;
    const interval = setInterval(()=>{
      current += Math.ceil(score/30);
      if(current >= score){ current = score; clearInterval(interval); }
      setDisplayScore(current);
    }, 40);
    return ()=>clearInterval(interval);
  },[]);

  const METRICS = [
    { label:'Clarity',       value:details.clarity,       icon:'eye-outline',        color:'#A78BFA' },
    { label:'Pace',          value:details.pace,          icon:'speedometer-outline', color:'#06B6D4' },
    { label:'Pronunciation', value:details.pronunciation, icon:'volume-high-outline', color:'#10B981' },
    { label:'Confidence',    value:details.confidence,    icon:'trending-up-outline', color:'#F59E0B' },
  ];

  const generateFeedback = () => {
    const tips: {type:string,icon:string,color:string,title:string,text:string}[] = [];
    if (fillerCount === 0) {
      tips.push({ type:'pos', icon:'checkmark-circle', color:'#10B981', title:'Zero Filler Words!', text:'Exceptional control — you spoke with no filler words at all. This puts you in the top 5% of speakers.' });
    } else if (fillerCount <= 3) {
      tips.push({ type:'pos', icon:'checkmark-circle', color:'#10B981', title:'Excellent Filler Control', text:`Only ${fillerCount} filler words in your entire speech. Professional speakers average 1-2 per minute, and you're right on track.` });
    } else if (fillerCount <= 7) {
      const topFiller = Object.entries(fillerBreakdown as Record<string,number>).sort((a,b)=>b[1]-a[1])[0];
      tips.push({ type:'warn', icon:'warning', color:'#F59E0B', title:`${fillerCount} Filler Words Detected`, text:`Your most used filler was "${topFiller?.[0] ?? 'um'}" (${topFiller?.[1] ?? 3}x). Try replacing fillers with a 1-second pause.` });
    } else {
      const top3 = Object.entries(fillerBreakdown as Record<string,number>).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w,c])=>`"${w}" (${c}x)`).join(', ');
      tips.push({ type:'neg', icon:'close-circle', color:'#F43F5E', title:`${fillerCount} Filler Words — Needs Work`, text:`Top offenders: ${top3}. Practice the pause technique: when you feel an "um" coming, take a breath instead.` });
    }
    if (wpm >= 110 && wpm <= 150) {
      tips.push({ type:'pos', icon:'speedometer', color:'#8B5CF6', title:`Perfect Pace: ${wpm} WPM`, text:'Your speaking pace is in the ideal range (110-150 WPM). Listeners can follow you easily.' });
    } else if (wpm > 150) {
      tips.push({ type:'warn', icon:'speedometer', color:'#F59E0B', title:`Speaking Too Fast: ${wpm} WPM`, text:`Try pausing for 2 seconds after key points.` });
    } else if (wpm > 0 && wpm < 110) {
      tips.push({ type:'warn', icon:'speedometer', color:'#F59E0B', title:`Speaking Too Slow: ${wpm} WPM`, text:`Aim for 120-140 WPM. Practice reading aloud daily.` });
    }
    if (details.clarity >= 85) {
      tips.push({ type:'pos', icon:'mic', color:'#10B981', title:'Clear Articulation', text:'Your words were well-articulated and easy to understand.' });
    } else {
      tips.push({ type:'warn', icon:'mic', color:'#F59E0B', title:'Improve Articulation', text:'Practice tongue twisters daily to strengthen articulation muscles.' });
    }
    if (details.confidence >= 80) {
      tips.push({ type:'pos', icon:'trending-up', color:'#8B5CF6', title:'Strong Confidence', text:'Your tone projected confidence.' });
    } else {
      tips.push({ type:'warn', icon:'trending-up', color:'#F59E0B', title:'Build Confidence', text:'Try the "power pose" for 2 minutes before speaking.' });
    }
    const proTips = [
      'Record yourself daily for 2 minutes on any topic. Review it and note 1 improvement each time.',
      'Join a Toastmasters club near you — structured practice dramatically accelerates improvement.',
      'Read aloud for 10 minutes every day. It trains your mouth to form words without thinking.',
      'Before important speeches, hum for 30 seconds to warm up your vocal cords.',
      'Breathe from your diaphragm, not your chest — it gives your voice more power and steadiness.',
    ];
    tips.push({ type:'tip', icon:'bulb', color:'#A78BFA', title:'Pro Tip', text: proTips[Math.floor(Math.random() * proTips.length)] });
    return tips;
  };

  const feedback = generateFeedback();

  const doShare = async()=>{
    try{ await Share.share({message:`I scored ${score}/100 on Voxira Speech Analysis!\nMode: ${mode} | Duration: ${formatTime(duration)}`}); }catch{}
  };

  const s = StyleSheet.create({
    root:          {flex:1,backgroundColor:C.bg},
    header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,paddingBottom:8},
    iconBtn:       {width:42,height:42,borderRadius:12,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
    headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
    scroll:        {paddingHorizontal:20,paddingTop:4,paddingBottom:40},
    scoreCard:     {backgroundColor:C.surface,borderRadius:18,padding:24,alignItems:'center',marginBottom:20,borderWidth:1,borderColor:C.border,gap:10},
    modeTag:       {fontSize:12,color:C.textMuted,textTransform:'uppercase',letterSpacing:1},
    scoreRing:     {width:120,height:120,borderRadius:60,borderWidth:5,alignItems:'center',justifyContent:'center'},
    scoreNum:      {fontSize:40,fontWeight:'800',letterSpacing:-1},
    scoreMax:      {fontSize:12,color:C.textMuted,marginTop:-4},
    scoreLabel:    {fontSize:16,fontWeight:'700'},
    metaRow:       {flexDirection:'row',alignItems:'center',gap:10},
    metaItem:      {flexDirection:'row',alignItems:'center',gap:4},
    metaTxt:       {fontSize:12,color:C.textSec},
    metaDot:       {width:3,height:3,borderRadius:2,backgroundColor:C.textMuted},
    fillerCard:    {backgroundColor:C.warning+'1A',borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:C.warning+'40'},
    fillerTitle:   {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
    fillerGrid:    {flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
    fillerChip:    {flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderRadius:20,paddingLeft:10,paddingRight:4,paddingVertical:4,gap:6,borderWidth:1,borderColor:C.warning+'4D'},
    fillerWord:    {fontSize:13,fontWeight:'600',color:C.warning},
    fillerBadge:   {backgroundColor:C.warning,borderRadius:16,paddingHorizontal:8,paddingVertical:2},
    fillerCount:   {fontSize:11,fontWeight:'700',color:'#000'},
    fillerNote:    {fontSize:12,color:C.textSec,lineHeight:18},
    sectionTitle:  {fontSize:16,fontWeight:'700',color:C.text,marginBottom:12},
    metricsGrid:   {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:20},
    metricCard:    {width:(W-50)/2,backgroundColor:C.surface,borderRadius:14,padding:14,borderWidth:1,borderColor:C.border,gap:6},
    metricIcon:    {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
    metricLabel:   {fontSize:12,color:C.textSec},
    metricVal:     {fontSize:24,fontWeight:'800'},
    metricBarBg:   {height:4,backgroundColor:C.border,borderRadius:2,overflow:'hidden'},
    metricBarFill: {height:'100%',borderRadius:2},
    feedbackCard:  {borderRadius:14,padding:14,marginBottom:10,borderLeftWidth:3},
    feedbackHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
    feedbackTitle: {fontSize:14,fontWeight:'700'},
    feedbackText:  {fontSize:13,color:C.textSec,lineHeight:20},
    planCard:      {backgroundColor:C.primaryLight,borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:C.primary+'33'},
    planTitle:     {fontSize:15,fontWeight:'700',color:C.primary,marginBottom:12},
    planRow:       {flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:10},
    planDayBadge:  {backgroundColor:C.primary+'4D',borderRadius:8,paddingHorizontal:8,paddingVertical:4,minWidth:60,alignItems:'center'},
    planDay:       {fontSize:10,fontWeight:'700',color:C.primary},
    planTask:      {flex:1,fontSize:12,color:C.textSec,lineHeight:18},
    actionsRow:    {flexDirection:'row',gap:12},
    secBtn:        {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.surface,borderRadius:12,borderWidth:1,borderColor:C.border,paddingVertical:14},
    secBtnTxt:     {fontSize:14,fontWeight:'600',color:C.text},
    primBtn:       {flex:2,borderRadius:12,overflow:'hidden',backgroundColor:C.primary},
    primBtnInner:  {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14},
    primBtnTxt:    {fontSize:14,fontWeight:'700',color:'#fff'},
    transcriptCard:   {backgroundColor:C.primaryLight,borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:C.primary+'33'},
    transcriptHeader: {flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
    transcriptTitle:  {fontSize:14,fontWeight:'700',color:C.primary},
    transcriptText:   {fontSize:13,color:C.textSec,lineHeight:20,marginBottom:8},
    transcriptMeta:   {fontSize:11,color:C.textMuted},
    altCard:       {backgroundColor:C.primaryLight,borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:C.primary+'40'},
    altBadge:      {alignSelf:'flex-start',backgroundColor:C.primaryLight,borderRadius:20,paddingHorizontal:10,paddingVertical:3,marginBottom:8},
    altBadgeTxt:   {fontSize:11,fontWeight:'700',color:C.primary},
    altText:       {fontSize:13,color:C.textSec,lineHeight:20},
    tipCard:       {flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:C.primaryLight,borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:C.primary+'33'},
    tipNum:        {width:26,height:26,borderRadius:13,backgroundColor:C.primary,alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1},
    tipNumTxt:     {fontSize:12,fontWeight:'800',color:'#fff'},
    tipText:       {flex:1,fontSize:13,color:C.textSec,lineHeight:20},
    structureCard: {backgroundColor:C.success+'14',borderRadius:14,padding:14,marginBottom:16,borderWidth:1,borderColor:C.success+'33'},
    structureTitle:{fontSize:14,fontWeight:'700',color:C.success,marginBottom:6},
    structureText: {fontSize:13,color:C.textSec,lineHeight:20},
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{opacity:fadeAnim},Platform.OS==='web'&&({height:'100vh',overflowY:'auto'} as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={()=>navigation.navigate('SpeechHome')}>
            <Ionicons name="arrow-back" size={22} color={C.textSec}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Analysis Result</Text>
          <TouchableOpacity style={s.iconBtn} onPress={doShare}>
            <Ionicons name="share-outline" size={22} color={C.textSec}/>
          </TouchableOpacity>
        </View>

        <View style={s.scoreCard}>
          <Text style={s.modeTag}>{mode}</Text>
          <View style={[s.scoreRing,{borderColor:`${color}50`}]}>
            <Text style={[s.scoreNum,{color}]}>{displayScore}</Text>
            <Text style={s.scoreMax}>/100</Text>
          </View>
          <Text style={[s.scoreLabel,{color}]}>{scoreLabel(score)}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}><Ionicons name="time-outline" size={14} color={C.textMuted}/><Text style={s.metaTxt}>{formatTime(duration)}</Text></View>
            {fillerCount>0&&<><View style={s.metaDot}/><View style={s.metaItem}><Ionicons name="warning-outline" size={14} color={C.textMuted}/><Text style={s.metaTxt}>{fillerCount} fillers</Text></View></>}
            {wpm>0&&<><View style={s.metaDot}/><View style={s.metaItem}><Ionicons name="speedometer-outline" size={14} color={C.textMuted}/><Text style={s.metaTxt}>{wpm} WPM</Text></View></>}
          </View>
        </View>

        {transcript && transcript.length > 10 && (
          <View style={s.transcriptCard}>
            <View style={s.transcriptHeader}>
              <Ionicons name="document-text-outline" size={16} color={C.primary} />
              <Text style={s.transcriptTitle}>Your Transcript</Text>
            </View>
            <Text style={s.transcriptText}>{transcript}</Text>
            <Text style={s.transcriptMeta}>
              {transcript.trim().split(/\s+/).filter(Boolean).length} words · {formatTime(duration)}{wpm > 0 ? ` · ${wpm} WPM` : ''}
            </Text>
          </View>
        )}

        {fillerCount > 0 && (
          <View style={s.fillerCard}>
            <Text style={s.fillerTitle}>Filler Word Breakdown</Text>
            <View style={s.fillerGrid}>
              {Object.entries(fillerBreakdown as Record<string,number>)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([word, count]) => (
                  <View key={word} style={s.fillerChip}>
                    <Text style={s.fillerWord}>"{word}"</Text>
                    <View style={s.fillerBadge}><Text style={s.fillerCount}>{count}x</Text></View>
                  </View>
                ))}
            </View>
            <Text style={s.fillerNote}>Every filler costs ~2 points. Replacing them with pauses dramatically improves your score.</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Score Breakdown</Text>
        <View style={s.metricsGrid}>
          {METRICS.map((m,i)=>(
            <View key={i} style={s.metricCard}>
              <View style={[s.metricIcon,{backgroundColor:`${m.color}18`}]}>
                <Ionicons name={m.icon as any} size={18} color={m.color}/>
              </View>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={[s.metricVal,{color:m.color}]}>{m.value}</Text>
              <View style={s.metricBarBg}><View style={[s.metricBarFill,{width:`${m.value}%` as any,backgroundColor:m.color}]}/></View>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Feedback</Text>
        {feedback.map((fb, i) => (
          <View key={i} style={[s.feedbackCard, { borderLeftColor: fb.color, backgroundColor: `${fb.color}12` }]}>
            <View style={s.feedbackHeader}>
              <Ionicons name={fb.icon as any} size={18} color={fb.color} />
              <Text style={[s.feedbackTitle, { color: fb.color }]}>{fb.title}</Text>
            </View>
            <Text style={s.feedbackText}>{fb.text}</Text>
          </View>
        ))}

        {aiAnalysis && (
          <>
            {aiAnalysis.alternateAnswers?.length > 0 && (
              <>
                <Text style={s.sectionTitle}>AI-Suggested Rephrasings</Text>
                {(aiAnalysis.alternateAnswers as string[]).map((alt: string, i: number) => (
                  <View key={i} style={s.altCard}>
                    <View style={s.altBadge}><Text style={s.altBadgeTxt}>Version {i + 1}</Text></View>
                    <Text style={s.altText}>{alt}</Text>
                  </View>
                ))}
              </>
            )}
            {aiAnalysis.improvementTips?.length > 0 && (
              <>
                <Text style={s.sectionTitle}>AI Improvement Tips</Text>
                {(aiAnalysis.improvementTips as string[]).map((tip: string, i: number) => (
                  <View key={i} style={s.tipCard}>
                    <View style={s.tipNum}><Text style={s.tipNumTxt}>{i + 1}</Text></View>
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </>
            )}
            {aiAnalysis.structureFeedback && (
              <View style={s.structureCard}>
                <Ionicons name="git-branch-outline" size={16} color={C.success} style={{ marginBottom: 6 }} />
                <Text style={s.structureTitle}>Structure Feedback</Text>
                <Text style={s.structureText}>{aiAnalysis.structureFeedback}</Text>
              </View>
            )}
          </>
        )}

        <View style={s.planCard}>
          <Text style={s.planTitle}>Your 7-Day Improvement Plan</Text>
          {[
            { day: 'Day 1-2', task: 'Record 2-minute speeches daily. Count your filler words each time.' },
            { day: 'Day 3-4', task: 'Practice the PAUSE technique. Every time you feel a filler coming, pause for 1 second instead.' },
            { day: 'Day 5-6', task: 'Read aloud for 10 minutes. Focus on clear enunciation of every syllable.' },
            { day: 'Day 7',   task: 'Record a 3-minute speech on any topic and compare with your Day 1 recording.' },
          ].map((item, i) => (
            <View key={i} style={s.planRow}>
              <View style={s.planDayBadge}><Text style={s.planDay}>{item.day}</Text></View>
              <Text style={s.planTask}>{item.task}</Text>
            </View>
          ))}
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={s.secBtn} onPress={()=>navigation.navigate('Record',{mode})}>
            <Ionicons name="refresh-outline" size={18} color={C.textSec}/>
            <Text style={s.secBtnTxt}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primBtn} onPress={()=>navigation.navigate('SpeechHome')} activeOpacity={0.85}>
            <View style={s.primBtnInner}>
              <Ionicons name="home-outline" size={18} color="#fff"/>
              <Text style={s.primBtnTxt}>Done</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{height:80}}/>
      </Animated.ScrollView>
    </View>
  );
}
