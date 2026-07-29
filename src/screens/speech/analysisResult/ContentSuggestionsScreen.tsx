import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

export default function ContentSuggestionsScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const suggestions: string[] = p.aiAnalysis?.contentSuggestions ?? [];

  return (
    <BaseResultScreen stepIndex={4} navigation={navigation} params={p}>
      {suggestions.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>Content-Specific Suggestions</Text>
          {suggestions.map((sug, i) => (
            <View key={i} style={s.contentSugCard}>
              <View style={s.contentSugIcon}>
                <Ionicons name="arrow-forward-outline" size={16} color="#92400E" />
              </View>
              <Text style={s.contentSugText}>{sug}</Text>
            </View>
          ))}
        </>
      ) : (
        <View style={s.emptyStep}>
          <Ionicons name="bulb-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyStepTxt}>No content-specific suggestions available for this session.</Text>
        </View>
      )}
    </BaseResultScreen>
  );
}
