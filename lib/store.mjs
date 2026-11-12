import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
export class Store{
 constructor(path){if(path!==':memory:')mkdirSync(new URL('../data/',import.meta.url),{recursive:true});this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');}
 get(key,fallback=null){const r=this.db.prepare('SELECT value FROM kv WHERE key=?').get(key);return r?JSON.parse(r.value):fallback;}
 put(key,value){this.db.prepare('INSERT INTO kv VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));return value;}
 close(){this.db.close();}
}
