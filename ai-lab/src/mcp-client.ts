import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'docs-mcp-'));
const transport=new StdioClientTransport({command:process.execPath,args:['dist/mcp-server.js'],env:{...Object.fromEntries(Object.entries(process.env).filter((x):x is [string,string]=>typeof x[1]==='string')),LAB_MEMORY_DB:join(dir,'test.sqlite')},stderr:'pipe'});
const client=new Client({name:'learning-client',version:'1.0.0'});
try{
 await client.connect(transport);
 console.log('tools:',(await client.listTools()).tools.map(t=>t.name));
 const a=await client.callTool({name:'search_docs',arguments:{query:'button loading',version:'2.11.8'}});
 if(a.isError)throw Error('SEARCH_FAILED');console.log(JSON.stringify(a));
 const b=await client.callTool({name:'memory_save',arguments:{scope:'lesson',content:'Prefer TypeScript examples',source:'explicit test fixture',confirmed:true}});
 if(b.isError)throw Error('SAVE_FAILED');
 console.log(JSON.stringify(await client.callTool({name:'memory_search',arguments:{scope:'lesson',query:'TypeScript'}})));
}finally{await client.close();rmSync(dir,{recursive:true,force:true});}
