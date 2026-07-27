import { chromium } from "playwright";

const url = "http://localhost:3000/blog/how-to-practice-guitar-scales-effectively";
const outPath = "C:\\Users\\Krokon\\AppData\\Local\\Temp\\claude\\g--cw-sss-CwiczymyRazem\\b73a8bde-a3ca-4d03-93d3-37726590ecab\\scratchpad\\scale-diagram.png";
const outPathFull = "C:\\Users\\Krokon\\AppData\\Local\\Temp\\claude\\g--cw-sss-CwiczymyRazem\\b73a8bde-a3ca-4d03-93d3-37726590ecab\\scratchpad\\scale-section-full.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console.error]", msg.text());
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto(url, { waitUntil: "load" });
await page.waitForSelector("text=The major scale, one string at a time", { timeout: 30000 });

const diagram = page.locator("text=The major scale, one string at a time").first().locator("xpath=ancestor::div[contains(@class, 'not-prose')][1]");
await diagram.scrollIntoViewIfNeeded();
await diagram.screenshot({ path: outPath });
console.log("saved diagram to", outPath);

const heading = page.locator("h2", { hasText: "Feeling Lost With Guitar Scales" }).first();
await heading.scrollIntoViewIfNeeded();
const box = await heading.boundingBox();
await page.screenshot({ path: outPathFull, clip: { x: 0, y: Math.max(0, box.y - 20), width: 1000, height: 900 } });
console.log("saved full section to", outPathFull);

await browser.close();
