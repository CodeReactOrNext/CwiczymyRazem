import { chromium } from "playwright";

const out = process.argv[2] || ".";
const url = "http://localhost:3000/dev/highway-preview?id=spider-basic";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => {
  const raw = localStorage.getItem("riffquest.highway3d.view");
  const s = raw ? JSON.parse(raw) : {};
  s.theme = "sunset";
  s.boardOpacity = 1;
  localStorage.setItem("riffquest.highway3d.view", JSON.stringify(s));
});
await page.reload({ waitUntil: "load" });
await page.waitForSelector("canvas", { timeout: 30000 });
await page.waitForTimeout(1500);
const skip = page.getByRole("button", { name: "Skip" });
if (await skip.count()) { await skip.click(); await page.waitForTimeout(500); }

await page.locator("button", { hasText: "Tablature" }).first().click();
await page.waitForTimeout(300);
await page.getByRole("menuitem", { name: /3D Highway/ }).click();
await page.waitForTimeout(2500);

const canvas = page.locator("canvas").last();
await canvas.screenshot({ path: `${out}/bo-1-solid.png` });

// Open the in-view settings panel and drive the new slider down to ~25%.
await page.locator('button[title="View settings"]').click();
await page.waitForTimeout(400);
const slider = page.getByRole("slider", { name: /Board opacity/ }).first();
console.log("Board opacity slider present:", await slider.count());
await slider.focus();
for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(800);
await page.locator('button[title="View settings"]').click(); // close panel
await page.waitForTimeout(400);
await canvas.screenshot({ path: `${out}/bo-2-glass.png` });

const stored = JSON.parse(await page.evaluate(() => localStorage.getItem("riffquest.highway3d.view")));
console.log("stored boardOpacity:", stored.boardOpacity);
await browser.close();
