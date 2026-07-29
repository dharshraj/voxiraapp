import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const FAQS = [
  { q:'How does speech analysis work?', a:'Voxira records your speech, transcribes it using AssemblyAI, then sends the transcript to a Groq AI model (LLaMA 3.3) which generates scores for clarity, confidence, pace, filler word count, and personalised improvement suggestions.' },
  { q:'Why can\'t I hear myself during recording?', a:'Recordings are processed after you stop — not in real time. This is intentional to reduce distraction. Your full recording is analysed as soon as you tap "Analyse".' },
  { q:'How is my confidence score calculated?', a:'Confidence is estimated from filler word frequency, speaking pace consistency, and whether your WPM stays in the 110–150 range. It is a proxy metric, not a direct audio sentiment analysis.' },
  { q:'What counts as a filler word?', a:'um, uh, like, you know, basically, literally, actually, so, right, okay, well, hmm, i mean, kind of, sort of. These are detected in the transcript text by both AssemblyAI\'s disfluency detection and a secondary AI scan.' },
  { q:'Why is my session not appearing in history?', a:'Sessions are saved to Supabase after analysis completes. If you see a save error banner, check your internet connection. If the issue persists, the Supabase tables may need to be created — run the migration SQL in the Supabase dashboard.' },
  { q:'How do I earn Coins?', a:'Coins are awarded by unlocking achievements. Complete sessions, build streaks, and hit score thresholds to automatically unlock achievements and accumulate Coins. View them in the Achievements tab.' },
  { q:'Can I delete my account?', a:'Yes — go to Profile → Settings → Delete Account. This permanently deletes all your data within 30 days per our Privacy Policy.' },
  { q:'What microphone permission is required?', a:'Voxira needs microphone access to record your speech. On web, you\'ll see a browser permission prompt when you start your first recording. On mobile, you\'ll be prompted during onboarding.' },
];

export default function FAQScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue:1, duration:400, useNativeDriver:true }).start(); }, []);

  const s = StyleSheet.create({
    root:     { flex:1, backgroundColor:C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:   { paddingHorizontal:20, paddingBottom:60 },
    item:     { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, marginBottom:8, overflow:'hidden' },
    qRow:     { flexDirection:'row', alignItems:'center', padding:16, gap:12 },
    qTxt:     { flex:1, fontSize:14, fontWeight:'600', color:C.text },
    body:     { paddingHorizontal:16, paddingBottom:14 },
    bodyTxt:  { fontSize:13, color:C.textSec, lineHeight:21 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>FAQ</Text>
      </View>
      <View style={s.divider} />
      <Animated.ScrollView
        style={[{ opacity:fade }, { flex: 1 }]}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {FAQS.map((faq, i) => (
          <View key={i} style={s.item}>
            <TouchableOpacity style={s.qRow} onPress={() => setOpen(open===i ? null : i)} activeOpacity={0.8}>
              <Text style={s.qTxt}>{faq.q}</Text>
              <Ionicons name={open===i ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
            </TouchableOpacity>
            {open===i && <View style={s.body}><Text style={s.bodyTxt}>{faq.a}</Text></View>}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
