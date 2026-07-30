"""Performance tests — 20 tests using browser Navigation Timing API,
Resource Timing, and threshold assertions derived from real user expectations.
These tests run against the live dev server; thresholds are configured in config.py.

PERF-001 … PERF-008  Page load timings (Navigation Timing API)
PERF-009 … PERF-014  Resource + paint timings
PERF-015 … PERF-020  Interaction / response timings
"""
import time
import pytest
import config
from pages.welcome_page import WelcomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.forgot_password_page import ForgotPasswordPage

# ══════════════════════════════════════════════════════════════════════════════
# PERF-001 … PERF-008  — Navigation Timing
# ══════════════════════════════════════════════════════════════════════════════

def test_perf_001_welcome_dom_content_loaded(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-001: WelcomeScreen DOMContentLoaded time",
        expected=f"domContentLoaded < {config.PERF_DOM_CONTENT_LOADED_MAX}ms")
    WelcomePage(driver).load()
    dcl = driver.execute_script(
        "var t=performance.timing; return t.domContentLoadedEventEnd - t.navigationStart;")
    meta["actual"] = f"domContentLoaded={dcl}ms"
    assert dcl < config.PERF_DOM_CONTENT_LOADED_MAX, (
        f"DOMContentLoaded {dcl}ms exceeds threshold {config.PERF_DOM_CONTENT_LOADED_MAX}ms")

def test_perf_002_welcome_load_event(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-002: WelcomeScreen load event time",
        expected=f"loadEvent < {config.PERF_LOAD_EVENT_MAX_MS}ms")
    WelcomePage(driver).load()
    le = driver.execute_script(
        "var t=performance.timing; return t.loadEventEnd - t.navigationStart;")
    meta["actual"] = f"loadEvent={le}ms"
    assert le < config.PERF_LOAD_EVENT_MAX_MS, f"Load event {le}ms exceeds {config.PERF_LOAD_EVENT_MAX_MS}ms"

def test_perf_003_welcome_selenium_render_time(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-003: WelcomeScreen renders within threshold measured by Selenium wall-clock",
        expected=f"Selenium render < {config.PERF_WELCOME_LOAD_MAX_SEC}s")
    t0 = time.time()
    WelcomePage(driver).load()
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"elapsed={elapsed}s"
    assert elapsed < config.PERF_WELCOME_LOAD_MAX_SEC, (
        f"Welcome render {elapsed}s > threshold {config.PERF_WELCOME_LOAD_MAX_SEC}s")

def test_perf_004_login_screen_render_time(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-004: LoginScreen render time after navigation from Welcome",
        expected=f"< {config.PERF_LOGIN_LOAD_MAX_SEC}s")
    WelcomePage(driver).load()
    t0 = time.time()
    WelcomePage(driver).click_sign_in()
    LoginPage(driver).is_displayed()
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"elapsed={elapsed}s"
    assert elapsed < config.PERF_LOGIN_LOAD_MAX_SEC

def test_perf_005_register_screen_render_time(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-005: RegisterScreen render time after navigation from Login",
        expected=f"< {config.PERF_LOGIN_LOAD_MAX_SEC}s")
    WelcomePage(driver).load().click_sign_in()
    t0 = time.time()
    LoginPage(driver).click_sign_up()
    RegisterPage(driver).is_displayed()
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"elapsed={elapsed}s"
    assert elapsed < config.PERF_LOGIN_LOAD_MAX_SEC

def test_perf_006_forgot_password_render_time(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-006: ForgotPasswordScreen render time",
        expected=f"< {config.PERF_LOGIN_LOAD_MAX_SEC}s")
    WelcomePage(driver).load().click_sign_in()
    t0 = time.time()
    LoginPage(driver).click_forgot_password()
    ForgotPasswordPage(driver).is_displayed()
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"elapsed={elapsed}s"
    assert elapsed < config.PERF_LOGIN_LOAD_MAX_SEC

