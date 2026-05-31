import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert,
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

const CHALLENGES = [
  {
    id:'1', title:'The 60-Second Pitch',
    desc:'Describe yourself and your biggest achievement in exactly 60 seconds. No more, no less.',
    icon:'person-outline', color:C.accent, grad:['#1565FF','#0D47A1'],
    difficulty:'Easy', xp:50, tips:['Use the STAR format','Start with your name and role','End with a memorable statement'],
    done:false,
  },
  {
    id:'2', title:'Filler-Free Zone',
    desc:'Speak for 2 minutes on any topic without using a single filler word (um, uh, like, you know).',
    icon:'shield-checkmark-outline', color:C.green, grad:['#059669','#065F46'],
    difficulty:'Medium', xp:100, tips:['Pause instead of filling','Breathe between sentences','Slow your pace down'],
    done:false,
  },
  {
    id:'3', title:'Storytelling Master',
    desc:'Tell a personal story using the beginning, middle, and end structure in under 3 minutes.',
    icon:'book-outline', color:C.purple, grad:['#7C3AED','#4C1D95'],
    difficulty:'Medium', xp:100, tips:['Set the scene clearly','Build tension in the middle','End with a lesson learned'],
    done:true,
  },
  {
    id:'4', title:'The Persuader',
    desc:'Pick any opinion and argue for it convincingly for 90 seconds. Use facts and emotion.',
    icon:'megaphone-outline', color:C.gold, grad:['#D97706','#92400E'],
    difficulty:'Hard', xp:150, tips:['State your position first','Give 3 supporting reasons','Close with a strong call to action'],
    done:false,
  },
  {
    id:'5', title:'Impromptu Speaker',
    desc:"You'll be given a random topic. Speak about it for 2 minutes with no preparation.",
    icon:'shuffle-outline', color:C.danger, grad:['#DC2626','#991B1B'],
    difficulty:'Hard', xp:200, tips:['Take 5 seconds to gather your thoughts','Use the PREP method: Point, Reason, Example, Point','Speak slowly and deliberately'],
    done:false,
  },
];

const WEEKLY_DONE = 1;
const WEEKLY_TOTAL = 5;
const TOTAL_XP = 150;

