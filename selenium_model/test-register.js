const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 900 });

  try {
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3500);

    // Navigate through to Register via Feature3 → Get Started Free
    await page.mouse.click(210, 820); // Get Started Free on Welcome
    await page.waitForTimeout(1200);
    await page.mouse.click(210, 840); // Next on F1
    await page.waitForTimeout(1000);
    await page.mouse.click(280, 840); // Next on F2
    await page.waitForTimeout(1000);
    // On Feature3, click "Get Started Free" button (approx y=810)
    await page.mouse.click(280, 810);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'screen_register_real.png' });
    console.log('✓ Register screen captured');

    // Also check the welcome screen more carefully
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screen_welcome_hires.png', fullPage: true });

  } catch (e) {
    console.error(e.message);
    await page.screenshot({ path: 'screen_reg_error.png' });
  }

  await browser.close();
})();
