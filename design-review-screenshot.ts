import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "test-results", "design-review");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Launching system Chrome...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  console.log("Browser launched.");

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  // Test connectivity
  console.log("Connecting to dev server...");
  try {
    const resp = await page.goto(BASE_URL, { timeout: 30000, waitUntil: "domcontentloaded" });
    console.log(`  Connected! Status: ${resp?.status()}`);
  } catch (e: any) {
    console.log(`  Connection failed: ${e.message?.slice(0, 120)}`);
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(3000);

  // Screenshot homepage
  await page.screenshot({
    path: path.join(OUT_DIR, "homepage-desktop.png"),
    fullPage: false,
    timeout: 10000,
  });
  console.log("  Saved homepage-desktop.png");

  // Navigate to /arsenal
  console.log("Navigating to /arsenal...");
  try {
    await page.goto(`${BASE_URL}/arsenal`, { timeout: 30000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(OUT_DIR, "arsenal-desktop.png"),
      fullPage: false,
      timeout: 10000,
    });
    console.log(`  Saved arsenal-desktop.png (URL: ${page.url()})`);
  } catch (e: any) {
    console.log(`  Arsenal: ${e.message?.slice(0, 80)}`);
  }

  // Mobile viewport
  const mobileCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const mobilePage = await mobileCtx.newPage();

  try {
    await mobilePage.goto(`${BASE_URL}/arsenal`, { timeout: 30000, waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({
      path: path.join(OUT_DIR, "arsenal-mobile.png"),
      fullPage: false,
      timeout: 10000,
    });
    console.log(`  Saved arsenal-mobile.png (URL: ${mobilePage.url()})`);
  } catch (e: any) {
    console.log(`  Arsenal mobile: ${e.message?.slice(0, 80)}`);
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
