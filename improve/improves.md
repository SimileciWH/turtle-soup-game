# Improve Tracking

---

## [PENDING] IMP-010 — CI 安全门：inputGuard 中间件测试

**日期：** 2026-03-22
**优先级：** P0 安全红线
**状态：** 🔵 PENDING

**背景：**
`inputGuard` 是阻止 prompt injection 和超长输入进入 AI 调用的唯一防线。目前无任何测试，代码改动可能静默破坏防护。

**需要新建：** `backend/src/__tests__/inputGuard.test.ts`

```typescript
describe('inputGuard middleware', () => {
  test('正常问题：通过，next() 被调用')
  test('超过 3000 字：返回 400 INPUT_TOO_LONG')
  test('包含注入关键词（"忽略以上所有指令"）：返回 400 BLOCKED_INPUT')
  test('边界值 3000 字：正常通过')
  test('边界值 3001 字：被拦截')
})
```

**CI 要求：** 加入现有 `backend-test` job，无需 DB，纯单元测试，mock req/res/next 即可。

**涉及文件：**
- `backend/src/__tests__/inputGuard.test.ts`（新建）

---

## [PENDING] IMP-009 — CI 经济门：兑换码并发安全测试

**日期：** 2026-03-22
**优先级：** P0 经济红线
**状态：** 🔵 PENDING

**背景：**
现有 `redeemService.test.ts` 只测单次兑换逻辑，没有并发测试。两人同时兑换同一码，依赖 DB 事务保证原子性，必须用真实 PostgreSQL 才能验证。

**需要在 `redeemService.test.ts` 新增：**

```typescript
test('并发兑换同一码：只有一次成功，另一次抛 USED_CODE', async () => {
  const [r1, r2] = await Promise.allSettled([
    redeemCode(userA, code),
    redeemCode(userB, code)
  ])
  const succeeded = [r1, r2].filter(r => r.status === 'fulfilled').length
  expect(succeeded).toBe(1)
})
```

**CI 要求：** 依赖 IMP-005（PostgreSQL 服务容器）才能运行，属于集成测试。

**涉及文件：**
- `backend/src/__tests__/redeemService.test.ts`（新增并发用例）

---

## [PENDING] IMP-008 — CI 经济门：局数扣减逻辑测试

**日期：** 2026-03-22
**优先级：** P0 经济红线
**状态：** 🔵 PENDING

**背景：**
`quotaService`（局数扣减）是付费体验的核心，直接影响用户花钱买的局数是否正确计算。目前完全没有对应测试文件，错误静默无法发现。

**需要新建：** `backend/src/__tests__/quotaService.test.ts`

```typescript
describe('consumeQuota', () => {
  test('有免费局数：优先扣免费，paid 不变')
  test('免费用完：扣付费局数')
  test('free=0, paid=0：抛 QUOTA_EXHAUSTED')
  test('每日重置：新的一天 quotaFree 恢复为 3 再扣 1')
  test('同一天：不重复重置，直接扣')
})
```

**CI 要求：** mock Prisma，纯单元测试，无需 DB，加入现有 `backend-test` job 即可立即生效。

**涉及文件：**
- `backend/src/__tests__/quotaService.test.ts`（新建）

---

## [PENDING] IMP-007 — E2E 测试：补全 Playwright 测试文件并加入 CI

**日期：** 2026-03-22
**优先级：** Low
**状态：** 🔵 PENDING

**现状：** E2E 测试目录和测试文件完全不存在，CI 也没有 E2E job。

**需要做的事：**
1. 创建 `e2e/` 目录及 `playwright.config.ts`
2. 编写 `e2e/game-flow.spec.ts`（完整游戏流程）和 `e2e/hint-flow.spec.ts`（提示系统），内容参考 `docs/TESTING.md` 第 5 章
3. 在 `ci.yml` 补充 `e2e-test` job（仅 main 分支触发，needs: [backend-test, frontend-test]）

**涉及文件：**
- `e2e/playwright.config.ts`（新建）
- `e2e/game-flow.spec.ts`（新建）
- `e2e/hint-flow.spec.ts`（新建）
- `.github/workflows/ci.yml`（新增 e2e-test job）

---

## [PENDING] IMP-006 — 前端组件测试：补全 Vitest 测试文件并加入 CI

**日期：** 2026-03-22
**优先级：** Medium
**状态：** 🔵 PENDING

