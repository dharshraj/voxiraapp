import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert, Dimensions,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { evaluateInterviewAnswer, AnswerEvaluation } from '../../lib/openai';

const { width: W, height: H } = Dimensions.get('window');
const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};


function formatTime(secs:number){
  const m=Math.floor(secs/60).toString().padStart(2,'0');
  const s=(secs%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

export default function LiveInterviewScreen({ navigation, route }:any) {
  const {
    role='Software Engineer', type='behavioral',
    difficulty='medium', questions:sessionQs=[],
  } = route?.params ?? {};

  const [qIndex,      setQIndex]     = useState(0);
  const [phase,       setPhase]      = useState<'question'|'answering'|'evaluating'|'thinking'|'done'>('question');
  const [timer,       setTimer]      = useState(0);
  const [currentAnswer,setCurAnswer] = useState('');
  const [evaluations, setEvals]      = useState<AnswerEvaluation[]>([]);
  const [scores,      setScores]     = useState<number[]>([]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef  = useRef<any>(null);
  const pulseRef  = useRef<Animated.CompositeAnimation|null>(null);

  useEffect(()=>{
    Animated.timing(fadeAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
    return ()=>{ stopTimer(); pulseRef.current?.stop(); };
  },[]);

  const startTimer=()=>{ timerRef.current=setInterval(()=>setTimer(t=>t+1),1000); };
  const stopTimer =()=>{ if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;} };

  const startAnswer=()=>{
    setPhase('answering');
    setCurAnswer('');
    setTimer(0);
    startTimer();
    pulseRef.current=Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim,{toValue:1.15,duration:700,useNativeDriver:true}),
      Animated.timing(pulseAnim,{toValue:1,duration:700,useNativeDriver:true}),
    ]));
    pulseRef.current.start();
  };

  const submitAnswer=async ()=>{
    stopTimer();
    pulseRef.current?.stop();
    pulseAnim.setValue(1);
    setPhase('evaluating');

    const question = sessionQs[qIndex] ?? '';
    const answer   = currentAnswer.trim() || `(No written answer — answered verbally in ${formatTime(timer)})`;

    try {
      const evaluation = await evaluateInterviewAnswer(question, answer, role, difficulty);
      setEvals(prev=>[...prev, evaluation]);
      setScores(prev=>[...prev, evaluation.score]);
    } catch {
      const fallbackScore = 70;
      setEvals(prev=>[...prev, {
        score: fallbackScore, strengths:['Attempted the question'],
        weaknesses:['Could not evaluate — check API key'],
        modelAnswer:'', followUpQuestion:'',
      }]);
      setScores(prev=>[...prev, fallbackScore]);
    }

    if(qIndex+1>=sessionQs.length){
      setPhase('done');
    } else {
      setPhase('thinking');
      setTimeout(()=>{
        setQIndex(i=>i+1);
        setCurAnswer('');
        setTimer(0);
        setPhase('question');
      },1800);
    }
  };

  const endInterview=()=>{
    Alert.alert('End Interview?','Your progress so far will be saved.',[
      {text:'Continue',style:'cancel'},
      {text:'End',style:'destructive',onPress:()=>goToFeedback()},
    ]);
  };

  const goToFeedback=()=>{
    const avgScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):70;
    navigation.replace('Feedback',{role,type,difficulty,scores,questions:sessionQs,evaluations,avgScore});
  };

  useEffect(()=>{ if(phase==='done') setTimeout(goToFeedback,1000); },[phase]);

  const progress = sessionQs.length > 0 ? (qIndex+1)/sessionQs.length : 1;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040','#0A1628','#050D1A']} style={StyleSheet.absoluteFill}/>

      {/* Header */}
      <Animated.View style={[s.header,{opacity:fadeAnim}]}>
        <TouchableOpacity style={s.endBtn} onPress={endInterview}>
          <Text style={s.endBtnTxt}>End</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{role}</Text>
          <Text style={s.headerSub}>Question {Math.min(qIndex+1,sessionQs.length)} of {sessionQs.length}</Text>
        </View>
        <View style={s.timerBadge}>
          <Ionicons name="time-outline" size={13} color={C.accent}/>
          <Text style={s.timerTxt}>{formatTime(timer)}</Text>
        </View>
      </Animated.View>

      {/* Progress bar */}
      <View style={s.progressBar}>
        <LinearGradient colors={[C.primary,C.accent]} start={{x:0,y:0}} end={{x:1,y:0}}
          style={[s.progressFill,{width:`${progress*100}%` as any}]}/>
      </View>

      <Animated.ScrollView
        style={[s.body,{opacity:fadeAnim},Platform.OS==='web'&&({overflowY:'auto'} as any)]}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >

        {/* AI avatar */}
        <View style={s.avatarWrap}>
          <LinearGradient colors={['#7C3AED','#4C1D95']} style={s.avatarGrad}>
            <Ionicons name="logo-electron" size={36} color="#fff"/>
          </LinearGradient>
          <View style={s.avatarStatus}>
            <View style={s.avatarDot}/>
            <Text style={s.avatarStatusTxt}>AI Interviewer</Text>
          </View>
        </View>

        {/* Question card */}
        {phase!=='done' && (
          <View style={s.questionCard}>
            <LinearGradient colors={['rgba(124,58,237,0.18)','rgba(124,58,237,0.04)']} style={[StyleSheet.absoluteFill,{borderRadius:20}]}/>
            <View style={s.qNumBadge}>
              <Text style={s.qNumTxt}>Q{qIndex+1}</Text>
            </View>
            <Text style={s.questionTxt}>
              {phase==='thinking' ? '...' : sessionQs[qIndex]}
            </Text>
          </View>
        )}

        {phase==='done' && (
          <View style={s.doneCard}>
            <Text style={s.doneEmoji}>🎉</Text>
            <Text style={s.doneTitle}>Interview Complete!</Text>
            <Text style={s.doneSub}>Generating your feedback...</Text>
          </View>
        )}

        {/* Answer tips */}
        {phase==='question' && (
          <View style={s.tipBox}>
            <Ionicons name="bulb-outline" size={14} color={C.gold}/>
            <Text style={s.tipTxt}>Use the STAR method: Situation → Task → Action → Result</Text>
          </View>
        )}

        {/* Answer text input */}
        {phase==='answering' && (
          <>
            <View style={s.recBar}>
              <View style={s.recDot}/>
              <Text style={s.recTxt}>Answering — {formatTime(timer)}</Text>
            </View>
            <TextInput
              style={s.answerInput}
              placeholder="Type your answer here (or speak — just tap Done when finished)…"
              placeholderTextColor={C.hint}
              value={currentAnswer}
              onChangeText={setCurAnswer}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </>
        )}

        {/* Evaluating spinner */}
        {phase==='evaluating' && (
          <View style={s.evalBar}>
            <ActivityIndicator size="small" color={C.accent}/>
            <Text style={s.evalTxt}>AI is evaluating your answer…</Text>
          </View>
        )}

        {/* Score list so far */}
        {scores.length>0 && phase==='question' && (
          <View style={s.scoresSoFar}>
            {scores.map((sc,i)=>{
              const col=sc>=80?C.green:sc>=65?C.accent:C.gold;
              return (
                <View key={i} style={[s.miniScore,{backgroundColor:`${col}18`}]}>
                  <Text style={[s.miniScoreTxt,{color:col}]}>Q{i+1}: {sc}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* Controls */}
      <Animated.View style={[s.controls,{opacity:fadeAnim}]}>
        {phase==='question' && (
          <TouchableOpacity style={s.primaryBtn} onPress={startAnswer} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED','#4C1D95']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primaryBtnGrad}>
              <Animated.View style={{transform:[{scale:pulseAnim}]}}>
                <Ionicons name="mic" size={22} color="#fff"/>
              </Animated.View>
              <Text style={s.primaryBtnTxt}>Start Answering</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {phase==='answering' && (
          <TouchableOpacity style={s.primaryBtn} onPress={submitAnswer} activeOpacity={0.85}>
            <LinearGradient colors={['#22C55E','#15803D']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primaryBtnGrad}>
              <Ionicons name="checkmark-circle" size={22} color="#fff"/>
              <Text style={s.primaryBtnTxt}>Submit Answer</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {(phase==='evaluating'||phase==='thinking') && (
          <View style={s.thinkingBar}>
            <ActivityIndicator size="small" color={C.muted}/>
            <Text style={s.thinkingTxt}>{phase==='evaluating' ? 'AI evaluating your answer…' : 'Next question…'}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex:1,backgroundColor:C.bg,...(Platform.OS==='web'&&{height:'100vh' as any,overflow:'hidden' as any})},
  header:       {flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,paddingBottom:12,gap:10},
  endBtn:       {paddingHorizontal:14,paddingVertical:6,borderRadius:10,borderWidth:1,borderColor:'rgba(239,68,68,0.4)',backgroundColor:'rgba(239,68,68,0.1)'},
  endBtnTxt:    {fontSize:13,color:'#EF4444',fontWeight:'600'},
  headerCenter: {flex:1,alignItems:'center'},
  headerTitle:  {fontSize:14,fontWeight:'700',color:C.text},
  headerSub:    {fontSize:12,color:C.muted,marginTop:2},
  timerBadge:   {flexDirection:'row',alignItems:'center',gap:4,backgroundColor:C.bgCard,borderRadius:10,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:C.border},
  timerTxt:     {fontSize:13,fontWeight:'700',color:C.accent,fontVariant:['tabular-nums']},
  progressBar:  {height:3,backgroundColor:'rgba(255,255,255,0.08)',marginHorizontal:20,borderRadius:2,overflow:'hidden',marginBottom:16},
  progressFill: {height:'100%',borderRadius:2},
  body:         {flex:1,paddingHorizontal:20},
  bodyContent:  {gap:16,paddingBottom:16},
  avatarWrap:   {alignItems:'center',gap:8},
  avatarGrad:   {width:80,height:80,borderRadius:24,alignItems:'center',justifyContent:'center'},
  avatarStatus: {flexDirection:'row',alignItems:'center',gap:6},
  avatarDot:    {width:7,height:7,borderRadius:4,backgroundColor:C.green},
  avatarStatusTxt:{fontSize:12,color:C.muted},
  questionCard: {borderRadius:20,padding:20,borderWidth:1,borderColor:'rgba(124,58,237,0.25)',overflow:'hidden',minHeight:140,justifyContent:'center'},
  qNumBadge:    {backgroundColor:'rgba(124,58,237,0.25)',borderRadius:10,paddingHorizontal:10,paddingVertical:4,alignSelf:'flex-start',marginBottom:12},
  qNumTxt:      {fontSize:11,fontWeight:'700',color:C.purple},
  questionTxt:  {fontSize:16,color:C.text,lineHeight:26,fontWeight:'500'},
  doneCard:     {backgroundColor:C.bgCard,borderRadius:20,padding:32,borderWidth:1,borderColor:C.border,alignItems:'center',gap:12},
  doneEmoji:    {fontSize:48},
  doneTitle:    {fontSize:20,fontWeight:'700',color:C.text},
  doneSub:      {fontSize:14,color:C.muted},
  tipBox:       {flexDirection:'row',gap:8,backgroundColor:'rgba(245,158,11,0.08)',borderRadius:14,padding:12,borderWidth:1,borderColor:'rgba(245,158,11,0.20)',alignItems:'center'},
  tipTxt:       {flex:1,fontSize:12,color:C.muted,lineHeight:18},
  recBar:       {flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'rgba(239,68,68,0.10)',borderRadius:14,padding:12,borderWidth:1,borderColor:'rgba(239,68,68,0.25)'},
  recDot:       {width:10,height:10,borderRadius:5,backgroundColor:'#EF4444'},
  recTxt:       {fontSize:13,color:'#EF4444',fontWeight:'500'},
  scoresSoFar:  {flexDirection:'row',flexWrap:'wrap',gap:8},
  miniScore:    {paddingHorizontal:12,paddingVertical:5,borderRadius:10},
  miniScoreTxt: {fontSize:12,fontWeight:'700'},
  controls:     {paddingHorizontal:20,paddingBottom:Platform.OS==='ios'?40:24,paddingTop:8},
  primaryBtn:   {borderRadius:16,overflow:'hidden'},
  primaryBtnGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  primaryBtnTxt:{fontSize:16,fontWeight:'700',color:'#fff'},
  thinkingBar:  {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  thinkingTxt:  {fontSize:14,color:C.muted},
  answerInput:  {backgroundColor:C.bgCard,borderRadius:16,padding:16,color:C.text,fontSize:14,lineHeight:22,minHeight:120,borderWidth:1,borderColor:'rgba(21,101,255,0.35)',textAlignVertical:'top'},
  evalBar:      {flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'rgba(79,195,247,0.10)',borderRadius:14,padding:12,borderWidth:1,borderColor:'rgba(79,195,247,0.20)'},
  evalTxt:      {fontSize:13,color:C.accent,fontWeight:'500'},
});
