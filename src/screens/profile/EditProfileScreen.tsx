import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)', danger:'#EF4444',
};

const GOALS = ['Improve public speaking','Ace job interviews','Better workplace communication','Write better emails','Build confidence'];
const LEVELS= ['Beginner','Intermediate','Advanced','Expert'];

export default function EditProfileScreen({ navigation }:any) {
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [bio,       setBio]       = useState('');
  const [level,     setLevel]     = useState('Beginner');
  const [goals,     setGoals]     = useState<string[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{ loadProfile(); },[]);

  const loadProfile = async () => {
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase.from('profiles').select('*').eq('id',user.id).single();
      if (data) {
        setFullName(data.full_name ?? '');
        setBio(data.bio ?? '');
        setLevel(data.level ?? 'Beginner');
        setGoals(data.goals ?? []);
      } else {
        setFullName(user.user_metadata?.full_name ?? '');
      }
    } catch {}
    setLoading(false);
  };

  const save = async () => {
    if (!fullName.trim()) { Alert.alert('Error','Full name is required.'); return; }
    setSaving(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id, full_name:fullName.trim(),
          bio:bio.trim(), level, goals, updated_at:new Date().toISOString(),
        });
        await supabase.auth.updateUser({ data:{ full_name:fullName.trim() } });
      }
      Alert.alert('Saved!','Your profile has been updated.',[
        { text:'OK', onPress:()=>navigation.goBack() }
      ]);
    } catch {
      Alert.alert('Error','Could not save. Try again.');
    }
    setSaving(false);
  };

  const toggleGoal = (g:string) => setGoals(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev,g]);

  if (loading) return (
    <View style={[s.root,{alignItems:'center',justifyContent:'center'}]}>
      <ActivityIndicator size="large" color={C.primary}/>
    </View>
  );

  const initials = fullName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'V';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator color={C.primary} size="small"/>
              : <Text style={s.saveBtn}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <LinearGradient colors={['#1565FF','#7C3AED']} style={s.avatarGrad}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </LinearGradient>
          <TouchableOpacity style={s.changePhotoBtn}>
            <Text style={s.changePhotoTxt}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Basic info */}
        <Text style={s.sectionTitle}>Basic Information</Text>
        <View style={s.card}>
          <View style={s.fieldWrap}>
            <Text style={s.label}>FULL NAME</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={17} color={C.hint} style={{marginRight:10}}/>
              <TextInput style={s.input} value={fullName} onChangeText={setFullName}
                placeholder="Your full name" placeholderTextColor={C.hint} autoCapitalize="words"/>
            </View>
          </View>
          <View style={s.divider}/>
          <View style={s.fieldWrap}>
            <Text style={s.label}>EMAIL</Text>
            <View style={[s.inputWrap,{opacity:0.5}]}>
              <Ionicons name="mail-outline" size={17} color={C.hint} style={{marginRight:10}}/>
              <TextInput style={s.input} value={email} editable={false} placeholderTextColor={C.hint}/>
            </View>
            <Text style={s.fieldNote}>Email cannot be changed here</Text>
          </View>
          <View style={s.divider}/>
          <View style={s.fieldWrap}>
            <Text style={s.label}>BIO</Text>
            <View style={[s.inputWrap,{height:80,alignItems:'flex-start',paddingTop:12}]}>
              <TextInput style={[s.input,{height:56}]} value={bio} onChangeText={setBio}
                placeholder="Tell us about yourself..." placeholderTextColor={C.hint}
                multiline numberOfLines={3} maxLength={150}/>
            </View>
            <Text style={s.fieldNote}>{bio.length}/150</Text>
          </View>
        </View>

        {/* Level */}
        <Text style={s.sectionTitle}>Speaking Level</Text>
        <View style={s.levelRow}>
          {LEVELS.map(l=>(
            <TouchableOpacity key={l} style={[s.levelCard, level===l&&s.levelCardActive]} onPress={()=>setLevel(l)}>
              <Text style={[s.levelTxt, level===l&&s.levelTxtActive]}>{l}</Text>
              {level===l&&<Ionicons name="checkmark-circle" size={16} color={C.green}/>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals */}
        <Text style={s.sectionTitle}>My Goals</Text>
        <View style={s.goalsWrap}>
          {GOALS.map(g=>{
            const active = goals.includes(g);
            return (
              <TouchableOpacity key={g} style={[s.goalChip, active&&s.goalChipActive]} onPress={()=>toggleGoal(g)}>
                {active&&<Ionicons name="checkmark" size={13} color={C.primary}/>}
                <Text style={[s.goalTxt, active&&s.goalTxtActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save button */}
        <TouchableOpacity style={s.primaryBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
          <LinearGradient colors={['#1565FF','#0D47A1']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primaryBtnGrad}>
            {saving ? <ActivityIndicator color="#fff"/> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff"/>
                <Text style={s.primaryBtnTxt}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           {flex:1,backgroundColor:C.bg},
  headerBg:       {paddingBottom:20},
  header:         {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:        {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:    {fontSize:17,fontWeight:'700',color:C.text},
  saveBtn:        {fontSize:15,fontWeight:'600',color:C.primary},
  avatarSection:  {alignItems:'center',gap:10},
  avatarGrad:     {width:80,height:80,borderRadius:24,alignItems:'center',justifyContent:'center'},
  avatarTxt:      {fontSize:28,fontWeight:'800',color:'#fff'},
  changePhotoBtn: {backgroundColor:'rgba(21,101,255,0.15)',borderRadius:12,paddingHorizontal:14,paddingVertical:6},
  changePhotoTxt: {fontSize:13,color:C.accent,fontWeight:'500'},
  scroll:         {paddingHorizontal:20,paddingTop:16},
  sectionTitle:   {fontSize:12,fontWeight:'700',color:C.hint,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,marginTop:20},
  card:           {backgroundColor:C.bgCard,borderRadius:18,padding:16,borderWidth:1,borderColor:C.border},
  fieldWrap:      {gap:8},
  label:          {fontSize:11,fontWeight:'600',color:C.muted,letterSpacing:0.8},
  inputWrap:      {flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderRadius:12,paddingHorizontal:14,height:48,borderWidth:1,borderColor:C.border},
  input:          {flex:1,color:C.text,fontSize:14},
  fieldNote:      {fontSize:11,color:C.hint},
  divider:        {height:1,backgroundColor:C.border,marginVertical:12},
  levelRow:       {flexDirection:'row',flexWrap:'wrap',gap:8},
  levelCard:      {paddingHorizontal:16,paddingVertical:10,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.bgCard,flexDirection:'row',alignItems:'center',gap:6},
  levelCardActive:{borderColor:'rgba(34,197,94,0.5)',backgroundColor:'rgba(34,197,94,0.08)'},
  levelTxt:       {fontSize:13,color:C.muted,fontWeight:'500'},
  levelTxtActive: {color:C.green},
  goalsWrap:      {flexDirection:'row',flexWrap:'wrap',gap:8},
  goalChip:       {flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:14,paddingVertical:9,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.bgCard},
  goalChipActive: {borderColor:'rgba(21,101,255,0.5)',backgroundColor:'rgba(21,101,255,0.10)'},
  goalTxt:        {fontSize:13,color:C.muted},
  goalTxtActive:  {color:C.primary,fontWeight:'500'},
  primaryBtn:     {borderRadius:16,overflow:'hidden',marginTop:24},
  primaryBtnGrad: {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  primaryBtnTxt:  {fontSize:16,fontWeight:'700',color:'#fff'},
});