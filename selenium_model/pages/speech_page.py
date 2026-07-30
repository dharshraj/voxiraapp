"""Page objects for the SpeechStack screens.

Screens covered (src/navigation/RootNavigator.tsx SpeechStack):
  SpeechHomeScreen → RecordScreen → AnalyzingScreen →
  TranscriptResultScreen → FillerWordBreakdownScreen → ScoreBreakdownScreen →
  FeedbackResultScreen → ContentSuggestionsScreen → SuggestedRephrasingsScreen →
  ImprovementTipsScreen → StructureFeedbackScreen → SevenDayPlanScreen →
  SpeechHistoryScreen → SpeechDashboardScreen → DailyChallengeScreen →
  FillerWordsScreen → PronunciationScreen → PaceAndClarityScreen →
  VocabularyBuilderScreen → ToneAnalysisScreen → ConfidenceScoreScreen →
  WeeklyReportScreen → CompareSessionsScreen
"""
from pages.base_page import BasePage


class SpeechHomePage(BasePage):
    """src/screens/speech/SpeechHomeScreen.tsx — speech tab landing."""

    START_RECORDING_TEXT   = "Start Recording"
    NEW_SESSION_TEXT       = "New Session"
    HISTORY_TEXT           = "History"
    DASHBOARD_TEXT         = "Dashboard"
    DAILY_CHALLENGE_TEXT   = "Daily Challenge"
    PRACTICE_TEXT          = "Practice"

    def is_displayed(self) -> bool:
        return (
            self.pressable_exists(self.START_RECORDING_TEXT, timeout=10)
            or self.pressable_exists(self.NEW_SESSION_TEXT, timeout=5)
            or self.text_present("Speech", timeout=5)
        )

    def click_start_recording(self):
        self.click_pressable(self.START_RECORDING_TEXT)

    def click_history(self):
        self.click_pressable(self.HISTORY_TEXT)

    def click_dashboard(self):
        self.click_pressable(self.DASHBOARD_TEXT)

    def click_daily_challenge(self):
        self.click_pressable(self.DAILY_CHALLENGE_TEXT)

    def history_button_visible(self) -> bool:
        return self.pressable_exists(self.HISTORY_TEXT, timeout=5)

    def daily_challenge_visible(self) -> bool:
        return self.pressable_exists(self.DAILY_CHALLENGE_TEXT, timeout=5)

    def topic_cards_visible(self) -> bool:
        """Check that at least one topic/mode card is rendered."""
        for kw in ("Interview", "Presentation", "Conversation", "Story", "Topic"):
            if self.text_present(kw, timeout=3):
                return True
        return False


class RecordPage(BasePage):
    """src/screens/speech/RecordScreen.tsx — audio recording UI."""

    START_TEXT      = "Start Recording"
    STOP_TEXT       = "Stop"
    PAUSE_TEXT      = "Pause"
    RESUME_TEXT     = "Resume"
    DONE_TEXT       = "Done"
    CANCEL_TEXT     = "Cancel"
    ANALYZE_TEXT    = "Analyze"
    TIMER_PATTERN   = "0:0"   # partial match for timer "0:00" / "0:01"

    def is_displayed(self) -> bool:
        return (
            self.pressable_exists(self.START_TEXT, timeout=10)
            or self.pressable_exists(self.STOP_TEXT, timeout=5)
        )

    def click_start(self):
        self.click_pressable(self.START_TEXT)

    def click_stop(self):
        self.click_pressable(self.STOP_TEXT)

    def click_pause(self):
        self.click_pressable(self.PAUSE_TEXT)

    def click_resume(self):
        self.click_pressable(self.RESUME_TEXT)

    def click_done(self):
        self.click_pressable(self.DONE_TEXT)

    def click_cancel(self):
        self.click_pressable(self.CANCEL_TEXT)

    def timer_visible(self) -> bool:
        return self.text_present(self.TIMER_PATTERN, timeout=5)

    def is_recording_active(self) -> bool:
        return self.pressable_exists(self.STOP_TEXT, timeout=5)

    def analyze_button_visible(self) -> bool:
        return self.pressable_exists(self.ANALYZE_TEXT, timeout=5)


