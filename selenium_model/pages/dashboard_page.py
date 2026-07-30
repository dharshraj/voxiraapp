"""Page object for DashboardScreen (src/screens/home/DashboardScreen.tsx).
The dashboard is the landing screen after authenticated login — shows stat
cards, recent sessions, and pull-to-refresh."""
from pages.base_page import BasePage


class DashboardPage(BasePage):
    """Authenticated home dashboard."""

    HEADING_TEXT        = "Dashboard"
    DAILY_GOAL_TEXT     = "Daily Goal"
    RECENT_TEXT         = "Recent"
    SEARCH_ICON_TEXT    = "Search"
    NOTIFICATIONS_TEXT  = "Notifications"
    STREAK_TEXT         = "Streak"

    def is_displayed(self) -> bool:
        # Dashboard can show either "Dashboard" heading or stat cards
        return (
            self.text_present("Dashboard", timeout=10)
            or self.text_present("Recent Sessions", timeout=5)
            or self.text_present("Your Progress", timeout=5)
        )

    def search_icon_visible(self) -> bool:
        return self.pressable_exists(self.SEARCH_ICON_TEXT, timeout=5)

    def notifications_icon_visible(self) -> bool:
        return self.pressable_exists(self.NOTIFICATIONS_TEXT, timeout=5)

    def daily_goal_card_visible(self) -> bool:
        return self.text_present(self.DAILY_GOAL_TEXT, timeout=5)

    def streak_card_visible(self) -> bool:
        return self.text_present(self.STREAK_TEXT, timeout=5)

    def click_search(self):
        self.click_pressable(self.SEARCH_ICON_TEXT)

    def click_notifications(self):
        self.click_pressable(self.NOTIFICATIONS_TEXT)

    def click_daily_goal(self):
        self.click_pressable(self.DAILY_GOAL_TEXT)

    def stat_cards_rendered(self) -> bool:
        """At least one metric card visible (score / sessions / streak)."""
        for kw in ("Score", "Sessions", "Streak", "Minutes", "Words"):
            if self.text_present(kw, timeout=3):
                return True
        return False


class SearchPage(BasePage):
    """src/screens/home/SearchScreen.tsx — client-side text+category filter."""

    SEARCH_PLACEHOLDER = "Search topics, skills..."
    BACK_TEXT          = "Back"

    def is_displayed(self) -> bool:
        return (
            self.text_present("Search", timeout=8)
            or self.pressable_exists(self.BACK_TEXT, timeout=5)
        )

    def search_input(self):
        return self.input_by_placeholder(self.SEARCH_PLACEHOLDER)

    def type_query(self, query: str):
        self.clear_and_type(self.search_input(), query)

    def results_present(self, timeout: int = 5) -> bool:
        return (
            self.text_present("result", timeout=timeout)
            or self.text_present("topic", timeout=timeout)
            or self.text_present("No results", timeout=timeout)
        )

    def no_results_shown(self) -> bool:
        return self.text_present("No results", timeout=5)


class NotificationsPage(BasePage):
    """src/screens/home/NotificationsScreen.tsx."""

    HEADING_TEXT  = "Notifications"
    MARK_ALL_TEXT = "Mark all"
    EMPTY_TEXT    = "No notifications"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def mark_all_read(self):
        self.click_pressable(self.MARK_ALL_TEXT)

    def empty_state_shown(self) -> bool:
        return self.text_present(self.EMPTY_TEXT, timeout=5)

    def notification_items_visible(self) -> bool:
        return not self.empty_state_shown()


class DailyGoalPage(BasePage):
    """src/screens/home/DailyGoalScreen.tsx — stepper form for daily target."""

    HEADING_TEXT  = "Daily Goal"
    SAVE_TEXT     = "Save"
    INCREASE_TEXT = "+"
    DECREASE_TEXT = "−"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def click_increase(self):
        self.click_pressable(self.INCREASE_TEXT)

    def click_decrease(self):
        self.click_pressable(self.DECREASE_TEXT)

    def click_save(self):
        self.click_pressable(self.SAVE_TEXT)

    def saved_confirmation_visible(self) -> bool:
        return (
            self.text_present("Saved", timeout=5)
            or self.text_present("Updated", timeout=5)
            or self.text_present("Goal set", timeout=5)
        )
