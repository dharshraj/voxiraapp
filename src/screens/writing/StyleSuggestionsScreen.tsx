import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

interface StyleSuggestion {
  id: string;
  category: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  before: string;
  after: string;
  impact: 'high' | 'medium' | 'low';
  applied: boolean;
}

const mockSuggestions: StyleSuggestion[] = [
  {
    id: '1', category: 'Sentence Variety', icon: 'swap-horizontal-outline', color: '#6C5CE7',
    title: 'Vary sentence length',
    description: 'Your text has 5 consecutive sentences of similar length (18-22 words). Mix short punchy sentences with longer ones.',
    before: 'The project was completed on time. The team worked very hard. The results were satisfactory.',
    after: 'The project landed on time. Despite tight deadlines and shifting requirements, the team delivered — and the results exceeded expectations.',
    impact: 'high', applied: false,
  },
  {
    id: '2', category: 'Active Voice', icon: 'flash-outline', color: '#00CEC9',
    title: 'Switch to active voice',
    description: 'Passive constructions weaken your message. Restructure for directness.',
    before: 'The decision was made by the committee to postpone the event.',
    after: 'The committee decided to postpone the event.',
    impact: 'high', applied: false,
  },
  {
    id: '3', category: 'Conciseness', icon: 'contract-outline', color: '#E17055',
    title: 'Remove filler phrases',
    description: 'Phrases like "it is important to note that" and "as a matter of fact" add no meaning.',
    before: 'It is important to note that our revenue has increased significantly.',
    after: 'Our revenue has increased significantly.',
    impact: 'medium', applied: false,
  },
  {
    id: '4', category: 'Word Choice', icon: 'text-outline', color: '#FDCB6E',
    title: 'Use stronger verbs',
    description: 'Replace "get", "make", "do" with more specific alternatives when possible.',
    before: 'We need to get better results and make improvements.',
    after: 'We need to achieve stronger results and implement improvements.',
    impact: 'medium', applied: false,
  },
  {
    id: '5', category: 'Transitions', icon: 'link-outline', color: '#74B9FF',
    title: 'Add transitional phrases',
    description: 'Your paragraphs shift topics abruptly. Use connectors to guide the reader.',
    before: 'Sales grew 20% last quarter. Customer satisfaction dropped.',
    after: 'Sales grew 20% last quarter. However, customer satisfaction dropped — suggesting growth came at a cost.',
    impact: 'low', applied: false,
  },
];

const StyleSuggestionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Style Suggestions</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Score Summary */}
        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{suggestions.length}</Text>
              <Text style={styles.summaryLabel}>Suggestions</Text>
            </View>
            <View style={[styles.summaryDivider]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{appliedCount}</Text>
              <Text style={styles.summaryLabel}>Applied</Text>
            </View>
            <View style={[styles.summaryDivider]} />
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
});

export default StyleSuggestionsScreen;

