import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

type SearchResult = {
  id: string;
  category: 'speech' | 'tip' | 'feature';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  screen?: string;
  screenParams?: Record<string, any>;
};

// Navigation targets — all screens registered in HomeStack so goBack() returns to Search
const ALL_CONTENT: SearchResult[] = [
  { id:'f1', category:'feature', title:'Speech Analysis',    subtitle:'Record and analyse your speech in real-time',    icon:'mic',              color:'#0369A1', screen:'SpeechHomeFromSearch'                                  },
  { id:'f2', category:'feature', title:'Daily Goals',        subtitle:'Set and track your daily practice targets',      icon:'flag-outline',     color:'#B45309', screen:'DailyGoals'                                            },
  { id:'f3', category:'feature', title:'Progress Overview',  subtitle:'View your improvement over time',                icon:'trending-up',      color:'#15803D', screen:'ProgressOverview'                                      },
  { id:'f4', category:'feature', title:'Achievements',       subtitle:'Unlock badges and track your milestones',        icon:'trophy-outline',   color:'#B45309', screen:'Achievements'                                          },
  { id:'s1', category:'speech',  title:'Speech Dashboard',   subtitle:'Composite scores, WPM, filler breakdown',        icon:'bar-chart-outline',color:'#0369A1', screen:'SpeechDashboardFromSearch'                             },
  { id:'s2', category:'speech',  title:'Session History',    subtitle:'All your past speech sessions',                  icon:'time-outline',     color:'#0369A1', screen:'SpeechHistoryFromSearch'                               },
  { id:'s3', category:'speech',  title:'Filler Words Guide', subtitle:'How to detect and reduce filler words',          icon:'warning-outline',  color:'#B45309', screen:'TopicDetail', screenParams:{ query:'Reduce filler words' } },
  { id:'t1', category:'tip',     title:'Speech Clarity',     subtitle:'Articulation exercises and clarity techniques',  icon:'bulb-outline',     color:'#B45309', screen:'TopicDetail', screenParams:{ query:'Speech clarity'      } },
  { id:'t2', category:'tip',     title:'Reduce Filler Words',subtitle:'Pause instead of "um" or "uh"',                 icon:'bulb-outline',     color:'#B45309', screen:'TopicDetail', screenParams:{ query:'Reduce filler words'  } },
  { id:'t3', category:'tip',     title:'Pronunciation',      subtitle:'Techniques for clearer pronunciation',           icon:'bulb-outline',     color:'#B45309', screen:'TopicDetail', screenParams:{ query:'Pronunciation'        } },
  { id:'t4', category:'tip',     title:'Pace Control',       subtitle:'Ideal WPM ranges and pacing techniques',         icon:'bulb-outline',     color:'#B45309', screen:'TopicDetail', screenParams:{ query:'Pace control'         } },
  { id:'t5', category:'tip',     title:'Confidence Tips',    subtitle:'Posture, breathing, and mental preparation',     icon:'bulb-outline',     color:'#B45309', screen:'TopicDetail', screenParams:{ query:'Confidence tips'      } },
];

const TRENDING = ['Speech clarity','Reduce filler words','Pronunciation','Pace control','Confidence tips'];

