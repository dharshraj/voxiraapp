 import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  accent: '#00CEC9',
  accentLight: '#81ECEC',
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

interface WeekDay {
  label: string;
  words: number;
  pieces: number;
}

interface SkillMetric {
  name: string;
  score: number;
  change: number;
  icon: string;
  color: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

const weekData: WeekDay[] = [
  { label: 'Mon', words: 820, pieces: 2 },
  { label: 'Tue', words: 1450, pieces: 3 },
  { label: 'Wed', words: 630, pieces: 1 },
  { label: 'Thu', words: 2100, pieces: 4 },
  { label: 'Fri', words: 980, pieces: 2 },
  { label: 'Sat', words: 350, pieces: 1 },
  { label: 'Sun', words: 1680, pieces: 3 },
];

const skillMetrics: SkillMetric[] = [
  { name: 'Grammar', score: 88, change: 4, icon: 'checkmark-circle-outline', color: COLORS.success },
  { name: 'Clarity', score: 82, change: 7, icon: 'eye-outline', color: COLORS.accent },
  { name: 'Tone Control', score: 76, change: -2, icon: 'pulse-outline', color: '#6C5CE7' },
  { name: 'Vocabulary', score: 71, change: 5, icon: 'book-outline', color: '#E17055' },
  { name: 'Structure', score: 85, change: 3, icon: 'layers-outline', color: '#74B9FF' },
  { name: 'Conciseness', score: 79, change: 6, icon: 'contract-outline', color: COLORS.warning },
];

const achievements: Achievement[] = [
  { id: '1', title: 'First Draft', description: 'Complete your first writing', icon: 'create', unlocked: true, progress: 1, total: 1 },
  { id: '2', title: 'Word Smith', description: 'Write 10,000 total words', icon: 'text', unlocked: true, progress: 10000, total: 10000 },
  { id: '3', title: 'Streak Master', description: '7-day writing streak', icon: 'flame', unlocked: true, progress: 7, total: 7 },
  { id: '4', title: 'Perfect Score', description: 'Achieve a 100 grammar score', icon: 'trophy', unlocked: false, progress: 95, total: 100 },
  { id: '5', title: 'Prolific Writer', description: 'Write 50 pieces', icon: 'documents', unlocked: false, progress: 34, total: 50 },
  { id: '6', title: 'Style Maven', description: 'Apply 100 style suggestions', icon: 'color-palette', unlocked: false, progress: 67, total: 100 },
];

const WritingProgressScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(weekData.map(() => new Animated.Value(0))).current;
  const skillAnims = useRef(skillMetrics.map(() => new Animated.Value(0))).current;

  const maxWords = Math.max(...weekData.map(d => d.words));
  const totalWeekWords = weekData.reduce((sum, d) => sum + d.words, 0);
  const totalWeekPieces = weekData.reduce((sum, d) => sum + d.pieces, 0);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    weekData.forEach((_, i) => {
      Animated.timing(barAnims[i], {
        toValue: 1,
        duration: 600,
        delay: 300 + i * 80,
        useNativeDriver: false,
      }).start();
    });

