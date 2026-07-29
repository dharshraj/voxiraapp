import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

export default function ImprovementTipsScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const tips: string[] = p.aiAnalysis?.improvementTips ?? [];

  return (
    <BaseResultScreen stepIndex={6} navigation={navigation} params={p}>
      {tips.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>Improvement Tips</Text>
          {tips.map((tip, i) => (
            <View key={i} style={s.tipCard}>
              <View style={s.tipNum}><Text style={s.tipNumTxt}>{i + 1}</Text></View>
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </>
      ) : (
        <View style={s.emptyStep}>
          <Ionicons name="trending-up-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyStepTxt}>No improvement tips available for this session.</Text>
        </View>
      )}
    </BaseResultScreen>
  );
}
