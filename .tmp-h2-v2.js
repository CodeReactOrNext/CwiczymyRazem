const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  await page.goto('http://localhost:3000/blog/how-long-practice-guitar-daily', { waitUntil: 'networkidle' });

  // Screenshot 1: Beginner section
  const el1 = await page.locator('text=How Long Should You Practice').first();
  await el1.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.tmp-h2-main.png' });

  // Screenshot 2: Another section
  const el2 = await page.locator('text=Intermediate Practice Schedule').first();
  await el2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.tmp-h2-intermediate.png' });

  await browser.close();
})();
