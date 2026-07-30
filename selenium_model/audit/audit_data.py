"""Structured static-audit findings for VoxiraApp, gathered by manual + agent-assisted
source inspection (see FINAL_AUDIT_REPORT.md for methodology). Every row here cites a
real file (and line number where practical) — nothing here is fabricated/templated.

This module is data-only; audit/generate_report.py turns it into Excel sheets.
"""

PROJECT_NAME = "VoxiraApp"
PROJECT_TYPE = "Expo / React Native 0.81 (SDK 54) app, web target via react-native-web + Metro bundler"

# ---------------------------------------------------------------- Pages/Functionality map --
FUNCTIONALITY_MAP = [
    # (Page, Functionality, primary source file)
    ("WelcomeScreen", "Marketing landing + Get Started / Sign In CTAs", "src/screens/onboarding/WelcomeScreen.tsx"),
    ("Feature1/2/3Screen", "Onboarding carousel (Skip / Get Started)", "src/screens/onboarding/Feature1Screen.tsx"),
    ("GoalSelectionScreen", "Multi-select onboarding goals, saved to Supabase", "src/screens/onboarding/GoalSelectionScreen.tsx"),
    ("ExperienceLevelScreen", "Single-select skill level, saved to Supabase", "src/screens/onboarding/ExperienceLevelScreen.tsx"),
    ("PermissionsScreen", "Mic/notification permission requests", "src/screens/onboarding/PermissionsScreen.tsx"),
    ("LoginScreen", "Email/password + Google OAuth login form", "src/screens/auth/LoginScreen.tsx"),
    ("RegisterScreen", "Signup form with live password-strength meter", "src/screens/auth/RegisterScreen.tsx"),
    ("ForgotPasswordScreen", "Password reset request form", "src/screens/auth/ForgotPasswordScreen.tsx"),
    ("DeleteAccountScreen", "Multi-step account deletion wizard", "src/screens/auth/DeleteAccountScreen.tsx"),
    ("DashboardScreen", "Stat cards, recent sessions, pull-to-refresh", "src/screens/home/DashboardScreen.tsx"),
    ("SearchScreen", "Client-side text+category filter (static array)", "src/screens/home/SearchScreen.tsx"),
    ("DailyGoalScreen", "Stepper form for daily speech target + reminders", "src/screens/home/DailyGoalScreen.tsx"),
    ("NotificationsScreen", "Full CRUD on notifications table", "src/screens/home/NotificationsScreen.tsx"),
    ("TopicDetailScreen", "Static topic content viewer", "src/screens/home/TopicDetailScreen.tsx"),
    ("ProfileScreen", "Menu + sign out", "src/screens/profile/ProfileScreen.tsx"),
    ("EditProfileScreen", "Profile form + avatar upload to Supabase Storage", "src/screens/profile/EditProfileScreen.tsx"),
    ("ProgressOverviewScreen", "Stat aggregation from session history", "src/screens/profile/ProgressOverviewScreen.tsx"),
    ("AchievementsScreen", "12 hardcoded achievements evaluated against real session data", "src/screens/profile/AchievementsScreen.tsx"),
    ("SettingsScreen", "Dark mode, change email/password, delete account link", "src/screens/settings/SettingsScreen.tsx"),
    ("NotificationSettingsScreen", "6 notification toggles + reminder time", "src/screens/settings/NotificationSettingsScreen.tsx"),
    ("PrivacyPolicyScreen", "Static accordion content", "src/screens/settings/PrivacyPolicyScreen.tsx"),
    ("HelpScreen", "Search+FAQ+contact (ORPHANED — not registered in navigator)", "src/screens/settings/HelpScreen.tsx"),
    ("FAQScreen / TutorialScreen / WhatsNewScreen", "Static support content", "src/screens/support/"),
    ("RecordScreen", "Real audio recording (expo-av / MediaRecorder)", "src/screens/speech/RecordScreen.tsx"),
    ("AnalyzingScreen", "Speech analysis pipeline (Groq + AssemblyAI)", "src/screens/speech/AnalyzingScreen.tsx"),
    ("analysisResult/* (9 screens)", "Real data-driven analysis result wizard", "src/screens/speech/analysisResult/"),
    ("FillerWordsScreen / PronunciationScreen / PaceAndClarityScreen / ShareResultScreen / DailyChallengeScreen / SpeechProgressScreen", "Hardcoded/mock UI, inconsistent theming", "src/screens/speech/"),
    ("SpeechHistoryScreen", "Sort + filter + search over fetched sessions (client-side)", "src/screens/speech/SpeechHistoryScreen.tsx"),
    ("CompareSessionsScreen", "Real tabular 2-session metric comparison", "src/screens/speech/CompareSessionsScreen.tsx"),
    ("VocabularyBuilderScreen", "Real transcript word-frequency stats", "src/screens/speech/VocabularyBuilderScreen.tsx"),
    ("RewardsScreen / StreakCalendarScreen / LevelUpScreen", "Gamification (Coins/XP not persisted)", "src/screens/gamification/"),
]

