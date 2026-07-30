"""Performance observations using the browser Navigation Timing API."""
import time

import config
from pages.welcome_page import WelcomePage


def test_initial_load_time_observation(driver, meta):
    meta["module"] = "Performance"
    meta["scenario"] = "Measure time from navigation start to Welcome screen becoming interactive"
    meta["expected"] = "Observational only — no hard pass/fail threshold; recorded for the Performance Observations sheet"
    start = time.time()
    page = WelcomePage(driver).load()
    page.is_displayed()
    elapsed = round(time.time() - start, 2)

    timing = driver.execute_script(
        "var t = performance.timing; return {"
        "domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,"
        "loadEvent: t.loadEventEnd - t.navigationStart"
        "};"
    )
    meta["actual"] = f"selenium_observed_render_sec={elapsed}, domContentLoadedMs={timing.get('domContentLoaded')}, loadEventMs={timing.get('loadEvent')}"
    # Dev-mode Metro bundler is expected to be slow (unminified JS) — assert only that it eventually loads.
    assert elapsed < config.PAGE_LOAD_TIMEOUT, f"Welcome screen took {elapsed}s to become interactive (dev server)"
