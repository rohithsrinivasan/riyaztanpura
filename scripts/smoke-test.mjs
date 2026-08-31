import { chromium } from "playwright-core";
import fs from "node:fs";

const outDir = "C:/Users/a5149169/OneDrive - Renesas Electronics Corporation/Desktop/workspace_25/simpletanpura/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

const consoleMsgs = [];
page.on("console", (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.waitForSelector("text=Tanpura");
await page.screenshot({ path: `${outDir}/1-home.png` });

// Play tanpura
await page.getByRole("button", { name: /play tanpura/i }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/2-tanpura-playing.png` });

// Switch pitch while playing
await page.getByRole("radio", { name: "D", exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/3-pitch-switched.png` });

// Play metronome
await page.getByRole("button", { name: /play metronome/i }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/4-metronome-playing.png` });
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/5-metronome-beat2.png` });

console.log("CONSOLE_MESSAGES_START");
console.log(JSON.stringify(consoleMsgs, null, 2));
console.log("CONSOLE_MESSAGES_END");

await browser.close();
