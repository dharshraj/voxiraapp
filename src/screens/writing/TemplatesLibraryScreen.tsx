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

interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

interface WritingTemplate {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  wordGuide: string;
  starter: string;
  popular: boolean;
}

const templateCategories: TemplateCategory[] = [
  { id: 'business', name: 'Business', icon: 'briefcase-outline', color: '#6C5CE7', count: 8 },
  { id: 'academic', name: 'Academic', icon: 'school-outline', color: '#00CEC9', count: 6 },
  { id: 'creative', name: 'Creative', icon: 'color-palette-outline', color: '#E17055', count: 5 },
  { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#FDCB6E', count: 4 },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone-outline', color: '#FF6B6B', count: 5 },
  { id: 'technical', name: 'Technical', icon: 'code-slash-outline', color: '#74B9FF', count: 4 },
];

const allTemplates: WritingTemplate[] = [
  { id: '1', title: 'Business Proposal', categoryId: 'business', description: 'Persuasive proposal with problem statement, solution, timeline, and pricing.', difficulty: 'Advanced', estimatedTime: '45 min', wordGuide: '1000-2000', starter: 'Executive Summary\n\nWe propose a strategic initiative to...', popular: true },
  { id: '2', title: 'Executive Summary', categoryId: 'business', description: 'Concise overview for reports, plans, or business documents.', difficulty: 'Intermediate', estimatedTime: '20 min', wordGuide: '250-500', starter: 'This document outlines...', popular: true },
  { id: '3', title: 'Meeting Minutes', categoryId: 'business', description: 'Structured notes with attendees, agenda items, decisions, and action items.', difficulty: 'Beginner', estimatedTime: '15 min', wordGuide: '300-600', starter: 'Meeting Date:\nAttendees:\n\nAgenda Items:\n1.', popular: false },
  { id: '4', title: 'Research Essay', categoryId: 'academic', description: 'Structured essay with thesis, evidence-based arguments, and citations.', difficulty: 'Advanced', estimatedTime: '60 min', wordGuide: '1500-3000', starter: 'Introduction\n\nThe question of [topic] has long been debated...', popular: true },
  { id: '5', title: 'Literature Review', categoryId: 'academic', description: 'Survey existing research on a topic, identifying themes and gaps.', difficulty: 'Advanced', estimatedTime: '90 min', wordGuide: '2000-4000', starter: 'This review examines the current body of literature on...', popular: false },
  { id: '6', title: 'Lab Report', categoryId: 'academic', description: 'Formal report with hypothesis, methods, results, and discussion.', difficulty: 'Intermediate', estimatedTime: '30 min', wordGuide: '800-1500', starter: 'Title:\nAbstract:\n\nIntroduction\nThe purpose of this experiment is to...', popular: false },
  { id: '7', title: 'Short Story', categoryId: 'creative', description: 'Narrative fiction with character development, conflict, and resolution.', difficulty: 'Intermediate', estimatedTime: '40 min', wordGuide: '1000-3000', starter: 'The first thing I noticed was...', popular: true },
  { id: '8', title: 'Blog Post', categoryId: 'creative', description: 'Engaging post with hook, supporting points, and call to action.', difficulty: 'Beginner', estimatedTime: '25 min', wordGuide: '600-1200', starter: 'Have you ever wondered why...', popular: true },
  { id: '9', title: 'Personal Statement', categoryId: 'personal', description: 'Compelling narrative about your background, goals, and unique qualities.', difficulty: 'Advanced', estimatedTime: '45 min', wordGuide: '500-800', starter: 'Growing up in [background], I learned early that...', popular: true },
  { id: '10', title: 'Cover Letter', categoryId: 'personal', description: 'Professional introduction tailored to a specific job opportunity.', difficulty: 'Intermediate', estimatedTime: '20 min', wordGuide: '250-400', starter: 'Dear [Hiring Manager],\n\nI am writing to express my interest in...', popular: false },
  { id: '11', title: 'Product Launch', categoryId: 'marketing', description: 'Announcement copy highlighting features, benefits, and availability.', difficulty: 'Intermediate', estimatedTime: '25 min', wordGuide: '400-800', starter: 'Introducing [Product Name] — the [category] that...', popular: false },
  { id: '12', title: 'Social Media Campaign', categoryId: 'marketing', description: 'Series of coordinated posts across platforms with consistent messaging.', difficulty: 'Beginner', estimatedTime: '20 min', wordGuide: '200-500', starter: 'Campaign Theme:\nTarget Audience:\n\nPost 1 (Instagram):', popular: false },
  { id: '13', title: 'API Documentation', categoryId: 'technical', description: 'Clear endpoint documentation with parameters, examples, and error codes.', difficulty: 'Intermediate', estimatedTime: '30 min', wordGuide: '500-1500', starter: '## Endpoint: /api/v1/[resource]\n\n### Description\n\nThis endpoint...', popular: false },
  { id: '14', title: 'Technical RFC', categoryId: 'technical', description: 'Design proposal with context, approach options, trade-offs, and plan.', difficulty: 'Advanced', estimatedTime: '60 min', wordGuide: '1500-3000', starter: '# RFC: [Title]\n\n## Summary\n\nThis RFC proposes...', popular: false },
];

const EmailTemplateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WritingTemplate | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const filteredTemplates = allTemplates.filter(t => {
    const matchesCategory = !selectedCategory || t.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openPreview = (template: WritingTemplate) => {
    setPreviewTemplate(template);
    previewAnim.setValue(0);
    Animated.spring(previewAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  };

  const useTemplate = (template: WritingTemplate) => {
    navigation.navigate('NewWritingScreen', { templateTitle: template.title, templateContent: template.starter });
  };

  const getDifficultyStyle = (d: string) => {
    switch (d) {
      case 'Beginner': return { bg: COLORS.success + '20', color: COLORS.success };
      case 'Intermediate': return { bg: COLORS.warning + '20', color: COLORS.warning };
      default: return { bg: COLORS.error + '20', color: COLORS.error };
    }
  };

  // Preview Overlay
  if (previewTemplate) {
    const diffStyle = getDifficultyStyle(previewTemplate.difficulty);
    const cat = templateCategories.find(c => c.id === previewTemplate.categoryId);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={[
            { flex: 1 },
            {
              opacity: previewAnim,
              transform: [{ translateY: previewAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setPreviewTemplate(null)} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Template Preview</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {/* Template Header Card */}
            <LinearGradient
              colors={[cat?.color || COLORS.primary, (cat?.color || COLORS.primary) + 'AA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewHero}
            >
              <Ionicons name={cat?.icon as any || 'document-outline'} size={32} color="#FFF" />
              <Text style={styles.previewHeroTitle}>{previewTemplate.title}</Text>
              <Text style={styles.previewHeroDesc}>{previewTemplate.description}</Text>
            </LinearGradient>

            {/* Meta Details */}
            <View style={styles.previewMetaRow}>
              <View style={styles.previewMetaItem}>
                <Ionicons name="speedometer-outline" size={16} color={COLORS.textMuted} />
                <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                  <Text style={[styles.diffBadgeText, { color: diffStyle.color }]}>{previewTemplate.difficulty}</Text>
                </View>
              </View>
              <View style={styles.previewMetaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.previewMetaText}>{previewTemplate.estimatedTime}</Text>
              </View>
              <View style={styles.previewMetaItem}>
                <Ionicons name="text-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.previewMetaText}>{previewTemplate.wordGuide} words</Text>
              </View>
            </View>

            {/* Starter Preview */}
            <Text style={styles.previewLabel}>TEMPLATE STARTER</Text>
            <View style={styles.starterBox}>
              <Text style={styles.starterText}>{previewTemplate.starter}</Text>
            </View>

            {/* Use Template Button */}
            <TouchableOpacity
              style={styles.useTemplateBtn}
              onPress={() => useTemplate(previewTemplate)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.useTemplateGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="create-outline" size={20} color="#FFF" />
                <Text style={styles.useTemplateText}>Use This Template</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Main Library View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Templates Library</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Search */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
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

        {/* Categories */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryGrid}>
            {templateCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && { borderColor: cat.color, borderWidth: 2 },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.count} templates</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Featured */}
        {!selectedCategory && !searchQuery && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.sectionTitle}>🔥 Featured</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
              {allTemplates.filter(t => t.popular).map((template) => {
                const cat = templateCategories.find(c => c.id === template.categoryId);
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.featuredCard}
                    onPress={() => openPreview(template)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.featuredIcon, { backgroundColor: (cat?.color || COLORS.primary) + '20' }]}>
                      <Ionicons name={cat?.icon as any || 'document-outline'} size={20} color={cat?.color || COLORS.primary} />
                    </View>
                    <Text style={styles.featuredTitle} numberOfLines={1}>{template.title}</Text>
                    <Text style={styles.featuredDesc} numberOfLines={2}>{template.description}</Text>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredTime}>{template.estimatedTime}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Template List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory
              ? templateCategories.find(c => c.id === selectedCategory)?.name || 'Templates'
              : searchQuery
              ? `Results for "${searchQuery}"`
              : 'All Templates'}
          </Text>
          {filteredTemplates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No templates found</Text>
            </View>
          ) : (
            filteredTemplates.map((template) => {
              const cat = templateCategories.find(c => c.id === template.categoryId);
              const diffStyle = getDifficultyStyle(template.difficulty);
              return (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => openPreview(template)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.templateCardIcon, { backgroundColor: (cat?.color || COLORS.primary) + '20' }]}>
                    <Ionicons name={cat?.icon as any || 'document-outline'} size={20} color={cat?.color || COLORS.primary} />
                  </View>
                  <View style={styles.templateCardInfo}>
                    <Text style={styles.templateCardTitle}>{template.title}</Text>
                    <Text style={styles.templateCardDesc} numberOfLines={1}>{template.description}</Text>
                    <View style={styles.templateCardMeta}>
                      <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                        <Text style={[styles.diffBadgeText, { color: diffStyle.color }]}>{template.difficulty}</Text>
                      </View>
                      <Text style={styles.templateCardTime}>{template.estimatedTime}</Text>
                      <Text style={styles.templateCardWords}>{template.wordGuide} words</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 24, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14, paddingHorizontal: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 24 },
  categoryCard: { width: (width - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  categoryName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  categoryCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  featuredScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  featuredCard: { width: width * 0.44, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginRight: 12 },
  featuredIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featuredTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  featuredDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },
  featuredMeta: { marginTop: 10 },
  featuredTime: { fontSize: 11, color: COLORS.textMuted },
  listSection: { marginBottom: 20 },
  templateCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  templateCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  templateCardInfo: { flex: 1 },
  templateCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  templateCardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  templateCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  templateCardTime: { fontSize: 11, color: COLORS.textMuted },
  templateCardWords: { fontSize: 11, color: COLORS.textMuted },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  diffBadgeText: { fontSize: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, marginHorizontal: 20 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
  // Preview styles
  previewHero: { borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 20 },
  previewHeroTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 12, textAlign: 'center' },
  previewHeroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  previewMetaRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  previewMetaItem: { alignItems: 'center', gap: 6 },
  previewMetaText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  previewLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 10 },
  starterBox: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  starterText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  useTemplateBtn: { borderRadius: 14, overflow: 'hidden' },
  useTemplateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  useTemplateText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default EmailTemplateScreen;
