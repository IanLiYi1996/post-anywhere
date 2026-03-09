---
name: post-anywhere
description: 使用 agent-browser 帮用户将内容发到社交媒体上。当用户需要发布内容、推送文章、上传视频、发帖到社交平台时使用此 skill。支持平台：视频号/WeChat Channels、小红书、X/Twitter、微博/Weibo、微信公众号、掘金、知乎、Linux.do。触发词包括"发布到视频号"、"上传视频号"、"发到小红书"、"发推"、"发微博"、"发公众号"、"发掘金"、"发知乎"、"发到LinuxDo"、"post anywhere"、"publish to"等。
---

用户输入 $ARGUMENTS

# Post-Anywhere Skill

使用 agent-browser 和 Playwright，帮助用户将文章、图片、视频上传到对应的社交平台。

# Rules

1. 使用 `agent-browser --auto-connect` 自动连接用户的浏览器；如果是视频号平台则使用 `agent-browser --cdp 9222` 连接 Playwright 启动的 Chrome
2. 最终操作只能是**暂存草稿**，禁止自动点击"发布"按钮，由用户自行确认发布
3. 每步操作后用 `agent-browser snapshot -i` 确认元素 ref，因为页面状态变化可能导致 ref 编号变化
4. 视频号平台需要特殊处理：使用 Playwright CDP 连接 + filechooser 事件上传 + frame 访问填写描述（详见视频号 reference）

# Core Workflow

1. **确认发布信息**：调用 AskUserQuestion tool 确认：目标平台（还是**添加新平台**）、内容类型、内容来源（文件路径/直接输入/AI 创作）、标题、话题标签
2. 简单了解 `agent-browser --help` 可用命令
3. 读取 references 中对应平台和内容类型的 workflow
4. 严格按照 workflow 中的步骤逐步执行

# Self-evolution

## 修复失效的 Workflow

网页交互可能发生变化，references 下面的 workflow 可能失效，按以下步骤修复：

1. 运行 `agent-browser snapshot` 查看当前页面的详细元素
2. 当查找失败，运行 `agent-browser eval "js"` 查看具体 html 元素
3. 验证正确的交互路径后，编辑 references 下对应的 workflow 文件进行修正

## 添加新的社交平台

当用户询问需要新添加一个平台时候，按以下步骤添加：

1. 参考 references 下已有的 workflow 作为模板
2. 用 `agent-browser --help` 查看可用命令和 agent-browser 的 skill
3. 只有当启动浏览器，完整一步一步测试新的平台交互路径，确保每步操作正确
4. 才能在 references 目录下创建新平台的 workflow 文件，并在下方 References 中添加链接

# References

## 微信视频号
- `微信视频号`：查看[微信视频号](./references/微信视频号.md)发布视频时的 workflow（需 Playwright CDP + filechooser）

## 小红书
- `小红书图文`：查看[小红书图文](./references/小红书图文.md)发布简短图文时的 workflow
- `小红书长文`：查看[小红书长文](./references/小红书长文.md)发送长文本时的 workflow

## X (Twitter)
- `X推文`：查看[X推文](./references/X推文.md)发布推文时的 workflow

## 微博 (Weibo)
- `微博`：查看[微博](./references/微博.md)发布微博时的 workflow

## 微信公众号
- `微信公众号文章`：查看[微信公众号文章](./references/微信公众号文章.md)发布公众号文章时的 workflow

## 掘金
- `掘金文章`：查看[掘金文章](./references/掘金文章.md)发布掘金文章并自动保存草稿的 workflow

## 知乎
- `知乎想法`：查看[知乎想法](./references/知乎想法.md)发布知乎想法时的 workflow

## Linux.do
- `LinuxDo发帖`：查看[LinuxDo发帖](./references/LinuxDo发帖.md)发布帖子（含类别与标签选择）的 workflow
