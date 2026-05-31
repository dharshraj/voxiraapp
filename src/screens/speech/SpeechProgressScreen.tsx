import React, { useRef, useEffect, useState } from 'react';
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
  gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const WEEKLY_SCORES = [72, 78, 75, 83, 80, 87, 84];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const MONTHLY_DATA = [
  { month:'Jan', avg:68 }, { month:'Feb', avg:72 }, { month:'Mar', avg:75 },
  { month:'Apr', avg:79 }, { month:'May', avg:84 }, { month:'Jun', avg:87 },
];

const METRICS_PROGRESS = [
  { label:'Clarity',        current:87, previous:74, icon:'eye-outline',         color:C.accent  },
  { label:'Pace',           current:82, previous:70, icon:'speedometer-outline',  color:C.purple  },
  { label:'Pronunciation',  current:85, previous:78, icon:'volume-high-outline',  color:C.green   },
  { label:'Confidence',     current:79, previous:65, icon:'trending-up-outline',  color:C.gold    },
];

const ACHIEVEMENTS = [
  { title:'First Recording',   desc:'Completed your first session',   icon:'mic',    done:true,  color:C.accent  },
  { title:'5-Day Streak',      desc:'Practised 5 days in a row',      icon:'flame',  done:true,  color:C.gold    },
  { title:'Score 90+',         desc:'Achieve a clarity score of 90+', icon:'trophy', done:false, color:C.purple  },
  { title:'10 Sessions',       desc:'Complete 10 speech sessions',    icon:'star',   done:true,  color:C.green   },
  { title:'Filler-Free',       desc:'Session with zero filler words', icon:'shield', done:false, color:C.primary },
];

