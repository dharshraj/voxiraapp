import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');
const C = { bg:'#0A1628', primary:'#1565FF', accent:'#4FC3F7', purple:'#A855F7', text:'#F0F4FF', muted:'rgba(240,244,255,0.5)' };

const STEPS = [
  { label:'Processing your answer',     icon:'mic-outline',          color:C.accent  },
  { label:'Analysing content & clarity',icon:'analytics-outline',    color:C.purple  },
  { label:'Checking STAR structure',    icon:'git-branch-outline',   color:'#22C55E' },
  { label:'Scoring your response',      icon:'star-outline',         color:'#F59E0B' },
  { label:'Preparing next question',    icon:'chatbubbles-outline',  color:C.primary },
];

export default function ThinkingScreen({ navigation, route }:any) {
  const { onDone } = route?.params ?? {};
  const fade  = useRef(new Animated.Value(0)).current;
  const spin  = useRef(new Animated.Value(0)).current;
  const dots  = useRef([0,1,2].map(()=>new Animated.Value(0))).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:400,useNativeDriver:true}).start();
    Animated.loop(Animated.timing(spin,{toValue:1,duration:1800,useNativeDriver:true})).start();
    dots.forEach((d,i)=>{
      Animated.loop(Animated.sequence([
        Animated.delay(i*200),
        Animated.timing(d,{toValue:1,duration:400,useNativeDriver:true}),
        Animated.timing(d,{toValue:0,duration:400,useNativeDriver:true}),
      ])).start();
    });
    // Auto navigate after 3 seconds if onDone provided
    if(onDone) setTimeout(onDone, 3000);
  },[]);

  const rotate = spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040','#0A1628','#050D1A']} style={StyleSheet.absoluteFill}/>
      <Animated.View style={[s.content,{opacity:fade}]}>

        {/* Spinner */}
        <View style={s.spinnerWrap}>
          <Animated.View style={[s.spinnerRing,{transform:[{rotate}]}]}>
            <LinearGradient colors={[C.purple,C.accent,C.purple]} style={s.spinnerGradLine}/>
          </Animated.View>
          <View style={s.spinnerCenter}>
            <Ionicons name="logo-electron" size={40} color={C.purple}/>
          </View>
        </View>

        <Text style={s.title}>AI is thinking...</Text>

        {/* Animated dots */}
        <View style={s.dotsRow}>
          {dots.map((d,i)=>(
            <Animated.View key={i} style={[s.dot,{opacity:d,transform:[{scale:d.interpolate({inputRange:[0,1],outputRange:[0.6,1.2]})}]}]}/>
          ))}
        </View>

        {/* Steps */}
        <View style={s.stepsList}>
          {STEPS.map((st,i)=>(
            <View key={i} style={s.stepRow}>
              <View style={[s.stepIcon,{backgroundColor:`${st.color}18`}]}>
                <Ionicons name={st.icon as any} size={16} color={st.color}/>
              </View>
              <Text style={s.stepTxt}>{st.label}</Text>
              <Ionicons name="checkmark" size={14} color={st.color}/>
            </View>
          ))}
        </View>

        <Text style={s.sub}>Evaluating your response and preparing personalised feedback</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'},
  content:      {alignItems:'center',paddingHorizontal:32,gap:20},
  spinnerWrap:  {width:120,height:120,alignItems:'center',justifyContent:'center',marginBottom:8},
  spinnerRing:  {position:'absolute',width:120,height:120,borderRadius:60},
  spinnerGradLine:{width:4,height:120,borderRadius:2,alignSelf:'flex-start'},
  spinnerCenter:{width:100,height:100,borderRadius:50,backgroundColor:'rgba(124,58,237,0.12)',borderWidth:1,borderColor:'rgba(124,58,237,0.25)',alignItems:'center',justifyContent:'center'},
  title:        {fontSize:22,fontWeight:'700',color:C.text,textAlign:'center'},
  dotsRow:      {flexDirection:'row',gap:8},
  dot:          {width:10,height:10,borderRadius:5,backgroundColor:C.purple},
  stepsList:    {width:'100%',gap:10,backgroundColor:'rgba(255,255,255,0.04)',borderRadius:18,padding:16,borderWidth:1,borderColor:'rgba(255,255,255,0.07)'},
  stepRow:      {flexDirection:'row',alignItems:'center',gap:10},
  stepIcon:     {width:30,height:30,borderRadius:9,alignItems:'center',justifyContent:'center'},
  stepTxt:      {flex:1,fontSize:13,color:C.muted},
  sub:          {fontSize:13,color:C.muted,textAlign:'center',lineHeight:20},
});

