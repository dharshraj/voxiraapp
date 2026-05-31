import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Platform, Animated, Share, Alert, Dimensions,
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

const SHARE_OPTIONS = [
  { id:'score',   label:'Share Score Card',  icon:'trophy-outline',      color:C.gold,   desc:'Share your overall score and stats' },
  { id:'improve', label:'Share Progress',    icon:'trending-up-outline',  color:C.green,  desc:'Show how much you have improved'    },
  { id:'badge',   label:'Share Achievement', icon:'ribbon-outline',       color:C.purple, desc:'Share an achievement badge'         },
  { id:'quote',   label:'Share Tip',         icon:'chatbubble-outline',   color:C.accent, desc:'Share today\'s communication tip'   },
];

const PLATFORMS = [
  { id:'native', label:'Share',     icon:'share-social-outline', color:C.primary },
  { id:'copy',   label:'Copy Link', icon:'copy-outline',         color:C.accent  },
  { id:'save',   label:'Save Card', icon:'download-outline',     color:C.green   },
];

function scoreColor(s:number){ return s>=85?C.green:s>=70?C.accent:C.gold; }
function scoreLabel(s:number){ return s>=90?'Excellent':s>=80?'Great':s>=70?'Good':s>=60?'Fair':'Needs Work'; }

export default function ShareResultScreen({ navigation, route }:any){
  const {
    score       = 87,
    mode        = 'Free Speech',
    duration    = 252,
    fillerCount = 3,
    details     = { clarity:87, pace:82, pronunciation:85, confidence:79 },
  } = route?.params ?? {};

  const [selected, setSelected] = useState('score');
  const fade  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const color = scoreColor(score);
  const m = Math.floor(duration/60).toString().padStart(2,'0');
  const ss = (duration%60).toString().padStart(2,'0');

  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fade,  {toValue:1,duration:500,useNativeDriver:true}),
      Animated.spring(scale, {toValue:1,tension:60,friction:8,useNativeDriver:true}),
    ]).start();
  },[]);

  const doShare = async () => {
    const messages: Record<string,string> = {
      score:   `🎙️ I just scored ${score}/100 on Voxira Speech Analysis!\n\nMode: ${mode} | Duration: ${m}:${ss}\nFiller words: ${fillerCount} | Rating: ${scoreLabel(score)}\n\nImprove your communication with Voxira 👉`,
      improve: `📈 My Voxira speech score improved by +13 this week! Now at ${score}/100.\n\nConsistency is key. Practising every day makes a huge difference! Try Voxira 👉`,
      badge:   `🏆 I just earned the "${scoreLabel(score)} Speaker" badge on Voxira!\n\nWorking on my communication skills every day. You should try it too 👉`,
      quote:   `💡 Today's communication tip from Voxira:\n\n"Pause instead of saying um — silence sounds confident, not awkward."\n\nPractise with Voxira 👉`,
    };
    try {
      await Share.share({ message: messages[selected] ?? messages.score });
    } catch { Alert.alert('Error','Could not share. Please try again.'); }
  };

  const doCopy = () => {
    Alert.alert('Copied!','Share link copied to clipboard.');
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Share Result</Text>
          <View style={{width:42}}/>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Preview card ──────────────────────────────────────────── */}
        <Animated.View style={[s.previewCard, {transform:[{scale}]}]}>
          <LinearGradient colors={['#1565FF','#0D47A1','#050D1A']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill,{borderRadius:24}]}/>
          {/* Decorative circles */}
          <View style={s.dec1}/><View style={s.dec2}/>

          {/* Voxira branding */}
          <View style={s.previewBrand}>
            <Text style={s.previewBrandTxt}>🎙️ VOXIRA</Text>
            <Text style={s.previewBrandSub}>AI Speech Coach</Text>
          </View>

          {selected==='score' && (
            <>
              <View style={s.previewScoreWrap}>
                <View style={[s.previewScoreRing,{borderColor:`${color}60`}]}>
                  <Text style={[s.previewScoreNum,{color}]}>{score}</Text>
                  <Text style={s.previewScoreMax}>/100</Text>
                </View>
              </View>
              <Text style={[s.previewScoreLabel,{color}]}>{scoreLabel(score)}</Text>
              <Text style={s.previewMode}>{mode} Session</Text>
              <View style={s.previewStats}>
                {[
                  {icon:'time-outline',    val:`${m}:${ss}`, lbl:'Duration'},
                  {icon:'warning-outline', val:`${fillerCount}`,  lbl:'Fillers'},
                  {icon:'star-outline',    val:`${score}`,   lbl:'Score'},
                ].map((st,i)=>(
                  <View key={i} style={s.previewStat}>
                    <Ionicons name={st.icon as any} size={14} color="rgba(255,255,255,0.5)"/>
                    <Text style={s.previewStatVal}>{st.val}</Text>
                    <Text style={s.previewStatLbl}>{st.lbl}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {selected==='improve' && (
            <View style={s.previewImprove}>
              <Text style={s.improveEmoji}>📈</Text>
              <Text style={s.improveTitle}>Improved by +13!</Text>
              <Text style={s.improveSub}>From 74 → {score} this week</Text>
              <View style={s.improveBar}>
                <View style={[s.improveBarFill,{width:`${score}%`}]}/>
              </View>
              <Text style={s.improveTag}>Consistent daily practice works!</Text>
            </View>
          )}

          {selected==='badge' && (
            <View style={s.previewBadge}>
              <Text style={s.badgeEmoji}>🏆</Text>
              <Text style={s.badgeTitle}>{scoreLabel(score)} Speaker</Text>
              <Text style={s.badgeSub}>Achievement Unlocked</Text>
              <View style={s.badgeStars}>
                {[1,2,3,4,5].map(i=>(
                  <Ionicons key={i} name="star" size={18} color={i<=Math.round(score/20)?C.gold:'rgba(255,255,255,0.2)'}/>
                ))}
              </View>
            </View>
          )}

          {selected==='quote' && (
            <View style={s.previewQuote}>
              <Text style={s.quoteIcon}>💡</Text>
              <Text style={s.quoteTxt}>"Pause instead of saying um — silence sounds confident, not awkward."</Text>
              <Text style={s.quoteSource}>— Voxira Daily Tip</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Card type selector ────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Choose what to share</Text>
        <View style={s.optionsList}>
          {SHARE_OPTIONS.map(o=>(
            <TouchableOpacity
              key={o.id}
              style={[s.optionRow, selected===o.id&&s.optionRowActive]}
              onPress={()=>setSelected(o.id)}
              activeOpacity={0.8}
            >
              <View style={[s.optionIcon,{backgroundColor:`${o.color}18`}]}>
                <Ionicons name={o.icon as any} size={22} color={o.color}/>
              </View>
              <View style={s.optionMeta}>
                <Text style={s.optionLabel}>{o.label}</Text>
                <Text style={s.optionDesc}>{o.desc}</Text>
              </View>
              <View style={[s.optionRadio, selected===o.id&&{backgroundColor:C.primary,borderColor:C.primary}]}>
                {selected===o.id && <Ionicons name="checkmark" size={14} color="#fff"/>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Share buttons ─────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Share via</Text>
        <View style={s.platformRow}>
          {PLATFORMS.map(p=>(
            <TouchableOpacity
              key={p.id}
              style={s.platformBtn}
              onPress={p.id==='copy' ? doCopy : doShare}
              activeOpacity={0.82}
            >
              <View style={[s.platformIcon,{backgroundColor:`${p.color}18`}]}>
                <Ionicons name={p.icon as any} size={24} color={p.color}/>
              </View>
              <Text style={s.platformLbl}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main share button */}
        <TouchableOpacity style={s.shareBtn} onPress={doShare} activeOpacity={0.85}>
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.shareBtnGrad}>
            <Ionicons name="share-social-outline" size={20} color="#fff"/>
            <Text style={s.shareBtnTxt}>Share Now</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:            {flex:1,backgroundColor:C.bg},
  headerBg:        {paddingBottom:12},
  header:          {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36},
  backBtn:         {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:     {fontSize:17,fontWeight:'700',color:C.text},
  scroll:          {paddingHorizontal:20,paddingTop:16},
  previewCard:     {borderRadius:24,padding:24,marginBottom:24,borderWidth:1,borderColor:'rgba(21,101,255,0.30)',overflow:'hidden',minHeight:280,alignItems:'center'},
  dec1:            {position:'absolute',right:-30,top:-30,width:160,height:160,borderRadius:80,backgroundColor:'rgba(255,255,255,0.06)'},
  dec2:            {position:'absolute',left:-20,bottom:-20,width:120,height:120,borderRadius:60,backgroundColor:'rgba(255,255,255,0.04)'},
  previewBrand:    {alignItems:'center',marginBottom:20},
  previewBrandTxt: {fontSize:14,fontWeight:'800',color:'rgba(255,255,255,0.9)',letterSpacing:2},
  previewBrandSub: {fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:2},
  previewScoreWrap:{marginBottom:10},
  previewScoreRing:{width:110,height:110,borderRadius:55,borderWidth:5,alignItems:'center',justifyContent:'center'},
  previewScoreNum: {fontSize:38,fontWeight:'800'},
  previewScoreMax: {fontSize:12,color:'rgba(255,255,255,0.4)'},
  previewScoreLabel:{fontSize:16,fontWeight:'700',marginBottom:4},
  previewMode:     {fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:16},
  previewStats:    {flexDirection:'row',gap:20},
  previewStat:     {alignItems:'center',gap:4},
  previewStatVal:  {fontSize:13,fontWeight:'700',color:'#fff'},
  previewStatLbl:  {fontSize:10,color:'rgba(255,255,255,0.4)'},
  previewImprove:  {alignItems:'center',gap:10,width:'100%'},
  improveEmoji:    {fontSize:40},
  improveTitle:    {fontSize:22,fontWeight:'800',color:'#fff'},
  improveSub:      {fontSize:14,color:'rgba(255,255,255,0.6)'},
  improveBar:      {width:'100%',height:8,backgroundColor:'rgba(255,255,255,0.15)',borderRadius:4,overflow:'hidden'},
  improveBarFill:  {height:'100%',backgroundColor:C.green,borderRadius:4},
  improveTag:      {fontSize:12,color:'rgba(255,255,255,0.5)',fontStyle:'italic'},
  previewBadge:    {alignItems:'center',gap:10},
  badgeEmoji:      {fontSize:52},
  badgeTitle:      {fontSize:20,fontWeight:'800',color:'#fff'},
  badgeSub:        {fontSize:13,color:'rgba(255,255,255,0.5)'},
  badgeStars:      {flexDirection:'row',gap:4},
  previewQuote:    {alignItems:'center',gap:12,paddingHorizontal:8},
  quoteIcon:       {fontSize:32},
  quoteTxt:        {fontSize:14,color:'rgba(255,255,255,0.85)',textAlign:'center',lineHeight:22,fontStyle:'italic'},
  quoteSource:     {fontSize:12,color:'rgba(255,255,255,0.4)'},
  sectionTitle:    {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  optionsList:     {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:24},
  optionRow:       {flexDirection:'row',alignItems:'center',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border},
  optionRowActive: {backgroundColor:'rgba(21,101,255,0.08)'},
  optionIcon:      {width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},
  optionMeta:      {flex:1},
  optionLabel:     {fontSize:14,fontWeight:'600',color:C.text,marginBottom:2},
  optionDesc:      {fontSize:12,color:C.muted},
  optionRadio:     {width:22,height:22,borderRadius:11,borderWidth:2,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  platformRow:     {flexDirection:'row',justifyContent:'space-around',marginBottom:20},
  platformBtn:     {alignItems:'center',gap:8},
  platformIcon:    {width:56,height:56,borderRadius:18,alignItems:'center',justifyContent:'center'},
  platformLbl:     {fontSize:12,color:C.muted},
  shareBtn:        {borderRadius:16,overflow:'hidden',marginBottom:8},
  shareBtnGrad:    {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  shareBtnTxt:     {fontSize:16,fontWeight:'700',color:'#fff'},
});