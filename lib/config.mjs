import {readFileSync,existsSync} from 'node:fs';
import {parseEnv} from 'node:util';
const path=new URL('../.env',import.meta.url);
const env={...(existsSync(path)?parseEnv(readFileSync(path,'utf8')):{}),...process.env};
export const config={port:Number(env.PORT||4333),model:env.AI_MODEL,base:env.AI_BASE_URL,key:env.AI_API_KEY,client:env.PAYPAL_CLIENT_ID,secret:env.PAYPAL_CLIENT_SECRET,dailyLimit:Math.max(1,Math.min(100,Number(env.AI_DAILY_LIMIT)||40))};
