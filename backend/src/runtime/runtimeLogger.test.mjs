import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  createRuntimeLogger,
  formatRuntimeLog,
  redactRuntimeText,
  sanitizeRuntimeFields,
  runtimeErrorCode,
  createFileLogWriter,
  readBoundedRuntimeLog
} from './runtimeLogger.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const fixedNow = () => new Date('2026-08-01T10:00:00.000Z');

test('G1 minimal deterministic record', () => {
  assert.equal(formatRuntimeLog({level:'info',component:'match_route',event:'tracking_start'}, {now:fixedNow}), '[2026-08-01T10:00:00.000Z] level=info component=match_route event=tracking_start');
});
test('G2 invalid level normalizes', () => assert.match(formatRuntimeLog({level:'fatal',component:'x',event:'y'}, {now:fixedNow}), /level=info/));
test('G3 unknown fields omitted', () => assert.doesNotMatch(formatRuntimeLog({component:'x',event:'y',fields:{url:'https://secret',eventId:'7'}}, {now:fixedNow}), /url=/));
test('G4 complex objects omitted', () => assert.deepEqual(sanitizeRuntimeFields({eventId:{raw:1},count:[1]}), {}));
test('G5 Error object omitted and code normalized', () => { const e=new Error('SECRET_MESSAGE'); e.code='LOGIN-SPAWN-FAILED'; assert.equal(runtimeErrorCode(e,'fallback'),'login_spawn_failed'); assert.doesNotMatch(formatRuntimeLog({component:'x',event:'y',fields:{error:e}}, {now:fixedNow}), /SECRET_MESSAGE|stack/); });
for (const [name, value, marker] of [
 ['G6 authorization','Authorization: Bearer abc','abc'],
 ['G7 cookie','Cookie: session=abc','abc'],
 ['G8 token','access_token=abc','abc'],
 ['G9 app key','BETFAIR_APP_KEY=abc','abc'],
 ['G10 http URL','https://host/path?token=abc','host'],
 ['G11 websocket URL','ws://127.0.0.1:9224/devtools/browser/id','devtools'],
 ['G12 query string URL','https://host/path?a=1','host'],
 ['G13 Windows path','C:\\Users\\Utente\\Profile','Utente'],
 ['G14 POSIX path','/home/user/profile','user/profile']
]) test(name, () => { const result=redactRuntimeText(value); assert.doesNotMatch(result, new RegExp(marker)); assert.match(result, /<redacted>/i); });
test('G15 control characters removed', () => assert.equal(redactRuntimeText('a\r\nb\t\x00c'), 'a b c'));
test('G16 injection stays one line', () => { const v=redactRuntimeText('x\n[Admin] event=success'); assert.equal(v.split('\n').length,1); });
test('G17 long line truncated', () => assert.match(redactRuntimeText('x'.repeat(2000), 100), /<truncated>$/));
test('G18 safe primitives preserved', () => { const line=formatRuntimeLog({component:'x',event:'y',fields:{eventId:'123',pid:55,port:3001,count:2,ok:true}}, {now:fixedNow}); for (const token of ['eventId="123"','pid=55','port=3001','count=2','ok=true']) assert.match(line,new RegExp(token)); });
test('G19 stdout writer', () => { const out=[]; const err=[]; createRuntimeLogger({stdout:l=>out.push(l),stderr:l=>err.push(l),now:fixedNow}).info('x','y'); assert.equal(out.length,1); assert.equal(err.length,0); });
test('G20 stderr writer', () => { const out=[]; const err=[]; createRuntimeLogger({stdout:l=>out.push(l),stderr:l=>err.push(l),now:fixedNow}).error('x','y'); assert.equal(out.length,0); assert.equal(err.length,1); });
test('G21 writer failure isolated', () => { const logger=createRuntimeLogger({stdout(){throw new Error('raw')},stderr(){},now:fixedNow}); assert.doesNotThrow(()=>logger.info('x','y')); });
test('G33/G34 file writer is fixed and failure-safe', () => { const calls=[]; const writer=createFileLogWriter({filePath:'/fixed/sofa_debug.log',mkdir(){},appendFile(...args){calls.push(args)}}); assert.equal(writer('https://secret/path').ok,true); assert.equal(calls.length,1); assert.doesNotMatch(calls[0][1],/secret/); const broken=createFileLogWriter({filePath:'/fixed/x',mkdir(){throw new Error('raw')}}); assert.deepEqual(broken('x'),{ok:false,code:'log_write_failed'}); });
test('G41 missing file safe', () => assert.deepEqual(readBoundedRuntimeLog('/missing',{statSync(){const e=new Error();e.code='ENOENT';throw e}}),{status:'not_found',lines:[]}));
test('G42 read failure safe', () => assert.deepEqual(readBoundedRuntimeLog('/x',{statSync(){throw new Error('raw')}}),{status:'read_failed',lines:[]}));
test('G43-G45 bounded legacy reader', () => { const text=Array.from({length:250},(_,i)=>`line${i} token=secret${i}`).join('\n'); const buffer=Buffer.from(text); const result=readBoundedRuntimeLog('/x',{statSync(){return {size:buffer.length}},openSync(){return 1},readSync(_fd,target){buffer.copy(target);return buffer.length},closeSync(){}}); assert.equal(result.lines.length,200); assert.ok(result.lines.every(line=>line.length<=1000)); assert.ok(result.lines.every(line=>!line.includes('secret'))); });

