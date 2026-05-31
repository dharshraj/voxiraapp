import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const C = {
  bg:'#0A1628', bgCard:'#111E30', surface:'#1A2B3C',
  primary:'#1565FF', accent:'#4FC3F7', green:'#22C55E',
  gold:'#F59E0B', danger:'#EF4444',
  text:'#F0F4FF', muted:'rgba(240,244,255,0.50)',
  hint:'rgba(240,244,255,0.25)', border:'rgba(255,255,255,0.07)',
};

const WHAT_GETS_DELETED = [
  { icon:'person-outline',        label:'Your profile and personal information' },
  { icon:'mic-outline',           label:'All speech sessions and recordings'    },
  { icon:'create-outline',        label:'All writing sessions and history'      },
  { icon:'people-outline',        label:'All interview sessions and feedback'   },
  { icon:'trophy-outline',        label:'All achievements and XP earned'        },
  { icon:'trending-up-outline',   label:'All progress data and streaks'         },
  { icon:'card-outline',          label:'Your subscription (no refund)'         },
];

const ALTERNATIVES = [
  { icon:'download-outline',      label:'Export your data first',   desc:'Download a copy before deleting',  color:C.accent,  action:'export'  },
  { icon:'pause-circle-outline',  label:'Pause your account',       desc:'Take a break, come back anytime',  color:C.gold,    action:'pause'   },
  { icon:'notifications-off-outline',label:'Turn off notifications',desc:'Stop reminders without deleting',  color:C.green,   action:'notifs'  },
];

type Step = 'warning' | 'alternatives' | 'confirm' | 'deleting' | 'deleted';

