# 技术栈对比原型 —— Python 版（纯标准库，server/_bench/proto-py.py）
# 调用配置照抄 .agent/DecisionEpisode-Schema.md 第 5 节（已实测验证）。
import json
import os
import time
import urllib.request

GATEWAY = "https://tokendance.space/gateway/v1"


def load_env(path=".env"):
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


DEMO_INPUT = """我已经学了这个专业两年，但越来越觉得不适合自己。我对另一个方向很感兴趣，但现在换是不是太晚？
补充信息：已投入两年；新方向只了解两个月；可以接受延毕；家庭期望别太高；最看重兴趣与成长。"""

SYSTEM_PROMPT = """你是「处境结构化解析器」。把用户的处境转成严格 JSON。
字段长度硬约束：stage ≤12字；dilemma 必须 "A vs B" 形式 ≤18字；options 2-5项每项≤12字；
constraints 2-6项每项≤14字；goals 2-5项每项≤10字；risk/reversibility 只能 low/medium/high；
unknowns 2-6项每项≤18字。所有字段值必须精炼，禁止写完整句子。"""

SITUATION_SCHEMA = {
    "type": "object",
    "properties": {
        "stage": {"type": "string"},
        "dilemma": {"type": "string", "description": "必须 A vs B 形式，不超过18字"},
        "options": {"type": "array", "items": {"type": "string"}},
        "constraints": {"type": "array", "items": {"type": "string"}},
        "goals": {"type": "array", "items": {"type": "string"}},
        "risk": {"type": "string", "enum": ["low", "medium", "high"]},
        "reversibility": {"type": "string", "enum": ["low", "medium", "high"]},
        "unknowns": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["stage", "dilemma", "options", "constraints", "goals", "risk", "reversibility", "unknowns"],
    "additionalProperties": False,
}


def parse_situation():
    t0 = time.time()
    payload = {
        "model": "glm-5",
        "reasoning_effort": "none",
        "max_tokens": 800,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "situation", "strict": True, "schema": SITUATION_SCHEMA},
        },
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": DEMO_INPUT},
        ],
    }
    req = urllib.request.Request(
        f"{GATEWAY}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {os.environ['TOKENDANCE_API_KEY']}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    elapsed = int((time.time() - t0) * 1000)
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return elapsed, content, data.get("usage", {}).get("total_tokens")


if __name__ == "__main__":
    load_env(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    if not os.environ.get("TOKENDANCE_API_KEY"):
        print("NO KEY")
        raise SystemExit(1)
    for i in range(1, 4):
        try:
            elapsed, content, total = parse_situation()
            print(f"--- run {i}: {elapsed}ms, total_tokens={total} ---")
            print(content)
        except Exception as e:  # noqa: BLE001
            print(f"run {i} FAILED: {e}")
