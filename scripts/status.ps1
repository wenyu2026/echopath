<#
  学军黑客松 · 全队任务视图

  用途：一眼看清「谁在做什么、谁卡住了、哪些还没人领」。
  这是防止重复劳动的**主视图** —— 开工前先看它。

  用法（在仓库根目录）：
      powershell -ExecutionPolicy Bypass -File .\scripts\status.ps1
#>

param(
    [string]$Repo = "",
    [string]$Label = "task"
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 自动推断仓库
if (-not $Repo) {
    $Repo = (gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>$null)
    if (-not $Repo) { Write-Host "无法推断仓库，请用 -Repo owner/name" -ForegroundColor Red; exit 1 }
}

function Get-Issues($state, $extra) {
    $args = @('issue','list','--repo',$Repo,'--state',$state,'--limit','200',
              '--json','number,title,labels,assignees,updatedAt')
    if ($extra) { $args += $extra }
    $json = & gh @args 2>$null
    if (-not $json) { return @() }
    return ($json | ConvertFrom-Json)
}

$members = @('member-a','member-b','member-c','member-d')

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  全队任务视图   $Repo" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

foreach ($state in @('open','closed')) {
    $issues = Get-Issues $state $null
    if (-not $issues -or $issues.Count -eq 0) { continue }

    if ($state -eq 'open') {
        Write-Host ""
        Write-Host "  【进行中 / 待领】" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "  【已完成】" -ForegroundColor DarkGray
    }

    foreach ($i in ($issues | Sort-Object number)) {
        $names = @($i.labels | ForEach-Object { $_.name })

        # 成员：优先取 GitHub assignee（一人一号后这才是权威来源），
        #       其次取 member-x 标签，最后从标题推断
        $who = ''
        if ($i.assignees -and @($i.assignees).Count -gt 0) {
            $who = (@($i.assignees) | ForEach-Object { $_.login }) -join '+'
        }
        if (-not $who) {
            $who = $names | Where-Object { $members -contains $_ } | Select-Object -First 1
        }
        if (-not $who) {
            $m = [regex]::Match($i.title, 'member-[a-d]')
            if ($m.Success) { $who = $m.Value }
        }
        if (-not $who) { $who = '未认领' }

        # 状态（已关闭的一律不显示进行中状态）
        $status = ''
        if ($state -eq 'closed') {
            if ($names -contains 'agent:done') { $status = '✅ 已完成' } else { $status = '—' }
        }
        elseif ($names -contains 'agent:blocked') { $status = '🚧 阻塞' }
        elseif ($names -contains 'agent:review') { $status = '👀 待Review' }
        elseif ($names -contains 'agent:handoff') { $status = '🔄 已交接' }
        elseif ($names -contains 'agent:done') { $status = '✅ 已完成' }
        else { $status = '🟢 进行中' }

        $color = 'Gray'
        if ($state -eq 'open' -and $names -contains 'agent:blocked') { $color = 'Red' }
        elseif ($state -eq 'open' -and $status -eq '🟢 进行中') { $color = 'Green' }

        Write-Host ("   #{0,-4} {1,-14} {2,-12} {3}" -f $i.number, $who, $status, $i.title) -ForegroundColor $color
    }
}

# 汇总
$open = Get-Issues 'open' $null
$blocked = @($open | Where-Object { ($_.labels | ForEach-Object { $_.name }) -contains 'agent:blocked' })
$review  = @($open | Where-Object { ($_.labels | ForEach-Object { $_.name }) -contains 'agent:review' })
$unclaimed = @($open | Where-Object {
    $n = @($_.labels | ForEach-Object { $_.name })
    $hasMember = @($n | Where-Object { $members -contains $_ }).Count -gt 0
    (-not $hasMember) -and ($_.title -notmatch 'member-[a-d]')
})

Write-Host ""
Write-Host "  ────────────────────────────────────────────" -ForegroundColor DarkGray
$active = @($open | Where-Object { -not (($_.labels | ForEach-Object { $_.name }) -contains 'agent:done') })
Write-Host ("   未领任务 {0}   阻塞 {1}   待Review {2}   进行中 {3}" -f `
    $unclaimed.Count, $blocked.Count, $review.Count, $active.Count) -ForegroundColor White

if ($unclaimed.Count -gt 0) {
    Write-Host ""
    Write-Host "   ⚠️ 以下任务还没人认领 —— 想接活先看这里，别自己新开一个：" -ForegroundColor Yellow
    $unclaimed | Sort-Object number | ForEach-Object { Write-Host ("      #{0}  {1}" -f $_.number, $_.title) -ForegroundColor Yellow }
}

if ($blocked.Count -gt 0) {
    Write-Host ""
    Write-Host "   🚧 阻塞中 —— 需要人介入（这是拖垮进度的地方）：" -ForegroundColor Red
    $blocked | Sort-Object number | ForEach-Object { Write-Host ("      #{0}  {1}" -f $_.number, $_.title) -ForegroundColor Red }
}

Write-Host ""
Write-Host "   提醒：接活前先在这里确认没人做；接了就发 CHECKIN 并打上 member 标签。" -ForegroundColor DarkGray
Write-Host ""
