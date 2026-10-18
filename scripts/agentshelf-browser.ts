import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://localhost:3001";
async function main() {
  await mkdir("test-results/agentshelf", { recursive: true });
  const engines =
    process.env.AGENTSHELF_ALL_BROWSERS === "true"
      ? [
          { name: "chromium", engine: chromium },
          { name: "firefox", engine: firefox },
          { name: "webkit", engine: webkit },
        ]
      : [{ name: "chromium", engine: chromium }];
  for (const { name, engine } of engines) {
    const browser = await engine.launch({
      headless: true,
      ...(name === "chromium"
        ? {
            args: [
              "--disable-background-timer-throttling",
              "--disable-renderer-backgrounding",
            ],
          }
        : {}),
      ...(name === "chromium"
        ? {
            executablePath:
              process.env.TEST_CHROME_PATH ||
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          }
        : {}),
    });
    try {
      for (const [device, viewport] of process.env.AGENTSHELF_AUTH_ONLY ===
      "true"
        ? []
        : ([
            ["desktop", { width: 1440, height: 1000 }],
            ["mobile", { width: 390, height: 844 }],
          ] as const)) {
        const context = await browser.newContext({
            viewport,
            reducedMotion: "reduce",
          }),
          page = await context.newPage(),
          errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        context.setDefaultTimeout(60000);
        context.setDefaultNavigationTimeout(60000);
        if (name === "chromium") {
          await page.goto(base, { waitUntil: "domcontentloaded" });
          await page
            .getByRole("heading", { name: /Beyond\s+ordinary/ })
            .waitFor();
          if (device === "mobile")
            await page.getByRole("button", { name: "Open navigation" }).click();
          await page
            .locator('a[href="/ai-visibility"]:visible')
            .first()
            .click();
          await page.waitForURL("**/ai-visibility");
        }
        let r = await page.goto(`${base}/ai-visibility`, {
          waitUntil: "domcontentloaded",
        });
        assert.equal(r?.status(), 200);
        await page
          .getByRole("heading", { name: /Don’t just get found/ })
          .waitFor();
        assert((await page.getByText("£299", { exact: false }).count()) > 0);
        await page.screenshot({
          path: `test-results/agentshelf/${name}-${device}-landing.png`,
          fullPage: true,
        });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        r = await page.goto(`${base}/agentshelf/demo`, {
          waitUntil: "domcontentloaded",
        });
        assert.equal(r?.status(), 200);
        await page
          .getByRole("heading", {
            name: "Northstar Travel Goods (fictional)",
            exact: true,
          })
          .waitFor();
        assert(
          (await page
            .getByText("SIMULATED DEMONSTRATION", { exact: true })
            .count()) > 0,
        );
        await page.locator(".recharts-surface").first().waitFor();
        await page.screenshot({
          path: `test-results/agentshelf/${name}-${device}-dashboard.png`,
          fullPage: true,
        });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page
          .getByRole("button", { name: "Recommendations", exact: true })
          .click();
        await page
          .getByRole("heading", {
            name: "Add product dimensions and materials",
          })
          .waitFor();
        await page
          .getByRole("button", { name: "Competitors", exact: true })
          .click();
        await page
          .getByRole("cell", { name: "Wayfarer (fictional)", exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Results", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Provider and query breakdown" })
          .waitFor();
        await page
          .getByRole("button", { name: "Reports", exact: true })
          .click();
        const download = page.waitForEvent("download");
        await page
          .getByRole("link", { name: /Download simulated report/ })
          .click();
        const file = await download;
        assert(file.suggestedFilename().includes("SIMULATED"));
        await page.goto(`${base}/agentshelf/dashboard`, {
          waitUntil: "domcontentloaded",
        });
        assert(
          page.url().includes("/login") ||
            (await page
              .getByRole("heading", { name: "Service connection pending" })
              .count()) > 0,
        );
        assert.deepEqual(
          errors,
          [],
          `${name}/${device}: no uncaught browser errors`,
        );
        console.log(
          `${name}/${device}: landing, pricing, demo charts, recommendations, PDF, layout and anonymous protection passed`,
        );
        await context.close();
      }
      if (name === "chromium" && process.env.AGENTSHELF_AUTH_E2E === "true") {
        const fixtures = JSON.parse(
          await readFile(".agentshelf/browser-fixture.json", "utf8"),
        ) as { role: string; email: string; password: string }[];
        const customer = fixtures.find((f) => f.role === "customer")!,
          administrator = fixtures.find((f) => f.role === "admin")!;
        const customerContext = await browser.newContext({
          viewport: { width: 1440, height: 1000 },
          reducedMotion: "reduce",
        });
        customerContext.setDefaultTimeout(30000);
        customerContext.setDefaultNavigationTimeout(60000);
        const page = await customerContext.newPage();
        await page.goto(`${base}/ai-visibility`);
        await page
          .getByLabel("Business name", { exact: true })
          .fill("Browser integration enquiry");
        await page
          .getByLabel("Website URL", { exact: true })
          .fill("https://yulaverse.co.uk");
        await page
          .getByLabel("Contact name", { exact: true })
          .fill("Local test customer");
        await page
          .getByLabel("Email address", { exact: true })
          .fill(customer.email);
        await page
          .getByLabel("Industry", { exact: true })
          .fill("Professional services");
        await page.getByLabel(/I have read the privacy notice/).check();
        await page
          .getByRole("button", { name: /Request my assessment/ })
          .click();
        await page
          .getByRole("status")
          .filter({ hasText: /Your enquiry is saved/ })
          .waitFor();
        await page.goto(`${base}/agentshelf/login`);
        await page
          .getByLabel("Email address", { exact: true })
          .fill(customer.email);
        await page.getByLabel(/Password \(at least/).fill(customer.password);
        await page
          .getByRole("button", { name: "Sign in ↗", exact: true })
          .click();
        await page.waitForURL("**/agentshelf/dashboard");
        await page
          .getByRole("button", { name: "Begin onboarding", exact: true })
          .click();
        await page
          .getByLabel("Business / brand name", { exact: true })
          .fill("Yulaverse local audit fixture");
        await page
          .getByLabel("Public website URL", { exact: true })
          .fill("https://yulaverse.co.uk");
        await page
          .getByLabel("Business category", { exact: true })
          .selectOption("professional-services");
        await page
          .getByLabel(/What do you sell or provide/)
          .fill("brand identity and website design");
        await page
          .getByRole("button", { name: "Continue ↗", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Continue ↗", exact: true })
          .click();
        await page.getByLabel(/I confirm I am authorised/).check();
        await page.getByRole("button", { name: /Add my website/ }).click();
        await page
          .getByRole("heading", {
            name: "Yulaverse local audit fixture",
            exact: true,
          })
          .waitFor();
        page.once("dialog", (d) => d.accept());
        await page
          .getByRole("button", { name: /Request assessment/ })
          .first()
          .click();
        await page
          .getByRole("button", { name: "Audit history", exact: true })
          .click();
        await page.getByText("queued", { exact: true }).waitFor();
        const adminContext = await browser.newContext({
          viewport: { width: 1440, height: 1000 },
          reducedMotion: "reduce",
        });
        adminContext.setDefaultTimeout(180000);
        const ap = await adminContext.newPage();
        await ap.goto(`${base}/agentshelf/login`);
        await ap
          .getByLabel("Email address", { exact: true })
          .fill(administrator.email);
        await ap.getByLabel(/Password \(at least/).fill(administrator.password);
        await ap
          .getByRole("button", { name: "Sign in ↗", exact: true })
          .click();
        await ap.waitForURL("**/agentshelf/dashboard");
        await ap.goto(`${base}/admin/agentshelf`);
        await ap
          .getByRole("button", { name: "Assessment queue", exact: true })
          .click();
        await ap
          .getByRole("heading", {
            name: "Yulaverse local audit fixture",
            exact: true,
          })
          .waitFor();
        await ap.getByRole("button", { name: /Process next job/ }).click();
        await ap
          .getByRole("button", { name: /Approve & deliver report/ })
          .waitFor({ timeout: 180000 });
        await ap.screenshot({
          path: "test-results/agentshelf/admin-review.png",
          fullPage: true,
        });
        ap.once("dialog", (d) => d.accept());
        await ap
          .getByRole("button", { name: /Approve & deliver report/ })
          .click();
        await page
          .getByRole("button", { name: "Reports", exact: true })
          .click();
        await page.getByRole("button", { name: /Refresh/ }).click();
        await page
          .getByRole("link", { name: "Download report ↓", exact: true })
          .waitFor();
        const realPdf = page.waitForEvent("download");
        await page
          .getByRole("link", { name: "Download report ↓", exact: true })
          .click();
        assert(
          (await realPdf).suggestedFilename().startsWith("AgentShelf-report-"),
        );
        await page
          .getByRole("button", { name: "Billing", exact: true })
          .click();
        await page
          .getByRole("button", { name: /test checkout/ })
          .first()
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: /Service setup is pending/ })
          .waitFor();
        console.log(
          "Authenticated browser flow: enquiry, verified login, onboarding, genuine public crawl, admin approval, secure report download and honest billing setup state passed",
        );
        await customerContext.close();
        await adminContext.close();
      }
    } finally {
      await browser.close();
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
