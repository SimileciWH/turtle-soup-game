# Issue Tracking

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

