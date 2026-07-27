import { chromium } from "playwright";

const url = "http://localhost:3000/blog/how-to-track-guitar-practice-progress-effectively";
const outPath = "C:\\Users\\Krokon\\AppData\\Local\\Temp\\claude\\g--cw-sss-CwiczymyRazem\\b73a8bde-a3ca-4d03-93d3-37726590ecab\\scratchpad\\actioncard.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console.error]", msg.text());
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto(url, { waitUntil: "load" });
await page.waitForSelector("text=Turn Your Practice into Progress", { timeout: 30000 });

const el = page
  .locator("text=Turn Your Practice into Progress")
  .locator("xpath=ancestor::div[contains(@class, 'not-prose')][1]");
await el.screenshot({ path: outPath });
console.log("saved to", outPath);

await browser.close();
