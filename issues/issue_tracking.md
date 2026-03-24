# Issue Tracking

---

## [FIXED] BUG-016 — 每日推荐"开始挑战"在难度筛选下崩溃

**日期：** 2026-03-24
**严重级别：** Medium
**状态：** ✅ FIXED（2026-03-24，commit 5a40d8c）

**现象：**
当用户将大厅谜题列表切换到非"全部"难度筛选时（如"困难"），点击每日推荐的"开始挑战"按钮会触发 `TypeError: Cannot read properties of undefined (reading 'title')`，游戏无法启动，显示错误信息。

**根因：**
`Lobby.tsx` `handleStart()` 使用 `puzzles.find(p => p.id === puzzleId)!` 非空断言。当每日推荐谜题（如"简单"难度）不在当前难度筛选的 `puzzles[]` 列表里时，`find()` 返回 `undefined`，访问 `.title` 抛出 TypeError。

**涉及文件：**
- `frontend/src/pages/Lobby.tsx` — `handleStart()` 非空断言改为带 `dailyPuzzle` fallback 的安全查找

**修复步骤：**
将 `puzzles.find(p => p.id === puzzleId)!` 改为：
```typescript
const puzzle = puzzles.find(p => p.id === puzzleId) ??
  (dailyPuzzle?.id === puzzleId ? dailyPuzzle : null)
if (!puzzle) { setError('启动游戏失败：谜题数据不存在'); return }
```

---

## [FIXED] BUG-015 — 每日推荐卡片不显示谜题标题和摘要

**日期：** 2026-03-22
**严重级别：** Medium
**状态：** ✅ FIXED（2026-03-22，commit 7a9ea92）

**现象：**
大厅页面的每日推荐卡片显示"每日推荐"标签和"开始挑战"按钮，但谜题标题和摘要为空白，且点击开始挑战无法正确关联谜题ID。

**根因：**
`getDailyPuzzle()` 声明返回类型为 `Puzzle`，但后端 `/api/v1/puzzles/daily` 实际返回 `{puzzle: Puzzle}`。前端未解构包装层，导致 `dailyPuzzle.title` 为 `undefined`。

**涉及文件：**
- `frontend/src/api/puzzles.ts` — `getDailyPuzzle()` 类型声明错误，返回类型应为 `{puzzle: Puzzle}` 并在函数内解构

**修复步骤：**
将 `getDailyPuzzle()` 改为 `async`，调用后解构 `res.puzzle` 再返回。

---

## [FIXED] BUG-014 — 游客局数未合并到注册账户

**日期：** 2026-03-22
**严重级别：** High
**状态：** ✅ FIXED（2026-03-22）

**现象：**
游客消耗 2 局（quotaFree: 3→1）后点「登录/注册」完成注册，个人中心显示「免费局数 3 / 付费局数 0」，没有继承游客剩余的 1 局，应显示「免费局数 1 / 付费局数 0」。

**根因：**
`mergeGuestQuota` 只 increment `quotaPaid`，未复制 `quotaFree` 和 `quotaResetAt`。新注册用户 `quotaResetAt` 为 null → `getQuota()` 中 `resetDate !== today` → 返回默认值 3 而非实际值 1。

**修复：** `authService.ts` 的 `mergeGuestQuota` 中补充 `quotaFree: guest.quotaFree` 和 `quotaResetAt: guest.quotaResetAt`。
**CI 测试：** `backend/src/__tests__/authService.test.ts` 中新增 BUG-014 回归测试。

---

## [FIXED] BUG-013 — 返回大厅后局数 badge 不刷新

**日期：** 2026-03-22
**严重级别：** Medium
**状态：** ✅ FIXED（2026-03-22）

**现象：**
游客（或已登录用户）开始游戏后，点「← 大厅」返回大厅，顶部局数 badge 仍显示旧值（如 2 局），需手动刷新页面才会更新为正确值（如 1 局）。

**根因：**
`Lobby.tsx` 的 `useEffect([], [])` 只在组件挂载时执行，SPA 路由导航回大厅不重新挂载组件 → effect 不重新触发 → 配额不刷新。同时 `initGuest` 在已有 guest token 时只调用 `setToken` 而不从后端拉取最新配额。

