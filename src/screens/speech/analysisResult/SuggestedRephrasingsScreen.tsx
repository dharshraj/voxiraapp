import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

export default function SuggestedRephrasingsScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const alts: string[] = p.aiAnalysis?.alternateAnswers ?? [];

  return (
    <BaseResultScreen stepIndex={5} navigation={navigation} params={p}>
      {alts.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>Suggested Rephrasings</Text>
          {alts.map((alt, i) => (
            <View key={i} style={s.altCard}>
              <View style={s.altNum}><Text style={s.altNumTxt}>{i + 1}</Text></View>
              <Text style={s.altText}>{alt}</Text>
            </View>
          ))}
        </>
      ) : (
        <View style={s.emptyStep}>
          <Ionicons name="chatbubbles-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyStepTxt}>No rephrasing suggestions available for this session.</Text>
        </View>
      )}
    </BaseResultScreen>
  );
}
