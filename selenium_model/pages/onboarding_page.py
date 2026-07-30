"""Page objects for the OnboardingStack screens.

Screens covered (src/navigation/RootNavigator.tsx lines 115-131):
  WelcomeScreen → Feature1/2/3Screen → GoalSelectionScreen →
  ExperienceLevelScreen → PermissionsScreen → RegisterScreen → LoginScreen

All locators are text-based XPath (react-native-web renders no semantic HTML,
no testID / aria-label props exist anywhere in this codebase).
"""
from pages.base_page import BasePage


class OnboardingPage(BasePage):
    """Covers Feature1/2/3Screen and the mid-onboarding navigation pills."""

    SKIP_TEXT             = "Skip"
    NEXT_TEXT             = "Next"
    GET_STARTED_TEXT      = "Get Started"
    CONTINUE_TEXT         = "Continue"

    # Feature screen content markers (src/screens/onboarding/Feature*.tsx)
    FEATURE1_MARKER       = "Speech Analysis"
    FEATURE2_MARKER       = "Daily Practice"
    FEATURE3_MARKER       = "Track Progress"

    def is_feature1_displayed(self) -> bool:
        return self.text_present(self.FEATURE1_MARKER, timeout=8)

    def is_feature2_displayed(self) -> bool:
        return self.text_present(self.FEATURE2_MARKER, timeout=8)

    def is_feature3_displayed(self) -> bool:
        return self.text_present(self.FEATURE3_MARKER, timeout=8)

    def click_skip(self):
        self.click_pressable(self.SKIP_TEXT)

    def click_next(self):
        self.click_pressable(self.NEXT_TEXT)

    def click_continue(self):
        self.click_pressable(self.CONTINUE_TEXT)

    def skip_is_visible(self, timeout: int = 5) -> bool:
        return self.pressable_exists(self.SKIP_TEXT, timeout=timeout)

    def next_is_visible(self, timeout: int = 5) -> bool:
        return self.pressable_exists(self.NEXT_TEXT, timeout=timeout)


class GoalSelectionPage(BasePage):
    """src/screens/onboarding/GoalSelectionScreen.tsx — multi-select goals."""

    HEADING_TEXT    = "What's your goal?"
    CONTINUE_TEXT   = "Continue"

    # Goal option texts rendered in the screen
    GOAL_OPTIONS = [
        "Job Interviews",
        "Public Speaking",
        "Business Presentations",
        "Daily Conversations",
        "Academic Speeches",
        "Personal Growth",
    ]

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def select_goal(self, goal_text: str):
        self.click_pressable(goal_text)

    def click_continue(self):
        self.click_pressable(self.CONTINUE_TEXT)

    def goal_option_exists(self, goal_text: str) -> bool:
        return self.pressable_exists(goal_text, timeout=5)


class ExperienceLevelPage(BasePage):
    """src/screens/onboarding/ExperienceLevelScreen.tsx — single-select level."""

    HEADING_TEXT  = "Your experience level"
    CONTINUE_TEXT = "Continue"

    LEVELS = ["Beginner", "Intermediate", "Advanced"]

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def select_level(self, level: str):
        self.click_pressable(level)

    def click_continue(self):
        self.click_pressable(self.CONTINUE_TEXT)

    def level_option_exists(self, level: str) -> bool:
        return self.pressable_exists(level, timeout=5)


class PermissionsPage(BasePage):
    """src/screens/onboarding/PermissionsScreen.tsx — mic/notifications."""

    HEADING_TEXT    = "Enable Permissions"
    ALLOW_MIC_TEXT  = "Allow Microphone"
    CONTINUE_TEXT   = "Continue"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def click_allow_mic(self):
        self.click_pressable(self.ALLOW_MIC_TEXT)

    def click_continue(self):
        self.click_pressable(self.CONTINUE_TEXT)

    def allow_mic_button_exists(self) -> bool:
        return self.pressable_exists(self.ALLOW_MIC_TEXT, timeout=5)
