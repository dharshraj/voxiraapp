const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 860 });

  try {
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screen_welcome.png' });
    console.log('✓ Welcome screen captured');

    // Try clicking "Get Started" button
    const btn = page.locator('text=Get Started Free').first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screen_feature1.png' });
      console.log('✓ Feature 1 screen captured');

      // Next
      const next = page.locator('text=Next').first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screen_feature2.png' });
        console.log('✓ Feature 2 screen captured');
      }

      // Next again
      const next2 = page.locator('text=Next').first();
      if (await next2.isVisible().catch(() => false)) {
        await next2.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screen_feature3.png' });
        console.log('✓ Feature 3 screen captured');
      }

      // Register
      const getStarted = page.locator('text=Get Started Free').first();
      if (await getStarted.isVisible().catch(() => false)) {
        await getStarted.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'screen_register.png' });
        console.log('✓ Register screen captured');
      }
    } else {
      console.log('Get Started button not found — checking page content...');
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
      console.log('Page title:', title);
      console.log('Body text:', bodyText);
    }

    // Navigate directly to login
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    const login = page.locator('text=Sign In').first();
    if (await login.isVisible().catch(() => false)) {
      await login.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screen_login.png' });
      console.log('✓ Login screen captured');
    }

  } catch (e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: 'screen_error.png' });
  }

  await browser.close();
})();
