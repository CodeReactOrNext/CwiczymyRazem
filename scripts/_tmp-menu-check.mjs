import { chromium } from "playwright";

const outDir = process.argv[2] || ".";
const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  permissions: ["microphone"],
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto("http://localhost:3000/dev/highway-preview?id=spider-basic", {
  waitUntil: "load",
  timeout: 120000,
});
await page.waitForTimeout(10000);
const skip = page.getByRole("button", { name: /^Skip$/i });
if (await skip.count()) { await skip.first().click(); await page.waitForTimeout(1500); }

const chevron = page.locator('button[title="Mic tools"]');
console.log("chevron count:", await chevron.count());
await chevron.click();
await page.waitForTimeout(800);

const menu = page.getByRole("menu");
console.log("menu open:", await menu.count());
for (const item of await page.getByRole("menuitem").all()) {
  console.log("item:", (await item.innerText()).trim(), "| disabled:", await item.getAttribute("data-disabled") !== null);
}
await page.screenshot({ path: `${outDir}/menu-open.png`, clip: { x: 200, y: 400, width: 800, height: 420 } });

// Tuner opens from the menu
await page.getByRole("menuitem", { name: "Tuner" }).click();
await page.waitForTimeout(800);
console.log("tuner dialog visible:", await page.getByText("Enable Pitch Detect to use the tuner").count());
await page.screenshot({ path: `${outDir}/menu-tuner.png` });
await browser.close();
