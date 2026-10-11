import assert from 'node:assert/strict';
import {collectAll,sourceList,validateSource,fetchPublic} from '../collector/scan.js';
assert.ok(sourceList().length>=8);
assert.throws(()=>validateSource({url:'http://127.0.0.1/internal'}));
assert.throws(()=>validateSource({url:'https://example.org/'}));
assert.throws(()=>validateSource({url:'https://pf.kakao.com:8443/test'}));
const f=async url=> {
  if(String(url).includes('news.google.com'))return new Response('<rss><channel><item><title>맥북 대란 할인 소식</title><link>https://news.google.com/articles/x</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>',{headers:{'content-type':'application/xml'}});
  if(String(url).includes('i-store'))return new Response('<html><body>단종 제품 할인 - Mac <h1>MacBook Pro 14 M3</h1> ₩2,660,000 ₩2,120,000</body></html>',{headers:{'content-type':'text/html'}});
  if(String(url).includes('pf.kakao'))return new Response('<html><body>Mac M3 전품목 50% 할인 쿠폰북. 맥북 전체 품절</body></html>',{headers:{'content-type':'text/html'}});
  return new Response('<html><body>MacBook 10월 프로모션 행사 안내</body></html>',{headers:{'content-type':'text/html'}});
};
const res=await collectAll({fetcher:f});
assert.equal(res.mode,'local');assert.equal(res.sources.length,11);assert.ok(res.deals.length>=2);assert.equal(res.summary.successful,11);
await assert.rejects(()=>fetchPublic('https://pf.kakao.com/anything',async()=>new Response('<html><body>로그인이 필요합니다. 계속하시려면 로그인 후</body></html>',{headers:{'content-type':'text/html'}})),/로그인/);
console.log('✓ PC 수집기: 허용 출처/키워드/뉴스/오류 테스트 통과');
