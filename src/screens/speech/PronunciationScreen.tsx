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

const WORD_SCORES = [
  { word:'Communication', score:92, issue:null,         phonetic:'kəˌmjuːnɪˈkeɪʃən' },
  { word:'Particularly',  score:68, issue:'Stress',     phonetic:'pəˈtɪkjʊləli' },
    { word:'Pronunciation', score:74, issue:'Vowel',      phonetic:'prəˌnʌnsiˈeɪʃən' },
  { word:'Specifically',  score:88, issue:null,         phonetic:'spəˈsɪfɪkli' },
  { word:'Entrepreneur',  score:55, issue:'Stress',     phonetic:'ˌɒntrəprəˈnɜːr' },
  { word:'Comfortable',   score:82, issue:'Omission',   phonetic:'ˈkʌmftəbəl' },
  { word:'Sophisticated', score:91, issue:null,         phonetic:'səˈfɪstɪkeɪtɪd' },
  { word:'Hierarchy',     score:63, issue:'Vowel',      phonetic:'ˈhaɪərɑːrki' },
];

const TIPS = [
  { title:'Slow down on long words',    desc:'Break multi-syllable words into parts. "Com-mu-ni-ca-tion" — say each part clearly before saying the full word.',          icon:'timer-outline',        color:C.accent  },
  { title:'Record and listen back',     desc:'Record yourself saying a tricky word 10 times. Compare it to a native speaker on Google Translate or Forvo.com.',         icon:'mic-outline',          color:C.green   },
  { title:'Mouth movement matters',     desc:'Exaggerate your mouth movements when practising alone. Lips, tongue, and jaw position determine your vowel sounds.',       icon:'happy-outline',        color:C.gold    },
  { title:'Focus on word stress',       desc:'English meaning changes with stress. "PRE-sent" (noun) vs "pre-SENT" (verb). Learn the stressed syllable for each word.', icon:'volume-high-outline',  color:C.purple  },
  { title:'Practice tongue twisters',   desc:'"She sells sea shells" and "Red lorry, yellow lorry" train your tongue to move quickly and precisely.',                   icon:'flame-outline',        color:C.danger  },
];

const COMMON_MISTAKES = [
  { mistake:'Dropping final consonants', example:'"Bes(t)" sounds like "Bes"', fix:'Clearly pronounce the last sound of each word.' },
  { mistake:'Th sound → D or F',        example:'"This" sounds like "Dis"',   fix:'Place tongue between teeth for the "th" sound.'  },
  { mistake:'V sound → W or B',         example:'"Very" sounds like "Wery"',  fix:'Bite lower lip gently for the "v" sound.'        },
  { mistake:'Vowel shortening',         example:'"Ship" sounds like "Sheep"', fix:'Distinguish short i (ship) from long ee (sheep).'},
];

function scoreColor(s:number){ return s>=85?C.green:s>=70?C.accent:s>=55?C.gold:C.danger; }