**现状：** 前端无任何组件测试文件，CI 的 `frontend-build` job 只做 TypeScript 编译 + 构建，不跑任何测试。

**需要做的事：**
1. 创建 `frontend/src/__tests__/` 目录
2. 编写组件测试：`QuotaBadge.test.tsx`、`InputBar.test.tsx`、`ProgressBar.test.tsx`，内容参考 `docs/TESTING.md` 第 4 章
3. 配置 `frontend/vitest.config.ts`
4. 将 CI 的 `frontend-build` job 改名为 `frontend-test`，新增 `npm run test -- --coverage` 步骤

**涉及文件：**
- `frontend/src/__tests__/` 下多个测试文件（新建）
- `frontend/vitest.config.ts`（新建或更新）
- `.github/workflows/ci.yml`（frontend job 增加测试步骤）

---

## [PENDING] IMP-005 — 后端 CI 完善：PostgreSQL 服务 + 集成测试 + 覆盖率

**日期：** 2026-03-22
**优先级：** High
**状态：** 🔵 PENDING

**现状：** 实际 `ci.yml` 的 `backend-test` job 与 TESTING.md 规范差距较大：

| 差距项 | TESTING.md 要求 | 当前实际 |
|--------|----------------|---------|
| PostgreSQL | postgres:16 服务容器 | placeholder URL（无真实 DB） |
| DB 迁移 | `npm run db:migrate` | 缺失 |
| 单元测试 | `npm run test:unit --coverage` | `npm test`（无 coverage） |
| 集成测试 | `npm run test:integration` | 无 |
| 覆盖率上传 | Codecov action | 缺失 |
| 测试目录结构 | `unit/` + `integration/` 子目录 | flat 结构（5 个文件混放） |

**需要做的事：**
1. `ci.yml` 的 `backend-test` job 新增 postgres:16 服务容器
2. 新增 `npm run db:migrate` 步骤
3. 拆分 `npm run test:unit` 和 `npm run test:integration` 两个步骤并加 `--coverage`
4. 新增 `codecov/codecov-action` 覆盖率上传
5. 将现有 5 个测试文件整理到 `unit/` + `integration/` 子目录，更新 `jest.config.ts` 对应路径
6. `package.json` 新增 `test:unit` 和 `test:integration` 两个 npm script

**涉及文件：**
- `.github/workflows/ci.yml`
- `backend/package.json`
- `backend/jest.config.ts`
- `backend/src/__tests__/` 目录重组

---

## [PENDING] IMP-004 — 登录时检测未注册邮箱并引导注册

**日期：** 2026-03-22
**优先级：** Medium
**状态：** 🔵 PENDING

**现状：**
用户输入未注册的邮箱 + 任意密码登录，后端返回通用错误「邮箱或密码错误」，用户不知道是账号不存在还是密码错了，体验差。

**优化方案：**
后端区分「邮箱不存在」和「密码错误」两种情况，前端针对性提示：

```
邮箱或密码错误                     ← 密码错误时（保持现状）

该邮箱尚未注册                     ← 邮箱不存在时
[ 前往注册 → ]                     ← 点击直接切换到注册 tab 并预填邮箱
```

**交互细节：**
- 前端收到新错误码 `EMAIL_NOT_FOUND` 时，显示「该邮箱尚未注册」+ 「前往注册」按钮
- 点击「前往注册」切换到注册 tab 并自动预填邮箱字段
- 密码错误仍返回 `INVALID_CREDENTIALS`（「邮箱或密码错误」），不作区分

**安全说明：**
区分「邮箱不存在」会带来邮箱枚举风险（攻击者可探测邮箱是否注册）。对于游戏类应用，此风险可接受，以换取更好的用户体验。实施时可评估是否需要加 rate limit 缓解。

**后端影响：**
- `authService.ts` `login()`：用户不存在时改抛 `EMAIL_NOT_FOUND` 而非 `INVALID_CREDENTIALS`
- `AppError.ts`：新增 `EMAIL_NOT_FOUND` 错误类型

**涉及文件：**
- `backend/src/services/authService.ts` — login() 区分两种错误
- `backend/src/utils/AppError.ts` — 新增 EMAIL_NOT_FOUND
- `frontend/src/pages/Auth.tsx` — 登录 tab 处理新错误码并引导注册

---

## [PENDING] IMP-001 — 注册页面单页化（合并 OTP 验证码到注册表单）

**日期：** 2026-03-22
**优先级：** Medium
**状态：** 🔵 PENDING

