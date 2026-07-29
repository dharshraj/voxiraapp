import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

const PLAN = [
  { day: 'Day 1-2', task: 'Record 2-minute speeches daily. Count your filler words each time and note your WPM.' },
  { day: 'Day 3-4', task: 'Practice the PAUSE technique. Every time you feel a filler coming, pause for 1 second instead.' },
  { day: 'Day 5-6', task: 'Read aloud for 10 minutes. Focus on clear enunciation of every syllable and consonant.' },
  { day: 'Day 7',   task: 'Record a 3-minute speech on any topic and compare it with your Day 1 recording.' },
];

export default function SevenDayPlanScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};

  return (
    <BaseResultScreen stepIndex={8} navigation={navigation} params={p}>
      <View style={s.planCard}>
        <Text style={s.planTitle}>Your 7-Day Improvement Plan</Text>
        {PLAN.map((item, i) => (
          <View key={i} style={s.planRow}>
            <View style={s.planDayBadge}><Text style={s.planDay}>{item.day}</Text></View>
            <Text style={s.planTask}>{item.task}</Text>
          </View>
        ))}
      </View>
    </BaseResultScreen>
  );
}
