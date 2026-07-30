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
        return all(self.pressable_exists(label, timeout=3) for label in ("Home", "Speech", "Profile"))

    def go_to(self, tab_label: str):
        self.click_pressable(tab_label)
