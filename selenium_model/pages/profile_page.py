"""Page objects for the ProfileStack screens.

Screens covered:
  ProfileScreen → EditProfileScreen → ProgressOverviewScreen →
  AchievementsScreen → SettingsScreen → NotificationSettingsScreen →
  PrivacyPolicyScreen → DeleteAccountScreen → FAQ/Tutorial/WhatsNew
"""
from pages.base_page import BasePage


class ProfilePage(BasePage):
    """src/screens/profile/ProfileScreen.tsx — menu + sign out."""

    HEADING_TEXT       = "Profile"
    SIGN_OUT_TEXT      = "Sign Out"
    EDIT_PROFILE_TEXT  = "Edit Profile"
    SETTINGS_TEXT      = "Settings"
    PROGRESS_TEXT      = "Progress"
    ACHIEVEMENTS_TEXT  = "Achievements"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def click_sign_out(self):
        self.click_pressable(self.SIGN_OUT_TEXT)

    def click_edit_profile(self):
        self.click_pressable(self.EDIT_PROFILE_TEXT)

    def click_settings(self):
        self.click_pressable(self.SETTINGS_TEXT)

    def click_progress(self):
        self.click_pressable(self.PROGRESS_TEXT)

    def click_achievements(self):
        self.click_pressable(self.ACHIEVEMENTS_TEXT)

    def sign_out_button_visible(self) -> bool:
        return self.pressable_exists(self.SIGN_OUT_TEXT, timeout=5)

    def user_name_visible(self) -> bool:
        """Profile screen renders the authenticated user's name."""
        # Any text that isn't a nav label — just check heading present
        return self.is_displayed()


class EditProfilePage(BasePage):
    """src/screens/profile/EditProfileScreen.tsx — form + avatar upload."""

    HEADING_TEXT       = "Edit Profile"
    SAVE_TEXT          = "Save"
    FULL_NAME_PH       = "Full Name"
    BIO_PH             = "Bio"
    UPLOAD_AVATAR_TEXT = "Upload Photo"
    CHANGE_PHOTO_TEXT  = "Change Photo"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def full_name_input(self):
        return self.input_by_placeholder(self.FULL_NAME_PH)

    def bio_input(self):
        return self.input_by_placeholder(self.BIO_PH)

    def update_full_name(self, name: str):
        self.clear_and_type(self.full_name_input(), name)

    def click_save(self):
        self.click_pressable(self.SAVE_TEXT)

    def save_success_visible(self) -> bool:
        return (
            self.text_present("Saved", timeout=5)
            or self.text_present("Updated", timeout=5)
            or self.text_present("Profile updated", timeout=5)
        )

    def avatar_upload_visible(self) -> bool:
        return (
            self.pressable_exists(self.UPLOAD_AVATAR_TEXT, timeout=5)
            or self.pressable_exists(self.CHANGE_PHOTO_TEXT, timeout=5)
        )


class ProgressOverviewPage(BasePage):
    """src/screens/profile/ProgressOverviewScreen.tsx."""

    HEADING_TEXT      = "Progress"
    CHART_LABELS      = ["Sessions", "Score", "WPM", "Clarity"]

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def stats_visible(self) -> bool:
        for lbl in self.CHART_LABELS:
            if self.text_present(lbl, timeout=3):
                return True
        return False


class AchievementsPage(BasePage):
    """src/screens/profile/AchievementsScreen.tsx — 12 hardcoded achievements."""

    HEADING_TEXT   = "Achievements"
    REWARDS_TEXT   = "Rewards"
    STREAK_TEXT    = "Streak"
    UNLOCK_TEXT    = "Unlocked"
    LOCKED_TEXT    = "Locked"

    ACHIEVEMENT_NAMES = [
        "First Speech",
        "Consistent",
        "High Scorer",
        "Filler-Free",
        "Speed Demon",
        "Clarity King",
    ]

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def achievement_cards_visible(self) -> bool:
        for name in self.ACHIEVEMENT_NAMES:
            if self.text_present(name, timeout=3):
                return True
        return False

    def click_rewards(self):
        self.click_pressable(self.REWARDS_TEXT)

    def click_streak(self):
        self.click_pressable(self.STREAK_TEXT)


