<#
  学军黑客松 · 建 Issue 前查重

  用途：**创建新任务之前必跑**，防止两个人做同一件事。
  这是防重复的**第一道闸门**。

  用法（在仓库根目录）：
      powershell -ExecutionPolicy Bypass -File .\scripts\dup-check.ps1 -Keyword "登录"

  原理：用 GitHub 搜索同时查 open 与 closed，
        closed 也查是因为「已经做完的事」最容易被重复做一遍。
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Keyword,
    [string]$Repo = "",
    [int]$Show = 15
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $Repo) {
    $Repo = (gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>$null)
    if (-not $Repo) { Write-Host "无法推断仓库，请用 -Repo owner/name" -ForegroundColor Red; exit 1 }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ("  查重：'{0}'" -f $Keyword) -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

$all = & gh issue list --repo $Repo --state all --limit 200 `
    --json number,title,state,labels,body 2>$null | ConvertFrom-Json

if (-not $all) { Write-Host "`n  仓库里还没有 Issue，可以放心建。`n" -ForegroundColor Green; exit 0 }

# 关键词命中：标题或正文包含
$hits = @($all | Where-Object {
    $_.title -like "*$Keyword*" -or $_.body -like "*$Keyword*"
})

if ($hits.Count -eq 0) {
    Write-Host ""
    Write-Host ("  ✅ 没有找到与 '{0}' 相关的 Issue —— 可以建新任务。" -f $Keyword) -ForegroundColor Green
    Write-Host "     建完后记得：打上 member-xxx 标签，或写上「负责人：member-xxx」。" -ForegroundColor DarkGray
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host ("  ⚠️ 找到 {0} 个相关 Issue。**建新任务前请先确认不是重复劳动**：" -f $hits.Count) -ForegroundColor Yellow

foreach ($h in ($hits | Sort-Object number -Descending | Select-Object -First $Show)) {
    $names = @($h.labels | ForEach-Object { $_.name })
    $who = @($names | Where-Object { $_ -like 'member-*' }) | Select-Object -First 1
    if (-not $who) {
        $m = [regex]::Match($h.body, '负责人：\s*(member-[a-d])')
        if ($m.Success) { $who = $m.Groups[1].Value }
    }
    if (-not $who) { $who = '未认领' }

    $color = if ($h.state -eq 'CLOSED') { 'DarkGray' } else { 'Yellow' }
    Write-Host ""
    Write-Host ("   #{0}  [{1}]  {2}  ← {3}" -f $h.number, $h.state, $h.title, $who) -ForegroundColor $color

    $st = @($names | Where-Object { $_ -like 'agent:*' })
    if ($st) { Write-Host ("        标签: {0}" -f ($st -join ', ')) -ForegroundColor DarkGray }
}

Write-Host ""
Write-Host "  ────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  判断规则：" -ForegroundColor White
Write-Host "   · 有 OPEN 的同类任务且已有人认领 → **不要新建**，去那个 Issue 里问能不能一起做" -ForegroundColor White
Write-Host "   · 有 CLOSED 的同类任务 → **先看它做完了什么**，别重复实现（尤其工具函数/接口）" -ForegroundColor White
Write-Host "   · 确实需要新任务 → 建完后在正文写「关联：#<旧编号>」说明区别" -ForegroundColor White
Write-Host ""
