import React, { useRef, useEffect } from 'react';
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

function scoreColor(s: number) {
  return s >= 85 ? C.green : s >= 70 ? C.accent : s >= 55 ? C.gold : C.danger;
}

export default function SessionDetailScreen({ navigation, route }: any) {
  const {
    score       = 87,
    duration    = 245,
    mode        = 'Free Speech',
    date        = 'Today, 2:30 PM',
    fillerCount = 3,
    details     = { clarity:87, pace:82, pronunciation:85, confidence:79 },
    transcript  = "Today I want to talk about the importance of daily practice. When we commit to small consistent habits, the results over time are extraordinary. Think about any skill you have developed...",
  } = route?.params ?? {};

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const color = scoreColor(score);
  const m = Math.floor(duration/60).toString().padStart(2,'0');
  const s2 = (duration%60).toString().padStart(2,'0');
  const durationStr = `${m}:${s2}`;

  const doShare = async () => {
    try {
      await Share.share({ message:`I scored ${score}/100 on Voxira Speech! 🎙️ Mode: ${mode}` });
    } catch {}
  };

  const METRICS = [
    { label:'Clarity',       value:details.clarity,       icon:'eye-outline',         color:C.accent  },
    { label:'Pace',          value:details.pace,          icon:'speedometer-outline',  color:C.purple  },
    { label:'Pronunciation', value:details.pronunciation, icon:'volume-high-outline',  color:C.green   },
    { label:'Confidence',    value:details.confidence,    icon:'trending-up-outline',  color:C.gold    },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Session Detail</Text>
          <TouchableOpacity style={s.shareBtn} onPress={doShare}>
            <Ionicons name="share-outline" size={22} color={C.muted} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{ opacity:fade }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero score ───────────────────────────────────────────────── */}
        <View style={s.heroCard}>
          <LinearGradient colors={['rgba(21,101,255,0.18)','rgba(21,101,255,0.04)']} style={[StyleSheet.absoluteFill,{borderRadius:22}]} />
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroMode}>{mode}</Text>
              <Text style={s.heroDate}>{date}</Text>
            </View>
            <View style={[s.scoreCircle, { borderColor:`${color}55` }]}>
              <Text style={[s.scoreNum, { color }]}>{score}</Text>
              <Text style={s.scoreMax}>/100</Text>
            </View>
          </View>
          <View style={s.heroStats}>
            {[
              { icon:'time-outline',    val:durationStr,        lbl:'Duration'    },
              { icon:'warning-outline', val:`${fillerCount}`,   lbl:'Fillers'     },
              { icon:'speedometer-outline', val:'~120',         lbl:'WPM'         },
            ].map((st,i) => (
              <View key={i} style={s.heroStat}>
                <Ionicons name={st.icon as any} size={14} color={C.muted} />
                <Text style={s.heroStatVal}>{st.val}</Text>
                <Text style={s.heroStatLbl}>{st.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Score breakdown ──────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Score Breakdown</Text>
        <View style={s.metricsGrid}>
          {METRICS.map((m2,i) => (
            <View key={i} style={s.metricCard}>
              <View style={[s.metricIcon, { backgroundColor:`${m2.color}18` }]}>
                <Ionicons name={m2.icon as any} size={20} color={m2.color} />
              </View>
              <Text style={s.metricLabel}>{m2.label}</Text>
              <Text style={[s.metricVal, { color:m2.color }]}>{m2.value}</Text>
              <View style={s.metricBarBg}>
                <View style={[s.metricBarFill, { width:`${m2.value}%` as any, backgroundColor:m2.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* ── Transcript ───────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Transcript</Text>
        <View style={s.transcriptCard}>
          <Text style={s.transcriptTxt}>{transcript}</Text>
        </View>

        {/* ── Filler detail ────────────────────────────────────────────── */}
        <View style={s.fillerCard}>
          <View style={[s.fillerLeft, { borderColor:`${fillerCount>5?C.danger:fillerCount>2?C.gold:C.green}60` }]}>
            <Text style={[s.fillerNum, { color:fillerCount>5?C.danger:fillerCount>2?C.gold:C.green }]}>{fillerCount}</Text>
            <Text style={s.fillerLbl}>fillers</Text>
          </View>
          <View style={s.fillerRight}>
            <Text style={s.fillerTitle}>{fillerCount===0?'Perfect!':fillerCount<=3?'Very Good':fillerCount<=6?'Moderate':'High Usage'}</Text>
            <Text style={s.fillerDesc}>{fillerCount<=3?'Minimal filler words. Excellent control!':'Try replacing fillers with a short confident pause.'}</Text>
            <TouchableOpacity style={s.fillerBtn} onPress={() => navigation.navigate('FillerWords', { fillerCount, transcript })}>
              <Text style={s.fillerBtnTxt}>Full filler report →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <View style={s.actRow}>
          <TouchableOpacity style={s.secBtn} onPress={() => navigation.navigate('Record', { mode })}>
            <Ionicons name="refresh-outline" size={18} color={C.text} />
            <Text style={s.secBtnTxt}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primBtn} onPress={() => navigation.navigate('SpeechHome')} activeOpacity={0.85}>
            <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primBtnGrad}>
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={s.primBtnTxt}>Speech Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height:40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex:1, backgroundColor:C.bg },
  headerBg:      { paddingBottom:12 },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:36 },
  backBtn:       { width:42, height:42, borderRadius:13, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  headerTitle:   { fontSize:17, fontWeight:'700', color:C.text },
  shareBtn:      { width:42, height:42, borderRadius:13, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  scroll:        { paddingHorizontal:20, paddingTop:16 },
  heroCard:      { borderRadius:22, padding:20, borderWidth:1, borderColor:'rgba(21,101,255,0.20)', overflow:'hidden', gap:16, marginBottom:24 },
  heroTop:       { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  heroMode:      { fontSize:18, fontWeight:'700', color:C.text, marginBottom:4 },
  heroDate:      { fontSize:12, color:C.muted },
  scoreCircle:   { width:80, height:80, borderRadius:40, borderWidth:4, alignItems:'center', justifyContent:'center' },
  scoreNum:      { fontSize:26, fontWeight:'800' },
  scoreMax:      { fontSize:11, color:C.hint },
  heroStats:     { flexDirection:'row', justifyContent:'space-around', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:14, padding:12 },
  heroStat:      { alignItems:'center', gap:4 },
  heroStatVal:   { fontSize:14, fontWeight:'700', color:C.text },
  heroStatLbl:   { fontSize:10, color:C.muted },
  sectionTitle:  { fontSize:15, fontWeight:'700', color:C.text, marginBottom:12 },
  metricsGrid:   { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:24 },
  metricCard:    { width:'47%', backgroundColor:C.bgCard, borderRadius:18, padding:14, borderWidth:1, borderColor:C.border, gap:6 },
  metricIcon:    { width:38, height:38, borderRadius:11, alignItems:'center', justifyContent:'center' },
  metricLabel:   { fontSize:12, color:C.muted },
  metricVal:     { fontSize:26, fontWeight:'800' },
  metricBarBg:   { height:4, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' },
  metricBarFill: { height:'100%', borderRadius:2 },
  transcriptCard:{ backgroundColor:C.bgCard, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:16 },
  transcriptTxt: { fontSize:13, color:C.muted, lineHeight:22 },
  fillerCard:    { flexDirection:'row', backgroundColor:C.bgCard, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, gap:16, marginBottom:24, alignItems:'center' },
  fillerLeft:    { width:70, height:70, borderRadius:35, borderWidth:3, alignItems:'center', justifyContent:'center' },
  fillerNum:     { fontSize:24, fontWeight:'800' },
  fillerLbl:     { fontSize:10, color:C.muted },
  fillerRight:   { flex:1 },
  fillerTitle:   { fontSize:14, fontWeight:'700', color:C.text, marginBottom:4 },
  fillerDesc:    { fontSize:12, color:C.muted, lineHeight:18, marginBottom:8 },
  fillerBtn:     {},
  fillerBtnTxt:  { fontSize:12, color:C.primary, fontWeight:'600' },
  actRow:        { flexDirection:'row', gap:12 },
  secBtn:        { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:C.bgCard, borderRadius:14, borderWidth:1, borderColor:C.border, paddingVertical:14 },
  secBtnTxt:     { fontSize:14, fontWeight:'600', color:C.text },
  primBtn:       { flex:2, borderRadius:14, overflow:'hidden' },
  primBtnGrad:   { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14 },
  primBtnTxt:    { fontSize:14, fontWeight:'700', color:'#fff' },
});
