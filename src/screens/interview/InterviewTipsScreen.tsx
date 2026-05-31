import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = { bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C', primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E', gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444', text:'#F0F4FF', muted:'rgba(240,244,255,0.50)', hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)' };

const CATEGORIES=[
  { label:'Before',  icon:'calendar-outline',   color:C.accent  },
  { label:'During',  icon:'mic-outline',         color:C.green   },
  { label:'Answers', icon:'chatbubbles-outline', color:C.purple  },
  { label:'After',   icon:'flag-outline',        color:C.gold    },
];

const TIPS_BY_CAT:Record<string,{title:string,desc:string,icon:string,color:string}[]>={
  Before:[
    {title:'Research the company',         desc:'Know their mission, recent news, products, and culture. Mention specifics during the interview to show genuine interest.',               icon:'search-outline',        color:C.accent},
    {title:'Prepare your STAR stories',    desc:'Prepare 5-7 specific stories from your experience that cover leadership, failure, success, conflict, and teamwork. Rehearse them.',    icon:'list-outline',          color:C.purple},
    {title:'Get a good night\'s sleep',   desc:'Sleep deprivation reduces confidence, vocabulary, and cognitive speed — three things interviews measure directly.',                      icon:'moon-outline',          color:C.accent},
    {title:'Prepare smart questions',      desc:'Prepare 3-5 thoughtful questions to ask the interviewer. It shows curiosity and engagement. Avoid asking about salary first.',         icon:'help-circle-outline',   color:C.gold},
    {title:'Do a mock interview',          desc:'Use Voxira\'s AI mock interview at least 3 times before the real one. Hearing yourself speak builds fluency and reduces anxiety.',     icon:'people-outline',        color:C.green},
  ],
  During:[
    {title:'Pause before answering',       desc:'Take 3-5 seconds to think before speaking. Interviewers respect this — it shows you think before you act.',                            icon:'pause-circle-outline',  color:C.accent},
    {title:'Make eye contact',             desc:'For video interviews, look at the camera, not the screen. For in-person, maintain natural eye contact — look away occasionally.',      icon:'eye-outline',           color:C.green},
    {title:'Control your pace',            desc:'Speak at 120-140 WPM. Slow down when making important points. Pauses add emphasis, not weakness.',                                    icon:'speedometer-outline',   color:C.gold},
    {title:'Eliminate filler words',       desc:'Replace "um", "uh", and "like" with a confident pause. Practice this daily using Voxira\'s speech analysis feature.',                icon:'mic-outline',           color:C.purple},
    {title:'Mirror the interviewer\'s tone',desc:'Match the energy level of your interviewer. More formal → be more formal. More casual → relax a bit. This builds rapport.',          icon:'people-circle-outline', color:C.accent},
  ],
  Answers:[
    {title:'Use the STAR method',          desc:'Every behavioral answer: Situation (what was the context?) → Task (what was your responsibility?) → Action (what did you do specifically?) → Result (what was the measurable outcome?).',  icon:'git-branch-outline',   color:C.accent},
    {title:'Lead with the conclusion',     desc:'Tell them the outcome first, then explain how. "I led a project that saved $200K. Here is how..." keeps attention and sounds confident.',                                                   icon:'arrow-up-outline',     color:C.green},
    {title:'Quantify everything you can',  desc:'"I improved performance" is weak. "I improved API response time by 40%, reducing customer complaints by 25%" is powerful. Numbers are memorable.',                                         icon:'bar-chart-outline',    color:C.gold},
    {title:'Be honest about weaknesses',   desc:'Pick a real weakness that you are actively working to improve. Show self-awareness and growth mindset — not a fake strength disguised as a weakness.',                                     icon:'shield-checkmark-outline',color:C.purple},
    {title:'Show enthusiasm',              desc:'At the end of each answer, connect back to the role: "This experience is exactly why I am excited about this position at your company."',                                                   icon:'heart-outline',        color:C.danger},
  ],
  After:[
    {title:'Send a thank-you email',       desc:'Within 24 hours, send a personalised thank-you email. Reference a specific topic from the conversation. This makes you memorable.',  icon:'mail-outline',          color:C.accent},
    {title:'Note what went well',          desc:'Write down questions you answered well and questions you struggled with. Use this to improve your next Voxira practice session.',       icon:'create-outline',        color:C.green},
    {title:'Follow up professionally',     desc:'If you have not heard back after the promised timeline, one polite follow-up email is appropriate. More than one becomes a red flag.',  icon:'send-outline',          color:C.gold},
    {title:'Do not dwell on mistakes',     desc:'Every interviewer expects imperfection. One bad answer rarely kills your chances. Your overall presence and enthusiasm matter more.',   icon:'refresh-outline',       color:C.purple},
  ],
};

export default function InterviewTipsScreen({ navigation }:any){
  const [activeCat,setActiveCat]=useState('Before');
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{ Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start(); },[]);

  const tips=TIPS_BY_CAT[activeCat]??[];

  return(
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Interview Tips</Text>
            <Text style={s.headerSub}>Master every stage of your interview</Text>
          </View>
          <View style={{width:42}}/>
        </View>
        {/* Category tabs */}
        <View style={s.catRow}>
          {CATEGORIES.map(cat=>(
            <TouchableOpacity key={cat.label} style={[s.catBtn,activeCat===cat.label&&{borderColor:`${cat.color}60`,backgroundColor:`${cat.color}15`}]}
              onPress={()=>setActiveCat(cat.label)}>
              <Ionicons name={cat.icon as any} size={16} color={activeCat===cat.label?cat.color:C.muted}/>
              <Text style={[s.catTxt,{color:activeCat===cat.label?cat.color:C.muted}]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)] contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.tipsList}>
          {tips.map((tip,i)=>(
            <View key={i} style={[s.tipCard,i===tips.length-1&&{borderBottomWidth:0}]}>
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

        {/* Practice CTA */}
        <View style={s.ctaCard}>
          <LinearGradient colors={['rgba(124,58,237,0.20)','rgba(124,58,237,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
          <Ionicons name="people" size={32} color={C.purple}/>
          <Text style={s.ctaTitle}>Ready to practice?</Text>
          <Text style={s.ctaSub}>Apply these tips in a mock interview with your AI coach</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={()=>navigation.navigate('ChooseRole')} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED','#4C1D95']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.ctaBtnGrad}>
              <Text style={s.ctaBtnTxt}>Start Mock Interview</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff"/>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  headerBg:{paddingBottom:16},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:32,marginBottom:14,gap:10},
  backBtn:{width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerCenter:{flex:1},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.text},
  headerSub:{fontSize:12,color:C.muted,marginTop:2},
  catRow:{flexDirection:'row',paddingHorizontal:20,gap:8},
  catBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:10,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.bgCard},
  catTxt:{fontSize:12,fontWeight:'600'},
  scroll:{paddingHorizontal:20,paddingTop:16},
  tipsList:{backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:20},
  tipCard:{flexDirection:'row',gap:14,padding:16,borderBottomWidth:1,borderBottomColor:C.border,alignItems:'flex-start'},
  tipIcon:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center',flexShrink:0},
  tipBody:{flex:1,gap:6},
  tipTitle:{fontSize:14,fontWeight:'700',color:C.text},
  tipDesc:{fontSize:13,color:C.muted,lineHeight:20},
  ctaCard:{borderRadius:18,padding:20,borderWidth:1,borderColor:'rgba(124,58,237,0.25)',overflow:'hidden',alignItems:'center',gap:10},
  ctaTitle:{fontSize:18,fontWeight:'700',color:C.text},
  ctaSub:{fontSize:13,color:C.muted,textAlign:'center'},
  ctaBtn:{width:'100%',borderRadius:14,overflow:'hidden',marginTop:4},
  ctaBtnGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:14},
  ctaBtnTxt:{fontSize:15,fontWeight:'700',color:'#fff'},
});