# ---------------------------------------------------------------- Auth features --
AUTH_FEATURES = [
    ("Login", "src/screens/auth/LoginScreen.tsx:59", "supabase.auth.signInWithPassword"),
    ("Google Sign-In", "src/lib/googleAuth.ts:4", "signInWithGoogle() — web: signInWithOAuth, native: expo-auth-session"),
    ("Register", "src/screens/auth/RegisterScreen.tsx:158", "supabase.auth.signUp"),
    ("Forgot Password", "src/screens/auth/ForgotPasswordScreen.tsx:57", "supabase.auth.resetPasswordForEmail"),
    ("Delete Account", "src/screens/auth/DeleteAccountScreen.tsx:57-59", "re-auth + cascading deletes + signOut"),
    ("Logout (Profile)", "src/screens/profile/ProfileScreen.tsx:60", "authStore.signOut()"),
    ("Logout (Settings)", "src/screens/settings/SettingsScreen.tsx:34", "supabase.auth.signOut() — DUPLICATE implementation, bypasses store"),
    ("Change Email/Password", "src/screens/settings/SettingsScreen.tsx:46,64", "supabase.auth.updateUser"),
]

# ---------------------------------------------------------------- Explicit N/A categories --
NOT_APPLICABLE = [
    ("Payment flows", "Absent — no Stripe/payment SDK in package.json. SubscriptionScreen referenced in src/screens/settings/index barrel does not exist as a file (dead reference)."),
    ("Role-based access control / Admin", "Absent — profiles.level is a self-assessed skill tier, not an authorization role. No isAdmin/role checks anywhere."),
    ("Pagination", "Absent — all list fetches use a fixed .limit(50) or client-side .slice(); no page controls/cursors/infinite scroll."),
    ("Server-rendered/URL-based multi-page routing", "Absent — NavigationContainer has no `linking` config; all navigation is in-memory stack/tab state, unreachable by direct URL."),
]

