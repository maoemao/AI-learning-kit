import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { ask } from './rag.js';
import { readIndex } from './store.js';
const port=Number(process.env.PORT||8787);
const server=createServer(async(req,res)=>{
 const path=new URL(req.url||'/',`http://127.0.0.1:${port}`).pathname;
 if(req.method==='GET'&&(path==='/'||path==='/sse.js')){
   res.writeHead(200,{'content-type':path==='/'?'text/html; charset=utf-8':'text/javascript; charset=utf-8'});
   res.end(readFileSync(path==='/'?'public/index.html':'dist/sse.js'));return;
 }
 if(path!=='/api/ask'||req.method!=='POST'){res.writeHead(404).end();return;}
 if(req.headers.origin&&!([`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin))){res.writeHead(403).end();return;}
 const ac=new AbortController();res.on('close',()=>ac.abort());
 try{
  const parts:Buffer[]=[];let bytes=0;for await(const piece of req){const b=Buffer.from(piece);bytes+=b.length;if(bytes>8192){res.writeHead(413).end();return;}parts.push(b);}
  const p=JSON.parse(Buffer.concat(parts).toString('utf8'));if(typeof p.question!=='string'||!p.question.trim()||p.question.length>1000)throw Error('BAD_REQUEST');
  if(p.version!==undefined&&p.version!=='2.11.8')throw Error('BAD_VERSION');
  res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff'});
  const emit=(event:string,data:unknown)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  emit('state',{state:'retrieving'});
  const timer=setInterval(()=>res.write(': heartbeat\n\n'),10000);
  try{
   const result=await ask(p.question,readIndex(),p.version,ac.signal);
   // Recheck active sources immediately before emitting content or citations (no stale cached chunks).
   const active=new Map(readIndex().filter(c=>c.active).map(c=>[c.id,c.hash]));
   if(result.sources.some(c=>active.get(c.id)!==c.hash))throw Error('SOURCE_RETIRED');
   emit('meta',{mode:result.mode,note:'Answer is buffered then sent in blocks; not provider token streaming.'});
   for(const claim of result.answer.claims){if(ac.signal.aborted)return;emit('delta',{text:claim.text+' '+claim.citations.map(x=>'['+x+']').join(' ')+'\n\n'});}
   emit('sources',result.sources.map(c=>({id:c.id,url:c.source,section:c.section,hash:c.hash})));
   emit('done',{status:result.answer.status});res.end();
  }finally{clearInterval(timer);}
 }catch{
  if(res.headersSent){if(!res.destroyed)res.end('event: error\ndata: {"code":"REQUEST_FAILED"}\n\n');}
  else res.writeHead(400,{'content-type':'application/json'}).end('{"error":"INVALID_REQUEST"}');
 }
});
server.listen(port,'127.0.0.1',()=>console.log(`Local-only learning app: http://127.0.0.1:${port}`));
