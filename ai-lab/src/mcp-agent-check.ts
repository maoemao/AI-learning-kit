import { mcpAgent } from './mcp-agent.js';
import { Memory } from './memory.js';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'mcp-agent-check-'));
process.env.LAB_MEMORY_DB=join(dir,'x.sqlite');
const m=new Memory(process.env.LAB_MEMORY_DB);m.save('lesson','Prefer TypeScript examples','explicit integration fixture',true);m.close();
let step=0;
try{
 const result=await mcpAgent('button loading, prefer TypeScript',async(messages,tools)=>{
  assert.equal(tools.some(t=>t.function.name==='memory_save'),false);
  if(step++===0)return {content:null,tool_calls:[{id:'s1',type:'function',function:{name:'search_docs',arguments:'{"query":"button loading","version":"2.11.8"}'}},{id:'s2',type:'function',function:{name:'memory_search',arguments:'{"scope":"lesson","query":"TypeScript"}'}}]};
  const observations=messages.filter(m=>m.role==='tool');assert.equal(observations.length,2);
  assert.match(observations[0].content||'',/button:7/);assert.match(observations[1].content||'',/Prefer TypeScript/);
  return {content:'SCRIPTED FIXTURE: set loading=true [button:7]. Memory preference is background, not API evidence.'};
 });assert.equal(result.trace.length,2);assert.ok(result.trace.every(x=>!x.isError));
 console.log(JSON.stringify({kind:'REAL Agent -> MCP -> docs + SQLite, SCRIPTED model decisions, no LLM',...result},null,2));
}finally{rmSync(dir,{recursive:true,force:true});}