# ---------------------------------------------------------------- Unused files --
UNUSED_FILES = [
    ("Button.tsx", "src/components/Button.tsx", "Empty stub (3 bytes); zero imports found anywhere in src/", "High"),
    ("Card.tsx", "src/components/Card.tsx", "Empty stub (3 bytes); zero imports found", "High"),
    ("Input.tsx", "src/components/Input.tsx", "Empty stub (3 bytes); zero imports found", "High"),
    ("Avatar.tsx", "src/components/Avatar.tsx", "Empty stub (3 bytes); zero imports found", "Medium"),
    ("Badge.tsx", "src/components/Badge.tsx", "Empty stub (3 bytes); zero imports found", "Medium"),
    ("ScoreRing.tsx", "src/components/ScoreRing.tsx", "Empty stub (3 bytes); zero imports found", "Medium"),
    ("ProgressBar.tsx", "src/components/ProgressBar.tsx", "Empty stub (3 bytes); zero imports found", "Medium"),
    ("WebScrollView.tsx", "src/components/WebScrollView.tsx", "Real implementation (629 bytes) but zero imports — superseded by web/index.html CSS + App.tsx runtime CSS injection", "Medium"),
    ("webScroll.ts", "src/utils/webScroll.ts", "webScrollStyle/webRootStyle exported but never imported", "Low"),
    ("api.ts", "src/lib/api.ts", "Empty stub (3 bytes)", "Medium"),
    ("storage.ts", "src/lib/storage.ts", "Empty stub (3 bytes)", "Medium"),
    ("navigation.ts", "src/types/navigation.ts", "Empty stub (3 bytes)", "Low"),
    ("database.ts", "src/types/database.ts", "Empty stub (3 bytes)", "Low"),
    ("AuthStack.tsx", "src/navigation/AuthStack.tsx", "Empty stub — superseded by inline OnboardingStack in RootNavigator.tsx", "Medium"),
    ("MainTabs.tsx", "src/navigation/MainTabs.tsx", "Empty stub — superseded by inline MainTabs() in RootNavigator.tsx", "Medium"),
    ("ProfileStack.tsx", "src/navigation/ProfileStack.tsx", "Empty stub — superseded by inline ProfileStack() in RootNavigator.tsx", "Medium"),
    ("SpeechStack.tsx", "src/navigation/SpeechStack.tsx", "Empty stub — superseded by inline SpeechStack() in RootNavigator.tsx", "Medium"),
    ("HelpScreen.tsx", "src/screens/settings/HelpScreen.tsx", "Fully implemented (search+FAQ+contact) but not registered in RootNavigator.tsx — unreachable", "High"),
    ("openai-proxy/index.ts", "supabase/functions/openai-proxy/index.ts", "Deployed-looking Edge Function with zero client-side callers", "Medium"),
    ("test-debug.js / test-full.js / test-register.js / test-screenshot.js / test-screenshot2.js", "repo root", "Ad-hoc Playwright debug scripts committed at project root, not part of any structured test suite", "Low"),
    ("dbg_*.png / screen_*.png (~3.5MB)", "repo root", "Debug screenshots committed to the repo root", "Low"),
    ("c:Users91637VoxiraAppsrcutils", "repo root", "Malformed empty directory artifact from an earlier shell command", "Low"),
]

# ---------------------------------------------------------------- Dead code --
DEAD_CODE = [
    ("src/services/mockData.ts", "fetchWeeklyReport", "10", "Replace TODO stub (returns null) with a real Supabase-backed implementation or remove the caller"),
    ("src/services/mockData.ts", "fetchToneAnalysis", "18", "Replace TODO stub (returns null) with a real implementation — ToneAnalysisScreen currently bypasses it entirely and reads sessionStore directly"),
    ("src/services/mockData.ts", "fetchVocabularyInsights", "26", "Replace TODO stub (returns null)"),
    ("src/services/mockData.ts", "WHATS_NEW_ITEMS", "41", "TODO: move hardcoded changelog to a real table"),
    ("src/navigation/RootNavigator.tsx", "GamificationStack()", "205", "Defined but never instantiated by any Tab/Stack.Screen — dead function"),
    ("src/navigation/RootNavigator.tsx", "SupportStack()", "215", "Defined but never instantiated — dead function (FAQ/Tutorial/WhatsNew reachable only via ProfileStack routes)"),
    ("src/screens/settings/index (barrel)", "export ... from './SubscriptionScreen'", "n/a", "References a file that does not exist — importing this barrel throws a module resolution error"),
    ("src/screens/profile/index (barrel)", "export ... from './LeaderboardScreen'", "n/a", "References a file that does not exist"),
    ("src/screens/speech/index (barrel)", "export ... from './AnalysisResultScreen'", "n/a", "References a file that does not exist"),
    ("src/screens/auth/SplashScreen.tsx", "navigation.replace('MainTabs')", "100", "'MainTabs' is not a registered screen name inside OnboardingStack — unreachable/latent bug if this branch ever executes"),
]

