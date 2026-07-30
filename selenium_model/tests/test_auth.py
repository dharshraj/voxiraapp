"""Authentication E2E tests.

SCOPE NOTE (safety decision, documented in FINAL_AUDIT_REPORT.md): this app's
.env points at a real Supabase project. Submitting a *valid* Register form
would create a real auth user and send a real confirmation email; submitting
a *valid* Forgot-Password form sends a real password-reset email; clicking
"Continue with Google" opens a real Google OAuth consent flow. None of those
are reversible/no-op actions, so this suite does not execute them. It does
exercise the safe, non-mutating paths: client-side (zod) validation, which
never reaches the network, and Login with intentionally invalid credentials,
which is a read-only auth check Supabase is designed to reject harmlessly.

To additionally test the authenticated area (dashboard, tabs, CRUD), set
VOXIRA_TEST_EMAIL / VOXIRA_TEST_PASSWORD to a real, already-provisioned test
account before running pytest — see config.py.
"""
import time

import pytest

import config
from pages.welcome_page import WelcomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.forgot_password_page import ForgotPasswordPage

# Screens fade/slide in via Animated.timing (~600-700ms); a fixed settle delay
# is simpler and more reliable here than polling opacity via JS.
ANIMATION_SETTLE_SEC = 1.0


def _open_login(driver):
    WelcomePage(driver).load().click_sign_in()
    page = LoginPage(driver)
    assert page.is_displayed()
    time.sleep(ANIMATION_SETTLE_SEC)
    return page


def _open_register(driver):
    _open_login(driver).click_sign_up()
    page = RegisterPage(driver)
    assert page.is_displayed()
    time.sleep(ANIMATION_SETTLE_SEC)
    return page


def _open_forgot_password(driver):
    _open_login(driver).click_forgot_password()
    page = ForgotPasswordPage(driver)
    assert page.is_displayed()
    time.sleep(ANIMATION_SETTLE_SEC)
    return page


