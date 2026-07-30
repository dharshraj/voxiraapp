from pages.base_page import BasePage


class LoginPage(BasePage):
    """src/screens/auth/LoginScreen.tsx"""

    SUBMIT_TEXT = "Sign In"
    GOOGLE_TEXT = "Continue with Google"
    FORGOT_TEXT = "Forgot Password?"
    SIGNUP_LINK_TEXT = "Sign Up"

    def email_input(self):
        return self.input_by_type("email")

    def password_input(self):
        return self.input_by_type("password")

    def enter_email(self, value: str):
        self.clear_and_type(self.email_input(), value)

    def enter_password(self, value: str):
        self.clear_and_type(self.password_input(), value)

    def submit(self):
        self.click_pressable(self.SUBMIT_TEXT)

    def login(self, email: str, password: str):
        self.enter_email(email)
        self.enter_password(password)
        self.submit()

    def click_google(self):
        self.click_pressable(self.GOOGLE_TEXT)

    def click_forgot_password(self):
        self.click_pressable(self.FORGOT_TEXT)

    def click_sign_up(self):
        self.click_pressable(self.SIGNUP_LINK_TEXT)

    def is_displayed(self) -> bool:
        return self.text_present("Welcome Back", timeout=10)

    def has_validation_error(self) -> bool:
        # zod/react-hook-form inline error text patterns seen in this codebase.
        for phrase in ("required", "Invalid email", "must be at least", "Required"):
            if self.text_present(phrase, timeout=2):
                return True
        return False
