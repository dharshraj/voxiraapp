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

// Simulated WPM per 30-second segment
const WPM_SEGMENTS = [
  {seg:'0:00–0:30', wpm:98,  label:'Slow'},
  {seg:'0:30–1:00', wpm:134, label:'Good'},
  {seg:'1:00–1:30', wpm:156, label:'Fast'},
  {seg:'1:30–2:00', wpm:122, label:'Good'},
  {seg:'2:00–2:30', wpm:108, label:'Slow'},
  {seg:'2:30–3:00', wpm:141, label:'Good'},
  {seg:'3:00–3:30', wpm:167, label:'Fast'},
  {seg:'3:30–4:00', wpm:138, label:'Good'},
];

const PACE_ZONES = [
  {range:'< 110 WPM',  label:'Too Slow',   color:C.accent,  desc:'Listeners may lose interest. Pick up the pace slightly.' },
  {range:'110–150 WPM',label:'Ideal',      color:C.green,   desc:'Perfect pace for clear, engaging communication.' },
  {range:'151–180 WPM',label:'Fast',       color:C.gold,    desc:'Slightly fast. Slow down on important points.' },
  {range:'> 180 WPM',  label:'Too Fast',   color:C.danger,  desc:'Very difficult to follow. Significantly slow down.' },
];

const CLARITY_FACTORS = [
  {label:'Sentence Structure', score:88, icon:'list-outline',        color:C.accent, tip:'Use short, clear sentences. One idea per sentence.' },
  {label:'Word Choice',        score:82, icon:'text-outline',        color:C.green,  tip:'Prefer simple words over complex ones.' },
  {label:'Volume Consistency', score:76, icon:'volume-medium-outline',color:C.purple,tip:'Maintain consistent volume — avoid trailing off at sentence ends.' },
  {label:'Articulation',       score:71, icon:'mic-outline',         color:C.gold,   tip:'Open your mouth more when speaking. Mumbling reduces clarity.' },
  {label:'Pause Usage',        score:84, icon:'pause-circle-outline', color:C.accent, tip:'Strategic pauses add emphasis and give listeners time to absorb.' },
];

const TECHNIQUES = [
  {title:'The 120 WPM Sweet Spot',  desc:'Most professional speakers average 120–140 WPM. Practice counting words per minute using a timer and a short passage.',                                    icon:'stopwatch-outline',   color:C.primary},
  {title:'Pause for Emphasis',      desc:'Before stating a key point, pause for 2 seconds. After stating it, pause again. This signals importance to your listener.',                              icon:'hand-left-outline',   color:C.gold   },
  {title:'The Resonance Test',      desc:'Place your hand on your chest while speaking. If you feel vibration, your voice has good resonance. This improves clarity significantly.',               icon:'heart-outline',       color:C.danger },
  {title:'Breath Support',          desc:'Take a deep breath before long sentences. Running out of air mid-sentence causes mumbling and trailing off — two major clarity killers.',               icon:'leaf-outline',        color:C.green  },
  {title:'Record at Double Speed',  desc:'Record yourself, then play it back at 1.5x speed. If you can still understand every word clearly, your articulation is excellent.',                     icon:'play-forward-outline', color:C.accent },
];

function wpmColor(wpm:number){ return wpm<110?C.accent:wpm<=150?C.green:wpm<=180?C.gold:C.danger; }
function wpmLabel(wpm:number){ return wpm<110?'Too Slow':wpm<=150?'Ideal':wpm<=180?'Fast':'Too Fast'; }

