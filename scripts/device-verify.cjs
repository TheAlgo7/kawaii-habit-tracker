const fs = require("node:fs");
const path = require("node:path");
const { chromium, devices, webkit } = require("playwright-core");
const sharp = require("sharp");

const axePath = require.resolve("axe-core/axe.min.js");
const baseUrl = process.env.KAWAII_VERIFY_URL || "http://127.0.0.1:4173";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outputDir = path.resolve(__dirname, "../docs/assets");
const { version: appVersion } = require("../package.json");
const iconReleaseTag = `v${appVersion}`;

fs.mkdirSync(outputDir, { recursive: true });

const { defaultBrowserType: _iphoneBrowser, ...iphone15Pro } = devices["iPhone 15 Pro"];
const { defaultBrowserType: _galaxyBrowser, ...galaxyS24 } = devices["Galaxy S24"];

const profiles = [
  {
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    engine: "Playwright WebKit 26.5 emulation",
    browserType: webkit,
    launchOptions: { headless: true },
    contextOptions: {
      ...iphone15Pro,
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "allow",
    },
    standaloneViewport: { width: 393, height: 852 },
  },
  {
    name: "Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    engine: "Google Chrome 151 mobile emulation",
    browserType: chromium,
    launchOptions: {
      headless: true,
      ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {}),
    },
    contextOptions: {
      ...galaxyS24,
      viewport: { width: 384, height: 740 },
      screen: { width: 384, height: 832 },
      deviceScaleFactor: 3.75,
      userAgent: galaxyS24.userAgent.replace("SM-S921U", "SM-S928B"),
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "allow",
    },
    standaloneViewport: { width: 384, height: 832 },
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function screenshot(page, name) {
  const target = path.join(outputDir, name);
  await page.screenshot({ path: target, fullPage: false });
  return target;
}

async function waitForAppReady(page) {
  const root = page.locator(".onboarding, .app-frame").first();
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 2000 });
      if (await root.isVisible()) {
        await page.waitForTimeout(250);
        if (await root.isVisible()) return;
      }
    } catch {
      // A first-install controllerchange can replace the execution context once.
    }
    await page.waitForTimeout(150);
  }

  throw new Error("App root did not remain visible after the service-worker handoff");
}

async function accessibilityAudit(page, label) {
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"],
      },
    });

    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
    }));
  });

  return { label, violations };
}

async function layoutAudit(page, label) {
  const result = await page.evaluate(() => {
    const app = document.querySelector(".app-frame");
    const nav = document.querySelector(".bottom-nav");
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const interactiveSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([type='hidden']):not([type='checkbox']):not([type='radio'])",
      "select",
      "textarea",
      "[role='button']",
      "[role='tab']",
    ].join(",");

    const visibleInteractive = [...document.querySelectorAll(interactiveSelector)].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.pointerEvents !== "none" &&
        rect.width > 0 &&
        rect.height > 0 &&
        !element.closest("[aria-hidden='true']")
      );
    });

    const undersizedTargets = visibleInteractive
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 43.5 || rect.height < 43.5;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute("aria-label") ||
            element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ||
            element.tagName,
          width: Number(rect.width.toFixed(1)),
          height: Number(rect.height.toFixed(1)),
        };
      });

    const isInsideHorizontalScroller = (element) => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.body) {
        const style = getComputedStyle(ancestor);
        if (
          ["auto", "scroll"].includes(style.overflowX) &&
          ancestor.scrollWidth > ancestor.clientWidth + 1
        ) {
          return true;
        }
        ancestor = ancestor.parentElement;
      }
      return false;
    };

    const horizontallyClippedTargets = visibleInteractive
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return !isInsideHorizontalScroller(element) && (rect.left < -1 || rect.right > viewportWidth + 1);
      })
      .map((element) =>
        element.getAttribute("aria-label") || element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80)
      );

    const navRect = nav?.getBoundingClientRect();
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        visualWidth: viewportWidth,
        visualHeight: viewportHeight,
        devicePixelRatio: window.devicePixelRatio,
        maxTouchPoints: navigator.maxTouchPoints,
        coarsePointer: matchMedia("(pointer: coarse)").matches,
      },
      overflow: {
        body: document.body.scrollWidth - document.body.clientWidth,
        root: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        app: app ? app.scrollWidth - app.clientWidth : null,
      },
      nav: navRect
        ? {
            top: Number(navRect.top.toFixed(1)),
            right: Number(navRect.right.toFixed(1)),
            bottom: Number(navRect.bottom.toFixed(1)),
            left: Number(navRect.left.toFixed(1)),
            visibleWithinViewport:
              navRect.left >= -1 &&
              navRect.right <= viewportWidth + 1 &&
              navRect.top >= -1 &&
              navRect.bottom <= viewportHeight + 1,
          }
        : null,
      undersizedTargets,
      horizontallyClippedTargets,
    };
  });

  assert(
    Object.values(result.overflow).every((value) => value === null || value <= 1),
    `${label}: horizontal overflow detected: ${JSON.stringify(result.overflow)}`
  );
  assert(result.horizontallyClippedTargets.length === 0, `${label}: interactive controls are clipped`);
  assert(
    result.undersizedTargets.length === 0,
    `${label}: touch targets below 44px: ${JSON.stringify(result.undersizedTargets)}`
  );
  assert(result.nav?.visibleWithinViewport, `${label}: primary navigation is outside the visible viewport`);
  return { label, ...result };
}

