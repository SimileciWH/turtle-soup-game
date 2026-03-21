# Feature 开发清单

> 新 feature 追加到首行。状态：🔄进行中 / ✅完成 / ⏸️暂停 / ❌取消

---

## [PLANNED] 认证系统 v2：邮箱+密码 + Gmail SMTP
**日期：** 2026-03-21 | **状态：** ⏸️ 待实现（Phase 2 优先）

**描述：** 将认证从"纯 OTP 无密码"升级为"邮箱+密码"体系，OTP 仅用于注册验证和忘记密码。同步将邮件服务从 Resend 换成 Gmail SMTP（免费，支持任意收件人）。

**新增流程：**
- 注册：邮箱+密码 → OTP 验证邮箱所有权 → 自动登录
- 登录：邮箱+密码（无 OTP，瞬间完成）
- 忘记密码：邮箱 OTP → 设新密码
- 修改密码：当前密码+新密码（已登录）
- 注销账号：密码确认 → 软删除（30天保留）

**安全机制：**
- 密码 bcrypt 哈希（cost factor 12）
- 连续失败 5 次 → 锁定 15 分钟
- 忘记密码接口不泄露邮箱是否存在
- 软删除期间邮箱不可重新注册

**数据库变更（新增字段）：**
- `users.password_hash VARCHAR` — 密码 bcrypt 哈希，游客可为 null
- `users.email_verified BOOLEAN DEFAULT false` — 邮箱是否已验证
- `users.login_attempts INT DEFAULT 0` — 连续失败次数
- `users.locked_until TIMESTAMP` — 锁定解除时间

**新增 API 端点：**
- `POST /auth/register` — 邮箱+密码，发送 OTP
- `POST /auth/register/verify` — 验证 OTP，完成注册
- `POST /auth/login` — 邮箱+密码登录
- `POST /auth/password/forgot` — 发送重置 OTP
- `POST /auth/password/reset` — OTP+新密码重置
- `POST /auth/password/change` — 修改密码（已登录）
- `DELETE /auth/account` — 注销账号

**邮件服务：Gmail SMTP**
- 配置：Gmail 账号 → 开启两步验证 → 生成应用专用密码
- 环境变量：SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
- 依赖：`nodemailer`（替换 Resend）
- 费用：免费，~500 封/天

**测试用例：** 已在 `docs/TESTING.md` 3.1 节全面覆盖（注册/登录/忘记密码/修改密码/注销/边界情况共 18 个测试用例）

---

## [DONE] BUG-005 修复：邮箱登录 500 — mergeGuestQuota FK 约束
**日期：** 2026-03-21 | **状态：** ✅ 完成

**描述：** 修复游客完成游戏后再邮箱登录，触发 500 错误的两个根因。

**修复内容：**
- `backend/src/services/authService.ts` `createUserFromEmail`：guest 存在时改为 `update` 追加 email，而非 create 新用户（修复 guestToken 唯一键冲突）
- `backend/src/services/authService.ts` `mergeGuestQuota`：用 `$transaction` 先迁移 `game_sessions` 再删除 guest（修复 FK 约束违反）

**验证：** Playwright 浏览器全流程：游客游戏 → 邮箱发码 → 输入验证码 → 登录成功跳转大厅，quota 正常扣减（3→2）

---

## [DONE] Railway 部署修复 + 生产数据库 Seed 自动化
**日期：** 2026-03-21 | **状态：** ✅ 完成

**描述：** 修复 Railway 生产部署中发现的三个问题，并实现部署时自动 seed 谜题数据。

**修复内容：**
- `frontend/vite.config.ts`：`preview.allowedHosts: true`（Vite 5 布尔值），修复前端 403 错误
- `backend/railway.toml` + `frontend/railway.toml`：移除 buildCommand 中的 `npm ci`，修复 nixpacks EBUSY 双重安装冲突
- `backend/package.json`：新增 `prisma.seed` 配置，指向 `ts-node --transpile-only prisma/seed.ts`
- `backend/railway.toml`：startCommand 增加 `npx prisma db seed`，幂等 upsert，每次部署自动同步谜题数据

**验证：** 浏览器全流程验证通过（大厅 20 题 → 游戏 → AI 问答 → 结果页）

---

## [DONE] P1-3：结果页对话历史展示
**日期：** 2026-03-21 | **状态：** ✅ 完成

**描述：** 在汤底揭晓页底部展示本局完整问答对话记录，可折叠展开。

