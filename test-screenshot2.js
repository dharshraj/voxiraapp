const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 900 });

  const clickNext = async () => {
    // Try scrolling down to find and click Next
    const btn = page.locator('text=Next').first();
    await btn.scrollIntoViewIfNeeded({ timeout: 5000 });
    await btn.click({ force: true });
    await page.waitForTimeout(1000);
  };

  try {
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3500);

    // Welcome → Feature1
    const getStarted = page.locator('text=Get Started Free').first();
    await getStarted.scrollIntoViewIfNeeded({ timeout: 5000 });
    await getStarted.click({ force: true });
    await page.waitForTimeout(1200);

    // Feature1 → Feature2
    await clickNext();

    // Feature2 → Feature3
    await clickNext();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screen_feature3.png' });
    console.log('✓ Feature 3 captured');

    // Feature3 → Register
    const gsBtn = page.locator('text=Get Started Free').first();
    await gsBtn.scrollIntoViewIfNeeded({ timeout: 5000 });
    await gsBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screen_register.png' });
    console.log('✓ Register captured');

    // Login
    const signIn = page.locator('text=Sign In').first();
    if (await signIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signIn.click({ force: true });
    } else {
      // Try Already have an account link
      const alreadyHave = page.locator('text=Already have an account').first();
      if (await alreadyHave.isVisible({ timeout: 3000 }).catch(() => false)) {
        await alreadyHave.click({ force: true });
      }
    }
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'screen_login.png' });
    console.log('✓ Login captured');

  } catch (e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: 'screen_error2.png' });
  }

  await browser.close();
})();
