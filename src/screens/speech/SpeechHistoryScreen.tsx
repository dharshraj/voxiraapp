import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

type Session = {
  id:string; mode:string; score:number; date:string;
  duration:string; fillers:number; icon:string; color:string;
};

const MOCK_SESSIONS: Session[] = [
  { id:'1', mode:'Free Speech',   score:87, date:'Today, 2:30 PM',    duration:'4:12', fillers:3,  icon:'mic-outline',      color:C.accent  },
  { id:'2', mode:'Presentation',  score:74, date:'Today, 10:15 AM',   duration:'8:45', fillers:7,  icon:'easel-outline',    color:C.green   },
  { id:'3', mode:'Free Speech',   score:91, date:'Yesterday, 7:00 PM',duration:'3:20', fillers:1,  icon:'mic-outline',      color:C.accent  },
  { id:'4', mode:'Conversation',  score:68, date:'Yesterday, 2:00 PM',duration:'5:10', fillers:11, icon:'chatbubbles-outline',color:C.purple },
  { id:'5', mode:'Read Aloud',    score:82, date:'2 days ago',         duration:'2:45', fillers:2,  icon:'book-outline',     color:C.gold    },
  { id:'6', mode:'Free Speech',   score:79, date:'2 days ago',         duration:'6:30', fillers:5,  icon:'mic-outline',      color:C.accent  },
  { id:'7', mode:'Presentation',  score:88, date:'3 days ago',         duration:'9:00', fillers:4,  icon:'easel-outline',    color:C.green   },
  { id:'8', mode:'Free Speech',   score:72, date:'4 days ago',         duration:'3:55', fillers:8,  icon:'mic-outline',      color:C.accent  },
  { id:'9', mode:'Conversation',  score:85, date:'5 days ago',         duration:'4:40', fillers:2,  icon:'chatbubbles-outline',color:C.purple },
  { id:'10',mode:'Read Aloud',    score:93, date:'6 days ago',         duration:'2:20', fillers:0,  icon:'book-outline',     color:C.gold    },
];

const FILTERS = ['All','Free Speech','Presentation','Conversation','Read Aloud'];
const SORT_OPTIONS = ['Newest','Highest Score','Lowest Score'];

function scoreColor(s:number){ return s>=85?C.green:s>=70?C.accent:C.gold; }