**实现内容：**
- 后端新增 `GET /games/:id/messages` 接口，返回本局全部消息（role + content）
- `backend/src/routes/games.ts`：注册新路由
- `backend/src/controllers/gameController.ts`：`handleGetMessages` 控制器，含会话归属校验
- `frontend/src/api/games.ts`：新增 `getMessages()` 调用函数
- `frontend/src/pages/Result.tsx`：并行请求 `getResult` + `getMessages`，实现可折叠气泡时间线
  - 玩家消息：蓝色气泡，右对齐
  - AI 回复：白色气泡，左对齐
  - 展开/收起按钮，最大高度 384px 可滚动

---

## [DONE] P1-2：输入框字符计数显示
**日期：** 2026-03-21 | **状态：** ✅ 完成

**描述：** 输入框接近 3000 字上限时，显示实时字符计数提醒。

**实现内容：**
- `frontend/src/components/game/QuestionInput.tsx`：
  - textarea 增加 `maxLength={3000}`
  - 剩余 ≤300 字时显示 `N/3000` 计数器
  - 超限（≤0）时计数器变红色（coral）
- 后端 inputGuard 中间件已有 3000 字服务端拦截，前后端双重防护

---

## [DONE] Step 13：Railway 部署配置
**日期：** 2026-03-20 | **状态：** ✅ 完成

**描述：** 完成前后端 Railway 部署，生产环境全部上线。

**实现内容：**
- `backend/railway.toml`：builder=nixpacks，buildCommand 编译 TS + 生成 Prisma Client，startCommand 自动迁移 + 启动
- `frontend/railway.toml`：builder=nixpacks，buildCommand 构建，startCommand 运行 Vite preview
- 生产后端：https://backend-production-03c0e.up.railway.app（健康检查 `/api/health` ✅）
- 生产前端：https://frontend-production-c064.up.railway.app（HTTP 200 ✅）
- Railway 环境变量配置：DATABASE_URL / JWT_SECRET / OPENAI_API_KEY / OPENAI_BASE_URL / CORS_ORIGIN / RESEND_API_KEY
- CORS_ORIGIN 设置为前端 Railway 域名，跨域正常

---

## [DONE] Step 12：GitHub Actions CI 配置
**日期：** 2026-03-20 | **状态：** ✅ 完成

**描述：** 配置 CI 流水线，push 自动触发编译检查和单元测试。

**实现内容：**
- `.github/workflows/ci.yml`：
  - 后端：TypeScript 编译检查（`tsc --noEmit`）+ Jest 单元测试
  - 前端：TypeScript 编译检查（`tsc --noEmit`）
  - Node.js 20，npm ci 安装依赖
- 后端单元测试覆盖：authService / quotaService / gameService 核心逻辑

---

## [DEFERRED] Step 11：个人中心前端页面
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 Phase 2

**描述：** 个人中心页面，含局数余额、兑换码入口、游戏历史记录列表。

**当前状态：** 后端 API 全部就绪（GET /profile、GET /profile/history、POST /redeem），仅缺前端页面实现。
**原因暂停：** MVP 阶段优先完成游戏核心闭环验证，个人中心为次优先级。

---

## [DONE] Step 10：汤底揭晓页 + 分享卡片
**日期：** 2026-03-20 | **状态：** ✅ 完成

**描述：** 游戏结束后的汤底揭晓页面，展示完整答案、本局统计和分享功能。

**实现内容：**
- `frontend/src/pages/Result.tsx`：
  - 汤面 + 汤底真相并排展示
  - 本局统计卡片：提问数 / 使用提示次数 / 用时（格式化为 X分X秒）
  - 游戏结果状态：已通关 / 已放弃
  - 文字版分享卡片（含谜题名、统计数据、品牌签名），点击复制到剪贴板
  - "再来一局"按钮跳转大厅

**延期项：**
- 分享战绩图片（html2canvas）→ 见 [DEFERRED] 分享卡片图片导出

---

## [DONE] Step 9：前端游戏页面（SSE 接收 + 打字机效果）
**日期：** 2026-03-20 | **状态：** ✅ 完成

**描述：** 游戏核心交互页面，支持实时流式 AI 问答，四个操作按钮。

**实现内容：**
- `frontend/src/pages/Game.tsx`：游戏页面主逻辑，路由 `/game/:sessionId`
- `frontend/src/components/game/ChatBubble.tsx`：对话气泡，玩家/AI 区分颜色
- `frontend/src/components/game/QuestionInput.tsx`：输入框 + 发送按钮，流式输出期间禁用
- `frontend/src/components/game/ActionBar.tsx`：四按钮栏（查看汤面 / 提示N/3 / 说出答案 / 放弃）
- `frontend/src/api/games.ts`：`askStream()` async generator，解析 SSE `data:` 帧
- `frontend/src/api/client.ts`：导出 `BASE_URL`，askStream 使用环境变量而非硬编码路径（关键生产修复）
- 顶部进度条 + 剩余提问次数常驻显示
- 提示弹窗、说出答案弹窗、查看汤面弹窗