async function formFontAudit(page, label) {
  const controls = await page.locator("input, select, textarea").evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({
        label:
          element.getAttribute("aria-label") ||
          element.labels?.[0]?.textContent?.trim().replace(/\s+/g, " ") ||
          element.getAttribute("placeholder") ||
          element.tagName,
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      }))
  );
  const undersized = controls.filter((control) => control.fontSize < 16);
  assert(undersized.length === 0, `${label}: form controls below 16px: ${JSON.stringify(undersized)}`);
  return { label, controls };
}

async function verifyPwa(page, context, profileName) {
  const metadata = await page.evaluate(() => ({
    viewport: document.querySelector('meta[name="viewport"]')?.content || "",
    manifest: document.querySelector('link[rel="manifest"]')?.href || "",
    appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.href || "",
    appleTouchSizes: document.querySelector('link[rel="apple-touch-icon"]')?.sizes?.value || "",
    favicon: document.querySelector('link[rel="icon"][sizes="48x48"]')?.href || "",
    themeColor: document.querySelector('meta[name="theme-color"]')?.content || "",
  }));

  assert(metadata.viewport.includes("viewport-fit=cover"), `${profileName}: viewport-fit=cover is missing`);
  assert(metadata.manifest, `${profileName}: manifest link is missing`);
  assert(metadata.appleTouchIcon, `${profileName}: Apple touch icon is missing`);
  assert(metadata.appleTouchSizes === "180x180", `${profileName}: Apple touch icon size is incorrect`);
  assert(
    metadata.manifest.includes(`v=${appVersion}`),
    `${profileName}: manifest URL is not versioned for installed-app updates`
  );
  assert(
    metadata.appleTouchIcon.includes(`-${iconReleaseTag}.png`),
    `${profileName}: Apple touch icon URL is not versioned`
  );
  assert(metadata.favicon.includes(`-${iconReleaseTag}.png`), `${profileName}: favicon URL is not versioned`);

  const manifestResponse = await context.request.get(metadata.manifest);
  assert(manifestResponse.ok(), `${profileName}: manifest request failed`);
  const manifest = await manifestResponse.json();
  assert(manifest.display === "standalone", `${profileName}: manifest display must be standalone`);
  assert(manifest.orientation === "any", `${profileName}: manifest orientation must support device rotation`);
  assert(
    manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any"),
    `${profileName}: 192px install icon is missing`
  );
  assert(
    manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any"),
    `${profileName}: 512px install icon is missing`
  );
  assert(
    manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"),
    `${profileName}: Android maskable icon is missing`
  );
  assert(
    manifest.icons.every((icon) => icon.src.includes(`-${iconReleaseTag}.png`)),
    `${profileName}: manifest icon URLs must change when launcher artwork changes`
  );

  const iconChecks = [];
  for (const icon of manifest.icons) {
    const response = await context.request.get(new URL(icon.src, baseUrl).href);
    const localPath = path.resolve(__dirname, "../public", new URL(icon.src, baseUrl).pathname.replace(/^\//, ""));
    const [expectedWidth, expectedHeight] = icon.sizes.split("x").map(Number);
    const image = await sharp(localPath).metadata();
    const stats = await sharp(localPath).stats();
    const alpha = stats.channels[3];
    const opaque = !alpha || alpha.min === 255;
    iconChecks.push({
      src: icon.src,
      status: response.status(),
      contentType: response.headers()["content-type"],
      declared: icon.sizes,
      actual: `${image.width}x${image.height}`,
      opaque,
    });
    assert(response.ok(), `${profileName}: ${icon.src} failed to load`);
    assert(
      response.headers()["content-type"]?.includes("image/png"),
      `${profileName}: ${icon.src} is not served as PNG`
    );
    assert(
      image.width === expectedWidth && image.height === expectedHeight,
      `${profileName}: ${icon.src} dimensions do not match its manifest declaration`
    );
    assert(opaque, `${profileName}: ${icon.src} contains transparent launcher pixels`);
  }

  const linkedIconChecks = [];
  for (const linkedIcon of [
    { label: "Apple touch icon", url: metadata.appleTouchIcon, size: 180 },
    { label: "favicon", url: metadata.favicon, size: 48 },
  ]) {
    const response = await context.request.get(linkedIcon.url);
    const pathname = new URL(linkedIcon.url).pathname.replace(/^\//, "");
    const image = await sharp(path.resolve(__dirname, "../public", pathname)).metadata();
    linkedIconChecks.push({ label: linkedIcon.label, status: response.status(), actual: `${image.width}x${image.height}` });
    assert(response.ok(), `${profileName}: ${linkedIcon.label} failed to load`);
    assert(
      response.headers()["content-type"]?.includes("image/png"),
      `${profileName}: ${linkedIcon.label} is not served as PNG`
    );
    assert(
      image.width === linkedIcon.size && image.height === linkedIcon.size,
      `${profileName}: ${linkedIcon.label} has incorrect dimensions`
    );
  }

  const serviceWorkerSource = fs.readFileSync(path.resolve(__dirname, "../public/sw.js"), "utf8");
  assert(
    serviceWorkerSource.includes(`/manifest.json?v=${appVersion}`),
    `${profileName}: service-worker manifest precache URL is stale`
  );
  for (const icon of manifest.icons) {
    assert(serviceWorkerSource.includes(icon.src), `${profileName}: ${icon.src} is missing from the offline cache`);
  }

  const screenshotChecks = [];
  for (const screenshot of manifest.screenshots || []) {
    const localPath = path.resolve(__dirname, "../public", screenshot.src.replace(/^\//, ""));
    const [expectedWidth, expectedHeight] = screenshot.sizes.split("x").map(Number);
    const image = await sharp(localPath).metadata();
    screenshotChecks.push({
      src: screenshot.src,
      declared: screenshot.sizes,
      actual: `${image.width}x${image.height}`,
    });
    assert(
      image.width === expectedWidth && image.height === expectedHeight,
      `${profileName}: ${screenshot.src} manifest dimensions do not match the file`
    );
  }

  const serviceWorker = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return { supported: false, active: false, scope: null };
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    return {
      supported: true,
      active: Boolean(registration?.active),
      scope: registration?.scope || null,
    };
  });

  assert(serviceWorker.supported, `${profileName}: service workers are unsupported`);
  assert(serviceWorker.active, `${profileName}: service worker did not activate`);
  return {
    metadata,
    manifest: { display: manifest.display, orientation: manifest.orientation },
    iconChecks,
    linkedIconChecks,
    screenshotChecks,
    serviceWorker,
  };
}

async function verifyChromiumInstallability(page, context) {
  const session = await context.newCDPSession(page);
  await session.send("Page.enable");
  const manifest = await session.send("Page.getAppManifest");
  const installability = await session.send("Page.getInstallabilityErrors");
  const manifestErrors = manifest.errors || [];
  const installabilityErrors = (installability.installabilityErrors || []).filter(
    (error) => error.errorId !== "in-incognito"
  );
  assert(manifestErrors.length === 0, `Chrome manifest parser errors: ${JSON.stringify(manifestErrors)}`);
  assert(
    installabilityErrors.length === 0,
    `Chrome installability errors: ${JSON.stringify(installabilityErrors)}`
  );
  return {
    manifestUrl: manifest.url,
    manifestErrors,
    installabilityErrors,
  };
}

async function verifyStandaloneAndOffline(profile, browser, savedState) {
  const context = await browser.newContext({
    ...profile.contextOptions,
    viewport: profile.standaloneViewport,
    screen: profile.standaloneViewport,
    bypassCSP: true,
  });
  await context.addInitScript((value) => localStorage.setItem("kw_state_v2", value), savedState);
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.locator(".app-frame").waitFor();
    await page.waitForFunction(() =>
      [...document.images].every((image) => image.complete && image.naturalWidth > 0)
    );
    const layout = await layoutAudit(page, "standalone-layout");
    assert(
      Math.abs(layout.viewport.visualHeight - profile.standaloneViewport.height) <= 1,
      `${profile.name}: standalone visual viewport height is inconsistent`
    );
    const image = await screenshot(page, `verify-${profile.slug}-standalone.png`);

    const serviceWorker = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return { active: Boolean(registration.active), controlled: Boolean(navigator.serviceWorker.controller) };
    });
    if (!serviceWorker.controlled) {
      await page.reload({ waitUntil: "networkidle" });
      await page.locator(".app-frame").waitFor();
      serviceWorker.controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
    }
    assert(serviceWorker.active && serviceWorker.controlled, `${profile.name}: standalone page is not service-worker controlled`);
    assert(runtimeErrors.length === 0, `${profile.name}: standalone online runtime errors detected`);

    await context.setOffline(true);
    let reloadQuirk = null;
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
    } catch (error) {
      if (profile.browserType !== webkit || !String(error.message).includes("WebKit encountered an internal error")) {
        throw error;
      }
      reloadQuirk = error.message;
    }
    await page.waitForTimeout(200);
    const offline = await page.evaluate(() => ({
      hasContent: document.body.innerText.trim().length > 0,
      appVisible: Boolean(document.querySelector(".app-frame")),
      title: document.title,
      controlled: Boolean(navigator.serviceWorker.controller),
    }));
    assert(offline.hasContent && offline.appVisible, `${profile.name}: offline app shell did not render`);
    const expectedQuirkErrors = runtimeErrors.filter(
      (message) => profile.browserType === webkit && message.includes("WebKit encountered an internal error")
    );
    const unexpectedRuntimeErrors = runtimeErrors.filter((message) => !expectedQuirkErrors.includes(message));
    assert(
      unexpectedRuntimeErrors.length === 0,
      `${profile.name}: standalone/offline runtime errors detected: ${JSON.stringify(unexpectedRuntimeErrors)}`
    );
    await context.setOffline(false);

    return { layout, screenshot: image, serviceWorker, offline, reloadQuirk, expectedQuirkErrors };
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
}