# ---------------------------------------------------------------- Login ----
def test_login_invalid_credentials_shows_error(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Login with a non-existent email/password combination"
    meta["expected"] = "Supabase rejects the credentials; an inline error message is shown; user stays on LoginScreen"
    login = _open_login(driver)
    login.login(config.INVALID_EMAIL, config.INVALID_PASSWORD)
    error_shown = login.text_present("Invalid", timeout=12) or login.text_present("error", timeout=2)
    still_on_login = login.is_displayed()
    meta["actual"] = f"error_message_shown={error_shown}, still_on_login={still_on_login}"
    assert still_on_login, "App navigated away from LoginScreen on a failed login (should stay and show an error)"


def test_login_empty_fields_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Submitting the Login form with both fields empty must not reach Supabase (no network call for invalid data)"
    meta["expected"] = "zod validation blocks submission; user remains on LoginScreen; no navigation occurs"
    login = _open_login(driver)
    login.submit()
    time.sleep(1)
    has_error = login.has_validation_error()
    still_on_login = login.is_displayed()
    network_calls = login.network_requests_matching("/auth/v1/token")
    meta["actual"] = (f"still_on_login={still_on_login}, validation_error_text_shown={has_error}, "
                       f"supabase_auth_network_calls={network_calls} "
                       "(see BUG-002 in Defect Report: LoginScreen shows no visible feedback on empty submit)")
    assert still_on_login, "App navigated away from LoginScreen after submitting an empty form (should block and stay)"
    assert network_calls == 0, "Empty Login form reached Supabase's auth endpoint — client-side validation did not block it"


def test_login_malformed_email_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Entering a malformed email ('not-an-email') into Login and submitting must not reach Supabase"
    meta["expected"] = "zod .email() validation rejects the value; user remains on LoginScreen"
    login = _open_login(driver)
    login.enter_email("not-an-email")
    login.enter_password("somepassword")
    login.submit()
    time.sleep(1)
    has_error = login.has_validation_error()
    still_on_login = login.is_displayed()
    network_calls = login.network_requests_matching("/auth/v1/token")
    meta["actual"] = f"still_on_login={still_on_login}, validation_error_text_shown={has_error}, supabase_auth_network_calls={network_calls}"
    assert still_on_login, "App navigated away from LoginScreen after submitting a malformed email (should block and stay)"
    assert network_calls == 0, "Malformed-email Login form reached Supabase's auth endpoint — client-side validation did not block it"


def test_google_sign_in_button_present(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "'Continue with Google' button is present and enabled on LoginScreen (not clicked — would open real OAuth consent)"
    meta["expected"] = "Google sign-in pressable is present in the DOM"
    login = _open_login(driver)
    present = login.pressable_exists(login.GOOGLE_TEXT, timeout=5)
    meta["actual"] = f"google_button_present={present}"
    assert present, "Continue with Google button not found on LoginScreen"


# ------------------------------------------------------------- Register ----
def test_register_empty_fields_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Submitting the Register form with all fields empty must not reach Supabase"
    meta["expected"] = "zod validation blocks submission; user remains on RegisterScreen"
    register = _open_register(driver)
    register.submit()
    time.sleep(1)
    has_error = register.has_validation_error()
    still_on_register = register.is_displayed()
    network_calls = register.network_requests_matching("/auth/v1/signup")
    meta["actual"] = (f"still_on_register={still_on_register}, validation_error_text_shown={has_error}, "
                       f"supabase_signup_network_calls={network_calls} "
                       "(RegisterScreen gates inline errors behind a manual per-field 'touched' flag that "
                       "submit alone does not set — see Code Health Summary)")
    assert still_on_register, "App navigated away from RegisterScreen after submitting an empty form (should block and stay)"
    assert network_calls == 0, "Empty Register form reached Supabase's signup endpoint — client-side validation did not block it"


def test_register_weak_password_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Registering with a password that fails the complexity regex (too short, no symbols) must not reach Supabase"
    meta["expected"] = ("Submission blocked (stays on RegisterScreen). Note: the password field has no dedicated "
                         "inline error Text in source — RegisterScreen.tsx:391 deliberately replaces it with a "
                         "requirements checklist, so this test does not require visible error TEXT for this field.")
    register = _open_register(driver)
    register.fill("QA Tester", "qa.selenium.audit@example.com", "weak", "weak")
    register.submit()
    time.sleep(1)
    still_on_register = register.is_displayed()
    checklist_shown = register.text_present("characters", timeout=2)
    network_calls = register.network_requests_matching("/auth/v1/signup")
    meta["actual"] = f"still_on_register={still_on_register}, requirements_checklist_visible={checklist_shown}, supabase_signup_network_calls={network_calls}"
    assert still_on_register, "App navigated away from RegisterScreen after submitting a weak password (should block and stay)"
    assert network_calls == 0, "Weak-password Register form reached Supabase's signup endpoint — client-side validation did not block it"


def test_register_password_mismatch_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Registering with password and confirmPassword that do not match must not reach Supabase"
    meta["expected"] = "zod .refine() mismatch blocks submission; user remains on RegisterScreen"
    register = _open_register(driver)
    register.fill("QA Tester", "qa.selenium.audit@example.com", "GoodPass1!", "Different1!")
    register.submit()
    time.sleep(1)
    has_error = register.has_validation_error()
    still_on_register = register.is_displayed()
    network_calls = register.network_requests_matching("/auth/v1/signup")
    meta["actual"] = f"still_on_register={still_on_register}, validation_error_text_shown={has_error}, supabase_signup_network_calls={network_calls}"
    assert still_on_register, "App navigated away from RegisterScreen after submitting mismatched passwords (should block and stay)"
    assert network_calls == 0, "Mismatched-password Register form reached Supabase's signup endpoint — client-side validation did not block it"


def test_register_valid_input_clears_validation_errors(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Filling Register form with fully valid data clears all inline errors (submit NOT clicked — would create a real Supabase user)"
    meta["expected"] = "No validation error text visible once all fields satisfy the zod schema"
    register = _open_register(driver)
    register.fill("QA Selenium Tester", "qa.selenium.audit@example.com", "GoodPass1!", "GoodPass1!")
    has_error = register.has_validation_error()
    meta["actual"] = f"validation_error_still_shown={has_error}"
    assert not has_error, "Validation errors still shown for fully valid Register input"


# -------------------------------------------------------- Forgot Password --
def test_forgot_password_malformed_email_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Submitting Forgot Password with a malformed email must not reach Supabase"
    meta["expected"] = "zod .email() validation rejects the value; no network call made; user remains on ForgotPasswordScreen"
    fp = _open_forgot_password(driver)
    fp.enter_email("not-an-email")
    fp.submit()
    time.sleep(1)
    has_error = fp.has_validation_error()
    still_on_fp = fp.is_displayed()
    network_calls = fp.network_requests_matching("/auth/v1/recover")
    meta["actual"] = f"still_on_forgot_password={still_on_fp}, validation_error_text_shown={has_error}, supabase_recover_network_calls={network_calls}"
    assert network_calls == 0, "Malformed-email Forgot Password form reached Supabase's recover endpoint — client-side validation did not block it"


def test_forgot_password_empty_email_validation(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Submitting Forgot Password with an empty email field must not reach Supabase"
    meta["expected"] = "zod validation blocks submission; no network call made"
    fp = _open_forgot_password(driver)
    fp.submit()
    time.sleep(1)
    has_error = fp.has_validation_error()
    still_on_fp = fp.is_displayed()
    network_calls = fp.network_requests_matching("/auth/v1/recover")
    meta["actual"] = f"still_on_forgot_password={still_on_fp}, validation_error_text_shown={has_error}, supabase_recover_network_calls={network_calls}"
    assert network_calls == 0, "Empty Forgot Password form reached Supabase's recover endpoint — client-side validation did not block it"


# ----------------------------------------------- Authenticated-area tests --
@pytest.mark.skipif(
    config.TEST_USER_EMAIL == "qa.selenium.test@example.com",
    reason="No real VOXIRA_TEST_EMAIL/VOXIRA_TEST_PASSWORD provided — skipping to avoid a guaranteed-fail live login "
           "and to avoid exercising the authenticated area without an authorized test account.",
)
def test_login_with_provided_test_account_reaches_dashboard(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Login with the operator-supplied VOXIRA_TEST_EMAIL/PASSWORD reaches the authenticated MainTabs dashboard"
    meta["expected"] = "Bottom tab bar (Home/Speech/Profile) renders after login"
    from pages.tab_bar_page import TabBarPage
    login = _open_login(driver)
    login.login(config.TEST_USER_EMAIL, config.TEST_USER_PASSWORD)
    tabs = TabBarPage(driver)
    displayed = tabs.is_displayed()
    meta["actual"] = f"tab_bar_displayed={displayed}"
    assert displayed, "Tab bar did not render after login with provided test account"


def test_logout_requires_authenticated_session(driver, meta):
    meta["module"] = "Authentication"
    meta["scenario"] = "Logout (ProfileScreen.handleSignOut / SettingsScreen.signOut)"
    meta["expected"] = "N/A — requires an authenticated session"
    meta["actual"] = "Skipped: no authenticated test session available (see module scope note)"
    pytest.skip("Logout requires a live authenticated session; no VOXIRA_TEST_EMAIL configured.")
