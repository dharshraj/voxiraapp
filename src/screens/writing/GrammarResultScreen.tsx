import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary:'#6C5CE7', primaryLight:'#A29BFE', accent:'#00CEC9',
  background:'#0F0F1A', surface:'#1A1A2E', surfaceLight:'#252542',
  text:'#FFFFFF', textSecondary:'#B0B0CC', textMuted:'#6C6C8A',
  success:'#00B894', warning:'#FDCB6E', error:'#FF6B6B', border:'#2A2A45',
};

interface GrammarIssue {
  id:string; type:'error'|'warning'|'suggestion';
  category:string; original:string; suggestion:string;
  explanation:string; applied:boolean;
}

function analyzeText(text: string): GrammarIssue[] {
  if (!text || text.trim().length < 10) return [];

  const issues: GrammarIssue[] = [];
  let id = 1;
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // 1. Double spaces
  const doubleSpace = text.match(/  +/g);
  if (doubleSpace) {
    issues.push({ id: String(id++), type:'error', category:'Formatting',
      original: '  (double space)', suggestion: ' (single space)',
      explanation: 'Remove extra spaces between words for clean formatting.', applied: false });
  }

  // 2. Sentence starts with lowercase after period
  const sentenceStarts = text.match(/[.!?]\s+[a-z]/g);
  if (sentenceStarts && sentenceStarts.length > 0) {
    issues.push({ id: String(id++), type:'error', category:'Capitalization',
      original: `"...${sentenceStarts[0].trim()}"`,
      suggestion: 'Capitalize the first word of every sentence.',
      explanation: 'Every sentence must begin with a capital letter.', applied: false });
  }

  // 3. "i" not capitalized
  const lowercaseI = text.match(/\s+i\s+/g);
  if (lowercaseI && lowercaseI.length > 0) {
    issues.push({ id: String(id++), type:'error', category:'Capitalization',
      original: '"i" (lowercase)',
      suggestion: '"I" (uppercase)',
      explanation: 'The pronoun "I" must always be capitalized.', applied: false });
  }

  // 4. Passive voice
  const passivePatterns = [
    /\b(was|were|is|are|has been|have been|had been) (written|done|made|given|taken|built|created|designed|completed|finished|started|used)\b/gi,
  ];
  passivePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.slice(0, 2).forEach(match => {
        issues.push({ id: String(id++), type:'warning', category:'Passive Voice',
          original: match,
          suggestion: 'Use active voice for stronger writing',
          explanation: `"${match}" is passive voice. Active voice makes writing more direct. Example: Instead of "was written by me" use "I wrote".`, applied: false });
      });
    }
  });

  // 5. Wordiness patterns
  const wordyMap: [RegExp, string, string][] = [
    [/\bin order to\b/gi, 'to', '"In order to" → just use "to"'],
    [/\bdue to the fact that\b/gi, 'because', '"Due to the fact that" → use "because"'],
    [/\bat this point in time\b/gi, 'now', '"At this point in time" → use "now"'],
    [/\bfor the purpose of\b/gi, 'to', '"For the purpose of" → use "to"'],
    [/\ba large number of\b/gi, 'many', '"A large number of" → use "many"'],
    [/\bin the event that\b/gi, 'if', '"In the event that" → use "if"'],
    [/\bhas the ability to\b/gi, 'can', '"Has the ability to" → use "can"'],
    [/\bwith regard to\b/gi, 'about', '"With regard to" → use "about"'],
  ];
  wordyMap.forEach(([pattern, fix, explain]) => {
    if (pattern.test(text)) {
      const match = text.match(pattern)?.[0] ?? '';
      issues.push({ id: String(id++), type:'warning', category:'Wordiness',
        original: match, suggestion: fix, explanation: explain, applied: false });
    }
  });

  // 6. Weak adjectives
  const weakWords: [RegExp, string][] = [
    [/\bvery unique\b/gi, 'unique (already means one-of-a-kind)'],
    [/\bvery important\b/gi, 'crucial / critical / vital'],
    [/\bvery good\b/gi, 'excellent / outstanding / exceptional'],
    [/\bvery bad\b/gi, 'terrible / dreadful / awful'],
    [/\bvery big\b/gi, 'enormous / massive / substantial'],
    [/\bvery small\b/gi, 'tiny / minuscule / negligible'],
    [/\bvery fast\b/gi, 'rapid / swift / lightning-fast'],
    [/\bvery difficult\b/gi, 'challenging / demanding / arduous'],
    [/\bvery happy\b/gi, 'delighted / thrilled / ecstatic'],
    [/\bvery clear\b/gi, 'crystal-clear / unambiguous / transparent'],
  ];
  weakWords.forEach(([pattern, suggestion]) => {
    if (pattern.test(text)) {
      const match = text.match(pattern)?.[0] ?? '';
      issues.push({ id: String(id++), type:'suggestion', category:'Word Choice',
        original: match, suggestion: suggestion,
        explanation: `"${match}" is weak. Use a single precise word instead.`, applied: false });
    }
  });

  // 7. Sentence length check
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 35);
  if (longSentences.length > 0) {
    issues.push({ id: String(id++), type:'warning', category:'Sentence Length',
      original: `Sentence with ${longSentences[0].trim().split(/\s+/).length} words`,
      suggestion: 'Break into 2 shorter sentences (aim for 15-25 words each)',
      explanation: 'Long sentences lose readers. Split them at natural joining words like "and", "but", "because", "which".', applied: false });
  }

  // 8. Repeated words
  const wordArray = text.toLowerCase().split(/\s+/);
  for (let i = 1; i < wordArray.length; i++) {
    if (wordArray[i].length > 4 && wordArray[i] === wordArray[i - 1]) {
      issues.push({ id: String(id++), type:'error', category:'Repeated Word',
        original: `"${wordArray[i]} ${wordArray[i]}"`,
        suggestion: `"${wordArray[i]}"`,
        explanation: `The word "${wordArray[i]}" appears twice in a row. Remove the duplicate.`, applied: false });
    }
  }

  // Readability score
  const avgWordsPerSentence = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  const readabilityGrade = avgWordsPerSentence <= 15 ? 'Easy' : avgWordsPerSentence <= 25 ? 'Moderate' : 'Complex';
  issues.push({ id: String(id++), type:'suggestion', category:'Readability',
    original: `Average sentence length: ${avgWordsPerSentence} words`,
    suggestion: readabilityGrade === 'Easy' ? 'Great sentence length!' : 'Consider shorter sentences',
    explanation: `Your average sentence is ${avgWordsPerSentence} words. ${readabilityGrade === 'Easy' ? 'This is ideal for clear communication.' : 'Shorter sentences (15-20 words) improve readability by up to 58%.'}`, applied: false });

  // Word count info
  issues.push({ id: String(id++), type:'suggestion', category:'Content',
    original: `${words.length} words, ${sentences.length} sentences`,
    suggestion: words.length < 50 ? 'Consider expanding your content' : words.length > 300 ? 'Good length — consider subheadings' : 'Good length!',
    explanation: words.length < 50
      ? 'Short texts benefit from more supporting details and examples.'
      : `${words.length} words across ${sentences.length} sentences gives a good content density.`, applied: false });

  // If no critical errors, add positive note at top
  if (issues.filter(i => i.type === 'error').length === 0) {
    issues.unshift({ id: '0', type:'suggestion', category:'Overall Quality',
      original: '✓ No critical errors found',
      suggestion: 'Your writing is clean!',
      explanation: 'No grammar errors detected. Focus on style improvements above to make your writing more impactful.', applied: false });
  }

  return issues;
}

const GrammarResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userText = route.params?.text ?? '';

  // Analyze the ACTUAL user text
  const [issues, setIssues] = useState<GrammarIssue[]>(() => analyzeText(userText));
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const errors      = issues.filter(i=>i.type==='error').length;
  const warnings    = issues.filter(i=>i.type==='warning').length;
  const suggestions = issues.filter(i=>i.type==='suggestion').length;
  const appliedCount= issues.filter(i=>i.applied).length;
  const total       = Math.max(issues.length, 1);
  const score       = Math.max(0, Math.min(100, Math.round(((total - errors*2 - warnings) / total) * 100)));

  useEffect(()=>{
    Animated.timing(fadeAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  const getTypeConfig=(type:string)=>{
    switch(type){
      case 'error':   return {color:COLORS.error,   icon:'close-circle', label:'Error'};
      case 'warning': return {color:COLORS.warning,  icon:'warning',      label:'Warning'};
      default:        return {color:COLORS.accent,   icon:'bulb',         label:'Suggestion'};
    }
  };

  const toggleApply=(id:string)=> setIssues(prev=>prev.map(i=>i.id===id?{...i,applied:!i.applied}:i));
  const applyAll=()=> setIssues(prev=>prev.map(i=>({...i,applied:true})));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content"/>
      <ScrollView showsVerticalScrollIndicator={false}
        {...(Platform.OS==='web'?{style:{overflowY:'auto'} as any}:{})}
      >
        {/* Header */}
        <Animated.View style={[styles.header,{opacity:fadeAnim}]}>
          <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text}/>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grammar Check</Text>
          <TouchableOpacity onPress={applyAll} style={styles.applyAllButton}>
            <Text style={styles.applyAllText}>Fix All</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Score Card */}
        <Animated.View style={[styles.scoreCard,{opacity:fadeAnim}]}>
          <LinearGradient
            colors={score>=80?['#00B894','#00CEC9']:score>=60?['#FDCB6E','#E17055']:['#FF6B6B','#E17055']}
            start={{x:0,y:0}} end={{x:1,y:1}} style={styles.scoreGradient}
          >
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreMeta}>
              <View style={styles.scoreMetaItem}><Ionicons name="close-circle" size={18} color="#FFF"/><Text style={styles.scoreMetaValue}>{errors}</Text><Text style={styles.scoreMetaLabel}>Errors</Text></View>
              <View style={styles.scoreMetaItem}><Ionicons name="warning" size={18} color="#FFF"/><Text style={styles.scoreMetaValue}>{warnings}</Text><Text style={styles.scoreMetaLabel}>Warnings</Text></View>
              <View style={styles.scoreMetaItem}><Ionicons name="bulb" size={18} color="#FFF"/><Text style={styles.scoreMetaValue}>{suggestions}</Text><Text style={styles.scoreMetaLabel}>Tips</Text></View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Original text preview */}
        {userText.length>0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>YOUR TEXT</Text>
            <Text style={styles.previewText} numberOfLines={4}>{userText}</Text>
          </View>
        )}

        {/* Applied Counter */}
        {appliedCount>0 && (
          <View style={styles.appliedBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success}/>
            <Text style={styles.appliedText}>{appliedCount} of {issues.length} fixes applied</Text>
          </View>
        )}

        {/* Issues List */}
        <View style={styles.issuesList}>
          <Text style={styles.sectionTitle}>Issues Found ({issues.length})</Text>
          {issues.map(issue=>{
            const config=getTypeConfig(issue.type);
            const isExpanded=expandedId===issue.id;
            return(
              <TouchableOpacity key={issue.id} style={[styles.issueCard,issue.applied&&styles.issueCardApplied]}
                onPress={()=>setExpandedId(isExpanded?null:issue.id)} activeOpacity={0.7}>
                <View style={styles.issueHeader}>
                  <View style={[styles.issueTypeBadge,{backgroundColor:config.color+'20'}]}>
                    <Ionicons name={config.icon as any} size={14} color={config.color}/>
                    <Text style={[styles.issueTypeText,{color:config.color}]}>{config.label}</Text>
                  </View>
                  <Text style={styles.issueCategory}>{issue.category}</Text>
                  {issue.applied&&<Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={{marginLeft:'auto'}}/>}
                </View>
                <View style={styles.issueComparison}>
                  <View style={styles.issueOriginal}><Text style={styles.issueStrike}>{issue.original}</Text></View>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted}/>
                  <View style={styles.issueSuggestion}><Text style={styles.issueSuggestionText}>{issue.suggestion}</Text></View>
                </View>
                {isExpanded&&(
                  <View style={styles.issueExpanded}>
                    <Text style={styles.issueExplanation}>{issue.explanation}</Text>
                    <TouchableOpacity style={[styles.applyButton,issue.applied&&styles.applyButtonApplied]} onPress={()=>toggleApply(issue.id)}>
                      <Ionicons name={issue.applied?'close-outline':'checkmark-outline'} size={18} color="#FFF"/>
                      <Text style={styles.applyButtonText}>{issue.applied?'Undo':'Apply Fix'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Writing Quality Report */}
        <View style={styles.writingScoreCard}>
          <Text style={styles.writingScoreTitle}>Writing Quality Report</Text>
          {[
            { label: 'Grammar',     score: Math.max(60, 100 - errors * 8),     color: '#00B894' },
            { label: 'Clarity',     score: Math.max(55, 85 - warnings * 5),    color: '#6C5CE7' },
            { label: 'Word Choice', score: Math.max(50, 90 - suggestions * 3), color: '#0984E3' },
            { label: 'Structure',   score: Math.max(60, 80 + (errors === 0 ? 10 : 0)), color: '#E17055' },
          ].map((item, i) => (
            <View key={i} style={styles.scoreRow}>
              <Text style={styles.scoreLabelText}>{item.label}</Text>
              <View style={styles.scoreBarBg}>
                <View style={[styles.scoreBarFill, { width: `${item.score}%` as any, backgroundColor: item.color }]} />
              </View>
              <Text style={[styles.scoreNum, { color: item.color }]}>{item.score}</Text>
            </View>
          ))}
          <View style={styles.writingTipsBox}>
            <Text style={styles.writingTipsTitle}>✍️ Writing Tips</Text>
            {[
              'Start with your strongest point — readers decide in 8 seconds whether to continue.',
              'Use "you" and "your" to make writing feel personal and direct.',
              'Read your text aloud — your ear catches awkward sentences your eyes miss.',
              "Cut every word that doesn't add meaning. Shorter is almost always better.",
            ].map((tip, i) => (
              <Text key={i} style={styles.writingTip}>• {tip}</Text>
            ))}
          </View>
        </View>

        <View style={{height:120}}/>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12},
  backButton:{width:40,height:40,borderRadius:20,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center'},
  headerTitle:{fontSize:18,fontWeight:'700',color:COLORS.text},
  applyAllButton:{backgroundColor:COLORS.success,paddingHorizontal:16,paddingVertical:8,borderRadius:16},
  applyAllText:{fontSize:13,fontWeight:'700',color:'#FFF'},
  scoreCard:{marginHorizontal:20,marginBottom:20},
  scoreGradient:{borderRadius:20,padding:24,flexDirection:'row',alignItems:'center'},
  scoreCircle:{width:90,height:90,borderRadius:45,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'rgba(255,255,255,0.3)'},
  scoreValue:{fontSize:36,fontWeight:'800',color:'#FFF'},
  scoreLabel:{fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:-2},
  scoreMeta:{flex:1,marginLeft:24,gap:10},
  scoreMetaItem:{flexDirection:'row',alignItems:'center',gap:8},
  scoreMetaValue:{fontSize:18,fontWeight:'700',color:'#FFF'},
  scoreMetaLabel:{fontSize:13,color:'rgba(255,255,255,0.7)'},
  previewCard:{marginHorizontal:20,marginBottom:16,backgroundColor:COLORS.surface,borderRadius:14,padding:14,borderWidth:1,borderColor:COLORS.border},
  previewLabel:{fontSize:11,fontWeight:'700',color:COLORS.textMuted,letterSpacing:1,marginBottom:8},
  previewText:{fontSize:13,color:COLORS.textSecondary,lineHeight:20},
  appliedBanner:{flexDirection:'row',alignItems:'center',gap:8,marginHorizontal:20,marginBottom:16,backgroundColor:COLORS.success+'15',paddingHorizontal:16,paddingVertical:10,borderRadius:12},
  appliedText:{fontSize:14,color:COLORS.success,fontWeight:'600'},
  issuesList:{paddingHorizontal:20},
  sectionTitle:{fontSize:18,fontWeight:'700',color:COLORS.text,marginBottom:14},
  issueCard:{backgroundColor:COLORS.surface,borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:COLORS.border},
  issueCardApplied:{borderColor:COLORS.success+'40',backgroundColor:COLORS.success+'08'},
  issueHeader:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12},
  issueTypeBadge:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:4,borderRadius:8},
  issueTypeText:{fontSize:11,fontWeight:'700',textTransform:'uppercase'},
  issueCategory:{fontSize:13,color:COLORS.textSecondary,fontWeight:'500'},
  issueComparison:{flexDirection:'row',alignItems:'center',gap:8},
  issueOriginal:{flex:1,backgroundColor:COLORS.error+'10',paddingHorizontal:10,paddingVertical:6,borderRadius:8},
  issueStrike:{fontSize:14,color:COLORS.error,textDecorationLine:'line-through'},
  issueSuggestion:{flex:1,backgroundColor:COLORS.success+'10',paddingHorizontal:10,paddingVertical:6,borderRadius:8},
  issueSuggestionText:{fontSize:14,color:COLORS.success,fontWeight:'600'},
  issueExpanded:{marginTop:14,paddingTop:14,borderTopWidth:1,borderTopColor:COLORS.border},
  issueExplanation:{fontSize:14,color:COLORS.textSecondary,lineHeight:20,marginBottom:14},
  applyButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:COLORS.primary,paddingVertical:10,borderRadius:10},
  applyButtonApplied:{backgroundColor:COLORS.textMuted},
  applyButtonText:{fontSize:14,fontWeight:'700',color:'#FFF'},
  writingScoreCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  writingScoreTitle:{ fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 14 },
  scoreRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  scoreLabelText:   { width: 80, fontSize: 12, color: 'rgba(241,245,249,0.55)', fontWeight: '500' },
  scoreBarBg:       { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill:     { height: '100%', borderRadius: 3 },
  scoreNum:         { width: 28, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  writingTipsBox:   { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginTop: 8 },
  writingTipsTitle: { fontSize: 13, fontWeight: '600', color: '#A78BFA', marginBottom: 8 },
  writingTip:       { fontSize: 12, color: 'rgba(241,245,249,0.55)', lineHeight: 20, marginBottom: 4 },
});

export default GrammarResultScreen;
