import { chromium } from "playwright";

const outDir = process.argv[2] || ".";
const tag = process.argv[3] || "toolbar";
const exercise = process.argv[4] || "spider-basic";

const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  permissions: ["microphone"],
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(`http://localhost:3000/dev/highway-preview?id=${exercise}`, {
  waitUntil: "load",
  timeout: 120000,
});
await page.waitForTimeout(10000);

const skip = page.getByRole("button", { name: /^Skip$/i });
if (await skip.count()) {
  await skip.first().click();
  await page.waitForTimeout(2000);
}

// Mic OFF state first
await page.screenshot({ path: `${outDir}/${tag}-micoff.png` });

const pitch = page.getByRole("button", { name: /Pitch Detect/i });
const off = await pitch.first().boundingBox();

await pitch.first().click();
await page.waitForTimeout(5000);
const on = await pitch.first().boundingBox();
console.log("pitch btn shift on mic toggle:", (on.x - off.x).toFixed(2), "px");

await page.screenshot({ path: `${outDir}/${tag}-micon.png` });

// Open the mic tools menu
const chevron = page.locator('button[title="Mic tools"]');
await chevron.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/${tag}-menu.png` });
console.log("done");
await browser.close();
