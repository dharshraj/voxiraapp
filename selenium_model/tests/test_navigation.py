"""Navigation flow tests across the unauthenticated OnboardingStack
(src/navigation/RootNavigator.tsx lines 115-131). There is no URL-based deep
linking configured (no `linking` prop on NavigationContainer), so every
screen transition below is driven by real UI clicks, not URL navigation."""
from pages.welcome_page import WelcomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.forgot_password_page import ForgotPasswordPage


def test_welcome_to_login_navigation(driver, meta):
    meta["module"] = "Navigation"
    meta["scenario"] = "Tapping 'Sign In' on WelcomeScreen navigates to LoginScreen"
    meta["expected"] = "LoginScreen renders with 'Welcome Back' heading"
    welcome = WelcomePage(driver).load()
    welcome.click_sign_in()
    login = LoginPage(driver)
    assert login.is_displayed(), "LoginScreen did not render after clicking Sign In"
    meta["actual"] = "Navigated to LoginScreen successfully"


def test_login_to_register_navigation(driver, meta):
    meta["module"] = "Navigation"
    meta["scenario"] = "Tapping 'Sign Up' on LoginScreen navigates to RegisterScreen"
    meta["expected"] = "RegisterScreen renders with 'Create Account' heading"
    welcome = WelcomePage(driver).load()
    welcome.click_sign_in()
    login = LoginPage(driver)
    login.click_sign_up()
    register = RegisterPage(driver)
    assert register.is_displayed(), "RegisterScreen did not render after clicking Sign Up"
    meta["actual"] = "Navigated to RegisterScreen successfully"


def test_login_to_forgot_password_navigation(driver, meta):
    meta["module"] = "Navigation"
    meta["scenario"] = "Tapping 'Forgot Password?' on LoginScreen navigates to ForgotPasswordScreen"
    meta["expected"] = "ForgotPasswordScreen renders with 'Forgot Password?' heading"
    welcome = WelcomePage(driver).load()
    welcome.click_sign_in()
    login = LoginPage(driver)
    login.click_forgot_password()
    fp = ForgotPasswordPage(driver)
    assert fp.is_displayed(), "ForgotPasswordScreen did not render after clicking Forgot Password?"
    meta["actual"] = "Navigated to ForgotPasswordScreen successfully"


def test_forgot_password_return_to_login(driver, meta):
    meta["module"] = "Navigation"
    meta["scenario"] = "'Return to Login' link on ForgotPasswordScreen navigates back to LoginScreen"
    meta["expected"] = "LoginScreen renders again"
    welcome = WelcomePage(driver).load()
    welcome.click_sign_in()
    LoginPage(driver).click_forgot_password()
    fp = ForgotPasswordPage(driver)
    fp.click_pressable(fp.RETURN_TO_LOGIN_TEXT)
    login = LoginPage(driver)
    assert login.is_displayed(), "Did not navigate back to LoginScreen"
    meta["actual"] = "Returned to LoginScreen successfully"


def test_onboarding_get_started_reaches_feature_carousel(driver, meta):
    meta["module"] = "Navigation"
    meta["scenario"] = "Tapping 'Get Started Free' on WelcomeScreen advances into the onboarding carousel (Feature1Screen)"
    meta["expected"] = "A 'Skip' pill is visible, confirming the onboarding carousel rendered"
    welcome = WelcomePage(driver).load()
    welcome.click_get_started()
    page = WelcomePage(driver)  # reuse base helpers only
    found = page.pressable_exists("Skip", timeout=10)
    meta["actual"] = "Feature carousel with Skip control rendered" if found else "Skip control not found after Get Started"
    assert found, "Onboarding carousel (Feature1Screen) did not render after Get Started Free"


def test_onboarding_skip_reaches_register(driver, meta):
    meta["module"] = "Navigation"
    meta["scenario"] = "Tapping 'Skip' on the onboarding carousel navigates directly to RegisterScreen"
    meta["expected"] = "RegisterScreen renders with 'Create Account' heading"
    welcome = WelcomePage(driver).load()
    welcome.click_get_started()
    welcome.click_pressable("Skip")
    register = RegisterPage(driver)
    assert register.is_displayed(), "RegisterScreen did not render after Skip"
    meta["actual"] = "Skip correctly routed to RegisterScreen"
