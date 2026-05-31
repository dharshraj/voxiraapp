 
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

interface EmailTemplate {
  id: string;
  title: string;
  category: string;
  preview: string;
  subject: string;
  body: string;
  icon: string;
  color: string;
  popular: boolean;
}

const templates: EmailTemplate[] = [
  {
    id: '1',
    title: 'Follow-Up After Meeting',
    category: 'Professional',
    preview: 'Thank the recipient and recap key points...',
    subject: 'Great connecting — next steps from our meeting',
    body: 'Hi [Name],\n\nThank you for taking the time to meet with me today. I really enjoyed our conversation about [topic].\n\nAs discussed, here are the key takeaways:\n• [Point 1]\n• [Point 2]\n• [Point 3]\n\nI\'ll follow up on [action item] by [date]. Please don\'t hesitate to reach out if you have any questions.\n\nBest regards,\n[Your Name]',
    icon: 'people-outline',
    color: '#6C5CE7',
    popular: true,
  },
  {
    id: '2',
    title: 'Cold Outreach',
    category: 'Sales',
    preview: 'Introduce yourself and propose value...',
    subject: 'Quick question about [Company]',
    body: 'Hi [Name],\n\nI came across [Company] and was impressed by [specific detail]. I\'m reaching out because we help companies like yours [value proposition].\n\nWould you be open to a quick 15-minute call this week to explore how we might help [specific benefit]?\n\nBest,\n[Your Name]',
    icon: 'rocket-outline',
    color: '#E17055',
    popular: true,
  },
  {
    id: '3',
    title: 'Job Application',
    category: 'Career',
    preview: 'Express interest and highlight qualifications...',
    subject: 'Application for [Position] — [Your Name]',
    body: 'Dear [Hiring Manager],\n\nI am writing to express my strong interest in the [Position] role at [Company]. With [X years] of experience in [field], I am confident I can contribute meaningfully to your team.\n\nKey highlights:\n• [Achievement 1]\n• [Achievement 2]\n• [Relevant skill]\n\nI have attached my resume for your review and would welcome the opportunity to discuss how my background aligns with your needs.\n\nThank you for your consideration.\n\nSincerely,\n[Your Name]',
    icon: 'briefcase-outline',
    color: '#00CEC9',
    popular: true,
  },
  {
    id: '4',
    title: 'Apology / Mistake',
    category: 'Professional',
    preview: 'Acknowledge the error and offer resolution...',
    subject: 'My apologies regarding [issue]',
    body: 'Hi [Name],\n\nI want to sincerely apologize for [specific mistake]. I understand this caused [impact], and I take full responsibility.\n\nHere is what I am doing to fix it:\n• [Corrective action 1]\n• [Corrective action 2]\n\nI value our relationship and will ensure this doesn\'t happen again. Please let me know if there\'s anything else I can do.\n\nSincerely,\n[Your Name]',
    icon: 'heart-outline',
    color: '#FF6B6B',
    popular: false,
  },
  {
    id: '5',
    title: 'Thank You Note',
    category: 'Personal',
    preview: 'Express gratitude with a personal touch...',
    subject: 'Thank you so much!',
    body: 'Hi [Name],\n\nI just wanted to take a moment to say thank you for [specific reason]. It truly meant a lot to me, and I really appreciate your [kindness/support/help].\n\n[Personal detail or memory from the interaction]\n\nThank you again — I\'m grateful to have you in my life.\n\nWarmly,\n[Your Name]',
    icon: 'gift-outline',
    color: '#FDCB6E',
    popular: false,
  },
  {
    id: '6',
    title: 'Meeting Request',
    category: 'Professional',
    preview: 'Propose a meeting with clear agenda...',
    subject: 'Meeting request: [Topic] — [Date suggestion]',
    body: 'Hi [Name],\n\nI\'d like to schedule a meeting to discuss [topic/purpose]. I believe [brief reason why it\'s important].\n\nProposed agenda:\n1. [Item 1]\n2. [Item 2]\n3. [Item 3]\n\nWould [Date/Time option 1] or [Date/Time option 2] work for you? The meeting should take about [duration].\n\nLooking forward to hearing from you.\n\nBest,\n[Your Name]',
    icon: 'calendar-outline',
    color: '#74B9FF',
    popular: false,
  },
];

const categories = ['All', 'Professional', 'Sales', 'Career', 'Personal'];

const EmailTemplateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const detailAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.body);
    detailAnim.setValue(0);
    Animated.spring(detailAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detail / Editor View
  if (selectedTemplate) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={[
            { flex: 1 },
            {
              opacity: detailAnim,
              transform: [{ translateY: detailAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          {/* Detail Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedTemplate(null)} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedTemplate.title}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyHeaderBtn}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? COLORS.success : COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {/* Template Badge */}
            <View style={styles.templateBadgeRow}>
              <View style={[styles.templateBadge, { backgroundColor: selectedTemplate.color + '20' }]}>
                <Ionicons name={selectedTemplate.icon as any} size={16} color={selectedTemplate.color} />
                <Text style={[styles.templateBadgeText, { color: selectedTemplate.color }]}>{selectedTemplate.category}</Text>
              </View>
              {selectedTemplate.popular && (
                <View style={[styles.templateBadge, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={[styles.templateBadgeText, { color: COLORS.warning }]}>Popular</Text>
                </View>
              )}
            </View>

            {/* Subject Editor */}
            <Text style={styles.editorLabel}>SUBJECT LINE</Text>
            <View style={styles.editorField}>
              <TextInput
                style={styles.subjectInput}
                value={editedSubject}
                onChangeText={setEditedSubject}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Body Editor */}
            <Text style={styles.editorLabel}>EMAIL BODY</Text>
            <View style={styles.editorFieldLarge}>
              <TextInput
                style={styles.bodyInput}
                value={editedBody}
                onChangeText={setEditedBody}
                multiline
                textAlignVertical="top"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Hint */}
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.hintText}>Replace [bracketed] placeholders with your details</Text>
            </View>

            {/* Actions */}
            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.detailActionBtn} onPress={handleCopy} activeOpacity={0.8}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.detailActionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={20} color="#FFF" />
                  <Text style={styles.detailActionText}>{copied ? 'Copied!' : 'Copy to Clipboard'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => navigation.navigate('ToneAnalysisScreen', { text: editedBody })}
              >
                <Ionicons name="pulse-outline" size={18} color={COLORS.primaryLight} />
                <Text style={styles.secondaryActionText}>Analyze Tone</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // List View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Templates</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Hero Card */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#E17055', '#FAB1A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Ionicons name="mail-outline" size={36} color="#FFF" />
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>Write Better Emails</Text>
              <Text style={styles.heroSubtitle}>{templates.length} templates across {categories.length - 1} categories</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Category Filter */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Popular Section */}
        {selectedCategory === 'All' && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.sectionTitle}>⭐ Popular Templates</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularScroll}
            >
              {templates.filter(t => t.popular).map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.popularCard}
                  onPress={() => selectTemplate(template)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.popularIcon, { backgroundColor: template.color + '20' }]}>
                    <Ionicons name={template.icon as any} size={24} color={template.color} />
                  </View>
                  <Text style={styles.popularTitle} numberOfLines={1}>{template.title}</Text>
                  <Text style={styles.popularCategory}>{template.category}</Text>
                  <Text style={styles.popularPreview} numberOfLines={2}>{template.preview}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* All Templates List */}
        <Animated.View style={[styles.listSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'All Templates' : selectedCategory}
          </Text>
          {filteredTemplates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => selectTemplate(template)}
              activeOpacity={0.7}
            >
              <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                <Ionicons name={template.icon as any} size={22} color={template.color} />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templatePreview} numberOfLines={1}>{template.preview}</Text>
                <View style={styles.templateMeta}>
                  <View style={[styles.miniTag, { backgroundColor: template.color + '15' }]}>
                    <Text style={[styles.miniTagText, { color: template.color }]}>{template.category}</Text>
                  </View>
                  {template.popular && (
                    <View style={[styles.miniTag, { backgroundColor: COLORS.warning + '15' }]}>
                      <Ionicons name="star" size={10} color={COLORS.warning} />
                      <Text style={[styles.miniTagText, { color: COLORS.warning }]}>Popular</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },
  copyHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  heroCard: { marginHorizontal: 20, marginBottom: 20 },
  heroGradient: { borderRadius: 18, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  categoryScroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryChipTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14, paddingHorizontal: 20 },
  popularScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  popularCard: { width: width * 0.42, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginRight: 12 },
  popularIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  popularTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  popularCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  popularPreview: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 17 },
  listSection: { marginBottom: 20 },
  templateCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  templateIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  templatePreview: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  templateMeta: { flexDirection: 'row', gap: 6, marginTop: 6 },
  miniTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  miniTagText: { fontSize: 10, fontWeight: '600' },
  // Detail view styles
  templateBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  templateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  templateBadgeText: { fontSize: 12, fontWeight: '700' },
  editorLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  editorField: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  subjectInput: { padding: 14, fontSize: 15, color: COLORS.text, fontWeight: '600' },
  editorFieldLarge: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  bodyInput: { padding: 14, fontSize: 14, color: COLORS.text, lineHeight: 22, minHeight: 280 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24, paddingHorizontal: 4 },
  hintText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  detailActions: { gap: 12 },
  detailActionBtn: { borderRadius: 14, overflow: 'hidden' },
  detailActionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  detailActionText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  secondaryActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary + '40' },
  secondaryActionText: { fontSize: 15, fontWeight: '600', color: COLORS.primaryLight },
});

export default EmailTemplateScreen;
