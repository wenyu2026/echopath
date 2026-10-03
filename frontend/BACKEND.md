# EchoPath 前端 × 后端接入说明（V4，2026-10-03）

> 本 Demo 已直接对接 `echopath` 的真实后端，页面渲染与数据层完全解耦。
> 后端离线时自动降级为「模拟模式」（仅聊天随口应答 + 静态示例页），所有页面仍可浏览。

## 怎么跑起来

```bash
# 1. 起后端（在 echopath 目录，默认端口 3100）
cd echopath
npm run server        # 需要 .env 里配好 TOKENDANCE_API_KEY，否则访谈不可用

# 2. 起前端预览（在本目录）
cd EchoPath_迁移包_2026-10-03/03_UI_Demo
npm run dev           # 默认 7100，自动把 /api/* 代理到 localhost:3000
                      # 后端不在 3000 时：ECHOPATH_API=http://localhost:3100 npm run dev
```

也可以直接双击 `index.html` 打开（file:// 模式）：前端会自动尝试连 `http://localhost:3000/api`，连不上就进模拟模式。

## 前端连接逻辑（app.js 第一节）

启动时依次探测三个地址，第一个通的就是生效地址：

1. 用户在「后端连接设置」里保存的地址（localStorage `echopath.backend`）
2. 同源 `/api`（经 `server.mjs` 预览代理时）
3. `http://localhost:3000/api`

`/api/health` 返回的 `key_configured` 决定访谈是否可用：未配 Key 时聊天区会明确引导，并提供「用示例处境直接看决策地形」（root_factors 已内置，整条链路不需要 LLM）。

## 六页与后端接口对照

| 页面 | 后端接口 | 说明 |
|---|---|---|
| 01 首页 | — | 纯展示 |
| 02 来时路 | `POST /api/interview/start` · `/answer` · `/finish` · **`/hints`** | 无状态访谈：`InterviewState` 由前端持有、每次请求带回；右侧「AI 听懂的你」便签渲染 8 个采集字段 + 置信度，点击可改（改完置信度拉满，随下一轮带回后端）；每条用户消息可「改这句」（回滚到该条之前的 state 快照重走）；「够了，直接看结论」随时喊停。**`/answer` 出参新增 `mode` 与 `hints`**：`mode` ∈ normal / probe_event（追问具体的事）/ probe_impact（追问事件的影响）/ rescue（答"不知道"后降难度救援）。**`/hints` 是「帮我回忆」的独立端点**：入参 {state, asked_field, previous_hints[]}，出参 {hints:[{entry, followup}]}——动态生成 2-3 个回忆入口 + 每个入口一个更具体的小问题；不回传 state、不算一轮回答；传 previous_hints 会换切入角度。前端纪律：chips 点击只展开小问题/填入输入框，**绝不自动提交**；「都不是 / 暂时跳过」以"跳过"作为用户回答发送（后端识别 skip_request 后保留为未知、不再追问） |
| 03 理解困境 | `/api/interview/finish` | 展示总结；`no_dilemma=true` 时不给「去找人」按钮（产品主张：不暗示用户该重新考虑）；「有一点不对 → 修改」把更正作为新回答走 answer 链路 |
| 04 决策地形 | `GET /api/sources` · `POST /api/landscape` | **地图是主角**：数据源切换；处境说明压缩为「机制解读 + 根因素标签 + 可展开的约束/在意/修改」；知识网络全宽展示（节点 = 你/走法/真实人物），悬停看简短预览（延迟消失，可移上去）、点击节点或连线**固定选中**、右侧覆盖详情层（不引发地图缩放跳动）、点空白/× 退出、Tab+Enter 键盘可达、细线有加粗隐形点击层、小屏详情变底部面板且地图横向可滚 +「恢复全图」；`caveat` 与 `single_path_only` 如实展示 |
| 05 真实案例 | `POST /api/case` | 案例列表（档案风格）+ 编辑式深阅读；「时间边界」两栏严格分开当时知道 vs 后来发生；证据五层分层展示（AI 推断 ⚠ 显著标注）；反类比按 kind 加徽章（era=AI 类比用木橙）；来源含出版方/定位/局限 |
| 06 回到自己 | （读 landscape + 访谈结果） | **四步行动记录**：① 回看（真实总结，无上下文时给入口不编造）② 取舍（保住什么 ← protects / 代价 ← costs，可补充自定义）③ 未知（单选）④ 行动记录卡（想验证/准备做/预计投入/观察信号/何时回看，五行全部可编辑）；保存到 localStorage 并展示已保存列表，刷新可恢复；明说是"可撤回的验证"，不替用户作决定 |

## 降级与兜底

- 后端离线 → 模拟模式：便签显示「模拟数据」，P4/P5 提示需要后端，P5 保留陶渊明静态示例。
- 后端在线但未配 Key → 访谈关闭，决策地形/案例可用（示例处境内置根因素，无需 LLM）。
- 请求失败 → 状态条显示「重试」，已有聊天与处境不丢。
- 会话状态存 sessionStorage，刷新页面可续上。

## 旧约定作废

迁移包 V3 的 `/chat`、`/corrections`、`/sessions/{id}` 三个假想接入口、浏览器直连大模型（LLMBackend）、`mockAnalyze` 节点推断均已移除——访谈的状态机与字段抽取由后端 `interview` 模块承担，比前端猜节点可靠得多。

## 访谈引导规则在哪改

**`server/interview/guidelines.ts`** —— 追问/救援/跳过/主线的全部经验集中在这一个文件（含"怎么加新经验"的说明），引擎 `interview.ts` 只消费它。复跑引导性验收：`node scripts/test-interview-guidance.mjs http://localhost:3100`（四个虚构场景：迷茫感受 → 必须追问具体的事；"不知道" → 降难度给入口；一次大量信息；纠正前文）。
