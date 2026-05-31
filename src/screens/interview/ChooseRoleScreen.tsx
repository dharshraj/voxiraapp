import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, TextInput, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');
const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', purple:'#A855F7',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const CATEGORIES = [
  { label:'All',         icon:'apps-outline'        },
  { label:'Tech',        icon:'code-slash-outline'   },
  { label:'Business',    icon:'briefcase-outline'    },
  { label:'Creative',    icon:'color-wand-outline'   },
  { label:'Healthcare',  icon:'medkit-outline'       },
];

const ROLES = [
  { title:'Software Engineer',    cat:'Tech',      icon:'code-slash-outline',    color:C.accent,  grad:['#1565FF','#0D47A1'], popular:true,  questions:10 },
  { title:'Product Manager',      cat:'Business',  icon:'clipboard-outline',     color:C.purple,  grad:['#7C3AED','#4C1D95'], popular:true,  questions:10 },
  { title:'Data Analyst',         cat:'Tech',      icon:'bar-chart-outline',     color:C.green,   grad:['#059669','#065F46'], popular:true,  questions:8  },
  { title:'Marketing Manager',    cat:'Business',  icon:'megaphone-outline',     color:C.gold,    grad:['#D97706','#92400E'], popular:true,  questions:8  },
  { title:'UX Designer',          cat:'Creative',  icon:'color-wand-outline',    color:C.purple,  grad:['#7C3AED','#4C1D95'], popular:false, questions:8  },
  { title:'Sales Executive',      cat:'Business',  icon:'trending-up-outline',   color:C.green,   grad:['#059669','#065F46'], popular:false, questions:8  },
  { title:'Finance Analyst',      cat:'Business',  icon:'calculator-outline',    color:C.accent,  grad:['#1565FF','#0D47A1'], popular:false, questions:8  },
  { title:'HR Manager',           cat:'Business',  icon:'people-circle-outline', color:C.gold,    grad:['#D97706','#92400E'], popular:false, questions:8  },
  { title:'DevOps Engineer',      cat:'Tech',      icon:'server-outline',        color:C.accent,  grad:['#1565FF','#0D47A1'], popular:false, questions:8  },
  { title:'Graphic Designer',     cat:'Creative',  icon:'brush-outline',         color:C.purple,  grad:['#7C3AED','#4C1D95'], popular:false, questions:6  },
  { title:'Nurse / Doctor',       cat:'Healthcare',icon:'medkit-outline',        color:C.green,   grad:['#059669','#065F46'], popular:false, questions:8  },
  { title:'Project Manager',      cat:'Business',  icon:'git-branch-outline',    color:C.gold,    grad:['#D97706','#92400E'], popular:false, questions:10 },
];

