# 逐项验收表

状态只填 PASS / FAIL / NOT RUN，并附真实输出。原始文件保留在 bundle 的 original/；项目只使用仓库 data 目录。

|检查|操作|预期|
|---|---|---|
|清洁重建|npm ci && npm run build|无 TS 错误|
|导入|npm run ingest|2.11.8，66 chunks；改语料后需更新预期|
|词法|npm run eval|真实排名；中文失败保留；无答案 null|
|单元测试|npm test|结构、权限、停止、SSE、SQLite、Graph 通过|
|引用|npm run ask -- "button loading" "2.11.8"|source、id、version 可追溯|
|澄清|npm run ask -- "button loading"|status=clarify|
|真实模型|配置 PROVIDER 后运行 ask|记录模型、原始输出、Schema 与逐条证据；未调用则 NOT RUN|
|真实 embedding|scripts/e5-real.mjs 或 npm run vectors|真实向量与模型身份，不是人工数组|
|MCP|npm run mcp:check|发现3工具，真实搜索与临时 SQLite|
|Agent-MCP|npm run agent:mcp:check|真实协议、文档和临时记忆；决策为固定 fixture|
|Graph|npm run graph|暂停后恢复，节点运行2次，RAM检查点|
|HTTP|npm start；网页提问|SSE meta/delta/sources/done，引用可点击|
|取消与竞争|连续提问后停止|旧响应不覆盖，显示未完成|
|来源撤下|复制索引后 active=false|不返回；全量 ingest 会重建，应记录限制|
|Memory|npm test SQLite 用例|确认、scope、重启、revision 冲突、forget|
|遥测|npm test telemetry 用例|实际白名单 JSON 无 canary；OTel exporter 未覆盖|
|Docker/CI/Host|实际运行后填状态|不能仅凭配置文件存在写 PASS|

## 可选扩展，未冒充已完成

- LLM 原生 strict Structured Outputs、学习型 reranker、HyDE/LLM改写。
- 持久化 Graph checkpointer、跨用户身份与真实审批。
- Agent-MCP 适配已提供：npm run agent:mcp:check 是 scripted 决策＋真实搜索和临时 SQLite；npm run agent:mcp 是真实模型路径，需单独运行验收。Memory 写入仍不向 Agent 暴露。
- 模型供应商 token streaming，事件重放/断线恢复与取消上游。
- 完整增量导入/tombstone、向量失效与并发一致性。
- OTel 全链路导出与实际负载脱敏、压力测试、远程部署。

当前为本地教学工程，非生产安全认证。
