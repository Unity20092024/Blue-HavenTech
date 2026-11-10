import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from '../server/contact.ts';
import { validateInquiry } from '../src/contact-fields.ts';

// Test-only fixtures. Network calls are always replaced; no real credentials
// are used and no provider requests or emails are sent by these tests.
const env = {
  CONTACT_FORM_ENABLED:'true', RESEND_API_KEY:'unit-test-only', RESEND_FROM_EMAIL:'contact@inquiries.havenbluetech.com',
  UPSTASH_REDIS_REST_URL:'https://unit-test.upstash.io', UPSTASH_REDIS_REST_TOKEN:'unit-test-only',
  CONTACT_RATE_LIMIT_SALT:'test-only-salt-not-a-live-secret-at-least-32-characters',
  CONTACT_ALLOWED_ORIGINS:'https://preview.example.test', VERCEL_ENV:'preview',
};
const valid = {name:'Test Visitor',email:'visitor@example.test',company:'Test Business',interest:'Practical technology direction',message:'Please discuss a website inquiry with me.',website:'',consent:true,submissionId:'dd229d00-8935-4fcb-a1ca-7148f743c277'};
const request = (value=valid, options={}) => new Request('https://preview.example.test/api/contact', {
  method:options.method??'POST', headers:{origin:'https://preview.example.test','content-type':'application/json','x-vercel-forwarded-for':'203.0.113.25',...options.headers},
  ...(options.method==='GET'?{}:{body:options.raw??JSON.stringify(value)}),
});
function fixture(options={}) {
  const calls=[];const logs=[];
  const handler=createContactHandler({env:options.env??env,now:()=>Date.UTC(2026,10,10),log:event=>logs.push(event),fetch:async(url,init)=>{
    calls.push({url,init});
    if(String(url).includes('upstash.io'))return options.redis?options.redis(url,init):Response.json({result:[1,0]});
    return options.email?options.email(url,init):Response.json({id:'test-provider-acceptance-id'});
  }});
  return {handler,calls,logs};
}

