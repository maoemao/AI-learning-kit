import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Memory } from './memory.js';
import { readIndex } from './store.js';
import { execute } from './agent.js';
const s=new McpServer({name:'docs-memory-learning',version:'1.0.0'});
const m=new Memory(process.env.LAB_MEMORY_DB||'data/lab-memory.sqlite');
const json=(v:unknown)=>({content:[{type:'text' as const,text:JSON.stringify(v)}]});
s.tool('search_docs','Read-only pinned Element Plus documentation',{query:z.string().min(1).max(500),version:z.literal('2.11.8')},async a=>json(execute('search_docs',a,readIndex())));
s.tool('memory_search','Search an exact scope (scope is NOT authentication)',{scope:z.string().min(1),query:z.string().min(1)},async a=>json(m.search(a.scope,a.query)));
s.tool('memory_save','Only store user-confirmed durable facts. Local teaching database only.',{scope:z.string().min(1),content:z.string().min(1),source:z.string().min(1),confirmed:z.boolean()},async a=>{
 try{return json(m.save(a.scope,a.content,a.source,a.confirmed));}catch{return {...json({error:'MEMORY_REJECTED'}),isError:true};}
});
await s.connect(new StdioServerTransport());
console.error('Learning MCP ready; logs only on stderr.');
