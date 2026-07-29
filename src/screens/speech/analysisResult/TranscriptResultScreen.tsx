import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import BaseResultScreen from './BaseResultScreen';
import { makeSharedStyles, formatTime } from './shared';

export default function TranscriptResultScreen({ navigation, route }: any) {
  const { colors: C } = useTheme();
  const s = makeSharedStyles(C);
  const p = route?.params ?? {};
  const { transcript = '', duration = 0, wpm = 0, persistError = '' } = p;

  return (
    <BaseResultScreen stepIndex={0} navigation={navigation} params={p}>
      {!!persistError && (
        <View style={s.warnBanner}>
          <Ionicons name="warning-outline" size={16} color={C.warning} />
          <Text style={s.warnTxt}>Result shown but not saved — {persistError}</Text>
        </View>
      )}
      {transcript && transcript.length > 10 ? (
        <View style={s.transcriptCard}>
          <View style={s.transcriptHeader}>
            <Ionicons name="document-text-outline" size={16} color="#78350F" />
            <Text style={s.transcriptTitle}>Your Transcript</Text>
          </View>
          <Text style={s.transcriptText}>{transcript}</Text>
          <Text style={s.transcriptMeta}>
            {transcript.trim().split(/\s+/).filter(Boolean).length} words · {formatTime(duration)}{wpm > 0 ? ` · ${wpm} WPM` : ''}
          </Text>
        </View>
      ) : (
        <View style={s.emptyStep}>
          <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyStepTxt}>No transcript captured for this session.</Text>
        </View>
      )}
    </BaseResultScreen>
  );
}
