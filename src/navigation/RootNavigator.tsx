import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';

// ── Auth & Onboarding ─────────────────────────────────────────────────────────
import SplashScreen           from '../screens/auth/SplashScreen';
import WelcomeScreen          from '../screens/onboarding/WelcomeScreen';
import Feature1Screen         from '../screens/onboarding/Feature1Screen';
import Feature2Screen         from '../screens/onboarding/Feature2Screen';
import Feature3Screen         from '../screens/onboarding/Feature3Screen';
import GoalSelectionScreen    from '../screens/onboarding/GoalSelectionScreen';
import ExperienceLevelScreen  from '../screens/onboarding/ExperienceLevelScreen';
import PermissionsScreen      from '../screens/onboarding/PermissionsScreen';
import LoginScreen            from '../screens/auth/LoginScreen';
import RegisterScreen         from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen   from '../screens/auth/ForgotPasswordScreen';
import DeleteAccountScreen    from '../screens/auth/DeleteAccountScreen';

// ── Home ──────────────────────────────────────────────────────────────────────
import DashboardScreen     from '../screens/home/DashboardScreen';
import DailyGoalScreen     from '../screens/home/DailyGoalScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import SearchScreen        from '../screens/home/SearchScreen';
import TopicDetailScreen   from '../screens/home/TopicDetailScreen';

// ── Profile ───────────────────────────────────────────────────────────────────
import ProfileScreen          from '../screens/profile/ProfileScreen';
import EditProfileScreen      from '../screens/profile/EditProfileScreen';
import SpeechDashboardScreen_H   from '../screens/speech/SpeechDashboardScreen';
import SpeechHistoryScreen_H     from '../screens/speech/SpeechHistoryScreen';
import ProgressOverviewScreen_H  from '../screens/profile/ProgressOverviewScreen';

// ── Speech ────────────────────────────────────────────────────────────────────
import SpeechHomeScreen     from '../screens/speech/SpeechHomeScreen';
import RecordScreen         from '../screens/speech/RecordScreen';
import AnalyzingScreen      from '../screens/speech/AnalyzingScreen';
// Analysis Result flow — 9 separate screens
import TranscriptResultScreen    from '../screens/speech/analysisResult/TranscriptResultScreen';
import FillerWordBreakdownScreen  from '../screens/speech/analysisResult/FillerWordBreakdownScreen';
import ScoreBreakdownScreen       from '../screens/speech/analysisResult/ScoreBreakdownScreen';
import FeedbackResultScreen       from '../screens/speech/analysisResult/FeedbackResultScreen';
import ContentSuggestionsScreen   from '../screens/speech/analysisResult/ContentSuggestionsScreen';
import SuggestedRephrasingsScreen from '../screens/speech/analysisResult/SuggestedRephrasingsScreen';
import ImprovementTipsScreen      from '../screens/speech/analysisResult/ImprovementTipsScreen';
import StructureFeedbackScreen    from '../screens/speech/analysisResult/StructureFeedbackScreen';
import SevenDayPlanScreen         from '../screens/speech/analysisResult/SevenDayPlanScreen';
import FillerWordsScreen    from '../screens/speech/FillerWordsScreen';
import SpeechProgressScreen from '../screens/speech/SpeechProgressScreen';
import SessionDetailScreen  from '../screens/speech/SessionDetailScreen';
import DailyChallengeScreen from '../screens/speech/DailyChallengeScreen';
import SpeechHistoryScreen  from '../screens/speech/SpeechHistoryScreen';
import ShareResultScreen    from '../screens/speech/ShareResultScreen';
import PronunciationScreen  from '../screens/speech/PronunciationScreen';
import PaceAndClarityScreen  from '../screens/speech/PaceAndClarityScreen';
import SpeechDashboardScreen from '../screens/speech/SpeechDashboardScreen';

// ── Speech extras ─────────────────────────────────────────────────────────────
import VocabularyBuilderScreen from '../screens/speech/VocabularyBuilderScreen';
import ToneAnalysisScreen      from '../screens/speech/ToneAnalysisScreen';
import ConfidenceScoreScreen   from '../screens/speech/ConfidenceScoreScreen';
import WeeklyReportScreen      from '../screens/speech/WeeklyReportScreen';
import CompareSessionsScreen   from '../screens/speech/CompareSessionsScreen';

