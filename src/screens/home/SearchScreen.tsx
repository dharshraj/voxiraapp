import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

type SearchResult = {
  id:string; category:'speech'|'writing'|'interview'|'tip'|'feature';
  title:string; subtitle:string; icon:string; color:string; screen?:string;
};

const ALL_CONTENT: SearchResult[] = [
  // Features
  { id:'f1', category:'feature',   title:'Speech Analysis',        subtitle:'Record and analyse your speech in real-time',         icon:'mic',                 color:C.accent,  screen:'Speech'    },
  { id:'f2', category:'feature',   title:'Writing Coach',           subtitle:'Get AI grammar, tone and style feedback',             icon:'create',              color:C.green,   screen:'Writing'   },
  { id:'f3', category:'feature',   title:'Mock Interviews',         subtitle:'Practice with an AI interviewer for any job role',    icon:'people',              color:C.purple,  screen:'Interview' },
  { id:'f4', category:'feature',   title:'Daily Goals',             subtitle:'Set and track your daily practice targets',           icon:'flag',                color:C.gold,    screen:'DailyGoal' },
  { id:'f5', category:'feature',   title:'Progress Overview',       subtitle:'View your improvement over time with charts',         icon:'trending-up',         color:C.accent,  screen:'Profile'   },
  { id:'f6', category:'feature',   title:'Achievements',            subtitle:'Unlock badges and track your milestones',             icon:'trophy',              color:C.gold,    screen:'Profile'   },
  { id:'f7', category:'feature',   title:'Leaderboard',             subtitle:'See where you rank among all Voxira users',           icon:'podium',              color:C.purple,  screen:'Profile'   },
  { id:'f8', category:'feature',   title:'Subscription Plans',      subtitle:'Upgrade to Pro for unlimited sessions',               icon:'diamond',             color:C.gold,    screen:'Settings'  },
  // Tips
  { id:'t1', category:'tip',       title:'How to reduce filler words', subtitle:'Pause instead of saying "um" or "uh"',            icon:'bulb',                color:C.gold   },
  { id:'t2', category:'tip',       title:'The STAR interview method',  subtitle:'Structure answers: Situation, Task, Action, Result', icon:'bulb',              color:C.gold   },
  { id:'t3', category:'tip',       title:'Active vs passive voice',    subtitle:'Use active voice to sound more direct',            icon:'bulb',                color:C.gold   },
  { id:'t4', category:'tip',       title:'Controlling speech pace',    subtitle:'Slow down to sound more confident and clear',      icon:'bulb',                color:C.gold   },
  { id:'t5', category:'tip',       title:'Email tone guide',           subtitle:'Match your tone to the reader and context',        icon:'bulb',                color:C.gold   },
  // Sessions (mock history)
  { id:'s1', category:'speech',    title:'Speech Session — Yesterday', subtitle:'Clarity: 87 | Filler words: 3 | Duration: 4 min',  icon:'mic-outline',        color:C.accent },
  { id:'s2', category:'writing',   title:'Email Draft — 2 days ago',  subtitle:'Grammar: 94 | Tone: Professional | Words: 120',    icon:'create-outline',     color:C.green  },
  { id:'s3', category:'interview', title:'Software Engineer — 3d ago', subtitle:'Score: 78 | Questions: 5 | Duration: 12 min',      icon:'people-outline',     color:C.purple },
];

const TRENDING = ['Speech clarity','STAR method','Reduce filler words','Interview tips','Email writing','Pronunciation'];
const CATEGORIES = [
  { key:'all',       label:'All',        icon:'search',   color:C.primary },
  { key:'feature',   label:'Features',   icon:'apps',     color:C.accent  },
  { key:'speech',    label:'Speech',     icon:'mic',      color:C.accent  },
  { key:'writing',   label:'Writing',    icon:'create',   color:C.green   },
  { key:'interview', label:'Interview',  icon:'people',   color:C.purple  },
  { key:'tip',       label:'Tips',       icon:'bulb',     color:C.gold    },
];

