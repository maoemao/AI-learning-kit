import { DatabaseSync } from 'node:sqlite';
export class Memory{
 db:DatabaseSync;
 constructor(file='data/lab-memory.sqlite'){
  this.db=new DatabaseSync(file);this.db.exec(`PRAGMA journal_mode=WAL;
   CREATE TABLE IF NOT EXISTS memories(id INTEGER PRIMARY KEY, scope TEXT NOT NULL, content TEXT NOT NULL, source TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL, UNIQUE(scope,content));`);
 }
 save(scope:string,content:string,source:string,confirmed=false){
  if(!confirmed)throw Error('CONFIRMATION_REQUIRED');
  if(!scope.trim()||!content.trim()||!source.trim())throw Error('EMPTY_MEMORY_FIELD');
  // Teaching guard only; no regex can guarantee detection of all secrets.
  if(/sk-[a-z0-9]{8,}|password\s*[:=]|api[_ -]?key\s*[:=]/i.test(content))throw Error('POSSIBLE_SECRET');
  this.db.prepare('INSERT OR IGNORE INTO memories(scope,content,source,updated) VALUES(?,?,?,?)').run(scope,content.trim(),source,new Date().toISOString());
  return this.db.prepare('SELECT * FROM memories WHERE scope=? AND content=?').get(scope,content.trim());
 }
 search(scope:string,q:string){return this.db.prepare("SELECT * FROM memories WHERE scope=? AND instr(lower(content),lower(?))>0 ORDER BY id DESC LIMIT 20").all(scope,q);}
 update(id:number,scope:string,revision:number,content:string){
  if(!content.trim()||/sk-[a-z0-9]{8,}|password\s*[:=]|api[_ -]?key\s*[:=]/i.test(content))throw Error('INVALID_CONTENT');
  const r=this.db.prepare('UPDATE memories SET content=?,revision=revision+1,updated=? WHERE id=? AND scope=? AND revision=?').run(content,new Date().toISOString(),id,scope,revision);
  if(r.changes!==1)throw Error('REVISION_CONFLICT');
 }
 forget(id:number,scope:string){return this.db.prepare('DELETE FROM memories WHERE id=? AND scope=?').run(id,scope).changes;}
 close(){this.db.close();}
}
