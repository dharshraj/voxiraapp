import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

// Fallback rephrasings generated from the transcript when AI returns none
function buildFallbackRephrasings(transcript: string): string[] {
  if (!transcript || transcript.length < 10) {
    return [
      'Try starting with a clear, direct statement of your main point.',
      'Structure your response: state your point, give one example, then summarise.',
    ];
  }
  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length === 0) {
    return [
      'Try starting with a clear, direct statement of your main point.',
      'Structure your response: state your point, give one example, then summarise.',
    ];
  }

  // Build simple rephrasings of the first two sentences
  const rephrasings: string[] = [];
  if (sentences[0]) {
    rephrasings.push(`Consider opening with: "To put it simply, ${sentences[0].toLowerCase()}"`);
  }
  if (sentences[1]) {
    rephrasings.push(`You could also frame this as: "The key point here is that ${sentences[1].toLowerCase()}"`);
  } else {
    rephrasings.push('Follow your opening with a concrete example or supporting fact to strengthen your argument.');
  }
  return rephrasings;
}

export default function SuggestedRephrasingsScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};

  const rawAlts: string[] = p.aiAnalysis?.alternateAnswers ?? [];
  // Filter out empty strings, then fall back if still empty
  const alts = rawAlts.filter(a => a && a.trim().length > 5).length > 0
    ? rawAlts.filter(a => a && a.trim().length > 5)
    : buildFallbackRephrasings(p.transcript ?? '');

  return (
    <BaseResultScreen stepIndex={5} navigation={navigation} params={p}>
      <Text style={s.sectionTitle}>Suggested Rephrasings</Text>
      {alts.map((alt, i) => (
        <View key={i} style={s.altCard}>
          <View style={s.altNum}><Text style={s.altNumTxt}>{i + 1}</Text></View>
          <Text style={s.altText}>{alt}</Text>
        </View>
      ))}
    </BaseResultScreen>
  );
}
