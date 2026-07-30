"""Base Page Object for VoxiraApp (Expo / react-native-web).

react-native-web renders no semantic HTML: buttons/links become plain
``<div tabindex="0">`` elements and there are no ``data-testid`` /
``aria-label`` attributes anywhere in this codebase (confirmed by DOM probe
and source audit). Reliable automation locators are therefore text-content
based (XPath) for pressables, and ``type``/``placeholder`` attributes for the
few real ``<input>`` elements (TextInput maps to ``<input>`` on web).
"""
import time

from selenium.common.exceptions import (NoSuchElementException,
                                         TimeoutException)
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import config


class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, config.EXPLICIT_WAIT)

    # -- generic waits -----------------------------------------------------
    def wait_for_root_rendered(self, timeout=config.EXPLICIT_WAIT):
        """react-native-web mounts async; wait until #root has children."""
        self.wait.until(
            lambda d: d.execute_script(
                "var r=document.getElementById('root'); return !!r && r.children.length>0;"
            )
        )

    # -- pressable (tabindex=0 div) locators --------------------------------
    def _pressable_xpath(self, text: str) -> str:
        return f"//div[@tabindex='0'][.//*[contains(normalize-space(text()), {self._xpath_literal(text)})]]"

    @staticmethod
    def _xpath_literal(text: str) -> str:
        if "'" not in text:
            return f"'{text}'"
        parts = text.split("'")
        return "concat(" + ", \"'\", ".join(f"'{p}'" for p in parts) + ")"

    def find_pressable(self, text: str, timeout=config.EXPLICIT_WAIT):
        xpath = self._pressable_xpath(text)
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((By.XPATH, xpath))
        )

    def click_pressable(self, text: str, timeout=config.EXPLICIT_WAIT):
        el = self.find_pressable(text, timeout)
        try:
            WebDriverWait(self.driver, timeout).until(EC.element_to_be_clickable((By.XPATH, self._pressable_xpath(text))))
            el.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", el)
        return el

    def pressable_exists(self, text: str, timeout=3) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, self._pressable_xpath(text)))
            )
            return True
        except TimeoutException:
            return False

    def text_present(self, text: str, timeout=config.EXPLICIT_WAIT) -> bool:
        xpath = f"//*[contains(normalize-space(text()), {self._xpath_literal(text)})]"
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            return True
        except TimeoutException:
            return False

    # -- text inputs ---------------------------------------------------------
    def input_by_type(self, input_type: str, timeout=config.EXPLICIT_WAIT):
        # See input_by_placeholder for why we scan for the first *visible*
        # match rather than trusting the first DOM match.
        selector = f"input[type='{input_type}']"

        def _first_visible(driver):
            for el in driver.find_elements(By.CSS_SELECTOR, selector):
                if el.is_displayed():
                    return el
            return False

        return WebDriverWait(self.driver, timeout).until(_first_visible)

    def input_by_placeholder(self, placeholder: str, timeout=config.EXPLICIT_WAIT):
        # React Navigation's stack navigator keeps the PREVIOUS screen mounted
        # (off-screen, zero-size) rather than unmounting it on push. Several
        # screens in this app reuse the exact placeholder "you@email.com"
        # (LoginScreen and ForgotPasswordScreen both do), so an xpath keyed
        # only on placeholder can match >1 <input>, and a plain
        # visibility_of_element_located always resolves to the *first* DOM
        # match — which can be the previous screen's hidden, zero-size input,
        # causing a permanent (not transient) timeout. Explicitly scan all
        # matches and return the one that is actually visible.
        xpath = f"//input[@placeholder={self._xpath_literal(placeholder)}]"

        def _first_visible(driver):
            for el in driver.find_elements(By.XPATH, xpath):
                if el.is_displayed():
                    return el
            return False

        return WebDriverWait(self.driver, timeout).until(_first_visible)

    def type_into(self, element, value: str):
        element.click()
        element.send_keys(value)

    def clear_and_type(self, element, value: str):
        element.click()
        element.send_keys(Keys.CONTROL + "a")
        element.send_keys(Keys.DELETE)
        element.send_keys(value)

    # -- misc ------------------------------------------------------------
    def open(self, path: str = ""):
        self.driver.get(config.BASE_URL.rstrip("/") + "/" + path.lstrip("/"))
        self.wait_for_root_rendered()

    def current_root_html(self) -> str:
        return self.driver.execute_script("return document.getElementById('root').innerHTML")

    def network_requests_matching(self, substring: str) -> int:
        """Count Performance API resource entries whose URL contains `substring`.
        Used to prove client-side-only validation truly blocked a network call
        (e.g. to Supabase auth) rather than just inferring it from UI state."""
        return self.driver.execute_script(
            "return performance.getEntriesByType('resource').filter(r => r.name.includes(arguments[0])).length",
            substring,
        )
