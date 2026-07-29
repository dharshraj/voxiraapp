import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles, buildMergedFillers } from './shared';

export default function FillerWordBreakdownScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const fillerEntries = buildMergedFillers(p.fillerBreakdown ?? {}, p.aiAnalysis);

  return (
    <BaseResultScreen stepIndex={1} navigation={navigation} params={p}>
      {fillerEntries.length > 0 ? (
        <View style={s.fillerCard}>
          <Text style={s.fillerTitle}>Filler Word Breakdown</Text>
          <View style={s.fillerGrid}>
            {fillerEntries.map(([word, count]) => (
              <View key={word} style={s.fillerChip}>
                <Text style={s.fillerWord}>"{word}"</Text>
                <View style={s.fillerBadge}><Text style={s.fillerCount}>{count}×</Text></View>
              </View>
            ))}
          </View>
          <Text style={s.fillerNote}>
            These were found by scanning your actual transcript. Replacing each filler with a deliberate 1-second pause can improve your score by up to 2 points per occurrence.
          </Text>
        </View>
      ) : (
        <View style={[s.fillerCard, { alignItems: 'center' }]}>
          <View style={s.noFillerWrap}>
            <Ionicons name="checkmark-circle" size={40} color={C.success} />
            <Text style={s.noFillerTxt}>No filler words detected!</Text>
            <Text style={s.noFillerSub}>You spoke without any detectable filler words. This is a top-5% result.</Text>
          </View>
        </View>
      )}
    </BaseResultScreen>
  );
}
