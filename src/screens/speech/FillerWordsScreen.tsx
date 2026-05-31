import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const FILLER_DATA = [
  { word:'um',         count:3, severity:'high',   tip:'Replace with a 1-2 second silent pause.' },
  { word:'uh',         count:2, severity:'high',   tip:'Breathe and pause instead of vocalising silence.' },
  { word:'like',       count:4, severity:'high',   tip:'"Like" as a filler dilutes your message. Remove it.' },
  { word:'you know',   count:1, severity:'medium', tip:'Trust that your audience follows you — no need to check in.' },
  { word:'basically',  count:1, severity:'medium', tip:'Start your point directly without this qualifier.' },
  { word:'actually',   count:0, severity:'low',    tip:'Only use "actually" when correcting something.' },
  { word:'literally',  count:0, severity:'low',    tip:'Reserve "literally" for truly literal statements.' },
  { word:'so',         count:2, severity:'medium', tip:'Starting sentences with "so" can sound uncertain.' },
];

const HOW_TO_TIPS = [
  { title:'The Power Pause',          desc:'When you feel the urge to say "um", just stop and breathe for 1-2 seconds. Silence sounds confident, not awkward.', icon:'pause-circle-outline', color:C.accent },
  { title:'Slow Down',                desc:'Fillers often appear when we speak faster than we think. Consciously slow your pace to give your brain time to form thoughts.', icon:'speedometer-outline', color:C.gold },
  { title:'Prepare Key Points',       desc:'Most fillers occur during transitions. Knowing your next point before you need it eliminates the gap where fillers creep in.', icon:'list-outline', color:C.green },
  { title:'Record & Review',          desc:'Use Voxira daily. Self-awareness is the fastest cure for filler words. After 2 weeks of practice, most users reduce fillers by 60%.', icon:'mic-outline', color:C.primary },
  { title:'Eye Contact',              desc:'Maintaining eye contact forces you to speak with intention, naturally reducing filler words.', icon:'eye-outline', color:C.accent },
];

function severityColor(s: string) {
  if (s === 'high')   return C.danger;
  if (s === 'medium') return C.gold;
  return C.green;
}

