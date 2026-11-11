import { chromium } from "playwright";
const outDir = process.argv[2];
const tag = process.argv[3] || "a";
const W = +(process.argv[4] || 844), H = +(process.argv[5] || 390);
const id = process.argv[6] || "spider-basic";
const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(`http://localhost:3000/dev/highway-preview?id=${id}`, { waitUntil: "load", timeout: 180000 });
await page.waitForTimeout(9000);
const shot = async (n) => page.screenshot({ path: `${outDir}/${tag}-${n}.png` });
await shot("1-load");
for (const name of [/^Skip$/i, /skip/i]) {
  const b = page.getByRole("button", { name });
  if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(1500); break; }
}
await shot("2-gate");
const prev = page.getByRole("button", { name: /Preview/i });
if (await prev.count()) { await prev.first().click(); await page.waitForTimeout(800); }
await shot("3-tab");
const open = page.getByRole("button", { name: "Show exercise tools" });
if (await open.count()) { await open.first().click({ force: true }); await page.waitForTimeout(900); }
await shot("4-drawer");
const vol = page.getByRole("button", { name: /Volume/i });
if (await vol.count()) { await vol.first().click({ force: true }); await page.waitForTimeout(700); await shot("5-volume"); await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
const sp = page.getByRole("button", { name: /Speed/i });
if (await sp.count()) { await sp.first().click({ force: true }); await page.waitForTimeout(700); await shot("7-speed"); await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
for (const n of ["Subdivision", "Beats per bar"]) { const b = page.getByRole("button", { name: n }); if (await b.count()) { await b.first().click({ force: true }); await page.waitForTimeout(700); await shot("8-" + n.split(" ")[0]); await page.keyboard.press("Escape"); await page.waitForTimeout(400); } }
const std = page.getByRole("button", { name: /Standard/i });
if (await std.count()) { await std.last().click({ force: true }); await page.waitForTimeout(900); await shot("9-tuning"); await page.keyboard.press("Escape"); await page.waitForTimeout(500); }
const look = page.getByRole("button", { name: "Tablature settings" });
if (await look.count()) { await look.last().click({ force: true }); await page.waitForTimeout(900); await shot("10-look"); await page.keyboard.press("Escape"); await page.waitForTimeout(500); }
const tun = page.getByRole("button", { name: /^Tuner$/i });
if (await tun.count()) { await tun.last().click({ force: true }); await page.waitForTimeout(900); await shot("11-tuner"); }
console.log((await page.locator("button").evaluateAll(bs => bs.map(b => (b.getAttribute("aria-label") || b.innerText || "").trim().slice(0, 30)).filter(Boolean))).join(" | "));
await browser.close();