export default function DailyChallengeScreen({ navigation }: any) {
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [selected,   setSelected]   = useState<string|null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const startChallenge = (c: typeof CHALLENGES[0]) => {
    Alert.alert(
      `Start: ${c.title}`,
      `${c.desc}\n\n⭐ Earn ${c.xp} XP on completion!`,
      [
        { text:'Cancel', style:'cancel' },
        {
          text:'Start Recording',
          onPress: () => navigation.navigate('Record', { mode: c.title }),
        },
      ]
    );
  };

  const diffColor = (d: string) =>
    d==='Easy' ? C.green : d==='Medium' ? C.gold : C.danger;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Daily Challenges</Text>
            <Text style={s.headerSub}>Complete challenges to earn XP</Text>
          </View>
          <View style={{ width:42 }} />
        </View>

        {/* XP + Progress */}
        <View style={s.xpCard}>
          <LinearGradient colors={['rgba(245,158,11,0.20)','rgba(245,158,11,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]} />
          <View style={s.xpLeft}>
            <Ionicons name="star" size={28} color={C.gold} />
            <View>
              <Text style={s.xpVal}>{TOTAL_XP} XP</Text>
              <Text style={s.xpLbl}>Total earned this week</Text>
            </View>
          </View>
          <View style={s.xpRight}>
            <Text style={s.xpProgress}>{WEEKLY_DONE}/{WEEKLY_TOTAL}</Text>
            <Text style={s.xpProgressLbl}>completed</Text>
          </View>
        </View>

        {/* Week progress bar */}
        <View style={s.weekBar}>
          <View style={s.weekBarBg}>
            <LinearGradient
              colors={[C.gold, '#F59E0B88']}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={[s.weekBarFill, { width:`${(WEEKLY_DONE/WEEKLY_TOTAL)*100}%` as any }]}
            />
          </View>
          <Text style={s.weekBarLbl}>{WEEKLY_TOTAL - WEEKLY_DONE} challenges remaining today</Text>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.sectionTitle}>Today's Challenges</Text>

        {challenges.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.challengeCard, c.done && s.challengeDone, selected===c.id && s.challengeSelected]}
            onPress={() => setSelected(selected===c.id ? null : c.id)}
            activeOpacity={0.85}
          >
            {/* Card header */}
            <View style={s.cHead}>
              <LinearGradient colors={c.grad as any} style={s.cIcon}>
                <Ionicons name={c.icon as any} size={22} color="#fff" />
              </LinearGradient>
              <View style={s.cMeta}>
                <Text style={[s.cTitle, c.done && s.cTitleDone]}>{c.title}</Text>
                <View style={s.cTagRow}>
                  <View style={[s.diffTag, { backgroundColor:`${diffColor(c.difficulty)}18` }]}>
                    <Text style={[s.diffTagTxt, { color:diffColor(c.difficulty) }]}>{c.difficulty}</Text>
                  </View>
                  <View style={s.xpTag}>
                    <Ionicons name="star" size={11} color={C.gold} />
                    <Text style={s.xpTagTxt}>{c.xp} XP</Text>
                  </View>
                </View>
              </View>
              {c.done
                ? <Ionicons name="checkmark-circle" size={26} color={C.green} />
                : <Ionicons name={selected===c.id ? 'chevron-up' : 'chevron-down'} size={20} color={C.muted} />
              }
            </View>

            {/* Expanded content */}
            {selected === c.id && !c.done && (
              <>
                <View style={s.cDivider} />
                <Text style={s.cDesc}>{c.desc}</Text>
                <View style={s.cTips}>
                  <Text style={s.cTipsTitle}>Tips for this challenge:</Text>
                  {c.tips.map((tip,i) => (
                    <View key={i} style={s.cTipRow}>
                      <View style={s.cTipDot} />
                      <Text style={s.cTipTxt}>{tip}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={s.startBtn} onPress={() => startChallenge(c)} activeOpacity={0.85}>
                  <LinearGradient colors={c.grad as any} start={{x:0,y:0}} end={{x:1,y:0}} style={s.startBtnGrad}>
                    <Ionicons name="mic" size={18} color="#fff" />
                    <Text style={s.startBtnTxt}>Start Challenge</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {c.done && (
              <View style={s.completedBanner}>
                <Ionicons name="checkmark-circle" size={14} color={C.green} />
                <Text style={s.completedTxt}>Challenge completed! +{c.xp} XP earned</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Tips box */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={C.accent} />
          <View style={{ flex:1 }}>
            <Text style={s.infoTitle}>How challenges work</Text>
            <Text style={s.infoDesc}>Complete each challenge by recording yourself and achieving at least a 70/100 score. New challenges appear every day at midnight.</Text>
          </View>
        </View>

        <View style={{ height:40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex:1, backgroundColor:C.bg },
  headerBg:        { paddingBottom:16 },
  header:          { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:36, marginBottom:16, gap:10 },
  backBtn:         { width:42, height:42, borderRadius:13, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  headerCenter:    { flex:1 },
  headerTitle:     { fontSize:20, fontWeight:'700', color:C.text },
  headerSub:       { fontSize:12, color:C.muted, marginTop:2 },
  xpCard:          { marginHorizontal:20, borderRadius:18, padding:16, borderWidth:1, borderColor:'rgba(245,158,11,0.25)', flexDirection:'row', justifyContent:'space-between', alignItems:'center', overflow:'hidden', marginBottom:12 },
  xpLeft:          { flexDirection:'row', alignItems:'center', gap:12 },
  xpVal:           { fontSize:20, fontWeight:'800', color:C.gold },
  xpLbl:           { fontSize:11, color:C.muted, marginTop:2 },
  xpRight:         { alignItems:'center' },
  xpProgress:      { fontSize:22, fontWeight:'800', color:C.text },
  xpProgressLbl:   { fontSize:11, color:C.muted },
  weekBar:         { paddingHorizontal:20, gap:6 },
  weekBarBg:       { height:6, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' },
  weekBarFill:     { height:'100%', borderRadius:3 },
  weekBarLbl:      { fontSize:11, color:C.muted },
  scroll:          { paddingHorizontal:20, paddingTop:20 },
  sectionTitle:    { fontSize:15, fontWeight:'700', color:C.text, marginBottom:14 },
  challengeCard:   { backgroundColor:C.bgCard, borderRadius:20, padding:16, borderWidth:1, borderColor:C.border, marginBottom:12 },
  challengeDone:   { opacity:0.7 },
  challengeSelected:{ borderColor:'rgba(21,101,255,0.40)' },
  cHead:           { flexDirection:'row', alignItems:'center', gap:12 },
  cIcon:           { width:48, height:48, borderRadius:16, alignItems:'center', justifyContent:'center' },
  cMeta:           { flex:1, gap:6 },
  cTitle:          { fontSize:14, fontWeight:'700', color:C.text },
  cTitleDone:      { textDecorationLine:'line-through', color:C.muted },
  cTagRow:         { flexDirection:'row', gap:8 },
  diffTag:         { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  diffTagTxt:      { fontSize:10, fontWeight:'700' },
  xpTag:           { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(245,158,11,0.12)', paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  xpTagTxt:        { fontSize:10, fontWeight:'700', color:C.gold },
  cDivider:        { height:1, backgroundColor:C.border, marginVertical:14 },
  cDesc:           { fontSize:13, color:C.muted, lineHeight:20, marginBottom:14 },
  cTips:           { backgroundColor:'rgba(255,255,255,0.04)', borderRadius:14, padding:12, marginBottom:14, gap:8 },
  cTipsTitle:      { fontSize:12, fontWeight:'600', color:C.text, marginBottom:4 },
  cTipRow:         { flexDirection:'row', alignItems:'flex-start', gap:8 },
  cTipDot:         { width:5, height:5, borderRadius:3, backgroundColor:C.primary, marginTop:7 },
  cTipTxt:         { flex:1, fontSize:12, color:C.muted, lineHeight:18 },
  startBtn:        { borderRadius:14, overflow:'hidden' },
  startBtnGrad:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:13 },
  startBtnTxt:     { fontSize:14, fontWeight:'700', color:'#fff' },
  completedBanner: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(34,197,94,0.10)', borderRadius:10, padding:10, marginTop:10 },
  completedTxt:    { fontSize:12, color:C.green, fontWeight:'500' },
  infoCard:        { flexDirection:'row', gap:12, backgroundColor:C.bgCard, borderRadius:16, padding:14, borderWidth:1, borderColor:C.border, marginTop:8, alignItems:'flex-start' },
  infoTitle:       { fontSize:13, fontWeight:'700', color:C.text, marginBottom:4 },
  infoDesc:        { fontSize:12, color:C.muted, lineHeight:18 },
});
