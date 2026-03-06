---
name: wechat-channels-publish
description: Automate video publishing to WeChat Channels (视频号) via browser automation. Use this skill whenever the user wants to publish, upload, or post a video to 视频号/WeChat Channels/微信视频号. Also use when the user mentions "发布到视频号", "上传视频号", "视频号发布", or any task involving automated interaction with channels.weixin.qq.com. This skill handles the complete flow including Chrome setup, QR code login, video upload through wujie shadow DOM, form filling, and publishing.
---

# WeChat Channels (视频号) Video Publishing

Automate video publishing to WeChat Channels creator platform via headless Chrome + agent-browser + Playwright CDP.

## Architecture Overview

WeChat Channels creator platform (`channels.weixin.qq.com`) uses:
- **wujie micro-frontend**: Content is inside a `<wujie-app>` shadow DOM host
- **Nested frames**: The actual form lives in `https://channels.weixin.qq.com/platform/post/create` frame, with a sub-frame at `https://channels.weixin.qq.com/micro/content/post/create`
- **ant-upload component**: File input is hidden inside the shadow DOM, requires filechooser interception
- **QR code login**: Cannot be automated — user must scan with WeChat mobile app

These architectural details matter because standard Playwright selectors and agent-browser snapshots cannot directly access elements inside the wujie shadow DOM. The workflow below uses specific techniques to work around each layer.

## Prerequisites

- `agent-browser` CLI installed
- Playwright browsers installed: `npx playwright install chromium`
- System dependencies for headless Chrome (Amazon Linux: `sudo yum install -y atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib nss libxkbcommon`)
- `playwright` npm package in the project: `npm install playwright`
- A video file ready to upload (MP4, H.264, ≤20GB, recommended 720p+)

## Complete Workflow

### Step 1: Launch Chrome with Remote Debugging

Use `--headless=new` mode (not the older `--headless` or headless shell) — this is critical because WeChat's QR code does not render in the old headless mode or headless shell.

```bash
CHROME_PATH=$(find ~/.cache/ms-playwright -name "chrome" -path "*/chrome-linux64/*" -type f 2>/dev/null | head -1)

$CHROME_PATH \
  --remote-debugging-port=9222 \
  --no-sandbox \
  --disable-gpu \
  --headless=new \
  --window-size=1920,1080 \
  "https://channels.weixin.qq.com/login.html" &

sleep 5
curl -s http://localhost:9222/json/version  # Verify Chrome is running
```

### Step 2: Connect agent-browser and Get QR Code

```bash
agent-browser --cdp 9222 wait --load networkidle
agent-browser --cdp 9222 wait 8000   # QR code needs extra time to render
agent-browser --cdp 9222 screenshot /path/to/qr-code.png
```

Show the screenshot to the user and ask them to scan with WeChat. The QR code expires in ~5 minutes — if it does, reload the page and re-screenshot.

**Wait for the user to confirm they have scanned and logged in before proceeding.**

### Step 3: Verify Login and Navigate to Publish

```bash
agent-browser --cdp 9222 wait --load networkidle
agent-browser --cdp 9222 screenshot /path/to/logged-in.png
```

Verify the screenshot shows the dashboard (look for user avatar, "首页", "内容管理" sidebar). Then:

```bash
agent-browser --cdp 9222 snapshot -i
# Look for: button "发表视频" [ref=eN]
agent-browser --cdp 9222 click @eN   # Click 发表视频
agent-browser --cdp 9222 wait --load networkidle
agent-browser --cdp 9222 wait 3000
```

Verify URL is `https://channels.weixin.qq.com/platform/post/create`.

### Step 4: Upload Video File

The upload input is hidden inside a wujie shadow DOM. Standard `agent-browser upload` will fail because the element is a `<span role="button">` not an `<input type="file">`. Use Playwright's filechooser event interception:

```javascript
// upload-video.js — run with: node upload-video.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = browser.contexts()[0].pages()[0];

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    page.evaluate(() => {
      const shadowEl = document.querySelector('wujie-app');
      const sr = shadowEl.shadowRoot;
      const fileInput = sr.querySelector('input[type="file"]');
      fileInput.click();
    })
  ]);

  await fileChooser.setFiles('/path/to/video.mp4');
  console.log('Video uploaded!');

  await page.waitForTimeout(10000); // Wait for upload processing
})().catch(e => console.error(e.message));
```

After upload completes, screenshot to verify the video thumbnail and form fields appear.

### Step 5: Fill Video Description

The description editor is a `contenteditable` div with class `input-editor`, located inside the `platform/post/create` frame. It cannot be accessed by `agent-browser` because it's inside the wujie shadow DOM boundary. Use Playwright's frame access:

```javascript
// fill-description.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = browser.contexts()[0].pages()[0];

  // Find the correct frame
  const mainFrame = page.frames().find(f => f.url().includes('platform/post/create'));
  const editor = await mainFrame.$('.input-editor');

  if (editor) {
    await editor.evaluate((el, text) => {
      el.focus();
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'Your video description here #hashtag1 #hashtag2');
    console.log('Description filled!');
  }
})().catch(e => console.error(e.message));
```

### Step 6: Fill Short Title

The short title input IS accessible via agent-browser (it's outside the shadow DOM boundary):

```bash
agent-browser --cdp 9222 snapshot -i
# Look for: textbox "概括视频主要内容，字数建议6-16个字符" [ref=eN]
agent-browser --cdp 9222 fill @eN "Your short title here"
```

**Important**: Short title must be ≤16 Chinese characters. If exceeded, the platform shows a red "标题超过16字限制" error and the publish button becomes disabled.

### Step 7: Publish

```bash
agent-browser --cdp 9222 snapshot -i
# Look for: button "发表" [ref=eN] — should be orange/active color
agent-browser --cdp 9222 click @eN
agent-browser --cdp 9222 wait 10000
agent-browser --cdp 9222 screenshot /path/to/result.png
agent-browser --cdp 9222 get url
```

If successful, the URL will redirect to `https://channels.weixin.qq.com/platform/post/list` and the screenshot will show your video in the list with publish timestamp.

### Step 8: Cleanup

```bash
pkill -f "chrome.*remote-debugging" 2>/dev/null
```

## Bundled Helper Script

For convenience, use `scripts/publish.js` which combines steps 4-6 into a single script. See the script for usage.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| QR code not rendering | Must use `--headless=new` flag, not `--headless` or headless shell |
| `libatk-1.0.so.0` missing | Install system deps (see Prerequisites) |
| `Cannot set input files to detached element` | Don't cache ElementHandles — use filechooser event pattern instead |
| `agent-browser upload` fails with "not an HTMLInputElement" | Expected — use Playwright filechooser (Step 4) |
| Description not filling | Must use Playwright frame access, not agent-browser (Step 5) |
| "标题超过16字限制" | Short title must be ≤16 characters |
| Publish button grayed out | Check for validation errors (title too long, missing required fields) |
| `input-editor` not found in frame.evaluate() | Use `frame.$('.input-editor')` then `handle.evaluate()` — the element is findable via selector but not via in-page `document.querySelector` due to wujie isolation |

## Video Requirements for 视频号

| Spec | Requirement |
|------|------------|
| Format | MP4 (H.264) |
| Max size | 20GB |
| Max duration | 8 hours |
| Resolution | 720p+ recommended, 1080x1920 ideal for vertical |
| Aspect ratio | 9:16 (vertical) or 16:9 (horizontal) |
| Frame rate | ≤60fps |