# ---------------------------------------------------------------- Confirmed defects found via live Selenium/API execution --
# These are empirically confirmed (screenshots + console/network evidence in reports/), not
# static-analysis guesses. See FINAL_AUDIT_REPORT.md "Root Cause Notes" for the debugging trail.
LIVE_CONFIRMED_DEFECTS = [
    (
        "assemblyai-transcribe / assemblyai-poll Edge Functions return HTTP 404 on the live Supabase project",
        "supabase/functions/assemblyai-transcribe/index.ts, supabase/functions/assemblyai-poll/index.ts",
        "Source for both functions exists in the repo and src/services/speechService.ts:120,141 calls them by "
        "the exact same names via supabase.functions.invoke(). A direct POST to "
        "{SUPABASE_URL}/functions/v1/assemblyai-transcribe (and -poll) returns 404, while the sibling "
        "groq-analysis function returns a non-404 response from the same project. This means the two functions "
        "were never deployed (or were deleted) from this Supabase project — the entire RecordScreen -> "
        "AnalyzingScreen speech-transcription pipeline would fail in production today.",
        "High",
    ),
    (
        "LoginScreen: submitting a completely empty form gives zero visible feedback",
        "src/screens/auth/LoginScreen.tsx:326 (onPress={handleSubmit(onLogin)}), errors rendered at lines 282,316",
        "Reproduced via Selenium: clicked 'Sign In' with both fields empty. Screenshot shows no red border, no "
        "error text, no loading spinner; browser console shows no errors; no network request fired; input "
        "values remain empty strings. errors.email/errors.password are wired to render inline text "
        "(unlike RegisterScreen, LoginScreen has no touched-state gate), so this is a genuine UX defect: a user "
        "who taps Sign In without filling the form gets no indication anything happened.",
        "Medium",
    ),
    (
        "Welcome screen causes ~80px horizontal overflow at 1440px viewport width",
        "src/screens/onboarding/WelcomeScreen.tsx",
        "Selenium measured document.documentElement.scrollWidth=1502 vs window.innerWidth=1422 on initial load "
        "at a 1440x1024 window. Some element on the Welcome screen exceeds the viewport width.",
        "Low",
    ),
]

# ---------------------------------------------------------------- Duplicate / inconsistent implementations --
DUPLICATE_OR_INCONSISTENT = [
    ("Two sign-out implementations", "ProfileScreen.tsx:60 uses authStore.signOut(); SettingsScreen.tsx:34 calls supabase.auth.signOut() directly, bypassing the Zustand store", "Medium"),
    ("Gamification currency naming", "DailyChallengeScreen.tsx calls it 'XP'; AchievementsScreen.tsx/RewardsScreen.tsx call it 'Coins' — same underlying (unpersisted) concept, inconsistent terminology", "Low"),
    ("Two overlapping web-scroll CSS mechanisms", "web/index.html inline <style> AND App.tsx:11-52 runtime-injected CSS both patch react-native-web scroll behavior; WebScrollView.tsx component was seemingly meant to replace both but is unused", "Medium"),
    ("HomeStack duplicate screen registrations", "SpeechHomeFromSearch / SpeechDashboardFromSearch / SpeechHistoryFromSearch re-register the same Speech screens under new names purely for Search deep-links (RootNavigator.tsx:133-148)", "Low"),
    ("Misleading module name", "src/lib/openai.ts implements the Groq wrapper (chatGroq, calls groq-analysis function) — has nothing to do with OpenAI despite the filename", "Low"),
    ("Identical placeholder text reused across screens", "LoginScreen.tsx and ForgotPasswordScreen.tsx both use the exact TextInput placeholder \"you@email.com\" for their email field. Combined with React Navigation's default stack behavior of keeping the previous screen mounted (off-screen, zero-size) rather than unmounting it on push, this makes the two inputs indistinguishable by placeholder alone while both are in the DOM — discovered because it broke an automation locator (see selenium_model/pages/base_page.py comments); would equally confuse any other placeholder-based tooling (browser autofill heuristics, other test frameworks).", "Low"),
]

