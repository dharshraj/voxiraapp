import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, TextInput, Linking,
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

const FAQS = [
  {
    q:'How does the speech analysis work?',
    a:'Voxira records your voice, transcribes it using AI, then analyses filler words, speech pace (WPM), clarity, pronunciation, and confidence. You get a score out of 100 with detailed breakdowns.',
  },
  {
    q:'Is my voice data stored?',
    a:'Audio is processed in real-time and not stored permanently. Only the analysed results (score, transcript, filler count) are saved to your profile. You can delete your data anytime in Settings.',
  },
  {
    q:'How do I improve my filler word score?',
    a:'Practice pausing instead of filling silence with "um" or "uh". Use Voxira\'s Daily Challenge mode — the Filler-Free challenge specifically targets this habit. Most users see improvement within 2 weeks of daily practice.',
  },
  {
    q:'Does Voxira work offline?',
    a:'Basic features work offline on Pro. Speech recording and AI analysis require an internet connection. Offline mode (Pro) lets you record and syncs the analysis when you reconnect.',
  },
  {
    q:'How is my interview score calculated?',
    a:'The AI evaluates 4 factors: Content (relevance of your answer), Clarity (how clearly you communicated), Structure (did you use STAR?), and Confidence (tone, pace, fluency). Each is weighted equally.',
  },
  {
    q:'Can I cancel my Pro subscription?',
    a:'Yes, anytime. Go to Settings → Subscription → Cancel. On iOS, manage through App Store subscriptions. On Android, through Google Play. Your Pro access continues until the billing period ends.',
  },
  {
    q:'Why is the writing feature not saving?',
    a:'Make sure you are connected to the internet and have a valid account. Writing sessions are saved automatically after analysis. If the issue persists, try logging out and back in.',
  },
  {
    q:'How do I reset my streak?',
    a:'Your streak resets automatically if you miss a day of practice. Streaks are based on your local timezone. Make sure to complete at least one session per day to maintain your streak.',
  },
];

const CONTACT_OPTIONS = [
  { label:'Email Support',    icon:'mail-outline',      color:C.accent,  onPress:()=>Linking.openURL('mailto:support@voxira.app') },
  { label:'WhatsApp Chat',    icon:'logo-whatsapp',     color:C.green,   onPress:()=>Linking.openURL('https://wa.me/911234567890') },
  { label:'Visit Help Center',icon:'globe-outline',     color:C.primary, onPress:()=>Linking.openURL('https://voxira.app/help')    },
  { label:'Rate the App',     icon:'star-outline',      color:C.gold,    onPress:()=>Linking.openURL('https://voxira.app/rate')    },
];

export default function HelpScreen({ navigation }:any) {
  const [search,  setSearch]  = useState('');
  const [openIdx, setOpenIdx] = useState<number|null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const filteredFaqs = FAQS.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Help & Support</Text>
          <View style={{width:42}}/>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.muted} style={{marginRight:8}}/>
          <TextInput
            style={s.searchInput} placeholder="Search for answers..."
            placeholderTextColor={C.hint} value={search} onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length>0 && (
            <TouchableOpacity onPress={()=>setSearch('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="close-circle" size={16} color={C.muted}/>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Contact options */}
        {!search && (
          <>
            <Text style={s.sectionTitle}>Get in Touch</Text>
            <View style={s.contactGrid}>
              {CONTACT_OPTIONS.map((opt,i)=>(
                <TouchableOpacity key={i} style={s.contactCard} onPress={opt.onPress} activeOpacity={0.8}>
                  <View style={[s.contactIcon,{backgroundColor:`${opt.color}18`}]}>
                    <Ionicons name={opt.icon as any} size={22} color={opt.color}/>
                  </View>
                  <Text style={s.contactLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* FAQ */}
        <Text style={s.sectionTitle}>
          {search ? `${filteredFaqs.length} result${filteredFaqs.length!==1?'s':''} for "${search}"` : 'Frequently Asked Questions'}
        </Text>

        {filteredFaqs.length===0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="search-outline" size={44} color={C.muted}/>
            <Text style={s.emptyTitle}>No results found</Text>
            <Text style={s.emptySub}>Try different keywords or contact our support team</Text>
          </View>
        ) : (
          <View style={s.faqList}>
            {filteredFaqs.map((faq,i)=>(
              <TouchableOpacity key={i} style={[s.faqRow,i===filteredFaqs.length-1&&{borderBottomWidth:0}]}
                onPress={()=>setOpenIdx(openIdx===i?null:i)} activeOpacity={0.8}>
                <View style={s.faqTop}>
                  <Text style={s.faqQ}>{faq.q}</Text>
                  <Ionicons name={openIdx===i?'chevron-up':'chevron-down'} size={18} color={C.muted}/>
                </View>
                {openIdx===i && (
                  <Text style={s.faqA}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Still need help */}
        {!search && (
          <View style={s.stillNeedCard}>
            <LinearGradient colors={['rgba(21,101,255,0.15)','rgba(21,101,255,0.05)']} style={[StyleSheet.absoluteFill,{borderRadius:18}]}/>
            <Ionicons name="headset-outline" size={32} color={C.accent}/>
            <Text style={s.stillTitle}>Still need help?</Text>
            <Text style={s.stillSub}>Our support team typically responds within 24 hours</Text>
            <TouchableOpacity style={s.stillBtn} onPress={()=>Linking.openURL('mailto:support@voxira.app')} activeOpacity={0.85}>
              <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.stillBtnGrad}>
                <Ionicons name="mail-outline" size={18} color="#fff"/>
                <Text style={s.stillBtnTxt}>Email Support</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

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
  searchBar:     {flexDirection:'row',alignItems:'center',marginHorizontal:20,backgroundColor:C.bgCard,borderRadius:14,paddingHorizontal:14,height:44,borderWidth:1,borderColor:C.border},
  searchInput:   {flex:1,color:C.text,fontSize:14},
  scroll:        {paddingHorizontal:20,paddingTop:16},
  sectionTitle:  {fontSize:15,fontWeight:'700',color:C.text,marginBottom:12,marginTop:8},
  contactGrid:   {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:24},
  contactCard:   {width:'47%',backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border,alignItems:'center',gap:10},
  contactIcon:   {width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center'},
  contactLabel:  {fontSize:12,color:C.muted,textAlign:'center',fontWeight:'500'},
  faqList:       {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:20},
  faqRow:        {padding:16,borderBottomWidth:1,borderBottomColor:C.border,gap:10},
  faqTop:        {flexDirection:'row',alignItems:'flex-start',gap:12},
  faqQ:          {flex:1,fontSize:14,fontWeight:'600',color:C.text,lineHeight:20},
  faqA:          {fontSize:13,color:C.muted,lineHeight:21},
  emptyWrap:     {alignItems:'center',paddingVertical:40,gap:12},
  emptyTitle:    {fontSize:16,fontWeight:'700',color:C.text},
  emptySub:      {fontSize:13,color:C.muted,textAlign:'center'},
  stillNeedCard: {borderRadius:18,padding:20,borderWidth:1,borderColor:'rgba(21,101,255,0.25)',overflow:'hidden',alignItems:'center',gap:10,marginBottom:8},
  stillTitle:    {fontSize:17,fontWeight:'700',color:C.text},
  stillSub:      {fontSize:13,color:C.muted,textAlign:'center'},
  stillBtn:      {width:'100%',borderRadius:14,overflow:'hidden',marginTop:4},
  stillBtnGrad:  {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:14},
  stillBtnTxt:   {fontSize:15,fontWeight:'700',color:'#fff'},
});

