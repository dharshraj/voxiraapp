import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ── Auth & Onboarding ─────────────────────────────────────────────────────────
import SplashScreen         from '../screens/auth/SplashScreen';
import WelcomeScreen        from '../screens/onboarding/WelcomeScreen';
import Feature1Screen       from '../screens/onboarding/Feature1Screen';
import Feature2Screen       from '../screens/onboarding/Feature2Screen';
import Feature3Screen       from '../screens/onboarding/Feature3Screen';
import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterScreen       from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import DeleteAccountScreen  from '../screens/auth/DeleteAccountScreen';

// ── Home ──────────────────────────────────────────────────────────────────────
import DashboardScreen     from '../screens/home/DashboardScreen';
import DailyGoalScreen     from '../screens/home/DailyGoalScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import SearchScreen        from '../screens/home/SearchScreen';

// ── Speech ────────────────────────────────────────────────────────────────────
import SpeechHomeScreen     from '../screens/speech/SpeechHomeScreen';
import RecordScreen         from '../screens/speech/RecordScreen';
import AnalyzingScreen      from '../screens/speech/AnalyzingScreen';
import AnalysisResultScreen from '../screens/speech/AnalysisResultScreen';
import FillerWordsScreen    from '../screens/speech/FillerWordsScreen';
import SpeechProgressScreen from '../screens/speech/SpeechProgressScreen';
import SessionDetailScreen  from '../screens/speech/SessionDetailScreen';
import DailyChallengeScreen from '../screens/speech/DailyChallengeScreen';
import SpeechHistoryScreen  from '../screens/speech/SpeechHistoryScreen';
import ShareResultScreen    from '../screens/speech/ShareResultScreen';
import PronunciationScreen  from '../screens/speech/PronunciationScreen';
import PaceAndClarityScreen from '../screens/speech/PaceAndClarityScreen';

// ── Writing ───────────────────────────────────────────────────────────────────
import WritingHomeScreen       from '../screens/writing/WritingHomeScreen';
import NewWritingScreen        from '../screens/writing/NewWritingScreen';
import GrammarResultScreen     from '../screens/writing/GrammarResultScreen';
import ToneAnalysisScreen      from '../screens/writing/ToneAnalysisScreen';
import StyleSuggestionsScreen  from '../screens/writing/StyleSuggestionsScreen';
import RewriteScreen         from '../screens/writing/RewriteViewScreen';
import WritingHistoryScreen    from '../screens/writing/WritingHistoryScreen';
import WritingProgressScreen   from '../screens/writing/WritingProgressScreen';
import EmailTemplateScreen     from '../screens/writing/EmailTemplateScreen';
import TemplatesLibraryScreen  from '../screens/writing/TemplatesLibraryScreen';

// ── Interview ─────────────────────────────────────────────────────────────────
import InterviewHomeScreen    from '../screens/interview/InterviewHomeScreen';
import ChooseRoleScreen       from '../screens/interview/ChooseRoleScreen';
import InterviewSetupScreen   from '../screens/interview/InterviewSetupScreen';
import LiveInterviewScreen    from '../screens/interview/LiveInterviewScreen';
import ThinkingScreen         from '../screens/interview/ThinkingScreen';
import FeedbackScreen         from '../screens/interview/FeedbackScreen';
import ScoreBreakdownScreen   from '../screens/interview/ScoreBreakdownScreen';
import InterviewHistoryScreen from '../screens/interview/InterviewHistoryScreen';
import QuestionBankScreen     from '../screens/interview/QuestionBankScreen';
import InterviewTipsScreen    from '../screens/interview/InterviewTipsScreen';

// ── Profile ───────────────────────────────────────────────────────────────────
import ProfileScreen          from '../screens/profile/ProfileScreen';
import EditProfileScreen      from '../screens/profile/EditProfileScreen';
import ProgressOverviewScreen from '../screens/profile/ProgressOverviewScreen';
import AchievementsScreen     from '../screens/profile/AchievementsScreen';

// ── Settings ──────────────────────────────────────────────────────────────────
import SettingsScreen             from '../screens/settings/SettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import SubscriptionScreen         from '../screens/settings/SubscriptionScreen';
import PrivacyPolicyScreen        from '../screens/settings/PrivacyPolicyScreen';
import HelpScreen                 from '../screens/settings/HelpScreen';

import PlaceholderScreen from './PlaceholderScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const C = {
  bg:'#05050F', surface:'#0C0C1E',
  primary:'#8B5CF6', muted:'rgba(241,245,249,0.30)',
  border:'rgba(255,255,255,0.07)',
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB BAR HEIGHT — platform-aware so Android gesture bar never overlaps tabs
// ─────────────────────────────────────────────────────────────────────────────
function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    return { height: 56, paddingBottom: 8, paddingTop: 6 };
  }
  if (Platform.OS === 'ios') {
    return { height: 64 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 8 };
  }
  // Android: insets.bottom is 0 on older devices with buttons, up to ~48 on gesture nav
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
      <Stack.Screen name="Feature2"       component={Feature2Screen} />
      <Stack.Screen name="Feature3"       component={Feature3Screen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard"     component={DashboardScreen} />
      <Stack.Screen name="DailyGoal"     component={DailyGoalScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Search"        component={SearchScreen} />
    </Stack.Navigator>
  );
}

function SpeechStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpeechHome"     component={SpeechHomeScreen} />
      <Stack.Screen name="Record"         component={RecordScreen} />
      <Stack.Screen name="Analyzing"      component={AnalyzingScreen} />
      <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
      <Stack.Screen name="FillerWords"    component={FillerWordsScreen} />
      <Stack.Screen name="SpeechProgress" component={SpeechProgressScreen} />
      <Stack.Screen name="SessionDetail"  component={SessionDetailScreen} />
      <Stack.Screen name="DailyChallenge" component={DailyChallengeScreen} />
      <Stack.Screen name="SpeechHistory"  component={SpeechHistoryScreen} />
      <Stack.Screen name="ShareResult"    component={ShareResultScreen} />
      <Stack.Screen name="Pronunciation"  component={PronunciationScreen} />
      <Stack.Screen name="PaceAndClarity" component={PaceAndClarityScreen} />
    </Stack.Navigator>
  );
}

function WritingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WritingHome"            component={WritingHomeScreen} />
      <Stack.Screen name="NewWritingScreen"       component={NewWritingScreen} />
      <Stack.Screen name="GrammarResultScreen"    component={GrammarResultScreen} />
      <Stack.Screen name="ToneAnalysisScreen"     component={ToneAnalysisScreen} />
      <Stack.Screen name="StyleSuggestionsScreen" component={StyleSuggestionsScreen} />
      <Stack.Screen name="RewriteScreen"          component={RewriteScreen} />
      <Stack.Screen name="WritingHistoryScreen"   component={WritingHistoryScreen} />
      <Stack.Screen name="WritingProgressScreen"  component={WritingProgressScreen} />
      <Stack.Screen name="EmailTemplateScreen"    component={EmailTemplateScreen} />
      <Stack.Screen name="TemplatesLibraryScreen" component={TemplatesLibraryScreen} />
    </Stack.Navigator>
  );
}

function InterviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InterviewHome"    component={InterviewHomeScreen} />
      <Stack.Screen name="ChooseRole"       component={ChooseRoleScreen} />
      <Stack.Screen name="InterviewSetup"   component={InterviewSetupScreen} />
      <Stack.Screen name="LiveInterview"    component={LiveInterviewScreen} />
      <Stack.Screen name="Thinking"         component={ThinkingScreen} />
      <Stack.Screen name="Feedback"         component={FeedbackScreen} />
      <Stack.Screen name="ScoreBreakdown"   component={ScoreBreakdownScreen} />
      <Stack.Screen name="InterviewHistory" component={InterviewHistoryScreen} />
      <Stack.Screen name="QuestionBank"     component={QuestionBankScreen} />
      <Stack.Screen name="InterviewTips"    component={InterviewTipsScreen} />
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
      <Stack.Screen name="Subscription"         component={SubscriptionScreen} />
      <Stack.Screen name="Help"                 component={HelpScreen} />
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
          backgroundColor: '#0C0C1E',
          borderTopColor: 'rgba(255,255,255,0.07)',
          borderTopWidth: 1,
          height: tabBarSize.height,
          paddingBottom: tabBarSize.paddingBottom,
          paddingTop: tabBarSize.paddingTop,
          ...(Platform.OS === 'web' && { position: 'fixed' as any, bottom: 0, left: 0, right: 0 }),
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'rgba(241,245,249,0.30)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, [string, string]> = {
            Home:      ['home',          'home-outline'],
            Speech:    ['mic',           'mic-outline'],
            Writing:   ['create',        'create-outline'],
            Interview: ['people',        'people-outline'],
            Profile:   ['person-circle', 'person-circle-outline'],
          };
          const [active, inactive] = map[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: size + 16, height: size + 12 }}>
              {focused && (
                <View style={{
                  position: 'absolute', width: 36, height: 30, borderRadius: 12,
                  backgroundColor: 'rgba(139,92,246,0.15)',
                }}/>
              )}
              <Ionicons name={(focused ? active : inactive) as any} size={size} color={color}/>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeStack}      options={{ title: 'Home' }} />
      <Tab.Screen name="Speech"    component={SpeechStack}    options={{ title: 'Speech' }} />
      <Tab.Screen name="Writing"   component={WritingStack}   options={{ title: 'Writing' }} />
      <Tab.Screen name="Interview" component={InterviewStack} options={{ title: 'Interview' }} />
      <Tab.Screen name="Profile"   component={ProfileStack}   options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING
// ─────────────────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={st.loading}>
      <View style={st.box}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — race-condition safe auth check for web + native
// Problem on web: onAuthStateChange sometimes fires BEFORE getSession resolves,
// or getSession resolves but the listener never fires → app stuck on loader.
// Solution: whichever resolves first wins; 5s safety timeout as last resort.
// ─────────────────────────────────────────────────────────────────────────────
export function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // resolved ref prevents double-setting after the first answer arrives
  const resolvedRef = React.useRef(false);

  const resolve = useCallback((sess: Session | null) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setSession(sess);
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Subscribe to auth changes — fires immediately on web if session exists
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        // Always update session on subsequent changes (login / logout)
        setSession(sess);
        resolve(sess);
      }
    );

    // 2. Also call getSession directly — needed when listener is slow on web
    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => resolve(sess))
      .catch(() => resolve(null));

    // 3. Safety net: unblock after 5 seconds regardless
    const timeout = setTimeout(() => resolve(null), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [resolve]);

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
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#0C0C1E',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
