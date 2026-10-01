# 部署指南（GitHub 仓库 + GitHub Pages）

本项目是**零依赖静态站点**，仓库根目录就是站点根目录，因此部署链路极短：

```
推送 main 分支  →  GitHub Actions 上传静态文件  →  Pages 发布
```

---

## 一、仓库里已经准备好的部署配置

| 文件 | 作用 |
|---|---|
| `.gitignore` | 忽略编辑器、依赖、日志、密钥等无关文件 |
| `.nojekyll` | 空文件，告诉 GitHub Pages 跳过 Jekyll 处理（否则 `_dev/` 这类下划线目录会被丢弃） |
| `.github/workflows/deploy-pages.yml` | 推送 `main` 时自动构建并发布到 Pages |
| `deploy.ps1` | Windows 一键部署脚本：配置 remote、推送、尝试自动开启 Pages |
| `LICENSE` | MIT 协议（可按需替换或删除） |
| `serve.js` | 本地预览用的零依赖静态服务器 |

---

## 二、一键部署（Windows，推荐）

### 第 1 步：在 GitHub 上创建一个**空**仓库

打开 <https://github.com/new>，填写仓库名（例如 `lightmate`），
**不要**勾选 "Add a README / .gitignore / license"，点击创建。

> 如果还没有 GitHub 账号，先注册一个（2 分钟），仓库可以设为 Private 或 Public，
> 两种都能用 GitHub Pages（Private 仓库需要 GitHub Pro 才能发布 Pages，建议先设为 Public）。

### 第 2 步：跑脚本

把 `<你的用户名>` 换成你的 GitHub 用户名：

```powershell
cd D:\AI大模型\工作区1\lightmate
.\deploy.ps1 -Remote "https://github.com/<你的用户名>/lightmate.git"
```

脚本会依次完成：环境自检 → 配置 `origin` → 推送 `main` → 尝试开启 Pages。
首次推送会弹出浏览器让你登录 GitHub，登录一次即可，之后不再需要密码。

只想先看看环境是否就绪、不做任何改动：

```powershell
.\deploy.ps1 -Check
```

### 第 3 步：确认 Pages 设置

进入仓库 **Settings → Pages**，确认 **Source** 是 **`GitHub Actions`**
（工作流首次运行后通常会自动设置好；若显示 `Deploy from a branch` 请手动改过来）。

### 第 4 步：访问

**Actions** 标签页里 `Deploy to GitHub Pages` 跑完后（约 1～2 分钟），访问：

```
https://<你的用户名>.github.io/lightmate/
```

> 若 Actions 没有自动触发，可在 Actions 页面点 `Run workflow` 手动执行
> （工作流已配置 `workflow_dispatch`）。

### 如果已经装了 GitHub CLI，可以更进一步

```powershell
gh auth login
.\deploy.ps1 -GhRepo lightmate -Public
```

`gh` 会直接替你建仓库、推送、并把 Pages 的 Source 设成 GitHub Actions，
连第 1 步和第 3 步都省了。安装 gh：

```powershell
winget install --id GitHub.cli -e
```

---

## 三、手动部署（macOS / Linux，或不想用脚本）

```bash
git remote add origin https://github.com/<你的用户名>/lightmate.git
git branch -M main
git push -u origin main
```

然后同样到 **Settings → Pages** 把 Source 改成 `GitHub Actions`。

---

## 四、后续更新

```bash
git add -A
git commit -m "feat: 说明这次改了什么"
git push
```

Actions 会自动重新发布，不需要任何额外操作。

---

## 五、本地预览

```bash
# 方式 1：直接双击 index.html（本项目已验证 file:// 下 localStorage 可用）

# 方式 2：本地服务器（推荐，行为与线上完全一致）
node serve.js          # http://localhost:5173/
node serve.js 8080     # 指定端口
```

本地跑一次冒烟测试（68 项断言）：

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --headless=new --disable-gpu --virtual-time-budget=15000 `
  --dump-dom "file:///D:/AI大模型/工作区1/lightmate/_dev/smoke.html"
```

在输出里搜索 `<pre id="report">` 即可看到完整报告。
（本机已验证：`file://` 与 `http://` 两种方式均为 **68 项通过 / 0 报错**。）

---

## 六、可选：绑定自定义域名

1. 在仓库根目录新增 `CNAME` 文件，内容为你的域名（例如 `lightmate.example.com`）。
2. 在 DNS 服务商处添加一条 `CNAME` 记录，指向 `<你的用户名>.github.io`。
3. 回到 **Settings → Pages**，填入域名并勾选 **Enforce HTTPS**。

---

## 七、常见问题

**Q：页面打开是 404？**
A：确认 Settings → Pages 的 Source 选的是 `GitHub Actions`，且 Actions 里的
`Deploy to GitHub Pages` 工作流已经跑成功（绿色对勾）。

**Q：`_dev/` 下的测试页访问不了？**
A：确认 `.nojekyll` 已提交。若用 `Deploy from a branch` 模式且没有 `.nojekyll`，
Jekyll 会跳过所有下划线开头的目录。

**Q：`deploy.ps1` 提示「无法加载文件，因为在此系统上禁止运行脚本」？**
A：PowerShell 执行策略限制，用下面任意一种方式运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Remote "<仓库地址>"
# 或仅对当前窗口放开
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Q：推送时提示 `remote origin already exists`？**
A：脚本会自动改成 `set-url` 覆盖，不会报错；手动操作时执行
`git remote set-url origin <新地址>` 即可。

**Q：想改用 Gitee Pages？**
A：删除或忽略 `.github/`，把仓库推到 Gitee，在「服务 → Gitee Pages」里选择
`master` 分支、部署目录留空即可，其余不需要改动。

**Q：推送失败，提示认证相关错误？**
A：脚本使用的是系统 Git 凭据管理器。手动触发一次登录：

```powershell
git push -u origin main     # 会弹出浏览器登录
```