function ResultRow({ item, onPress }: { item: SearchResult; onPress: () => void }) {
  const { colors: C } = useTheme();
  const rs = StyleSheet.create({
    card:   { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:C.surface, borderRadius:14, padding:13, marginBottom:8, borderWidth:1, borderColor:C.border },
    icon:   { width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center', flexShrink:0 },
    body:   { flex:1 },
    title:  { fontSize:14, fontWeight:'600', color:C.text, marginBottom:2 },
    sub:    { fontSize:12, color:C.textMuted },
    tag:    { paddingHorizontal:7, paddingVertical:3, borderRadius:7 },
    tagTxt: { fontSize:10, fontWeight:'700', textTransform:'capitalize' },
  });
  return (
    <TouchableOpacity style={rs.card} onPress={onPress} activeOpacity={0.80}>
      <View style={[rs.icon, { backgroundColor:`${item.color}18` }]}>
        <Ionicons name={item.icon as any} size={19} color={item.color} />
      </View>
      <View style={rs.body}>
        <Text style={rs.title}>{item.title}</Text>
        <Text style={rs.sub} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <View style={[rs.tag, { backgroundColor:`${item.color}15` }]}>
        <Text style={[rs.tagTxt, { color:item.color }]}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={C.textMuted} />
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const [query,     setQuery]   = useState('');
  const [catFilter, setCat]     = useState('all');
  const [focused,   setFocused] = useState(false);
  const inputRef  = useRef<TextInput>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const CATEGORIES = [
    { key:'all',     label:'All',      icon:'search',  color:C.primary },
    { key:'feature', label:'Features', icon:'apps',    color:C.primary },
    { key:'speech',  label:'Speech',   icon:'mic',     color:C.primary },
    { key:'tip',     label:'Tips',     icon:'bulb',    color:C.warning },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Filter by both query text AND category tab
  const filtered = ALL_CONTENT.filter(item => {
    const matchQuery = !query ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchCat = catFilter === 'all' || item.category === catFilter;
    return matchQuery && matchCat;
  });

  // Whether a category tab is actively filtering (non-all, no query)
  const isFiltering = catFilter !== 'all' || query.length > 0;

  const navigateTo = (item: SearchResult) => {
    if (!item.screen) return;
    navigation.navigate(item.screen, item.screenParams ?? {});
  };

  const openTopic = (topicQuery: string) => {
    navigation.navigate('TopicDetail', { query: topicQuery });
  };

  const s = StyleSheet.create({
    root:       { flex:1, backgroundColor:C.bg, ...(Platform.OS === 'web' && { height:'100%' as any }) },
    header:     { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?56:32, paddingBottom:14, gap:10, borderBottomWidth:1, borderBottomColor:C.border },
    backBtn:    { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    searchBar:  { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:14, paddingHorizontal:12, height:44, borderWidth:1.5, borderColor:C.border },
    searchBarFocused: { borderColor:C.primary+'99', backgroundColor:'#F5F3F0' },
    searchInput:{ flex:1, color:C.text, fontSize:14 },
    catRow:     { paddingHorizontal:20, paddingVertical:10, gap:8 },
    catChip:    { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
    catTxt:     { fontSize:12, color:C.textMuted, fontWeight:'500' },
    scroll:     { paddingHorizontal:20 },
    sectionLbl: { fontSize:11, fontWeight:'700', color:C.textMuted, letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:8 },
    trendRow:   { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
    trendChip:  { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
    trendTxt:   { fontSize:12, color:C.textSec },
    emptyWrap:  { alignItems:'center', paddingTop:40, gap:12 },
    emptyTitle: { fontSize:16, fontWeight:'700', color:C.text },
    emptySub:   { fontSize:13, color:C.textMuted, textAlign:'center', lineHeight:20, paddingHorizontal:16 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <View style={[s.searchBar, focused && s.searchBarFocused]}>
          <Ionicons name="search-outline" size={17} color={C.textMuted} style={{ marginRight:8 }} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Search features, tips, history..."
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={v => { setQuery(v); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="close-circle" size={17} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.View style={[{ flex:1 }, { opacity:fadeAnim }]}>
        {/* Category filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[s.catChip, catFilter===cat.key && { backgroundColor:`${cat.color}18`, borderColor:`${cat.color}55` }]}
              onPress={() => setCat(cat.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={cat.icon as any} size={12} color={catFilter===cat.key ? cat.color : C.textMuted} />
              <Text style={[s.catTxt, catFilter===cat.key && { color:cat.color, fontWeight:'700' }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={Platform.OS === 'web' ? ({ height:'100%', overflowY:'auto' } as any) : undefined}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* When filtering by category (no query): show filtered list */}
          {!query && catFilter !== 'all' && (
            <>
              <Text style={s.sectionLbl}>
                {CATEGORIES.find(c => c.key === catFilter)?.label?.toUpperCase() ?? catFilter.toUpperCase()}
              </Text>
              {filtered.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Ionicons name="search-outline" size={40} color={C.textMuted} />
                  <Text style={s.emptyTitle}>Nothing here</Text>
                  <Text style={s.emptySub}>No {catFilter} content found.</Text>
                </View>
              ) : (
                filtered.map(item => (
                  <ResultRow key={item.id} item={item} onPress={() => navigateTo(item)} />
                ))
              )}
            </>
          )}

          {/* Default view (no query, all filter): trending + quick access */}
          {!query && catFilter === 'all' && (
            <>
              <Text style={s.sectionLbl}>Trending Searches</Text>
              <View style={s.trendRow}>
                {TRENDING.map((t, i) => (
                  <TouchableOpacity key={i} style={s.trendChip} onPress={() => openTopic(t)} activeOpacity={0.75}>
                    <Ionicons name="trending-up-outline" size={12} color={C.primary} />
                    <Text style={s.trendTxt}>{t}</Text>
                    <Ionicons name="chevron-forward" size={11} color={C.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionLbl}>Quick Access</Text>
              {ALL_CONTENT.filter(a => a.category === 'feature').map(item => (
                <ResultRow key={item.id} item={item} onPress={() => navigateTo(item)} />
              ))}
            </>
          )}

          {/* Query search results */}
          {query.length > 0 && (
            <>
              <Text style={s.sectionLbl}>
                {filtered.length === 0 ? 'No Results' : `${filtered.length} Result${filtered.length > 1 ? 's' : ''}`}
              </Text>
              {filtered.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Ionicons name="search-outline" size={44} color={C.textMuted} />
                  <Text style={s.emptyTitle}>Nothing found for "{query}"</Text>
                  <Text style={s.emptySub}>Try different keywords or browse the categories above.</Text>
                </View>
              ) : (
                filtered.map(item => (
                  <ResultRow key={item.id} item={item} onPress={() => navigateTo(item)} />
                ))
              )}
            </>
          )}

          <View style={{ height:40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}