**修复：**
1. 引入 `useLocation`，将 `useEffect` 依赖改为 `[location.key]`，每次 SPA 导航到大厅都触发 profile 刷新
2. `initGuest` 中已有 guest token 时，额外调用 `fetchProfile()` 获取最新配额

**涉及文件：**
- `frontend/src/pages/Lobby.tsx`

---

## [FIXED] BUG-012 — 后端部署持续失败（seed.ts 重复 answer 字段 + 跨行字符串）

**日期：** 2026-03-22
**严重级别：** Critical
**状态：** ✅ FIXED（2026-03-22）

**现象：**
所有 `railway up --service backend` 部署均构建成功但最终回滚，后端始终运行旧容器，所有代码修复均无法上线。

**根因：**
`backend/prisma/seed.ts` 第 568-569 行存在两个问题：
1. 同一对象内有两个 `answer` 字段（草稿和正式）
2. 第一个 `answer` 字段的字符串值跨越两行（单引号字符串不允许换行），导致 `ts-node --transpile-only` 抛出：
   - `TS1002: Unterminated string literal`（第 568 行末）
   - 多个 `TS1127: Invalid character`（第 569-570 行中文被当作代码解析）
3. `startCommand` 使用 `&&` 链接，seed 失败则 `npm start` 不执行，healthcheck 超时后 Railway 回滚

**修复：** 删除草稿 answer（含换行的多行字符串），保留第 570 行正确的单行 answer。

**验证：** 部署后 seed 日志显示"自焚的无罪者 ✓"，服务器正常启动，3 个 OTP 邮件流程全部验证通过。

---

## [FIXED] BUG-011 — 前端 Railway 部署未更新（OTP 恢复代码未上线）

**日期：** 2026-03-21
**严重级别：** High
**状态：** ✅ FIXED（2026-03-22）

**现象：**
生产前端仍服务旧版 bundle（`index-CNlaRhfR.js`），尽管 `ed9bb6f` 提交（OTP恢复）已推送到 main 分支并包含 `frontend/src/pages/Auth.tsx` 变更。具体表现：
- 忘记密码点击后显示"找回密码功能暂时不可用，如需帮助请联系管理员"，不触发任何 API 调用
- 注册成功后前端仍尝试从 `{sent: true}` 中取 `token`，导致以 undefined 作为 JWT 访问 `/profile`，得到 401

**验证：**
```javascript
// 确认旧代码仍在线
fetch('/assets/index-CNlaRhfR.js').then(r=>r.text()).then(t=>t.includes('暂时不可用'))
// → true
```

**根因（待确认）：**
Railway 前端服务可能需要手动触发重新部署，或 build 过程失败但未报错。

**修复步骤：**
1. 进入 Railway 控制台 → frontend 服务 → 手动点击 "Redeploy"
2. 等待新 build 完成（新 bundle hash 应与 `CNlaRhfR` 不同）
3. 验证：`fetch('/assets/index-*.js')` 中不含"暂时不可用"

---

## [FIXED] BUG-010 — 后端邮件发送失败（RESEND_FROM 环境变量未配置）

**日期：** 2026-03-21
**严重级别：** High
**状态：** ✅ FIXED（2026-03-22）

**现象：**
直接调用 `POST /api/v1/auth/password/forgot` 返回 503 EMAIL_SEND_FAILED。后端 OTP 逻辑已恢复（路由存在、rate limit 生效），但邮件发送因 env 缺失失败。

**验证（直接 API 调用）：**
```
POST https://backend-production-03c0e.up.railway.app/api/v1/auth/password/forgot
{"email":"smilion.wang.32@gmail.com"}
→ {"error":"EMAIL_SEND_FAILED","message":"验证码邮件发送失败","data":null}
```

**根因：**
Railway 后端 Variables 缺少 `RESEND_FROM=noreply@ai-smilion.tech`（BUG-007 的待完成步骤之一）。

**修复步骤：**
1. Railway → backend 服务 → Variables
2. 添加 `RESEND_FROM=noreply@ai-smilion.tech`
3. 等待自动重新部署
4. 重新测试 `/auth/password/forgot` 和 `/auth/register`

---



