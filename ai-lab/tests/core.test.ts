import { describe,it,expect } from 'vitest';
import { chunkMarkdown,bm25,cosine,rrf,metrics,hash,tableExcerpt,budget } from '../src/retrieval.js';
import { Answer,validateCitations,ask } from '../src/rag.js';
import { execute,runAgent } from '../src/agent.js';
import { safeEvent } from '../src/telemetry.js';
import { Cache,cacheKey } from '../src/store.js';
import { SSEParser } from '../src/sse.js';
import { Memory } from '../src/memory.js';
import { buildGraph,nodeRuns } from '../src/graph.js';
import { Command } from '@langchain/langgraph';
import { rewrite,multiQuery,rerank,parentExpand,parallel,contextBudget,route } from '../src/advanced.js';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const docs=chunkMarkdown('# Button\nintro\n## Loading\nloading boolean false\n## Disabled\ndisabled boolean false','button');
describe('retrieval and evidence',()=>{
 it('keeps table row evidence together and metadata',()=>{
 const c=chunkMarkdown('# Button\n## API\n|name|default|\n|loading|false|','button')[1];
 expect(c.text).toContain('|loading|false|');expect(c.version).toBe('2.11.8');expect(c.hash).toBe(hash(c.text));
 });
 it('query-aware table excerpt retains column labels, complete row and canonical identity',()=>{
 const c={...docs[1],text:'## API\n### Attributes\n| Name | Type | Default |\n| --- | --- | --- |\n| loading | boolean | false |\n| padding | number | 0 |\n'+('noise '.repeat(1100))};
 const selected=budget([c],6000,'button loading default')[0];
 expect(selected.text).toContain('| Name | Type | Default |');expect(selected.text).toContain('| loading | boolean | false |');
 expect(selected.text).not.toContain('noise');expect(selected.hash).toBe(c.hash);expect(selected.id).toBe(c.id);
 });
 it('BM25 returns actual matching section',()=>expect(bm25('loading',docs)[0].chunk.section).toBe('Loading'));
 it('filters wrong version before ranking',()=>expect(bm25('loading',docs,'1.0.0')).toEqual([]));
 it('filters retired documents',()=>expect(bm25('loading',docs.map(c=>({...c,active:false})))).toEqual([]));
 it('cosine rejects mismatch zero nan',()=>{expect(()=>cosine([1],[1,2])).toThrow();expect(()=>cosine([0],[0])).toThrow();expect(()=>cosine([NaN],[1])).toThrow();expect(cosine([1,0],[1,0])).toBe(1);});
 it('RRF fuses ranks and deduplicates within each list',()=>expect(rrf([['a','a'],['b','a']])[0][0]).toBe('a'));
 it('high precision can still miss required evidence',()=>expect(metrics(['K1'],[['K1'],['K2']])).toMatchObject({precision:1,recall:.5,complete:false}));
 it('equivalent evidence is OR not AND',()=>expect(metrics(['K1b','K2'],[['K1','K1b'],['K2']]).complete).toBe(true));
 it('unanswerable denominator is not zero divided by zero',()=>expect(metrics(['K1'],[]).recall).toBeNull());
 it('duplicate IDs cannot inflate recall',()=>expect(metrics(['K1','K1'],[['K1'],['K2']]).recall).toBe(.5));
 it('runtime schema rejects invented status',()=>expect(()=>Answer.parse({status:'probably',claims:[]})).toThrow());
 it('citation must exist among supplied active chunks',()=>expect(()=>validateCitations({status:'answer',claims:[{text:'x',citations:['ghost']}]},docs)).toThrow('INVALID_CITATION'));
 it('answer must carry citations',()=>expect(()=>validateCitations({status:'answer',claims:[{text:'x',citations:[]}]},docs)).toThrow());
 it('missing version asks clarification',async()=>expect((await ask('loading',docs)).answer.status).toBe('clarify'));
 it('empty retrieval is unknown, not unsupported',async()=>expect((await ask('unicorn',docs,'2.11.8')).answer.status).toBe('unknown'));
 it('extractive path is explicitly not a model',async()=>{const p=process.env.PROVIDER;process.env.PROVIDER='extractive';try{expect((await ask('loading',docs,'2.11.8')).mode).toBe('extractive-not-LLM');}finally{if(p===undefined)delete process.env.PROVIDER;else process.env.PROVIDER=p;}});
});
describe('agent authority and stop budgets',()=>{
 it('rejects unknown tool and extra args',()=>{expect(()=>execute('shell',{},docs)).toThrow('TOOL_NOT_ALLOWED');expect(()=>execute('search_docs',{query:'loading',version:'2.11.8',url:'http://evil'},docs)).toThrow();});
 it('tool call is round-tripped before final answer; scripted decision fixture',async()=>{
 let n=0;const r=await runAgent('loading?',docs,async m=>{
 if(n++===0)return {content:null,tool_calls:[{id:'a',type:'function',function:{name:'search_docs',arguments:JSON.stringify({query:'loading',version:'2.11.8'})}}]};
 expect(m.at(-1)?.role).toBe('tool');return {content:'loading [button:1]'};
 });expect(r.trace).toEqual(['search_docs']);expect(r.stop).toBe('final');
 });
 it('stops repeated tool calls; scripted decision fixture',async()=>expect(runAgent('q',docs,async()=>({content:null,tool_calls:[{id:'x',function:{name:'search_docs',arguments:'{"query":"loading","version":"2.11.8"}'}}]}))).rejects.toThrow('REPEATED_TOOL'));
 it('step budget stops no-final loop',async()=>expect(runAgent('q',docs,async()=>({content:'x',tool_calls:[{function:{name:'bad',arguments:'{}'}}]}),1)).rejects.toThrow('STEP_BUDGET'));
});
describe('persistence and cache',()=>{
 it('SQLite restart, scope, optimistic update, conflict, forget and policy',()=>{
 const dir=mkdtempSync(join(tmpdir(),'learning-memory-'));let m=new Memory(join(dir,'x.sqlite'));
 try{
 expect(()=>m.save('a','hello','fixture')).toThrow('CONFIRMATION_REQUIRED');
 expect(()=>m.save('a','api_key=demo','fixture',true)).toThrow();
 const a=m.save('a','Prefer TypeScript','fixture',true) as any;
 expect((m.save('a','Prefer TypeScript','fixture',true) as any).id).toBe(a.id);
 expect(m.search('b','TypeScript')).toEqual([]);m.close();m=new Memory(join(dir,'x.sqlite'));
 expect(m.search('a','TypeScript')).toHaveLength(1);
 m.update(a.id,'a',1,'Prefer JS');expect(()=>m.update(a.id,'a',1,'stale')).toThrow('REVISION_CONFLICT');
 expect(m.forget(a.id,'b')).toBe(0);expect(m.forget(a.id,'a')).toBe(1);expect(m.search('a','JS')).toEqual([]);
 }finally{m.close();rmSync(dir,{recursive:true,force:true});}
 });
 it('cache key changes on source content model or retirement',()=>{
 const k=cacheKey('q','2.11.8',docs,'m');expect(cacheKey('q','2.11.8',docs.map(c=>({...c,active:false})),'m')).not.toBe(k);
 expect(cacheKey('q','2.11.8',docs,'m2')).not.toBe(k);
 });
 it('expired entries do not return',()=>{const c=new Cache();c.set('a',1,-1);expect(c.get('a')).toBeUndefined();});
});
describe('SSE real parser with adversarial fragmentation',()=>{
 const text=': heartbeat\r\nevent: delta\r\ndata: 中文\r\ndata: 第二行\r\n\r\nevent: done\ndata: {}\n\n';
 it('every byte cut preserves UTF8 CRLF multiline and done',()=>{
 const bytes=new TextEncoder().encode(text);
 for(let i=0;i<=bytes.length;i++){
 const out:any[]=[];const p=new SSEParser(e=>out.push(e));p.push(bytes.slice(0,i));p.push(bytes.slice(i));p.end();
 expect(out).toEqual([{event:'delta',data:'中文\n第二行'},{event:'done',data:'{}'}]);
 }
 });
 it('empty event field defaults to message',()=>{const out:any[]=[];const p=new SSEParser(e=>out.push(e));p.push(new TextEncoder().encode('event:\ndata: x\n\n'));p.end();expect(out).toEqual([{event:'message',data:'x'}]);});
 it('one byte at a time',()=>{const out:any[]=[];const p=new SSEParser(e=>out.push(e));for(const b of new TextEncoder().encode(text))p.push(Uint8Array.of(b));p.end();expect(out).toHaveLength(2);});
 it('EOF without blank delimiter does not forge completion',()=>{const out:any[]=[];const p=new SSEParser(e=>out.push(e));p.push(new TextEncoder().encode('event: done\ndata: {}'));p.end();expect(out).toEqual([]);});
});
describe('engineering and advanced labs',()=>{
 it('allowlisted final serialized telemetry removes nested private marker',()=>{
 const input={stage:'retrieve',requested_version:'2.11.8',retrieved_versions:['2.11.7'],error_type:'VERSION_MISMATCH',metadata:{debug:{note:'DEMO_PRIVATE_29'}},exception:'DEMO_PRIVATE_29'};
 expect(JSON.stringify(input)).toContain('DEMO_PRIVATE_29');const s=JSON.stringify(safeEvent(input));expect(s).not.toContain('DEMO_PRIVATE_29');expect(s).toContain('VERSION_MISMATCH');
 });
 it('telemetry uncontrolled values cannot smuggle text',()=>expect(JSON.stringify(safeEvent({stage:'secret',requested_version:'secret',error_type:'secret'}))).not.toContain('secret'));
 it('LangGraph pauses and restarts node on resume in same thread',async()=>{
 const before=nodeRuns.count,g=buildGraph(),cfg={configurable:{thread_id:'test'}};
 const a=await g.invoke({question:'q'},cfg);expect(a.__interrupt__).toHaveLength(1);
 const b=await g.invoke(new Command({resume:'2.11.8'}),cfg);expect(b.version).toBe('2.11.8');expect(nodeRuns.count-before).toBe(2);
 });
 it('deterministic rewrite is labeled and executable',()=>{expect(rewrite('按钮转圈')).toBe('buttonloading');expect(multiQuery('loading',docs)[0][0]).toBe('button:1');});
 it('identifier heuristic reranker',()=>expect(rerank('`disabled`',docs)[0].c.section).toBe('Disabled'));
 it('parent expansion keeps full document and active policy',()=>expect(parentExpand(['button:1'],docs)).toHaveLength(3));
 it('bounded parallel jobs preserve order',async()=>{let live=0,peak=0;const out=await parallel([0,1,2,3].map(i=>async()=>{live++;peak=Math.max(peak,live);await new Promise(r=>setTimeout(r,2));live--;return i;}),2);expect(out).toEqual([0,1,2,3]);expect(peak).toBe(2);});
 it('context priority and budget are enforced',()=>expect(contextBudget([{priority:1,text:'aaa'},{priority:9,text:'xx'}],3)).toEqual([{priority:9,text:'xx'}]));
 it('fixed workflow routes are explicit',()=>{expect(route()).toBe('clarify');expect(route('2.11.8',0)).toBe('unknown');expect(route('2.11.8',2)).toBe('answer');});
});
