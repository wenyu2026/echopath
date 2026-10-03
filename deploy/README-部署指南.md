# 云端部署指南（让链接随时可用）

> 本地跑法需要开两个窗口、还要保持电脑开着。
> 云端部署后，**链接 7×24 可用，关掉电脑也不影响**。

---

## 一、部署前必读：关于 API Key

**这是唯一需要你谨慎的事。**

云端部署时 Key 必须放在**平台的环境变量**里（不是 `.env` 文件，更不能提交进仓库）。

**风险**：任何拿到链接的人都能消耗你的 Key 额度。

**建议**：
1. **单独申请一张小额 Key** 专门给公网用（[tokendance.space/keys](https://tokendance.space/keys)）
2. 别用你主力那张
3. 觉得被刷了，去平台后台改环境变量即可，**不用改代码**

---

## 二、方案对比（选一个）

| 平台 | 免费额度 | 适合 | 备注 |
|---|---|---|---|
| **Render** | 免费实例（会休眠） | 首选，配置最简单 | 15 分钟无访问会休眠，下次访问冷启动约 30-60 秒 |
| **Railway** | 每月 $5 额度 | 不休眠 | 额度用完需付费 |
| **Zeabur** | 有免费档 | 国内访问较快 | 中文界面 |
| **Fly.io** | 有免费额度 | 不休眠 | 需要装命令行工具 |
| **自己的云服务器** | ¥30-60/月 | 完全可控 | 需要自己装 Node、配 nginx |

> ⚠️ **Vercel / Netlify 跑不了这个项目**——它们只托管静态文件，而这个项目的后端是长驻 Node 进程。

---

## 三、Render 部署（最省事，推荐）

### 第 1 步：注册

打开 https://dashboard.render.com/ → 用 GitHub 账号登录（免费，不用信用卡）。

### 第 2 步：一键部署

1. 点 **New** → **Blueprint**
2. 选仓库 `wenyu2026/echopath`
3. Render 会自动读到仓库根目录的 `render.yaml`（我已经写好了）
4. 点 **Apply**

### 第 3 步：填 Key

部署时会弹出环境变量表单，填：

```
TOKENDANCE_API_KEY = sk-你的Key
```

> `render.yaml` 里这一项写的是 `sync: false`，意思是**「由你在面板里填，不会进仓库」**。

### 第 4 步：拿到链接

部署完成后，Render 给你一个地址，形如：

```
https://echopath-xxxx.onrender.com
```

**这个链接就是永久地址**，随时能打开。

---

## 四、部署后自检

打开这两个地址确认：

```
https://你的地址/api/health
```

应该返回：

```json
{ "ok": true, "key_configured": true }
```

- `"ok": true` → 服务正常
- `"key_configured": true` → Key 配对了
- 如果是 `false` → 回平台后台检查环境变量

---

## 五、技术说明（给需要的人）

### 为什么要加 `deploy/server.ts`

本地是**两个进程两个端口**（前端 7200 + 后端 3100）。

PaaS 通常**只给一个端口、只允许一个 Web 进程**，所以 `deploy/server.ts` 把两件事合到一个进程：

| 请求 | 处理方式 |
|---|---|
| `/api/*` | 交给 `server/api.ts`（复用同一份代码，**零逻辑复制**） |
| 其他 | 从 `frontend/` 读静态文件 |

为此给 `server/api.ts` **加了一个 `export default`**（只加导出，本地跑法完全不变）。

### 关键适配点

| 项 | 本地 | 云端 |
|---|---|---|
| 端口 | 写死 3100 / 7200 | 读环境变量 `PORT`（平台注入） |
| 监听地址 | `127.0.0.1` | **`0.0.0.0`**（否则平台健康检查连不上） |
| Key | `.env` 文件 | **平台环境变量** |
| 进程数 | 2 个 | **1 个** |

### 依赖情况

- ✅ **零运行时依赖**，部署时不需要 `npm install`
- 需要 **Node.js 24+**（`render.yaml` 里已指定）

### 本地模拟云端（自测用）

```bash
# 单进程单端口，和云端跑法完全一致
PORT=8899 node --env-file=.env deploy/server.ts
# 然后访问 http://localhost:8899
```

---

## 六、如果不用 Render

### Railway / Zeabur / Fly.io

配置思路完全一样，填这三个值即可：

| 配置项 | 值 |
|---|---|
| Build Command | `echo "无需构建"` （或留空） |
| Start Command | `node deploy/server.ts` |
| 环境变量 | `TOKENDANCE_API_KEY` = 你的 Key |

### 自己的云服务器（Ubuntu）

```bash
# 1. 装 Node 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 拉代码
git clone https://github.com/wenyu2026/echopath.git
cd echopath

# 3. 配 Key
echo "TOKENDANCE_API_KEY=sk-你的Key" > .env

# 4. 常驻运行（用 systemd 或 pm2）
sudo npm i -g pm2
pm2 start "node --env-file=.env deploy/server.ts" --name echopath
pm2 save && pm2 startup
```

端口用 `PORT=80` 或配合 nginx 反代。
