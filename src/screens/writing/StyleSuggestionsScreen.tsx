import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { generateStyleSuggestions, StyleSuggestion } from '../../lib/openai';

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


const StyleSuggestionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [inputText,   setInputText]   = useState<string>(route.params?.text ?? '');
  const [suggestions, setSuggestions] = useState<StyleSuggestion[]>([]);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [filter,      setFilter]      = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [analyzed,    setAnalyzed]    = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (route.params?.text) fetchSuggestions(route.params.text);
  }, []);

  const fetchSuggestions = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateStyleSuggestions(text.trim());
      setSuggestions(result);
      setExpandedId(result[0]?.id ?? null);
      setAnalyzed(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleApply = (id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, applied: !s.applied } : s));
  };

  const appliedCount = suggestions.filter(s => s.applied).length;
  const filteredSuggestions = filter === 'all' ? suggestions : suggestions.filter(s => s.impact === filter);

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return { color: COLORS.error, label: 'High Impact' };
      case 'medium': return { color: COLORS.warning, label: 'Medium' };
      default: return { color: COLORS.textMuted, label: 'Low' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={Platform.OS === 'web' ? ({ height: '100%', overflowY: 'auto' } as any) : undefined} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Style Suggestions</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Text Input — shown when not yet analyzed */}
        {!analyzed && !loading && (
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste your text to get AI style suggestions…"
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.analyzeBtn, !inputText.trim() && { opacity: 0.4 }]}
              onPress={() => fetchSuggestions(inputText)}
              disabled={!inputText.trim()}
            >
              <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.analyzeBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="sparkles-outline" size={20} color="#FFF" />
                <Text style={styles.analyzeBtnText}>Get Style Suggestions</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginBottom: 16 }} />
            <Text style={styles.loadingText}>Analyzing your writing style…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Score Summary + Filters + List */}
        {analyzed && !loading && (
          <>
            <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{suggestions.length}</Text>
                  <Text style={styles.summaryLabel}>Suggestions</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{appliedCount}</Text>
                  <Text style={styles.summaryLabel}>Applied</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: COLORS.error }]}>{suggestions.filter(s => s.impact === 'high').length}</Text>
                  <Text style={styles.summaryLabel}>High Impact</Text>
                </View>
              </View>
            </Animated.View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {(['all', 'high', 'medium', 'low'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, filter === f && styles.filterChipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Suggestions List */}
            <View style={styles.listSection}>
              {filteredSuggestions.map((suggestion) => {
            const isExpanded = expandedId === suggestion.id;
            const impactBadge = getImpactBadge(suggestion.impact);

            return (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[styles.suggestionCard, suggestion.applied && styles.suggestionCardApplied]}
                  onPress={() => setExpandedId(isExpanded ? null : suggestion.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: suggestion.color + '20' }]}>
                      <Ionicons name={suggestion.icon as any} size={18} color={suggestion.color} />
                    </View>
                    <View style={styles.suggestionHeaderText}>
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                      <View style={styles.suggestionMeta}>
                        <Text style={styles.categoryLabel}>{suggestion.category}</Text>
                        <View style={[styles.impactBadge, { backgroundColor: impactBadge.color + '20' }]}>
                          <Text style={[styles.impactText, { color: impactBadge.color }]}>{impactBadge.label}</Text>
                        </View>
                      </View>
                    </View>
                    {suggestion.applied && <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />}
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.descriptionText}>{suggestion.description}</Text>

                      <View style={styles.comparisonBox}>
                        <View style={styles.comparisonSection}>
                          <Text style={styles.comparisonLabel}>Before</Text>
                          <Text style={styles.comparisonBefore}>{suggestion.before}</Text>
                        </View>
                        <View style={styles.comparisonArrow}>
                          <Ionicons name="arrow-down" size={16} color={COLORS.accent} />
                        </View>
                        <View style={styles.comparisonSection}>
                          <Text style={[styles.comparisonLabel, { color: COLORS.success }]}>After</Text>
                          <Text style={styles.comparisonAfter}>{suggestion.after}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[styles.applyButton, suggestion.applied && styles.applyButtonUndo]}
                        onPress={() => toggleApply(suggestion.id)}
                      >
                        <Ionicons
                          name={suggestion.applied ? 'arrow-undo-outline' : 'checkmark-outline'}
                          size={18}
                          color="#FFF"
                        />
                        <Text style={styles.applyButtonText}>{suggestion.applied ? 'Undo' : 'Apply Suggestion'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            </View>

            <TouchableOpacity
              style={styles.reanalyzeBtn}
              onPress={() => { setAnalyzed(false); setSuggestions([]); }}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.primaryLight} />
              <Text style={styles.reanalyzeTxt}>Analyze Different Text</Text>
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
  summaryCard: { marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  filterScroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: '#FFF' },
  listSection: { paddingHorizontal: 20 },
  suggestionCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  suggestionCardApplied: { borderColor: COLORS.success + '40' },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  suggestionHeaderText: { flex: 1 },
  suggestionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  suggestionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  categoryLabel: { fontSize: 12, color: COLORS.textMuted },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  impactText: { fontSize: 11, fontWeight: '600' },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  descriptionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  comparisonBox: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, marginBottom: 16 },
  comparisonSection: { marginBottom: 4 },
  comparisonLabel: { fontSize: 11, fontWeight: '700', color: COLORS.error, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  comparisonBefore: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, textDecorationLine: 'line-through' },
  comparisonArrow: { alignItems: 'center', paddingVertical: 6 },
  comparisonAfter: { fontSize: 14, color: COLORS.success, lineHeight: 20, fontWeight: '500' },
  applyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10 },
  applyButtonUndo: { backgroundColor: COLORS.textMuted },
  applyButtonText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  inputSection:    { paddingHorizontal: 20, marginTop: 10, marginBottom: 8 },
  textInput:       { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, fontSize: 15, color: COLORS.text, lineHeight: 22, minHeight: 160, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  analyzeBtn:      { borderRadius: 14, overflow: 'hidden' },
  analyzeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  analyzeBtnText:  { fontSize: 16, fontWeight: '700', color: '#FFF' },
  loadingContainer:{ alignItems: 'center', paddingVertical: 60 },
  loadingText:     { fontSize: 15, color: COLORS.textSecondary },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,107,107,0.30)' },
  errorText:       { flex: 1, fontSize: 13, color: COLORS.error, lineHeight: 18 },
  reanalyzeBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary + '40' },
  reanalyzeTxt:    { fontSize: 15, fontWeight: '600', color: COLORS.primaryLight },
});

export default StyleSuggestionsScreen;

