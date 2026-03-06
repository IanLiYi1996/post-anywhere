# wechat-channels-publish

A Claude Code skill for automating video publishing to **WeChat Channels (视频号)**.

## What it does

Automates the complete video publishing flow on `channels.weixin.qq.com`:

1. Launches headless Chrome with remote debugging
2. Shows QR code for WeChat login (user scans with phone)
3. Uploads video file (navigating wujie micro-frontend shadow DOM)
4. Fills video description, short title, and metadata
5. Clicks publish and verifies success

## Install

```bash
claude skills add /path/to/wechat-channels-publish
```

Or clone this repo and add from local path:

```bash
git clone https://github.com/<your-username>/wechat-channels-publish.git
claude skills add ./wechat-channels-publish
```

## Usage

Once installed, just tell Claude:

```
帮我把 output/video.mp4 发布到视频号
```

or

```
Publish my video to WeChat Channels
```

The skill will trigger automatically and guide you through the process.

## Prerequisites

- **Claude Code** with `agent-browser` skill installed
- **Node.js** 18+
- **Playwright** browsers: `npx playwright install chromium`
- **System dependencies** (Amazon Linux / headless servers):
  ```bash
  sudo yum install -y atk at-spi2-atk cups-libs libdrm libXcomposite \
    libXdamage libXrandr mesa-libgbm pango alsa-lib nss libxkbcommon
  ```
- **playwright** npm package in your project: `npm install playwright`

## Technical Details

WeChat Channels uses a **wujie micro-frontend** architecture, which means:

- The page content lives inside a `<wujie-app>` shadow DOM host
- Form elements are NOT accessible via standard `agent-browser` selectors
- File upload requires Playwright's **filechooser event interception** (not standard `upload` command)
- The description editor is a `contenteditable` div found via **Playwright frame access** (`page.frames()`)
- Must use Chrome `--headless=new` mode — the old headless mode and headless shell don't render the QR code

These workarounds are all documented in the skill and handled automatically.

## File Structure

```
wechat-channels-publish/
├── SKILL.md              # Full 8-step workflow with code examples
├── scripts/
│   └── publish.js        # Helper script for upload + form filling
└── README.md
```

## Video Requirements

| Spec | Requirement |
|------|------------|
| Format | MP4 (H.264) |
| Max size | 20GB |
| Max duration | 8 hours |
| Resolution | 720p+ recommended |
| Aspect ratio | 9:16 (vertical) or 16:9 |
| Short title | ≤ 16 characters |

## License

MIT
