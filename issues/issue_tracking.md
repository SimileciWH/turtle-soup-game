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
