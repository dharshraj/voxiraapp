import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const FREE_FEATURES = [
  '5 speech sessions per day','Basic grammar checker','5 mock interviews per month','Standard AI feedback','Progress tracking',
];
const PRO_FEATURES = [
  'Unlimited speech sessions','Advanced AI writing coach','Unlimited mock interviews','Real-time pronunciation scoring','Priority AI feedback','Custom interview roles','Offline mode','Ad-free experience','Export reports as PDF','Priority support',
];

const PLANS = [
  { id:'monthly', label:'Monthly',  price:'₹499',    period:'/month',  badge:null,          savings:null    },
  { id:'yearly',  label:'Yearly',   price:'₹3,999',  period:'/year',   badge:'Save 33%',    savings:'₹1,989'},
  { id:'lifetime',label:'Lifetime', price:'₹9,999',  period:'one-time',badge:'Best Value',   savings:null    },
];

export default function SubscriptionScreen({ navigation }:any) {
  const [selected, setSelected] = useState('yearly');
  const fade = useRef(new Animated.Value(0)).current;
  const pulse= useRef(new Animated.Value(1)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1.03,duration:1200,useNativeDriver:true}),
      Animated.timing(pulse,{toValue:1,duration:1200,useNativeDriver:true}),
    ])).start();
  },[]);

  const subscribe = () => {
    const plan = PLANS.find(p=>p.id===selected)!;
    Alert.alert(
      `Subscribe to Pro ${plan.label}`,
      `${plan.price} ${plan.period}\n\nThis would connect to your payment provider (Google Play / App Store). For demo purposes, this is a placeholder.`,
      [{text:'Cancel',style:'cancel'},{text:'Subscribe',onPress:()=>Alert.alert('Welcome to Pro! 🎉','Your account has been upgraded.')}]
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Upgrade to Pro</Text>
          <View style={{width:42}}/>
        </View>

        {/* Hero */}
        <Animated.View style={[s.hero,{transform:[{scale:pulse}]}]}>
          <LinearGradient colors={['#7C3AED','#1565FF']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill,{borderRadius:22}]}/>
          <View style={s.heroBubble1}/><View style={s.heroBubble2}/>
          <View style={s.heroIcon}><Ionicons name="diamond" size={36} color="#fff"/></View>
          <Text style={s.heroTitle}>Voxira Pro</Text>
          <Text style={s.heroSub}>Unlock your full communication potential</Text>
          <View style={s.heroTagRow}>
            {['Unlimited','AI-Powered','Expert Level'].map((t,i)=>(
              <View key={i} style={s.heroTag}>
                <Ionicons name="checkmark-circle" size={13} color={C.green}/>
                <Text style={s.heroTagTxt}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Plan selector */}
        <Text style={s.sectionTitle}>Choose Your Plan</Text>
        <View style={s.plansCol}>
          {PLANS.map(p=>(
            <TouchableOpacity key={p.id} style={[s.planCard, selected===p.id&&s.planCardActive]} onPress={()=>setSelected(p.id)} activeOpacity={0.82}>
              {selected===p.id && <LinearGradient colors={['rgba(21,101,255,0.15)','rgba(21,101,255,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:17}]}/>}
              {p.badge && (
                <View style={s.planBadge}>
                  <Text style={s.planBadgeTxt}>{p.badge}</Text>
                </View>
              )}
              <View style={s.planLeft}>
                <View style={[s.planRadio, selected===p.id&&s.planRadioActive]}>
                  {selected===p.id&&<View style={s.planRadioDot}/>}
                </View>
                <Text style={s.planLabel}>{p.label}</Text>
                {p.savings && <Text style={s.planSavings}>Save {p.savings}</Text>}
              </View>
              <View style={s.planRight}>
                <Text style={[s.planPrice, selected===p.id&&{color:C.primary}]}>{p.price}</Text>
                <Text style={s.planPeriod}>{p.period}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feature comparison */}
        <Text style={s.sectionTitle}>What You Get</Text>
        <View style={s.compareRow}>
          <View style={s.compareCol}>
            <View style={s.compareHeader}>
              <Text style={s.compareHeaderTxt}>Free</Text>
            </View>
            {FREE_FEATURES.map((f,i)=>(
              <View key={i} style={s.featureRow}>
                <Ionicons name="checkmark" size={14} color={C.muted}/>
                <Text style={s.featureTxtMuted}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={[s.compareCol,s.compareColPro]}>
            <LinearGradient colors={['rgba(124,58,237,0.20)','rgba(21,101,255,0.10)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <View style={s.compareHeader}>
              <Ionicons name="diamond" size={14} color={C.gold}/>
              <Text style={[s.compareHeaderTxt,{color:C.gold}]}>Pro</Text>
            </View>
            {PRO_FEATURES.map((f,i)=>(
              <View key={i} style={s.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={C.green}/>
                <Text style={s.featureTxt}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.ctaBtn} onPress={subscribe} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED','#1565FF']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.ctaBtnGrad}>
            <Ionicons name="diamond-outline" size={20} color="#fff"/>
            <Text style={s.ctaBtnTxt}>Subscribe Now — {PLANS.find(p=>p.id===selected)?.price}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.fine}>Cancel anytime. Payments processed securely via App Store / Google Play. Prices shown in INR.</Text>

        <View style={{height:40}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:20},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  hero:          {marginHorizontal:20,borderRadius:22,padding:24,borderWidth:1,borderColor:'rgba(124,58,237,0.3)',overflow:'hidden',alignItems:'center',gap:10},
  heroBubble1:   {position:'absolute',right:-30,top:-30,width:150,height:150,borderRadius:75,backgroundColor:'rgba(255,255,255,0.07)'},
  heroBubble2:   {position:'absolute',left:-20,bottom:-20,width:100,height:100,borderRadius:50,backgroundColor:'rgba(255,255,255,0.05)'},
  heroIcon:      {width:72,height:72,borderRadius:22,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center'},
  heroTitle:     {fontSize:24,fontWeight:'800',color:'#fff',letterSpacing:-0.5},
  heroSub:       {fontSize:13,color:'rgba(255,255,255,0.6)',textAlign:'center'},
  heroTagRow:    {flexDirection:'row',gap:8,flexWrap:'wrap',justifyContent:'center'},
  heroTag:       {flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'rgba(255,255,255,0.10)',borderRadius:20,paddingHorizontal:10,paddingVertical:5},
  heroTagTxt:    {fontSize:11,color:'rgba(255,255,255,0.85)',fontWeight:'500'},
  scroll:        {paddingHorizontal:20,paddingTop:16},
  sectionTitle:  {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12,marginTop:8},
  plansCol:      {gap:10,marginBottom:24},
  planCard:      {flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:C.bgCard,borderRadius:18,padding:16,borderWidth:1.5,borderColor:C.border,overflow:'hidden',position:'relative'},
  planCardActive:{borderColor:C.primary},
  planBadge:     {position:'absolute',top:-1,right:12,backgroundColor:C.gold,borderRadius:0,borderBottomLeftRadius:8,borderBottomRightRadius:8,paddingHorizontal:10,paddingVertical:3},
  planBadgeTxt:  {fontSize:10,fontWeight:'700',color:'#000'},
  planLeft:      {flexDirection:'row',alignItems:'center',gap:12},
  planRadio:     {width:20,height:20,borderRadius:10,borderWidth:2,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  planRadioActive:{borderColor:C.primary},
  planRadioDot:  {width:10,height:10,borderRadius:5,backgroundColor:C.primary},
  planLabel:     {fontSize:15,fontWeight:'700',color:C.text},
  planSavings:   {fontSize:11,color:C.green,fontWeight:'600'},
  planRight:     {alignItems:'flex-end'},
  planPrice:     {fontSize:18,fontWeight:'800',color:C.text},
  planPeriod:    {fontSize:11,color:C.muted},
  compareRow:    {flexDirection:'row',gap:10,marginBottom:24},
  compareCol:    {flex:1,backgroundColor:C.bgCard,borderRadius:18,padding:14,borderWidth:1,borderColor:C.border,gap:10,overflow:'hidden'},
  compareColPro: {borderColor:'rgba(124,58,237,0.35)'},
  compareHeader: {flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  compareHeaderTxt:{fontSize:14,fontWeight:'700',color:C.text},
  featureRow:    {flexDirection:'row',alignItems:'flex-start',gap:7},
  featureTxt:    {flex:1,fontSize:12,color:C.muted,lineHeight:17},
  featureTxtMuted:{flex:1,fontSize:12,color:C.hint,lineHeight:17},
  ctaBtn:        {borderRadius:16,overflow:'hidden',marginBottom:14},
  ctaBtnGrad:    {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  ctaBtnTxt:     {fontSize:15,fontWeight:'700',color:'#fff'},
  fine:          {fontSize:11,color:C.hint,textAlign:'center',lineHeight:18},
});
