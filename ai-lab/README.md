# AI 应用开发 50 期 TypeScript 实践仓库

贯穿项目：Element Plus 2.11.8 官方组件文档助手；第二项目：独立 SQLite + MCP 记忆教学服务。

## 1. 从零启动（macOS / Linux / Windows 终端）

需要 Node.js 22.13+；本轮实际使用 Node 22.23.3。安装依赖需要联网。下载 ZIP 后进入 `ai-lab` 文件夹：

```sh
npm ci
npm run build
npm run ingest
npm test
npm run eval
npm run ask -- "button loading" "2.11.8"
npm run mcp:check
npm run agent:mcp:check
npm run graph
npm start
```

打开 http://127.0.0.1:8787 。预期：导入 66 chunks；默认输出 `extractive-not-LLM`，展示官方小节与引用。它没有调用模型。缺版本会澄清。`npm test` 使用临时 SQLite，不访问真实记忆库。

若 `node:sqlite` 不存在，升级到规定 Node 版本。若端口被占用，在 `.env` 改 PORT。SQLite experimental 警告是此 Node 版本的 API 状态提示，不是测试失败。运行命令必须在仓库根目录，`dist` 由 build 生成。

## 2. 真正调用本地模型

先从 Ollama 官方站安装程序并启动本地服务，然后下载模型（首次需要网络、磁盘和足够内存；未在本轮实际运行）：

```sh
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

把 `.env.example` 复制为 `.env`，设置 `PROVIDER=ollama`。无需 API 密钥。模型名可换为你本机实际可用、支持相应能力的模型。

```sh
npm run ask -- "How to show loading on Button?" "2.11.8"
npm run vectors -- "How to show loading on Button?"
npm run agent -- "Element Plus 2.11.8: button loading default?"
```

预期：ask mode=ollama，模型返回 JSON 后经 Zod 和引用成员校验；vectors 写入 data/vectors.json；agent 有真实模型决策与工具轨迹。模型可能返回不合法 JSON/工具调用，这应记录为失败，而不是隐藏。当前提示词 JSON 不是原生 strict schema decoding。

## 3. 云端模型

在自己的模型供应商账户创建可用的 API key（可能产生费用）。只在本地 `.env` 设置：

```dotenv
PROVIDER=openai
OPENAI_API_KEY=你的实际密钥
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

再运行 ask/agent/start。key 不出现在前端。模型可用性与账户权限自行核对；示例模型名不是永久可用性承诺。本轮没有使用真实云端密钥或产生云模型调用。问题与选中资料会发给供应商。

## 4. 已实际运行的本地 E5 embedding

它是独立可选路径，不依赖 Ollama、不生成答案。模型与依赖不打包进 ZIP（模型约 129 MiB）。

```sh
npm install --prefix optional/e5
node scripts/download-e5.mjs
# macOS / Linux
E5_MODEL_DIR="$PWD/data/models/e5" node scripts/e5-real.mjs
```

Windows PowerShell：

```powershell
$env:E5_MODEL_DIR = (Join-Path $PWD "data/models/e5")
node scripts/e5-real.mjs
```

固定模型 Xenova/multilingual-e5-small，revision `761b726dd34fb83930e26aab4e9ac3899aa1fa78`，Transformers.js 3.8.1，q8 CPU，mean pooling、normalize、query/passage 前缀、512 token 截断。脚本禁用运行时远程模型加载。下载器校验配套清单 hash；实际断网运行仍应由读者在本机确认。

预期：384维、66片段；英文示例 top1 `button:7`。实际本轮记录见 docs/e5-result.json。E5 长表可能截断；问答预算对超长表按 query 选完整行并保留原表头与 canonical ID/hash，仍不保证覆盖所有跨行关系。单查询排名不是整体质量保证。E5_TRANSFORMERS_MODULE 可指定现有安装模块绝对路径；本轮复用了本机已有依赖与模型，只处理公开文档，未读真实记忆库。

## 5. 可选 Qdrant（本轮未运行）

需要 Docker 或其他 Qdrant 安装。先完成 vectors/E5，生成 data/vectors.json：

```sh
docker run --rm --name rag-learning -p 127.0.0.1:6333:6333 -v rag-learning-data:/qdrant/storage qdrant/qdrant:v1.15.1
npm run qdrant
```

这是明确版本示例，不声称最新版本。代码创建独立 learning_docs_2118 集合，重复创建报错，不自动删除现有集合。使用一次性学习环境并校验服务实际版本。没有 Docker 时精确向量扫描已足以完成基础学习。

## 6. 目录与真实边界

- src/retrieval.ts：真实 BM25、切块、余弦、RRF、ID证据组指标。
- src/model.ts：真实 Ollama/OpenAI HTTP 适配；云端/本地生成本轮未实测。
- src/advanced.ts：词典改写、标识符启发式重排、父扩展、受限并发；不是学习型 reranker/HyDE/Multi-Agent。
- src/agent.ts：进程内工具闭环；src/mcp-agent.ts：真实 MCP 只读适配，开放 search_docs 与限定 lesson scope 的 memory_search，不暴露记忆写工具。agent:mcp:check 使用 scripted 决策＋真实协议＋真实临时 SQLite；agent:mcp 使用真实模型路径，本轮未测试真实模型决策。
- src/mcp-*.ts：真实 stdio SDK；测试使用临时库，不修改任何 AI 客户端配置。
- src/memory.ts：独立 SQLite 教学实现，不是现有 ai-memory-mcp 全量移植。
- src/graph.ts：真实 LangGraph interrupt/resume；MemorySaver 为 RAM-only。
- src/telemetry.ts：真实 SDK 初始化/包装＋allowlist JSON；未启用完整HTTP tracing或外部 exporter。
- src/server.ts/public：只绑定回环地址；回答缓冲完成后用 SSE 传块，**不是供应商 token stream**。没有断线重放、多用户认证或生产审批。
- Dockerfile / .github：构建与 CI 示例，未在本轮实际运行 Docker 或 GitHub CI。

依赖版本由 package-lock.json 锁定。OpenTelemetry sdk-trace-node 2.12.0 的 npm 弃用提示已知；教学代码使用锁定 API，后续迁移到 sdk-trace 包应重新编译与验证，不盲目追最新版。

## 7. 输入、许可与评测

四份 MIT 许可的 Element Plus 官方文档在 data/docs/，固定 tag 2.11.8。docs/sources.json 包含来源与 SHA-256。仅为有限教学快照，没有展开所有 :::demo 的 Vue 样例文件。

evals/dev.json 是公开教学开发集；无独立留出集，标签由人编写。`eval` 输出 ID 指标，不运行 LLM judge，不自动发布门禁。中文 query 的词法失败被保留。详见 docs/acceptance.md 和 docs/validation.json。

## 8. 从已编译 JS 开始

ZIP 也提供 dist/，仍需 `npm ci` 安装运行依赖。HTML 可完全离线阅读；依赖和模型未缓存时，代码不能凭 ZIP 在全新机器断网运行。