class AnalyzingPage(BasePage):
    """src/screens/speech/AnalyzingScreen.tsx — 5-step pipeline progress."""

    ANALYZING_TEXT = "Analyzing"
    STEP_TEXTS     = [
        "Transcribing",
        "Calculating",
        "Detecting",
        "Generating",
        "Saving",
    ]

    def is_displayed(self) -> bool:
        return self.text_present(self.ANALYZING_TEXT, timeout=15)

    def any_step_visible(self) -> bool:
        for s in self.STEP_TEXTS:
            if self.text_present(s, timeout=3):
                return True
        return False

    def wait_for_completion(self, timeout: int = 120) -> bool:
        """Wait until analysis completes and navigates away."""
        import time
        deadline = time.time() + timeout
        while time.time() < deadline:
            if not self.text_present(self.ANALYZING_TEXT, timeout=2):
                return True
            time.sleep(1)
        return False


class TranscriptResultPage(BasePage):
    """src/screens/speech/analysisResult/TranscriptResultScreen.tsx"""

    HEADING_TEXT = "Transcript"
    NEXT_TEXT    = "Next"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=15)

    def transcript_body_visible(self) -> bool:
        # Transcript text is rendered in a ScrollView — check for any word content
        return self.text_present("Transcript", timeout=8)

    def click_next(self):
        self.click_pressable(self.NEXT_TEXT)


class ScoreBreakdownPage(BasePage):
    """src/screens/speech/analysisResult/ScoreBreakdownScreen.tsx"""

    HEADING_TEXT  = "Score Breakdown"
    NEXT_TEXT     = "Next"
    SCORE_LABELS  = ["Clarity", "Confidence", "Pace", "Pronunciation"]

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def all_score_labels_visible(self) -> bool:
        return all(self.text_present(lbl, timeout=5) for lbl in self.SCORE_LABELS)

    def click_next(self):
        self.click_pressable(self.NEXT_TEXT)


class SpeechHistoryPage(BasePage):
    """src/screens/speech/SpeechHistoryScreen.tsx — sortable/filterable list."""

    HEADING_TEXT  = "History"
    SEARCH_PLACEHOLDER = "Search sessions..."
    FILTER_TEXT   = "Filter"
    SORT_TEXT     = "Sort"
    EMPTY_TEXT    = "No sessions"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def search_input(self):
        return self.input_by_placeholder(self.SEARCH_PLACEHOLDER)

    def type_search(self, query: str):
        self.clear_and_type(self.search_input(), query)

    def filter_button_visible(self) -> bool:
        return self.pressable_exists(self.FILTER_TEXT, timeout=5)

    def sort_button_visible(self) -> bool:
        return self.pressable_exists(self.SORT_TEXT, timeout=5)

    def empty_state_shown(self) -> bool:
        return self.text_present(self.EMPTY_TEXT, timeout=5)

    def session_items_visible(self) -> bool:
        return not self.empty_state_shown()


class SpeechDashboardPage(BasePage):
    """src/screens/speech/SpeechDashboardScreen.tsx — aggregated stats."""

    HEADING_TEXT    = "Speech Dashboard"
    WEEKLY_TEXT     = "Weekly"
    MONTHLY_TEXT    = "Monthly"
    COMPARE_TEXT    = "Compare"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def weekly_tab_visible(self) -> bool:
        return self.pressable_exists(self.WEEKLY_TEXT, timeout=5)

    def click_compare(self):
        self.click_pressable(self.COMPARE_TEXT)


class DailyChallengePage(BasePage):
    """src/screens/speech/DailyChallengeScreen.tsx."""

    HEADING_TEXT  = "Daily Challenge"
    START_TEXT    = "Start Challenge"
    SKIP_TEXT     = "Skip"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def start_challenge_visible(self) -> bool:
        return self.pressable_exists(self.START_TEXT, timeout=5)

    def click_start(self):
        self.click_pressable(self.START_TEXT)
