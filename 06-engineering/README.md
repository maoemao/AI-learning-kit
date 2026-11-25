# 阶段六：工程化与安全（8 课）

## 课程清单

1. 提示注入：资料是证据，不是授权
2. 隐私、审批与幂等：把确认绑定到具体动作
3. 成本、延迟与缓存：失效比命中更重要
4. OpenTelemetry：先最小采集，再验证出口
5. SSE 与前端状态：网络块不等于事件
6. 增量更新与删除：防止索引和引用复活
7. 自动化 Evals：把失败变成能重放的回归
8. 本地模型与离线部署：说明"离线"的前提

## 配套代码

- `ai-lab/src/telemetry.ts` — OpenTelemetry SDK 初始化、allowlist JSON
- `ai-lab/src/sse.ts` — SSE 事件流解析、心跳、断线处理
- `ai-lab/src/server.ts` — HTTP 服务器、回环地址绑定、SSE 传输

## 学习目标

- [ ] 能识别提示注入的常见攻击模式
- [ ] 理解 OpenTelemetry 的 trace/span 概念和隐私边界
- [ ] 能解释 SSE 和 WebSocket 的区别与适用场景
- [ ] 理解"离线部署"真正的前提条件

## 我的笔记

<!-- 在这里记录学习过程中的理解和疑问 -->
