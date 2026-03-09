# post-anywhere

A Claude Code skill for automating content publishing to multiple social media platforms via browser automation.

## Supported Platforms

| Platform | Content Type | Automation Method |
|----------|-------------|-------------------|
| **微信视频号** (WeChat Channels) | Video | Playwright CDP + filechooser |
| **小红书** (Xiaohongshu) | Image posts, Long articles | agent-browser |
| **X** (Twitter) | Tweets | agent-browser |
| **微博** (Weibo) | Posts with images/video | agent-browser |
| **微信公众号** (WeChat Official Account) | Articles | agent-browser |
| **掘金** (Juejin) | Articles | agent-browser |
| **知乎** (Zhihu) | Thoughts (想法) | agent-browser |
| **Linux.do** | Forum posts | agent-browser |

## Install

```bash
claude skills add /path/to/post-anywhere
```

## Usage

Once installed, just tell Claude:

```
帮我把 output/video.mp4 发布到视频号
发到小红书
发一条推文
发微博
发到公众号
发掘金文章
发知乎想法
发到 LinuxDo
```

The skill will trigger automatically and guide you through the process.

## Safety

All platforms default to **saving drafts only** — the skill will never auto-click the publish button. You always confirm and publish manually.

## Prerequisites

- **Claude Code** with `agent-browser` skill installed
- **Node.js** 18+
- For WeChat Channels (视频号) only:
  - **Playwright** browsers: `npx playwright install chromium`
  - **playwright** npm package: `npm install playwright`
  - **System dependencies** (headless servers):
    ```bash
    sudo yum install -y atk at-spi2-atk cups-libs libdrm libXcomposite \
      libXdamage libXrandr mesa-libgbm pango alsa-lib nss libxkbcommon
    ```

## File Structure

```
post-anywhere/
├── SKILL.md                      # Multi-platform routing + rules
├── references/
│   ├── 微信视频号.md              # WeChat Channels (Playwright CDP)
│   ├── 小红书图文.md              # Xiaohongshu image posts
│   ├── 小红书长文.md              # Xiaohongshu long articles
│   ├── X推文.md                   # X/Twitter tweets
│   ├── 微博.md                    # Weibo posts
│   ├── 微信公众号文章.md          # WeChat Official Account articles
│   ├── 掘金文章.md                # Juejin articles
│   ├── 知乎想法.md                # Zhihu thoughts
│   └── LinuxDo发帖.md             # Linux.do forum posts
├── scripts/
│   └── publish.js                 # Helper script (WeChat Channels only)
└── README.md
```

## Adding New Platforms

The skill supports self-evolution. Ask Claude to add a new platform:

```
帮我添加一个新的社交平台：抖音
```

It will test the interaction path step by step, then create a new workflow file in `references/`.

## License

MIT
