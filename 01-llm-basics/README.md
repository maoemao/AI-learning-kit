# 阶段一：LLM 与开发基础（5 课）

## 课程清单

1. LLM 与 Transformer：先理解预测，再做助手
2. Token、上下文窗口与推理预算
3. Prompt 与信任边界：写清契约
4. 真实 API、超时与失败：完成第一次调用
5. 结构化输出与模型选型

## 配套代码

- `ai-lab/src/model.ts` — Ollama / OpenAI HTTP 适配层，重点看 `chat()` 函数如何封装 API 调用

## 学习目标

- [ ] 理解 Transformer 预测下一个 token 的核心机制
- [ ] 知道 token 计数、上下文窗口长度对成本和性能的影响
- [ ] 能写出带约束的 system prompt
- [ ] 完成第一次真实 API 调用并处理超时/错误
- [ ] 理解 JSON mode / structured output 的工作方式

## 我的笔记

<!-- 在这里记录学习过程中的理解和疑问 -->
