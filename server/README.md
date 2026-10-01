# server/ —— AI/后端（Damn4lee 责任区）

阶段一（#14 检索链路）与阶段二（#15 反类比 + 证据分层，纯模板/判定表版）已实现。

## 运行（零第三方依赖，Node ≥ 24 原生跑 TS）

```bash
node --env-file=.env server/api.ts        # 启动 API（默认 :3000）
node --test "server/tests/*.test.ts"      # 离线单测（16 个，不需要网络和密钥）
node --env-file=.env server/_bench/acceptance.ts   # 验收实证（问题1/3/4/5 的真实输出）
```

## API

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/health` | GET | 存活检查（含 key_configured） |
| `/api/situation` | POST `{raw_input}` | Situation Parser（glm-5 + json_schema strict，实测 2.5-4s） |
| `/api/retrieve` | POST `{situation, narrative?}` | 召回 → 软过滤 → 七维重排 → 多样性 → RetrievalResponse（实测 0.2-0.5s） |
| `/api/consult` | POST `{raw_input}` | 全链路：parse + retrieve（实测 3.4-4.0s，预算 30s） |
| `/api/episodes/:id` | GET | 案例详情 |
| `/api/demo/:n` | GET | 断网兜底缓存（`fixtures/demo-cache-N.json`） |

CORS 已放开（Vite dev 直接调）。

## 目录

```
server/
  api.ts                 # HTTP 服务（零依赖 node:http）
  shared/gateway.ts      # TokenDance 网关客户端（唯一 AI 出口）
  shared/situation-contract.ts  # Situation 运行时校验（长度/枚举，坑 4 双保险）
  parser/situation-parser.ts    # Situation Parser（校验失败带反馈重试 1 次）
  embedding/embed.ts     # qwen3.7-text-embedding + mockEmbedder（离线测试）
  retrieval/dimensions.ts       # 七维打分 + 相似理由生成（纯函数）
  retrieval/diversity.ts        # choice.type 多样性硬约束 + 元数据软过滤
  retrieval/retrieve.ts         # 编排：召回→过滤→重排→多样性
  retrieval/load-episodes.ts    # 只读 data/episodes.json
  evidence/evidence-writer.ts   # 证据分层判定表（#15，纯代码，每条带来源标记）
  counter-analogy/counter-analogy.ts  # 反类比模板生成（#15，structure/era/unknown + 口径守卫）
  fixtures/demo-inputs.json     # Demo 三问
  fixtures/demo-cache-1.json    # 断网兜底缓存（问题 1 已生成）
  fixtures/verify/              # 实际验证记录（输入 + 原始输出）
  _bench/                # 技术栈对比原型与结论
```

## 七维评分规则 v1（待评审 —— 改规则前先在 Issue 给方案）

| 维度 | v1 实现 | 权重 |
|---|---|---|
| `stage_match` | 阶段词表分类（在校/职业早期/职业中期），同类 0.9 相邻 0.6 | 0.15 |
| `path_match` | 用户叙述 vs 案例 prior_path 的 embedding 余弦，重标定到 0-1 | 0.20 |
| `dilemma_match` | 困境类型词表分类（坚持vs转向/稳定vs冒险/探索vs专注）+ 余弦混合 | 0.25 |
| `constraint_match` | 约束类别词表（经济/时间/门槛/家庭/身份/时代）F1 交集；识别不出给中性 0.5 | 0.20 |
| `goal_match` | 目标类别词表（兴趣/成长/稳定/收入/影响力）同上 | 0.15 |
| `reversibility_match` | 枚举距离（low/medium/high → 0/0.5/1） | 0.05 |
| `difference_penalty` | 年代分层（>100 年 0.85 …）+ 用户有而案例缺失的门槛/经济类别 +0.08 | ×0.30 做减法 |

排序分 = Σ权重×维度 − 0.30×difference_penalty。**只用于排序，不向用户展示为百分比。**

已验证的行为（见 `fixtures/verify/consult-demo1-response.json`）：
- 鲁迅案例 constraint_match 0.33（无门槛/经济约束）＜李安 0.57（有家庭/经济约束）
- 鲁迅 difference_penalty 0.93（1906 年 + 缺失类别）→ 排序末位但仍返回（分叉地图需要多路径）
- 三案例 dilemma_match 0.71-0.79（同属「坚持 vs 转向」型）

## 已知边界

- 反类比 v1 为纯模板生成（零 LLM）：每条差异由结构字段对比得出并带依据，幻觉在构造上不可能发生；LLM 表述升级见 `RULES-evidence-counter-analogy.md` 修订记录
- `why_different_detail` 为可选扩展字段（CHANGE_REQUEST 在 #17，获批后并入正式 types）
- `meta` 扩展字段（dropped_by_metadata / forced_diversity / weights）同上
- embedding 无磁盘缓存：每次启动重新索引，3 条案例约 1.2s；数据到 36 条后需要加缓存
- 验收实证存档：`fixtures/verify/acceptance-2026-10-02.txt`（问题 1/3/4/5 的真实输出）
