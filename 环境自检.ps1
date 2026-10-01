<#
  学军黑客松 · 赛场环境自检脚本
  ------------------------------------------------------------
  用途：三个队员各自在自己电脑上跑一遍，确认环境和主力机一致。
  用法（在本文件所在目录打开终端）：
      powershell -ExecutionPolicy Bypass -File .\环境自检.ps1
  本脚本只读检测，不会修改你的系统。
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$script:pass = 0
$script:fail = 0
$script:warn = 0

function Check($name, $cond, $detail) {
    if ($cond) { $script:pass++; Write-Host ("  [通过] {0,-24} {1}" -f $name, $detail) -ForegroundColor Green }
    else       { $script:fail++; Write-Host ("  [失败] {0,-24} {1}" -f $name, $detail) -ForegroundColor Red }
}
function Warn($name, $detail) {
    $script:warn++; Write-Host ("  [注意] {0,-24} {1}" -f $name, $detail) -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===== 1. 运行时版本（三人必须一致）=====" -ForegroundColor Cyan

$node = (Get-Command node -ErrorAction SilentlyContinue)
Check "Node.js" ($null -ne $node) $(if ($node) { (& node -v) } else { "未安装 -> https://nodejs.org 装 LTS 版" })

$npm = (Get-Command npm -ErrorAction SilentlyContinue)
Check "npm" ($null -ne $npm) $(if ($npm) { (& npm -v) } else { "未安装" })

$py = (Get-Command python -ErrorAction SilentlyContinue)
Check "Python" ($null -ne $py) $(if ($py) { (& python --version 2>&1) } else { "未安装（只做前端可不装）" })

$git = (Get-Command git -ErrorAction SilentlyContinue)
Check "Git" ($null -ne $git) $(if ($git) { (& git --version) } else { "未安装 -> https://git-scm.com" })

Write-Host ""
Write-Host "===== 2. Git 身份与凭据 =====" -ForegroundColor Cyan
$uname = (& git config --global user.name 2>$null)
$umail = (& git config --global user.email 2>$null)
Check "git user.name"  ([bool]$uname) "$uname"
Check "git user.email" ([bool]$umail) "$umail"
$sshpub = Join-Path $env:USERPROFILE ".ssh\id_ed25519.pub"
Check "SSH 公钥存在" (Test-Path $sshpub) $(if (Test-Path $sshpub) { "已就绪" } else { "没有 -> ssh-keygen -t ed25519 生成后贴到 Gitee" })

Write-Host ""
Write-Host "===== 3. npm 源（赛场关键项）=====" -ForegroundColor Cyan
$reg = (& npm config get registry 2>$null)
Check "npm registry" ($reg -match 'tencent|huaweicloud') "$reg"
if ($reg -notmatch 'tencent|huaweicloud') {
    Warn "换源" "仓库根目录执行： npm config set registry https://mirrors.cloud.tencent.com/npm/"
}

Write-Host ""
Write-Host "===== 4. 网络可达性（10 秒超时）=====" -ForegroundColor Cyan
$targets = @(
    @{ n = "Gitee (代码托管)";      u = "https://gitee.com";                             want = "200" },
    @{ n = "腾讯云 npm 源";         u = "https://mirrors.cloud.tencent.com/npm/react";   want = "200" },
    @{ n = "清华 PyPI 源";          u = "https://pypi.tuna.tsinghua.edu.cn/simple/";     want = "200" },
    @{ n = "DeepSeek API";          u = "https://api.deepseek.com";                      want = "any" }
)
foreach ($t in $targets) {
    $code = (curl.exe -s -o NUL --max-time 10 -w "%{http_code}" $t.u 2>$null)
    $ok = if ($t.want -eq "200") { $code -eq "200" } else { $code -and $code -ne "000" }
    Check $t.n $ok "HTTP $code"
}
$gh = (curl.exe -s -o NUL --max-time 6 -w "%{http_code}" "https://github.com" 2>$null)
if ($gh -eq "200") { Write-Host "  [信息] GitHub 直连可达（本机有代理）" -ForegroundColor Gray }
else { Write-Host "  [信息] GitHub 直连不可达（正常，赛场一律用 Gitee）" -ForegroundColor Gray }

Write-Host ""
Write-Host "===== 5. Windows 开发环境项 =====" -ForegroundColor Cyan

$lp = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
Check "长路径支持(注册表)" ($lp -eq 1) $(if ($lp -eq 1) { "已启用" } else { "未启用 -> 深目录 node_modules 可能报错" })

$glp = (& git config --global core.longpaths 2>$null)
Check "git core.longpaths" ("$glp" -eq "true") $(if ("$glp" -eq "true") { "已设置" } else { "未设置 -> git config --global core.longpaths true" })

$dev = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense
if ($dev -eq 1) { Check "开发者模式" $true "已开启" }
else { Warn "开发者模式" "未开启（用 pnpm 符号链接会失败；用 npm 不受影响）" }

$rt = (Get-MpComputerStatus -ErrorAction SilentlyContinue).RealTimeProtectionEnabled
if ($rt -eq $true) {
    Warn "Defender 实时保护" "开启中，npm install / 构建会变慢；建议加排除（见体检报告 P0）"
} elseif ($null -eq $rt) {
    Warn "Defender 状态" "读取失败（可能未安装 Defender 或权限不足）"
} else {
    Check "Defender 实时保护" $true "已关闭"
}

$ports = 3000,3001,4000,5000,5173,5174,7860,8000,8080,8081,8888,11434
$hit = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }
if ($hit) {
    foreach ($h in $hit) {
        $pn = (Get-Process -Id $h.OwningProcess -ErrorAction SilentlyContinue).ProcessName
        Warn "端口 $($h.LocalPort) 被占用" "PID $($h.OwningProcess) ($pn)"
    }
} else {
    Check "常用开发端口" $true "全部空闲"
}

