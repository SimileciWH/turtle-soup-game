# Feature 开发清单

> 新 feature 追加到首行。状态：🔄进行中 / ✅完成 / ⏸️暂停 / ❌取消

---

## [DEFERRED] 前端组件测试（Vitest + RTL）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 MVP 后迭代

**描述：** 按 TESTING.md ch4 规范，为 QuotaBadge / InputBar / ProgressBar 等组件补充 Vitest + React Testing Library 单元测试。

**原因暂停：** MVP 阶段优先完成功能闭环，组件测试在迭代阶段补全。

---

## [DEFERRED] 后端集成测试（Supertest + 真实 PostgreSQL）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 MVP 后迭代

**描述：** 按 TESTING.md ch3 规范，基于 Supertest 写 auth / game / hint / redeem 集成测试，CI 启动真实 PostgreSQL 容器验证。

**原因暂停：** 当前 CI 使用 jest.mock 的单元测试已能保护核心逻辑，集成测试在迭代阶段补全。

---

## [DEFERRED] 分享卡片图片导出（html2canvas）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 MVP 后迭代

**描述：** 使用 html2canvas 将分享卡片 DOM 渲染为真实图片，用户可下载或保存到相册。

**当前方案：** MVP 阶段实现样式卡片 UI，用户长按截图分享。
**原因暂停：** html2canvas 有 Safari 兼容问题 + Google Fonts 跨域风险，MVP 阶段风险不可控。

---

## [DEFERRED] AI 输出二次过滤（汤底关键词泄露检测）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 MVP 后迭代

**描述：** 参考 TDD ch10.2，在 SSE 流结束后检测 AI 输出是否包含汤底关键词，若泄露则替换为"与此无关。"并告警。

---

## [DEFERRED] 超 40 轮对话压缩（Token 成本控制）
**日期：** 2026-03-20 | **状态：** ⏸️ 暂停至 MVP 后迭代

**描述：** 参考 PRD AI 安全要求，超过 40 轮时对早期轮次做摘要压缩，控制每局 Token 成本在合理范围。

---

## [DONE] Step 5 - 游戏核心 API
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：** POST /games, GET /games/:id, POST /games/:id/ask (SSE), POST /games/:id/hint, POST /games/:id/answer, POST /games/:id/giveup, GET /games/:id/result

---

## [DONE] Step 4 - 题库 API
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：** GET /puzzles, GET /puzzles/daily, GET /puzzles/:id（SAFE_SELECT 永不暴露汤底）

---

## [DONE] Step 3 - 用户认证
**日期：** 2026-03-20 | **状态：** ✅ 完成

**接口：** POST /auth/guest, POST /auth/email/send, POST /auth/email/verify, GET /auth/me

---

## [DONE] Step 1+2 - 项目骨架 + 数据库 Schema
**日期：** 2026-03-20 | **状态：** ✅ 完成
