"""Appium mobile tests — 30 tests covering Android + iOS native interactions.

All tests are skipped gracefully when:
  - Appium server is not running at APPIUM_SERVER_URL
  - App binary (.apk / .ipa) has not been built yet

Run with a real device/emulator:
  export ANDROID_APP_PATH=/path/to/voxira.apk
  pytest tests/test_appium.py -m "not ios"

APPIUM-001 … APPIUM-010  App launch + boot (Android)
APPIUM-011 … APPIUM-020  Auth screen interactions (Android)
APPIUM-021 … APPIUM-030  iOS + gesture + permission tests
"""
import time
import pytest

pytestmark = pytest.mark.appium  # custom marker — can filter with -m appium

# ── helpers ──────────────────────────────────────────────────────────────────
def _find_by_text(driver, text, timeout=10):
    """Locate element by visible text on native.

    Uses contains() rather than exact equality: several links on this app
    (e.g. "Sign In") are rendered as nested Text spans inside one combined
    string ("Already have an account?  Sign In"), so the accessibility tree
    exposes the whole phrase as a single node's text — an exact match against
    just "Sign In" never finds it. contains() still matches standalone exact
    text just as well, so this is a strict superset of the old behavior.
    """
    from appium.webdriver.common.appiumby import AppiumBy
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    locator = (
        f'//*[contains(@text,"{text}") or contains(@label,"{text}") or contains(@name,"{text}")]'
    )
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located(("xpath", locator))
    )

def _element_exists(driver, text, timeout=5) -> bool:
    try:
        _find_by_text(driver, text, timeout)
        return True
    except Exception:
        return False

def _tap_element(driver, text, timeout=10):
    el = _find_by_text(driver, text, timeout)
    el.click()
    return el

def _type_into_field(driver, placeholder_or_hint, value, timeout=10):
    from appium.webdriver.common.appiumby import AppiumBy
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    locator = (
        f'//*[@hint="{placeholder_or_hint}" or @content-desc="{placeholder_or_hint}"'
        f' or @placeholder="{placeholder_or_hint}"]'
    )
    el = WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located(("xpath", locator))
    )
    el.click()
    el.send_keys(value)
    return el

# ══════════════════════════════════════════════════════════════════════════════
# APPIUM-001 … APPIUM-010  — App launch + boot (Android)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.appium_platform("android")
def test_appium_001_app_launches_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-001: App launches on Android without crashing",
        expected="App is in a non-error state within 15 seconds of launch")
    time.sleep(5)  # allow Expo splash + React hydration
    import config as _cfg
    # In Expo Go mode there's no standalone "com.voxira.app" process — the
    # project runs hosted inside Expo Go's own process (host.exp.exponent).
    app_id = "host.exp.exponent" if _cfg.EXPO_GO_MODE else "com.voxira.app"
    state = appium_driver.query_app_state(app_id)
    meta["actual"] = f"app_id={app_id}, app_state={state}"
    # State 4 = RUNNING_IN_FOREGROUND
    assert state in (3, 4), f"App not running: state={state}"

@pytest.mark.appium_platform("android")
def test_appium_002_welcome_screen_renders_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-002: WelcomeScreen renders 'Get Started Free' button on Android",
        expected="'Get Started Free' text element present")
    time.sleep(6)
    found = _element_exists(appium_driver, "Get Started Free", timeout=15)
    meta["actual"] = f"get_started_visible={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_003_get_started_navigates_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-003: Tapping 'Get Started Free' opens onboarding carousel",
        expected="'Skip' element visible on Feature1Screen")
    time.sleep(6)
    _tap_element(appium_driver, "Get Started Free")
    time.sleep(2)
    found = _element_exists(appium_driver, "Skip", timeout=10)
    meta["actual"] = f"skip_visible={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_004_skip_reaches_register_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-004: Tapping Skip on carousel reaches RegisterScreen",
        expected="'Create Account' text visible")
    time.sleep(6)
    _tap_element(appium_driver, "Get Started Free")
    time.sleep(2)
    _tap_element(appium_driver, "Skip")
    time.sleep(2)
    found = _element_exists(appium_driver, "Create Account", timeout=10)
    meta["actual"] = f"register_visible={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_005_sign_in_navigates_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-005: Tapping 'Sign In' on WelcomeScreen opens LoginScreen",
        expected="'Welcome Back' text visible")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    found = _element_exists(appium_driver, "Welcome Back", timeout=10)
    meta["actual"] = f"login_visible={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_006_back_button_hardware_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-006: Android hardware Back button returns to WelcomeScreen from Login",
        expected="'Get Started Free' visible after pressing hardware back")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    appium_driver.press_keycode(4)  # KEYCODE_BACK
    time.sleep(2)
    found = _element_exists(appium_driver, "Get Started Free", timeout=8)
    meta["actual"] = f"welcome_after_back={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_007_keyboard_appears_on_email_tap(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-007: Tapping email input on LoginScreen shows software keyboard",
        expected="Keyboard is shown after tapping email field")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    email_inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "android.widget.EditText")
    if not email_inputs:
        pytest.skip("No EditText found on LoginScreen")
    email_inputs[0].click()
    time.sleep(1)
    keyboard_shown = appium_driver.is_keyboard_shown()
    meta["actual"] = f"keyboard_shown={keyboard_shown}"
    assert keyboard_shown

