# ai-memory-mcp：独立项目阅读指南

本次只读检查本机项目的 package.json、README、embedding.js 与 index.js：版本 0.4.0。没有更改项目、配置或真实记忆数据库，也没有在这个项目上重跑全部测试。

这不是本仓库教学 Memory 的功能声明。原项目源码路径仅适用于原作者电脑；其他读者请打开自己授权的源码副本。没有公共仓库地址时，不编造 clone URL。

|阅读顺序|关注点|独立验收|
|---|---|---|
|src/index.js|六个工具、参数范围、stdout/stderr|真实 SDK listTools/callTool|
|src/policy.js|候选证据类型、临时/不确定/敏感跳过|手工与自动入口分别验收|
|src/memory.js|scope、精确去重、expected_content 更新|冲突不能覆盖|
|src/embedding.js|E5 revision、前缀、pooling、512 token|真实本地推理维度与缓存身份|
|src/vector-search.js|精确余弦、RRF、fallback|semantic 失败与 hybrid 降级分开|
|src/markdown-sync.js|单向同步、源所有权、删除与冲突|手动编辑不覆盖，扫描失败不当删除|

阅读后在隔离副本查阅 package scripts。测试使用临时数据库，自动 Markdown 同步也必须禁用或指向临时根；先检查脚本内部的环境覆盖再运行。不要将教学语料导入真实 ~/.ai-memory/memory.db。原项目脚本名称与教学版不同，不要交叉使用。

原项目 README 说明其本地向量测试、Markdown 同步测试等能力，这是源码资料描述，不能记作本轮运行通过。当前交付只对学习仓库的 SQLite、MCP、LangGraph、公开语料 E5 做了实际验证。