test('disabled/missing configuration fails closed without network or PII logging',async()=>{
  for(const settings of [{},{...env,CONTACT_FORM_ENABLED:'false'},{...env,RESEND_API_KEY:undefined},{...env,CONTACT_RATE_LIMIT_SALT:'short'},{...env,RESEND_FROM_EMAIL:'attacker@example.test'},{...env,UPSTASH_REDIS_REST_URL:'https://attacker.example.test'}]){
    const f=fixture({env:settings});const r=await f.handler(request());assert.equal(r.status,503);assert.equal(f.calls.length,0);assert.match((await r.json()).message,/not available/);
    assert.doesNotMatch(JSON.stringify(f.logs),/visitor@|203\.0\.113|Please discuss|unit-test-only/);
  }
});
test('method, same-origin and JSON-only gates prevent foreign submission',async()=>{
  for(const [req,status] of [[request(valid,{method:'GET'}),405],[request(valid,{headers:{origin:'https://attacker.example'}}),403],[request(valid,{headers:{origin:''}}),403],[request(valid,{headers:{'sec-fetch-site':'cross-site'}}),403],[request(valid,{headers:{'content-type':'text/plain'}}),415]]){
    const f=fixture();const r=await f.handler(req);assert.equal(r.status,status);assert.equal(f.calls.length,0);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('access-control-allow-origin'),null);
  }
});
test('explicit Preview system URL is allowed without trusting request Host',async()=>{
  const f=fixture({env:{...env,CONTACT_ALLOWED_ORIGINS:undefined,VERCEL_URL:'preview.example.test'}});
  assert.equal((await f.handler(request())).status,202);
  assert.equal((await f.handler(request(valid,{headers:{origin:'https://forged.example',host:'forged.example'}}))).status,403);
});
test('invalid JSON, a declared oversized body, and an undeclared oversized stream are rejected',async()=>{
  for(const [req,status] of [[request(valid,{raw:'{broken'}),400],[request(valid,{headers:{'content-length':'999999'}}),413],[request(valid,{raw:'a'.repeat(25000)}),413]]){
    const f=fixture();assert.equal((await f.handler(req)).status,status);assert.equal(f.calls.length,0);
  }
});
test('server validation rejects malformed, forged, overlong and non-consenting inquiries',async()=>{
  const examples=[{...valid,name:'   '},{...valid,email:'visitor@example.test\r\nBcc: attacker@example.test'},{...valid,message:'short'},{...valid,message:'x'.repeat(5001)},{...valid,company:'a'.repeat(181)},{...valid,name:42},{...valid,interest:'Unlisted service'},{...valid,consent:false},{...valid,consent:'true'},{...valid,submissionId:'not-an-id'},{...valid,to:'attacker@example.test'},[],null];
  for(const input of examples){const f=fixture();assert.equal((await f.handler(request(input))).status,422);assert.equal(f.calls.length,0);}
  assert.ok(validateInquiry({...valid,name:' Zoë O’Neil ',message:'Multiline inquiry\nwith a second line.'}).inquiry);
});
test('honeypot rejects bots without sending or faking success',async()=>{
  const f=fixture();assert.equal((await f.handler(request({...valid,website:'https://bot.example'}))).status,400);assert.equal(f.calls.length,0);
});
test('missing platform client identity fails closed rather than trusting forwarded input',async()=>{
  const f=fixture();const r=await f.handler(request(valid,{headers:{'x-vercel-forwarded-for':'','x-forwarded-for':'203.0.113.50'}}));assert.equal(r.status,503);assert.equal(f.calls.length,0);
});
test('shared rate denial returns 429 with retry information and never calls email',async()=>{
  const f=fixture({redis:()=>Response.json({result:[0,880]})});const r=await f.handler(request());assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'880');assert.equal(f.calls.length,1);
});
test('Redis failure, malformed result or error object cannot bypass rate protection',async()=>{
  for(const redis of [()=>{throw new Error('test-only network failure');},()=>Response.json({error:'not allowed'}),()=>Response.json({result:[1,'forged']}),()=>new Response('',{status:503})]){
    const f=fixture({redis});assert.equal((await f.handler(request())).status,503);assert.equal(f.calls.length,1);
  }
});
test('provider acceptance is reported accurately with fixed inbox, reply-to and idempotency',async()=>{
  const f=fixture();const r=await f.handler(request());assert.equal(r.status,202);assert.match((await r.json()).message,/Inbox delivery is not confirmed/);
  const payload=JSON.parse(f.calls[1].init.body);assert.deepEqual(payload.to,['mplsmntowers@gmail.com']);assert.equal(payload.reply_to,valid.email);assert.equal(payload.from,'Haven BlueTech <contact@inquiries.havenbluetech.com>');assert.equal(payload.subject,'Haven BlueTech website inquiry');assert.equal(payload.html,undefined);
  assert.equal(f.calls[1].init.headers['Idempotency-Key'],`haven-contact/${valid.submissionId}`);assert.equal(f.calls[1].init.redirect,'error');
  const limitBody=f.calls[0].init.body;assert.doesNotMatch(limitBody,/203\.0\.113|visitor@|Test Visitor|Please discuss/);assert.match(limitBody,/EVAL/);
  assert.doesNotMatch(JSON.stringify(f.logs),/visitor@|203\.0\.113|Please discuss|unit-test-only/);assert.equal(f.logs.at(-1).event,'contact.provider_accepted');
});
test('retries reuse provider idempotency; changed content gets a client-generated new id',async()=>{
  const f=fixture();await f.handler(request());await f.handler(request());const emails=f.calls.filter(c=>c.url.includes('resend.com'));assert.equal(emails[0].init.headers['Idempotency-Key'],emails[1].init.headers['Idempotency-Key']);
});
test('provider failures, invalid JSON or missing acceptance ID never report success',async()=>{
  for(const email of [()=>{throw new Error('test-only timeout');},()=>Response.json({message:'failed'},{status:500}),()=>new Response('bad-json'),()=>Response.json({})]){
    const f=fixture({email});const r=await f.handler(request());assert.equal(r.status,502);assert.match((await r.json()).message,/could not confirm/);assert.equal(f.logs.at(-1).event,'contact.provider_unconfirmed');
  }
});