    skillMetrics.forEach((_, i) => {
      Animated.timing(skillAnims[i], {
        toValue: 1,
        duration: 700,
        delay: 500 + i * 80,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Writing Progress</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Streak & Highlights */}
        <Animated.View style={[styles.highlightsRow, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#E17055', '#FAB1A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <Ionicons name="flame" size={28} color="#FFF" />
            <Text style={styles.streakNumber}>12</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </LinearGradient>

          <View style={styles.highlightSmallCol}>
            <View style={styles.highlightSmallCard}>
              <Text style={[styles.highlightNumber, { color: COLORS.accent }]}>34</Text>
              <Text style={styles.highlightLabel}>Total Pieces</Text>
            </View>
            <View style={styles.highlightSmallCard}>
              <Text style={[styles.highlightNumber, { color: COLORS.primaryLight }]}>85</Text>
              <Text style={styles.highlightLabel}>Avg Score</Text>
            </View>
          </View>
        </Animated.View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeRow}>
          {(['week', 'month', 'all'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeBtn, timeRange === range && styles.timeRangeBtnActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Chart */}
        <Animated.View style={[styles.chartSection, { opacity: fadeAnim }]}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Words Written</Text>
            <Text style={styles.chartTotal}>{totalWeekWords.toLocaleString()} total</Text>
          </View>
          <View style={styles.chartContainer}>
            {weekData.map((day, index) => {
              const barHeight = (day.words / maxWords) * 140;
              return (
                <View key={day.label} style={styles.chartBarCol}>
                  <Text style={styles.chartBarValue}>{day.words > 999 ? (day.words / 1000).toFixed(1) + 'k' : day.words}</Text>
                  <View style={styles.chartBarBg}>
                    <Animated.View
                      style={[
                        styles.chartBarFill,
                        {
                          height: barAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, barHeight],
                          }),
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryLight]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  </View>
                  <Text style={[styles.chartBarLabel, day.label === 'Thu' && { color: COLORS.primaryLight, fontWeight: '700' }]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartSummary}>
            <View style={styles.chartSummaryItem}>
              <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.chartSummaryText}>{totalWeekPieces} pieces this week</Text>
            </View>
            <View style={styles.chartSummaryItem}>
              <Ionicons name="trending-up" size={16} color={COLORS.success} />
              <Text style={[styles.chartSummaryText, { color: COLORS.success }]}>+18% vs last week</Text>
            </View>
          </View>
        </Animated.View>

        {/* Skill Breakdown */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>Skill Breakdown</Text>
          {skillMetrics.map((skill, index) => (
            <View key={skill.name} style={styles.skillRow}>
              <View style={[styles.skillIcon, { backgroundColor: skill.color + '20' }]}>
                <Ionicons name={skill.icon as any} size={18} color={skill.color} />
              </View>
              <View style={styles.skillInfo}>
                <View style={styles.skillNameRow}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.skillScoreRow}>
                    <Text style={[styles.skillScore, { color: skill.color }]}>{skill.score}</Text>
                    <View style={[styles.changeBadge, { backgroundColor: skill.change >= 0 ? COLORS.success + '20' : COLORS.error + '20' }]}>
                      <Ionicons
                        name={skill.change >= 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={skill.change >= 0 ? COLORS.success : COLORS.error}
                      />
                      <Text style={[styles.changeText, { color: skill.change >= 0 ? COLORS.success : COLORS.error }]}>
                        {skill.change >= 0 ? '+' : ''}{skill.change}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.skillBarBg}>
                  <Animated.View
                    style={[
                      styles.skillBarFill,
                      {
                        backgroundColor: skill.color,
                        width: skillAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${skill.score}%`],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.achievementCount}>
              {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
            </Text>
          </View>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}
              >
                <View style={[styles.achievementIconContainer, { backgroundColor: achievement.unlocked ? COLORS.primary + '20' : COLORS.surfaceLight }]}>
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.unlocked ? COLORS.primaryLight : COLORS.textMuted}
                  />
                </View>
                <Text style={[styles.achievementTitle, !achievement.unlocked && { color: COLORS.textMuted }]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDesc} numberOfLines={2}>{achievement.description}</Text>
                {!achievement.unlocked && (
                  <View style={styles.achievementProgress}>
                    <View style={styles.achievementProgressBg}>
                      <View
                        style={[
                          styles.achievementProgressFill,
                          { width: `${(achievement.progress / achievement.total) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.achievementProgressText}>{achievement.progress}/{achievement.total}</Text>
                  </View>
                )}
                {achievement.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.unlockedText}>Unlocked</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <LinearGradient
            colors={[COLORS.primary + '30', COLORS.accent + '15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipGradient}
          >
            <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Writing Tip</Text>
              <Text style={styles.tipText}>
                Your vocabulary score is improving! Try using a thesaurus while writing to discover even more precise words.
              </Text>
            </View>
          </LinearGradient>
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
  highlightsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  streakCard: { flex: 1, borderRadius: 18, padding: 20, alignItems: 'center', justifyContent: 'center' },
  streakNumber: { fontSize: 40, fontWeight: '900', color: '#FFF', marginTop: 4 },
  streakLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  highlightSmallCol: { flex: 1, gap: 12 },
  highlightSmallCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  highlightNumber: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  highlightLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  timeRangeRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  timeRangeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  timeRangeBtnActive: { backgroundColor: COLORS.primary },
  timeRangeText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  timeRangeTextActive: { color: '#FFF' },
  chartSection: { paddingHorizontal: 20, marginBottom: 28 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  chartTotal: { fontSize: 14, color: COLORS.textSecondary },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 190, paddingTop: 20 },
  chartBarCol: { alignItems: 'center', flex: 1 },
  chartBarValue: { fontSize: 10, color: COLORS.textMuted, marginBottom: 6 },
  chartBarBg: { width: 28, height: 140, backgroundColor: COLORS.surfaceLight, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 8, overflow: 'hidden' },
  chartBarLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
  chartSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  chartSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartSummaryText: { fontSize: 13, color: COLORS.textSecondary },
  skillsSection: { paddingHorizontal: 20, marginBottom: 28 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  skillIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  skillInfo: { flex: 1 },
  skillNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  skillName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  skillScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillScore: { fontSize: 16, fontWeight: '800' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  changeText: { fontSize: 11, fontWeight: '700' },
  skillBarBg: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  skillBarFill: { height: '100%', borderRadius: 3 },
  achievementsSection: { paddingHorizontal: 20, marginBottom: 24 },
  achievementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  achievementCount: { fontSize: 13, color: COLORS.textMuted },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  achievementCard: { width: (width - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  achievementLocked: { opacity: 0.6 },
  achievementIconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  achievementTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  achievementDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, lineHeight: 15 },
  achievementProgress: { marginTop: 10 },
  achievementProgressBg: { height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' },
  achievementProgressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  achievementProgressText: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  unlockedText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  tipCard: { marginHorizontal: 20, marginBottom: 20 },
  tipGradient: { borderRadius: 16, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  tipText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
});

export default WritingProgressScreen;
