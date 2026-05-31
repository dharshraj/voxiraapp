import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Linking,
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

const SECTIONS = [
  {
    title:'1. Information We Collect',
    icon:'information-circle-outline',
    color: C.accent,
    content: [
      { heading:'Account Information', body:'When you register, we collect your name, email address, and password (stored securely via Supabase Auth). We never store plain-text passwords.' },
      { heading:'Speech Data', body:'When you record a speech session, the audio is sent to our AI provider for transcription and analysis. We do not store raw audio files. Only the analysed results (score, transcript text, filler word count, duration) are saved to your account.' },
      { heading:'Writing Data', body:'Text you submit for writing analysis is sent to our AI provider. We store the original text, corrections, and scores in your account for your history and progress tracking.' },
      { heading:'Interview Data', body:'Your spoken or typed answers during mock interviews are processed by AI. We store question–answer pairs and scores for your review and progress tracking.' },
      { heading:'Usage Data', body:'We collect anonymised usage analytics such as which features are used, session frequency, and app performance data. This data cannot identify you personally.' },
    ],
  },
  {
    title:'2. How We Use Your Data',
    icon:'cog-outline',
    color: C.gold,
    content: [
      { heading:'Personalise your experience', body:'We use your history and scores to show your progress, calculate streaks, and make personalised improvement suggestions.' },
      { heading:'Improve the product', body:'Anonymised, aggregated usage data helps us understand which features are most useful and where to focus development efforts.' },
      { heading:'Send notifications', body:'With your permission, we send practice reminders, streak alerts, and achievement notifications. You can manage these in Settings → Notifications.' },
      { heading:'Customer support', body:'When you contact us, we use your account information and usage history to help resolve issues faster.' },
    ],
  },
  {
    title:'3. Data Storage & Security',
    icon:'shield-checkmark-outline',
    color: C.green,
    content: [
      { heading:'Where data is stored', body:'Your data is stored on Supabase infrastructure hosted on AWS. Servers are located in Singapore (Southeast Asia region) for best performance for Indian users.' },
      { heading:'Encryption', body:'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Auth tokens are stored securely using your device\'s secure keychain (iOS) or Keystore (Android).' },
      { heading:'Access controls', body:'Only you can access your personal data. Voxira employees do not have access to individual user data unless required for support and only with your permission.' },
      { heading:'Retention', body:'We retain your data as long as your account is active. If you delete your account, all personal data is permanently deleted within 30 days.' },
    ],
  },
  {
    title:'4. Third-Party Services',
    icon:'git-network-outline',
    color: C.purple,
    content: [
      { heading:'Supabase', body:'Our backend provider for authentication, database, and storage. Supabase is SOC 2 Type II certified. Privacy policy: supabase.com/privacy' },
      { heading:'AssemblyAI / OpenAI Whisper', body:'Used to transcribe your speech recordings into text. Audio is processed in real-time and not stored by the provider beyond the API request.' },
      { heading:'Anthropic Claude API', body:'Used to analyse writing and generate interview feedback. Text submitted is subject to Anthropic\'s API data usage policy: anthropic.com/privacy' },
      { heading:'Expo / React Native', body:'Our app framework. Expo collects minimal crash and performance analytics. See expo.dev/privacy for details.' },
    ],
  },
  {
    title:'5. Your Rights',
    icon:'person-circle-outline',
    color: C.accent,
    content: [
      { heading:'Access your data', body:'You can view all your session history, scores, and profile data within the app at any time.' },
      { heading:'Export your data', body:'Go to Settings → Privacy → Export My Data. We will email you a JSON file of all your data within 24 hours.' },
      { heading:'Delete your data', body:'Go to Profile → Settings → Delete Account to permanently remove all your data from our systems.' },
      { heading:'Correct your data', body:'Update your name and profile information any time in Profile → Edit Profile.' },
      { heading:'Opt out of analytics', body:'Go to Settings → Privacy & Data → Analytics to opt out of anonymised usage tracking.' },
    ],
  },
  {
    title:'6. Children\'s Privacy',
    icon:'happy-outline',
    color: C.gold,
    content: [
      { heading:'Age requirement', body:'Voxira is intended for users aged 13 and above. We do not knowingly collect personal data from children under 13. If we discover such data has been collected, it will be deleted immediately.' },
    ],
  },
  {
    title:'7. Changes to This Policy',
    icon:'document-text-outline',
    color: C.muted,
    content: [
      { heading:'Updates', body:'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of Voxira after changes constitutes acceptance of the updated policy.' },
      { heading:'Last updated', body:'This policy was last updated on 1 January 2025.' },
    ],
  },
];