export default function SpeechProgressScreen({ navigation }: any) {
  const fade  = useRef(new Animated.Value(0)).current;
  const [tab, setTab] = useState<'weekly'|'monthly'>('weekly');

  useEffect(() => {
    Animated.timing(fade, { toValue:1, duration:500, useNativeDriver:true }).start();
  }, []);

  const maxScore = Math.max(...WEEKLY_SCORES);
  const chartH   = 120;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <LinearGradient colors={['#0F2040', C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Speech Progress</Text>
          <View style={{ width:42 }} />
        </View>

        {/* Summary pills */}
        <View style={s.pillRow}>
          {[
            { val:'24',   lbl:'Sessions',   icon:'mic',          color:C.accent  },
            { val:'84',   lbl:'Avg Score',  icon:'star',         color:C.gold    },
            { val:'+16',  lbl:'Improved',   icon:'trending-up',  color:C.green   },
            { val:'4🔥',  lbl:'Streak',     icon:'flame',        color:C.danger  },
          ].map((p,i) => (
            <View key={i} style={s.pill}>
              <Ionicons name={p.icon as any} size={14} color={p.color} />
              <Text style={s.pillVal}>{p.val}</Text>
              <Text style={s.pillLbl}>{p.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Score chart ──────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Score Over Time</Text>
            <View style={s.tabRow}>
              {(['weekly','monthly'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.tabChip, tab===t && s.tabChipActive]} onPress={() => setTab(t)}>
                  <Text style={[s.tabChipTxt, tab===t && s.tabChipTxtActive]}>
                    {t === 'weekly' ? 'Week' : 'Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {tab === 'weekly' ? (
            <View style={s.chartArea}>
              {/* Y-axis labels */}
              <View style={s.yAxis}>
                {[100,75,50,25].map(v => (
                  <Text key={v} style={s.yLbl}>{v}</Text>
                ))}
              </View>
              {/* Bars */}
              <View style={s.bars}>
                {WEEKLY_SCORES.map((score, i) => {
                  const h   = (score / 100) * chartH;
                  const col = score >= 85 ? C.green : score >= 70 ? C.accent : C.gold;
                  return (
                    <View key={i} style={s.barCol}>
                      <Text style={[s.barVal, { color:col }]}>{score}</Text>
                      <View style={[s.barBg, { height:chartH }]}>
                        <LinearGradient
                          colors={[col, `${col}55`]}
                          style={[s.barFill, { height:h }]}
                        />
                      </View>
                      <Text style={s.barDay}>{DAYS[i]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={s.lineChartArea}>
              {MONTHLY_DATA.map((d, i) => {
                const barW = ((W - 80) / MONTHLY_DATA.length) - 8;
                const h    = (d.avg / 100) * chartH;
                return (
                  <View key={i} style={[s.monthCol, { width:barW }]}>
                    <Text style={s.monthVal}>{d.avg}</Text>
                    <View style={[s.barBg, { height:chartH }]}>
                      <LinearGradient
                        colors={[C.primary, `${C.primary}55`]}
                        style={[s.barFill, { height:h }]}
                      />
                    </View>
                    <Text style={s.monthLbl}>{d.month}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Metric improvements ──────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Metric Improvements</Text>
        <View style={s.metricsWrap}>
          {METRICS_PROGRESS.map((m, i) => {
            const diff = m.current - m.previous;
            return (
              <View key={i} style={s.metricRow}>
                <View style={[s.metricIcon, { backgroundColor:`${m.color}18` }]}>
                  <Ionicons name={m.icon as any} size={20} color={m.color} />
                </View>
                <View style={s.metricBody}>
                  <View style={s.metricTop}>
                    <Text style={s.metricLabel}>{m.label}</Text>
                    <View style={s.metricVals}>
                      <Text style={s.metricPrev}>{m.previous}</Text>
                      <Ionicons name="arrow-forward" size={12} color={C.hint} />
                      <Text style={[s.metricCurrent, { color:m.color }]}>{m.current}</Text>
                      <View style={[s.diffBadge, { backgroundColor:`${C.green}18` }]}>
                        <Text style={[s.diffTxt, { color:C.green }]}>+{diff}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.metricBarBg}>
                    <View style={[s.metricBarFill, { width:`${m.current}%`, backgroundColor:m.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Achievements ─────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Achievements</Text>
        <View style={s.achieveList}>
          {ACHIEVEMENTS.map((a, i) => (
            <View key={i} style={[s.achieveRow, !a.done && s.achieveRowLocked, i===ACHIEVEMENTS.length-1 && {borderBottomWidth:0}]}>
              <View style={[s.achieveIcon, { backgroundColor: a.done ? `${a.color}22` : 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.done ? a.color : C.hint} />
              </View>
              <View style={s.achieveBody}>
                <Text style={[s.achieveTitle, !a.done && { color:C.muted }]}>{a.title}</Text>
                <Text style={s.achieveDesc}>{a.desc}</Text>
              </View>
              <Ionicons
                name={a.done ? 'checkmark-circle' : 'lock-closed-outline'}
                size={22}
                color={a.done ? C.green : C.hint}
              />
            </View>
          ))}
        </View>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <TouchableOpacity style={s.practiceBtn} onPress={() => navigation.navigate('Record', { mode:'Free Speech' })} activeOpacity={0.85}>
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.practiceBtnGrad}>
            <Ionicons name="mic" size={20} color="#fff" />
            <Text style={s.practiceBtnTxt}>Practice Now</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height:40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex:1, backgroundColor:C.bg },
  headerBg:      { paddingBottom:20 },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:36, marginBottom:16 },
  backBtn:       { width:42, height:42, borderRadius:13, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  headerTitle:   { fontSize:17, fontWeight:'700', color:C.text },
  pillRow:       { flexDirection:'row', marginHorizontal:20, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  pill:          { flex:1, alignItems:'center', paddingVertical:12, gap:2 },
  pillVal:       { fontSize:15, fontWeight:'800', color:C.text },
  pillLbl:       { fontSize:10, color:C.muted },
  scroll:        { paddingHorizontal:20, paddingTop:20 },
  card:          { backgroundColor:C.bgCard, borderRadius:20, padding:16, borderWidth:1, borderColor:C.border, marginBottom:24 },
  cardHead:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  cardTitle:     { fontSize:15, fontWeight:'700', color:C.text },
  tabRow:        { flexDirection:'row', gap:6 },
  tabChip:       { paddingHorizontal:12, paddingVertical:5, borderRadius:12, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
  tabChipActive: { backgroundColor:C.primary, borderColor:C.primary },
  tabChipTxt:    { fontSize:12, color:C.muted },
  tabChipTxtActive:{ color:'#fff', fontWeight:'600' },
  chartArea:     { flexDirection:'row', gap:8 },
  yAxis:         { justifyContent:'space-between', paddingBottom:20, paddingRight:4 },
  yLbl:          { fontSize:10, color:C.hint },
  bars:          { flex:1, flexDirection:'row', alignItems:'flex-end', gap:6 },
  barCol:        { flex:1, alignItems:'center', gap:4 },
  barVal:        { fontSize:10, fontWeight:'700' },
  barBg:         { width:'100%', backgroundColor:'rgba(255,255,255,0.06)', borderRadius:6, justifyContent:'flex-end' },
  barFill:       { width:'100%', borderRadius:6 },
  barDay:        { fontSize:10, color:C.hint },
  lineChartArea: { flexDirection:'row', alignItems:'flex-end', gap:4 },
  monthCol:      { alignItems:'center', gap:4 },
  monthVal:      { fontSize:10, fontWeight:'700', color:C.text },
  monthLbl:      { fontSize:10, color:C.hint },
  sectionTitle:  { fontSize:15, fontWeight:'700', color:C.text, marginBottom:12 },
  metricsWrap:   { backgroundColor:C.bgCard, borderRadius:20, overflow:'hidden', borderWidth:1, borderColor:C.border, marginBottom:24 },
  metricRow:     { flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:1, borderBottomColor:C.border },
  metricIcon:    { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  metricBody:    { flex:1, gap:8 },
  metricTop:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  metricLabel:   { fontSize:13, fontWeight:'600', color:C.text },
  metricVals:    { flexDirection:'row', alignItems:'center', gap:6 },
  metricPrev:    { fontSize:12, color:C.hint, textDecorationLine:'line-through' },
  metricCurrent: { fontSize:14, fontWeight:'800' },
  diffBadge:     { paddingHorizontal:6, paddingVertical:2, borderRadius:8 },
  diffTxt:       { fontSize:11, fontWeight:'700' },
  metricBarBg:   { height:4, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' },
  metricBarFill: { height:'100%', borderRadius:2 },
  achieveList:   { backgroundColor:C.bgCard, borderRadius:20, overflow:'hidden', borderWidth:1, borderColor:C.border, marginBottom:24 },
  achieveRow:    { flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:1, borderBottomColor:C.border },
  achieveRowLocked:{ opacity:0.55 },
  achieveIcon:   { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
  achieveBody:   { flex:1 },
  achieveTitle:  { fontSize:13, fontWeight:'700', color:C.text, marginBottom:2 },
  achieveDesc:   { fontSize:12, color:C.muted },
  practiceBtn:   { borderRadius:16, overflow:'hidden' },
  practiceBtnGrad:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:16 },
  practiceBtnTxt:{ fontSize:16, fontWeight:'700', color:'#fff' },
});
