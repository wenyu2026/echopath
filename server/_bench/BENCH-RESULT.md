# 技术栈对比结论（2026-10-02 02:20-02:35 实测）

**结论：Node/TS（Node 24 原生类型剥离，零第三方依赖）。**

## 实测数据（同一输入、同一配置：glm-5 + reasoning_effort:none + json_schema strict）

| 原型 | run1 | run2 | run3 | 说明 |
|---|---|---|---|---|
| `proto-node.mjs`（Node 24，零依赖） | 3544ms | 4323ms | 3067ms | |
| `proto-py.py`（Python 3.14，纯标准库） | 3808ms | 2726ms | 3952ms | |

延迟由网关主导，两种语言无实质差异（均在噪声范围内）。

## 决定性因素（开发摩擦）

| 考量 | Node/TS | Python FastAPI |
|---|---|---|
| 复用 `src/types/episode.ts` 类型契约 | ✅ 直接 import（已验证 `TS_IMPORT_OK`） | ❌ 需 pydantic 复制一份，两处维护 |
| 新增依赖 | **0 个**（node:http + 原生 fetch + --env-file） | fastapi + uvicorn + pydantic + venv（C 盘紧张需装 D 盘） |
| 演示启动 | 一条 `node --env-file=.env server/api.ts` | 需先激活 venv |
| 踩坑记录 | strip-only 模式**不支持**：constructor 参数属性、`interface X extends T['field']`（均已规避） | PowerShell 传 JSON 会丢引号（AI接入方案 已警告），Python 原型改用 urllib 解决 |

## 附带实测发现

1. **输出质量有随机性**：3 次解析中 dilemma 偶尔出现「及时止损 vs 沉没成本」这类 A/B 同义的劣质输出 → 已在 parser 里加校验重试兜底；字符串长度类问题可校验，语义类问题暂靠 prompt 示例约束（风险已记录）。
2. **risk 枚举在运行间有 medium/high 波动**：属模型随机性，json_schema 已锁枚举合法性。
3. Node 24 原生 TS 运行实测可用（`node --test` 对 .ts 测试文件同样适用）。
