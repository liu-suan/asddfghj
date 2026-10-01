# 从零开始：把轻伴放到 GitHub 并上线（保姆级全教程）

> 适用：完全没有 GitHub 仓库、也没推送过代码的情况。
> 全程大约 10～15 分钟（含注册账号）。
> 你的项目已经是一个**完整的 git 仓库**（4 个提交，工作区干净），所以下面只需要「建远程仓库 + 推上去」。

---

## 0. 先看总览：一共 5 步

```
① 注册 / 登录 GitHub
        ↓
② 网页上建一个「空仓库」（关键：什么都不要勾）
        ↓
③ 在本机把代码推送上去（首次会弹浏览器登录）
        ↓
④ 在仓库设置里开启 Pages（Source 选 GitHub Actions）
        ↓
⑤ 等 Actions 跑完 → 访问 https://<用户名>.github.io/lightmate/
```

**最短路径速查**（已经熟悉 GitHub 的人看这段就够）：

```powershell
# ② 去 https://github.com/new 建空仓库，名字 lightmate，选 Public，什么都不勾
# ④ 建完先去 Settings → Pages → Source 选 "GitHub Actions"

# ③ 推送
cd D:\AI大模型\工作区1\lightmate
git remote add origin https://github.com/<你的用户名>/lightmate.git
git push -u origin main
```

---

## ① 注册 / 登录 GitHub

已经有账号 → 直接跳到 ②。

### 注册步骤

1. 打开 <https://github.com/signup>
2. 依次填写：
   - **Email**：建议用常用邮箱。**如果你是学生，强烈建议用学校邮箱**（`@xxx.edu.cn` 之类），
     后面申请学生包能直接过。
   - **Password**：至少 8 位，且必须包含数字和小写字母。
   - **Username（用户名）**：⚠️ 这个会出现在你的项目网址里，**一旦确定改动很麻烦**。
     建议：全小写英文 + 数字，例如 `xiaoman2026`。不要用中文、空格、特殊符号。
   - **邮箱验证码**：去邮箱收 6 位数字填进来。
3. 地区选 China，是否收产品邮件随意。
4. 计划页面选 **Free**（免费版就够用，见下面的说明）。

### 建议顺手做两件事

| 事项 | 为什么 | 怎么做 |
|---|---|---|
| 开启两步验证（2FA） | GitHub 对贡献者强制要求，早晚要开 | 头像 → Settings → Password and authentication → Two-factor authentication |
| 申请 **GitHub Student Developer Pack** | 学生免费送 **GitHub Pro**，解锁「私有仓库也能开 Pages」，还有 Copilot 等一堆福利 | <https://education.github.com/pack> → 用学校邮箱申请，一般几天内通过 |

> ⚠️ **免费账号的重要限制**：GitHub Pages 在免费计划下**只支持公开（Public）仓库**。
> 官方说明：*"GitHub Pages is available in public repositories with GitHub Free ... and in
> public and private repositories with GitHub Pro, GitHub Team ..."*
> 所以下面建仓时，**免费账号请选 Public**。如果你申请到了学生包（= Pro），才可以选 Private 并正常开 Pages。

---

## ② 建一个「空仓库」

1. 打开 <https://github.com/new>（也可以点右上角 `+` → New repository）
2. 按下表填写：

| 字段 | 填什么 | 说明 |
|---|---|---|
| **Owner** | 你的用户名 | 默认已选好，不用改 |
| **Repository name** | `lightmate` | ⚠️ 会出现在网址里，建议全小写。想用中文名可以，但不推荐 |
| **Description** | `面向大学生的 AI 减脂陪伴 Web Demo` | 选填 |
| **Public / Private** | **选 Public** | 免费账号开 Pages 必须 Public，见上方红框说明 |
| **Add a README file** | ❌ **不要勾** | 本地已经有 README，勾了会产生冲突 |
| **Add .gitignore** | ❌ **不要勾** | 本地已经有 `.gitignore` |
| **Choose a license** | ❌ **不要勾** | 本地已经有 `LICENSE` |

3. 点绿色的 **Create repository**。

### 成功的样子

页面会跳转到一个标题类似 **"Quick setup — if you've done this kind of thing before"** 的空仓库页面，
里面有 `git remote add origin ...` 之类的命令提示。

> ✅ 看到这个页面就说明仓库建好了。
> ⚠️ 如果页面里能看到 README 文件列表，说明你**勾了初始化文件**——这会让后面的 `git push` 被拒绝。
> 解决办法：删掉这个仓库重建（Settings 最下面 → Delete this repository），或者按附录 C 处理。

