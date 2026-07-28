import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { findTopic, TopicContent } from '../../content/topicContent';

export default function TopicDetailScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();
  const query: string = route?.params?.query ?? '';
  const topic: TopicContent | null = findTopic(query);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const s = StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg, ...(Platform.OS === 'web' && { height: '100%' as any }) },
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 12 },
    backBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, numberOfLines: 1 } as any,
    divider:     { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },
    scroll:      { paddingHorizontal: 20, paddingBottom: 80 },

    // Hero card
    heroCard:    { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
    heroIcon:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    heroText:    { flex: 1 },
    heroTitle:   { fontSize: 19, fontWeight: '800', color: C.text, marginBottom: 3 },
    heroSub:     { fontSize: 13, color: C.textSec, lineHeight: 19 },
    heroBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    heroBadgeTxt:{ fontSize: 11, color: C.textMuted },

    // Section
    sectionCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
    secHeading:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8 },
    secBody:     { fontSize: 14, color: C.textSec, lineHeight: 22 },
    bulletWrap:  { marginTop: 10, gap: 8 },
    bulletRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    bulletDot:   { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
    bulletTxt:   { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 21 },

    // 404 state
    notFound:    { alignItems: 'center', paddingTop: 80, gap: 12 },
    nfTitle:     { fontSize: 18, fontWeight: '700', color: C.text },
    nfSub:       { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24 },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{topic?.title ?? query}</Text>
      </View>
      <View style={s.divider} />

      {!topic ? (
        <View style={s.notFound}>
          <Ionicons name="document-text-outline" size={48} color={C.textMuted} />
          <Text style={s.nfTitle}>Content not found</Text>
          <Text style={s.nfSub}>No article found for "{query}". Try searching for a different topic.</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={[{ opacity: fade }, Platform.OS === 'web' && ({ height: '100%', overflowY: 'auto' } as any)]}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={s.heroCard}>
            <View style={[s.heroIcon, { backgroundColor: topic.color + '18' }]}>
              <Ionicons name={topic.icon as any} size={26} color={topic.color} />
            </View>
            <View style={s.heroText}>
              <Text style={s.heroTitle}>{topic.title}</Text>
              <Text style={s.heroSub}>{topic.subtitle}</Text>
              <View style={s.heroBadge}>
                <Ionicons name="time-outline" size={12} color={C.textMuted} />
                <Text style={s.heroBadgeTxt}>{topic.readTime}</Text>
              </View>
            </View>
          </View>

          {/* Sections */}
          {topic.sections.map((sec, i) => (
            <View key={i} style={s.sectionCard}>
              <Text style={s.secHeading}>{sec.heading}</Text>
              <Text style={s.secBody}>{sec.body}</Text>
              {sec.bullets && (
                <View style={s.bulletWrap}>
                  {sec.bullets.map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <View style={[s.bulletDot, { backgroundColor: topic.color }]} />
                      <Text style={s.bulletTxt}>{b}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Animated.ScrollView>
      )}
    </View>
  );
}
