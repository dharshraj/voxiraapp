import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#F8F7F4', bgCard:'#FFFFFF', surface:'#F1EFEC',
  primary:'#6C5CE7', accent:'#A29BFE', green:'#00B894',
  gold:'#FDCB6E', purple:'#6C5CE7', danger:'#E17055',
  text:'#2D3436', textSec:'#636E72', textHint:'#B2BEC3', border:'#E0DDD8',
};

function formatTime(secs:number){ const m=Math.floor(secs/60).toString().padStart(2,'0'); const s2=(secs%60).toString().padStart(2,'0'); return `${m}:${s2}`; }
function scoreColor(s:number){ return s>=80?C.green:s>=60?C.accent:s>=40?C.gold:C.danger; }
function scoreLabel(s:number){ return s>=85?'Excellent':s>=75?'Great':s>=60?'Good':s>=40?'Fair':'Needs Work'; }

export default function AnalysisResultScreen({ navigation, route }:any) {
  const {
    score=0, duration=0, fillerCount=0, fillerBreakdown={},
    transcript='', mode='Free Speech', wpm=0,
    details={ clarity:0, pace:0, pronunciation:0, confidence:0 },
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

  const noTranscript = !transcript || transcript.startsWith('(No transcript');

  const METRICS = [
    { label:'Clarity',       value:details.clarity,       icon:'eye-outline',         color:C.accent  },
    { label:'Pace',          value:details.pace,          icon:'speedometer-outline',  color:C.purple  },
    { label:'Pronunciation', value:details.pronunciation, icon:'volume-high-outline',  color:C.green   },
    { label:'Confidence',    value:details.confidence,    icon:'trending-up-outline',  color:C.gold    },
  ];

  const generateFeedback = () => {
    const tips: {type:string,icon:string,color:string,title:string,text:string}[] = [];

    if (fillerCount === 0) {
      tips.push({ type:'pos', icon:'checkmark-circle', color:'#00B894',
        title:'Zero Filler Words!',
        text:'Exceptional control — you spoke with no filler words at all. This puts you in the top 5% of speakers.' });
    } else if (fillerCount <= 3) {
      tips.push({ type:'pos', icon:'checkmark-circle', color:'#00B894',
        title:'Excellent Filler Control',
        text:`Only ${fillerCount} filler words in your entire speech. Professional speakers average 1-2 per minute, and you're right on track.` });
    } else if (fillerCount <= 7) {
      const topFiller = Object.entries(fillerBreakdown as Record<string,number>).sort((a,b)=>b[1]-a[1])[0];
      tips.push({ type:'warn', icon:'warning', color:'#FDCB6E',
        title:`${fillerCount} Filler Words Detected`,
        text:`Your most used filler was "${topFiller?.[0] ?? 'um'}" (${topFiller?.[1] ?? 3}x). Try replacing fillers with a 1-second pause — silence sounds more confident than "um".` });
    } else {
      const top3 = Object.entries(fillerBreakdown as Record<string,number>).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w,c])=>`"${w}" (${c}x)`).join(', ');
      tips.push({ type:'neg', icon:'close-circle', color:'#E17055',
        title:`${fillerCount} Filler Words — Needs Work`,
        text:`Filler words appeared frequently. The top offenders: ${top3}. Practice the pause technique: when you feel an "um" coming, take a breath instead.` });
    }

    if (wpm >= 110 && wpm <= 150) {
      tips.push({ type:'pos', icon:'speedometer', color:'#6C5CE7',
        title:`Perfect Pace: ${wpm} WPM`,
        text:'Your speaking pace is in the ideal range (110-150 WPM). Listeners can follow you easily without feeling rushed or bored.' });
    } else if (wpm > 150) {
      tips.push({ type:'warn', icon:'speedometer', color:'#FDCB6E',
        title:`Speaking Too Fast: ${wpm} WPM`,
        text:`You spoke at ${wpm} WPM — slightly above the ideal 110-150 range. Try pausing for 2 seconds after key points. Record yourself reading a passage at a deliberately slower pace.` });
    } else if (wpm > 0 && wpm < 110) {
      tips.push({ type:'warn', icon:'speedometer', color:'#FDCB6E',
        title:`Speaking Too Slow: ${wpm} WPM`,
        text:`At ${wpm} WPM, your pace may cause listeners to lose focus. Aim for 120-140 WPM. Practice reading aloud daily to build natural momentum.` });
    }

    if (details.clarity >= 85) {
      tips.push({ type:'pos', icon:'mic', color:'#00B894',
        title:'Clear Articulation',
        text:'Your words were well-articulated and easy to understand. Strong consonant sounds and good mouth opening contribute to your clarity score.' });
    } else {
      tips.push({ type:'warn', icon:'mic', color:'#FDCB6E',
        title:'Improve Articulation',
        text:'Some words were unclear. Practice tongue twisters daily (e.g., "She sells seashells") to strengthen articulation muscles. Open your mouth wider when speaking.' });
    }

    if (details.confidence >= 80) {
      tips.push({ type:'pos', icon:'trending-up', color:'#6C5CE7',
        title:'Strong Confidence',
        text:'Your tone projected confidence. Maintaining steady eye contact and upright posture while speaking helps reinforce this verbal confidence.' });
    } else {
      tips.push({ type:'warn', icon:'trending-up', color:'#FDCB6E',
        title:'Build Confidence',
        text:'Your delivery showed some hesitation. Try the "power pose" for 2 minutes before speaking. Record yourself and watch it back — you will notice you sound better than you think.' });
    }

    const proTips = [
      'Record yourself daily for 2 minutes speaking on any topic. Review it and note 1 improvement each time.',
      'Join a Toastmasters club near you — structured practice dramatically accelerates improvement.',
      'Read aloud for 10 minutes every day. It trains your mouth to form words without thinking.',
      'Before important speeches, hum for 30 seconds to warm up your vocal cords.',
      'Breathe from your diaphragm, not your chest — it gives your voice more power and steadiness.',
    ];
    tips.push({ type:'tip', icon:'bulb', color:'#A29BFE',
      title:'Pro Tip',
      text: proTips[Math.floor(Math.random() * proTips.length)] });

    return tips;
  };

  const feedback = generateFeedback();

  const doShare = async()=>{
    try{ await Share.share({message:`I scored ${score}/100 on Voxira Speech Analysis!\nMode: ${mode} | Duration: ${formatTime(duration)}`}); }catch{}
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={()=>navigation.navigate('SpeechHome')}>
          <Ionicons name="arrow-back" size={22} color={C.textSec}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Analysis Result</Text>
        <TouchableOpacity style={s.shareBtn} onPress={doShare}>
          <Ionicons name="share-outline" size={22} color={C.textSec}/>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={{opacity:fadeAnim}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        {...(Platform.OS==='web'?{style:{overflowY:'auto',opacity:1} as any}:{})}
      >
        {/* Score card */}
        <View style={s.scoreCard}>
          <Text style={s.modeTag}>{mode}</Text>
          <View style={[s.scoreRing,{borderColor:`${color}40`}]}>
            <Text style={[s.scoreNum,{color}]}>{displayScore}</Text>
            <Text style={s.scoreMax}>/100</Text>
          </View>
          <Text style={[s.scoreLabel,{color}]}>{scoreLabel(score)}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}><Ionicons name="time-outline" size={14} color={C.textHint}/><Text style={s.metaTxt}>{formatTime(duration)}</Text></View>
            {fillerCount>0&&<><View style={s.metaDot}/><View style={s.metaItem}><Ionicons name="warning-outline" size={14} color={C.textHint}/><Text style={s.metaTxt}>{fillerCount} fillers</Text></View></>}
            {wpm>0&&<><View style={s.metaDot}/><View style={s.metaItem}><Ionicons name="speedometer-outline" size={14} color={C.textHint}/><Text style={s.metaTxt}>{wpm} WPM</Text></View></>}
          </View>
        </View>

        {/* Filler Word Breakdown */}
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
                    <View style={s.fillerBadge}>
                      <Text style={s.fillerCount}>{count}x</Text>
                    </View>
                  </View>
                ))
              }
            </View>
            <Text style={s.fillerNote}>
              💡 Every filler word costs ~2 points. Replacing them with pauses dramatically improves your score.
            </Text>
          </View>
        )}

        {/* Metrics */}
        {!noTranscript && (
          <>
            <Text style={s.sectionTitle}>Score Breakdown</Text>
            <View style={s.metricsGrid}>
              {METRICS.map((m,i)=>(
                <View key={i} style={s.metricCard}>
                  <View style={[s.metricIcon,{backgroundColor:`${m.color}10`}]}>
                    <Ionicons name={m.icon as any} size={18} color={m.color}/>
                  </View>
                  <Text style={s.metricLabel}>{m.label}</Text>
                  <Text style={[s.metricVal,{color:m.color}]}>{m.value}</Text>
                  <View style={s.metricBarBg}><View style={[s.metricBarFill,{width:`${m.value}%` as any,backgroundColor:m.color}]}/></View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Transcript */}
        <Text style={s.sectionTitle}>Transcript</Text>
        <View style={s.transcriptCard}>
          <Text style={s.transcriptTxt}>{noTranscript ? transcript : transcript}</Text>
        </View>

        {/* Feedback */}
        <Text style={s.sectionTitle}>Feedback</Text>
        {feedback.map((fb, i) => (
          <View key={i} style={[s.feedbackCard, { borderLeftColor: fb.color, backgroundColor: `${fb.color}10` }]}>
            <View style={s.feedbackHeader}>
              <Ionicons name={fb.icon as any} size={18} color={fb.color} />
              <Text style={[s.feedbackTitle, { color: fb.color }]}>{fb.title}</Text>
            </View>
            <Text style={s.feedbackText}>{fb.text}</Text>
          </View>
        ))}

        {/* 7-Day Improvement Plan */}
        <View style={s.planCard}>
          <Text style={s.planTitle}>📈 Your 7-Day Improvement Plan</Text>
          {[
            { day: 'Day 1-2', task: 'Record 2-minute speeches daily. Count your filler words each time.' },
            { day: 'Day 3-4', task: 'Practice the PAUSE technique. Every time you feel a filler coming, pause for 1 second instead.' },
            { day: 'Day 5-6', task: 'Read aloud for 10 minutes. Focus on clear enunciation of every syllable.' },
            { day: 'Day 7',   task: 'Record a 3-minute speech on any topic and compare with your Day 1 recording.' },
          ].map((item, i) => (
            <View key={i} style={s.planRow}>
              <View style={s.planDayBadge}>
                <Text style={s.planDay}>{item.day}</Text>
              </View>
              <Text style={s.planTask}>{item.task}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.secBtn} onPress={()=>navigation.navigate('Record',{mode})}>
            <Ionicons name="refresh-outline" size={18} color={C.text}/>
            <Text style={s.secBtnTxt}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primBtn} onPress={()=>navigation.navigate('SpeechHome')} activeOpacity={0.85}>
            <LinearGradient colors={['#2563EB','#1D4ED8']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primBtnGrad}>
              <Ionicons name="home-outline" size={18} color="#fff"/>
              <Text style={s.primBtnTxt}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{height:80}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,paddingBottom:8,backgroundColor:C.bg},
  backBtn:       {width:42,height:42,borderRadius:12,backgroundColor:C.bgCard,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  shareBtn:      {width:42,height:42,borderRadius:12,backgroundColor:C.bgCard,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  scroll:        {paddingHorizontal:20,paddingTop:12},
  scoreCard:     {backgroundColor:C.bgCard,borderRadius:18,padding:24,alignItems:'center',marginBottom:20,borderWidth:1,borderColor:C.border,gap:10},
  modeTag:       {fontSize:12,color:C.textHint,textTransform:'uppercase',letterSpacing:1},
  scoreRing:     {width:120,height:120,borderRadius:60,borderWidth:5,alignItems:'center',justifyContent:'center'},
  scoreNum:      {fontSize:40,fontWeight:'800',letterSpacing:-1},
  scoreMax:      {fontSize:12,color:C.textHint,marginTop:-4},
  scoreLabel:    {fontSize:16,fontWeight:'700'},
  metaRow:       {flexDirection:'row',alignItems:'center',gap:10},
  metaItem:      {flexDirection:'row',alignItems:'center',gap:4},
  metaTxt:       {fontSize:12,color:C.textSec},
  metaDot:       {width:3,height:3,borderRadius:2,backgroundColor:C.textHint},
  fillerCard:    {backgroundColor:'#FFF3E0',borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:'#FDCB6E'},
  fillerTitle:   {fontSize:15,fontWeight:'700',color:'#2D3436',marginBottom:12},
  fillerGrid:    {flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
  fillerChip:    {flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:20,paddingLeft:10,paddingRight:4,paddingVertical:4,gap:6,borderWidth:1,borderColor:'#FDCB6E'},
  fillerWord:    {fontSize:13,fontWeight:'600',color:'#E17055'},
  fillerBadge:   {backgroundColor:'#E17055',borderRadius:16,paddingHorizontal:8,paddingVertical:2},
  fillerCount:   {fontSize:11,fontWeight:'700',color:'#fff'},
  fillerNote:    {fontSize:12,color:'#636E72',lineHeight:18},
  sectionTitle:  {fontSize:16,fontWeight:'700',color:C.text,marginBottom:12},
  metricsGrid:   {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:20},
  metricCard:    {width:(W-50)/2,backgroundColor:C.bgCard,borderRadius:14,padding:14,borderWidth:1,borderColor:C.border,gap:6},
  metricIcon:    {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
  metricLabel:   {fontSize:12,color:C.textSec},
  metricVal:     {fontSize:24,fontWeight:'800'},
  metricBarBg:   {height:4,backgroundColor:C.surface,borderRadius:2,overflow:'hidden'},
  metricBarFill: {height:'100%',borderRadius:2},
  transcriptCard:{backgroundColor:C.bgCard,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20},
  transcriptTxt: {fontSize:13,color:C.textSec,lineHeight:22},
  feedbackCard:  {borderRadius:14,padding:14,marginBottom:10,borderLeftWidth:3},
  feedbackHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  feedbackTitle: {fontSize:14,fontWeight:'700'},
  feedbackText:  {fontSize:13,color:'#636E72',lineHeight:20},
  planCard:      {backgroundColor:'#EDE7F6',borderRadius:14,padding:16,marginBottom:16},
  planTitle:     {fontSize:15,fontWeight:'700',color:'#6C5CE7',marginBottom:12},
  planRow:       {flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:10},
  planDayBadge:  {backgroundColor:'#6C5CE7',borderRadius:8,paddingHorizontal:8,paddingVertical:4,minWidth:60,alignItems:'center'},
  planDay:       {fontSize:10,fontWeight:'700',color:'#fff'},
  planTask:      {flex:1,fontSize:12,color:'#2D3436',lineHeight:18},
  actionsRow:    {flexDirection:'row',gap:12},
  secBtn:        {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bgCard,borderRadius:12,borderWidth:1,borderColor:C.border,paddingVertical:14},
  secBtnTxt:     {fontSize:14,fontWeight:'600',color:C.text},
  primBtn:       {flex:2,borderRadius:12,overflow:'hidden'},
  primBtnGrad:   {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14},
  primBtnTxt:    {fontSize:14,fontWeight:'700',color:'#fff'},
});
