# ChatGPT2Notion CleanPaste ✨

<p align="center">
  <img src="./assets/hero.svg" alt="ChatGPT2Notion CleanPaste banner" width="100%" />
</p>

<p align="center">
  <b>复制 ChatGPT 到 Notion 时，自动清理公式重复文本</b>
</p>

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Edge%20%7C%20Chrome-2563eb">
  <img alt="Type" src="https://img.shields.io/badge/Type-Userscript-16a34a">
  <img alt="Status" src="https://img.shields.io/badge/Status-Working-success">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-black">
</p>

---

## 😫 痛点
从 ChatGPT 复制含数学公式内容到 Notion，常见变形：

- `R_b^e` 变成 `RbeR_b^eRbe`
- `(z_e)^b` 粘贴后混入 `(ze)b`

这通常是**可访问层文本 + 渲染层文本**被同时复制导致。

## 🚀 解决方案
这个用户脚本会在复制瞬间自动做四件事：

<p align="center">
  <img src="./assets/how-it-works.svg" alt="How it works" width="100%" />
</p>

- 🎯 接管 `copy/cut` 事件
- 🧠 识别 KaTeX / MathJax / MathML 的 LaTeX 注释
- 🧹 清理隐藏层与重复来源节点
- 📋 重写剪贴板 `text/plain` + `text/html`

## ✅ 效果
- 不再出现 `RbeR_b^e` 这类“公式分身”
- 数学公式粘贴更稳定
- 普通正文复制行为保持自然

## ⚡ 快速安装（2 分钟）
1. 安装浏览器扩展：`Violentmonkey（暴力猴）`
2. 新建脚本，把下面文件内容粘贴进去并保存：
   - [`chatgpt2notion-cleanpaste.user.js`](./chatgpt2notion-cleanpaste.user.js)
3. 确认脚本为“已启用”
4. 强制刷新 ChatGPT 页面后测试复制

## 🧪 使用方法
1. 在 ChatGPT 里选中包含公式的文本并复制
2. 粘贴到 Notion
3. 检查公式是否仍出现重复文本

## 🌐 生效站点
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://*.openai.com/*`

## 🛠️ 故障排查
如果你发现“还是重复”：

1. 确认脚本在暴力猴中是启用状态
2. 确认当前页面 URL 命中 `@match`
3. 强制刷新页面后重试
4. 暂时禁用其他剪贴板增强扩展后再测

可附上以下信息提 Issue：
- ChatGPT 原文截图
- Notion 粘贴结果截图
- 最小复现文本

## 🗺️ Roadmap
- [ ] 可选“仅纯文本写入剪贴板”模式
- [ ] 调试模式（输出实际写入文本）
- [ ] 回归测试样例库（常见公式结构）

## 📝 修复笔记（2026-02-26）
### 问题现象
- 含块级公式的内容复制到 Notion 后，被拆成多行块。
- `$$...$$` 内部的某些行（如 `- g`）会被 Notion 识别为列表项，导致公式结构损坏。

### 根因分析
- 复制流程会把提取出的 LaTeX 直接写入剪贴板。
- 当 LaTeX 自身包含换行时，Notion 在粘贴阶段会按行进行 Markdown 风格解析，触发行级语义（段落/列表）。

### 修复内容
- 在 `replaceNodeWithLatex` 前新增 `normalizeLatexForClipboard(latex)`：
  - 将 `\r\n` 统一为 `\n`
  - 清理 `NBSP`
  - 将 LaTeX 内部换行与多余空白折叠为单空格
- 最终写入剪贴板的数学内容保持单行，避免被 Notion 拆块解析。

### 影响范围
- 仅影响数学节点提取后的 LaTeX 文本归一化逻辑。
- 普通正文复制逻辑不变。

### 复测建议
1. 复制包含 `$$\begin{bmatrix} ... \end{bmatrix}$$` 的多行公式。
2. 粘贴到 Notion，确认不再拆成多块或列表项。
3. 同时抽查行内公式 `$...$` 与普通段落复制结果。

## 🤝 贡献
欢迎 Issue / PR，尤其欢迎：
- 新站点结构变更的兼容修复
- 公式节点提取策略优化
- 可复现异常样例补充

## 📄 License
MIT