**现状：**
注册流程分两步跳转：
1. 填写邮箱 + 密码 → 点击「立即注册」
2. 跳转新页面 → 填写 6 位 OTP → 点击「验证并登录」

**优化方案：**
将注册流程合并为单页 4 个输入框，无需页面跳转：

```
[ 邮箱地址              ] [获取验证码]   ← 邮箱格式合法后按钮才激活，点击后60s倒计时
[ 密码（至少8位）        ]
[ 再次输入密码           ]
[ 6位验证码              ]
         [ 立即注册 ]                    ← 4项填写完且密码一致才激活
```

**交互细节：**
- 「获取验证码」按钮：邮箱格式合法才可点击，点后调用现有 `POST /api/v1/auth/register`，开始 60s 倒计时，期间显示「重新获取(59s)」
- 两次密码不一致时在「再次输入密码」下方实时提示错误
- 「立即注册」按钮：4 个字段全填 + 密码一致 + 已获取验证码才激活
- 点击「立即注册」调用现有 `POST /api/v1/auth/register/verify`

**后端影响：** 无需修改，现有 API 完全兼容。

**涉及文件：**
- `frontend/src/pages/Auth.tsx` — 注册 tab 的 UI 和状态逻辑

**参考：** 微信/支付宝注册页面为同类设计，国内用户熟悉此交互模式。

---

## [PENDING] IMP-003 — 注销账号增加邮箱 + 验证码二次确认

**日期：** 2026-03-22
**优先级：** Medium
**状态：** 🔵 PENDING

**现状：**
注销账号弹窗仅要求输入当前密码一项验证即可确认删除，安全性不足。

**优化方案：**
弹窗内合并为单页 3 项验证，全部在一个弹窗内完成：

```
确认注销账号？
以下内容将被清除：...

[ 邮箱地址（只读/预填）  ] [发送验证码]  ← 点击后60s倒计时
[ 6位验证码              ]
[ 当前密码               ]

      [ 取消 ]  [ 确认注销 ]              ← 3项全填才激活「确认注销」
```

**交互细节：**
- 邮箱字段预填当前登录邮箱，只读不可编辑
- 「发送验证码」调用现有 `POST /api/v1/auth/password/forgot`（复用重置密码的 OTP 流程），60s 倒计时
- 「确认注销」按钮：3 项全填才激活，点击调用现有 `DELETE /api/v1/auth/account`（同时后端用 OTP + 密码双重验证）
- 后端 `deleteAccount` 需新增 OTP 验证步骤

**后端影响：** 需小改 `authService.ts` 的 `deleteAccount()`，在密码校验前增加 `verifyOtp()` 校验；路由入参增加 `code` 字段。

**涉及文件：**
- `frontend/src/pages/Profile.tsx` — 注销弹窗 UI 和状态逻辑
- `backend/src/services/authService.ts` — `deleteAccount()` 增加 OTP 验证
- `backend/src/routes/profile.ts` — 路由入参增加 `code`

---

## [PENDING] IMP-002 — 找回密码页面单页化（合并邮箱、发送验证码、验证码输入、新密码）

**日期：** 2026-03-22
**优先级：** Medium
**状态：** 🔵 PENDING

**现状：**
找回密码流程分两步跳转：
1. 填写邮箱 → 点击「发送验证码」
2. 跳转新页面 → 填写 6 位 OTP + 新密码 → 点击「重置密码」

**优化方案：**
合并为单页 3 个输入框 + 1 个内联按钮，无需页面跳转：

```
[ 邮箱地址              ] [发送验证码]   ← 邮箱格式合法后按钮才激活，点击后60s倒计时
[ 6位验证码              ]
[ 设置新密码（至少8位）  ]
         [ 重置密码 ]                    ← 3项填写完才激活
```

**交互细节：**
- 「发送验证码」按钮：邮箱格式合法才可点击，点后调用现有 `POST /api/v1/auth/password/forgot`，开始 60s 倒计时，期间显示「重新发送(59s)」
- 「重置密码」按钮：3 个字段全填 + 已发送验证码才激活
- 点击「重置密码」调用现有 `POST /api/v1/auth/password/reset`
- 成功后自动跳转大厅（已登录状态）

**后端影响：** 无需修改，现有 API 完全兼容。

**涉及文件：**
- `frontend/src/pages/Auth.tsx` — 找回密码 section 的 UI 和状态逻辑

---
