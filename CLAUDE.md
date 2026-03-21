# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

一款 AI 驱动的海龟汤推理游戏 Web App。玩家与 AI 主持人对话，通过提问推理还原故事真相。

**核心文档（开始任何任务前必须先读）：**
- `docs/PRD.md` — 产品需求（最终确认版）
- `docs/TDD.md` — 技术设计（架构、数据库、API、安全规范）
- `docs/TESTING.md` — 测试规范（测试用例 + CI 配置）

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + Zustand | 移动端优先 |
| 后端 | Node.js 20 + Express + Prisma ORM | REST API + SSE |
| 数据库 | PostgreSQL 16 | Railway 托管 |
| AI | OpenAI 兼容接口（当前：七牛云 DeepSeek） | env 变量配置 |
| 邮件 | Resend API（测试模式，待域名验证） | 注册/找回密码 OTP |
| 测试 | Jest + Supertest / Vitest + RTL / Playwright | 见 docs/TESTING.md |
| 部署 | Railway | 前端 + 后端 + 数据库一站式 |

---

## 仓库结构

```
.
├── CLAUDE.md
├── docs/                  ← 产品/技术/测试文档
│   ├── PRD.md
│   ├── TDD.md
│   ├── TESTING.md
│   └── feature_dev_list.md
├── backend/               ← Node.js + Express 后端
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── __tests__/
├── frontend/              ← React + TypeScript 前端
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   └── api/
├── issues/
│   └── issue_tracking.md  ← Bug 追踪
├── tests/                 ← 每个 bug fix 对应一个测试
├── validation/            ← 浏览器验证截图（gitignored）
└── legacy/                ← 旧静态 demo（归档，勿删）
```

---

## 环境变量（backend/.env）

```bash
DATABASE_URL=postgresql://user:pass@host:5432/haiguitang
JWT_SECRET=your-random-64-char-string
OPENAI_BASE_URL=https://your-ai-provider/v1
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=deepseek-v3-0324
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM=noreply@yourdomain.com   # 域名验证后启用
NODE_ENV=production
PORT=4000
```

**严禁将任何 `.env` 文件提交到 Git。**

---

## 安全红线

**以下规则任何情况下不得违反，每次写代码后必须自查：**

- `puzzles` 表的 `answer`、`facts`、`hint_1`、`hint_2`、`hint_3` 字段**永远不出现在任何给前端的 API 响应中**
- `OPENAI_API_KEY` 等所有密钥**永远不出现在 frontend/ 目录下的任何文件中**
- 用户提交的 `question` 字段在进入 AI 调用前**必须经过 `inputGuard` 中间件**（3000 字上限 + 注入过滤）
- 游客 token 以 `g_` 开头，后端通过前缀区分游客和注册用户

---

## 开发规范

- TypeScript 严格模式（`"strict": true`），禁止 `any`
- 所有函数必须有明确返回类型
- 异步函数统一 `async/await`，禁止 `.then()` 链式
- 所有错误通过 `AppError` 类抛出，见 `docs/TDD.md` 第 12 章
- 每个函数不超过 100 行，一行不超过 120 字符

---

## 常用命令

```bash
# 开发
cd backend && npm run dev        # 后端 http://localhost:4000
cd frontend && npm run dev       # 前端 http://localhost:3000

# 数据库
cd backend && npm run db:migrate # 执行 Prisma migration
cd backend && npm run db:studio  # Prisma Studio 可视化
cd backend && npm run db:seed    # 填充题目数据

# 测试
cd backend && npm test
cd frontend && npm test

# 构建
cd backend && npm run build
cd frontend && npm run build
```

---

## Project Tracking

- **Bugs**: `issues/issue_tracking.md` — 新 bug 追加到首行；修复后标记状态
- **Features**: `docs/feature_dev_list.md` — 新 feature 追加到首行，完成/暂停/取消及时更新
- **Tests**: `tests/` — 每个 bug fix 对应一个测试用例，加入 CI
- **Screenshots**: `validation/MMDDHHММ/` — 每轮验证新建文件夹

---

## 当前部署状态

- 前端：`https://frontend-production-c064.up.railway.app`
- 后端：`https://backend-production-03c0e.up.railway.app`
- OTP 注册验证：已绕过（待 Resend 域名 `ai-smilion.site` 审核通过后恢复）
- 忘记密码：暂时禁用（同上）

---

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/design-consultation`
- `/review`
- `/ship`
- `/browse`
- `/qa`
- `/qa-only`
- `/qa-design-review`
- `/setup-browser-cookies`
- `/retro`
- `/document-release`

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.
