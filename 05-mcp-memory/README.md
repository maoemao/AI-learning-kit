# 阶段五：MCP、Skills 与 Memory（8 课）

## 课程清单

1. MCP 架构：Host、Client、Server
2. 编写 MCP Server：用真实协议暴露能力
3. MCP Client：从发现到生命周期管理
4. Skills：把工作知识与工具能力分开
5. 短期记忆：会话状态与历史压缩
6. 长期记忆：只保存有依据的稳定信息
7. ai-memory-mcp 本地项目：从学习实现到真实系统
8. Context Engineering：组装最小有效上下文

## 配套代码

- `ai-lab/src/mcp-server.ts` — 真实 stdio MCP Server 实现
- `ai-lab/src/mcp-client.ts` — MCP Client 发现与调用
- `ai-lab/src/mcp-agent.ts` — Agent 通过 MCP 访问工具（集成示例）
- `ai-lab/src/mcp-agent-check.ts` — MCP Agent 集成测试
- `ai-lab/src/memory.ts` — SQLite 教学记忆实现（scope、乐观锁、遗忘）

## 学习目标

- [ ] 画出 MCP 的 Host → Client → Server 架构图
- [ ] 跑通 `npm run mcp:check` 验证 MCP 协议通信
- [ ] 跑通 `npm run agent:mcp:check` 验证 Agent + MCP 集成
- [ ] 理解 Memory 的 CONFIRMATION_REQUIRED 和 POSSIBLE_SECRET 保护机制
- [ ] 能解释短期记忆（会话上下文）和长期记忆（持久化）的区别

## 我的笔记

<!-- 在这里记录学习过程中的理解和疑问 -->
