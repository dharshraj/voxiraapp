import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const W = Dimensions.get('window').width;

const STEPS = [
  { icon:'mic-outline',         title:'Record Your Speech', body:'Tap the microphone button on the Speech tab. Choose a mode — Free Speech, Presentation, Conversation, or Read Aloud — then tap Record. Speak naturally for at least 30 seconds for the best analysis.', color:'#0369A1' },
  { icon:'cloud-upload-outline',title:'Wait for Analysis', body:'After tapping Analyse, your audio is uploaded to AssemblyAI for transcription. This takes 10–30 seconds depending on your internet speed. A progress screen shows the current step.', color:'#15803D' },
  { icon:'bar-chart-outline',   title:'Review Your Results', body:'Your results appear across 9 screens — tap Next to move through them. You\'ll see your transcript, filler words, score breakdown, AI feedback, and a 7-day improvement plan.', color:'#7C3AED' },
  { icon:'trophy-outline',      title:'Track Progress', body:'Every completed session is saved to your history. Visit the Speech Dashboard to see your composite score trend, average WPM, and top filler words across all sessions.', color:'#B45309' },
  { icon:'flag-outline',        title:'Set Daily Goals', body:'Tap the Goals tab to set how many sessions you want per day. When you hit your target, you\'ll get a notification and a Coin reward. Streaks are tracked automatically.', color:'#DC2626' },
  { icon:'ellipse-outline',     title:'Earn Coins', body:'Coins are earned by unlocking achievements — completing sessions, building streaks, and hitting score thresholds. Visit the Earn tab to see your progress and available rewards.', color:'#F59E0B' },
];

export default function TutorialScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [step, setStep] = useState(0);
  const fade  = useRef(new Animated.Value(1)).current;

  const goTo = (next: number) => {
    fade.setValue(0);
    setStep(next);
    Animated.timing(fade, { toValue:1, duration:300, useNativeDriver:true }).start();
  };

  const current = STEPS[step];

  const s = StyleSheet.create({
    root:     { flex:1, backgroundColor:C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    stepTxt:  { fontSize:12, color:C.textMuted, fontWeight:'600' },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:0 },
    content:  { flex:1, paddingHorizontal:28, paddingTop:40, alignItems:'center' },
    iconBox:  { width:90, height:90, borderRadius:26, alignItems:'center', justifyContent:'center', marginBottom:32 },
    stepTitle:{ fontSize:24, fontWeight:'800', color:C.text, textAlign:'center', marginBottom:14 },
    stepBody: { fontSize:15, color:C.textSec, lineHeight:24, textAlign:'center' },
    dots:     { flexDirection:'row', justifyContent:'center', gap:6, paddingVertical:24 },
    dot:      { width:6, height:6, borderRadius:3, backgroundColor:C.border },
    dotActive:{ width:18, backgroundColor:C.primary },
    footer:   { flexDirection:'row', gap:10, paddingHorizontal:20, paddingBottom:40 },
    prevBtn:  { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor:C.surface, borderRadius:16, borderWidth:1, borderColor:C.border, paddingVertical:15 },
    prevTxt:  { fontSize:14, fontWeight:'600', color:C.textSec },
    nextBtn:  { flex:2, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor:C.primary, borderRadius:16, paddingVertical:15 },
    nextTxt:  { fontSize:14, fontWeight:'700', color:'#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>How to Use Voxira</Text>
        <Text style={s.stepTxt}>{step+1}/{STEPS.length}</Text>
      </View>
      <View style={s.divider} />
      <Animated.View style={[s.content, { opacity:fade }]}>
        <View style={[s.iconBox, { backgroundColor: current.color + '18' }]}>
          <Ionicons name={current.icon as any} size={44} color={current.color} />
        </View>
        <Text style={s.stepTitle}>{current.title}</Text>
        <Text style={s.stepBody}>{current.body}</Text>
      </Animated.View>
      <View style={s.dots}>
        {STEPS.map((_, i) => <View key={i} style={[s.dot, i===step && s.dotActive]} />)}
      </View>
      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity style={s.prevBtn} onPress={() => goTo(step-1)} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={16} color={C.textSec} />
            <Text style={s.prevTxt}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.nextBtn} onPress={() => step < STEPS.length-1 ? goTo(step+1) : navigation.goBack()} activeOpacity={0.85}>
          <Text style={s.nextTxt}>{step < STEPS.length-1 ? 'Next' : 'Done'}</Text>
          {step < STEPS.length-1 && <Ionicons name="chevron-forward" size={16} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