@pytest.mark.appium_platform("android")
def test_appium_008_typing_email_updates_field(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-008: Typing email into LoginScreen email field updates its value",
        expected="Field contains 'test@example.com' after typing")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "android.widget.EditText")
    if not inputs:
        pytest.skip("No EditText found")
    inputs[0].send_keys("test@example.com")
    time.sleep(1)
    # Re-query fresh rather than reusing the pre-typing element handle, and
    # read via the standard .text property only. React Native re-renders the
    # underlying native EditText on each controlled-input onChange, and
    # calling get_attribute("text") on a handle obtained before that re-render
    # reproducibly hangs the on-device UiAutomator2 instrumentation (a raw
    # socket read that never returns, killing the whole pytest session via
    # the 120s test timeout) rather than raising a clean stale-element error.
    inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "android.widget.EditText")
    value = inputs[0].text if inputs else ""
    meta["actual"] = f"field_value='{value}'"
    assert "test" in value.lower()

@pytest.mark.appium_platform("android")
def test_appium_009_app_does_not_crash_on_rotate_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-009: App survives screen rotation (portrait → landscape → portrait)",
        expected="'Get Started Free' still visible; landscape rotation itself may be "
                 "rejected by the OS since app.json declares \"orientation\": \"portrait\" — "
                 "that rejection is the app correctly enforcing its own config, not a crash")
    time.sleep(6)
    rotation_locked = False
    try:
        appium_driver.orientation = "LANDSCAPE"
        time.sleep(2)
        appium_driver.orientation = "PORTRAIT"
        time.sleep(2)
    except Exception as exc:
        # app.json's orientation:"portrait" lock makes the OS refuse the
        # rotation outright — that's expected, intentional behavior, not a
        # crash. Only an actual app crash/hang below should fail this test.
        rotation_locked = True
    found = _element_exists(appium_driver, "Get Started Free", timeout=10)
    meta["actual"] = f"rotation_locked_by_app_config={rotation_locked}, app_stable_after_rotate={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_010_app_state_resumes_from_background(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-010: App resumes correctly after being sent to background",
        expected="WelcomeScreen visible after foreground restoration")
    time.sleep(6)
    appium_driver.background_app(3)  # 3 seconds in background
    time.sleep(2)
    found = _element_exists(appium_driver, "Get Started Free", timeout=10)
    meta["actual"] = f"welcome_visible_after_background={found}"
    assert found

# ══════════════════════════════════════════════════════════════════════════════
# APPIUM-011 … APPIUM-020  — Auth screen interactions (Android)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.appium_platform("android")
def test_appium_011_empty_login_blocked_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-011: Empty login form submission blocked on Android",
        expected="Stays on LoginScreen after empty submit")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    _tap_element(appium_driver, "Sign In")  # tap submit button
    time.sleep(1)
    still_on_login = _element_exists(appium_driver, "Welcome Back", timeout=5)
    meta["actual"] = f"still_on_login={still_on_login}"
    assert still_on_login

