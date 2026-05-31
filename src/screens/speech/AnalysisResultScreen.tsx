import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
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
    // Animate score counter
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

  // Generate REAL feedback based on actual data
  const FEEDBACK: {type:string,text:string}[] = [];
  if(noTranscript){
    FEEDBACK.push({type:'tip',text:'No transcript was captured. Connect a speech-to-text API (AssemblyAI or Whisper) for detailed analysis with filler word detection, pronunciation scoring, and specific feedback.'});
  } else {
    if(fillerCount===0) FEEDBACK.push({type:'pos',text:'No filler words detected in your speech. Great job maintaining clean delivery!'});
    else if(fillerCount<=3) FEEDBACK.push({type:'pos',text:`Only ${fillerCount} filler word${fillerCount>1?'s':''} detected. That is good control for a ${formatTime(duration)} session.`});
    else FEEDBACK.push({type:'neg',text:`${fillerCount} filler words detected. Try replacing them with short pauses — silence sounds more confident than "um" or "uh".`});

    if(wpm>=110&&wpm<=150) FEEDBACK.push({type:'pos',text:`Your pace of ${wpm} WPM is in the ideal range (110–150 WPM) for clear communication.`});
    else if(wpm>0&&wpm<110) FEEDBACK.push({type:'tip',text:`Your pace of ${wpm} WPM is slower than ideal. Try to speak at 110–150 WPM for better engagement.`});
    else if(wpm>150) FEEDBACK.push({type:'tip',text:`Your pace of ${wpm} WPM is faster than ideal. Slow down slightly — aim for 110–150 WPM.`});
  }
  if(duration<30) FEEDBACK.push({type:'tip',text:'Your session was quite short. Try recording for at least 1–2 minutes for more accurate analysis.'});

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
          <Text style={s.transcriptTxt}>
            {noTranscript
              ? transcript
              : transcript
            }
          </Text>
        </View>

        {/* Feedback */}
        <Text style={s.sectionTitle}>Feedback</Text>
        <View style={s.feedbackList}>
          {FEEDBACK.map((fb,i)=>(
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
  feedbackList:  {gap:10,marginBottom:20},
  feedbackRow:   {flexDirection:'row',gap:12,padding:14,borderRadius:12,borderLeftWidth:3,alignItems:'flex-start'},
  feedbackTxt:   {flex:1,fontSize:13,color:C.text,lineHeight:20},
  actionsRow:    {flexDirection:'row',gap:12},
  secBtn:        {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bgCard,borderRadius:12,borderWidth:1,borderColor:C.border,paddingVertical:14},
  secBtnTxt:     {fontSize:14,fontWeight:'600',color:C.text},
  primBtn:       {flex:2,borderRadius:12,overflow:'hidden'},
  primBtnGrad:   {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14},
  primBtnTxt:    {fontSize:14,fontWeight:'700',color:'#fff'},
});
