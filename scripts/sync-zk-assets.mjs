import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('contract/src/managed/private-party');
const target = resolve('public/zk/private-party');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(resolve(source, 'keys'), resolve(target, 'keys'), { recursive: true });
await cp(resolve(source, 'zkir'), resolve(target, 'zkir'), { recursive: true });
console.log(`Synced proving assets to ${target}`);
