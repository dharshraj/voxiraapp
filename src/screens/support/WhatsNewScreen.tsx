import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { WHATS_NEW_ITEMS } from '../../services/mockData';

export default function WhatsNewScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue:1, duration:400, useNativeDriver:true }).start(); }, []);

  const s = StyleSheet.create({
    root:     { flex:1, backgroundColor:C.bg },
    header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='ios'?52:32, paddingBottom:14, gap:10 },
    backBtn:  { width:38, height:38, borderRadius:10, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
    title:    { flex:1, fontSize:18, fontWeight:'700', color:C.text },
    divider:  { height:1, backgroundColor:C.border, marginHorizontal:20, marginBottom:16 },
    scroll:   { flexGrow:1, paddingHorizontal:20, paddingBottom:120 },
    verCard:  { backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:16, marginBottom:12 },
    verTop:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
    verBadge: { backgroundColor:C.primaryLight, borderRadius:20, paddingHorizontal:12, paddingVertical:5 },
    verTxt:   { fontSize:13, fontWeight:'700', color:C.primary },
    verDate:  { fontSize:12, color:C.textMuted },
    item:     { flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:8 },
    itemDot:  { width:6, height:6, borderRadius:3, backgroundColor:C.primary, marginTop:7, flexShrink:0 },
    itemTxt:  { flex:1, fontSize:13, color:C.textSec, lineHeight:20 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.title}>What's New</Text>
      </View>
      <View style={s.divider} />
      <Animated.ScrollView
        style={[{ opacity:fade }, { flex: 1 }]}
        contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {WHATS_NEW_ITEMS.map((release, i) => (
          <View key={i} style={s.verCard}>
            <View style={s.verTop}>
              <View style={s.verBadge}><Text style={s.verTxt}>v{release.version}</Text></View>
              <Text style={s.verDate}>{release.date}</Text>
            </View>
            {release.items.map((item, j) => (
              <View key={j} style={s.item}>
                <View style={s.itemDot} />
                <Text style={s.itemTxt}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
