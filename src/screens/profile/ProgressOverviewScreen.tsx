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
  gold:'#F59E0B', purple:'#A855F7',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const WEEKLY = [62,70,75,68,83,87,84];
const DAYS   = ['M','T','W','T','F','S','S'];

const FEATURE_PROGRESS = [
  { label:'Speech',    sessions:24, avgScore:84, improvement:'+16', icon:'mic',    color:C.accent  },
  { label:'Writing',   sessions:16, avgScore:91, improvement:'+12', icon:'create', color:C.green   },
  { label:'Interview', sessions:12, avgScore:79, improvement:'+14', icon:'people', color:C.purple  },
];

const MONTHLY_TREND = [
  {month:'Jan',speech:68,writing:72,interview:65},
  {month:'Feb',speech:72,writing:78,interview:70},
  {month:'Mar',speech:78,writing:82,interview:74},
  {month:'Apr',speech:82,writing:87,interview:79},
  {month:'May',speech:87,writing:91,interview:84},
];

export default function ProgressOverviewScreen({ navigation }:any) {
  const [period, setPeriod] = useState<'weekly'|'monthly'>('weekly');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const overallAvg = Math.round((84+91+79)/3);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Progress Overview</Text>
          <View style={{width:42}}/>
        </View>

        {/* Hero overall score */}
        <View style={s.heroCard}>
          <LinearGradient colors={['rgba(21,101,255,0.20)','rgba(21,101,255,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:20}]}/>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>OVERALL SCORE</Text>
            <Text style={s.heroNum}>{overallAvg}</Text>
            <Text style={s.heroSub}>Across all 3 features</Text>
            <View style={s.heroBadge}>
              <Ionicons name="trending-up" size={12} color={C.green}/>
              <Text style={s.heroBadgeTxt}>+14 this month</Text>
            </View>
          </View>
          <View style={s.heroRight}>
            {[{val:'52',lbl:'Sessions'},{val:'4🔥',lbl:'Streak'},{val:'Top 15%',lbl:'Ranking'}].map((st,i)=>(
              <View key={i} style={s.heroStat}>
                <Text style={s.heroStatVal}>{st.val}</Text>
                <Text style={s.heroStatLbl}>{st.lbl}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Feature breakdown */}
        <Text style={s.sectionTitle}>Feature Breakdown</Text>
        <View style={s.featureList}>
          {FEATURE_PROGRESS.map((f,i)=>(
            <View key={i} style={[s.featureRow,i===FEATURE_PROGRESS.length-1&&{borderBottomWidth:0}]}>
              <View style={[s.featureIcon,{backgroundColor:`${f.color}18`}]}>
                <Ionicons name={f.icon as any} size={22} color={f.color}/>
              </View>
              <View style={s.featureMeta}>
                <View style={s.featureTop}>
                  <Text style={s.featureLabel}>{f.label}</Text>
                  <View style={s.featureVals}>
                    <Text style={[s.featureScore,{color:f.color}]}>{f.avgScore}</Text>
                    <View style={[s.improvBadge,{backgroundColor:`${C.green}18`}]}>
                      <Text style={[s.improvTxt,{color:C.green}]}>{f.improvement}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.featureBarBg}>
                  <View style={[s.featureBarFill,{width:`${f.avgScore}%` as any,backgroundColor:f.color}]}/>
                </View>
                <Text style={s.featureSessions}>{f.sessions} sessions completed</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Score chart */}
        <View style={s.chartCard}>
          <View style={s.chartHead}>
            <Text style={s.sectionTitle}>Score Trend</Text>
            <View style={s.periodRow}>
              {(['weekly','monthly'] as const).map(p=>(
                <TouchableOpacity key={p} style={[s.periodBtn, period===p&&s.periodBtnActive]} onPress={()=>setPeriod(p)}>
                  <Text style={[s.periodTxt,period===p&&s.periodTxtActive]}>{p==='weekly'?'Week':'Month'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {period==='weekly' ? (
            <View style={s.barChart}>
              {WEEKLY.map((score,i)=>{
                const h = Math.max(8,(score/100)*100);
                const col = score>=85?C.green:score>=70?C.accent:C.gold;
                return (
                  <View key={i} style={s.barCol}>
                    <Text style={[s.barVal,{color:col}]}>{score}</Text>
                    <View style={[s.barBg,{height:100}]}>
                      <LinearGradient colors={[col,`${col}55`]} style={[s.barFill,{height:h}]}/>
                    </View>
                    <Text style={s.barDay}>{DAYS[i]}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={s.monthChart}>
              {MONTHLY_TREND.map((m,i)=>(
                <View key={i} style={s.monthRow}>
                  <Text style={s.monthLbl}>{m.month}</Text>
                  <View style={s.monthBars}>
                    {[{val:m.speech,color:C.accent},{val:m.writing,color:C.green},{val:m.interview,color:C.purple}].map((b,j)=>(
                      <View key={j} style={s.monthBarBg}>
                        <LinearGradient colors={[b.color,`${b.color}55`]} start={{x:0,y:0}} end={{x:1,y:0}}
                          style={[s.monthBarFill,{width:`${b.val}%` as any}]}/>
                      </View>
                    ))}
                  </View>
                  <Text style={s.monthAvg}>{Math.round((m.speech+m.writing+m.interview)/3)}</Text>
                </View>
              ))}
              <View style={s.legend}>
                {[{color:C.accent,lbl:'Speech'},{color:C.green,lbl:'Writing'},{color:C.purple,lbl:'Interview'}].map((l,i)=>(
                  <View key={i} style={s.legendItem}>
                    <View style={[s.legendDot,{backgroundColor:l.color}]}/>
                    <Text style={s.legendTxt}>{l.lbl}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Streak calendar */}
        <Text style={s.sectionTitle}>This Month's Activity</Text>
        <View style={s.calendarCard}>
          <View style={s.calGrid}>
            {Array.from({length:31},(_,i)=>{
              const done = [1,2,3,5,6,8,9,10,12,15,16,17,19,20,22,23,24,26,27,28,30].includes(i+1);
              return (
                <View key={i} style={[s.calDay,done&&s.calDayDone]}>
                  <Text style={[s.calDayTxt,done&&s.calDayTxtDone]}>{i+1}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.calFooter}>
            <View style={s.calLegItem}><View style={[s.calDot,{backgroundColor:C.primary}]}/><Text style={s.calLegTxt}>Practised</Text></View>
            <View style={s.calLegItem}><View style={[s.calDot,{backgroundColor:C.border}]}/><Text style={s.calLegTxt}>No session</Text></View>
          </View>
        </View>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:20},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  heroCard:      {marginHorizontal:20,borderRadius:20,padding:18,borderWidth:1,borderColor:'rgba(21,101,255,0.25)',overflow:'hidden',flexDirection:'row'},
  heroLeft:      {flex:1,gap:6},
  heroLabel:     {fontSize:11,color:'rgba(255,255,255,0.55)',letterSpacing:1,textTransform:'uppercase'},
  heroNum:       {fontSize:48,fontWeight:'800',color:C.text,letterSpacing:-2},
  heroSub:       {fontSize:12,color:C.muted},
  heroBadge:     {flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(34,197,94,0.15)',paddingHorizontal:10,paddingVertical:4,borderRadius:20,alignSelf:'flex-start'},
  heroBadgeTxt:  {fontSize:11,color:C.green,fontWeight:'600'},
  heroRight:     {justifyContent:'space-around',gap:8},
  heroStat:      {alignItems:'flex-end'},
  heroStatVal:   {fontSize:14,fontWeight:'700',color:C.text},
  heroStatLbl:   {fontSize:10,color:C.muted},
  scroll:        {paddingHorizontal:20,paddingTop:20},
  sectionTitle:  {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  featureList:   {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:20},
  featureRow:    {flexDirection:'row',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border,alignItems:'center'},
  featureIcon:   {width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',flexShrink:0},
  featureMeta:   {flex:1,gap:8},
  featureTop:    {flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  featureLabel:  {fontSize:14,fontWeight:'600',color:C.text},
  featureVals:   {flexDirection:'row',alignItems:'center',gap:8},
  featureScore:  {fontSize:18,fontWeight:'800'},
  improvBadge:   {paddingHorizontal:8,paddingVertical:2,borderRadius:8},
  improvTxt:     {fontSize:11,fontWeight:'700'},
  featureBarBg:  {height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  featureBarFill:{height:'100%',borderRadius:2},
  featureSessions:{fontSize:11,color:C.hint},
  chartCard:     {backgroundColor:C.bgCard,borderRadius:18,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20},
  chartHead:     {flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  periodRow:     {flexDirection:'row',gap:6},
  periodBtn:     {paddingHorizontal:12,paddingVertical:5,borderRadius:10,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  periodBtnActive:{backgroundColor:C.primary,borderColor:C.primary},
  periodTxt:     {fontSize:12,color:C.muted},
  periodTxtActive:{color:'#fff',fontWeight:'600'},
  barChart:      {flexDirection:'row',alignItems:'flex-end',gap:6,height:130},
  barCol:        {flex:1,alignItems:'center',gap:4},
  barVal:        {fontSize:10,fontWeight:'700'},
  barBg:         {width:'100%',justifyContent:'flex-end',borderRadius:4,overflow:'hidden'},
  barFill:       {width:'100%',borderRadius:4},
  barDay:        {fontSize:10,color:C.hint},
  monthChart:    {gap:10},
  monthRow:      {flexDirection:'row',alignItems:'center',gap:10},
  monthLbl:      {fontSize:12,color:C.muted,width:30},
  monthBars:     {flex:1,gap:4},
  monthBarBg:    {height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  monthBarFill:  {height:'100%',borderRadius:2},
  monthAvg:      {fontSize:12,fontWeight:'700',color:C.text,width:24,textAlign:'right'},
  legend:        {flexDirection:'row',justifyContent:'center',gap:14,marginTop:12},
  legendItem:    {flexDirection:'row',alignItems:'center',gap:5},
  legendDot:     {width:8,height:8,borderRadius:4},
  legendTxt:     {fontSize:11,color:C.muted},
  calendarCard:  {backgroundColor:C.bgCard,borderRadius:18,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20},
  calGrid:       {flexDirection:'row',flexWrap:'wrap',gap:6},
  calDay:        {width:(W-80)/7,height:(W-80)/7,borderRadius:8,backgroundColor:C.surface,alignItems:'center',justifyContent:'center'},
  calDayDone:    {backgroundColor:C.primary},
  calDayTxt:     {fontSize:11,color:C.hint},
  calDayTxtDone: {color:'#fff',fontWeight:'600'},
  calFooter:     {flexDirection:'row',gap:16,marginTop:12,justifyContent:'center'},
  calLegItem:    {flexDirection:'row',alignItems:'center',gap:6},
  calDot:        {width:10,height:10,borderRadius:5},
  calLegTxt:     {fontSize:12,color:C.muted},
});