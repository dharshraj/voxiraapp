"""Smoke tests: does the app boot at all, on the web target."""
import config
from pages.welcome_page import WelcomePage


def test_app_boots_and_renders_welcome_screen(driver, meta):
    meta["module"] = "Smoke"
    meta["scenario"] = "App loads at BASE_URL and renders the Welcome screen root content"
    meta["expected"] = "#root contains rendered react-native-web content within timeout; 'Get Started Free' CTA visible"
    page = WelcomePage(driver)
    page.wait_for_root_rendered()
    assert page.is_displayed(), "Welcome screen CTA not found — app failed to render"
    meta["actual"] = "Welcome screen rendered with 'Get Started Free' CTA visible"


def test_no_uncaught_js_errors_on_initial_load(driver, meta):
    meta["module"] = "Smoke"
    meta["scenario"] = "No uncaught JS exceptions logged to browser console on initial load"
    meta["expected"] = "Browser console contains no SEVERE-level entries mentioning Uncaught/TypeError/ReferenceError"
    from pages.welcome_page import WelcomePage
    WelcomePage(driver).wait_for_root_rendered()
    logs = driver.get_log("browser")
    severe = [l for l in logs if l.get("level") == "SEVERE"]
    meta["actual"] = f"{len(severe)} SEVERE console entries: " + "; ".join(l.get("message", "")[:150] for l in severe[:5])
    assert not severe, f"Found {len(severe)} SEVERE browser console errors on initial load"