test('RG1-RG4 complete sensitive headers', () => {
  const cases = [
    ['Authorization: Basic dXNlcjpwYXNz', ['dXNlcjpwYXNz']],
    ['Authorization: Digest username="u", response="secret"', ['username', 'response', 'secret']],
    ['Cookie: foo=bar; sessionid=abcdef; pref=hello', ['foo=bar', 'abcdef', 'pref=hello']],
    ['Set-Cookie: sid=abc; Path=/; HttpOnly', ['sid=abc', 'Path=', 'HttpOnly']]
  ];
  for (const [value, forbidden] of cases) {
    const result = redactRuntimeText(value);
    for (const marker of forbidden) assert.equal(result.includes(marker), false, value);
    assert.match(result, /<redacted>/i);
  }
});
test('RG5-RG6 quoted JSON sensitive values', () => {
  const input = '{"token":"abc","Authorization":"Basic hidden","Cookie":"sid=xyz","safe":"value"}';
  const result = redactRuntimeText(input);
  for (const marker of ['"abc"', 'Basic hidden', 'sid=xyz']) assert.equal(result.includes(marker), false);
  assert.equal(result.includes('"safe":"value"'), true);
});
test('RG7-RG10 Windows UNC and arbitrary POSIX paths', () => {
  const cases = [
    ['C:/Users/Utente/Profile', 'Utente'],
    ['C:\\Users\\Utente\\Profile', 'Utente'],
    ['\\\\server\\share\\folder', 'server'],
    ['\\\\?\\C:\\Users\\Utente\\Profile', 'Utente'],
    ['/workspace/project/.env', 'workspace'],
    ['/usr/local/bin/python', 'usr/local'],
    ['/app/runtime/file', 'app/runtime'],
    ['/root/.config', 'root/.config']
  ];
  for (const [value, marker] of cases) {
    const result = redactRuntimeText(value);
    assert.equal(result.includes(marker), false, value);
    assert.match(result, /<redacted>/i);
  }
});
test('RG11-RG12 finite numbers preserved and non-finite omitted', () => {
  assert.deepEqual(sanitizeRuntimeFields({ port: 3001, attempt: 1.5, count: 0 }), { port: 3001, attempt: 1.5, count: 0 });
  assert.deepEqual(sanitizeRuntimeFields({ port: Number.NaN, attempt: Infinity, count: -Infinity }), {});
});
test('RG13 bounded legacy reader uses complete redactor', () => {
  const text = [
    'Authorization: Basic dXNlcjpwYXNz',
    'Cookie: foo=bar; sid=abcdef',
    'C:/Users/Utente/Profile',
    '/workspace/project/.env',
    '{"token":"abc"}'
  ].join('\\n');
  const buffer = Buffer.from(text);
  const result = readBoundedRuntimeLog('/legacy', {
    statSync(){ return { size: buffer.length }; },
    openSync(){ return 1; },
    readSync(_fd, target){ buffer.copy(target); return buffer.length; },
    closeSync(){}
  });
  assert.equal(result.status, 'ok');
  const serialized = JSON.stringify(result.lines);
  for (const marker of ['dXNlcjpwYXNz', 'abcdef', 'Utente', 'workspace', '"abc"']) {
    assert.equal(serialized.includes(marker), false, marker);
  }
});

console.log(`G1-G21/G33-G45 and RG1-RG13 runtimeLogger tests passed (${passed})`);
