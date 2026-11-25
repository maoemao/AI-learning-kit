import { readFileSync,writeFileSync,mkdirSync,renameSync,existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Chunk } from './retrieval.js';
export const INDEX='data/index.json';
export function readIndex():Chunk[]{return JSON.parse(readFileSync(INDEX,'utf8'));}
export function saveIndex(chunks:Chunk[]){
 mkdirSync(dirname(INDEX),{recursive:true});
 writeFileSync(INDEX+'.tmp',JSON.stringify(chunks,null,2));renameSync(INDEX+'.tmp',INDEX);
}
export function cacheKey(q:string,version:string,chunks:Chunk[],model:string){
 return JSON.stringify([q,version,model,chunks.filter(c=>c.active).map(c=>[c.id,c.hash]).sort()]);
}
export class Cache<T>{
 private m=new Map<string,{value:T,until:number}>();
 get(key:string){const v=this.m.get(key);if(!v)return; if(v.until<Date.now()){this.m.delete(key);return;}return v.value;}
 set(key:string,value:T,ttl=30000){this.m.set(key,{value,until:Date.now()+ttl});}
 clear(){this.m.clear();}
}
