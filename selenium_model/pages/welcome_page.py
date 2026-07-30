from pages.base_page import BasePage


class WelcomePage(BasePage):
    """src/screens/onboarding/WelcomeScreen.tsx"""

    GET_STARTED_TEXT = "Get Started Free"
    SIGN_IN_TEXT = "Sign In"

    def load(self):
        self.open("")
        self.wait_for_root_rendered()
        return self

    def is_displayed(self) -> bool:
        return self.pressable_exists(self.GET_STARTED_TEXT, timeout=10)

    def click_get_started(self):
        self.click_pressable(self.GET_STARTED_TEXT)

    def click_sign_in(self):
        self.click_pressable(self.SIGN_IN_TEXT)
