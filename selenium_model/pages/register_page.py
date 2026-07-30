from pages.base_page import BasePage


class RegisterPage(BasePage):
    """src/screens/auth/RegisterScreen.tsx"""

    FULLNAME_PLACEHOLDER = "Enter your full name"
    EMAIL_PLACEHOLDER = "you@example.com"
    PASSWORD_PLACEHOLDER = "Create a strong password"
    CONFIRM_PLACEHOLDER = "Repeat your password"
    SUBMIT_TEXT = "Create My Account"

    def is_displayed(self) -> bool:
        return self.text_present("Create Account", timeout=10)

    def fill(self, full_name: str, email: str, password: str, confirm: str):
        self.clear_and_type(self.input_by_placeholder(self.FULLNAME_PLACEHOLDER), full_name)
        self.clear_and_type(self.input_by_placeholder(self.EMAIL_PLACEHOLDER), email)
        self.clear_and_type(self.input_by_placeholder(self.PASSWORD_PLACEHOLDER), password)
        self.clear_and_type(self.input_by_placeholder(self.CONFIRM_PLACEHOLDER), confirm)

    def submit(self):
        self.click_pressable(self.SUBMIT_TEXT)

    def has_validation_error(self) -> bool:
        # Exact zod error-message substrings from RegisterScreen.tsx:20-44 — deliberately
        # NOT matching generic words like "8-20"/"match" alone, since the always-visible
        # password-requirements checklist (not an error) contains "8–20 characters" and
        # could otherwise produce a false positive once the user starts typing.
        for phrase in (
            "must be at least", "characters or less", "letters only",
            "Enter a valid email address", "Email is required",
            "Must include at least one", "Passwords do not match",
        ):
            if self.text_present(phrase, timeout=2):
                return True
        return False