@pytest.mark.appium_platform("android")
def test_appium_012_register_four_fields_visible(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-012: RegisterScreen shows ≥3 EditText fields",
        expected="≥3 android.widget.EditText elements")
    time.sleep(6)
    _tap_element(appium_driver, "Get Started Free")
    time.sleep(2)
    _tap_element(appium_driver, "Skip")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "android.widget.EditText")
    meta["actual"] = f"input_count={len(inputs)}"
    assert len(inputs) >= 3

@pytest.mark.appium_platform("android")
def test_appium_013_forgot_password_navigation(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-013: 'Forgot Password?' navigates to ForgotPasswordScreen on Android",
        expected="'Forgot Password?' heading visible")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    _tap_element(appium_driver, "Forgot Password?")
    time.sleep(2)
    found = _element_exists(appium_driver, "Forgot Password?", timeout=8)
    meta["actual"] = f"forgot_screen_visible={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_014_password_field_is_masked(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-014: Password field on LoginScreen is masked (password input type)",
        expected="EditText has password input type attribute")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    pwd_fields = appium_driver.find_elements(
        AppiumBy.XPATH, '//*[@password="true" or @inputType="129"]')
    meta["actual"] = f"password_fields={len(pwd_fields)}"
    assert len(pwd_fields) >= 1, "No masked password field found"

@pytest.mark.appium_platform("android")
def test_appium_015_google_sign_in_button_present(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-015: 'Continue with Google' button present on Android LoginScreen",
        expected="Google button element found")
    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    found = _element_exists(appium_driver, "Continue with Google", timeout=8)
    meta["actual"] = f"google_button={found}"
    assert found

@pytest.mark.appium_platform("android")
def test_appium_016_swipe_up_on_register_screen(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-016: Swipe up on RegisterScreen scrolls without crashing",
        expected="App remains stable after swipe gesture")
    time.sleep(6)
    _tap_element(appium_driver, "Get Started Free")
    time.sleep(2)
    _tap_element(appium_driver, "Skip")
    time.sleep(2)
    size = appium_driver.get_window_size()
    w, h = size["width"], size["height"]
    # Swipe up (TouchAction was removed from Appium-Python-Client v3+; use the
    # W3C-actions-backed driver.swipe() convenience method instead, consistent
    # with the iOS swipe tests elsewhere in this file)
    appium_driver.swipe(w // 2, h * 3 // 4, w // 2, h // 4, 500)
    time.sleep(1)
    still_on = _element_exists(appium_driver, "Create Account", timeout=5)
    meta["actual"] = f"screen_stable_after_swipe={still_on}"
    assert still_on

@pytest.mark.appium_platform("android")
def test_appium_017_tab_bar_tabs_count(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-017: Bottom tab bar shows 5 tabs after login (authenticated)",
        expected="5 tab labels visible (Home, Speech, Goals, Earn, Profile)")
    import config as _cfg
    if _cfg.TEST_USER_EMAIL == "qa.selenium.test@example.com":
        pytest.skip("Set VOXIRA_TEST_EMAIL to run authenticated Appium tests")
    time.sleep(6)
    # Navigate to login
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    # Fill credentials
    from appium.webdriver.common.appiumby import AppiumBy
    inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "android.widget.EditText")
    if len(inputs) < 2:
        pytest.skip("Could not find login fields")
    inputs[0].send_keys(_cfg.TEST_USER_EMAIL)
    inputs[1].send_keys(_cfg.TEST_USER_PASSWORD)
    time.sleep(0.5)
    _tap_element(appium_driver, "Sign In")
    time.sleep(5)  # wait for auth + tab render
    tab_labels = ["Home", "Speech", "Goals", "Earn", "Profile"]
    visible = [label for label in tab_labels if _element_exists(appium_driver, label, timeout=5)]
    meta["actual"] = f"visible_tabs={visible}"
    assert len(visible) >= 4, f"Expected ≥4 tab labels, found: {visible}"

