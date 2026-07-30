const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 900 });

  // Click the first VISIBLE element matching text
  const clickVisible = async (text, timeout = 8000) => {
    const els = page.locator(`text=${text}`);
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      const el = els.nth(i);
      const visible = await el.isVisible().catch(() => false);
      if (visible) {
        await el.click({ force: true });
        return true;
      }
    }
    // fallback: JS click on first with matching text
    await page.evaluate((t) => {
      const els = Array.from(document.querySelectorAll('*'));
      const el = els.find(e => e.childNodes.length &&
        Array.from(e.childNodes).some(n => n.nodeType === 3 && n.textContent?.trim() === t));
      if (el) el.click();
    }, text);
    return false;
  };

  try {
    // Welcome
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(4500);
    await page.screenshot({ path: 'screen_welcome.png' });
    console.log('✓ Welcome');

    // → Feature 1
    await clickVisible('Get Started Free');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'screen_feature1.png' });
    console.log('✓ Feature 1');

    // → Feature 2 (click at bottom center where Next button is)
    await page.mouse.click(210, 850);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screen_feature2.png' });
    console.log('✓ Feature 2 (mouse)');

    // → Feature 3
    await page.mouse.click(280, 850);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screen_feature3.png' });
    console.log('✓ Feature 3 (mouse)');

    // → Register
    await page.mouse.click(280, 850);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screen_register.png' });
    console.log('✓ Register (mouse)');

    // → Login (click Sign In link)
    await page.mouse.click(210, 860);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screen_login.png' });
    console.log('✓ Login (mouse)');

  } catch (e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: 'screen_error_full.png' }).catch(() => {});
  }

  await browser.close();
})();
