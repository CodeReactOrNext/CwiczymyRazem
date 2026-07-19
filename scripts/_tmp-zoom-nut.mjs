import { chromium } from "playwright";
const outDir = process.argv[2] || ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("http://localhost:3000/dev/highway-preview?id=spider-basic", { waitUntil: "load" });
await page.waitForSelector("canvas", { timeout: 30000 });
await page.waitForTimeout(1200);
const skip = page.getByRole("button", { name: "Skip" });
if (await skip.count()) { await skip.click(); await page.waitForTimeout(400); }
await page.locator('button[title="Switch to 3D highway"]').click();
await page.waitForTimeout(1000);
await page.locator("canvas").last().screenshot({ path: `${outDir}/zoom-full.png` });
await page.locator("canvas").last().screenshot({ path: `${outDir}/zoom-nut.png`, clip: { x: 520, y: 220, width: 200, height: 100 } });
await browser.close();
