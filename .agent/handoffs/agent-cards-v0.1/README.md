# EchoPath 两人协作交接包

日期：2026-10-02。

本包落实用户已确认的技术计划。本次交付仅包含计划、任务拆分、接口约定和可转发提示词，不表示新功能已经实现或通过验收。

## 阅读顺序

1. [完整技术计划](01-implementation-plan.md)：两套系统的目标、流程、边界与验收。
2. [两人任务与接口约定](02-two-person-work-packages.md)：谁做什么、交付顺序、共同字段与联调规则。
3. [给另一位协作者的完整提示词](03-person-card-agent-prompt.md)：可整篇复制给对方或其 AI。

## 现在怎样分工

- **工作线 A：用户这一方**，负责在线访谈、匹配、必要的前端功能适配及集成协调。
- **工作线 B：另一位协作者**，负责离线人物卡生产、来源与时间验证、检索视图导出。
- A/B 是本轮工作线名称，不替换 AGENTS.md 中原有四人角色或文件负责人。共享类型、前端、后端等跨区改动仍由原负责人协调；此文档本身不代表跨区批准。
- UI 视觉设计不纳入本轮，独立 UI 工作目录不纳入交付。

## 基线与获取

- 仓库：<https://github.com/wenyu2026/xuejun-hackathon>
- 功能基线：`wenyu2026/landscape-demo`，本轮已检查提交 `727a997d5553260292f413468e02bef9c110f423`。
- 文档分支：`fu6868/agent-card-handoff`。
- 在 PR 合并前，另一人可以直接从文档分支创建自己的实现分支；不要以为这些文件已在 master 或演示分支中。

```bash
git clone https://github.com/wenyu2026/xuejun-hackathon.git
cd xuejun-hackathon
git fetch origin
git switch -c YOUR_ACCOUNT/trajectory-cards-v01 origin/fu6868/agent-card-handoff
```

将 `YOUR_ACCOUNT` 替换为自己的账号。已经有仓库且存在未提交内容时，使用独立 worktree，不覆盖当前分支。

仓库阅读入口为 `.agent/handoffs/agent-cards-v0.1/README.md`。

## 本轮明确未交付的内容

尚未实现 UserState / PersonCard / RetrievalView 类型与程序，尚未生成六张新版卡或运行新的主流程测试。文档里的目标、命令和未来目录必须按“现有”与“待实现”区分。

本地 S1 原始研究目录没有随本包上传，不能假设另一人能读取它。B 先使用仓库已跟踪的正式案例、来源与审核材料开展工作；S1 对照待 A 单独整理可分享的来源材料后再做，不阻塞首张正式案例样卡。

本包不包含 `.env`、密钥、`LOCAL_AI.md`、原始研究稿或未授权的整本资料。人工审核仍由人完成，PR 仍由人合并。
