# AI 海龟汤游戏 — Claude Code 工作手册

## 项目简介

一款 AI 驱动的海龟汤推理游戏 Web App。玩家与 AI 主持人对话，通过提问推理还原故事真相。

**核心文档（开始任何任务前必须先读）：**
- `docs/PRD.md` — 产品需求（最终确认版）
- `docs/TDD.md` — 技术设计（架构、数据库、API、安全规范）
- `docs/TESTING.md` — 测试规范（测试用例 + CI 配置）

---

## 当前仓库状态

> ⚠️ 仓库目前处于迁移过渡期。旧 demo 是纯静态页面（原生 JS，无后端），
> 与新方案技术栈完全不同，不可复用，需要归档后从头搭建。

**当前实际结构：**
```
.
├── CLAUDE.md
├── docs/                  ← 产品/技术文档（已就绪）
│   ├── PRD.md
│   ├── TDD.md
│   ├── TESTING.md
│   └── research_report.md
├── index.html             ← 旧 demo（待归档到 legacy/）
├── src/                   ← 旧 demo（待归档到 legacy/）
│   ├── css/
│   ├── data/
│   │   └── puzzles.json   ← 可参考里面的题目数据格式
│   └── js/
└── tests/                 ← 旧 demo 测试目录（待归档）
```

**目标结构（迁移完成后）：**
```
.
├── CLAUDE.md
├── docs/
├── legacy/                ← 旧 demo 归档在此，不要删除
│   ├── index.html
│   ├── src/
│   └── tests/
├── backend/               ← Node.js + Express 后端
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middlewares/
│   │   └── __tests__/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/              ← React + TypeScript 前端
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── api/
│   ├── package.json
│   └── tsconfig.json
├── e2e/                   ← Playwright 端到端测试
│   ├── *.spec.ts
│   └── playwright.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml         ← 见 docs/TESTING.md 第 7 章
└── .gitignore
```

---

## 第一次启动必做：迁移步骤

**如果 legacy/ 目录还不存在，必须先执行以下步骤，再做其他任何事：**

```bash
# 第一步：归档旧 demo
mkdir legacy
git mv index.html legacy/
git mv src legacy/
git mv tests legacy/
git commit -m "chore: archive legacy static demo"

# 第二步：初始化新项目结构（参考 docs/TDD.md 第 4、5 章）
# 建 backend/ frontend/ e2e/ 骨架，安装依赖，验证能编译通过
```

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + Zustand | 移动端优先 |
| 后端 | Node.js 20 + Express + Prisma ORM | REST API + SSE |
| 数据库 | PostgreSQL 16 | Railway 托管 |
| AI | OpenAI 兼容接口 | env 变量配置，见下方 |
| 邮件 | Resend | 邮箱验证码，免费版每月 3000 封 |
| 测试 | Jest + Supertest / Vitest + RTL / Playwright | 见 docs/TESTING.md |
| 部署 | Railway | 前端 + 后端 + 数据库一站式 |

---

## 环境变量

后端 `.env`（参考 `backend/.env.example`）：

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/haiguitang

# 认证
JWT_SECRET=your-random-64-char-string

# AI 接口（OpenAI 兼容，填入服务商提供的地址和 Key）
OPENAI_BASE_URL=https://your-ai-provider/v1
OPENAI_API_KEY=your-api-key

# 邮件（Resend，免费注册：resend.com）
RESEND_API_KEY=re_xxxxxxxx

# 运行环境
NODE_ENV=development
PORT=4000
```

**严禁将任何 `.env` 文件提交到 Git。`.gitignore` 必须包含 `.env`。**

---

## 安全红线

**以下规则任何情况下不得违反，每次写代码后必须自查：**

- `puzzles` 表的 `answer`、`facts`、`hint_1`、`hint_2`、`hint_3` 字段**永远不出现在任何给前端的 API 响应中**，只有 `gameService.getFullPuzzle()` 内部可以查询这些字段
- `OPENAI_API_KEY` 等所有密钥**永远不出现在 frontend/ 目录下的任何文件中**
- 用户提交的 `question` 字段在进入 AI 调用前**必须经过 `inputGuard` 中间件**（长度限制 3000 字 + 注入关键词过滤）
- 游客 token 以 `g_` 开头，后端通过前缀区分游客和注册用户，两者权限不同

---

## 开发规范

### 代码风格
- TypeScript 严格模式（`"strict": true`），禁止使用 `any`
- 所有函数必须有明确的返回类型声明
- 异步函数统一使用 `async/await`，禁止 `.then()` 链式
- 所有错误通过 `AppError` 类抛出，错误码参考 `docs/TDD.md` 第 12 章

### 测试要求
- **每个新功能必须同时提交对应测试，否则 PR 不予合并**
- 覆盖率不低于 80%（CI 会自动检查）
- 测试中的 AI 调用必须使用 Mock，不消耗真实 API 配额

### 提交信息格式
```
feat: 新功能
fix: 修复 bug
test: 新增或修改测试
refactor: 重构（不改变外部行为）
chore: 构建/依赖/配置变更
docs: 文档变更
```

---

## 常用命令

```bash
# 开发环境
cd backend && npm run dev        # 启动后端 http://localhost:4000
cd frontend && npm run dev       # 启动前端 http://localhost:3000

# 数据库
cd backend && npm run db:migrate # 执行 Prisma migration
cd backend && npm run db:studio  # 打开 Prisma Studio 可视化界面
cd backend && npm run db:seed    # 填充测试题目数据

# 测试
cd backend && npm test           # 后端单元 + 集成测试
cd frontend && npm test          # 前端组件测试
cd e2e && npm test               # 端到端测试（需先启动前后端）
cd backend && npm run test:coverage  # 查看覆盖率报告

# 构建
cd backend && npm run build      # 编译 TypeScript
cd frontend && npm run build     # 构建生产产物
```

---

## 任务执行顺序（首次建设）

按以下顺序逐步完成，每步完成后运行测试确认通过再进入下一步：

```
Step 1  归档旧 demo → 建项目骨架 → 验证编译通过
Step 2  数据库 Schema（docs/TDD.md 第 2 章）
Step 3  用户认证：游客模式 + 邮箱登录（TDD 第 7 章）
Step 4  题库 API：列表 + 筛选（注意不返回 answer）
Step 5  游戏核心：开始/提问/SSE 流式输出（TDD 第 6、8 章）
Step 6  提示系统 + 答案验证 + 揭晓（TDD 第 8 章）
Step 7  兑换码系统（TDD 第 9 章）
Step 8  前端：大厅页面
Step 9  前端：游戏页面（SSE 接收 + 打字机效果）
Step 10 前端：汤底揭晓页 + 分享卡片
Step 11 前端：个人中心 + 兑换码输入
Step 12 CI 配置（docs/TESTING.md 第 7 章）
Step 13 Railway 部署配置
```

---

## 参考资源

- 旧 demo 的题目数据：`legacy/src/data/puzzles.json`（可参考数据格式，内容需重新整理）
- 完整 API 设计：`docs/TDD.md` 第 3 章
- 界面设计规范（色彩/字体/各页面要求）：`docs/PRD.md` 界面设计章节
- GitHub CI 完整配置：`docs/TESTING.md` 第 7 章，复制到 `.github/workflows/ci.yml`
