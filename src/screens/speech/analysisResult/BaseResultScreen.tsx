import React, { useRef, useEffect, useState } from 'react';
import { View, ScrollView, Animated, StatusBar, Platform, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import {
  STEP_TITLES, StepIndicator, NavRow, ScoreSummaryBar,
  makeSharedStyles,
} from './shared';

interface Props {
  stepIndex: number;
  navigation: any;
  params: any;
  children: React.ReactNode;
}

export default function BaseResultScreen({ stepIndex, navigation, params, children }: Props) {
  const { colors: C, isDark } = useTheme();
  const s = makeSharedStyles(C);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const score = params?.score ?? 0;

  useEffect(() => {
    fadeAnim.setValue(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    // Animate score counter only on first step
    if (stepIndex === 0) {
      let current = 0;
      const iv = setInterval(() => {
        current += Math.ceil(score / 30);
        if (current >= score) { current = score; clearInterval(iv); }
        setDisplayScore(current);
      }, 40);
      return () => clearInterval(iv);
    } else {
      setDisplayScore(score);
    }
  }, [stepIndex]);

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('SpeechHome')} activeOpacity={0.75}>
          <Ionicons name="home-outline" size={20} color={C.textSec} />
        </TouchableOpacity>
        <Text style={s.stepTitle}>{STEP_TITLES[stepIndex]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <StepIndicator stepIndex={stepIndex} C={C} />

      <Animated.ScrollView
        ref={scrollRef}
        style={[{ opacity: fadeAnim }, { flex: 1 }]}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Score summary bar shown on every screen */}
        <ScoreSummaryBar
          score={score}
          displayScore={displayScore}
          mode={params?.mode ?? 'Free Speech'}
          duration={params?.duration ?? 0}
          wpm={params?.wpm ?? 0}
          fillerCount={params?.fillerCount ?? 0}
          C={C}
          s={s}
        />

        {/* Screen-specific content */}
        {children}

        <NavRow
          stepIndex={stepIndex}
          navigation={navigation}
          params={params}
          mode={params?.mode ?? 'Free Speech'}
          s={s}
        />
        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}
