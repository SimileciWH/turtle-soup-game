# 海龟汤 · AI 推理游戏

AI 驱动的海龟汤推理游戏 Web App。玩家通过与 AI 主持人对话，逐步提问还原故事真相。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + Zustand |
| 后端 | Node.js 20 + Express + Prisma ORM |
| 数据库 | PostgreSQL 16 |
| AI | OpenAI 兼容接口（通过 `OPENAI_BASE_URL` 配置，当前使用七牛云 DeepSeek） |
| 邮件 | Resend |
| 部署 | Railway |

---

## 一次性初始化（首次克隆后执行）

### 1. 安装依赖

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../e2e && npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
# 用编辑器打开 backend/.env，填入以下真实值：
#   OPENAI_BASE_URL=你的 AI 服务商地址（如七牛云 https://api.qnaigc.com/v1）
#   OPENAI_API_KEY=你的 API Key
#   OPENAI_MODEL=deepseek-v3-0324（或服务商提供的模型名）
#   RESEND_API_KEY=你的 Resend API Key
#   JWT_SECRET=随机 64 位字符串
```

### 3. 安装并启动数据库（仅首次）

> 需要先安装 Colima（macOS 轻量级容器运行时）

```bash
# 安装 Colima 和 Docker CLI
brew install colima docker

# 启动 Colima
colima start

# 创建 PostgreSQL 容器（只需执行一次）
docker run -d \
  --name haiguitang \
  -e POSTGRES_DB=haiguitang \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=devpass \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:16
```

### 4. 初始化数据库表结构

```bash
cd backend
npm run db:migrate
```

---

## 每次开机启动（日常开发）

```bash
# 1. 启动容器运行时
colima start

# 2. 启动数据库（如果没有自动启动）
docker start haiguitang

# 3. 启动后端（新终端窗口）
cd backend && npm run dev

# 4. 启动前端（新终端窗口）
cd frontend && npm run dev
```

启动后访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:4000/api/health

**生产环境：**
- 前端：https://frontend-production-c064.up.railway.app
- 后端：https://backend-production-03c0e.up.railway.app/api/health

---

## 常用开发命令

### 后端

```bash
cd backend

npm run dev           # 启动开发服务器（热重载）
npm test              # 运行单元测试
npm run test:coverage # 查看测试覆盖率
npm run build         # 编译 TypeScript

npm run db:migrate    # 执行数据库 migration
npm run db:studio     # 打开 Prisma Studio 可视化界面
npm run db:seed       # 填充测试数据
npm run db:generate   # 重新生成 Prisma Client
```

### 前端

```bash
cd frontend

npm run dev     # 启动开发服务器
npm test        # 运行组件测试
npm run build   # 构建生产产物
```

### 端到端测试

```bash
cd e2e
npm test        # 运行 Playwright 测试（需先启动前后端）
```

---

## 停止服务

```bash
# 停止数据库容器
docker stop haiguitang

# 停止 Colima（可选，不影响下次 docker start）
colima stop
```

---

## 项目结构

```
.
├── .env.example        # 环境变量模板（复制为 .env 填入真实值）
├── .env                # 本地环境变量（不提交 Git）
├── backend/            # Node.js + Express 后端
│   ├── prisma/
│   │   ├── schema.prisma   # 数据库表结构
│   │   └── migrations/     # 自动生成的 migration 文件
│   └── src/
│       ├── routes/         # API 路由
│       ├── controllers/    # 请求处理
│       ├── services/       # 业务逻辑
│       ├── middlewares/    # 中间件（auth / inputGuard / rateLimit）
│       └── utils/          # 工具函数
├── frontend/           # React + TypeScript 前端
│   └── src/
│       ├── pages/          # 页面组件
│       ├── components/     # UI 组件
│       ├── store/          # Zustand 状态管理
│       ├── hooks/          # 自定义 Hooks
│       └── api/            # API 请求封装
├── e2e/                # Playwright 端到端测试
├── legacy/             # 旧版静态 demo（归档，不删除）
└── docs/               # 产品和技术文档
    ├── PRD.md          # 产品需求文档
    └── TDD.md          # 技术设计文档
```

---

## 问题排查

**数据库连接失败**
```bash
# 检查容器是否在运行
docker ps

# 如果没有，先启动 Colima 再启动容器
colima start && docker start haiguitang
```

**端口被占用**
```bash
lsof -i :4000   # 查看占用后端端口的进程
lsof -i :3000   # 查看占用前端端口的进程
```

**Prisma Client 过期**
```bash
cd backend && npm run db:generate
```
