import { readFileSync,readdirSync,writeFileSync } from 'node:fs';
import { chunkMarkdown,bm25,metrics,cosine,SNAPSHOT,hash } from './retrieval.js';
import { saveIndex,readIndex } from './store.js';
import { ask } from './rag.js';
import { embed } from './model.js';
import { runAgent } from './agent.js';
import { Memory } from './memory.js';
const [cmd,...args]=process.argv.slice(2);
if(cmd==='ingest'){
 const cs=readdirSync('data/docs').filter(f=>f.endsWith('.md')).flatMap(f=>chunkMarkdown(readFileSync('data/docs/'+f,'utf8'),f.slice(0,-3)));
 saveIndex(cs);console.log({snapshot:SNAPSHOT,chunks:cs.length,active:cs.filter(c=>c.active).length});
}else if(cmd==='ask')console.log(JSON.stringify(await ask(args[0]||'button loading',readIndex(),args[1]),null,2));
else if(cmd==='agent')console.log(await runAgent(args[0]||'Use Element Plus 2.11.8. How do I show button loading?',readIndex()));
else if(cmd==='eval'){
 const cases=JSON.parse(readFileSync('evals/dev.json','utf8'));
 const results=cases.map((c:any)=>{const hits=bm25(c.question,readIndex(),c.version).slice(0,c.k||4).map(x=>x.chunk.id);return {id:c.id,hits,...metrics(hits,c.required)};});
 const out={kind:'real lexical retrieval; human-authored ID labels, no LLM judge',snapshot:SNAPSHOT,results};
 writeFileSync('data/eval-result.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
}else if(cmd==='vectors'){
 const cs=readIndex().filter(c=>c.active);const query=args[0]||'How can I show a loading spinner on a button?';
 const vectors:number[][]=[];for(const c of cs)vectors.push((await embed([c.text]))[0]);
 const q=(await embed([query]))[0];
 const out={model:process.env.EMBED_MODEL||'nomic-embed-text',snapshot:SNAPSHOT,query,queryVector:q,items:cs.map((c,i)=>({id:c.id,hash:c.hash,vector:vectors[i]}))};
 writeFileSync('data/vectors.json',JSON.stringify(out));
 console.log(out.items.map(x=>({id:x.id,score:cosine(q,x.vector)})).sort((a,b)=>b.score-a.score).slice(0,5));
}else if(cmd==='memory'){
 const m=new Memory();try{const x=m.save('lesson','Prefer TypeScript examples','explicit CLI demo fixture',true);console.log(x,m.search('lesson','TypeScript'));}finally{m.close();}
}else throw Error('Usage: ingest | ask "query" "2.11.8" | eval | vectors | agent | memory');
