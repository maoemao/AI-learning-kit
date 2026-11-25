# 阶段四：Workflow 与 Agent（8 课）

## 课程清单

1. Workflow 与路由：先用固定路径解决明确任务
2. Function Calling：完整往返比工具声明更重要
3. 工具契约、最小权限与异常分类
4. Agent Loop：每次循环都有停止条件
5. ReAct 与 Plan-and-Execute：保存行动摘要
6. Reflection 与验证：让批评有外部依据
7. LangGraph：暂停恢复与节点重跑
8. 并行与 Multi-Agent：先分清任务并发

## 配套代码

- `ai-lab/src/agent.ts` — 进程内工具闭环（工具定义、执行、Agent Loop）
- `ai-lab/src/graph.ts` — LangGraph interrupt/resume 真实实现

## 补充阅读

- `Agents_Harness_Loop_Graphs.html`（搬到 `00-handbook/` 后）— Harness/Loop/Graph 深入专题

## 学习目标

- [ ] 能区分 Workflow（固定路径）和 Agent（动态决策）
- [ ] 理解 Function Calling 的完整往返流程
- [ ] 读懂 `agent.ts` 中的 Agent Loop：停止条件、步数预算、重复检测
- [ ] 跑通 `npm run graph` 看到 LangGraph interrupt → resume 流程
- [ ] 理解 MemorySaver 是 RAM-only 的限制

## 我的笔记

<!-- 在这里记录学习过程中的理解和疑问 -->
