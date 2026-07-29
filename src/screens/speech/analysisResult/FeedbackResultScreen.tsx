import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles, generateFeedback } from './shared';

export default function FeedbackResultScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const details = p.details ?? { clarity: 0, pace: 0, pronunciation: 0, confidence: 0 };
  const feedback = generateFeedback(p.fillerCount ?? 0, p.fillerBreakdown ?? {}, p.wpm ?? 0, details);

  return (
    <BaseResultScreen stepIndex={3} navigation={navigation} params={p}>
      <Text style={s.sectionTitle}>Feedback</Text>
      {feedback.map((fb, i) => (
        <View key={i} style={[s.feedbackCard, { borderLeftColor: fb.color, backgroundColor: `${fb.color}12` }]}>
          <View style={s.feedbackHeader}>
            <Ionicons name={fb.icon as any} size={18} color={fb.color} />
            <Text style={[s.feedbackTitle, { color: fb.color }]}>{fb.title}</Text>
          </View>
          <Text style={s.feedbackText}>{fb.text}</Text>
        </View>
      ))}
    </BaseResultScreen>
  );
}