---

## [DONE] Step 8：前端大厅页面
**日期：** 2026-03-20 | **状态：** ✅ 完成

**描述：** 游戏入口大厅，展示题目列表，支持难度筛选。

**实现内容：**
- `frontend/src/pages/Lobby.tsx`：大厅页面，路由 `/`
- `frontend/src/components/lobby/PuzzleCard.tsx`：题目卡片（标题 + 难度标签 + 简介 + 开始游戏按钮）
- `frontend/src/components/lobby/DifficultyFilter.tsx`：难度 Tab（全部 / 简单 / 中等 / 困难）
- `frontend/src/components/layout/Header.tsx`：顶部导航 + QuotaBadge 剩余局数显示
- 游客提示横幅："当前以游客身份游玩，登录后可保存进度并兑换局数"
- 难度筛选调用 `GET /puzzles?difficulty=xxx`，实时切换

---

## [DONE] Step 7：兑换码 + Profile 后端 API
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：**
- `POST /redeem`：兑换码激活，原子事务（悲观锁防并发），校验有效性/已用/已过期
- `GET /profile`：个人信息 + 局数余额（quota_free + quota_paid）
- `GET /profile/history`：游戏历史记录（分页，含谜题名、结果、提问数、用时）

---

## [DONE] Step 6：提示系统 + 答案验证 + 揭晓
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：**
- `POST /games/:id/hint`：三级渐进提示（hint_1 → hint_2 → hint_3），超出 3 次返回 HINT_EXHAUSTED
- `POST /games/:id/answer`：玩家提交最终猜测，AI 验证核心要素，返回 correct + message（+ full_answer）
- `POST /games/:id/giveup`：放弃，返回完整汤底，session 状态更新为 given_up
- `GET /games/:id/result`：结算数据（含汤底、统计），仅 won/given_up 状态可访问

---

## [DONE] Step 5：游戏核心 API
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：** POST /games, GET /games/:id, POST /games/:id/ask (SSE), POST /games/:id/hint, POST /games/:id/answer, POST /games/:id/giveup, GET /games/:id/result

---

## [DONE] Step 4：题库 API
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：** GET /puzzles, GET /puzzles/daily, GET /puzzles/:id（SAFE_SELECT 永不暴露汤底）

**题库数据：** 20 道谜题（6 简单 / 8 中等 / 6 困难），通过 `prisma/seed.ts` upsert 写入

---

## [DONE] Step 3：用户认证
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：** POST /auth/guest, POST /auth/email/send, POST /auth/email/verify, GET /auth/me

---

## [DONE] Step 1+2：项目骨架 + 数据库 Schema
**日期：** 2026-03-20 | **状态：** ✅ 完成

---

## [DEFERRED] 前端组件测试（Vitest + RTL）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 Phase 2

**描述：** 按 TESTING.md ch4 规范，为 QuotaBadge / QuestionInput / ActionBar 等组件补充 Vitest + React Testing Library 单元测试。

**原因暂停：** MVP 阶段优先完成功能闭环，组件测试在迭代阶段补全。

---

## [DEFERRED] 后端集成测试（Supertest + 真实 PostgreSQL）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 Phase 2

**描述：** 按 TESTING.md ch3 规范，基于 Supertest 写 auth / game / hint / redeem 集成测试，CI 启动真实 PostgreSQL 容器验证。

**原因暂停：** 当前 CI 使用 jest.mock 的单元测试已能保护核心逻辑，集成测试在迭代阶段补全。

---

## [DEFERRED] 分享卡片图片导出（html2canvas）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 Phase 2

**描述：** 使用 html2canvas 将分享卡片 DOM 渲染为真实图片，用户可下载或保存到相册。

**当前方案：** MVP 阶段实现文字版分享卡片，用户点击复制文字后自行截图分享。
**原因暂停：** html2canvas 有 Safari 兼容问题 + Google Fonts 跨域风险，MVP 阶段风险不可控。

---

## [DEFERRED] AI 输出二次过滤（汤底关键词泄露检测）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 Phase 2

**描述：** 参考 TDD ch10.2，在 SSE 流结束后检测 AI 输出是否包含汤底关键词，若泄露则替换为"与此无关。"并告警。

---

## [DEFERRED] 超 40 轮对话压缩（Token 成本控制）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 Phase 2

**描述：** 参考 PRD AI 安全要求，超过 40 轮时对早期轮次做摘要压缩，控制每局 Token 成本在合理范围。

---