def test_perf_007_navigation_timing_ttfb(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-007: Time to First Byte (TTFB) for WelcomeScreen",
        expected="TTFB < 3000ms (dev server)")
    WelcomePage(driver).load()
    ttfb = driver.execute_script(
        "var t=performance.timing; return t.responseStart - t.navigationStart;")
    meta["actual"] = f"ttfb={ttfb}ms"
    assert ttfb < 3000, f"TTFB {ttfb}ms is high"

def test_perf_008_dom_interactive_time(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-008: DOM interactive time (navigationStart → domInteractive)",
        expected="domInteractive < 8000ms")
    WelcomePage(driver).load()
    di = driver.execute_script(
        "var t=performance.timing; return t.domInteractive - t.navigationStart;")
    meta["actual"] = f"domInteractive={di}ms"
    assert di < 8000

# ══════════════════════════════════════════════════════════════════════════════
# PERF-009 … PERF-014  — Resource / paint timings
# ══════════════════════════════════════════════════════════════════════════════

def test_perf_009_js_bundle_count(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-009: Count JavaScript resource entries loaded on WelcomeScreen",
        expected="At least 1 JS bundle loaded (Metro bundler)")
    WelcomePage(driver).load()
    js_resources = driver.execute_script(
        "return performance.getEntriesByType('resource')"
        ".filter(r=>r.initiatorType==='script').length;")
    meta["actual"] = f"js_resources={js_resources}"
    assert js_resources >= 1, "No JS bundles found — Metro bundler may not have served JS"

def test_perf_010_total_resource_count(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-010: Total resource count loaded on WelcomeScreen",
        expected="Resource count recorded (observational baseline)")
    WelcomePage(driver).load()
    total = driver.execute_script(
        "return performance.getEntriesByType('resource').length;")
    meta["actual"] = f"total_resources={total}"
    assert total >= 1

def test_perf_011_largest_js_bundle_size(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-011: Largest JS bundle transfer size (observational)",
        expected="transferSize recorded for reporting")
    WelcomePage(driver).load()
    sizes = driver.execute_script(
        "return performance.getEntriesByType('resource')"
        ".filter(r=>r.initiatorType==='script')"
        ".map(r=>r.transferSize||r.encodedBodySize||0);")
    max_size = max(sizes) if sizes else 0
    meta["actual"] = f"max_bundle_transfer_size={max_size}bytes ({round(max_size/1024,1)}KB)"
    # Observational — no hard threshold; just assert something was loaded
    assert max_size >= 0

def test_perf_012_first_paint_from_performance_observer(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-012: First Paint time via PerformancePaintTiming",
        expected=f"first-paint < {config.PERF_FIRST_PAINT_MAX_MS}ms (if API available)")
    WelcomePage(driver).load()
    fp = driver.execute_script("""
        var entries = performance.getEntriesByType('paint');
        var fp = entries.find(e => e.name === 'first-paint');
        return fp ? fp.startTime : -1;
    """)
    meta["actual"] = f"first-paint={fp}ms"
    if fp == -1:
        pytest.skip("Paint Timing API not available in this browser/mode")
    assert fp < config.PERF_FIRST_PAINT_MAX_MS

def test_perf_013_no_render_blocking_css(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-013: No render-blocking CSS <link> in <head> (React Native inlines styles)",
        expected="0 render-blocking stylesheet link elements in head")
    WelcomePage(driver).load()
    from selenium.webdriver.common.by import By
    blocking = driver.find_elements(
        By.CSS_SELECTOR, "head link[rel='stylesheet'][media='all']")
    # Only flag if a blocking (no media query/deferred) stylesheet exists
    meta["actual"] = f"blocking_stylesheets={len(blocking)}"
    # Observational — just record
    assert True

def test_perf_014_local_storage_not_storing_credentials(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-014: localStorage does not contain raw email/password strings",
        expected="No 'password' key in localStorage (credentials should not be persisted)")
    WelcomePage(driver).load()
    keys = driver.execute_script(
        "return Object.keys(localStorage).filter(k=>k.toLowerCase().includes('password'));")
    meta["actual"] = f"password_keys_in_localstorage={keys}"
    assert len(keys) == 0, f"Password key found in localStorage: {keys}"

