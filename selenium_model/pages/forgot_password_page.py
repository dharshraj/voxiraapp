from pages.base_page import BasePage


class ForgotPasswordPage(BasePage):
    """src/screens/auth/ForgotPasswordScreen.tsx"""

    EMAIL_PLACEHOLDER = "you@email.com"
    SUBMIT_TEXT = "Send Reset Link"
    BACK_TO_LOGIN_TEXT = "Back to Login"
    RETURN_TO_LOGIN_TEXT = "Return to Login"

    def is_displayed(self) -> bool:
        return self.text_present("Forgot Password?", timeout=10)

    def enter_email(self, email: str):
        self.clear_and_type(self.input_by_placeholder(self.EMAIL_PLACEHOLDER), email)

    def submit(self):
        self.click_pressable(self.SUBMIT_TEXT)

    def is_sent_confirmation_shown(self) -> bool:
        return self.text_present("Email Sent!", timeout=10)

    def has_validation_error(self) -> bool:
        return self.text_present("valid email", timeout=3)