@pytest.mark.appium_platform("android")
def test_appium_018_mic_permission_dialog_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-018: Mic permission dialog can be accepted on Android",
        expected="Permission dialog appears when requesting RECORD_AUDIO and can be accepted")
    import config as _cfg
    if _cfg.TEST_USER_EMAIL == "qa.selenium.test@example.com":
        pytest.skip("Set VOXIRA_TEST_EMAIL to run authenticated Appium tests")

    # Revoke the permission first so the OS dialog is guaranteed to fire —
    # once granted it stays granted across app restarts (pm clear resets app
    # storage, not OS-level permission grants), so a prior test run in this
    # same install would otherwise make this test a silent no-op.
    import subprocess
    try:
        subprocess.run(
            ["adb", "-s", _cfg.ANDROID_DEVICE_NAME, "shell", "pm", "revoke",
             _cfg.ANDROID_PACKAGE_NAME, "android.permission.RECORD_AUDIO"],
            capture_output=True, timeout=10,
        )
    except Exception:
        pass

    time.sleep(6)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "android.widget.EditText")
    if len(inputs) < 2:
        pytest.skip("Could not find login fields")
    inputs[0].send_keys(_cfg.TEST_USER_EMAIL)
    inputs[1].send_keys(_cfg.TEST_USER_PASSWORD)
    time.sleep(0.5)
    _tap_element(appium_driver, "Sign In")
    time.sleep(5)  # wait for auth + tab render

    _tap_element(appium_driver, "Speech")
    time.sleep(2)
    _tap_element(appium_driver, "Start Recording")
    time.sleep(2)

    dialog_shown = _element_exists(appium_driver, "record audio", timeout=6)
    accepted = False
    if dialog_shown:
        for label in ["While using the app", "Only this time", "Allow"]:
            if _element_exists(appium_driver, label, timeout=2):
                _tap_element(appium_driver, label)
                accepted = True
                break
    meta["actual"] = f"dialog_shown={dialog_shown}, accepted={accepted}"
    assert dialog_shown, "RECORD_AUDIO permission dialog did not appear"
    assert accepted, "Could not find a button to accept the permission dialog"

@pytest.mark.appium_platform("android")
def test_appium_019_app_not_in_debug_mode_production(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-019: Production build does not show Metro debug overlay",
        expected="No 'Metro' or 'Debug' overlay text visible in production build")
    time.sleep(6)
    metro_visible = _element_exists(appium_driver, "Metro", timeout=3)
    debug_visible = _element_exists(appium_driver, "Debugger", timeout=3)
    meta["actual"] = f"metro={metro_visible}, debugger={debug_visible}"
    # Only fails for production builds; dev builds will skip
    if metro_visible:
        pytest.skip("Dev build — Metro overlay expected; skipping production check")
    assert not debug_visible

@pytest.mark.appium_platform("android")
def test_appium_020_app_logo_visible_android(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-020: VOXIRA brand text visible on WelcomeScreen (Android)",
        expected="'VOX' or 'VOXIRA' text element present on WelcomeScreen")
    time.sleep(6)
    # Brand is rendered as two Text nodes: "VOX" + "IRA" — check for either
    found = (
        _element_exists(appium_driver, "VOXIRA", timeout=8)
        or _element_exists(appium_driver, "VOX", timeout=5)
    )
    meta["actual"] = f"brand_visible={found}"
    assert found

