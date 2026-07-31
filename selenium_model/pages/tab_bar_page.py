from pages.base_page import BasePage


class TabBarPage(BasePage):
    """Bottom tab bar defined inline in src/navigation/RootNavigator.tsx (MainTabs,
    lines ~247-295). Only reachable once an authenticated session exists."""

    TABS = {
        "Home": "Home",
        "Speech": "Speech",
        "Goals": "DailyGoals",
        "Earn": "Achievements",
        "Profile": "Profile",
    }

    def is_displayed(self) -> bool:
        # Allow up to 20s for the Supabase auth round-trip + onAuthStateChange
        # + React Navigation stack swap to complete before checking tab labels.
        return all(self.pressable_exists(label, timeout=20) for label in ("Home", "Speech", "Profile"))

    def is_displayed_quick(self) -> bool:
        """Fast check (3s) used when we expect the tab bar NOT to be present."""
        return any(self.pressable_exists(label, timeout=3) for label in ("Home", "Speech", "Profile"))

    def go_to(self, tab_label: str):
        self.click_pressable(tab_label)