export default function SpeechHistoryScreen({ navigation }:any){
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [filter,   setFilter]   = useState('All');
  const [sort,     setSort]     = useState('Newest');
  const [search,   setSearch]   = useState('');
  const [showSort, setShowSort] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const filtered = sessions
    .filter(s=>{
      const matchFilter = filter==='All' || s.mode===filter;
      const matchSearch = !search || s.mode.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a,b)=>{
      if(sort==='Highest Score') return b.score-a.score;
      if(sort==='Lowest Score')  return a.score-b.score;
      return 0; // Newest = original order
    });

  const avgScore = filtered.length ? Math.round(filtered.reduce((a,b)=>a+b.score,0)/filtered.length) : 0;
  const bestScore= filtered.length ? Math.max(...filtered.map(s=>s.score)) : 0;
  const totalFillers = filtered.reduce((a,b)=>a+b.fillers,0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Speech History</Text>
            <Text style={s.headerSub}>{filtered.length} sessions</Text>
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={()=>setShowSort(!showSort)}>
            <Ionicons name="funnel-outline" size={20} color={C.muted}/>
          </TouchableOpacity>
        </View>

        {/* Sort dropdown */}
        {showSort && (
          <View style={s.sortDropdown}>
            {SORT_OPTIONS.map(o=>(
              <TouchableOpacity key={o} style={[s.sortOption, sort===o&&s.sortOptionActive]} onPress={()=>{setSort(o);setShowSort(false);}}>
                <Text style={[s.sortOptionTxt, sort===o&&s.sortOptionTxtActive]}>{o}</Text>
                {sort===o && <Ionicons name="checkmark" size={16} color={C.primary}/>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search bar */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.muted} style={{marginRight:8}}/>
          <TextInput
            style={s.searchInput} placeholder="Search sessions..." placeholderTextColor={C.hint}
            value={search} onChangeText={setSearch} autoCorrect={false}
          />
          {search.length>0 && (
            <TouchableOpacity onPress={()=>setSearch('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="close-circle" size={16} color={C.muted}/>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary row */}
        <View style={s.summaryRow}>
          {[
            {val:`${avgScore}`,  lbl:'Avg Score', icon:'star',          color:C.gold   },
            {val:`${bestScore}`, lbl:'Best',      icon:'trophy-outline', color:C.green  },
            {val:`${totalFillers}`,lbl:'Total Fillers',icon:'warning-outline',color:C.danger},
          ].map((st,i)=>(
            <View key={i} style={s.summaryItem}>
              <Ionicons name={st.icon as any} size={14} color={st.color}/>
              <Text style={[s.summaryVal,{color:st.color}]}>{st.val}</Text>
              <Text style={s.summaryLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} style={[s.chip, filter===f&&s.chipActive]} onPress={()=>setFilter(f)}>
              <Text style={[s.chipTxt, filter===f&&s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <Animated.ScrollView style={[{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length===0?(
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="mic-off-outline" size={44} color={C.muted}/>
            </View>
            <Text style={s.emptyTitle}>No sessions found</Text>
            <Text style={s.emptySub}>Try a different filter or search term</Text>
          </View>
        ):(
          <>
            {/* Weekly score trend mini chart */}
            <View style={s.trendCard}>
              <Text style={s.trendTitle}>This Week's Scores</Text>
              <View style={s.trendBars}>
                {MOCK_SESSIONS.slice(0,7).reverse().map((ss,i)=>{
                  const h = Math.max(8,(ss.score/100)*56);
                  const col = scoreColor(ss.score);
                  return (
                    <View key={i} style={s.trendCol}>
                      <Text style={[s.trendVal,{color:col}]}>{ss.score}</Text>
                      <View style={[s.trendBarBg]}>
                        <LinearGradient colors={[col,`${col}55`]} style={[s.trendBar,{height:h}]}/>
                      </View>
                      <Text style={s.trendDay}>{['M','T','W','T','F','S','S'][i]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Session list */}
            <Text style={s.listLabel}>ALL SESSIONS</Text>
            <View style={s.sessionList}>
              {filtered.map((ss,i)=>{
                const col = scoreColor(ss.score);
                return (
                  <TouchableOpacity
                    key={ss.id}
                    style={[s.sessionRow, i===filtered.length-1&&{borderBottomWidth:0}]}
                    onPress={()=>navigation.navigate('SessionDetail',{
                      score:ss.score, duration:0, mode:ss.mode,
                      date:ss.date, fillerCount:ss.fillers,
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={[s.sessionIcon,{backgroundColor:`${ss.color}18`}]}>
                      <Ionicons name={ss.icon as any} size={20} color={ss.color}/>
                    </View>
                    <View style={s.sessionMeta}>
                      <Text style={s.sessionMode}>{ss.mode}</Text>
                      <View style={s.sessionSubRow}>
                        <Ionicons name="time-outline" size={11} color={C.hint}/>
                        <Text style={s.sessionSub}>{ss.date}</Text>
                        <View style={s.dot}/>
                        <Text style={s.sessionSub}>{ss.duration}</Text>
                        <View style={s.dot}/>
                        <Ionicons name="warning-outline" size={11} color={C.hint}/>
                        <Text style={s.sessionSub}>{ss.fillers} fillers</Text>
                      </View>
                    </View>
                    <View style={s.sessionRight}>
                      <View style={[s.scoreBadge,{backgroundColor:`${col}15`}]}>
                        <Text style={[s.scoreBadgeTxt,{color:col}]}>{ss.score}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={C.hint}/>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:12},
  header:        {flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:32,marginBottom:12,gap:10},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerCenter:  {flex:1},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  headerSub:     {fontSize:12,color:C.muted,marginTop:2},
  sortBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  sortDropdown:  {marginHorizontal:20,backgroundColor:C.surface,borderRadius:14,borderWidth:1,borderColor:C.border,overflow:'hidden',marginBottom:10},
  sortOption:    {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border},
  sortOptionActive:{backgroundColor:'rgba(21,101,255,0.10)'},
  sortOptionTxt: {fontSize:13,color:C.muted},
  sortOptionTxtActive:{color:C.primary,fontWeight:'600'},
  searchBar:     {flexDirection:'row',alignItems:'center',marginHorizontal:20,backgroundColor:C.bgCard,borderRadius:14,paddingHorizontal:14,height:44,borderWidth:1,borderColor:C.border,marginBottom:12},
  searchInput:   {flex:1,color:C.text,fontSize:14},
  summaryRow:    {flexDirection:'row',marginHorizontal:20,backgroundColor:'rgba(255,255,255,0.04)',borderRadius:14,borderWidth:1,borderColor:C.border,overflow:'hidden',marginBottom:12},
  summaryItem:   {flex:1,alignItems:'center',paddingVertical:10,gap:4,borderRightWidth:1,borderRightColor:C.border},
  summaryVal:    {fontSize:16,fontWeight:'800'},
  summaryLbl:    {fontSize:10,color:C.muted},
  filterRow:     {paddingHorizontal:20,gap:8,paddingBottom:4},
  chip:          {paddingHorizontal:14,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  chipActive:    {backgroundColor:C.primary,borderColor:C.primary},
  chipTxt:       {fontSize:12,color:C.muted,fontWeight:'500'},
  chipTxtActive: {color:'#fff'},
  scroll:        {paddingHorizontal:20,paddingTop:16},
  trendCard:     {backgroundColor:C.bgCard,borderRadius:18,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20},
  trendTitle:    {fontSize:13,fontWeight:'600',color:C.muted,marginBottom:14,textTransform:'uppercase',letterSpacing:0.5},
  trendBars:     {flexDirection:'row',alignItems:'flex-end',gap:6,height:80},
  trendCol:      {flex:1,alignItems:'center',gap:4},
  trendVal:      {fontSize:9,fontWeight:'700'},
  trendBarBg:    {width:'100%',justifyContent:'flex-end',height:56,borderRadius:4,overflow:'hidden'},
  trendBar:      {width:'100%',borderRadius:4},
  trendDay:      {fontSize:9,color:C.hint},
  listLabel:     {fontSize:11,fontWeight:'700',color:C.hint,letterSpacing:1,textTransform:'uppercase',marginBottom:10},
  sessionList:   {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:C.border},
  sessionRow:    {flexDirection:'row',alignItems:'center',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:C.border},
  sessionIcon:   {width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center',flexShrink:0},
  sessionMeta:   {flex:1},
  sessionMode:   {fontSize:13,fontWeight:'600',color:C.text,marginBottom:4},
  sessionSubRow: {flexDirection:'row',alignItems:'center',gap:5},
  sessionSub:    {fontSize:11,color:C.hint},
  dot:           {width:3,height:3,borderRadius:2,backgroundColor:C.hint},
  sessionRight:  {flexDirection:'row',alignItems:'center',gap:8},
  scoreBadge:    {paddingHorizontal:10,paddingVertical:4,borderRadius:10},
  scoreBadgeTxt: {fontSize:13,fontWeight:'800'},
  empty:         {alignItems:'center',paddingTop:80,gap:12},
  emptyIcon:     {width:88,height:88,borderRadius:26,backgroundColor:C.bgCard,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  emptyTitle:    {fontSize:18,fontWeight:'700',color:C.text},
  emptySub:      {fontSize:13,color:C.muted,textAlign:'center'},
});