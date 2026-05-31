import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

type WritingCategory = 'essay' | 'email' | 'story' | 'report' | 'free';

interface CategoryOption {
  id: WritingCategory;
  label: string;
  icon: string;
}

const categories: CategoryOption[] = [
  { id: 'free', label: 'Free Write', icon: 'create-outline' },
  { id: 'essay', label: 'Essay', icon: 'document-text-outline' },
  { id: 'email', label: 'Email', icon: 'mail-outline' },
  { id: 'story', label: 'Story', icon: 'book-outline' },
  { id: 'report', label: 'Report', icon: 'bar-chart-outline' },
];

const NewWritingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WritingCategory>('free');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toolbarAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(toolbarAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim()).length;

  const handleAnalyze = () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      navigation.navigate('GrammarResultScreen', { text: content, title });
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Writing</Text>
          <TouchableOpacity
            style={[styles.analyzeButton, !content.trim() && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={!content.trim()}
          >
            <Text style={[styles.analyzeButtonText, !content.trim() && { opacity: 0.4 }]}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Category Selector */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={selectedCategory === cat.id ? '#FFF' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Writing Area */}
        <ScrollView style={styles.editorScroll} keyboardDismissMode="interactive">
          <TextInput
            style={styles.titleInput}
            placeholder="Title (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.contentInput}
            placeholder="Start writing here..."
            placeholderTextColor={COLORS.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </ScrollView>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statsGroup}>
            <View style={styles.statItem}>
              <Ionicons name="text-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.statText}>{wordCount} words</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="code-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.statText}>{charCount} chars</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="chatbox-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.statText}>{sentenceCount} sentences</Text>
            </View>
          </View>
        </View>

        {/* Toolbar */}
        <Animated.View style={[styles.toolbar, { transform: [{ translateY: toolbarAnim }] }]}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => navigation.navigate('ToneAnalysisScreen', { text: content })}
          >
            <Ionicons name="pulse-outline" size={22} color={COLORS.primaryLight} />
            <Text style={styles.toolLabel}>Tone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => navigation.navigate('StyleSuggestionsScreen', { text: content })}
          >
            <Ionicons name="color-palette-outline" size={22} color={COLORS.accent} />
            <Text style={styles.toolLabel}>Style</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => navigation.navigate('RewriteScreen', { text: content })}
          >
            <Ionicons name="refresh-outline" size={22} color={COLORS.warning} />
            <Text style={styles.toolLabel}>Rewrite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="copy-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.toolLabel}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.toolLabel}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  analyzeButton: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  analyzeButtonDisabled: { backgroundColor: COLORS.surfaceLight },
  analyzeButtonText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  categoryScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, gap: 6, marginRight: 8 },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryChipTextActive: { color: '#FFF' },
  editorScroll: { flex: 1, paddingHorizontal: 20 },
  titleInput: { fontSize: 24, fontWeight: '700', color: COLORS.text, paddingVertical: 12, minHeight: 50 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
  contentInput: { fontSize: 16, color: COLORS.text, lineHeight: 26, minHeight: 300, paddingBottom: 40 },
  statsBar: { paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  statsGroup: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: COLORS.textMuted },
  statDivider: { width: 1, height: 12, backgroundColor: COLORS.border, marginHorizontal: 10 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  toolButton: { alignItems: 'center', gap: 4 },
  toolLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
});

export default NewWritingScreen;