export default function SearchScreen({ navigation }: any) {
  const [query,   setQuery]   = useState('');
  const [catFilter, setCat]   = useState('all');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const results = ALL_CONTENT.filter(item => {
    const matchQuery = !query || item.title.toLowerCase().includes(query.toLowerCase()) || item.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchCat   = catFilter === 'all' || item.category === catFilter;
    return matchQuery && matchCat;
  });

  const navigateTo = (item: SearchResult) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>

      {/* Search bar header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.muted}/>
        </TouchableOpacity>
        <View style={[s.searchBar, focused && s.searchBarFocused]}>
          <Ionicons name="search-outline" size={18} color={C.muted} style={{marginRight:8}}/>
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Search features, tips, history..."
            placeholderTextColor={C.hint}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="close-circle" size={18} color={C.muted}/>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.View style={[{flex:1}, { opacity:fadeAnim }]}>

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.key} style={[s.catChip, catFilter===cat.key && { backgroundColor:`${cat.color}22`, borderColor:`${cat.color}55` }]} onPress={() => setCat(cat.key)}>
              <Ionicons name={cat.icon as any} size={13} color={catFilter===cat.key ? cat.color : C.muted}/>
              <Text style={[s.catTxt, catFilter===cat.key && { color:cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Empty search state — show trending */}
          {!query && (
            <>
              <Text style={s.sectionLbl}>TRENDING SEARCHES</Text>
              <View style={s.trendingRow}>
                {TRENDING.map((t,i) => (
                  <TouchableOpacity key={i} style={s.trendChip} onPress={() => setQuery(t)}>
                    <Ionicons name="trending-up-outline" size={13} color={C.muted}/>
                    <Text style={s.trendTxt}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionLbl}>QUICK ACCESS</Text>
              {ALL_CONTENT.filter(a => a.category === 'feature').slice(0,4).map(item => (
                <ResultRow key={item.id} item={item} onPress={() => navigateTo(item)}/>
              ))}
            </>
          )}

          {/* Results */}
          {query.length > 0 && (
            <>
              <Text style={s.sectionLbl}>
                {results.length === 0 ? 'NO RESULTS' : `${results.length} RESULT${results.length>1?'S':''}`}
              </Text>
              {results.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Ionicons name="search-outline" size={44} color={C.muted}/>
                  <Text style={s.emptyTitle}>Nothing found for "{query}"</Text>
                  <Text style={s.emptySub}>Try different keywords or browse the categories above.</Text>
                </View>
              ) : (
                results.map(item => (
                  <ResultRow key={item.id} item={item} onPress={() => navigateTo(item)} query={query}/>
                ))
              )}
            </>
          )}

          <View style={{height:40}}/>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function ResultRow({ item, onPress, query='' }: { item:SearchResult; onPress:()=>void; query?:string }) {
  return (
    <TouchableOpacity style={rs.card} onPress={onPress} activeOpacity={0.80}>
      <View style={[rs.icon, { backgroundColor:`${item.color}18` }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color}/>
      </View>
      <View style={rs.body}>
        <Text style={rs.title}>{item.title}</Text>
        <Text style={rs.sub} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <View style={[rs.tag, { backgroundColor:`${item.color}15` }]}>
        <Text style={[rs.tagTxt, { color:item.color }]}>{item.category}</Text>
      </View>
      {item.screen && <Ionicons name="chevron-forward" size={16} color={C.hint}/>}
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  card:  { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:C.bgCard, borderRadius:16, padding:14, marginBottom:8, borderWidth:1, borderColor:C.border },
  icon:  { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  body:  { flex:1 },
  title: { fontSize:14, fontWeight:'600', color:C.text, marginBottom:3 },
  sub:   { fontSize:12, color:C.muted },
  tag:   { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  tagTxt:{ fontSize:10, fontWeight:'700', textTransform:'capitalize' },
});

const s = StyleSheet.create({
  root:     { flex:1, backgroundColor:C.bg },
  header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, paddingBottom:14, gap:10, borderBottomWidth:1, borderBottomColor:C.border },
  backBtn:  { width:42, height:42, borderRadius:13, backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  searchBar:{ flex:1, flexDirection:'row', alignItems:'center', backgroundColor:C.bgCard, borderRadius:16, paddingHorizontal:14, height:48, borderWidth:1.5, borderColor:C.border },
  searchBarFocused:{ borderColor:'rgba(21,101,255,0.6)', backgroundColor:'rgba(21,101,255,0.06)' },
  searchInput:{ flex:1, color:C.text, fontSize:14 },
  catRow:   { paddingHorizontal:20, paddingVertical:12, gap:8 },
  catChip:  { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:7, borderRadius:12, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
  catTxt:   { fontSize:12, color:C.muted, fontWeight:'500' },
  scroll:   { paddingHorizontal:20 },
  sectionLbl:{ fontSize:11, fontWeight:'700', color:C.hint, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:8 },
  trendingRow:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20 },
  trendChip:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:12, borderWidth:1, borderColor:C.border, backgroundColor:C.bgCard },
  trendTxt: { fontSize:12, color:C.muted },
  emptyWrap:{ alignItems:'center', paddingTop:40, gap:12 },
  emptyTitle:{ fontSize:16, fontWeight:'700', color:C.text },
  emptySub: { fontSize:13, color:C.muted, textAlign:'center', lineHeight:20, paddingHorizontal:16 },
});