export default function PaceAndClarityScreen({ navigation, route }:any){
  const { avgWpm=134, clarityScore=79 } = route?.params ?? {};
  const [activeTab, setActiveTab] = useState<'pace'|'clarity'|'techniques'>('pace');
  const fade  = useRef(new Animated.Value(0)).current;
  const needle= useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
    // Animate needle to correct WPM position (0=60wpm, 1=200wpm)
    const pos = Math.min(1, Math.max(0, (avgWpm - 60) / 160));
    Animated.spring(needle,{toValue:pos,tension:40,friction:8,useNativeDriver:false}).start();
  },[]);

  const needleLeft = needle.interpolate({inputRange:[0,1], outputRange:[0, W-80-24]});
  const wcol = wpmColor(avgWpm);
  const avgClarity = Math.round(CLARITY_FACTORS.reduce((a,b)=>a+b.score,0)/CLARITY_FACTORS.length);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Pace & Clarity</Text>
          <View style={{width:42}}/>
        </View>

        {/* Twin score cards */}
        <View style={s.twinRow}>
          <View style={s.twinCard}>
            <LinearGradient colors={[`${wcol}22`,`${wcol}05`]} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <Ionicons name="speedometer-outline" size={22} color={wcol}/>
            <Text style={[s.twinVal,{color:wcol}]}>{avgWpm}</Text>
            <Text style={s.twinUnit}>WPM</Text>
            <View style={[s.twinBadge,{backgroundColor:`${wcol}22`}]}>
              <Text style={[s.twinBadgeTxt,{color:wcol}]}>{wpmLabel(avgWpm)}</Text>
            </View>
          </View>
          <View style={s.twinCard}>
            <LinearGradient colors={['rgba(21,101,255,0.20)','rgba(21,101,255,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <Ionicons name="eye-outline" size={22} color={C.accent}/>
            <Text style={[s.twinVal,{color:C.accent}]}>{avgClarity}</Text>
            <Text style={s.twinUnit}>Clarity</Text>
            <View style={[s.twinBadge,{backgroundColor:`${C.accent}22`}]}>
              <Text style={[s.twinBadgeTxt,{color:C.accent}]}>{avgClarity>=85?'Excellent':avgClarity>=70?'Good':'Fair'}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {(['pace','clarity','techniques'] as const).map(t=>(
            <TouchableOpacity key={t} style={[s.tabBtn,activeTab===t&&s.tabBtnActive]} onPress={()=>setActiveTab(t)}>
              <Text style={[s.tabTxt,activeTab===t&&s.tabTxtActive]}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {activeTab==='pace' && (
          <>
            {/* WPM Gauge */}
            <View style={s.gaugeCard}>
              <Text style={s.gaugeTitle}>Your Average Pace</Text>
              <View style={s.gauge}>
                <View style={s.gaugeTrack}>
                  <LinearGradient colors={[C.accent,C.green,C.gold,C.danger]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.gaugeBar}/>
                </View>
                <Animated.View style={[s.gaugeNeedle,{left:needleLeft}]}>
                  <View style={s.gaugeNeedleHead}/>
                  <View style={s.gaugeNeedleLine}/>
                </Animated.View>
                <View style={s.gaugeLabels}>
                  <Text style={s.gaugeLabel}>60</Text>
                  <Text style={s.gaugeLabel}>110</Text>
                  <Text style={s.gaugeLabel}>150</Text>
                  <Text style={s.gaugeLabel}>180</Text>
                  <Text style={s.gaugeLabel}>220</Text>
                </View>
              </View>
              <Text style={[s.gaugeWpm,{color:wcol}]}>{avgWpm} WPM — {wpmLabel(avgWpm)}</Text>
              <Text style={s.gaugeSub}>Ideal range is 110–150 WPM for most conversations</Text>
            </View>

            {/* Per-segment chart */}
            <Text style={s.sectionTitle}>Pace Per Segment</Text>
            <View style={s.segList}>
              {WPM_SEGMENTS.map((seg,i)=>{
                const col = wpmColor(seg.wpm);
                const barW = ((seg.wpm - 60) / 160) * (W - 120);
                return (
                  <View key={i} style={[s.segRow, i===WPM_SEGMENTS.length-1&&{borderBottomWidth:0}]}>
                    <Text style={s.segTime}>{seg.seg}</Text>
                    <View style={s.segBarArea}>
                      <LinearGradient colors={[col,`${col}66`]} start={{x:0,y:0}} end={{x:1,y:0}} style={[s.segBar,{width:Math.max(24,barW)}]}/>
                    </View>
                    <View style={[s.segBadge,{backgroundColor:`${col}18`}]}>
                      <Text style={[s.segBadgeTxt,{color:col}]}>{seg.wpm}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Pace zones legend */}
            <Text style={s.sectionTitle}>Pace Zones Guide</Text>
            <View style={s.zoneList}>
              {PACE_ZONES.map((z,i)=>(
                <View key={i} style={[s.zoneRow,i===PACE_ZONES.length-1&&{borderBottomWidth:0}]}>
                  <View style={[s.zoneDot,{backgroundColor:z.color}]}/>
                  <View style={s.zoneBody}>
                    <View style={s.zoneTop}>
                      <Text style={s.zoneRange}>{z.range}</Text>
                      <View style={[s.zoneLabel,{backgroundColor:`${z.color}18`}]}>
                        <Text style={[s.zoneLabelTxt,{color:z.color}]}>{z.label}</Text>
                      </View>
                    </View>
                    <Text style={s.zoneDesc}>{z.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab==='clarity' && (
          <>
            <Text style={s.sectionTitle}>Clarity Breakdown</Text>
            <View style={s.clarityList}>
              {CLARITY_FACTORS.map((f,i)=>(
                <View key={i} style={[s.clarityRow,i===CLARITY_FACTORS.length-1&&{borderBottomWidth:0}]}>
                  <View style={[s.clarityIcon,{backgroundColor:`${f.color}18`}]}>
                    <Ionicons name={f.icon as any} size={20} color={f.color}/>
                  </View>
                  <View style={s.clarityBody}>
                    <View style={s.clarityTop}>
                      <Text style={s.clarityLabel}>{f.label}</Text>
                      <Text style={[s.clarityScore,{color:f.color}]}>{f.score}</Text>
                    </View>
                    <View style={s.clarityBarBg}>
                      <View style={[s.clarityBarFill,{width:`${f.score}%`,backgroundColor:f.color}]}/>
                    </View>
                    <Text style={s.clarityTip}>{f.tip}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab==='techniques' && (
          <>
            <Text style={s.sectionTitle}>Techniques to Improve</Text>
            <View style={s.techList}>
              {TECHNIQUES.map((t,i)=>(
                <View key={i} style={s.techCard}>
                  <View style={[s.techIcon,{backgroundColor:`${t.color}18`}]}>
                    <Ionicons name={t.icon as any} size={22} color={t.color}/>
                  </View>
                  <View style={s.techBody}>
                    <Text style={s.techTitle}>{t.title}</Text>
                    <Text style={s.techDesc}>{t.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={s.practiceBtn} onPress={()=>navigation.navigate('Record',{mode:'Free Speech'})} activeOpacity={0.85}>
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.practiceBtnGrad}>
            <Ionicons name="mic" size={20} color="#fff"/>
            <Text style={s.practiceBtnTxt}>Practice Now</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           {flex:1,backgroundColor:C.bg},
  headerBg:       {paddingBottom:8},
  header:         {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:        {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:    {fontSize:17,fontWeight:'700',color:C.text},
  twinRow:        {flexDirection:'row',gap:12,paddingHorizontal:20,marginBottom:16},
  twinCard:       {flex:1,borderRadius:18,padding:14,borderWidth:1,borderColor:C.border,alignItems:'center',gap:4,overflow:'hidden'},
  twinVal:        {fontSize:32,fontWeight:'800'},
  twinUnit:       {fontSize:11,color:C.muted},
  twinBadge:      {paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  twinBadgeTxt:   {fontSize:11,fontWeight:'700'},
  tabRow:         {flexDirection:'row',marginHorizontal:20,backgroundColor:C.surface,borderRadius:14,padding:4,gap:4,marginBottom:4},
  tabBtn:         {flex:1,paddingVertical:8,borderRadius:10,alignItems:'center'},
  tabBtnActive:   {backgroundColor:C.primary},
  tabTxt:         {fontSize:12,color:C.muted,fontWeight:'500'},
  tabTxtActive:   {color:'#fff',fontWeight:'600'},
  scroll:         {paddingHorizontal:20,paddingTop:16},
  gaugeCard:      {backgroundColor:C.bgCard,borderRadius:20,padding:20,borderWidth:1,borderColor:C.border,marginBottom:24,alignItems:'center'},
  gaugeTitle:     {fontSize:14,fontWeight:'600',color:C.muted,marginBottom:20,textTransform:'uppercase',letterSpacing:0.5},
  gauge:          {width:'100%',marginBottom:16,position:'relative'},
  gaugeTrack:     {height:12,borderRadius:6,overflow:'hidden',marginBottom:24},
  gaugeBar:       {height:'100%'},
  gaugeNeedle:    {position:'absolute',top:-6,alignItems:'center'},
  gaugeNeedleHead:{width:16,height:16,borderRadius:8,backgroundColor:'#fff',borderWidth:2,borderColor:C.primary},
  gaugeNeedleLine:{width:2,height:20,backgroundColor:C.primary},
  gaugeLabels:    {flexDirection:'row',justifyContent:'space-between'},
  gaugeLabel:     {fontSize:10,color:C.hint},
  gaugeWpm:       {fontSize:20,fontWeight:'800',marginBottom:4},
  gaugeSub:       {fontSize:12,color:C.muted,textAlign:'center'},
  sectionTitle:   {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  segList:        {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:24},
  segRow:         {flexDirection:'row',alignItems:'center',padding:12,borderBottomWidth:1,borderBottomColor:C.border,gap:10},
  segTime:        {fontSize:11,color:C.muted,width:80},
  segBarArea:     {flex:1,height:8,borderRadius:4,overflow:'hidden'},
  segBar:         {height:'100%',borderRadius:4},
  segBadge:       {paddingHorizontal:8,paddingVertical:3,borderRadius:8,minWidth:36,alignItems:'center'},
  segBadgeTxt:    {fontSize:12,fontWeight:'700'},
  zoneList:       {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:24},
  zoneRow:        {flexDirection:'row',gap:14,padding:14,borderBottomWidth:1,borderBottomColor:C.border,alignItems:'flex-start'},
  zoneDot:        {width:12,height:12,borderRadius:6,marginTop:4,flexShrink:0},
  zoneBody:       {flex:1,gap:6},
  zoneTop:        {flexDirection:'row',alignItems:'center',gap:10},
  zoneRange:      {fontSize:13,fontWeight:'700',color:C.text},
  zoneLabel:      {paddingHorizontal:8,paddingVertical:3,borderRadius:8},
  zoneLabelTxt:   {fontSize:10,fontWeight:'700'},
  zoneDesc:       {fontSize:12,color:C.muted,lineHeight:18},
  clarityList:    {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:24},
  clarityRow:     {flexDirection:'row',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border,alignItems:'flex-start'},
  clarityIcon:    {width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center',flexShrink:0},
  clarityBody:    {flex:1,gap:6},
  clarityTop:     {flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  clarityLabel:   {fontSize:13,fontWeight:'600',color:C.text},
  clarityScore:   {fontSize:16,fontWeight:'800'},
  clarityBarBg:   {height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  clarityBarFill: {height:'100%',borderRadius:2},
  clarityTip:     {fontSize:12,color:C.muted,lineHeight:17},
  techList:       {gap:10,marginBottom:24},
  techCard:       {flexDirection:'row',gap:14,backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border,alignItems:'flex-start'},
  techIcon:       {width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',flexShrink:0},
  techBody:       {flex:1},
  techTitle:      {fontSize:14,fontWeight:'700',color:C.text,marginBottom:4},
  techDesc:       {fontSize:12,color:C.muted,lineHeight:18},
  practiceBtn:    {borderRadius:16,overflow:'hidden',marginBottom:8},
  practiceBtnGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  practiceBtnTxt: {fontSize:16,fontWeight:'700',color:'#fff'},
});