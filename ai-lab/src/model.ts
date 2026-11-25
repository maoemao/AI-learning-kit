export type Message={role:'system'|'user'|'assistant'|'tool';content:string|null;tool_calls?:any[];tool_call_id?:string;tool_name?:string};
export type ChatResult={content:string|null;tool_calls?:any[]};
export type Tool={type:'function';function:{name:string;description:string;parameters:Record<string,unknown>}};
export async function requestJSON(url:string,body:unknown,headers:Record<string,string>={},signal?:AbortSignal){
 // Read-only inference requests only. Limit retries and respect caller cancellation.
 for(let attempt=0;attempt<3;attempt++){
   const timed=AbortSignal.timeout(45000), combined=signal?AbortSignal.any([signal,timed]):timed;
   const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body),signal:combined});
   if((r.status===429||r.status===503)&&attempt<2){
     const wait=Math.min(4000,Math.max(0,Number(r.headers.get('retry-after')||.5)*1000))+Math.random()*100;
     await new Promise<void>((resolve,reject)=>{
       if(signal?.aborted){reject(signal.reason);return;}
       const cancel=()=>{clearTimeout(t);reject(signal?.reason);};
       const t=setTimeout(()=>{signal?.removeEventListener('abort',cancel);resolve();},wait);
       signal?.addEventListener('abort',cancel,{once:true});
     });continue;
   }
   if(!r.ok)throw Error(`MODEL_HTTP_${r.status}`); // Do not log raw response bodies.
   return r.json();
 }
 throw Error('RETRY_EXHAUSTED');
}
export async function chat(messages:Message[],tools?:Tool[],signal?:AbortSignal):Promise<ChatResult>{
 const p=process.env.PROVIDER;
 if(p==='ollama'){
  const j=await requestJSON(`${process.env.OLLAMA_URL||'http://127.0.0.1:11434'}/api/chat`,
    {model:process.env.OLLAMA_MODEL||'qwen3:4b',messages:messages.map(m=>m.role==='tool'?{role:'tool',content:m.content,tool_name:m.tool_name}:m.tool_calls?{...m,tool_calls:m.tool_calls.map(c=>({function:{name:c.function.name,arguments:typeof c.function.arguments==='string'?JSON.parse(c.function.arguments):c.function.arguments}}))}:m),stream:false,...(tools?{tools}:{})},{},signal);
  return j.message;
 }
 if(p!=='openai')throw Error('SET_PROVIDER_ollama_OR_openai');
 if(!process.env.OPENAI_API_KEY)throw Error('MISSING_API_KEY');
 const j=await requestJSON(`${process.env.OPENAI_BASE_URL||'https://api.openai.com/v1'}/chat/completions`,
  {model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:messages.map(({tool_name,...m})=>m),...(tools?{tools}:{})},
  {authorization:`Bearer ${process.env.OPENAI_API_KEY}`},signal);
 if(!j.choices?.[0]?.message)throw Error('INVALID_CHAT_RESPONSE');
 return j.choices[0].message;
}
export async function embed(texts:string[]){
 const model=process.env.EMBED_MODEL||'nomic-embed-text';
 const j=await requestJSON(`${process.env.OLLAMA_URL||'http://127.0.0.1:11434'}/api/embed`,{model,input:texts,truncate:false});
 if(!Array.isArray(j.embeddings)||j.embeddings.length!==texts.length)throw Error('INVALID_EMBED_RESPONSE');
 return j.embeddings as number[][];
}
