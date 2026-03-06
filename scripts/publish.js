#!/usr/bin/env node
/**
 * WeChat Channels Video Publisher
 *
 * Handles video upload + form filling via Playwright CDP.
 * Requires Chrome running with --remote-debugging-port.
 *
 * Usage:
 *   node publish.js --video /path/to/video.mp4 \
 *     --description "Your description #hashtags" \
 *     --title "Short title (≤16 chars)" \
 *     [--port 9222] \
 *     [--screenshot-dir /path/to/screenshots]
 */

const { chromium } = require("playwright");
const path = require("path");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { port: 9222, screenshotDir: "." };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--video":
        opts.video = path.resolve(args[++i]);
        break;
      case "--description":
        opts.description = args[++i];
        break;
      case "--title":
        opts.title = args[++i];
        break;
      case "--port":
        opts.port = parseInt(args[++i]);
        break;
      case "--screenshot-dir":
        opts.screenshotDir = args[++i];
        break;
    }
  }
  if (!opts.video || !opts.description || !opts.title) {
    console.error(
      "Usage: node publish.js --video <path> --description <text> --title <text> [--port 9222]"
    );
    process.exit(1);
  }
  if (opts.title.length > 16) {
    console.error(
      `Error: title must be ≤16 characters, got ${opts.title.length}: "${opts.title}"`
    );
    process.exit(1);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const screenshotPath = (name) => path.join(opts.screenshotDir, name);

  console.log("Connecting to Chrome on port", opts.port);
  const browser = await chromium.connectOverCDP(
    `http://localhost:${opts.port}`
  );
  const page = browser.contexts()[0].pages()[0];

  // Verify we're on the create page
  const url = page.url();
  if (!url.includes("post/create")) {
    console.error("Not on publish page. Current URL:", url);
    console.error(
      'Navigate to "发表视频" first using agent-browser, then run this script.'
    );
    process.exit(1);
  }

  // Step 1: Upload video via filechooser
  console.log("Uploading video:", opts.video);
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 15000 }),
    page.evaluate(() => {
      const shadowEl = document.querySelector("wujie-app");
      const sr = shadowEl.shadowRoot;
      const fileInput = sr.querySelector('input[type="file"]');
      fileInput.click();
    }),
  ]);
  await fileChooser.setFiles(opts.video);
  console.log("Video file set, waiting for processing...");
  await page.waitForTimeout(15000);
  await page.screenshot({ path: screenshotPath("after-upload.png") });
  console.log("Upload complete");

  // Step 2: Fill description
  console.log("Filling description...");
  const mainFrame = page.frames().find((f) =>
    f.url().includes("platform/post/create")
  );

  if (!mainFrame) {
    console.error("Could not find post/create frame");
    process.exit(1);
  }

  const editor = await mainFrame.$(".input-editor");
  if (editor) {
    await editor.evaluate((el, text) => {
      el.focus();
      el.textContent = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, opts.description);
    console.log("Description filled");
  } else {
    console.warn("Description editor not found — fill manually");
  }

  // Step 3: Fill short title
  console.log("Filling short title...");
  const microFrame = page.frames().find((f) =>
    f.url().includes("micro/content/post/create")
  );
  const targetFrame = microFrame || mainFrame;

  const titleInput = await targetFrame.$('input[placeholder*="概括"]');
  if (titleInput) {
    await titleInput.fill(opts.title);
    console.log("Title filled");
  } else {
    console.warn("Title input not found — fill manually via agent-browser");
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: screenshotPath("ready-to-publish.png") });
  console.log("Ready to publish. Screenshot saved.");
  console.log(
    'Use agent-browser to click the "发表" button when ready, or pass --auto-publish'
  );
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
