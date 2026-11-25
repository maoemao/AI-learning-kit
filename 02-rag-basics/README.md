# 阶段二：RAG 基础与真实检索（7 课）

## 课程清单

1. RAG 总览：把知识管道分成两条
2. 清洗与元数据：保持原文含义
3. Chunking：让需要一起出现的证据一起返回
4. Embedding：真实向量、余弦与模型身份
5. 向量存储：先精确扫描，再引入 ANN
6. BM25：建立能解释的真实检索基线
7. 最小 RAG：贯通检索、生成与引用

## 配套代码

- `ai-lab/src/retrieval.ts` — BM25 检索、切块、余弦相似度、RRF（核心文件，4248 字节）
- `ai-lab/src/rag.ts` — 检索→生成→引用验证闭环
- `ai-lab/src/cli.ts` — `ingest` / `ask` / `vectors` 命令入口
- `ai-lab/src/store.ts` — 文档加载与索引管理
- `ai-lab/src/qdrant.ts` — Qdrant 向量数据库集成（可选）

## 学习目标

- [ ] 画出 RAG 的索引管道和查询管道
- [ ] 理解 chunking 策略对检索质量的影响
- [ ] 能解释 BM25 和向量检索各自的优缺点
- [ ] 跑通 `npm run ingest` 看到 66 chunks 被导入
- [ ] 跑通 `npm run ask -- "button loading" "2.11.8"` 看到检索结果
- [ ] 理解引用验证（citation validation）为什么重要

## 我的笔记

<!-- 在这里记录学习过程中的理解和疑问 -->