### 复制你的仓库地址

在仓库页面点绿色的 **`< > Code`** 按钮 → **HTTPS** 标签 → 复制那个地址，形如：

```
https://github.com/你的用户名/lightmate.git
```

也可以直接在浏览器地址栏看：`https://github.com/你的用户名/lightmate`，在后面加 `.git` 就是。

---

## ③ 把本地代码推上去

### 3.1 打开 PowerShell

按 `Win` 键，输入 `powershell`，回车。

> ⚠️ **重要**：Git 是刚刚才装好的，你现在开着的终端可能还不认识 `git` 命令。
> **必须新开一个窗口。** 如果新窗口里敲 `git --version` 还是报错，改用完整路径：
> `& "C:\Program Files\Git\cmd\git.exe" --version`

### 3.2 执行这两条命令

```powershell
cd D:\AI大模型\工作区1\lightmate

git remote add origin https://github.com/<你的用户名>/lightmate.git
git push -u origin main
```

> 🔴 **记得把 `<你的用户名>` 换成你自己的**，尖括号 `< >` 也要一起删掉。
> 例如用户名是 `xiaoman2026`，那地址就是
> `https://github.com/xiaoman2026/lightmate.git`

**如果嫌敲命令麻烦**，本仓库已经准备了一键脚本，效果完全一样：

```powershell
cd D:\AI大模型\工作区1\lightmate
.\deploy.ps1 -Remote "https://github.com/<你的用户名>/lightmate.git"
```

脚本会自动判断 remote 是否已存在、推送、并尝试帮你开启 Pages，还会告诉你站点地址。

### 3.3 第一次推送会弹出登录窗口

`git push` 之后会**自动弹出一个窗口**（Git Credential Manager，因为本机 Git 已自带）：

1. 选 **Sign in with your browser**（用浏览器登录）
2. 浏览器打开 GitHub 授权页 → 点 **Authorize / 授权**
3. 看到 **"Authentication Succeeded"** → 关掉浏览器，回到 PowerShell 窗口
4. 命令会自己继续跑完

**登录一次就够了**，以后推送不再需要密码。