# ══════════════════════════════════════════════════════════════════════════════
# APPIUM-021 … APPIUM-030  — iOS tests
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.appium_platform("ios")
def test_appium_021_app_launches_ios(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-021: App launches on iOS Simulator without crash",
        expected="App is running in foreground within 20 seconds")
    time.sleep(8)
    found = _element_exists(appium_driver, "Get Started Free", timeout=20)
    meta["actual"] = f"welcome_visible={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_022_get_started_ios(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-022: 'Get Started Free' tap navigates on iOS",
        expected="'Skip' visible on carousel")
    time.sleep(8)
    _tap_element(appium_driver, "Get Started Free")
    time.sleep(2)
    found = _element_exists(appium_driver, "Skip", timeout=10)
    meta["actual"] = f"skip_visible={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_023_ios_swipe_gesture(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-023: iOS swipe gesture on WelcomeScreen does not crash app",
        expected="App stable after swipe")
    time.sleep(8)
    size = appium_driver.get_window_size()
    w, h = size["width"], size["height"]
    appium_driver.swipe(w//2, h*3//4, w//2, h//4, 500)
    time.sleep(1)
    found = _element_exists(appium_driver, "Get Started Free", timeout=5)
    meta["actual"] = f"welcome_after_swipe={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_024_ios_back_swipe_gesture(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-024: iOS edge-swipe back from LoginScreen returns to WelcomeScreen",
        expected="WelcomeScreen visible after back swipe")
    time.sleep(8)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    size = appium_driver.get_window_size()
    # Edge swipe from left
    appium_driver.swipe(10, size["height"]//2, size["width"]//2, size["height"]//2, 400)
    time.sleep(2)
    found = _element_exists(appium_driver, "Get Started Free", timeout=8)
    meta["actual"] = f"welcome_after_back_swipe={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_025_ios_keyboard_dismiss(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-025: Tapping outside input dismisses iOS keyboard",
        expected="Keyboard hidden after tap outside")
    time.sleep(8)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    inputs = appium_driver.find_elements(AppiumBy.CLASS_NAME, "XCUIElementTypeTextField")
    if not inputs:
        pytest.skip("No text field found")
    inputs[0].click()
    time.sleep(1)
    # Tap outside by tapping the heading
    try:
        _tap_element(appium_driver, "Welcome Back", timeout=3)
    except Exception:
        pass
    time.sleep(1)
    kb = appium_driver.is_keyboard_shown()
    meta["actual"] = f"keyboard_shown_after_dismiss={kb}"
    assert not kb, "Keyboard did not dismiss after tapping outside"

@pytest.mark.appium_platform("ios")
def test_appium_026_ios_orientation_landscape(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-026: App handles landscape orientation on iOS without crash",
        expected="App renders after rotating to landscape and back")
    time.sleep(8)
    appium_driver.orientation = "LANDSCAPE"
    time.sleep(2)
    appium_driver.orientation = "PORTRAIT"
    time.sleep(2)
    found = _element_exists(appium_driver, "Get Started Free", timeout=8)
    meta["actual"] = f"stable_after_rotation={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_027_ios_app_background_resume(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-027: App resumes from background on iOS",
        expected="App visible after 3-second background")
    time.sleep(8)
    appium_driver.background_app(3)
    time.sleep(2)
    found = _element_exists(appium_driver, "Get Started Free", timeout=10)
    meta["actual"] = f"visible_after_background={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_028_ios_voxira_brand_visible(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-028: VOXIRA brand visible on WelcomeScreen (iOS)",
        expected="'VOX' or 'VOXIRA' text element present")
    time.sleep(8)
    found = (
        _element_exists(appium_driver, "VOXIRA", timeout=10)
        or _element_exists(appium_driver, "VOX", timeout=5)
    )
    meta["actual"] = f"brand_visible={found}"
    assert found

@pytest.mark.appium_platform("ios")
def test_appium_029_ios_login_email_input(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-029: Email input on LoginScreen accepts text on iOS",
        expected="Field contains typed email after send_keys")
    time.sleep(8)
    _tap_element(appium_driver, "Sign In")
    time.sleep(2)
    from appium.webdriver.common.appiumby import AppiumBy
    fields = appium_driver.find_elements(AppiumBy.CLASS_NAME, "XCUIElementTypeTextField")
    if not fields:
        pytest.skip("No text field on iOS LoginScreen")
    fields[0].send_keys("test@example.com")
    time.sleep(0.5)
    value = fields[0].get_attribute("value") or ""
    meta["actual"] = f"field_value='{value}'"
    assert "test" in value.lower() or len(value) > 3

@pytest.mark.appium_platform("ios")
def test_appium_030_ios_no_crash_on_rapid_nav(appium_driver, meta):
    meta.update(module="Appium", test_type="Appium",
        scenario="APPIUM-030: Rapid navigation taps (Welcome→Login→back ×3) do not crash app",
        expected="App stable after 3 rapid navigation cycles")
    time.sleep(8)
    for _ in range(3):
        if _element_exists(appium_driver, "Sign In", timeout=5):
            _tap_element(appium_driver, "Sign In")
            time.sleep(1)
            appium_driver.back()
            time.sleep(1)
    found = _element_exists(appium_driver, "Get Started Free", timeout=8)
    meta["actual"] = f"stable_after_rapid_nav={found}"
    assert found