## [FIXED] BUG-009 — 移动端页面内容溢出屏幕

**日期：** 2026-03-21
**严重级别：** Medium
**状态：** ✅ FIXED

**现象：**
在移动端浏览器中，多个页面（大厅、游戏页、个人中心）存在横向或纵向内容溢出屏幕，出现不应出现的横向滚动条，布局被撑破。

**根因分析（待确认）：**
- 固定宽度元素超出 viewport
- flex/grid 子元素未设置 min-width: 0 导致不收缩
- 长文本未做 overflow 截断

**修复：**
- `html/body` 添加 `overflow-x: hidden` + `overscroll-behavior-y: none`
- `MessageBubble` 添加 `break-words min-w-0` 防长文本撑破气泡
- 验证：mobile/tablet/desktop 三端 scrollWidth = clientWidth，无横向溢出

---

## [FIXED] BUG-008 — 移动端输入框获焦时页面跳动

**日期：** 2026-03-21
**严重级别：** Medium
**状态：** ✅ FIXED

**现象：**
在 iOS/Android 移动端点击输入框（游戏问答输入框、登录表单等）时，软键盘弹出导致 viewport 变化，页面出现明显跳动/重排，影响用户体验。

**根因分析（待确认）：**
- 软键盘弹出时浏览器 resize viewport，触发页面重排
- `min-h-screen`（100vh）在移动端键盘弹出后被压缩，导致布局跳变
- iOS Safari 的 `100vh` 包含地址栏高度，键盘弹出后实际可视区域骤减

**修复：**
- `Game.tsx` 根容器改为 `h-dvh overflow-hidden`（dynamic viewport height），键盘弹出时容器自动收缩，MessageList 随之滚动，输入框始终可见
- `Auth/Lobby/Profile/Result.tsx` 的 `min-h-screen` 全部改为 `min-h-dvh`
- `QuestionInput` 底部添加 `env(safe-area-inset-bottom)` 适配 iOS Home 键安全区
- `index.html` viewport 添加 `viewport-fit=cover` 支持 iPhone 全面屏

---

## [FIXED] BUG-007 — Railway 封锁出站 SMTP 端口，注册/找回密码 OTP 邮件无法发送

**日期：** 2026-03-21
**严重级别：** High
**状态：** ✅ FIXED（2026-03-22）

**域名：** `ai-smilion.tech`（2026-03-21 购买，命名审核已通过）

**恢复进度：**
- ✅ `authService.ts` register() 已恢复：发送 OTP，返回 {sent:true}
- ✅ `authService.ts` forgotPassword() 已恢复：发送重置 OTP
- ✅ `Auth.tsx` 前端已恢复：注册→OTP验证步骤，找回密码→OTP验证步骤
- ⏳ 用户需在 resend.com/domains 验证 `ai-smilion.tech`
- ⏳ Railway 后端需添加 `RESEND_FROM=noreply@ai-smilion.tech`

**完成条件：**
1. Resend 域名验证通过（添加 TXT/CNAME/MX DNS 记录到阿里云）
2. Railway 后端 Variables → `RESEND_FROM=noreply@ai-smilion.tech`
3. 浏览器验证注册流程（收到 OTP 邮件 → 验证 → 登录成功）

**现象：** POST /api/v1/auth/register 返回 500；Railway 上无论 port 25/465/587 均 ETIMEDOUT/ENETUNREACH

**根因：** Railway 封锁了所有出站 SMTP 端口。Gmail 先返回 IPv6 地址（ENETUNREACH），IPv4 地址也连不上（ETIMEDOUT）。

**临时处理：** 代码已更新为 Resend API + SMTP 双模式（`emailService.ts`），优先使用 `RESEND_API_KEY`

**待完成操作：**
1. 在 https://resend.com 免费注册并创建 API Key
2. Railway 后端添加环境变量：`RESEND_API_KEY=re_xxx`
3. 重新部署后端（自动触发）
4. 验证注册邮件发送

**参考：** validation/03211133/ — 当前登录流程已验证正常（login/wrong-password 均通过）

---

## [FIXED] BUG-006 — 注册时 guest_token 唯一约束冲突

