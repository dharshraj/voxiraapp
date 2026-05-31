const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 900 });

  await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'dbg_1_welcome.png' });

  // Click Get Started Free
  try {
    await page.click('text=Get Started Free', { timeout: 5000 });
    console.log('Clicked Get Started Free');
  } catch {
    console.log('Could not click Get Started Free, trying force...');
    const el = await page.$('text=Get Started Free');
    if (el) await el.click({ force: true });
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dbg_2_feature1.png' });
  console.log('After Get Started Free');

  // Log all visible text
  const texts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[class*="css"]'))
      .map(el => el.textContent?.trim())
      .filter(t => t && t.length > 1 && t.length < 60)
      .slice(0, 30)
  );
  console.log('Visible text:', texts);

  await browser.close();
})();
