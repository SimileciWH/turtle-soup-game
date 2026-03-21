# Issue Tracking

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

## [IN_PROGRESS] BUG-007 — Railway 封锁出站 SMTP 端口，注册/找回密码 OTP 邮件无法发送

**日期：** 2026-03-21
**严重级别：** High
**状态：** 🔄 IN PROGRESS — OTP 代码已恢复，等待 Resend 域名验证 + Railway 环境变量更新

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

## [BUG-004] 邮箱验证码发送失败 — Resend 未验证域名
**发现时间：** 2026-03-21 | **状态：** 🔴 待修复 | **严重级别：** 高

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