**日期：** 2026-03-21
**严重级别：** High
**状态：** ✅ FIXED

**现象：** POST /api/v1/auth/register 返回 500，日志显示 `PrismaClientKnownRequestError: Unique constraint failed on the fields: (guest_token)` (P2002)

**根因：** `register` 函数将 `guestToken` 赋给新注册用户，但 guest 账户仍存在且拥有相同 `guestToken`，违反唯一约束

**修复：** 注册时新用户不设置 `guestToken`（只复制 `quotaFree/quotaPaid`），在 `verifyRegistration` 时由 `mergeGuestQuota` 处理 guest 账户合并和删除

**验证：** validation/03211133/ — 注册流程截图

---

## [FIXED] BUG-002 — AI API 模型名称不匹配

**日期：** 2026-03-20
**严重级别：** High
**状态：** ✅ FIXED

**现象：** POST /games/:id/ask 返回 SSE error 事件 "AI 服务暂时不可用"

**根因：** aiService.ts 默认模型为 `gpt-4o-mini`，七牛云 API 无此模型

**修复：** 添加 `OPENAI_MODEL` 环境变量，默认值改为 `deepseek-v3-0324`
**验证：** validation/03201911/02-games-api-all-pass.png（7/7 通过）

---

## [FIXED] BUG-001 — 游客模式无法正确使用游戏 API

**日期：** 2026-03-20
**严重级别：** Low（验证脚本 bug，非主代码 bug）
**状态：** ✅ FIXED

**现象：** 验证脚本测试 QUOTA_EXHAUSTED 时读取 `data.code` 字段，但 errorHandler 返回 `data.error`

**根因：** 验证测试脚本字段名与 API 实际响应格式不符

**修复：** 更新验证页面字段名为 `data.error`
**验证：** 同上

---

---

## [BUG-005] 邮箱登录 500 — mergeGuestQuota FK 约束违反
**发现时间：** 2026-03-21 | **状态：** ✅ FIXED | **严重级别：** 高

**现象：**
游客完成游戏后点击「登录」，输入邮箱+验证码，POST /auth/email/verify 返回 500。

**根本原因（双重 bug）：**
1. `createUserFromEmail`：当 guest user 存在时，试图创建一个带相同 `guestToken` 的新用户 → 唯一键冲突
2. `mergeGuestQuota`：直接 `prisma.user.delete(guest)` 但 `game_sessions` 有 FK 引用该用户 → FK 约束违反

**修复方案：**
1. `createUserFromEmail`：若 guest 存在，改为 `prisma.user.update` 追加 email 字段，而非 create 新用户
2. `mergeGuestQuota`：用 `$transaction` 先执行 `gameSession.updateMany({ userId: guest.id → userId })`，再删除 guest

**修复文件：** `backend/src/services/authService.ts`

**验证：** 部署后浏览器完整流程验证

---

## [FIXED] BUG-004 — 邮箱验证码发送失败（Resend 未验证域名）
**发现时间：** 2026-03-21 | **状态：** ✅ FIXED（2026-03-22） | **严重级别：** 高

**现象：**
点击「发送验证码」后前端提示"验证码邮件发送失败"，后端返回 503 EMAIL_SEND_FAILED。

**根本原因：**
Resend 账户处于测试模式（未验证自定义域名），只允许向注册账号邮箱 `simileci.wh.32@outlook.com` 发送邮件。
当目标邮箱为其他地址（如 gmail）时，Resend API 返回 403 validation_error：
```
"You can only send testing emails to your own email address (simileci.wh.32@outlook.com).
To send emails to other recipients, please verify a domain at resend.com/domains."
```

**影响范围：**
所有注册/登录流程不可用（游客模式不受影响）。

**修复方案：**
方案 A（推荐）：在 Resend 控制台 (resend.com/domains) 验证自定义域名，将 `from` 地址改为 `noreply@your-domain.com`
方案 B（临时）：验证期间只对 `simileci.wh.32@outlook.com` 可用，适合内部测试

**复现步骤：**
1. 访问 https://frontend-production-c064.up.railway.app/auth
2. 输入任意非 Resend 注册邮箱（如 gmail）
3. 点击「发送验证码」
4. 报错"验证码邮件发送失败"

