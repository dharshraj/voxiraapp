import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

export default function ScoreBreakdownScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const details = p.details ?? { clarity: 0, pace: 0, pronunciation: 0, confidence: 0 };

  const METRICS = [
    { label: 'Clarity',       value: details.clarity,       icon: 'eye-outline',        color: '#A78BFA' },
    { label: 'Pace',          value: details.pace,          icon: 'speedometer-outline', color: '#06B6D4' },
    { label: 'Pronunciation', value: details.pronunciation, icon: 'volume-high-outline', color: '#10B981' },
    { label: 'Confidence',    value: details.confidence,    icon: 'trending-up-outline', color: '#F59E0B' },
  ];

  return (
    <BaseResultScreen stepIndex={2} navigation={navigation} params={p}>
      <Text style={s.sectionTitle}>Score Breakdown</Text>
      <View style={s.metricsGrid}>
        {METRICS.map((m, i) => (
          <View key={i} style={s.metricCard}>
            <View style={[s.metricIcon, { backgroundColor: `${m.color}18` }]}>
              <Ionicons name={m.icon as any} size={18} color={m.color} />
            </View>
            <Text style={s.metricLabel}>{m.label}</Text>
            <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
            <View style={s.metricBarBg}>
              <View style={[s.metricBarFill, { width: `${m.value}%` as any, backgroundColor: m.color }]} />
            </View>
          </View>
        ))}
      </View>
    </BaseResultScreen>
  );
}
