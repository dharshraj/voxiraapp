import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  accent: '#00CEC9',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252542',
  text: '#FFFFFF',
  textSecondary: '#B0B0CC',
  textMuted: '#6C6C8A',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#FF6B6B',
  border: '#2A2A45',
};

interface ToneMetric {
  label: string;
  value: number;
  color: string;
  icon: string;
}

interface ToneSuggestion {
  id: string;
  text: string;
  type: 'positive' | 'improve';
}

const toneMetrics: ToneMetric[] = [
  { label: 'Confidence', value: 78, color: '#6C5CE7', icon: 'shield-checkmark-outline' },
  { label: 'Formality', value: 65, color: '#00CEC9', icon: 'business-outline' },
  { label: 'Friendliness', value: 82, color: '#FDCB6E', icon: 'heart-outline' },
  { label: 'Clarity', value: 90, color: '#00B894', icon: 'eye-outline' },
  { label: 'Persuasiveness', value: 55, color: '#E17055', icon: 'megaphone-outline' },
  { label: 'Empathy', value: 72, color: '#74B9FF', icon: 'hand-left-outline' },
];

const suggestions: ToneSuggestion[] = [
  { id: '1', text: 'Your writing conveys warmth effectively. The friendly tone builds rapport with readers.', type: 'positive' },
  { id: '2', text: 'Consider using more assertive language in key claims to boost persuasiveness.', type: 'improve' },
  { id: '3', text: 'Excellent clarity — your sentences are well-structured and easy to follow.', type: 'positive' },
  { id: '4', text: 'The formality level varies between paragraphs. Choose a consistent register throughout.', type: 'improve' },
];

const ToneAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [inputText, setInputText] = useState(route.params?.text || '');
  const [analyzed, setAnalyzed] = useState(!!route.params?.text);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(toneMetrics.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (analyzed) animateBars();
  }, []);

  const animateBars = () => {
    toneMetrics.forEach((metric, i) => {
      Animated.timing(barAnims[i], {
        toValue: metric.value / 100,
        duration: 800,
        delay: 200 + i * 100,
        useNativeDriver: false,
      }).start();
    });
  };

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    barAnims.forEach(a => a.setValue(0));
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalyzed(true);
      animateBars();
    }, 1200);
  };

  const dominantTone = toneMetrics.reduce((a, b) => (a.value > b.value ? a : b));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tone Analysis</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Input */}
        {!analyzed && (
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste your text to analyze its tone..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.analyzeBtn, !inputText.trim() && { opacity: 0.4 }]}
              onPress={handleAnalyze}
              disabled={!inputText.trim()}
            >
              <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.analyzeBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="pulse-outline" size={20} color="#FFF" />
                <Text style={styles.analyzeBtnText}>Analyze Tone</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingPulse}>
              <Ionicons name="pulse" size={40} color={COLORS.primaryLight} />
            </Animated.View>
            <Text style={styles.loadingText}>Analyzing writing tone...</Text>
          </View>
        )}

        {analyzed && !isAnalyzing && (
          <>
            {/* Dominant Tone Card */}
            <View style={styles.dominantCard}>
              <LinearGradient
                colors={[dominantTone.color, dominantTone.color + 'AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dominantGradient}
              >
                <Ionicons name={dominantTone.icon as any} size={32} color="#FFF" />
                <View style={styles.dominantInfo}>
                  <Text style={styles.dominantLabel}>Dominant Tone</Text>
                  <Text style={styles.dominantValue}>{dominantTone.label}</Text>
                  <Text style={styles.dominantScore}>{dominantTone.value}% strength</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Tone Bars */}
            <View style={styles.metricsSection}>
              <Text style={styles.sectionTitle}>Tone Breakdown</Text>
              {toneMetrics.map((metric, index) => (
                <View key={metric.label} style={styles.metricRow}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIconContainer, { backgroundColor: metric.color + '20' }]}>
                      <Ionicons name={metric.icon as any} size={16} color={metric.color} />
                    </View>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}%</Text>
                  </View>
                  <View style={styles.metricBarBg}>
                    <Animated.View
                      style={[
                        styles.metricBarFill,
                        {
                          backgroundColor: metric.color,
                          width: barAnims[index].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Suggestions */}
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Insights & Suggestions</Text>
              {suggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  <View style={[styles.suggestionIcon, { backgroundColor: suggestion.type === 'positive' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                    <Ionicons
                      name={suggestion.type === 'positive' ? 'thumbs-up-outline' : 'bulb-outline'}
                      size={18}
                      color={suggestion.type === 'positive' ? COLORS.success : COLORS.warning}
                    />
                  </View>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </View>
              ))}
            </View>

            {/* Re-analyze */}
            <TouchableOpacity
              style={styles.reanalyzeButton}
              onPress={() => { setAnalyzed(false); }}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.primaryLight} />
              <Text style={styles.reanalyzeText}>Analyze Different Text</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  inputSection: { paddingHorizontal: 20, marginTop: 10 },
  textInput: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, fontSize: 15, color: COLORS.text, lineHeight: 22, minHeight: 160, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  analyzeBtn: { borderRadius: 14, overflow: 'hidden' },
  analyzeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingPulse: { marginBottom: 16 },
  loadingText: { fontSize: 15, color: COLORS.textSecondary },
  dominantCard: { marginHorizontal: 20, marginBottom: 24 },
  dominantGradient: { borderRadius: 18, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  dominantInfo: { flex: 1 },
  dominantLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  dominantValue: { fontSize: 28, fontWeight: '800', color: '#FFF', marginTop: 4 },
  dominantScore: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  metricsSection: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  metricRow: { marginBottom: 16 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metricIconContainer: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  metricLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  metricValue: { fontSize: 15, fontWeight: '700' },
  metricBarBg: { height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 4 },
  suggestionsSection: { paddingHorizontal: 20, marginBottom: 24 },
  suggestionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  suggestionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  suggestionText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  reanalyzeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary + '40' },
  reanalyzeText: { fontSize: 15, fontWeight: '600', color: COLORS.primaryLight },
});

export default ToneAnalysisScreen;