export default function PronunciationScreen({ navigation, route }:any){
  const { overallScore = 78 } = route?.params ?? {};
  const [activeTab, setActiveTab] = useState<'words'|'tips'|'mistakes'>('words');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const avgScore = Math.round(WORD_SCORES.reduce((a,b)=>a+b.score,0)/WORD_SCORES.length);
  const goodWords = WORD_SCORES.filter(w=>w.score>=85).length;
  const issueWords = WORD_SCORES.filter(w=>w.score<70).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Pronunciation Report</Text>
          <View style={{width:42}}/>
        </View>

        {/* Score overview */}
        <View style={s.scoreWrap}>
          <View style={[s.scoreCircle,{borderColor:`${scoreColor(avgScore)}55`}]}>
            <Text style={[s.scoreNum,{color:scoreColor(avgScore)}]}>{avgScore}</Text>
            <Text style={s.scoreMax}>/100</Text>
          </View>
          <View style={s.scoreMeta}>
            <Text style={s.scoreLabel}>Pronunciation Score</Text>
            <View style={s.scoreStats}>
              <View style={s.scoreStat}>
                <Ionicons name="checkmark-circle" size={14} color={C.green}/>
                <Text style={[s.scoreStatTxt,{color:C.green}]}>{goodWords} words clear</Text>
              </View>
              <View style={s.scoreStat}>
                <Ionicons name="alert-circle" size={14} color={C.danger}/>
                <Text style={[s.scoreStatTxt,{color:C.danger}]}>{issueWords} need work</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {(['words','tips','mistakes'] as const).map(t=>(
            <TouchableOpacity key={t} style={[s.tabBtn, activeTab===t&&s.tabBtnActive]} onPress={()=>setActiveTab(t)}>
              <Text style={[s.tabTxt, activeTab===t&&s.tabTxtActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {activeTab==='words' && (
          <>
            <Text style={s.sectionTitle}>Word-by-Word Analysis</Text>
            <View style={s.wordList}>
              {WORD_SCORES.map((w,i)=>{
                const col = scoreColor(w.score);
                return (
                  <View key={i} style={[s.wordRow, i===WORD_SCORES.length-1&&{borderBottomWidth:0}]}>
                    <View style={s.wordLeft}>
                      <Text style={s.wordText}>{w.word}</Text>
                      <Text style={s.wordPhonetic}>/{w.phonetic}/</Text>
                      {w.issue && (
                        <View style={[s.issueBadge,{backgroundColor:`${C.danger}18`}]}>
                          <Text style={[s.issueBadgeTxt,{color:C.danger}]}>{w.issue} issue</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.wordRight}>
                      <View style={[s.wordScore,{backgroundColor:`${col}18`}]}>
                        <Text style={[s.wordScoreTxt,{color:col}]}>{w.score}</Text>
                      </View>
                      <View style={s.wordBarBg}>
                        <View style={[s.wordBarFill,{width:`${w.score}%`,backgroundColor:col}]}/>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={s.practiceBtn} onPress={()=>navigation.navigate('Record',{mode:'Free Speech'})} activeOpacity={0.85}>
              <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.practiceBtnGrad}>
                <Ionicons name="mic" size={20} color="#fff"/>
                <Text style={s.practiceBtnTxt}>Practice These Words</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {activeTab==='tips' && (
          <>
            <Text style={s.sectionTitle}>How to Improve</Text>
            <View style={s.tipsList}>
              {TIPS.map((tip,i)=>(
                <View key={i} style={s.tipCard}>
                  <View style={[s.tipIcon,{backgroundColor:`${tip.color}18`}]}>
                    <Ionicons name={tip.icon as any} size={22} color={tip.color}/>
                  </View>
                  <View style={s.tipBody}>
                    <Text style={s.tipTitle}>{tip.title}</Text>
                    <Text style={s.tipDesc}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab==='mistakes' && (
          <>
            <Text style={s.sectionTitle}>Common Mistakes Found</Text>
            <View style={s.mistakeList}>
              {COMMON_MISTAKES.map((m,i)=>(
                <View key={i} style={[s.mistakeCard, i===COMMON_MISTAKES.length-1&&{borderBottomWidth:0}]}>
                  <View style={s.mistakeTop}>
                    <Ionicons name="close-circle" size={16} color={C.danger}/>
                    <Text style={s.mistakeTitle}>{m.mistake}</Text>
                  </View>
                  <View style={s.mistakeExample}>
                    <Text style={s.mistakeExTxt}>Example: {m.example}</Text>
                  </View>
                  <View style={s.mistakeFix}>
                    <Ionicons name="bulb-outline" size={14} color={C.gold}/>
                    <Text style={s.mistakeFixTxt}>{m.fix}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

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
  scoreWrap:      {flexDirection:'row',alignItems:'center',gap:20,paddingHorizontal:20,marginBottom:16},
  scoreCircle:    {width:88,height:88,borderRadius:44,borderWidth:4,alignItems:'center',justifyContent:'center',flexShrink:0},
  scoreNum:       {fontSize:30,fontWeight:'800'},
  scoreMax:       {fontSize:11,color:C.hint},
  scoreMeta:      {flex:1},
  scoreLabel:     {fontSize:15,fontWeight:'700',color:C.text,marginBottom:10},
  scoreStats:     {gap:6},
  scoreStat:      {flexDirection:'row',alignItems:'center',gap:6},
  scoreStatTxt:   {fontSize:12,fontWeight:'500'},
  tabRow:         {flexDirection:'row',marginHorizontal:20,backgroundColor:C.surface,borderRadius:14,padding:4,gap:4,marginBottom:4},
  tabBtn:         {flex:1,paddingVertical:8,borderRadius:10,alignItems:'center'},
  tabBtnActive:   {backgroundColor:C.primary},
  tabTxt:         {fontSize:13,color:C.muted,fontWeight:'500'},
  tabTxtActive:   {color:'#fff',fontWeight:'600'},
  scroll:         {paddingHorizontal:20,paddingTop:16},
  sectionTitle:   {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  wordList:       {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:20},
  wordRow:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderBottomWidth:1,borderBottomColor:C.border,gap:12},
  wordLeft:       {flex:1,gap:4},
  wordText:       {fontSize:14,fontWeight:'700',color:C.text},
  wordPhonetic:   {fontSize:11,color:C.muted,fontStyle:'italic'},
  issueBadge:     {alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:3,borderRadius:8},
  issueBadgeTxt:  {fontSize:10,fontWeight:'700'},
  wordRight:      {alignItems:'flex-end',gap:6,width:80},
  wordScore:      {paddingHorizontal:10,paddingVertical:4,borderRadius:10},
  wordScoreTxt:   {fontSize:13,fontWeight:'800'},
  wordBarBg:      {width:70,height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  wordBarFill:    {height:'100%',borderRadius:2},
  practiceBtn:    {borderRadius:16,overflow:'hidden',marginBottom:8},
  practiceBtnGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  practiceBtnTxt: {fontSize:16,fontWeight:'700',color:'#fff'},
  tipsList:       {gap:10},
  tipCard:        {flexDirection:'row',gap:14,backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border,alignItems:'flex-start'},
  tipIcon:        {width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',flexShrink:0},
  tipBody:        {flex:1},
  tipTitle:       {fontSize:14,fontWeight:'700',color:C.text,marginBottom:4},
  tipDesc:        {fontSize:12,color:C.muted,lineHeight:18},
  mistakeList:    {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border},
  mistakeCard:    {padding:16,borderBottomWidth:1,borderBottomColor:C.border,gap:10},
  mistakeTop:     {flexDirection:'row',alignItems:'center',gap:8},
  mistakeTitle:   {fontSize:14,fontWeight:'700',color:C.text},
  mistakeExample: {backgroundColor:'rgba(239,68,68,0.08)',borderRadius:10,padding:10},
  mistakeExTxt:   {fontSize:12,color:C.muted,fontStyle:'italic'},
  mistakeFix:     {flexDirection:'row',alignItems:'flex-start',gap:8},
  mistakeFixTxt:  {flex:1,fontSize:12,color:C.muted,lineHeight:18},
});