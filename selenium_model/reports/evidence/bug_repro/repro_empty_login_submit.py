import sys, time
sys.path.insert(0, "c:/Users/91637/VoxiraApp/selenium_model")
import config
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from pages.welcome_page import WelcomePage
from pages.login_page import LoginPage

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1440,1024")
opts.add_argument("--disable-gpu")
opts.add_argument("--no-sandbox")
drv = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
drv.get(config.BASE_URL)
try:
    WelcomePage(drv).load()
    WelcomePage(drv).click_sign_in()
    login = LoginPage(drv)
    assert login.is_displayed()
    login.submit()
    time.sleep(2)
    html = login.current_root_html()
    with open("selenium_model/reports/logs/_debug_login_validation.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote debug html, len=", len(html))
    for entry in drv.get_log("browser"):
        print("CONSOLE:", entry.get("level"), entry.get("message")[:300])
    email_val = login.email_input().get_attribute("value")
    pw_val = login.password_input().get_attribute("value")
    print("email input value:", repr(email_val))
    print("password input value:", repr(pw_val))
    drv.save_screenshot("selenium_model/reports/logs/_debug_after_submit.png")
finally:
    drv.quit()
