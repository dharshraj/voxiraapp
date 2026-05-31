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
  Alert,
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

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  category: string;
  date: string;
  score: number;
  wordCount: number;
  preview: string;
  toolsUsed: string[];
}

const historyData: HistoryItem[] = [
  { id: '1', title: 'Q2 Business Proposal', type: 'Report', category: 'business', date: 'Today, 2:30 PM', score: 92, wordCount: 1840, preview: 'We propose a comprehensive strategy to expand our market presence in Southeast Asia through targeted partnerships...', toolsUsed: ['Grammar', 'Tone', 'Rewrite'] },
  { id: '2', title: 'Client Follow-Up Email', type: 'Email', category: 'email', date: 'Today, 10:15 AM', score: 88, wordCount: 320, preview: 'Thank you for taking the time to meet with us yesterday. We were excited to learn about your expansion plans...', toolsUsed: ['Grammar', 'Tone'] },
  { id: '3', title: 'Blog Post: AI in Healthcare', type: 'Blog', category: 'creative', date: 'Yesterday', score: 85, wordCount: 1200, preview: 'Artificial intelligence is revolutionizing healthcare in ways we could barely imagine a decade ago...', toolsUsed: ['Style', 'Grammar'] },
  { id: '4', title: 'Team Meeting Notes', type: 'Notes', category: 'business', date: 'Yesterday', score: 76, wordCount: 450, preview: 'Attendees: Sarah, Mike, Jessica, David. Key decisions: 1) Launch date moved to March 15...', toolsUsed: ['Grammar'] },
  { id: '5', title: 'Product Description: SmartWatch X', type: 'Marketing', category: 'marketing', date: '2 days ago', score: 91, wordCount: 680, preview: 'Introducing the SmartWatch X — where cutting-edge technology meets elegant design. Track your health...', toolsUsed: ['Tone', 'Style', 'Rewrite'] },
  { id: '6', title: 'Personal Statement Draft', type: 'Essay', category: 'personal', date: '3 days ago', score: 82, wordCount: 750, preview: 'Growing up between two cultures taught me something invaluable: the ability to see the world through...', toolsUsed: ['Grammar', 'Style'] },
  { id: '7', title: 'API Documentation v2', type: 'Technical', category: 'technical', date: '4 days ago', score: 95, wordCount: 2100, preview: 'This endpoint handles user authentication and returns a JWT token. Required parameters include...', toolsUsed: ['Grammar'] },
  { id: '8', title: 'Newsletter: March Edition', type: 'Email', category: 'email', date: '1 week ago', score: 79, wordCount: 890, preview: 'Welcome to our March newsletter! This month, we are thrilled to announce three major updates...', toolsUsed: ['Tone', 'Rewrite'] },
];

const filterOptions = ['All', 'Email', 'Report', 'Blog', 'Essay', 'Technical'];

const WritingHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [items, setItems] = useState(historyData);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return COLORS.success;
    if (score >= 75) return COLORS.accent;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const filteredItems = items
    .filter(item => {
      const matchesFilter = selectedFilter === 'All' || item.type === selectedFilter;
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : 0);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this writing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setItems(prev => prev.filter(i => i.id !== id)) },
    ]);
  };

  const totalWords = items.reduce((sum, i) => sum + i.wordCount, 0);
  const avgScore = Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Writing History</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy(sortBy === 'date' ? 'score' : 'date')}
          >
            <Ionicons name={sortBy === 'date' ? 'time-outline' : 'trophy-outline'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Summary Stats */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Writings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: COLORS.accent }]}>{totalWords.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Words</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: getScoreColor(avgScore) }]}>{avgScore}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your writing..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filters */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* History List */}
        <View style={styles.listSection}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No writings found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.cardMeta}>
                      <View style={styles.typeTag}>
                        <Text style={styles.typeTagText}>{item.type}</Text>
                      </View>
                      <Text style={styles.cardDate}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={[styles.scoreCircle, { borderColor: getScoreColor(item.score) }]}>
                    <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>{item.score}</Text>
                  </View>
                </View>

                <Text style={styles.previewText} numberOfLines={2}>{item.preview}</Text>

                <View style={styles.cardFooter}>
                  <View style={styles.toolsUsed}>
                    {item.toolsUsed.map((tool) => (
                      <View key={tool} style={styles.toolTag}>
                        <Text style={styles.toolTagText}>{tool}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.cardActions}>
                    <Text style={styles.wordCountText}>{item.wordCount} words</Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  sortButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filterScroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: '#FFF' },
  listSection: { paddingHorizontal: 20 },
  historyCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  typeTag: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeTagText: { fontSize: 11, fontWeight: '600', color: COLORS.primaryLight },
  cardDate: { fontSize: 12, color: COLORS.textMuted },
  scoreCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 17, fontWeight: '800' },
  previewText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toolsUsed: { flexDirection: 'row', gap: 6 },
  toolTag: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  toolTagText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordCountText: { fontSize: 12, color: COLORS.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 6 },
});

export default WritingHistoryScreen;
