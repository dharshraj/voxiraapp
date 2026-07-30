"""Screenshot capture helper — routes screenshots into passed/failed/exceptions."""
import re
import time
from pathlib import Path

import config


def _safe_name(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", name)


def capture(driver, name: str, status: str) -> str:
    """status in {'passed', 'failed', 'exceptions'}. Returns the saved file path (or '' on failure)."""
    target_dir = {
        "passed": config.SCREENSHOTS_PASSED,
        "failed": config.SCREENSHOTS_FAILED,
        "exceptions": config.SCREENSHOTS_EXCEPTIONS,
    }.get(status, config.SCREENSHOTS_FAILED)

    filename = f"{_safe_name(name)}_{int(time.time() * 1000)}.png"
    path = Path(target_dir) / filename
    try:
        driver.save_screenshot(str(path))
    except Exception:
        return ""
    return str(path)
