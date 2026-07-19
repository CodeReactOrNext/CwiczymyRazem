import { chromium } from "playwright";

const out = process.argv[2] || ".";
const url = "http://localhost:3000/dev/highway-preview?id=spider-basic";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

async function capture(name, hw) {
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate((cfg) => {
    // Include a stale laneShade to prove hidden sliders no longer leak through.
    localStorage.setItem(
      "riffquest.highway3d.view",
      JSON.stringify({ ...cfg, laneShade: 0.9 }),
    );
  }, hw);
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(1500);
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.count()) { await skip.click(); await page.waitForTimeout(500); }
  await page.locator("button", { hasText: "Tablature" }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("menuitem", { name: /3D Highway/ }).click();
  await page.waitForTimeout(3000);
  await page.locator("canvas").last().screenshot({ path: `${out}/nt-${name}.png` });
  console.log("captured", name);
}

await capture("paper", { theme: "paper", palette: "poster", boardOpacity: 1 });
await capture("noir", { theme: "noir", palette: "vintage", boardOpacity: 1 });
await capture("lattice", { theme: "lattice", palette: "neon", boardOpacity: 1 });
await capture("dissolve", { theme: "midnight", palette: "rainbow", boardOpacity: 0.2 });
await browser.close();
