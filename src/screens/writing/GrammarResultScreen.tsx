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

// ── Analyze the actual text the user typed ────────────────────────────────────
function analyzeText(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  let id = 1;

  // Subject-verb agreement checks
  const svPatterns = [
    { pattern:/\b(the team|the group|the company|the committee|everyone|nobody) (are|were|have)\b/gi, fix:'is/was/has', cat:'Subject-Verb Agreement', explain:'Collective nouns and indefinite pronouns typically take singular verbs.' },
    { pattern:/\b(they|we|you) (was|has)\b/gi, fix:'were/have', cat:'Subject-Verb Agreement', explain:'Plural subjects require plural verbs.' },
  ];
  svPatterns.forEach(({pattern,fix,cat,explain}) => {
    let m;
    while((m=pattern.exec(text))!==null) {
      issues.push({id:String(id++),type:'error',category:cat,original:m[0],suggestion:m[0].replace(/(are|were|have|was|has)$/i,fix.split('/')[0]),explanation:explain,applied:false});
    }
  });

  // Missing comma after introductory words
  const introWords = ['However','Therefore','Moreover','Furthermore','Meanwhile','Consequently','Nevertheless','Additionally','Fortunately','Unfortunately','Basically','Actually','Overall','Finally','Also'];
  introWords.forEach(w => {
    const re = new RegExp(`\\b${w} [a-z]`,'g');
    let m;
    while((m=re.exec(text))!==null) {
      issues.push({id:String(id++),type:'error',category:'Missing Comma',original:`${w} ${text[m.index+w.length+1]}...`,suggestion:`${w}, ${text[m.index+w.length+1]}...`,explanation:`Use a comma after introductory words like "${w}".`,applied:false});
    }
  });

  // Passive voice detection
  const passiveRe = /\b(was|were|is|are|been|being) (completed|done|made|given|taken|written|created|built|designed|developed|used|called|found|seen|known|told|asked|expected|required|needed|considered|reported)\b/gi;
  let pm;
  while((pm=passiveRe.exec(text))!==null) {
    issues.push({id:String(id++),type:'warning',category:'Passive Voice',original:pm[0],suggestion:`Consider active voice: "someone ${pm[2]}"`,explanation:'Active voice is more direct and engaging than passive voice.',applied:false});
  }

  // Wordiness
  const wordyPhrases: [RegExp,string,string][] = [
    [/\bin order to\b/gi,'to','"In order to" can be shortened to "to".'],
    [/\bdue to the fact that\b/gi,'because','"Due to the fact that" = "because".'],
    [/\bat this point in time\b/gi,'now','"At this point in time" = "now".'],
    [/\bin spite of the fact that\b/gi,'although','Replace with "although" for clarity.'],
    [/\bfor the purpose of\b/gi,'to','Replace with "to" for conciseness.'],
    [/\bin the event that\b/gi,'if','Replace with "if" for brevity.'],
    [/\ba large number of\b/gi,'many','Replace with "many" for simplicity.'],
    [/\bthere are many .+ that\b/gi,'many...','Remove "there are" for a stronger sentence.'],
    [/\bit is important to note that\b/gi,'notably','Remove filler phrasing.'],
  ];
  wordyPhrases.forEach(([re,fix,explain]) => {
    let m;
    while((m=re.exec(text))!==null) {
      issues.push({id:String(id++),type:'warning',category:'Wordiness',original:m[0],suggestion:fix,explanation:explain,applied:false});
    }
  });

  // Weak word choices
  const weakWords: [RegExp,string][] = [
    [/\bvery important\b/gi,'crucial / vital'],
    [/\bvery good\b/gi,'excellent / outstanding'],
    [/\bvery bad\b/gi,'terrible / dreadful'],
    [/\bvery big\b/gi,'enormous / massive'],
    [/\bvery small\b/gi,'tiny / minute'],
    [/\bvery happy\b/gi,'delighted / thrilled'],
    [/\bvery sad\b/gi,'devastated / heartbroken'],
    [/\bvery fast\b/gi,'rapid / swift'],
    [/\bvery easy\b/gi,'effortless / straightforward'],
    [/\bgot\b/gi,'obtained / received'],
    [/\ba lot of\b/gi,'numerous / many'],
    [/\breally\b/gi,'(remove or use a stronger word)'],
    [/\bthings\b/gi,'(use a specific noun)'],
    [/\bstuff\b/gi,'(use a specific noun)'],
  ];
  weakWords.forEach(([re,fix]) => {
    let m;
    while((m=re.exec(text))!==null) {
      issues.push({id:String(id++),type:'suggestion',category:'Word Choice',original:m[0],suggestion:fix,explanation:`Replace "${m[0]}" with a stronger, more precise word.`,applied:false});
    }
  });

  // Repeated words detection
  const words = text.toLowerCase().split(/\s+/);
  for (let i=1;i<words.length;i++) {
    if (words[i].length>3 && words[i]===words[i-1]) {
      issues.push({id:String(id++),type:'error',category:'Repeated Word',original:`${words[i]} ${words[i]}`,suggestion:words[i],explanation:'Remove the repeated word.',applied:false});
    }
  }

  // If no issues found, give positive feedback
  if (issues.length===0) {
    issues.push({id:'0',type:'suggestion',category:'Writing Quality',original:'(No issues detected)',suggestion:'Your writing looks clean!',explanation:'No grammar errors, passive voice, or wordiness detected. Consider reviewing for tone and style using the Tone Analysis or Style Suggestions features.',applied:false});
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
});

export default GrammarResultScreen;