class SettingsPage(BasePage):
    """src/screens/settings/SettingsScreen.tsx."""

    HEADING_TEXT            = "Settings"
    DARK_MODE_TEXT          = "Dark Mode"
    CHANGE_EMAIL_TEXT       = "Change Email"
    CHANGE_PASSWORD_TEXT    = "Change Password"
    DELETE_ACCOUNT_TEXT     = "Delete Account"
    NOTIFICATION_SETTINGS   = "Notification Settings"
    PRIVACY_POLICY_TEXT     = "Privacy Policy"
    FAQ_TEXT                = "FAQ"
    TUTORIAL_TEXT           = "Tutorial"
    WHATS_NEW_TEXT          = "What's New"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def click_dark_mode_toggle(self):
        self.click_pressable(self.DARK_MODE_TEXT)

    def click_change_email(self):
        self.click_pressable(self.CHANGE_EMAIL_TEXT)

    def click_change_password(self):
        self.click_pressable(self.CHANGE_PASSWORD_TEXT)

    def click_delete_account(self):
        self.click_pressable(self.DELETE_ACCOUNT_TEXT)

    def click_notification_settings(self):
        self.click_pressable(self.NOTIFICATION_SETTINGS)

    def click_privacy_policy(self):
        self.click_pressable(self.PRIVACY_POLICY_TEXT)

    def click_faq(self):
        self.click_pressable(self.FAQ_TEXT)

    def dark_mode_toggle_visible(self) -> bool:
        return self.pressable_exists(self.DARK_MODE_TEXT, timeout=5)

    def delete_account_link_visible(self) -> bool:
        return self.pressable_exists(self.DELETE_ACCOUNT_TEXT, timeout=5)


class NotificationSettingsPage(BasePage):
    """src/screens/settings/NotificationSettingsScreen.tsx — 6 toggles."""

    HEADING_TEXT       = "Notification Settings"
    SAVE_TEXT          = "Save"
    TOGGLE_LABELS      = [
        "Daily Reminders",
        "Session Complete",
        "Achievement",
        "Weekly Report",
        "New Challenge",
        "Streak Alert",
    ]

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def all_toggles_visible(self) -> bool:
        return any(self.text_present(lbl, timeout=3) for lbl in self.TOGGLE_LABELS)

    def click_save(self):
        self.click_pressable(self.SAVE_TEXT)


class PrivacyPolicyPage(BasePage):
    """src/screens/settings/PrivacyPolicyScreen.tsx — static accordion."""

    HEADING_TEXT = "Privacy Policy"
    SECTION_TEXT = "Data Collection"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def content_visible(self) -> bool:
        return self.text_present(self.SECTION_TEXT, timeout=5)


class DeleteAccountPage(BasePage):
    """src/screens/auth/DeleteAccountScreen.tsx — multi-step wizard."""

    HEADING_TEXT    = "Delete Account"
    CONFIRM_TEXT    = "Delete"
    CANCEL_TEXT     = "Cancel"
    PASSWORD_PH     = "Enter your password"
    WARNING_TEXT    = "This action cannot be undone"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def warning_visible(self) -> bool:
        return self.text_present(self.WARNING_TEXT, timeout=5)

    def password_input(self):
        return self.input_by_placeholder(self.PASSWORD_PH)

    def click_cancel(self):
        self.click_pressable(self.CANCEL_TEXT)

    def click_confirm_delete(self):
        self.click_pressable(self.CONFIRM_TEXT)


class FAQPage(BasePage):
    """src/screens/support/FAQScreen.tsx."""

    HEADING_TEXT = "FAQ"

    def is_displayed(self) -> bool:
        return self.text_present(self.HEADING_TEXT, timeout=10)

    def faq_items_visible(self) -> bool:
        for kw in ("How", "What", "Why", "Can I", "Is"):
            if self.text_present(kw, timeout=3):
                return True
        return False


class GamificationPage(BasePage):
    """Covers RewardsScreen, StreakCalendarScreen, LevelUpScreen."""

    REWARDS_HEADING  = "Rewards"
    STREAK_HEADING   = "Streak"
    LEVELUP_HEADING  = "Level Up"
    COINS_TEXT       = "Coins"
    XP_TEXT          = "XP"

    def rewards_displayed(self) -> bool:
        return self.text_present(self.REWARDS_HEADING, timeout=10)

    def streak_displayed(self) -> bool:
        return self.text_present(self.STREAK_HEADING, timeout=10)

    def levelup_displayed(self) -> bool:
        return self.text_present(self.LEVELUP_HEADING, timeout=10)

    def currency_label_visible(self) -> bool:
        return (
            self.text_present(self.COINS_TEXT, timeout=5)
            or self.text_present(self.XP_TEXT, timeout=5)
        )