async function completeOnboarding(page, profileName) {
  await page.getByRole("button", { name: "Begin gently" }).tap();
  const fontAudit = await formFontAudit(page, "onboarding-name");
  await page.getByPlaceholder("What should Neko call you?").fill(profileName.includes("iPhone") ? "Ivy" : "Sam");
  await page.getByRole("button", { name: "Continue" }).tap();
  await page.locator(".preset-grid button").nth(0).tap();
  await page.locator(".preset-grid button").nth(1).tap();
  await page.locator(".preset-grid button").nth(2).tap();
  await page.getByRole("button", { name: "Continue" }).tap();
  await page.getByRole("button", { name: "Continue" }).tap();
  await page.getByRole("button", { name: "Continue" }).tap();
  await page.locator(".first-ritual-list button").first().tap();
  await page.getByRole("button", { name: "Enter your garden" }).tap();
  await page.getByRole("heading", { name: /Good (morning|afternoon|evening), (Ivy|Sam)/ }).waitFor();
  return fontAudit;
}

async function verifyProfile(profile) {
  const browser = await profile.browserType.launch(profile.launchOptions);
  const context = await browser.newContext({ ...profile.contextOptions, bypassCSP: true });
  await context.addInitScript(() => localStorage.clear());
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await waitForAppReady(page);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() =>
      [...document.images].every((image) => image.complete && image.naturalWidth > 0)
    );
    await page.addScriptTag({ path: axePath });

    const bodyText = (await page.locator("body").innerText()).trim();
    assert(bodyText.length > 0, `${profile.name}: blank page`);
    assert(
      (await page.locator("vite-error-overlay, .vite-error-overlay, [data-nextjs-dialog]").count()) === 0,
      `${profile.name}: framework error overlay detected`
    );

    const beginCta = await page.getByRole("button", { name: "Begin gently" }).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        visualHeight: window.visualViewport?.height || window.innerHeight,
      };
    });
    assert(
      beginCta.top >= -1 && beginCta.bottom <= beginCta.visualHeight + 1,
      `${profile.name}: initial onboarding action is outside the visible viewport`
    );

    const accessibility = [await accessibilityAudit(page, "onboarding")];
    const screenshots = [await screenshot(page, `verify-${profile.slug}-onboarding.png`)];
    const pwa = await verifyPwa(page, context, profile.name);
    const chromiumInstallability =
      profile.browserType === chromium ? await verifyChromiumInstallability(page, context) : null;
    const formControls = [await completeOnboarding(page, profile.name)];

    const layouts = [await layoutAudit(page, "today-browser")];
    if (profile.browserType === chromium) {
      assert(layouts[0].viewport.maxTouchPoints > 0, `${profile.name}: touch input is not enabled`);
      assert(layouts[0].viewport.coarsePointer, `${profile.name}: coarse pointer media query is not active`);
    }
    accessibility.push(await accessibilityAudit(page, "today"));
    screenshots.push(await screenshot(page, `verify-${profile.slug}-today.png`));

    const tinyUndo = page.getByRole("button", { name: "Undo completion for Drink water" });
    await tinyUndo.tap();
    await page.getByRole("button", { name: "Complete Drink water" }).waitFor();
    await page.getByRole("button", { name: "Complete Drink water" }).tap();
    await tinyUndo.waitFor();

    const appScroll = page.locator(".app-scroll");
    await appScroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const scrollBeforeSwitch = await appScroll.evaluate((element) => element.scrollTop);
    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("button", { name: "Rhythm", exact: true })
      .tap();
    await page.waitForFunction(() => (document.querySelector(".app-scroll")?.scrollTop || 0) <= 1);
    const scrollAfterSwitch = await appScroll.evaluate((element) => element.scrollTop);
    const rhythmHeadingTop = await page
      .getByRole("heading", { name: "Your rhythm", exact: true })
      .evaluate((element) => element.getBoundingClientRect().top);
    assert(scrollBeforeSwitch > 0, `${profile.name}: Today did not produce an internal scroll range`);
    assert(scrollAfterSwitch <= 1, `${profile.name}: tab navigation did not reset internal scroll`);
    assert(rhythmHeadingTop >= -1, `${profile.name}: Rhythm heading opened above the viewport`);
    layouts.push(await layoutAudit(page, "rhythm"));
    accessibility.push(await accessibilityAudit(page, "rhythm"));

    for (const label of ["Garden", "Neko"]) {
      await page
        .getByRole("navigation", { name: "Primary navigation" })
        .getByRole("button", { name: label, exact: true })
        .tap();
      await page.waitForTimeout(120);
      layouts.push(await layoutAudit(page, label.toLowerCase()));
      accessibility.push(await accessibilityAudit(page, label.toLowerCase()));
    }

    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("button", { name: "Today", exact: true })
      .tap();
    await page.getByRole("button", { name: "Open settings" }).tap();
    formControls.push(await formFontAudit(page, "settings"));
    const profileInput = page.getByPlaceholder("What should Neko call you?");
    await profileInput.focus();
    await profileInput.pressSequentially(" test", { delay: 8 });
    assert(
      await profileInput.evaluate((element) => document.activeElement === element),
      `${profile.name}: settings input lost focus while typing`
    );
    const moonlitButton = page.getByRole("button", { name: /Moonlit Nook/ });
    await moonlitButton.evaluate((button) => {
      button.addEventListener(
        "click",
        () => {
          window.__settingsScrollBeforeTheme = button.closest(".settings-scroll")?.scrollTop || 0;
        },
        { capture: true, once: true }
      );
    });
    await moonlitButton.focus();
    await moonlitButton.press("Enter");
    await page.waitForFunction(() => document.documentElement.dataset.theme === "garden-night");
    await page.waitForTimeout(250);
    assert((await moonlitButton.getAttribute("aria-pressed")) === "true", `${profile.name}: night theme was not selected`);
    const themeSwitchContinuity = await moonlitButton.evaluate((button) => {
      const after = button.closest(".settings-scroll")?.scrollTop || 0;
      return {
        before: window.__settingsScrollBeforeTheme || 0,
        after,
        focusPreserved: document.activeElement === button,
      };
    });
    assert(themeSwitchContinuity.focusPreserved, `${profile.name}: theme switching did not preserve button focus`);
    assert(
      Math.abs(themeSwitchContinuity.after - themeSwitchContinuity.before) <= 1,
      `${profile.name}: theme switching reset Settings scroll position`
    );
    const settingsNightStyle = await page.locator(".settings-panel").evaluate((panel) => {
      const panelStyle = getComputedStyle(panel);
      const inputStyle = getComputedStyle(panel.querySelector("input:not([type='file'])"));
      return {
        theme: document.documentElement.dataset.theme,
        appTheme: document.querySelector(".app-root")?.dataset.theme,
        panelClass: panel.className,
        styleSheets: [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean),
        canvasToken: panelStyle.getPropertyValue("--canvas").trim(),
        inkToken: panelStyle.getPropertyValue("--ink").trim(),
        panelBackground: panelStyle.backgroundColor,
        inputBackground: inputStyle.backgroundColor,
        inputColor: inputStyle.color,
        fieldLabelColor: getComputedStyle(panel.querySelector(".field > span")).color,
        themeStrongColor: getComputedStyle(panel.querySelector(".settings-theme strong")).color,
      };
    });
    layouts.push(await layoutAudit(page, "settings-night"));
    accessibility.push(await accessibilityAudit(page, "settings-night"));
    screenshots.push(await screenshot(page, `verify-${profile.slug}-night.png`));
    await page.getByRole("button", { name: "Close settings" }).tap();
    await page.waitForTimeout(80);
    const savedState = await page.evaluate(() => localStorage.getItem("kw_state_v2"));
    assert(savedState, `${profile.name}: persisted state is missing before standalone verification`);
    const standalone = await verifyStandaloneAndOffline(profile, browser, savedState);
    layouts.push(standalone.layout);
    screenshots.push(standalone.screenshot);

    const violations = accessibility.flatMap((entry) => entry.violations);
    assert(consoleErrors.length === 0, `${profile.name}: console errors detected`);
    assert(pageErrors.length === 0, `${profile.name}: page errors detected`);
    assert(
      failedRequests.length === 0,
      `${profile.name}: failed network requests detected: ${JSON.stringify(failedRequests)}`
    );
    assert(
      violations.length === 0,
      `${profile.name}: accessibility violations detected: ${JSON.stringify({ violations, settingsNightStyle })}`
    );

    return {
      device: profile.name,
      engine: profile.engine,
      browserViewport: profile.contextOptions.viewport,
      screen: profile.contextOptions.screen,
      deviceScaleFactor: profile.contextOptions.deviceScaleFactor,
      touch: profile.contextOptions.hasTouch,
      consoleErrors,
      pageErrors,
      failedRequests,
      pwa,
      chromiumInstallability,
      standalone,
      formControls,
      themeSwitchContinuity,
      settingsNightStyle,
      scrollReset: { before: scrollBeforeSwitch, after: scrollAfterSwitch, rhythmHeadingTop },
      accessibility,
      layouts,
      screenshots,
      result: "passed",
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

(async () => {
  const report = [];
  for (const profile of profiles) report.push(await verifyProfile(profile));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