# ---------------------------------------------------------------- Large files (refactor candidates) --
LARGE_FILES_NOTE = "src/navigation/RootNavigator.tsx (352 lines) defines every stack/tab inline in one file, including two dead sub-stacks (GamificationStack, SupportStack). Recommend splitting into the (already-scaffolded-but-empty) AuthStack.tsx/MainTabs.tsx/ProfileStack.tsx/SpeechStack.tsx files, or deleting those stubs if the inline approach is intentional."

# ---------------------------------------------------------------- Security observations --
SECURITY_OBSERVATIONS = [
    ("Client-side API key usage", "services/speechService.ts calls the AssemblyAI REST API directly with a client-embedded key (EXPO_PUBLIC_ASSEMBLYAI_KEY) as a fallback path, alongside the proper server-side Edge Function path (assemblyai-transcribe/poll). Client-embedded keys are extractable from any web/mobile build.", "Medium", "Remove the direct-fetch fallback and route all AssemblyAI calls through the Edge Function exclusively."),
    ("Dead Edge Function still deployed", "openai-proxy Edge Function has no client caller but (if deployed) remains an open network-reachable endpoint.", "Low", "Remove the deployment if truly unused, or confirm it's intentionally reserved."),
    ("Account deletion re-auth", "DeleteAccountScreen re-authenticates via signInWithPassword before deleting — a good practice; no negative finding here, noted for completeness.", "Low", "None — reference the pattern for other destructive flows."),
    ("No rate-limit/backoff visible on auth forms", "LoginScreen/RegisterScreen/ForgotPasswordScreen submit directly to Supabase on every click with no client-side debounce; relies entirely on Supabase's own rate limiting.", "Low", "Consider a short client-side cooldown to reduce accidental duplicate submissions and email-quota exhaustion (RegisterScreen's own error handling already anticipates Supabase email rate-limit errors)."),
]

# ---------------------------------------------------------------- Recommendations --
RECOMMENDATIONS = [
    ("High", "Add testID/accessibilityLabel props to all interactive elements (currently zero exist app-wide).", "Blocks reliable automated testing (this suite had to fall back to text-content XPath matching) and reduces screen-reader usability for real users."),
    ("High", "Delete or implement the 7 empty component stubs in src/components/ (Button, Card, Input, Avatar, Badge, ScoreRing, ProgressBar) and the 4 empty navigation stack stubs.", "Dead/empty files mislead contributors into thinking a shared component library exists; onboarding cost for new engineers."),
    ("High", "Fix the three broken barrel-file exports (SubscriptionScreen, LeaderboardScreen, AnalysisResultScreen) referencing non-existent files.", "Any future import of these barrels will throw a build-breaking module resolution error."),
    ("Medium", "Register HelpScreen.tsx in the navigator or remove it.", "Fully-built screen is currently unreachable by users — wasted implementation effort."),
    ("Medium", "Consolidate the two sign-out implementations into a single authStore.signOut() call site.", "SettingsScreen's direct supabase.auth.signOut() call bypasses Zustand state cleanup, risking stale `session`/`user` state after logout from Settings."),
    ("Medium", "Consolidate the two overlapping web-scroll-CSS mechanisms (web/index.html + App.tsx runtime injection) into one, and either wire up or delete WebScrollView.tsx/webScroll.ts.", "Two independent systems solving the same problem is a maintenance hazard — a future fix applied to only one will appear to silently fail."),
    ("Medium", "Route AssemblyAI calls exclusively through the assemblyai-transcribe/poll Edge Functions; remove the direct-fetch client fallback that embeds the API key.", "Reduces API key exposure surface in web/mobile bundles."),
    ("Low", "Move the 5 root-level debug Playwright scripts and ~3.5MB of debug screenshots out of version control (into this new selenium_model/ framework or .gitignore).", "Keeps the repository root clean; this selenium_model suite is the intended structured replacement."),
    ("Low", "Standardize gamification terminology ('XP' vs 'Coins') and persist it server-side instead of computing client-side.", "Currently a cosmetic inconsistency; if gamification becomes a real retention feature, unpersisted state will not survive reinstall/multi-device use."),
]