export default function ChooseRoleScreen({ navigation, route }:any) {
  const presetType = route?.params?.type;
  const [cat,    setCat]    = useState('All');
  const [search, setSearch] = useState('');
  const [selected,setSelected]=useState('');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const filtered = ROLES.filter(r => {
    const matchCat    = cat==='All' || r.cat===cat;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const goNext = () => {
    if (!selected) return;
    navigation.navigate('InterviewSetup',{ role:selected, type:presetType });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Choose Your Role</Text>
            <Text style={s.headerSub}>Select the job you're interviewing for</Text>
          </View>
          <View style={{width:42}}/>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.muted} style={{marginRight:8}}/>
          <TextInput
            style={s.searchInput} placeholder="Search roles..." placeholderTextColor={C.hint}
            value={search} onChangeText={setSearch} autoCorrect={false}
          />
          {search.length>0&&<TouchableOpacity onPress={()=>setSearch('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="close-circle" size={16} color={C.muted}/>
          </TouchableOpacity>}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map(c=>(
            <TouchableOpacity key={c.label} style={[s.catChip, cat===c.label&&s.catChipActive]} onPress={()=>setCat(c.label)}>
              <Ionicons name={c.icon as any} size={13} color={cat===c.label?'#fff':C.muted}/>
              <Text style={[s.catTxt, cat===c.label&&s.catTxtActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}, Platform.OS === 'web' && ({height: '100vh', overflowY: 'scroll'} as any)] contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {filtered.some(r=>r.popular) && cat==='All' && !search && (
          <>
            <Text style={s.groupLbl}>🔥 POPULAR ROLES</Text>
            <View style={s.rolesGrid}>
              {filtered.filter(r=>r.popular).map((r,i)=>(
                <RoleCard key={i} role={r} selected={selected===r.title} onPress={()=>setSelected(r.title)}/>
              ))}
            </View>
            <Text style={s.groupLbl}>ALL ROLES</Text>
          </>
        )}
        <View style={s.rolesGrid}>
          {(cat==='All'&&!search ? filtered.filter(r=>!r.popular) : filtered).map((r,i)=>(
            <RoleCard key={i} role={r} selected={selected===r.title} onPress={()=>setSelected(r.title)}/>
          ))}
        </View>
        <View style={{height:100}}/>
      </Animated.ScrollView>

      {/* Bottom CTA */}
      {selected && (
        <View style={s.ctaBar}>
          <View style={s.ctaLeft}>
            <Text style={s.ctaRole}>{selected}</Text>
            <Text style={s.ctaSub}>{ROLES.find(r=>r.title===selected)?.questions} questions</Text>
          </View>
          <TouchableOpacity style={s.ctaBtn} onPress={goNext} activeOpacity={0.85}>
            <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.ctaBtnGrad}>
              <Text style={s.ctaBtnTxt}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff"/>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function RoleCard({role,selected,onPress}:any) {
  return (
    <TouchableOpacity style={[rs.card, selected&&rs.cardActive]} onPress={onPress} activeOpacity={0.82}>
      <LinearGradient colors={role.grad} style={rs.iconWrap}>
        <Ionicons name={role.icon} size={22} color="#fff"/>
      </LinearGradient>
      <Text style={rs.title} numberOfLines={2}>{role.title}</Text>
      <View style={rs.footer}>
        <Text style={rs.cat}>{role.cat}</Text>
        <View style={rs.qBadge}>
          <Text style={rs.qTxt}>{role.questions}Q</Text>
        </View>
      </View>
      {selected&&<View style={rs.checkWrap}><Ionicons name="checkmark-circle" size={22} color={C.green}/></View>}
    </TouchableOpacity>
  );
}

const CARD_W = (W-52)/2;
const rs = StyleSheet.create({
  card:      {width:CARD_W,backgroundColor:C.bgCard,borderRadius:18,padding:14,borderWidth:1,borderColor:C.border,gap:10},
  cardActive:{borderColor:'rgba(21,101,255,0.6)',backgroundColor:'rgba(21,101,255,0.08)'},
  iconWrap:  {width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},
  title:     {fontSize:13,fontWeight:'700',color:C.text,lineHeight:18},
  footer:    {flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  cat:       {fontSize:11,color:C.muted},
  qBadge:    {backgroundColor:'rgba(255,255,255,0.08)',borderRadius:8,paddingHorizontal:8,paddingVertical:2},
  qTxt:      {fontSize:10,color:C.hint,fontWeight:'600'},
  checkWrap: {position:'absolute',top:10,right:10},
});

const s = StyleSheet.create({
  root:        {flex:1,backgroundColor:C.bg},
  headerBg:    {paddingBottom:12},
  header:      {flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:32,marginBottom:12,gap:10},
  backBtn:     {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerCenter:{flex:1},
  headerTitle: {fontSize:17,fontWeight:'700',color:C.text},
  headerSub:   {fontSize:12,color:C.muted,marginTop:2},
  searchBar:   {flexDirection:'row',alignItems:'center',marginHorizontal:20,backgroundColor:C.bgCard,borderRadius:14,paddingHorizontal:14,height:44,borderWidth:1,borderColor:C.border,marginBottom:12},
  searchInput: {flex:1,color:C.text,fontSize:14},
  catRow:      {paddingHorizontal:20,gap:8,paddingBottom:4},
  catChip:     {flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.surface},
  catChipActive:{backgroundColor:C.primary,borderColor:C.primary},
  catTxt:      {fontSize:12,color:C.muted,fontWeight:'500'},
  catTxtActive:{color:'#fff'},
  scroll:      {paddingHorizontal:20,paddingTop:16},
  groupLbl:    {fontSize:11,fontWeight:'700',color:C.hint,letterSpacing:1,textTransform:'uppercase',marginBottom:10,marginTop:4},
  rolesGrid:   {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:16},
  ctaBar:      {position:'absolute',bottom:0,left:0,right:0,flexDirection:'row',alignItems:'center',backgroundColor:C.bgCard,borderTopWidth:1,borderTopColor:C.border,paddingHorizontal:20,paddingTop:14,paddingBottom:Platform.OS==='ios'?34:16,gap:12},
  ctaLeft:     {flex:1},
  ctaRole:     {fontSize:14,fontWeight:'700',color:C.text},
  ctaSub:      {fontSize:12,color:C.muted,marginTop:2},
  ctaBtn:      {borderRadius:14,overflow:'hidden'},
  ctaBtnGrad:  {flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:20,paddingVertical:13},
  ctaBtnTxt:   {fontSize:15,fontWeight:'700',color:'#fff'},
});

