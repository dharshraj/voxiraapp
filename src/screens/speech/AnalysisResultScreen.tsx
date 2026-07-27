import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FillerWordEntry } from '../../lib/openai';
import { useTheme } from '../../theme/ThemeContext';

const { width: W } = Dimensions.get('window');

function formatTime(s:number){ const m=Math.floor(s/60).toString().padStart(2,'0'); const s2=(s%60).toString().padStart(2,'0'); return `${m}:${s2}`; }
function scoreColor(s:number){ return s>=80?'#10B981':s>=60?'#A78BFA':s>=40?'#F59E0B':'#F43F5E'; }
function scoreLabel(s:number){ return s>=85?'Excellent':s>=75?'Great':s>=60?'Good':s>=40?'Fair':'Needs Work'; }

export default function AnalysisResultScreen({ navigation, route }:any) {
  const { colors: C, isDark } = useTheme();
  const {
    score=0, duration=0, fillerCount=0, fillerBreakdown={},
    mode='Free Speech', wpm=0, transcript='',
    details={ clarity:0, pace:0, pronunciation:0, confidence:0 },
    aiAnalysis=null,
  } = route?.params ?? {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const color = scoreColor(score);

  useEffect(()=>{
    Animated.timing(fadeAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
    let current = 0;
    const interval = setInterval(()=>{
      current += Math.ceil(score/30);
      if(current >= score){ current = score; clearInterval(interval); }
      setDisplayScore(current);
    }, 40);
    return ()=>clearInterval(interval);
  },[]);

  const METRICS = [
    { label:'Clarity',       value:details.clarity,       icon:'eye-outline',        color:'#A78BFA' },
    { label:'Pace',          value:details.pace,          icon:'speedometer-outline', color:'#06B6D4' },
    { label:'Pronunciation', value:details.pronunciation, icon:'volume-high-outline', color:'#10B981' },
    { label:'Confidence',    value:details.confidence,    icon:'trending-up-outline', color:'#F59E0B' },
  ];

  const generateFeedback = () => {
    const tips: {type:string,icon:string,color:string,title:string,text:string}[] = [];

    // ── Filler words ─────────────────────────────────────────────────────────
    if (fillerCount === 0) {
      tips.push({ type:'pos', icon:'checkmark-circle', color:'#10B981', title:'Zero Filler Words',
        text:'Exceptional delivery — you spoke your entire session without a single filler word. This level of control puts you in the top 5% of speakers. Filler-free speech signals preparation, confidence, and respect for your audience\'s time. Keep up this standard in your next session.' });
    } else if (fillerCount <= 3) {
      tips.push({ type:'pos', icon:'checkmark-circle', color:'#10B981', title:'Excellent Filler Control',
        text:`Only ${fillerCount} filler word${fillerCount > 1 ? 's' : ''} across your entire speech — that is well within the professional range. Research shows that listeners start to lose trust after about 5 fillers per minute, so you are comfortably clear of that threshold. Your next goal is to eliminate the remaining few by replacing each one with a deliberate half-second pause.` });
    } else if (fillerCount <= 7) {
      const topFiller = Object.entries(fillerBreakdown as Record<string,number>).sort((a,b)=>b[1]-a[1])[0];
      tips.push({ type:'warn', icon:'warning', color:'#F59E0B', title:`${fillerCount} Filler Words Detected`,
        text:`Your most-used filler was "${topFiller?.[0] ?? 'um'}" (${topFiller?.[1] ?? 3}×). Filler words usually appear when you are searching for the next thought — the fix is not to speak faster, but to slow down and embrace silence. Try the pause technique: whenever you feel a filler coming, close your mouth, breathe through your nose for one second, then continue. Practise this in low-stakes conversations first.` });
    } else {
      const top3 = Object.entries(fillerBreakdown as Record<string,number>).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w,c])=>`"${w}" (${c}×)`).join(', ');
      tips.push({ type:'neg', icon:'close-circle', color:'#F43F5E', title:`${fillerCount} Filler Words — Focus Area`,
        text:`Your top fillers were ${top3}. At this frequency, fillers distract listeners and undercut the authority of your message. The most effective remedy is daily recording practice: record two minutes of speech, count every filler, and try to halve the count in your next attempt. Within two weeks of consistent effort, most speakers cut their filler rate by 60–70%.` });
    }

    // ── Speaking pace ─────────────────────────────────────────────────────────
    if (wpm >= 110 && wpm <= 150) {
      tips.push({ type:'pos', icon:'speedometer', color:'#8B5CF6', title:`Strong Pace: ${wpm} WPM`,
        text:`${wpm} words per minute sits squarely in the ideal conversational range of 110–150 WPM. At this pace, listeners can process each idea before the next one arrives, which improves both comprehension and retention. Maintaining this rhythm under pressure — nerves often cause speed to spike — is the real skill to build.` });
    } else if (wpm > 150) {
      tips.push({ type:'warn', icon:'speedometer', color:'#F59E0B', title:`Speaking Too Fast: ${wpm} WPM`,
        text:`${wpm} WPM is above the comfortable processing limit for most audiences. Fast speech is often driven by nerves or over-preparation — the brain races ahead of the mouth. Try anchoring yourself with deliberate two-second pauses after every major point. Not only does this slow your pace, it also signals confidence and gives listeners time to absorb what you just said.` });
    } else if (wpm > 0 && wpm < 110) {
      tips.push({ type:'warn', icon:'speedometer', color:'#F59E0B', title:`Speaking Too Slow: ${wpm} WPM`,
        text:`${wpm} WPM is below the range where speech feels natural and engaging. Very slow delivery can cause audiences to disengage or assume a lack of confidence. Aim for 120–140 WPM as your target. Reading a news article aloud and timing yourself is a practical daily drill — it builds the muscle memory for a more energetic, conversational pace.` });
    }

    // ── Clarity ───────────────────────────────────────────────────────────────
    if (details.clarity >= 85) {
      tips.push({ type:'pos', icon:'mic', color:'#10B981', title:'Clear Articulation',
        text:`A clarity score of ${details.clarity}/100 means your words were consistently well-formed and easy to follow. Crisp articulation makes a strong impression in professional contexts — it signals effort and preparation. To maintain this standard, keep warming up your voice before important sessions with lip trills or tongue twisters.` });
    } else if (details.clarity >= 65) {
      tips.push({ type:'warn', icon:'mic', color:'#F59E0B', title:'Articulation Needs Attention',
        text:`Your clarity score of ${details.clarity}/100 suggests that some words were swallowed or blurred, particularly under conversational speed. The most common cause is insufficient mouth movement — many speakers barely open their jaw when they talk. Practise exaggerating your enunciation on tongue twisters for five minutes daily; within a few weeks your natural speech will become noticeably crisper.` });
    } else {
      tips.push({ type:'neg', icon:'mic', color:'#F43F5E', title:'Articulation Needs Significant Work',
        text:`A clarity score of ${details.clarity}/100 indicates that a meaningful portion of your speech was difficult to follow. This often stems from speaking too quickly for your current articulation ability, or from reduced mouth opening. Focus on slow, deliberate speech practice before speed. Read a paragraph aloud at half your normal pace, over-articulating every consonant, then gradually increase speed over several weeks.` });
    }

    // ── Confidence ────────────────────────────────────────────────────────────
    if (details.confidence >= 80) {
      tips.push({ type:'pos', icon:'trending-up', color:'#8B5CF6', title:'Strong Confidence',
        text:`Your confidence score of ${details.confidence}/100 reflects a delivery that sounded assured and purposeful. Vocal confidence comes through in steady volume, avoided upward inflection at sentence ends, and a lack of hesitation. This is a genuine strength — make sure it carries into high-pressure situations where nerves typically erode it.` });
    } else if (details.confidence >= 60) {
      tips.push({ type:'warn', icon:'trending-up', color:'#F59E0B', title:'Build Your Vocal Confidence',
        text:`A confidence score of ${details.confidence}/100 suggests moments of hesitation or dropping volume that signal uncertainty to listeners. One practical technique: record yourself and identify the exact moments where your tone dips or rises into a question. Then re-record those sentences with a flat, declarative ending. Repetition of this exercise builds the neural pathway for confident delivery.` });
    } else {
      tips.push({ type:'neg', icon:'trending-up', color:'#F43F5E', title:'Confidence Needs Development',
        text:`A confidence score of ${details.confidence}/100 means your delivery frequently conveyed uncertainty — through upward inflections, whispered endings, or long hesitation gaps. Before your next session, try a two-minute power pose (stand tall, arms wide) which has been shown to reduce cortisol and increase assertiveness. Also, memorise your opening three sentences so you can begin any speech on solid ground.` });
    }

    // ── Pro tip ───────────────────────────────────────────────────────────────
    const proTips = [
      'Record yourself for two minutes every day on any topic. Review the recording and commit to fixing one specific thing in your next attempt — not five things, just one.',
      'Join a structured speaking group such as Toastmasters. The combination of regular practice, peer feedback, and a safe environment accelerates improvement faster than solo practice alone.',
      'Read aloud for ten minutes every day from a book or article. This trains your mouth to form words automatically, freeing your brain to focus on ideas rather than mechanics.',
      'Before any important speech or recording, hum for thirty seconds to warm up your vocal cords. Cold vocal cords produce thinner, less confident-sounding tone.',
      'Breathe from your diaphragm rather than your chest. Place a hand on your stomach — it should move outward when you inhale. Diaphragmatic breathing produces a steadier, more authoritative voice with significantly fewer fillers.',
    ];
    tips.push({ type:'tip', icon:'bulb', color:'#A78BFA', title:'Practice Tip',
      text: proTips[Math.floor(Math.random() * proTips.length)] });
    return tips;
  };

  const feedback = generateFeedback();

  const doShare = async()=>{
    try{ await Share.share({message:`I scored ${score}/100 on Voxira Speech Analysis!\nMode: ${mode} | Duration: ${formatTime(duration)}`}); }catch{}
  };

  const s = StyleSheet.create({
    root:          {flex:1,backgroundColor:C.bg},
    header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,paddingBottom:8},
    iconBtn:       {width:42,height:42,borderRadius:12,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
    headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
    scroll:        {paddingHorizontal:20,paddingTop:4,paddingBottom:40},
    scoreCard:     {backgroundColor:C.surface,borderRadius:18,padding:24,alignItems:'center',marginBottom:20,borderWidth:1,borderColor:C.border,gap:10},
    modeTag:       {fontSize:12,color:C.textMuted,textTransform:'uppercase',letterSpacing:1},
    scoreRing:     {width:120,height:120,borderRadius:60,borderWidth:5,alignItems:'center',justifyContent:'center'},
    scoreNum:      {fontSize:40,fontWeight:'800',letterSpacing:-1},
    scoreMax:      {fontSize:12,color:C.textMuted,marginTop:-4},
    scoreLabel:    {fontSize:16,fontWeight:'700'},
    metaRow:       {flexDirection:'row',alignItems:'center',gap:10},
    metaItem:      {flexDirection:'row',alignItems:'center',gap:4},
    metaTxt:       {fontSize:12,color:C.textSec},
    metaDot:       {width:3,height:3,borderRadius:2,backgroundColor:C.textMuted},
    // ── Transcript card — beige background ───────────────────────────────────
    transcriptCard:   {backgroundColor:'#F5EFE6',borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:'#E8DDD0'},
    transcriptHeader: {flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
    transcriptTitle:  {fontSize:14,fontWeight:'700',color:'#78350F'},
    transcriptText:   {fontSize:14,color:C.textSec,lineHeight:22,marginBottom:8},
    transcriptMeta:   {fontSize:12,color:C.textMuted},

    // ── Filler word breakdown — vertical list, larger chips ──────────────────
    fillerCard:    {borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:'#F0E0BE',backgroundColor:'#FFFBEB'},
    fillerTitle:   {fontSize:16,fontWeight:'700',color:C.text,marginBottom:12},
    fillerGrid:    {gap:10,marginBottom:12},           // vertical gap — no flexWrap
    fillerChip:    {flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderRadius:12,paddingLeft:14,paddingRight:8,paddingVertical:10,gap:10,borderWidth:1,borderColor:'#E8C880'},
    fillerWord:    {fontSize:16,fontWeight:'700',color:'#92400E',flex:1},
    fillerBadge:   {backgroundColor:'#92400E',borderRadius:20,paddingHorizontal:12,paddingVertical:4},
    fillerCount:   {fontSize:13,fontWeight:'700',color:'#fff'},
    fillerNote:    {fontSize:13,color:C.textSec,lineHeight:20},

    // ── Feedback cards ────────────────────────────────────────────────────────
    feedbackCard:  {borderRadius:14,padding:16,marginBottom:10,borderLeftWidth:3},
    feedbackHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
    feedbackTitle: {fontSize:15,fontWeight:'700'},
    feedbackText:  {fontSize:14,color:C.textSec,lineHeight:22},

    // ── Content-specific suggestions ─────────────────────────────────────────
    contentSugCard:  {flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:'#F5EFE6',borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'#E8DDD0'},
    contentSugIcon:  {width:32,height:32,borderRadius:16,backgroundColor:'#E8DDD0',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1},
    contentSugText:  {flex:1,fontSize:15,color:C.textSec,lineHeight:23},

    // ── Suggested Rephrasings — beige background ──────────────────────────────
    altCard:       {backgroundColor:'#F5EFE6',borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'#E8DDD0'},
    altNum:        {width:26,height:26,borderRadius:13,backgroundColor:'#92400E',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:8},
    altNumTxt:     {fontSize:12,fontWeight:'800',color:'#fff'},
    altText:       {fontSize:15,color:C.textSec,lineHeight:23},

    // ── Improvement Tips — beige background ──────────────────────────────────
    tipCard:       {flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:'#F5EFE6',borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'#E8DDD0'},
    tipNum:        {width:26,height:26,borderRadius:13,backgroundColor:'#92400E',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1},
    tipNumTxt:     {fontSize:12,fontWeight:'800',color:'#fff'},
    tipText:       {flex:1,fontSize:15,color:C.textSec,lineHeight:23},

    // ── Structure Feedback ────────────────────────────────────────────────────
    structureCard: {backgroundColor:C.success+'14',borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:C.success+'33'},
    structureTitle:{fontSize:15,fontWeight:'700',color:C.success,marginBottom:8},
    structureText: {fontSize:15,color:C.textSec,lineHeight:23},

    // ── 7-Day Plan — beige background ────────────────────────────────────────
    planCard:      {backgroundColor:'#F5EFE6',borderRadius:14,padding:18,marginBottom:16,borderWidth:1,borderColor:'#E8DDD0'},
    planTitle:     {fontSize:16,fontWeight:'700',color:'#78350F',marginBottom:14},
    planRow:       {flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:12},
    planDayBadge:  {backgroundColor:'#92400E',borderRadius:8,paddingHorizontal:10,paddingVertical:5,minWidth:62,alignItems:'center'},
    planDay:       {fontSize:11,fontWeight:'700',color:'#fff'},
    planTask:      {flex:1,fontSize:14,color:C.textSec,lineHeight:21},

    // ── Shared layout ─────────────────────────────────────────────────────────
    sectionTitle:  {fontSize:16,fontWeight:'700',color:C.text,marginBottom:12},
    metricsGrid:   {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:20},
    metricCard:    {width:(W-50)/2,backgroundColor:C.surface,borderRadius:14,padding:14,borderWidth:1,borderColor:C.border,gap:6},
    metricIcon:    {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
    metricLabel:   {fontSize:12,color:C.textSec},
    metricVal:     {fontSize:24,fontWeight:'800'},
    metricBarBg:   {height:4,backgroundColor:C.border,borderRadius:2,overflow:'hidden'},
    metricBarFill: {height:'100%',borderRadius:2},
    actionsRow:    {flexDirection:'row',gap:12},
    secBtn:        {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.surface,borderRadius:12,borderWidth:1,borderColor:C.border,paddingVertical:14},
    secBtnTxt:     {fontSize:14,fontWeight:'600',color:C.text},
    primBtn:       {flex:2,borderRadius:12,overflow:'hidden',backgroundColor:C.primary},
    primBtnInner:  {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14},
    primBtnTxt:    {fontSize:14,fontWeight:'700',color:'#fff'},
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.ScrollView
        style={[{opacity:fadeAnim},Platform.OS==='web'&&({height:'100vh',overflowY:'auto'} as any)]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={()=>navigation.navigate('SpeechHome')}>
            <Ionicons name="arrow-back" size={22} color={C.textSec}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Analysis Result</Text>
          <TouchableOpacity style={s.iconBtn} onPress={doShare}>
            <Ionicons name="share-outline" size={22} color={C.textSec}/>
          </TouchableOpacity>
        </View>

        <View style={s.scoreCard}>
          <Text style={s.modeTag}>{mode}</Text>
          <View style={[s.scoreRing,{borderColor:`${color}50`}]}>
            <Text style={[s.scoreNum,{color}]}>{displayScore}</Text>
            <Text style={s.scoreMax}>/100</Text>
          </View>
          <Text style={[s.scoreLabel,{color}]}>{scoreLabel(score)}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}><Ionicons name="time-outline" size={14} color={C.textMuted}/><Text style={s.metaTxt}>{formatTime(duration)}</Text></View>
            {fillerCount>0&&<><View style={s.metaDot}/><View style={s.metaItem}><Ionicons name="warning-outline" size={14} color={C.textMuted}/><Text style={s.metaTxt}>{fillerCount} fillers</Text></View></>}
            {wpm>0&&<><View style={s.metaDot}/><View style={s.metaItem}><Ionicons name="speedometer-outline" size={14} color={C.textMuted}/><Text style={s.metaTxt}>{wpm} WPM</Text></View></>}
          </View>
        </View>

        {transcript && transcript.length > 10 && (
          <View style={s.transcriptCard}>
            <View style={s.transcriptHeader}>
              <Ionicons name="document-text-outline" size={16} color={C.primary} />
              <Text style={s.transcriptTitle}>Your Transcript</Text>
            </View>
            <Text style={s.transcriptText}>{transcript}</Text>
            <Text style={s.transcriptMeta}>
              {transcript.trim().split(/\s+/).filter(Boolean).length} words · {formatTime(duration)}{wpm > 0 ? ` · ${wpm} WPM` : ''}
            </Text>
          </View>
        )}

        {fillerCount > 0 && (
          <View style={s.fillerCard}>
            <Text style={s.fillerTitle}>Filler Word Breakdown</Text>
            {/* Merged: shows AssemblyAI word-level data merged with LLM scan.
                Vertical list (one chip per row), large font, beige card. */}
            <View style={s.fillerGrid}>
              {(() => {
                // Prefer LLM analysis if available (more accurate), fall back to
                // AssemblyAI breakdown — deduplicate by choosing the higher count.
                const llmEntries: Record<string,number> = {};
                if (aiAnalysis && Array.isArray(aiAnalysis.fillerWordAnalysis)) {
                  for (const e of aiAnalysis.fillerWordAnalysis as FillerWordEntry[]) {
                    if (e.word && e.count > 0) llmEntries[e.word.toLowerCase()] = e.count;
                  }
                }
                const merged: Record<string,number> = { ...(fillerBreakdown as Record<string,number>) };
                for (const [w, c] of Object.entries(llmEntries)) {
                  merged[w] = Math.max(merged[w] ?? 0, c);
                }
                return Object.entries(merged)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([word, count]) => (
                    <View key={word} style={s.fillerChip}>
                      <Text style={s.fillerWord}>"{word}"</Text>
                      <View style={s.fillerBadge}><Text style={s.fillerCount}>{count}×</Text></View>
                    </View>
                  ));
              })()}
            </View>
            <Text style={s.fillerNote}>
              These were found by scanning your actual transcript. Replacing each filler word with a deliberate 1-second pause can improve your score by up to 2 points per occurrence.
            </Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Score Breakdown</Text>
        <View style={s.metricsGrid}>
          {METRICS.map((m,i)=>(
            <View key={i} style={s.metricCard}>
              <View style={[s.metricIcon,{backgroundColor:`${m.color}18`}]}>
                <Ionicons name={m.icon as any} size={18} color={m.color}/>
              </View>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={[s.metricVal,{color:m.color}]}>{m.value}</Text>
              <View style={s.metricBarBg}><View style={[s.metricBarFill,{width:`${m.value}%` as any,backgroundColor:m.color}]}/></View>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Feedback</Text>
        {feedback.map((fb, i) => (
          <View key={i} style={[s.feedbackCard, { borderLeftColor: fb.color, backgroundColor: `${fb.color}12` }]}>
            <View style={s.feedbackHeader}>
              <Ionicons name={fb.icon as any} size={18} color={fb.color} />
              <Text style={[s.feedbackTitle, { color: fb.color }]}>{fb.title}</Text>
            </View>
            <Text style={s.feedbackText}>{fb.text}</Text>
          </View>
        ))}

        {aiAnalysis && (
          <>
            {/* Filler Words (AI Analysis) is intentionally omitted here —
                the data is already merged into "Filler Word Breakdown" above. */}

            {/* Content-specific suggestions */}
            {Array.isArray(aiAnalysis.contentSuggestions) && aiAnalysis.contentSuggestions.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Content-Specific Suggestions</Text>
                {(aiAnalysis.contentSuggestions as string[]).map((suggestion: string, i: number) => (
                  <View key={i} style={s.contentSugCard}>
                    <View style={s.contentSugIcon}>
                      <Ionicons name="arrow-forward-outline" size={16} color="#92400E" />
                    </View>
                    <Text style={s.contentSugText}>{suggestion}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Suggested Rephrasings — "AI" removed from title, number badge not "Version N" */}
            {aiAnalysis.alternateAnswers?.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Suggested Rephrasings</Text>
                {(aiAnalysis.alternateAnswers as string[]).map((alt: string, i: number) => (
                  <View key={i} style={s.altCard}>
                    <View style={s.altNum}><Text style={s.altNumTxt}>{i + 1}</Text></View>
                    <Text style={s.altText}>{alt}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Improvement Tips — "AI" removed from title */}
            {aiAnalysis.improvementTips?.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Improvement Tips</Text>
                {(aiAnalysis.improvementTips as string[]).map((tip: string, i: number) => (
                  <View key={i} style={s.tipCard}>
                    <View style={s.tipNum}><Text style={s.tipNumTxt}>{i + 1}</Text></View>
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Structure Feedback */}
            {aiAnalysis.structureFeedback && (
              <View style={s.structureCard}>
                <Ionicons name="git-branch-outline" size={16} color={C.success} style={{ marginBottom: 6 }} />
                <Text style={s.structureTitle}>Structure Feedback</Text>
                <Text style={s.structureText}>{aiAnalysis.structureFeedback}</Text>
              </View>
            )}
          </>
        )}

        <View style={s.planCard}>
          <Text style={s.planTitle}>Your 7-Day Improvement Plan</Text>
          {[
            { day: 'Day 1-2', task: 'Record 2-minute speeches daily. Count your filler words each time.' },
            { day: 'Day 3-4', task: 'Practice the PAUSE technique. Every time you feel a filler coming, pause for 1 second instead.' },
            { day: 'Day 5-6', task: 'Read aloud for 10 minutes. Focus on clear enunciation of every syllable.' },
            { day: 'Day 7',   task: 'Record a 3-minute speech on any topic and compare with your Day 1 recording.' },
          ].map((item, i) => (
            <View key={i} style={s.planRow}>
              <View style={s.planDayBadge}><Text style={s.planDay}>{item.day}</Text></View>
              <Text style={s.planTask}>{item.task}</Text>
            </View>
          ))}
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={s.secBtn} onPress={()=>navigation.navigate('Record',{mode})}>
            <Ionicons name="refresh-outline" size={18} color={C.textSec}/>
            <Text style={s.secBtnTxt}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primBtn} onPress={()=>navigation.navigate('SpeechHome')} activeOpacity={0.85}>
            <View style={s.primBtnInner}>
              <Ionicons name="home-outline" size={18} color="#fff"/>
              <Text style={s.primBtnTxt}>Done</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{height:80}}/>
      </Animated.ScrollView>
    </View>
  );
}