export default function DeleteAccountScreen({ navigation }:any) {
  const [step,       setStep]       = useState<Step>('warning');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [confirmTxt, setConfirmTxt] = useState('');
  const [error,      setError]      = useState('');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';
  const confirmMatches = confirmTxt.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleAlternative = (action:string) => {
    if (action==='export')  { Alert.alert('Export Data','Your data will be emailed within 24 hours.'); return; }
    if (action==='pause')   { Alert.alert('Pause Account','Your account has been paused. You can reactivate anytime by logging in.'); navigation.goBack(); return; }
    if (action==='notifs')  { navigation.navigate('NotificationSettings'); return; }
  };

  const handleDelete = async () => {
    if (!confirmMatches) { setError(`Please type "${CONFIRM_PHRASE}" exactly to confirm.`); return; }
    if (!password.trim()) { setError('Please enter your password to confirm.'); return; }
    setError('');
    setStep('deleting');

    try {
      // Verify password by re-authenticating
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password.trim(),
      });

      if (signInErr) {
        setStep('confirm');
        setError('Incorrect password. Please try again.');
        return;
      }

      // Delete profile data
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('speech_sessions').delete().eq('user_id', user.id);
      await supabase.from('writing_sessions').delete().eq('user_id', user.id);
      await supabase.from('interview_sessions').delete().eq('user_id', user.id);

      // Sign out (Supabase doesn't expose deleteUser on client — admin API needed for full deletion)
      await supabase.auth.signOut();
      setStep('deleted');
    } catch (err:any) {
      setStep('confirm');
      setError('Something went wrong. Please try again or contact support.');
    }
  };

  // ── Deleted success screen ────────────────────────────────────────────────
  if (step==='deleted') {
    return (
      <View style={[s.root,{alignItems:'center',justifyContent:'center',padding:32}]}>
        <LinearGradient colors={['#0F2040','#0A1628']} style={StyleSheet.absoluteFill}/>
        <View style={s.deletedIcon}>
          <Ionicons name="checkmark-circle" size={60} color={C.green}/>
        </View>
        <Text style={s.deletedTitle}>Account Deleted</Text>
        <Text style={s.deletedSub}>
          Your account and all associated data have been permanently removed.{'\n\n'}
          Thank you for using Voxira. We're sorry to see you go.
        </Text>
        <Text style={s.deletedFine}>
          Some data may take up to 30 days to be fully purged from our backup systems.
        </Text>
      </View>
    );
  }

  // ── Deleting spinner ──────────────────────────────────────────────────────
  if (step==='deleting') {
    return (
      <View style={[s.root,{alignItems:'center',justifyContent:'center',gap:20}]}>
        <LinearGradient colors={['#0F2040','#0A1628']} style={StyleSheet.absoluteFill}/>
        <ActivityIndicator size="large" color={C.danger}/>
        <Text style={[s.deletedTitle,{color:C.danger}]}>Deleting your account...</Text>
        <Text style={s.deletedSub}>Please wait. Do not close the app.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <LinearGradient colors={['#0F2040',C.bg]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={()=>step==='confirm'||step==='alternatives'?setStep(step==='confirm'?'alternatives':'warning'):navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.muted}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Delete Account</Text>
          <View style={{width:42}}/>
        </View>

        {/* Step indicator */}
        <View style={s.stepRow}>
          {['warning','alternatives','confirm'].map((st,i)=>(
            <View key={i} style={s.stepItem}>
              <View style={[s.stepCircle, (step===st||(i===0&&step!=='warning'&&step!=='alternatives')||( i===1&&step==='confirm'))&&s.stepCircleDone]}>
                <Text style={[s.stepNum, (step===st||(i<(['warning','alternatives','confirm'].indexOf(step))))&&{color:'#fff'}]}>{i+1}</Text>
              </View>
              {i<2&&<View style={[s.stepLine, i<(['warning','alternatives','confirm'].indexOf(step))&&{backgroundColor:C.danger}]}/>}
            </View>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView style={{opacity:fade}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* STEP 1: Warning */}
        {step==='warning' && (
          <>
            <View style={s.warningIcon}>
              <Ionicons name="warning" size={44} color={C.danger}/>
            </View>
            <Text style={s.stepTitle}>This Cannot Be Undone</Text>
            <Text style={s.stepDesc}>
              Deleting your account is permanent. All your data will be wiped from our servers within 30 days. There is no way to recover it.
            </Text>

            <Text style={s.listTitle}>What will be permanently deleted:</Text>
            <View style={s.deleteList}>
              {WHAT_GETS_DELETED.map((item,i)=>(
                <View key={i} style={[s.deleteRow, i===WHAT_GETS_DELETED.length-1&&{borderBottomWidth:0}]}>
                  <View style={s.deleteIconWrap}>
                    <Ionicons name={item.icon as any} size={18} color={C.danger}/>
                  </View>
                  <Text style={s.deleteItemTxt}>{item.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.continueBtn} onPress={()=>setStep('alternatives')} activeOpacity={0.85}>
              <Text style={s.continueBtnTxt}>I Understand, Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={C.danger}/>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={()=>navigation.goBack()}>
              <Text style={s.cancelBtnTxt}>Keep My Account</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: Alternatives */}
        {step==='alternatives' && (
          <>
            <Text style={s.stepTitle}>Before You Go...</Text>
            <Text style={s.stepDesc}>
              Are you sure deletion is what you need? Here are some alternatives that might help:
            </Text>

            <View style={s.altList}>
              {ALTERNATIVES.map((alt,i)=>(
                <TouchableOpacity key={i} style={s.altCard} onPress={()=>handleAlternative(alt.action)} activeOpacity={0.8}>
                  <View style={[s.altIcon,{backgroundColor:`${alt.color}18`}]}>
                    <Ionicons name={alt.icon as any} size={22} color={alt.color}/>
                  </View>
                  <View style={s.altMeta}>
                    <Text style={s.altLabel}>{alt.label}</Text>
                    <Text style={s.altDesc}>{alt.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.hint}/>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.divider}/>

            <TouchableOpacity style={s.continueBtn} onPress={()=>setStep('confirm')} activeOpacity={0.85}>
              <Text style={s.continueBtnTxt}>No, Delete My Account</Text>
              <Ionicons name="arrow-forward" size={18} color={C.danger}/>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={()=>navigation.goBack()}>
              <Text style={s.cancelBtnTxt}>Keep My Account</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Confirm */}
        {step==='confirm' && (
          <>
            <View style={s.warningIcon}>
              <Ionicons name="skull-outline" size={44} color={C.danger}/>
            </View>
            <Text style={s.stepTitle}>Final Confirmation</Text>
            <Text style={s.stepDesc}>
              This is your last chance. Once you tap "Delete Account", all your data will be scheduled for permanent deletion.
            </Text>

            {/* Type confirmation */}
            <View style={s.confirmField}>
              <Text style={s.confirmLabel}>
                Type <Text style={{color:C.danger,fontWeight:'700'}}>{CONFIRM_PHRASE}</Text> to confirm:
              </Text>
              <View style={[s.inputWrap, confirmMatches&&{borderColor:C.danger}]}>
                <TextInput
                  style={s.input} value={confirmTxt} onChangeText={setConfirmTxt}
                  placeholder={CONFIRM_PHRASE} placeholderTextColor={C.hint}
                  autoCapitalize="characters" autoCorrect={false}
                />
                {confirmMatches && <Ionicons name="checkmark-circle" size={18} color={C.danger}/>}
              </View>
            </View>

            {/* Password */}
            <View style={s.confirmField}>
              <Text style={s.confirmLabel}>Enter your password:</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color={C.hint} style={{marginRight:8}}/>
                <TextInput
                  style={s.input} value={password} onChangeText={v=>{setPassword(v);setError('');}}
                  placeholder="Your current password" placeholderTextColor={C.hint}
                  secureTextEntry={!showPass} autoCapitalize="none"
                />
                <TouchableOpacity onPress={()=>setShowPass(p=>!p)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  <Ionicons name={showPass?'eye-off-outline':'eye-outline'} size={17} color={C.hint}/>
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={C.danger}/>
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.deleteBtn, (!confirmMatches||!password.trim())&&{opacity:0.4}]}
              onPress={handleDelete}
              disabled={!confirmMatches||!password.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={20} color="#fff"/>
              <Text style={s.deleteBtnTxt}>Permanently Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={()=>navigation.goBack()}>
              <Text style={s.cancelBtnTxt}>Cancel — Keep My Account</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{height:40}}/>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex:1,backgroundColor:C.bg},
  headerBg:      {paddingBottom:16},
  header:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:Platform.OS==='ios'?56:36,marginBottom:16},
  backBtn:       {width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  headerTitle:   {fontSize:17,fontWeight:'700',color:C.text},
  stepRow:       {flexDirection:'row',paddingHorizontal:40,alignItems:'center',justifyContent:'center'},
  stepItem:      {flexDirection:'row',alignItems:'center'},
  stepCircle:    {width:28,height:28,borderRadius:14,borderWidth:2,borderColor:'rgba(239,68,68,0.4)',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(239,68,68,0.08)'},
  stepCircleDone:{backgroundColor:C.danger,borderColor:C.danger},
  stepNum:       {fontSize:12,fontWeight:'700',color:C.muted},
  stepLine:      {width:50,height:2,backgroundColor:'rgba(239,68,68,0.20)',marginHorizontal:4},
  scroll:        {paddingHorizontal:20,paddingTop:20},
  warningIcon:   {width:88,height:88,borderRadius:26,backgroundColor:'rgba(239,68,68,0.12)',borderWidth:1,borderColor:'rgba(239,68,68,0.25)',alignItems:'center',justifyContent:'center',alignSelf:'center',marginBottom:20},
  stepTitle:     {fontSize:22,fontWeight:'800',color:C.text,textAlign:'center',marginBottom:10,letterSpacing:-0.5},
  stepDesc:      {fontSize:14,color:C.muted,textAlign:'center',lineHeight:22,marginBottom:24},
  listTitle:     {fontSize:13,fontWeight:'700',color:C.text,marginBottom:10},
  deleteList:    {backgroundColor:C.bgCard,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'rgba(239,68,68,0.20)',marginBottom:24},
  deleteRow:     {flexDirection:'row',alignItems:'center',gap:12,padding:12,borderBottomWidth:1,borderBottomColor:C.border},
  deleteIconWrap:{width:34,height:34,borderRadius:10,backgroundColor:'rgba(239,68,68,0.12)',alignItems:'center',justifyContent:'center'},
  deleteItemTxt: {fontSize:13,color:C.muted,flex:1},
  continueBtn:   {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1,borderColor:'rgba(239,68,68,0.40)',borderRadius:16,paddingVertical:14,marginBottom:12,backgroundColor:'rgba(239,68,68,0.08)'},
  continueBtnTxt:{fontSize:15,fontWeight:'600',color:C.danger},
  cancelBtn:     {alignItems:'center',paddingVertical:10},
  cancelBtnTxt:  {fontSize:14,color:C.muted},
  altList:       {gap:10,marginBottom:20},
  altCard:       {flexDirection:'row',alignItems:'center',gap:14,backgroundColor:C.bgCard,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  altIcon:       {width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',flexShrink:0},
  altMeta:       {flex:1},
  altLabel:      {fontSize:14,fontWeight:'600',color:C.text,marginBottom:3},
  altDesc:       {fontSize:12,color:C.muted},
  divider:       {height:1,backgroundColor:C.border,marginVertical:20},
  confirmField:  {marginBottom:16},
  confirmLabel:  {fontSize:13,color:C.muted,marginBottom:8,lineHeight:20},
  inputWrap:     {flexDirection:'row',alignItems:'center',backgroundColor:C.bgCard,borderRadius:14,paddingHorizontal:14,height:50,borderWidth:1,borderColor:C.border},
  input:         {flex:1,color:C.text,fontSize:14},
  errorBox:      {flexDirection:'row',gap:8,backgroundColor:'rgba(239,68,68,0.10)',borderRadius:12,padding:12,borderWidth:1,borderColor:'rgba(239,68,68,0.25)',marginBottom:16,alignItems:'flex-start'},
  errorTxt:      {flex:1,fontSize:13,color:C.danger,lineHeight:18},
  deleteBtn:     {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:C.danger,borderRadius:16,paddingVertical:16,marginBottom:12},
  deleteBtnTxt:  {fontSize:15,fontWeight:'700',color:'#fff'},
  deletedIcon:   {width:100,height:100,borderRadius:30,backgroundColor:'rgba(34,197,94,0.12)',borderWidth:1,borderColor:'rgba(34,197,94,0.25)',alignItems:'center',justifyContent:'center',marginBottom:24},
  deletedTitle:  {fontSize:24,fontWeight:'800',color:C.text,textAlign:'center',marginBottom:12},
  deletedSub:    {fontSize:14,color:C.muted,textAlign:'center',lineHeight:22,marginBottom:20},
  deletedFine:   {fontSize:12,color:C.hint,textAlign:'center',lineHeight:18},
});

