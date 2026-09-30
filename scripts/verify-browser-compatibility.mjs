import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const output =
  process.env.TEST_OUTPUT_DIR || join(tmpdir(), "yulaverse-browser-tests");
await mkdir(output, { recursive: true });

async function blockWebGL(page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === "webgl2" ? null : getContext.call(this, type, ...args);
    };
  });
}

async function load(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() =>
    ["ready", "fallback"].includes(
      document.querySelector("[data-scene-status]")?.dataset.sceneStatus,
    ),
  );
  assert.equal(await page.locator("h1").innerText(), "Beyond\nordinary.");
  assert.equal(await page.locator("[data-nextjs-dialog]").count(), 0);
  return errors;
}

const ringTransform = (page) =>
  page
    .locator('[class*="sceneFallback"] i')
    .first()
    .evaluate((el) => getComputedStyle(el).transform);

async function verifyEngine(name, engine) {
  const browser = await engine.launch({ headless: true });
  const results = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = await load(page);
    const status = await page
      .locator("[data-scene-status]")
      .getAttribute("data-scene-status");
    assert.equal(status, "ready", `${name}: WebGL scene should render`);
    await page.waitForTimeout(2000);
    const clip = { x: 850, y: 230, width: 470, height: 450 };
    const first = await page.screenshot({ clip });
    await page.waitForTimeout(700);
    const second = await page.screenshot({ clip });
    assert(!first.equals(second), `${name}: 3D sculpture should move`);
    await page.getByRole("button", { name: "Pause motion" }).click();
    await page.waitForTimeout(500);
    const paused = await page.screenshot({ clip });
    await page.waitForTimeout(500);
    assert(
      paused.equals(await page.screenshot({ clip })),
      `${name}: pause should stop 3D motion`,
    );
    await page.getByRole("button", { name: "Play motion" }).click();
    await page.locator("#work").scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    assert.equal(
      await page
        .locator("#work h2")
        .evaluate((el) => getComputedStyle(el).opacity),
      "1",
    );
    await page
      .getByRole("button", { name: "Explore App Carz project" })
      .click();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Let’s talk", exact: true }).click();
    assert.equal((await page.locator("dialog[open] input").count()) > 0, true);
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, [], `${name}: no uncaught browser errors`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `${output}/${name}-desktop.png` });
    results.push("3D motion, pause, scroll reveals and dialogs");

    // A GPU reset must replace the WebGL canvas with moving CSS artwork.
    const contextLost = await page
      .locator(".uv-orbital-canvas canvas")
      .evaluate((canvas) => {
        const extension = canvas
          .getContext("webgl2")
          .getExtension("WEBGL_lose_context");
        extension?.loseContext();
        return Boolean(extension);
      });
    if (contextLost) {
      await page.waitForFunction(() =>
        document.querySelector('[data-scene-status="fallback"]'),
      );
      const before = await ringTransform(page);
      await page.waitForTimeout(300);
      assert.notEqual(await ringTransform(page), before);
      results.push("GPU context-loss recovery");
    }
    await context.close();

    const fallbackContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
    });
    const fallbackPage = await fallbackContext.newPage();
    await blockWebGL(fallbackPage);
    const fallbackErrors = await load(fallbackPage);
    assert.equal(
      await fallbackPage
        .locator("[data-scene-status]")
        .getAttribute("data-scene-status"),
      "fallback",
    );
    const fallbackBefore = await ringTransform(fallbackPage);
    await fallbackPage.waitForTimeout(350);
    assert.notEqual(
      await ringTransform(fallbackPage),
      fallbackBefore,
      `${name}: GPU-free fallback must animate`,
    );
    await fallbackPage.getByRole("button", { name: "Pause motion" }).click();
    await fallbackPage.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('[class*="sceneFallback"] i'))
          .animationPlayState === "paused",
    );
    await fallbackPage.waitForTimeout(100);
    const pausedFallback = await ringTransform(fallbackPage);
    await fallbackPage.waitForTimeout(350);
    assert.equal(await ringTransform(fallbackPage), pausedFallback);
    await fallbackPage.getByRole("button", { name: "Play motion" }).click();
    await fallbackPage.screenshot({ path: `${output}/${name}-fallback.png` });
    assert.deepEqual(fallbackErrors, []);
    results.push("WebGL-disabled fallback and pause");

    await fallbackPage.emulateMedia({ reducedMotion: "reduce" });
    await fallbackPage
      .getByRole("button", { name: "Reduced motion" })
      .waitFor();
    assert.equal(
      await fallbackPage
        .getByRole("button", { name: "Reduced motion" })
        .isDisabled(),
      true,
    );
    assert.equal(
      await fallbackPage
        .locator('[class*="sceneFallback"] i')
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    results.push("live reduced-motion preference");
    await fallbackContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: name !== "firefox",
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    const mobileErrors = await load(mobile);
    assert.equal(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await mobile.getByRole("button", { name: "Open navigation" }).click();
    assert.equal(await mobile.locator("dialog[open]").count(), 1);
    await mobile.keyboard.press("Escape");
    await mobile.screenshot({ path: `${output}/${name}-mobile.png` });
    assert.deepEqual(mobileErrors, []);
    results.push("mobile layout and navigation");
    await mobileContext.close();

    const basicContext = await browser.newContext({ javaScriptEnabled: false });
    const basic = await basicContext.newPage();
    await basic.goto(baseURL);
    for (const selector of [
      "#studio h2",
      "#work h2",
      "#expertise h2",
      "#contact h2",
    ]) {
      assert.equal(
        await basic
          .locator(selector)
          .evaluate((el) => getComputedStyle(el).opacity),
        "1",
      );
    }
    results.push("visible content without JavaScript");
    await basicContext.close();
    console.log(`PASS ${name}: ${results.join("; ")}`);
  } finally {
    await browser.close();
  }
}

const engines = { chromium, firefox, webkit };
if (process.env.TEST_EDGE_EXECUTABLE_PATH) {
  engines.edge = {
    launch: (options) =>
      chromium.launch({
        ...options,
        executablePath: process.env.TEST_EDGE_EXECUTABLE_PATH,
      }),
  };
}
for (const [name, engine] of Object.entries(engines)) {
  await verifyEngine(name, engine);
}
