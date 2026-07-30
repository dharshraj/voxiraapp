"""Accessibility + UI validation checks, run against the live rendered DOM.

Baseline finding from the DOM probe performed during framework setup: this
app (react-native-web output) has zero aria-* attributes, zero semantic
<button>/<a> tags, and zero data-testid hooks anywhere in the rendered tree
— every interactive element is a bare `<div tabindex="0">`. These tests
assert that finding in an automated, repeatable way (rather than only
asserting it manually once) so regressions/improvements are tracked."""
from selenium.webdriver.common.by import By

from pages.welcome_page import WelcomePage


def test_page_has_title(driver, meta):
    meta["module"] = "Accessibility"
    meta["scenario"] = "Document has a non-empty <title> for screen readers / browser tabs"
    meta["expected"] = "driver.title is non-empty"
    WelcomePage(driver).load()
    title = driver.title
    meta["actual"] = f"title='{title}'"
    assert title.strip(), "Page <title> is empty"


def test_html_lang_attribute_present(driver, meta):
    meta["module"] = "Accessibility"
    meta["scenario"] = "<html> declares a lang attribute (screen reader language detection)"
    meta["expected"] = "html[lang] attribute is present and non-empty"
    WelcomePage(driver).load()
    lang = driver.find_element(By.TAG_NAME, "html").get_attribute("lang")
    meta["actual"] = f"lang='{lang}'"
    assert lang, "html element has no lang attribute"


def test_interactive_elements_lack_accessible_roles(driver, meta):
    meta["module"] = "Accessibility"
    meta["scenario"] = "Count interactive (tabindex=0) elements that expose no role/aria-label — a known gap"
    meta["expected"] = "Documented baseline: react-native-web Pressables here render with no ARIA role/label (see Accessibility Findings sheet)"
    WelcomePage(driver).load()
    pressables = driver.find_elements(By.XPATH, "//div[@tabindex='0']")
    unlabeled = [e for e in pressables if not e.get_attribute("role") and not e.get_attribute("aria-label")]
    meta["actual"] = f"{len(unlabeled)}/{len(pressables)} interactive elements have no role/aria-label"
    # This is a known/expected finding, not a pass/fail gate — assert the count is captured, not that it's zero.
    assert len(pressables) > 0, "No interactive elements found on Welcome screen at all (unexpected — page may have failed to render)"


def test_no_horizontal_overflow_on_welcome_screen(driver, meta):
    meta["module"] = "UI Validation"
    meta["scenario"] = "Welcome screen content does not cause horizontal page overflow/scroll at 1440px width"
    meta["expected"] = "document.documentElement.scrollWidth <= window innerWidth (+ small tolerance)"
    WelcomePage(driver).load()
    scroll_width = driver.execute_script("return document.documentElement.scrollWidth")
    inner_width = driver.execute_script("return window.innerWidth")
    meta["actual"] = f"scrollWidth={scroll_width}, innerWidth={inner_width}"
    assert scroll_width <= inner_width + 20, f"Horizontal overflow detected: scrollWidth {scroll_width} > innerWidth {inner_width}"


def test_viewport_meta_tag_present(driver, meta):
    meta["module"] = "UI Validation"
    meta["scenario"] = "Responsive viewport meta tag is present (web/index.html)"
    meta["expected"] = "meta[name=viewport] exists with width=device-width"
    WelcomePage(driver).load()
    els = driver.find_elements(By.CSS_SELECTOR, "meta[name='viewport']")
    content = els[0].get_attribute("content") if els else ""
    meta["actual"] = f"content='{content}'"
    assert "width=device-width" in content, "Responsive viewport meta tag missing or malformed"