Write-Host ""
Write-Host "===== 6. 代理 / VPN 状态 =====" -ForegroundColor Cyan
$ie = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction SilentlyContinue
$pEn = $ie.ProxyEnable
$pSv = $ie.ProxyServer
if ($pEn -eq 1) { Write-Host ("  [信息] 系统代理已启用 -> {0}（注意：git / npm 不读系统代理）" -f $pSv) -ForegroundColor Gray }
else { Write-Host ("  [信息] 系统代理未启用（残留配置 {0}）；需要时用 HTTPS_PROXY 环境变量" -f $pSv) -ForegroundColor Gray }
$envP = Get-ChildItem env: | Where-Object { $_.Name -match '(?i)^(http|https|all)_proxy$' }
if ($envP) { foreach ($e in $envP) { Write-Host ("  [信息] 环境变量 {0}={1}" -f $e.Name, $e.Value) -ForegroundColor Gray } }
else { Write-Host "  [信息] 无代理环境变量（npm/pip/git 全部直连）" -ForegroundColor Gray }
$p7890 = Get-NetTCPConnection -State Listen -LocalPort 7890 -ErrorAction SilentlyContinue
if ($p7890) { Write-Host "  [信息] 检测到本地代理端口 7890 正在监听（Clash 类工具）" -ForegroundColor Gray }

Write-Host ""
Write-Host "===== 7. 磁盘空间 =====" -ForegroundColor Cyan
foreach ($d in (Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Free -ne $null })) {
    $freeGB = [math]::Round($d.Free / 1GB, 1)
    if ($d.Name -in @('C', 'D')) { Check "$($d.Name): 可用空间" ($freeGB -gt 5) "$freeGB GB" }
}

Write-Host ""
Write-Host "===== 8. 已知在赛场不可用的东西（避免踩坑）=====" -ForegroundColor Cyan
Write-Host "  · GitHub 直连极慢/不通 -> 一律用 Gitee"
Write-Host "  · api.openai.com / huggingface.co 直连不通 -> 用国内大模型 API"
Write-Host "  · Docker / gcc / g++ / Go 通常没有，Java 与 .NET 多半不可用 -> 别选需要它们的技术栈"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ("  通过 {0} 项 | 失败 {1} 项 | 注意 {2} 项" -f $script:pass, $script:fail, $script:warn)
if ($script:fail -gt 0) {
    Write-Host "  有失败项：先解决上面标红的，再开始写代码。" -ForegroundColor Red
} else {
    Write-Host "  环境就绪，可以开工。" -ForegroundColor Green
}
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