export default function PrivacyPolicyScreen({ navigation }:any) {
  const [openIdx, setOpenIdx] = useState<number|null>(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <View style={{width:42}}/>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <LinearGradient colors={['rgba(34,197,94,0.18)','rgba(34,197,94,0.04)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
          <Ionicons name="shield-checkmark" size={32} color={C.green}/>
          <View style={{flex:1}}>
            <Text style={s.heroTitle}>Your Privacy Matters</Text>
            <Text style={s.heroSub}>Last updated: 1 January 2025 · Effective immediately</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Intro */}
        <View style={s.introCard}>
          <Text style={s.introTxt}>
            Voxira is committed to protecting your privacy. This policy explains what data we collect, why we collect it, how we use it, and your rights over your own data.{'\n\n'}
            We never sell your personal data to third parties. We do not use your data for advertising. Everything we collect is used solely to improve your experience with Voxira.
          </Text>
        </View>

        {/* Sections — accordion */}
        {SECTIONS.map((sec,i)=>(
          <View key={i} style={s.accordion}>
            <TouchableOpacity style={s.accordionHead} onPress={()=>setOpenIdx(openIdx===i?null:i)} activeOpacity={0.8}>
              <View style={[s.secIcon,{backgroundColor:`${sec.color}18`}]}>
                <Ionicons name={sec.icon as any} size={18} color={sec.color}/>
              </View>
              <Text style={s.secTitle}>{sec.title}</Text>
              <Ionicons name={openIdx===i?'chevron-up':'chevron-down'} size={18} color={C.muted}/>
            </TouchableOpacity>
            {openIdx===i && (
              <View style={s.accordionBody}>
                {sec.content.map((item,j)=>(
                  <View key={j} style={[s.contentItem, j===sec.content.length-1&&{borderBottomWidth:0}]}>
                    <Text style={s.contentHeading}>{item.heading}</Text>
                    <Text style={s.contentBody}>{item.body}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Contact */}
        <View style={s.contactCard}>
          <Text style={s.contactTitle}>Questions about your privacy?</Text>
          <Text style={s.contactSub}>Contact our Data Protection Officer</Text>
          <TouchableOpacity style={s.contactBtn} onPress={()=>Linking.openURL('mailto:privacy@voxira.app')} activeOpacity={0.85}>
            <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.contactBtnGrad}>
              <Ionicons name="mail-outline" size={18} color="#fff"/>
              <Text style={s.contactBtnTxt}>privacy@voxira.app</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:16},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:14},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  heroCard:      {marginHorizontal:20,borderRadius:18,padding:16,borderWidth:1,borderColor:'rgba(34,197,94,0.25)',overflow:'hidden',flexDirection:'row',alignItems:'center',gap:14},
  heroTitle:     {fontSize:15,fontWeight:'700',color:C.text,marginBottom:3},
  heroSub:       {fontSize:11,color:C.muted},
  scroll:        {paddingHorizontal:20,paddingTop:16},
  introCard:     {backgroundColor:C.bgCard,borderRadius:18,padding:16,borderWidth:1,borderColor:C.border,marginBottom:16},
  introTxt:      {fontSize:13,color:C.muted,lineHeight:21},
  accordion:     {backgroundColor:C.bgCard,borderRadius:18,borderWidth:1,borderColor:C.border,marginBottom:10,overflow:'hidden'},
  accordionHead: {flexDirection:'row',alignItems:'center',gap:12,padding:14},
  secIcon:       {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
  secTitle:      {flex:1,fontSize:14,fontWeight:'600',color:C.text},
  accordionBody: {borderTopWidth:1,borderTopColor:C.border,padding:14,gap:0},
  contentItem:   {paddingBottom:14,borderBottomWidth:1,borderBottomColor:C.border,marginBottom:14},
  contentHeading:{fontSize:13,fontWeight:'700',color:C.text,marginBottom:6},
  contentBody:   {fontSize:12,color:C.muted,lineHeight:20},
  contactCard:   {backgroundColor:C.bgCard,borderRadius:18,padding:20,borderWidth:1,borderColor:C.border,alignItems:'center',gap:10,marginTop:8},
  contactTitle:  {fontSize:15,fontWeight:'700',color:C.text},
  contactSub:    {fontSize:13,color:C.muted},
  contactBtn:    {width:'100%',borderRadius:14,overflow:'hidden',marginTop:4},
  contactBtnGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:14},
  contactBtnTxt: {fontSize:14,fontWeight:'600',color:'#fff'},
});
