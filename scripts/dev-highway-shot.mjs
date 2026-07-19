import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000/dev/highway-preview?id=spider-basic";
const outDir = process.argv[3] || ".";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console.error]", msg.text());
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto(url, { waitUntil: "load" });
await page.waitForSelector("canvas", { timeout: 30000 });
await page.waitForTimeout(1500);

const skipMicBtn = page.getByRole("button", { name: "Skip" });
if (await skipMicBtn.count()) {
  await skipMicBtn.click();
  await page.waitForTimeout(500);
}

await page.screenshot({ path: `${outDir}/01-loaded.png` });

const tab2dBtn = page.locator('button[title="Switch to flat tablature"]');
const tab3dBtn = page.locator('button[title="Switch to 3D highway"]');

if (await tab3dBtn.count()) {
  await page.screenshot({ path: `${outDir}/02-flat-tab.png` });
  await tab3dBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}/03-3d-highway.png` });
  await page.screenshot({ path: `${outDir}/04-3d-highway-zoom.png`, clip: { x: 450, y: 480, width: 550, height: 260 } });
  const highwayCanvas = page.locator("canvas").last();
  await highwayCanvas.screenshot({ path: `${outDir}/05-3d-canvas.png` });

  // Press Start and capture mid-play frames — the count-in is 4 beats,
  // so ~7s in at 80 BPM the highway is actually scrolling.
  const startBtn = page.locator('button:has-text("Start")').filter({ hasNotText: "Session" }).first();
  if (await startBtn.count()) {
    await startBtn.click();
    await page.waitForTimeout(7000);
    await highwayCanvas.screenshot({ path: `${outDir}/06-3d-playing.png` });
    await page.waitForTimeout(4000);
    await highwayCanvas.screenshot({ path: `${outDir}/07-3d-playing-later.png` });
  }
} else if (await tab2dBtn.count()) {
  await page.screenshot({ path: `${outDir}/02-3d-highway.png` });
  await tab2dBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}/03-flat-tab.png` });
} else {
  console.log("No 3D/2D toggle button found on the page.");
}

await browser.close();