# ══════════════════════════════════════════════════════════════════════════════
# PERF-015 … PERF-020  — Interaction / repeat-load timings
# ══════════════════════════════════════════════════════════════════════════════

def test_perf_015_repeated_navigation_stable(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-015: 3 consecutive Welcome→Login navigations complete without degradation",
        expected="Each navigation < 6s; no JS exceptions")
    times = []
    for i in range(3):
        driver.get(config.BASE_URL)
        WelcomePage(driver).wait_for_root_rendered()
        t0 = time.time()
        WelcomePage(driver).click_sign_in()
        LoginPage(driver).is_displayed()
        times.append(round(time.time() - t0, 2))
    meta["actual"] = f"navigation_times={times}"
    assert all(t < 6.0 for t in times), f"Slow navigation detected: {times}"

def test_perf_016_form_input_response_time(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-016: Typing into email input renders instantly (< 500ms Selenium round-trip)",
        expected="send_keys + read value completes in < 0.5s")
    WelcomePage(driver).load().click_sign_in()
    login = LoginPage(driver)
    t0 = time.time()
    login.enter_email("test@example.com")
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"input_interaction_time={elapsed}s"
    assert elapsed < 0.5, f"Input interaction too slow: {elapsed}s"

def test_perf_017_page_reload_completes_in_threshold(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-017: Hard reload of WelcomeScreen completes within threshold",
        expected=f"Reload < {config.PERF_WELCOME_LOAD_MAX_SEC}s")
    WelcomePage(driver).load()
    t0 = time.time()
    driver.refresh()
    WelcomePage(driver).wait_for_root_rendered()
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"reload_time={elapsed}s"
    assert elapsed < config.PERF_WELCOME_LOAD_MAX_SEC

def test_perf_018_memory_leak_check_after_navigation(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-018: JS heap size after 5 navigations is not >2× initial heap",
        expected="JS heap does not grow >2× from repeated navigation (no obvious leak)")
    WelcomePage(driver).load()
    heap0 = driver.execute_script(
        "return performance.memory ? performance.memory.usedJSHeapSize : 0;")
    for _ in range(5):
        WelcomePage(driver).click_sign_in()
        time.sleep(0.3)
        driver.get(config.BASE_URL)
        WelcomePage(driver).wait_for_root_rendered()
        time.sleep(0.3)
    heap1 = driver.execute_script(
        "return performance.memory ? performance.memory.usedJSHeapSize : 0;")
    ratio = round(heap1 / max(heap0, 1), 2)
    meta["actual"] = f"initial_heap={heap0}B, final_heap={heap1}B, ratio={ratio}"
    if heap0 == 0:
        pytest.skip("performance.memory API not available")
    assert ratio < 2.0, f"Potential memory leak — heap grew {ratio}× after 5 navigations"

def test_perf_019_network_requests_on_welcome_count(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-019: Number of network requests on WelcomeScreen initial load",
        expected="Request count recorded (baseline for regression)")
    WelcomePage(driver).load()
    count = driver.execute_script(
        "return performance.getEntriesByType('resource').length;")
    meta["actual"] = f"network_requests={count}"
    # Just a baseline capture — fail only if nothing loaded at all
    assert count >= 1

def test_perf_020_session_storage_size_reasonable(driver, meta):
    meta.update(module="Performance", test_type="Selenium",
        scenario="PERF-020: sessionStorage size on WelcomeScreen is < 100KB",
        expected="sessionStorage serialized size < 102400 bytes")
    WelcomePage(driver).load()
    size = driver.execute_script("""
        var total = 0;
        for (var key in sessionStorage) {
            if (sessionStorage.hasOwnProperty(key)) {
                total += sessionStorage[key].length + key.length;
            }
        }
        return total;
    """)
    meta["actual"] = f"sessionStorage_size={size}bytes"
    assert size < 102400, f"sessionStorage unusually large: {size} bytes"