> 如果窗口弹不出来 / 登录失败，用「个人访问令牌（PAT）」的方式，见 [附录 A](#附录-a弹不出登录窗口时用-token-推送)。

### 3.4 推送成功的标志

看到类似这样的输出就是成功了：

```
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
...
To https://github.com/你的用户名/lightmate.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

回到浏览器刷新仓库页面，就能看到 `index.html`、`assets/` 等文件了。

### 3.5 顺手确认一下

```powershell
git log --oneline          # 应该看到 4 条提交
git status                 # 应该显示 "nothing to commit, working tree clean"
git remote -v              # 应该看到 origin 指向你的仓库
```

---

## ④ 开启 GitHub Pages

### 4.1 进入设置

在仓库页面（不是个人主页）点顶部菜单栏的 **Settings** ⚙️。

> ⚠️ 最容易走错的一步：要的是**仓库的 Settings**，不是点右上角头像进去的**账号 Settings**。

### 4.2 找到 Pages

左侧边栏往下拉，找到 **Pages**（在 "Code and automation" 分组里）。

### 4.3 设置 Source

在 **Build and deployment** → **Source** 下拉框里，从默认的 `Deploy from a branch`
改成 **`GitHub Actions`**。

改完就可以，**不需要点保存**（下拉框选完即生效）。

> 为什么必须改成这个？因为本仓库用的是 GitHub Actions 工作流来发布
> （`.github/workflows/deploy-pages.yml`）。如果不改，工作流跑到部署那一步会报错。

---

## ⑤ 确认部署成功

### 5.1 看 Actions

点仓库顶部菜单的 **Actions** 标签。你会看到一条名为 **Deploy to GitHub Pages** 的运行记录：

| 图标 | 含义 | 怎么办 |
|---|---|---|
| 🟡 黄色圆点 | 正在运行 | 等 1～2 分钟 |
| ✅ 绿色对勾 | 成功 | 去 5.2 访问站点 |
| ❌ 红色叉 | 失败 | 点进去看报错，对照[常见问题](#常见问题)第 1 条 |

### 5.2 访问你的站点

```
https://<你的用户名>.github.io/lightmate/
```

例如用户名为 `xiaoman2026`：<https://xiaoman2026.github.io/lightmate/>

> 小知识：**项目站点**的网址规则固定是 `https://<用户名>.github.io/<仓库名>/`。
> 如果你想要更短的 `https://<用户名>.github.io/`，需要把仓库改名为 `<用户名>.github.io`，
> 详见[常见问题](#常见问题)第 6 条。

### 5.3 建议马上体验一遍

打开网址 → 点 **「先看看示例数据」** → 依次点开 今日 / 饮食 / 打卡 / 成长 / 我的计划。
确认五个页面都正常，就说明线上部署完全成功了。

---

## ⑥ 以后怎么更新

每次改完代码，三条命令搞定，Actions 会自动重新发布：

```powershell
cd D:\AI大模型\工作区1\lightmate
git add -A
git commit -m "feat: 这次改了什么"
git push
```

大约 1 分钟后刷新网站就能看到新版本（如果没变，按 `Ctrl + F5` 强制刷新缓存）。

---

## 常见问题

### 1. Actions 里那个工作流是红色叉，报 Pages 相关错误

**原因**：没有把 Pages 的 Source 改成 `GitHub Actions`，或者改得太晚，导致这一次运行失败。

**解决**：
1. 先确认 Settings → Pages → Source 已经是 `GitHub Actions`
2. 回到 Actions → 点进失败的那次运行 → 右上角 **Re-run all jobs**（重新运行）

如果报的是 `Resource not accessible by integration`，检查工作流文件里的权限块是否完整：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### 2. Settings → Pages 里没有 `GitHub Actions` 这个选项

**原因**：仓库是 **Private**，而账号是免费计划（Pages 在免费计划下只支持 Public 仓库）。

**解决**（二选一）：
- 把仓库改成公开：Settings → 最下面 **Danger Zone** → **Change repository visibility** → Make public
- 或者申请 [GitHub Student Developer Pack](https://education.github.com/pack) 拿到 Pro，就能用私有仓库

### 3. 推送时提示 `remote origin already exists`

说明之前配过 remote。直接改地址：

```powershell
git remote set-url origin https://github.com/<你的用户名>/lightmate.git
```

或者用一键脚本，它会自动处理这种情况：

```powershell
.\deploy.ps1 -Remote "https://github.com/<你的用户名>/lightmate.git"
```

### 4. 推送被拒绝，提示 `failed to push some refs` / `updates were rejected`

**原因**：建仓库时勾了 "Add a README file" 等初始化文件，远程有本地没有的提交。

**解决**（保留两边内容）：

```powershell
git pull origin main --allow-unrelated-histories --no-rebase
# 如果提示冲突，解决冲突后：
git add -A
git commit -m "merge: 合并远程初始化文件"
git push -u origin main
```

### 5. 推送时让我输入用户名和密码，输密码又报错

GitHub **早就不支持用账号密码推送**了。密码框里要填的是**个人访问令牌（PAT）**，
不是你的登录密码。见[附录 A](#附录-a弹不出登录窗口时用-token-推送)。

### 6. 想要 `https://<用户名>.github.io/` 这样的短网址

1. 仓库 → Settings → 最上面 **Repository name** → 改成 `<你的用户名>.github.io`（例如 `xiaoman2026.github.io`）
2. 点 Rename
3. 本地同步改 remote：

```powershell
git remote set-url origin https://github.com/<你的用户名>/<你的用户名>.github.io.git
```

以后访问 <https://你的用户名.github.io/> 即可（不需要加仓库名）。

### 7. 网站打开是 404

按顺序排查：

1. Actions 里 Deploy 工作流是不是 ✅ 成功了？
2. Settings → Pages 里 Source 是不是 `GitHub Actions`？
3. 网址有没有写错？必须是 `https://<用户名>.github.io/<仓库名>/`，**结尾的 `/` 别漏**
4. 刚部署完可能有 1～2 分钟 CDN 缓存，稍等一下强刷（`Ctrl + F5`）

### 8. `_dev/` 目录下的页面打不开

本仓库有 `.nojekyll` 文件，正常情况下 `/lightmate/_dev/smoke.html` 可以访问。
如果打不开，确认 `.nojekyll` 已经推上去了（它是个空文件，容易被忽略）：

```powershell
git ls-files | findstr nojekyll
```

### 9. 国内网络访问 GitHub 慢 / 推送失败

这是常见问题，可以试：
- 换网络（手机热点有时反而更快）
- Git 走代理（把端口换成你本地代理的端口）：

```powershell
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

- 实在不行改用 **Gitee（码云）**：见[附录 D](#附录-d改用-gitee码云)。

---

## 附录 A：弹不出登录窗口时，用 Token 推送

1. 打开 <https://github.com/settings/tokens?type=beta>（Fine-grained tokens）
2. 点 **Generate new token**
3. 填写：
   - **Token name**：`lightmate-push`
   - **Expiration**：90 天（够用）
   - **Repository access**：选 **Only select repositories** → 选 `lightmate`
   - **Permissions** → Repository permissions：
     - `Contents` → **Read and write**（必需）
     - `Pages` → **Read and write**（想让我/脚本自动开 Pages 才需要）
     - `Metadata` → Read-only（会自动勾上）
4. 点 **Generate token**，**立刻复制**那串 `github_pat_...`（关掉页面就再也看不到了）
5. 回到 PowerShell 推送，用户名填你的 GitHub 用户名，**密码粘贴这串 token**：

```powershell
git push -u origin main
# Username: <你的用户名>
# Password: <粘贴 token，输入时不会显示字符，这是正常的>
```

6. 让 Git 记住它，避免每次输入：

```powershell
git config --global credential.helper manager
```

> 🔒 安全提醒：Token 等同于密码。不要写进代码、不要提交到仓库、不要发给别人。
> 用完后可以到同一页面 **Revoke** 掉。

---

## 附录 B：用命令行一条命令建仓（装了 gh 的话）

不想在网页上点来点去，可以装 GitHub CLI：

```powershell
winget install --id GitHub.cli -e
# 装完新开一个终端
gh auth login          # 按提示选 GitHub.com → HTTPS → Login with a web browser
```

然后**一条命令**完成建仓 + 推送：

```powershell
cd D:\AI大模型\工作区1\lightmate
gh repo create lightmate --public --source=. --remote=origin --push
```

本仓库的一键脚本也支持这种玩法（还会顺手帮你把 Pages 的 Source 设好）：

```powershell
.\deploy.ps1 -GhRepo lightmate -Public
```

---

## 附录 C：建仓时误勾了初始化文件怎么办

**方案一（推荐，最省事）**：删掉重建。

仓库 → Settings → 拉到最下面 **Danger Zone** → **Delete this repository** → 按提示确认，
然后回到 [② ](#-建一个空仓库) 重新建一个。

**方案二**：保留远程的初始化文件，合并后再推：

```powershell
git pull origin main --allow-unrelated-histories --no-rebase
git push -u origin main
```

---

## 附录 D：改用 Gitee（码云）

如果 GitHub 实在访问不了，Gitee 的流程几乎一样，而且国内访问快：

1. 注册 <https://gitee.com>（可用手机号）
2. 右上角 `+` → **新建仓库** → 仓库名 `lightmate` → **开源**（Gitee Pages 需要开源）→ 不要勾任何初始化选项 → 创建
3. 本地推送：

```powershell
cd D:\AI大模型\工作区1\lightmate
git remote add origin https://gitee.com/<你的用户名>/lightmate.git
git push -u origin main
```

4. 仓库 → **服务** → **Gitee Pages** → 部署分支选 `master` 或 `main`、部署目录留空 → 点**启动**

Gitee Pages 免费版需要**实名认证**，且每次更新后要手动点一次「更新」重新部署
（不像 GitHub Actions 全自动）。另外本仓库的 `.github/` 目录对 Gitee 没有影响，可以不管。

---

## 一页速查表

| 我想…… | 命令 / 位置 |
|---|---|
| 建仓库 | <https://github.com/new>（什么都不勾！） |
| 看自己所有的仓库 | <https://github.com?tab=repositories> |
| 查看远程地址 | `git remote -v` |
| 修改远程地址 | `git remote set-url origin <新地址>` |
| 推送代码 | `git add -A` → `git commit -m "说明"` → `git push` |
| 看提交历史 | `git log --oneline` |
| 看当前状态 | `git status` |
| 开 Pages | 仓库 → Settings → Pages → Source → `GitHub Actions` |
| 看部署进度 | 仓库 → Actions |
| 站点地址 | `https://<用户名>.github.io/<仓库名>/` |
| 一键部署（本仓库） | `.\deploy.ps1 -Remote "<仓库地址>"` |
| 环境自检（不改动） | `.\deploy.ps1 -Check` |

---

## 附：你现在的项目状态

- ✅ 本地 Git 仓库已建好，`main` 分支，4 个提交，工作区干净
- ✅ 已装 Git 2.55（`C:\Program Files\Git\cmd\git.exe`），自带 Git Credential Manager
- ✅ Pages 自动部署工作流已就位（`.github/workflows/deploy-pages.yml`）
- ✅ `.nojekyll`、`.gitignore`、`LICENSE`、`DEPLOY.md`、`deploy.ps1` 均已提交
- ⬜ **还差**：建远程仓库 + 推送（就是本文档的 ② ③ 两步）
