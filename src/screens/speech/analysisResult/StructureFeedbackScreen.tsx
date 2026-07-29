import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles } from './shared';

export default function StructureFeedbackScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const structureFeedback: string = p.aiAnalysis?.structureFeedback ?? '';

  return (
    <BaseResultScreen stepIndex={7} navigation={navigation} params={p}>
      {structureFeedback ? (
        <View style={s.structureCard}>
          <Ionicons name="git-branch-outline" size={16} color={C.success} style={{ marginBottom: 6 }} />
          <Text style={s.structureTitle}>Structure Feedback</Text>
          <Text style={s.structureText}>{structureFeedback}</Text>
        </View>
      ) : (
        <View style={s.emptyStep}>
          <Ionicons name="git-branch-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyStepTxt}>No structure feedback available for this session.</Text>
        </View>
      )}
    </BaseResultScreen>
  );
}