export default function FillerWordsScreen({ navigation, route }: any) {
  const {
    fillerCount = 11,
    transcript  = "Um, so today I wanted to talk about, like, the importance of clear communication. You know, basically, when we speak, uh, we need to make sure our message is getting across.",
  } = route?.params ?? {};

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(slide, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start();
  }, []);

  // Highlight filler words in transcript
  const highlightTranscript = () => {
    const fillerWords = FILLER_DATA.map(f => f.word);
    const parts: { text:string; isFiller:boolean }[] = [];
    let remaining = transcript;

    while (remaining.length > 0) {
      let earliestIdx = -1;
      let earliestWord = '';
      for (const fw of fillerWords) {
        const idx = remaining.toLowerCase().indexOf(fw.toLowerCase());
        if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
          earliestIdx = idx;
          earliestWord = fw;
        }
      }
      if (earliestIdx === -1) {
        parts.push({ text:remaining, isFiller:false });
        break;
      }
      if (earliestIdx > 0) {
        parts.push({ text:remaining.slice(0, earliestIdx), isFiller:false });
      }
      parts.push({ text:remaining.slice(earliestIdx, earliestIdx + earliestWord.length), isFiller:true });
      remaining = remaining.slice(earliestIdx + earliestWord.length);
    }
    return parts;
  };

  const transcriptParts = highlightTranscript();
  const totalFillers    = FILLER_DATA.reduce((a, b) => a + b.count, 0);
  const rating          = totalFillers === 0 ? 'Perfect' : totalFillers <= 3 ? 'Great' : totalFillers <= 6 ? 'Fair' : 'Needs Work';
  const ratingColor     = totalFillers === 0 ? C.green : totalFillers <= 3 ? C.accent : totalFillers <= 6 ? C.gold : C.danger;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Filler Words Report</Text>
          <View style={{ width:42 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={[{ opacity:fade, transform:[{ translateY:slide }] }, Platform.OS === 'web' && ({ height: '100vh', overflowY: 'scroll' } as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary card ─────────────────────────────────────────────── */}
        <View style={s.summaryCard}>
          <LinearGradient colors={['rgba(21,101,255,0.18)','rgba(21,101,255,0.04)']} style={[StyleSheet.absoluteFill, { borderRadius:22 }]} />
          <View style={s.summaryTop}>
            <View style={s.summaryLeft}>
              <Text style={s.summaryNum}>{totalFillers}</Text>
              <Text style={s.summaryLbl}>Total filler words</Text>
              <View style={[s.ratingBadge, { backgroundColor:`${ratingColor}22` }]}>
                <Text style={[s.ratingTxt, { color:ratingColor }]}>{rating}</Text>
              </View>
            </View>
            <View style={s.summaryRight}>
              <View style={s.miniStatRow}>
                <Ionicons name="mic-outline" size={14} color={C.muted} />
                <Text style={s.miniStatTxt}>3 unique words used</Text>
              </View>
              <View style={s.miniStatRow}>
                <Ionicons name="trending-down-outline" size={14} color={C.green} />
                <Text style={s.miniStatTxt}>-2 vs last session</Text>
              </View>
              <View style={s.miniStatRow}>
                <Ionicons name="time-outline" size={14} color={C.muted} />
                <Text style={s.miniStatTxt}>~1 per 20 seconds</Text>
              </View>
            </View>
          </View>

          {/* Bar chart */}
          <View style={s.chart}>
            {FILLER_DATA.filter(f => f.count > 0).map((f, i) => (
              <View key={i} style={s.chartCol}>
                <Text style={s.chartVal}>{f.count}</Text>
                <View style={s.chartBarBg}>
                  <LinearGradient
                    colors={[severityColor(f.severity), `${severityColor(f.severity)}88`]}
                    style={[s.chartBar, { height: Math.max(8, (f.count / 5) * 64) }]}
                  />
                </View>
                <Text style={s.chartLbl}>{f.word}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Filler word list ──────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Word-by-Word Breakdown</Text>
        <View style={s.fillerList}>
          {FILLER_DATA.map((f, i) => (
            <View key={i} style={[s.fillerRow, i === FILLER_DATA.length-1 && { borderBottomWidth:0 }]}>
              <View style={s.fillerLeft}>
                <View style={[s.fillerDot, { backgroundColor:`${severityColor(f.severity)}22` }]}>
                  <View style={[s.fillerDotInner, { backgroundColor:severityColor(f.severity) }]} />
                </View>
                <View>
                  <Text style={s.fillerWord}>"{f.word}"</Text>
                  <Text style={s.fillerTip} numberOfLines={2}>{f.tip}</Text>
                </View>
              </View>
              <View style={[s.fillerCountBadge, { backgroundColor:`${severityColor(f.severity)}18` }]}>
                <Text style={[s.fillerCountNum, { color:severityColor(f.severity) }]}>{f.count}×</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Highlighted transcript ────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Your Transcript</Text>
        <View style={s.transcriptCard}>
          <Text style={s.transcriptNote}>Filler words are <Text style={s.highlight}>highlighted</Text></Text>
          <Text style={s.transcriptTxt}>
            {transcriptParts.map((part, i) =>
              part.isFiller ? (
                <Text key={i} style={s.fillerHighlight}>{part.text}</Text>
              ) : (
                <Text key={i}>{part.text}</Text>
              )
            )}
          </Text>
        </View>

        {/* ── How to improve ───────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>How to Reduce Fillers</Text>
        <View style={s.tipsList}>
          {HOW_TO_TIPS.map((tip, i) => (
            <View key={i} style={s.tipCard}>
              <View style={[s.tipIcon, { backgroundColor:`${tip.color}18` }]}>
                <Ionicons name={tip.icon as any} size={22} color={tip.color} />
              </View>
              <View style={s.tipBody}>
                <Text style={s.tipTitle}>{tip.title}</Text>
                <Text style={s.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.practiceBtn}
          onPress={() => navigation.navigate('Record', { mode:'Free Speech' })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.practiceBtnGrad}>
            <Ionicons name="mic" size={20} color="#fff" />
            <Text style={s.practiceBtnTxt}>Practice Again</Text>
          </LinearGradient>
        </TouchableOpacity>

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
  scroll:        { paddingHorizontal:20, paddingTop:16 },
  summaryCard:   { borderRadius:22, padding:20, marginBottom:24, borderWidth:1, borderColor:'rgba(21,101,255,0.20)', overflow:'hidden', gap:16 },
  summaryTop:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  summaryLeft:   { gap:6 },
  summaryNum:    { fontSize:48, fontWeight:'800', color:C.text, letterSpacing:-2 },
  summaryLbl:    { fontSize:12, color:C.muted },
  ratingBadge:   { alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:4, borderRadius:20 },
  ratingTxt:     { fontSize:12, fontWeight:'700' },
  summaryRight:  { gap:8, alignItems:'flex-end' },
  miniStatRow:   { flexDirection:'row', alignItems:'center', gap:6 },
  miniStatTxt:   { fontSize:12, color:C.muted },
  chart:         { flexDirection:'row', alignItems:'flex-end', gap:14, justifyContent:'center', height:100 },
  chartCol:      { alignItems:'center', gap:4, flex:1 },
  chartVal:      { fontSize:12, fontWeight:'700', color:C.text },
  chartBarBg:    { width:'100%', alignItems:'center', justifyContent:'flex-end', height:64 },
  chartBar:      { width:'100%', borderRadius:6 },
  chartLbl:      { fontSize:10, color:C.muted, textAlign:'center' },
  sectionTitle:  { fontSize:15, fontWeight:'700', color:C.text, marginBottom:12 },
  fillerList:    { backgroundColor:C.bgCard, borderRadius:18, overflow:'hidden', borderWidth:1, borderColor:C.border, marginBottom:24 },
  fillerRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, borderBottomWidth:1, borderBottomColor:C.border, gap:12 },
  fillerLeft:    { flexDirection:'row', alignItems:'flex-start', gap:12, flex:1 },
  fillerDot:     { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 },
  fillerDotInner:{ width:10, height:10, borderRadius:5 },
  fillerWord:    { fontSize:14, fontWeight:'700', color:C.text, marginBottom:3 },
  fillerTip:     { fontSize:12, color:C.muted, lineHeight:17 },
  fillerCountBadge:{ paddingHorizontal:10, paddingVertical:5, borderRadius:10, flexShrink:0 },
  fillerCountNum:{ fontSize:14, fontWeight:'800' },
  transcriptCard:{ backgroundColor:C.bgCard, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:24 },
  transcriptNote:{ fontSize:12, color:C.muted, marginBottom:10 },
  highlight:     { color:C.danger, fontWeight:'600' },
  transcriptTxt: { fontSize:13, color:C.muted, lineHeight:22 },
  fillerHighlight:{ color:C.danger, fontWeight:'700', backgroundColor:'rgba(239,68,68,0.15)' },
  tipsList:      { gap:10, marginBottom:24 },
  tipCard:       { flexDirection:'row', gap:14, backgroundColor:C.bgCard, borderRadius:16, padding:14, borderWidth:1, borderColor:C.border, alignItems:'flex-start' },
  tipIcon:       { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  tipBody:       { flex:1 },
  tipTitle:      { fontSize:14, fontWeight:'700', color:C.text, marginBottom:4 },
  tipDesc:       { fontSize:12, color:C.muted, lineHeight:18 },
  practiceBtn:   { borderRadius:16, overflow:'hidden', marginBottom:8 },
  practiceBtnGrad:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:16 },
  practiceBtnTxt:{ fontSize:16, fontWeight:'700', color:'#fff' },
});