// ── Gamification ──────────────────────────────────────────────────────────────
import RewardsScreen        from '../screens/gamification/RewardsScreen';
import StreakCalendarScreen  from '../screens/gamification/StreakCalendarScreen';
import LevelUpScreen        from '../screens/gamification/LevelUpScreen';

// ── Support ───────────────────────────────────────────────────────────────────
import FAQScreen      from '../screens/support/FAQScreen';
import TutorialScreen from '../screens/support/TutorialScreen';
import WhatsNewScreen from '../screens/support/WhatsNewScreen';
import EditProfileScreen      from '../screens/profile/EditProfileScreen';
import ProgressOverviewScreen from '../screens/profile/ProgressOverviewScreen';
import AchievementsScreen     from '../screens/profile/AchievementsScreen';

// ── Settings ──────────────────────────────────────────────────────────────────
import SettingsScreen             from '../screens/settings/SettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PrivacyPolicyScreen        from '../screens/settings/PrivacyPolicyScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const C = {
  bg:      '#FAF9F7',   // cream background — matches lightColors.bg
  surface: '#FFFFFF',   // white surface
  primary: '#92400E',   // amber-brown accent — matches lightColors.primary
  muted:   '#A8A29E',   // warm muted text
  border:  '#E8E4DF',   // warm border
};

function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    return { height: 56, paddingBottom: 8, paddingTop: 6 };
  }
  if (Platform.OS === 'ios') {
    return { height: 64 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 8 };
  }
  const androidExtra = insets.bottom > 0 ? insets.bottom : 16;
  return { height: 64 + androidExtra, paddingBottom: androidExtra + 4, paddingTop: 8 };
}

// ─────────────────────────────────────────────────────────────────────────────
// STACKS
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"         component={SplashScreen} />
      <Stack.Screen name="Welcome"        component={WelcomeScreen} />
      <Stack.Screen name="Feature1"       component={Feature1Screen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard"            component={DashboardScreen} />
      <Stack.Screen name="DailyGoal"            component={DailyGoalScreen} />
      <Stack.Screen name="Notifications"        component={NotificationsScreen} />
      <Stack.Screen name="Search"               component={SearchScreen} />
      <Stack.Screen name="TopicDetail"          component={TopicDetailScreen} />
      {/* Registered here so Search can push them directly — goBack() returns to Search */}
      <Stack.Screen name="SpeechHomeFromSearch"      component={SpeechHomeScreen} />
      <Stack.Screen name="ProgressOverview"          component={ProgressOverviewScreen_H} />
      <Stack.Screen name="SpeechDashboardFromSearch" component={SpeechDashboardScreen_H} />
      <Stack.Screen name="SpeechHistoryFromSearch"   component={SpeechHistoryScreen_H} />
    </Stack.Navigator>
  );
}

function DailyGoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DailyGoalMain" component={DailyGoalScreen} />
      <Stack.Screen name="TopicDetail"   component={TopicDetailScreen} />
    </Stack.Navigator>
  );
}

function AchievementsTabStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AchievementsMain" component={AchievementsScreen} />
    </Stack.Navigator>
  );
}

function SpeechStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpeechHome"     component={SpeechHomeScreen} />
      <Stack.Screen name="Record"         component={RecordScreen} />
      <Stack.Screen name="Analyzing"             component={AnalyzingScreen} />
      {/* Analysis Result — 9 separate screens, navigate() not push() */}
      <Stack.Screen name="TranscriptResult"     component={TranscriptResultScreen} />
      <Stack.Screen name="FillerWordBreakdown"  component={FillerWordBreakdownScreen} />
      <Stack.Screen name="ScoreBreakdown"       component={ScoreBreakdownScreen} />
      <Stack.Screen name="FeedbackResult"       component={FeedbackResultScreen} />
      <Stack.Screen name="ContentSuggestions"   component={ContentSuggestionsScreen} />
      <Stack.Screen name="SuggestedRephrasings" component={SuggestedRephrasingsScreen} />
      <Stack.Screen name="ImprovementTips"      component={ImprovementTipsScreen} />
      <Stack.Screen name="StructureFeedback"    component={StructureFeedbackScreen} />
      <Stack.Screen name="SevenDayPlan"         component={SevenDayPlanScreen} />
      <Stack.Screen name="FillerWords"    component={FillerWordsScreen} />
      <Stack.Screen name="SpeechProgress" component={SpeechProgressScreen} />
      <Stack.Screen name="SessionDetail"  component={SessionDetailScreen} />
      <Stack.Screen name="DailyChallenge" component={DailyChallengeScreen} />
      <Stack.Screen name="SpeechHistory"  component={SpeechHistoryScreen} />
      <Stack.Screen name="ShareResult"    component={ShareResultScreen} />
      <Stack.Screen name="Pronunciation"  component={PronunciationScreen} />
      <Stack.Screen name="PaceAndClarity"     component={PaceAndClarityScreen} />
      <Stack.Screen name="SpeechDashboard"   component={SpeechDashboardScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"              component={ProfileScreen} />
      <Stack.Screen name="EditProfile"          component={EditProfileScreen} />
      <Stack.Screen name="ProgressOverview"     component={ProgressOverviewScreen} />
      <Stack.Screen name="Achievements"         component={AchievementsScreen} />
      <Stack.Screen name="Settings"             component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="PrivacyPolicy"        component={PrivacyPolicyScreen} />
      <Stack.Screen name="DeleteAccount"        component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TABS
// ─────────────────────────────────────────────────────────────────────────────
function MainTabs() {
  const tabBarSize = useTabBarHeight();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8E4DF',
          borderTopWidth: 1,
          height: tabBarSize.height,
          paddingBottom: tabBarSize.paddingBottom,
          paddingTop: tabBarSize.paddingTop,
          ...(Platform.OS === 'web' && { position: 'fixed' as any, bottom: 0, left: 0, right: 0 }),
        },
        tabBarActiveTintColor: '#92400E',
        tabBarInactiveTintColor: '#A8A29E',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, [string, string]> = {
            Home:         ['home',          'home-outline'],
            Speech:       ['mic',           'mic-outline'],
            DailyGoals:   ['flag',          'flag-outline'],
            Achievements: ['trophy',        'trophy-outline'],
            Profile:      ['person-circle', 'person-circle-outline'],
          };
          const [active, inactive] = map[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: size + 16, height: size + 12 }}>
              {focused && (
                <View style={{
                  position: 'absolute', width: 36, height: 30, borderRadius: 12,
                  backgroundColor: 'rgba(146,64,14,0.10)',
                }} />
              )}
              <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home"         component={HomeStack}           options={{ title: 'Home' }} />
      <Tab.Screen name="Speech"       component={SpeechStack}         options={{ title: 'Speech' }} />
      <Tab.Screen name="DailyGoals"   component={DailyGoalsStack}     options={{ title: 'Goals' }} />
      <Tab.Screen name="Achievements" component={AchievementsTabStack} options={{ title: 'Earn' }} />
      <Tab.Screen name="Profile"      component={ProfileStack}        options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={st.loading}>
      <View style={st.box}>
        <ActivityIndicator size="large" color="#92400E" />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — reads from authStore (initialized in App.tsx) instead of maintaining
// its own listeners. Also loads the user profile whenever the user changes.
// ─────────────────────────────────────────────────────────────────────────────
export function RootNavigator() {
  const session = useAuthStore(s => s.session);
  const loading = useAuthStore(s => s.loading);
  const userId  = useAuthStore(s => s.user?.id);

  // Load / clear profile whenever the authenticated user changes
  useEffect(() => {
    if (userId) {
      useUserStore.getState().loadProfile(userId);
    } else {
      useUserStore.getState().clearProfile();
    }
  }, [userId]);

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <OnboardingStack />}
    </NavigationContainer>
  );
}

const st = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(146,64,14,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
