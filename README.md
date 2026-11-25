# AI 应用开发深入学习 · 50 期学习仓库

个人 AI 学习项目，基于"AI 应用开发深入学习 50 期"教学包整理。

## 快速开始

1. **通读手册** — 打开 `00-handbook/AI应用开发深入学习-50期离线手册.html`，浏览 50 课全景
2. **搭建环境** — 进入 `ai-lab/`，按 README 跑通代码
3. **按阶段学习** — 从 `01-llm-basics/` 开始，每阶段精读 + 动手

## 目录结构

```
├── 00-handbook/          离线阅读资料（手册、原始文件）
├── 01-llm-basics/        阶段一：LLM 与开发基础（5 课）
├── 02-rag-basics/        阶段二：RAG 基础与真实检索（7 课）
├── 03-advanced-rag/      阶段三：高级 RAG 与质量评估（8 课）
├── 04-workflow-agent/    阶段四：Workflow 与 Agent（8 课）
├── 05-mcp-memory/        阶段五：MCP、Skills 与 Memory（8 课）
├── 06-engineering/       阶段六：工程化与安全（8 课）
├── 07-capstone/          阶段七：综合项目交付（6 课）
├── ai-lab/               官方配套 TypeScript 实践代码（保持原样）
└── notes/                个人笔记与总结
```

## 环境要求

- Node.js ≥ 22.13（实测 22.23.3）
- 默认 extractive 模式无需模型；接真实模型需 Ollama 或云端 API key

## 配套代码快速验证

```sh
cd ai-lab
npm ci
npm run build
npm run ingest
npm test
npm start          # http://127.0.0.1:8787
```
