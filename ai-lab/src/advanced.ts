import { bm25,rrf,type Chunk } from './retrieval.js';
// Deterministic exercises; these are NOT LLM rewrites or learned rerankers.
export function rewrite(q:string){return q.replace(/转圈/g,'loading').replace(/禁用/g,'disabled').replace(/按钮/g,'button');}
export function multiQuery(q:string,docs:Chunk[]){return rrf([q,rewrite(q)].map(s=>bm25(s,docs).slice(0,8).map(x=>x.chunk.id)));}
export function rerank(q:string,docs:Chunk[]){
 const identifiers=q.match(/`([^`]+)`/g)?.map(x=>x.slice(1,-1))||[];
 return docs.map(c=>({c,score:identifiers.reduce((s,w)=>s+(c.text.includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score);
}
export function parentExpand(ids:string[],docs:Chunk[]){
 const parents=new Set(docs.filter(c=>ids.includes(c.id)).map(c=>c.doc));return docs.filter(c=>parents.has(c.doc)&&c.active);
}
export async function parallel<T>(jobs:(()=>Promise<T>)[],limit=2){
 if(!Number.isInteger(limit)||limit<1)throw Error('BAD_LIMIT');
 const out:T[]=new Array(jobs.length);let index=0;
 await Promise.all(Array.from({length:Math.min(limit,jobs.length)},async()=>{while(index<jobs.length){const i=index++;out[i]=await jobs[i]();}}));return out;
}
export function contextBudget(parts:{priority:number,text:string}[],maxChars:number){
 let used=0;return [...parts].sort((a,b)=>b.priority-a.priority).filter(p=>{if(used+p.text.length>maxChars)return false;used+=p.text.length;return true;});
}
export function route(version?:string,evidenceCount=0){return !version?'clarify':!evidenceCount?'unknown':'answer';}
