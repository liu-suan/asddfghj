# =====================================================================
#  轻伴 LightMate — 一键推送到远程 Git 仓库（并可选开启 GitHub Pages）
#
#  用法：
#    # 1) 推到 GitHub（仓库已存在，或先用 gh 创建）
#    .\deploy.ps1 -Remote "https://github.com/<你的用户名>/lightmate.git"
#
#    # 2) 已经装了 gh 并登录过，可以直接让它建仓 + 推送 + 开 Pages
#    .\deploy.ps1 -GhRepo "lightmate" -Public
#
#    # 3) 只检查环境，不做任何改动
#    .\deploy.ps1 -Check
# =====================================================================
[CmdletBinding()]
param(
  [string]$Remote,                 # 远程仓库地址（https 或 ssh 或本地裸仓库路径）
  [string]$GhRepo,                 # 用 gh 创建仓库时的仓库名
  [switch]$Public,                 # gh 建仓时设为公开（默认私有）
  [switch]$SkipPush,               # 只配置 remote，不推送
  [switch]$Check                   # 只做环境自检
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$RepoRoot = $PSScriptRoot
$Branch   = 'main'

function Info($m) { Write-Host "  $m" }
function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  [注意] $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "  [失败] $m" -ForegroundColor Red; exit 1 }

function Find-Git {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
      "$env:ProgramFiles\Git\cmd\git.exe",
      "${env:ProgramFiles(x86)}\Git\cmd\git.exe",
      "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe")) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

Write-Host ''
Write-Host '  轻伴 LightMate · 部署助手' -ForegroundColor Cyan
Write-Host '  --------------------------------------------'

# ---------- 1. 环境自检 ----------
$git = Find-Git
if (-not $git) { Die ' 没有找到 Git，请先安装：winget install --id Git.Git -e' }
Ok "Git: $git"
if (-not (Test-Path (Join-Path $RepoRoot '.git'))) { Die "$RepoRoot 不是 Git 仓库" }
Ok "仓库: $RepoRoot"

& $git -C $RepoRoot rev-parse --verify --quiet HEAD *> $null
if ($LASTEXITCODE -ne 0) { Die ' 还没有任何提交，请先 git add / git commit' }
$head = (& $git -C $RepoRoot log -1 --pretty=format:'%h %s')
Ok "最新提交: $head"

$dirty = (& $git -C $RepoRoot status --porcelain)
if ($dirty) { Warn ' 工作区有未提交的改动（推送的仍是已提交内容）' } else { Ok '工作区干净' }

$gh = (Get-Command gh -ErrorAction SilentlyContinue)
if ($gh) { Ok "GitHub CLI: $($gh.Source)" } else { Info '未安装 GitHub CLI（可选）：winget install --id GitHub.cli -e' }

if ($Check) {
  Write-Host ''
  Info '自检结束（-Check 模式，未做任何改动）'
  Write-Host ''
  exit 0
}

# ---------- 2. 决定远程地址 ----------
if (-not $Remote -and $GhRepo) {
  if (-not $gh) { Die ' 指定了 -GhRepo 但未安装 gh CLI，请改用 -Remote <仓库地址>' }
  & gh auth status *> $null
  if ($LASTEXITCODE -ne 0) { Die ' gh 尚未登录，请先执行：gh auth login' }

  $vis = if ($Public) { '--public' } else { '--private' }
  Info "使用 gh 创建仓库 $GhRepo ($vis) 并推送…"
  & gh repo create $GhRepo $vis --source $RepoRoot --remote origin --push
  if ($LASTEXITCODE -ne 0) { Die ' gh repo create 失败' }
  $Remote = (& $git -C $RepoRoot remote get-url origin).Trim()
  Ok "已创建并推送: $Remote"
}

if (-not $Remote) {
  Write-Host ''
  Info '还没有指定远程仓库。两种做法：'
  Write-Host ''
  Write-Host '    A. 先去 https://github.com/new 建一个空仓库（不要勾选任何初始化文件），然后：' -ForegroundColor White
  Write-Host '       .\deploy.ps1 -Remote "https://github.com/<用户名>/<仓库名>.git"' -ForegroundColor Gray
  Write-Host ''
  Write-Host '    B. 装了 gh 并已 gh auth login，直接：' -ForegroundColor White
  Write-Host '       .\deploy.ps1 -GhRepo lightmate -Public -Remote "https://github.com/<用户名>/lightmate.git"' -ForegroundColor Gray
  Write-Host ''
  exit 0
}

# ---------- 3. 配置 remote ----------
$existing = (& $git -C $RepoRoot remote) 2>$null
if ($existing -contains 'origin') {
  $old = (& $git -C $RepoRoot remote get-url origin).Trim()
  if ($old -ne $Remote) {
    & $git -C $RepoRoot remote set-url origin $Remote
    Ok "origin 已更新: $old  ->  $Remote"
  } else {
    Ok "origin 已存在: $Remote"
  }
} else {
  & $git -C $RepoRoot remote add origin $Remote
  Ok "已添加 origin: $Remote"
}

# ---------- 4. 推送 ----------
if ($SkipPush) {
  Info '（-SkipPush）已跳过推送'
  Write-Host ''
  exit 0
}

Info "推送到 origin/$Branch …"
& $git -C $RepoRoot push -u origin $Branch
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Die ' 推送失败。常见原因：仓库不存在 / 无权限 / 未登录（首次推送会弹浏览器登录）'
}
Ok "推送完成"

# ---------- 5. 尝试开启 GitHub Pages ----------
if ($gh -and $Remote -match 'github\.com[:/]([^/]+)/([^/]+?)(\.git)?$') {
  $owner = $Matches[1]; $name = $Matches[2]
  try {
    & gh api -X POST "repos/$owner/$name/pages" -f build_type=workflow *> $null
    if ($LASTEXITCODE -eq 0) {
      Ok "已开启 GitHub Pages（Source = GitHub Actions）"
    } else {
      Warn "自动开启 Pages 失败，请手动到 Settings → Pages 把 Source 改为 GitHub Actions"
    }
  } catch {
    Warn "自动开启 Pages 失败，请手动到 Settings → Pages 把 Source 改为 GitHub Actions"
  }
  Write-Host ''
  Write-Host "  站点地址（Actions 跑完后可访问）:" -ForegroundColor White
  Write-Host "    https://$owner.github.io/$name/" -ForegroundColor Cyan
} else {
  Write-Host ''
  Warn '若托管在 GitHub：请到 Settings → Pages 把 Source 改为 GitHub Actions'
}

Write-Host ''
Ok '全部完成'
Write-Host ''
