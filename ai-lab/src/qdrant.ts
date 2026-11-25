import { readFileSync } from 'node:fs';
const base=process.env.QDRANT_URL||'http://127.0.0.1:6333';
const collection='learning_docs_2118';
const v=JSON.parse(readFileSync('data/vectors.json','utf8'));
async function call(path:string,method='GET',body?:unknown){
 const r=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error(`QDRANT_${r.status}`);return r.json();
}
if(!v.items?.length)throw Error('RUN_VECTORS_FIRST');
await call(`/collections/${collection}`,'PUT',{vectors:{size:v.items[0].vector.length,distance:'Cosine'}});
await call(`/collections/${collection}/points?wait=true`,'PUT',{points:v.items.map((x:any,i:number)=>({id:i+1,vector:x.vector,payload:{chunk_id:x.id,version:'2.11.8',active:true}}))});
console.log(await call(`/collections/${collection}/points/query`,'POST',{query:v.queryVector,limit:3,with_payload:true,filter:{must:[{key:'version',match:{value:'2.11.8'}},{key:'active',match:{value:true}}]}}));
console.log('Dedicated learning collection created; rerun requires deleting it deliberately or choosing a new collection. No production collection is touched.');
