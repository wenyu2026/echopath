/**
 * 一键启动 Demo（T5 集成）
 * ============================================
 * 用法：npm start
 *
 * 同时拉起两个进程：
 *   · 后端 API（server/api.ts，:3000）—— 负责解析处境 + 检索
 *   · 前端 Vite（:5173）—— 六页面界面
 *
 * 为什么需要这个脚本：方案验收清单第一条是「一条命令启动全部」。
 * 演示当天不能出现「等一下我先起个后端」。
 *
 * 容错：后端没起来也不影响演示 —— 前端会自动降级到离线缓存快照
 * （src/data/demoCache.ts），页面照常能走完全流程。
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const children = [];

function run(label, cmd, args, color) {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  children.push(child);

  const tag = `\x1b[${color}m[${label}]\x1b[0m`;
  const pipe = (stream) => {
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) if (line.trim()) console.log(`${tag} ${line}`);
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) console.log(`${tag} 进程退出，code=${code}`);
  });
  return child;
}

console.log('');
console.log('  来路 EchoPath · Demo 启动中');
console.log('  ────────────────────────────────────────');

// 环境检查
const hasEnv = existsSync(join(root, '.env'));
if (!hasEnv) {
  console.log('  ⚠️  没有 .env —— 后端解析/检索会失败，前端将自动降级到离线缓存');
  console.log('     修复：copy .env.example .env 并填入 TOKENDANCE_API_KEY');
}

let keyConfigured = false;
if (hasEnv) {
  const env = readFileSync(join(root, '.env'), 'utf8');
  keyConfigured = /TOKENDANCE_API_KEY=\s*sk-\S+/.test(env);
  if (!keyConfigured) {
    console.log('  ⚠️  .env 里没有有效的 TOKENDANCE_API_KEY —— 前端将走离线缓存');
  }
}

// 后端：有 key 才起（没 key 起了也没用）
if (keyConfigured || hasEnv) {
  run('后端', 'node', ['--env-file=.env', 'server/api.ts'], '36');
} else {
  console.log('  ⏭️  跳过后端（无 .env）');
}

run('前端', 'npx', ['vite', '--host'], '35');

console.log('  ────────────────────────────────────────');
console.log('  前端  http://localhost:5173');
console.log('  后端  http://localhost:3000/api/health');
console.log('');
console.log('  演示时若网络异常，页面会自动切到「离线演示模式」');
console.log('  （使用已打包的快照数据），流程照样走得完。');
console.log('');
console.log('  按 Ctrl+C 停止全部');
console.log('');

const shutdown = () => {
  console.log('\n  正在停止…');
  for (const c of children) c.kill();
  setTimeout(() => process.exit(0), 500);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
