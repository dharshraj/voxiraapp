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
import { useNavigation, useRoute } from '@react-navigation/native';
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

interface RewriteStyle {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const rewriteStyles: RewriteStyle[] = [
  { id: 'professional', label: 'Professional', icon: 'briefcase-outline', color: '#6C5CE7', description: 'Formal business tone' },
  { id: 'casual', label: 'Casual', icon: 'happy-outline', color: '#00CEC9', description: 'Friendly & relaxed' },
  { id: 'concise', label: 'Concise', icon: 'contract-outline', color: '#E17055', description: 'Shorter & tighter' },
  { id: 'elaborate', label: 'Elaborate', icon: 'expand-outline', color: '#FDCB6E', description: 'More detailed' },
  { id: 'persuasive', label: 'Persuasive', icon: 'megaphone-outline', color: '#FF6B6B', description: 'Compelling & convincing' },
  { id: 'academic', label: 'Academic', icon: 'school-outline', color: '#74B9FF', description: 'Scholarly & precise' },
];

const mockRewrites: Record<string, string> = {
  professional: 'We would like to formally propose a strategic partnership that would leverage our respective strengths to drive mutual growth and deliver enhanced value to our stakeholders.',
  casual: 'Hey! We think it\'d be awesome to team up. Together we could do some really great things — what do you say?',
  concise: 'We propose a partnership to combine strengths and drive mutual growth.',
  elaborate: 'We are reaching out to explore the possibility of establishing a comprehensive strategic partnership between our organizations, one that would thoughtfully combine our complementary capabilities and resources to create meaningful value for all parties involved.',
  persuasive: 'Imagine what we could accomplish together. A partnership between us wouldn\'t just benefit our teams — it would reshape the industry. The opportunity is too significant to pass up.',
  academic: 'This correspondence serves to propose a collaborative engagement predicated upon the synergistic alignment of our organizational competencies, with the objective of achieving mutually beneficial outcomes.',
};

const RewriteScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [inputText, setInputText] = useState(route.params?.text || '');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [rewrittenText, setRewrittenText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleRewrite = (styleId: string) => {
    setSelectedStyle(styleId);
    setIsRewriting(true);
    resultAnim.setValue(0);

    setTimeout(() => {
      setRewrittenText(mockRewrites[styleId] || 'Rewritten text will appear here.');
      setIsRewriting(false);
      Animated.spring(resultAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    }, 1000);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={Platform.OS === 'web' ? ({height: '100vh', overflowY: 'scroll'} as any) : undefined} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rewrite</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Input Area */}
        <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>ORIGINAL TEXT</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste or type the text you want to rewrite..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
            />
            {inputText.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setInputText('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Style Selector */}
        <Animated.View style={[styles.stylesSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>REWRITE STYLE</Text>
          <View style={styles.stylesGrid}>
            {rewriteStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyle === style.id && { borderColor: style.color, borderWidth: 2 },
                ]}
                onPress={() => handleRewrite(style.id)}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <View style={[styles.styleIcon, { backgroundColor: style.color + '20' }]}>
                  <Ionicons name={style.icon as any} size={22} color={style.color} />
                </View>
                <Text style={styles.styleLabel}>{style.label}</Text>
                <Text style={styles.styleDesc}>{style.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Result */}
        {isRewriting && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map(i => (
                <Animated.View key={i} style={[styles.loadingDot, { backgroundColor: COLORS.primaryLight }]} />
              ))}
            </View>
            <Text style={styles.loadingText}>Rewriting with {rewriteStyles.find(s => s.id === selectedStyle)?.label} tone...</Text>
          </View>
        )}

        {rewrittenText && !isRewriting && (
          <Animated.View
            style={[
              styles.resultSection,
              {
                opacity: resultAnim,
                transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.sectionLabel}>REWRITTEN TEXT</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultActionButton} onPress={handleCopy}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? COLORS.success : COLORS.textSecondary} />
                  <Text style={[styles.resultActionText, copied && { color: COLORS.success }]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{rewrittenText}</Text>
            </View>

            {/* Comparison Stats */}
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Original</Text>
                <Text style={styles.comparisonValue}>{inputText.split(/\s+/).length} words</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Rewritten</Text>
                <Text style={[styles.comparisonValue, { color: COLORS.accent }]}>{rewrittenText.split(/\s+/).length} words</Text>
              </View>
            </View>

            {/* Use Result Button */}
            <TouchableOpacity style={styles.useButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.useButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.useButtonText}>Use This Version</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  inputSection: { paddingHorizontal: 20, marginBottom: 24 },
  inputContainer: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  textInput: { padding: 16, fontSize: 15, color: COLORS.text, lineHeight: 22, minHeight: 120 },
  clearButton: { position: 'absolute', top: 12, right: 12 },
  stylesSection: { paddingHorizontal: 20, marginBottom: 24 },
  stylesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  styleCard: { width: (width - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  styleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  styleLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  styleDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  loadingContainer: { alignItems: 'center', paddingVertical: 32 },
  loadingDots: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  loadingDot: { width: 8, height: 8, borderRadius: 4 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  resultSection: { paddingHorizontal: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultActions: { flexDirection: 'row', gap: 12 },
  resultActionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultActionText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  resultContainer: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.primary + '40' },
  resultText: { fontSize: 15, color: COLORS.text, lineHeight: 24 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 12 },
  comparisonItem: { alignItems: 'center' },
  comparisonLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  comparisonValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  useButton: { marginTop: 16 },
  useButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  useButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default RewriteScreen;
