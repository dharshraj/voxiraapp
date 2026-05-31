import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = { bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C', primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E', gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444', text:'#F0F4FF', muted:'rgba(240,244,255,0.50)', hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)' };
function sc(s:number){ return s>=80?C.green:s>=65?C.accent:s>=50?C.gold:C.danger; }

export default function ScoreBreakdownScreen({ navigation, route }:any) {
  const { scores=[], answers=[], avgScore=78, role='Software Engineer' } = route?.params ?? {};
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(()=>{ Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start(); },[]);

  const best  = scores.length ? Math.max(...scores) : 0;
  const worst = scores.length ? Math.min(...scores) : 0;
  const trend = scores.length>1 ? scores[scores.length-1]-scores[0] : 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Score Breakdown</Text>
          <View style={{width:42}}/>
        </View>
        {/* Summary stats */}
        <View style={s.statsRow}>
          {[
            {val:`${avgScore}`, lbl:'Average',  color:sc(avgScore)},
            {val:`${best}`,     lbl:'Best',      color:C.green},
            {val:`${worst}`,    lbl:'Lowest',    color:C.danger},
            {val:`${trend>=0?'+':''}${trend}`, lbl:'Trend', color:trend>=0?C.green:C.danger},
          ].map((st,i)=>(
            <View key={i} style={s.statItem}>
              <Text style={[s.statVal,{color:st.color}]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Bar chart */}
        <Text style={s.sectionTitle}>Score Per Question</Text>
        <View style={s.chartCard}>
          <View style={s.chart}>
            {scores.map((score:number,i:number)=>{
              const h=Math.max(8,(score/100)*100);
              const col=sc(score);
              return(
                <View key={i} style={s.chartCol}>
                  <Text style={[s.chartVal,{color:col}]}>{score}</Text>
                  <View style={s.chartBarBg}>
                    <LinearGradient colors={[col,`${col}55`]} style={[s.chartBar,{height:h}]}/>
                  </View>
                  <Text style={s.chartLbl}>Q{i+1}</Text>
                </View>
              );
            })}
          </View>
          {/* Legend */}
          <View style={s.legend}>
            {[[C.green,'80+'],[C.accent,'65-79'],[C.gold,'50-64'],[C.danger,'<50']].map(([col,lbl],i)=>(
              <View key={i} style={s.legendItem}>
                <View style={[s.legendDot,{backgroundColor:col}]}/>
                <Text style={s.legendTxt}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Q&A detail */}
        <Text style={s.sectionTitle}>Detailed Answers</Text>
        <View style={s.qaList}>
          {answers.map((q:string,i:number)=>{
            const score=scores[i]??75;
            const col=sc(score);
            return(
              <View key={i} style={[s.qaRow,i===answers.length-1&&{borderBottomWidth:0}]}>
                <View style={s.qaLeft}>
                  <View style={[s.qaNum,{backgroundColor:`${col}18`}]}>
                    <Text style={[s.qaNumTxt,{color:col}]}>Q{i+1}</Text>
                  </View>
                  <View style={[s.qaScoreCircle,{borderColor:`${col}60`}]}>
                    <Text style={[s.qaScoreNum,{color:col}]}>{score}</Text>
                  </View>
                </View>
                <View style={s.qaRight}>
                  <Text style={s.qaQuestion} numberOfLines={2}>{q}</Text>
                  <View style={s.qaBarBg}>
                    <View style={[s.qaBarFill,{width:`${score}%` as any,backgroundColor:col}]}/>
                  </View>
                  <Text style={s.qaFeedback}>
                    {score>=80?'Strong answer with clear examples and good structure.'
                      :score>=65?'Good answer. Add more specific details and metrics.'
                      :'Needs more structure. Use the STAR method for clearer delivery.'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={s.practiceBtn} onPress={()=>navigation.navigate('InterviewHome')} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED','#4C1D95']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.practiceBtnGrad}>
            <Ionicons name="refresh-outline" size={20} color="#fff"/>
            <Text style={s.practiceBtnTxt}>Practice Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  headerBg:{paddingBottom:16},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:{width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.text},
  statsRow:{flexDirection:'row',marginHorizontal:20,backgroundColor:'rgba(255,255,255,0.05)',borderRadius:16,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  statItem:{flex:1,alignItems:'center',paddingVertical:12,borderRightWidth:1,borderRightColor:C.border},
  statVal:{fontSize:18,fontWeight:'800',marginBottom:2},
  statLbl:{fontSize:10,color:C.muted},
  scroll:{paddingHorizontal:20,paddingTop:16},
  sectionTitle:{fontSize:15,fontWeight:'700',color:C.text,marginBottom:12},
  chartCard:{backgroundColor:C.bgCard,borderRadius:20,padding:16,borderWidth:1,borderColor:C.border,marginBottom:24},
  chart:{flexDirection:'row',alignItems:'flex-end',gap:8,height:130,marginBottom:12},
  chartCol:{flex:1,alignItems:'center',gap:4},
  chartVal:{fontSize:10,fontWeight:'700'},
  chartBarBg:{width:'100%',height:100,justifyContent:'flex-end',borderRadius:6,overflow:'hidden'},
  chartBar:{width:'100%',borderRadius:6},
  chartLbl:{fontSize:10,color:C.hint},
  legend:{flexDirection:'row',justifyContent:'center',gap:14},
  legendItem:{flexDirection:'row',alignItems:'center',gap:5},
  legendDot:{width:8,height:8,borderRadius:4},
  legendTxt:{fontSize:11,color:C.muted},
  qaList:{backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border,marginBottom:24},
  qaRow:{flexDirection:'row',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border,alignItems:'flex-start'},
  qaLeft:{gap:8,alignItems:'center',flexShrink:0},
  qaNum:{paddingHorizontal:8,paddingVertical:3,borderRadius:8},
  qaNumTxt:{fontSize:11,fontWeight:'700'},
  qaScoreCircle:{width:40,height:40,borderRadius:20,borderWidth:2,alignItems:'center',justifyContent:'center'},
  qaScoreNum:{fontSize:14,fontWeight:'800'},
  qaRight:{flex:1,gap:8},
  qaQuestion:{fontSize:13,color:C.text,lineHeight:18,fontWeight:'500'},
  qaBarBg:{height:4,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'},
  qaBarFill:{height:'100%',borderRadius:2},
  qaFeedback:{fontSize:12,color:C.muted,lineHeight:17},
  practiceBtn:{borderRadius:16,overflow:'hidden'},
  practiceBtnGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  practiceBtnTxt:{fontSize:16,fontWeight:'700',color:'#fff'},
});
