const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright-core");
const sharp = require("sharp");
const axePath = require.resolve("axe-core/axe.min.js");

const baseUrl = process.env.KAWAII_VERIFY_URL || "http://127.0.0.1:4173";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outputDir = path.resolve(__dirname, "../docs/assets");
const publicScreenshotDir = path.resolve(__dirname, "../public/screenshots");
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(publicScreenshotDir, { recursive: true });

async function shot(page, name, fullPage = true) {
  const file = path.join(outputDir, name);
  await page.screenshot({ path: file, fullPage });
  return file;
}

async function clickContinue(page) {
  await page.getByRole("button", { name: "Continue" }).click();
}

async function auditAccessibility(page, label) {
  const result = await page.evaluate(async () => {
    const audit = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"],
      },
    });
    return audit.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
    }));
  });
  return { label, violations: result };
}

function verifyPrecacheAssets() {
  const publicDir = path.resolve(__dirname, "../public");
  const serviceWorker = fs.readFileSync(path.join(publicDir, "sw.js"), "utf8");
  const urls = [...serviceWorker.matchAll(/'\/(.*?)'/g)]
    .map((match) => match[1])
    .filter((url) => url && url !== "index.html");
  const missing = urls.filter((url) => !fs.existsSync(path.join(publicDir, url.split(/[?#]/)[0])));
  if (missing.length) throw new Error(`Missing service-worker assets: ${missing.join(", ")}`);
  return urls.length;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => localStorage.clear());
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.addScriptTag({ path: axePath });
  const initialText = (await page.locator("body").innerText()).trim();
  if (!initialText) throw new Error("Blank page");
  if (await page.locator("vite-error-overlay, .vite-error-overlay, [data-nextjs-dialog]").count()) {
    throw new Error("Framework error overlay detected");
  }

  const screens = [];
  const accessibilityChecks = [];
  screens.push(await shot(page, "verify-onboarding-phone.png", false));
  accessibilityChecks.push(await auditAccessibility(page, "onboarding"));

  await page.getByRole("button", { name: "Begin gently" }).click();
  await page.getByPlaceholder("What should Neko call you?").fill("Gaurav");
  await clickContinue(page);
  await page.locator(".preset-grid button").nth(0).click();
  await page.locator(".preset-grid button").nth(1).click();
  await page.locator(".preset-grid button").nth(2).click();
  await clickContinue(page);
  await clickContinue(page);
  await clickContinue(page);
  await page.locator(".first-ritual-list button").first().click();
  await page.getByRole("button", { name: "Enter your garden" }).click();
  await page.getByRole("heading", { name: /Good (morning|afternoon|evening), Gaurav/ }).waitFor();
  const phoneDay = await shot(page, "verify-today-phone-day.png", true);
  screens.push(phoneDay);
  accessibilityChecks.push(await auditAccessibility(page, "today-day"));
  const tinyCompletion = page.getByRole("button", { name: "Undo completion for Drink water" });
  await tinyCompletion.click();
  await page.getByRole("button", { name: "Complete Drink water" }).waitFor();
  await page.getByRole("button", { name: "Complete Drink water" }).click();
  await page.getByRole("button", { name: "Undo completion for Drink water" }).waitFor();
  const tinyUndoWorked = true;

  for (const label of ["Rhythm", "Garden", "Neko"]) {
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: label }).click();
    await page.waitForTimeout(120);
    screens.push(await shot(page, `verify-${label.toLowerCase()}-phone.png`, true));
    accessibilityChecks.push(await auditAccessibility(page, label.toLowerCase()));
  }
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: "Today" }).click();

  await page.getByRole("button", { name: "Open settings" }).click();
  const profileInput = page.getByPlaceholder("What should Neko call you?");
  await profileInput.focus();
  await profileInput.pressSequentially(" A", { delay: 10 });
  const focusStayed = await profileInput.evaluate((element) => document.activeElement === element);
  if (!focusStayed) throw new Error("Settings input lost focus while typing");
  await profileInput.fill("Gaurav");
  await page.getByRole("button", { name: /Moonlit Nook/ }).click();
  await page.waitForTimeout(220);
  accessibilityChecks.push(await auditAccessibility(page, "settings-night"));
  const darkSecondaryStyle = await page.locator(".settings-buttons .secondary-button").first().evaluate((element) => {
    const style = getComputedStyle(element);
    const rootStyle = getComputedStyle(document.documentElement);
    const panelStyle = getComputedStyle(document.querySelector(".settings-panel"));
    return {
      theme: document.documentElement.dataset.theme,
      rootSurface: rootStyle.getPropertyValue("--surface"),
      panelSurface: panelStyle.getPropertyValue("--surface"),
      elementSurface: style.getPropertyValue("--surface"),
      backgroundColor: style.backgroundColor,
      color: style.color,
      opacity: style.opacity,
    };
  });
  screens.push(await shot(page, "verify-settings-night.png", false));
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.waitForTimeout(150);
  screens.push(await shot(page, "verify-today-phone-night.png", true));

  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: /Sunlit Garden/ }).click();
  await page.getByRole("button", { name: "Close settings" }).click();

  await page.setViewportSize({ width: 834, height: 1112 });
  await page.waitForTimeout(150);
  const tabletDay = await shot(page, "verify-today-tablet.png", true);
  screens.push(tabletDay);

  await Promise.all([
    sharp(phoneDay).webp({ quality: 82, effort: 6 }).toFile(path.join(publicScreenshotDir, "today-phone.webp")),
    sharp(tabletDay).webp({ quality: 82, effort: 6 }).toFile(path.join(publicScreenshotDir, "today-tablet.webp")),
  ]);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(150);
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    root: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    app: document.querySelector(".app-frame")?.scrollWidth - document.querySelector(".app-frame")?.clientWidth,
  }));
  screens.push(await shot(page, "verify-today-compact.png", false));

  const activeNav = await page.locator(".bottom-nav button.is-active").innerText();
  const theme = await page.locator("html").getAttribute("data-theme");
  const result = {
    pageHasContent: initialText.length > 0,
    errorOverlay: false,
    consoleErrors: errors,
    activeNav,
    theme,
    overflow,
    darkSecondaryStyle,
    tinyUndoWorked,
    accessibilityChecks,
    precacheAssets: verifyPrecacheAssets(),
    screens,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  await browser.close();
  const accessibilityViolations = accessibilityChecks.flatMap((check) => check.violations);
  if (errors.length || accessibilityViolations.length) process.exitCode = 1;
})().catch(async (error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
