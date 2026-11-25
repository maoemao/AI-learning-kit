import { createHash } from 'node:crypto';
export type Chunk = { id:string; doc:string; component:string; version:string; source:string; section:string; text:string; hash:string; snapshot:string; active:boolean };
export const SNAPSHOT='element-plus@2.11.8';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function chunkMarkdown(raw:string, doc:string):Chunk[]{
  // Keep complete Markdown sections (including tables). Oversized sections must be split further in production.
  const clean=raw.replace(/^\uFEFF/, '').replace(/^---[\s\S]*?---\s*/, '').trim();
  return clean.split(/(?=^## )/m).filter(x=>x.trim()).map((text,i)=>{
    const section=text.split('\n')[0].replace(/^#+\s*/, '');
    return {id:`${doc}:${i}`,doc,component:doc,version:'2.11.8',snapshot:SNAPSHOT,
      source:`https://github.com/element-plus/element-plus/blob/2.11.8/docs/en-US/component/${doc}.md`,
      section,text:text.trim(),hash:hash(text.trim()),active:true};
  });
}
export function tokens(s:string):string[]{
  // Identifier-aware English lexical baseline + Chinese bigrams, NOT a model tokenizer.
  const t=s.normalize('NFKC').toLowerCase();
  const en=t.match(/[a-z0-9_-]+/g)??[];
  const zh=[...t.matchAll(/[\u3400-\u9fff]+/g)].flatMap(m=>Array.from({length:Math.max(0,m[0].length-1)},(_,i)=>m[0].slice(i,i+2)));
  return [...en,...zh];
}
export function bm25(q:string,docs:Chunk[],version='2.11.8'){
  const corpus=docs.filter(d=>d.active&&d.version===version), ts=corpus.map(d=>tokens(d.text));
  const avg=ts.reduce((s,t)=>s+t.length,0)/(ts.length||1), query=[...new Set(tokens(q))];
  return corpus.map((c,i)=>({chunk:c,score:query.reduce((s,w)=>{
    const f=ts[i].filter(x=>x===w).length;if(!f)return s;
    const df=ts.filter(t=>t.includes(w)).length,k=1.2,b=.75;
    const idf=Math.log(1+(corpus.length-df+.5)/(df+.5));
    return s+idf*f*(k+1)/(f+k*(1-b+b*ts[i].length/(avg||1)));
  },0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.chunk.id.localeCompare(b.chunk.id));
}
export function cosine(a:number[],b:number[]){
  if(!a.length||a.length!==b.length||[...a,...b].some(x=>!Number.isFinite(x)))throw Error('INVALID_VECTOR');
  const aa=a.reduce((s,x)=>s+x*x,0),bb=b.reduce((s,x)=>s+x*x,0);
  if(!aa||!bb)throw Error('ZERO_VECTOR');
  return a.reduce((s,x,i)=>s+x*b[i],0)/Math.sqrt(aa*bb);
}
export function rrf(lists:string[][],k=60){
  const s=new Map<string,number>();
  for(const list of lists)for(const [i,id] of [...new Set(list)].entries())s.set(id,(s.get(id)||0)+1/(k+i+1));
  return [...s].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}
export function tableExcerpt(c:Chunk,q:string):Chunk{
 const stop=new Set(['button','dialog','input','select','default','value','what','how','the','is','a','to','of','on','and']);
 const query=tokens(q).filter(t=>!stop.has(t));
 if(!query.length)return c;
 const out=[`## ${c.section}`, '[Query-selected table rows; full canonical source is linked.]'];
 let heading='',header:string[]=[];
 const lines=c.text.split('\n');
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(/^###/.test(line))heading=line;
  if(line.startsWith('|')&&lines[i+1]?.match(/^\|[\s:|-]+\|/)){
    header=[line,lines[++i]];continue;
  }
  if(line.startsWith('|')&&header.length&&query.some(t=>tokens(line).includes(t))){
    if(heading){out.push(heading);heading='';}out.push(...header,line); // complete row + original columns
  }
 }
 return out.length>2?{...c,text:out.join('\n')}:c;
}
export function budget(cs:Chunk[],maxChars=6000,query=''){
  let used=0;return cs.map(c=>c.text.length>maxChars?tableExcerpt(c,query):c)
    .filter(c=>{if(used+c.text.length>maxChars)return false;used+=c.text.length;return true;});
}
export function metrics(retrieved:string[], required:string[][]){
 const r=[...new Set(retrieved)];
 // Each inner group contains interchangeable evidence for ONE required claim.
 if(!required.length)return {kind:'unanswerable' as const,precision:null,recall:null,complete:null};
 const allowed=new Set(required.flat()),hit=required.filter(g=>g.some(id=>r.includes(id))).length;
 return {kind:'answerable' as const,precision:r.length?r.filter(x=>allowed.has(x)).length/r.length:0,
   recall:hit/required.length,complete:hit===required.length};
}
