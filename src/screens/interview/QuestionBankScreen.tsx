import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = { bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C', primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E', gold:'#F59E0B', purple:'#A855F7', text:'#F0F4FF', muted:'rgba(240,244,255,0.50)', hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)' };

const QUESTIONS=[
  {cat:'Behavioral', q:'Tell me about a time you failed. What did you learn?',           tip:'Be honest. Show self-awareness and growth mindset.',           icon:'person-outline',        color:C.accent},
  {cat:'Behavioral', q:'Describe your greatest professional achievement.',                 tip:'Use STAR. Focus on measurable impact and your specific role.',  icon:'trophy-outline',        color:C.gold},
  {cat:'Behavioral', q:'How do you handle conflict with a colleague?',                     tip:'Stay neutral, focus on the resolution process, not blame.',     icon:'people-outline',        color:C.green},
  {cat:'Behavioral', q:'Tell me about a time you showed leadership.',                      tip:'Even without a title — did you influence, guide, or initiative?',icon:'star-outline',         color:C.purple},
  {cat:'Behavioral', q:'How do you handle working under pressure?',                        tip:'Give a real example. Show calm, strategy, not just "I thrive".',  icon:'flash-outline',        color:C.gold},
  {cat:'Technical',  q:'How do you ensure code quality and maintainability?',              tip:'Mention code reviews, testing, documentation, naming conventions.',icon:'code-slash-outline',   color:C.accent},
  {cat:'Technical',  q:'Explain a complex technical concept to a non-technical person.',   tip:'Use an analogy. Show communication skill, not just knowledge.',  icon:'chatbubbles-outline',   color:C.green},
  {cat:'Situational',q:'If you disagreed with your managers decision, what would you do?',tip:'Show diplomacy. Raise concerns professionally, then commit.',    icon:'git-branch-outline',    color:C.purple},
  {cat:'Situational',q:'A project deadline is tomorrow and the team is behind. What do?', tip:'Prioritise, communicate, delegate, escalate if needed.',          icon:'alarm-outline',         color:'#EF4444'},
  {cat:'Motivational',q:'Why do you want to work at our company?',                        tip:'Show research. Mention mission, products, culture, growth.',      icon:'business-outline',      color:C.accent},
  {cat:'Motivational',q:'Where do you see yourself in 5 years?',                          tip:'Show ambition aligned with the role. Be realistic and specific.',  icon:'telescope-outline',     color:C.gold},
  {cat:'Motivational',q:'What are your greatest strengths?',                               tip:'Pick 2-3 with evidence. Align to job description requirements.',  icon:'thumbs-up-outline',     color:C.green},
];

const CATS=['All','Behavioral','Technical','Situational','Motivational'];

export default function QuestionBankScreen({ navigation }:any){
  const [cat,setCat]=useState('All');
  const [saved,setSaved]=useState<number[]>([]);
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{ Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start(); },[]);

  const filtered=QUESTIONS.filter(q=>cat==='All'||q.cat===cat);
  const toggleSave=(i:number)=>setSaved(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i]);

  return(
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Question Bank</Text>
            <Text style={s.headerSub}>{filtered.length} questions</Text>
          </View>
          <View style={{width:42}}/>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {CATS.map(c=>(
            <TouchableOpacity key={c} style={[s.chip,cat===c&&s.chipActive]} onPress={()=>setCat(c)}>
              <Text style={[s.chipTxt,cat===c&&s.chipTxtActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
      <Animated.ScrollView style={{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)] contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.qList}>
          {filtered.map((q,i)=>(
            <View key={i} style={[s.qCard,i===filtered.length-1&&{borderBottomWidth:0}]}>
              <View style={s.qTop}>
                <View style={[s.qIcon,{backgroundColor:`${q.color}18`}]}>
                  <Ionicons name={q.icon as any} size={18} color={q.color}/>
                </View>
                <View style={[s.catBadge,{backgroundColor:`${q.color}18`}]}>
                  <Text style={[s.catBadgeTxt,{color:q.color}]}>{q.cat}</Text>
                </View>
                <TouchableOpacity onPress={()=>toggleSave(i)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Ionicons name={saved.includes(i)?'bookmark':'bookmark-outline'} size={20} color={saved.includes(i)?C.gold:C.hint}/>
                </TouchableOpacity>
              </View>
              <Text style={s.qText}>{q.q}</Text>
              <View style={s.tipWrap}>
                <Ionicons name="bulb-outline" size={13} color={C.gold}/>
                <Text style={s.tipText}>{q.tip}</Text>
              </View>
              <TouchableOpacity style={s.practiceBtn} onPress={()=>navigation.navigate('InterviewSetup',{})}>
                <Text style={s.practiceBtnTxt}>Practice this question →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  headerBg:{paddingBottom:12},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:32,marginBottom:12,gap:10},
  backBtn:{width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerCenter:{flex:1},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.text},
  headerSub:{fontSize:12,color:C.muted,marginTop:2},
  filterRow:{paddingHorizontal:20,gap:8,paddingBottom:4},
  chip:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  chipActive:{backgroundColor:C.primary,borderColor:C.primary},
  chipTxt:{fontSize:12,color:C.muted,fontWeight:'500'},
  chipTxtActive:{color:'#fff'},
  scroll:{paddingHorizontal:20,paddingTop:16},
  qList:{backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border},
  qCard:{padding:16,borderBottomWidth:1,borderBottomColor:C.border,gap:10},
  qTop:{flexDirection:'row',alignItems:'center',gap:8},
  qIcon:{width:32,height:32,borderRadius:9,alignItems:'center',justifyContent:'center'},
  catBadge:{paddingHorizontal:8,paddingVertical:3,borderRadius:8,flex:1},
  catBadgeTxt:{fontSize:10,fontWeight:'700'},
  qText:{fontSize:14,color:C.text,lineHeight:21,fontWeight:'500'},
  tipWrap:{flexDirection:'row',gap:6,alignItems:'flex-start'},
  tipText:{flex:1,fontSize:12,color:C.muted,lineHeight:17},
  practiceBtn:{alignSelf:'flex-start'},
  practiceBtnTxt:{fontSize:12,color:C.primary,fontWeight:'600'},
});
