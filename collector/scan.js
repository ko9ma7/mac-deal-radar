import {SOURCES,SEARCHES,ALLOWED_URL_HOSTS} from './sources.js';
import {parseOfficialPage,parseRSS,makeId,cleanHTML} from './extract.js';

const UA = 'MacDealRadar/2.0 (public promotional-page monitor; no authenticated access)';

export function validateSource(source) {
  if (!source || typeof source !== 'object') throw Error('수집 대상 형식이 올바르지 않습니다.');
  let u;
  try { u = new URL(source.url); } catch { throw Error('잘못된 수집 URL'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.href.length > 850 || !ALLOWED_URL_HOSTS.includes(u.hostname.toLowerCase())) {
    throw Error('허용된 HTTPS 공개 출처만 수집할 수 있습니다: ' + u.hostname);
  }
  const store = String(source.store || '기타').slice(0,40);
  return {id:String(source.id||makeId(u.href)).slice(0,80),name:String(source.name||u.hostname).slice(0,80),store,location:String(source.location||'웹페이지').slice(0,80),kind:'custom',url:u.href};
}

export function sourceList(extra=[]) {
  const byURL=new Map();
  for (const entry of [...SOURCES,...extra]) {
    const source=validateSource(entry);
    if (!byURL.has(source.url)) byURL.set(source.url,source);
  }
  return [...byURL.values()];
}

export async function fetchPublic(url, fetcher=fetch) {
  const controller = new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try {
    const response=await fetcher(url,{method:'GET',redirect:'manual',signal:controller.signal,headers:{'Accept':'text/html,application/xml,application/rss+xml,text/xml;q=0.9','User-Agent':UA}});
    if(!response.ok)throw Error('HTTP '+response.status);
    const type=response.headers.get('content-type')||'';
    if(!/html|xml|rss|text/i.test(type))throw Error('HTML/RSS 형식이 아닙니다');
    const declared=Number(response.headers.get('content-length')||0);
    if(declared>1_000_000)throw Error('페이지 용량 제한 초과');
    let body='';
    if (response.body && typeof response.body.getReader==='function') {
      const reader=response.body.getReader();
      let bytes=0;
      const chunks=[];
      try {
        while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1_000_000)throw Error('본문 크기 제한 초과');chunks.push(value);}
      } finally {await reader.cancel().catch(()=>{});}
      const merged=new Uint8Array(bytes);let off=0;for(const chunk of chunks){merged.set(chunk,off);off+=chunk.byteLength;}
      body=new TextDecoder('utf-8').decode(merged);
    } else body=String(await response.text()).slice(0,500000);
    if(body.length<40)throw Error('읽을 수 있는 공개 본문 없음');
    if(/로그인 후|로그인이 필요|sign in to view/i.test(cleanHTML(body).slice(0,2200)))throw Error('로그인/접근 제한 페이지');
    return body.slice(0,500000);
  } finally {clearTimeout(timeout);}
}

export async function scanSource(source, fetcher=fetch){
  try {
    const html=await fetchPublic(source.url,fetcher);
    const deals=parseOfficialPage(html,source,makeId);
    return {source:{id:source.id,name:source.name,url:source.url,state:'ok',message:deals.length?`${deals.length}개 관련 텍스트 감지 · 판매가·재고는 별도 검증`:'공개 페이지는 읽었으나 맥북 관련 정보 없음'},deals};
  } catch (err) {
    return {source:{id:source.id,name:source.name,url:source.url,state:'error',message:String(err.message||'접근 실패').slice(0,150)},deals:[]};
  }
}
export async function scanNews(source, fetcher=fetch){
  const url='https://news.google.com/rss/search?q='+encodeURIComponent(source.q+' when:30d')+'&hl=ko&gl=KR&ceid=KR:ko';
  try {const xml=await fetchPublic(url,fetcher);if(!/<rss\b/i.test(xml))throw Error('RSS 형식 아님');const deals=parseRSS(xml,source,makeId);return {source:{id:source.id,name:source.name,url,state:'ok',message:`관련 보도 ${deals.length}건 · 공식 할인 확정 정보 아님`},deals};}
  catch(err){return {source:{id:source.id,name:source.name,url,state:'error',message:String(err.message||'RSS 실패').slice(0,150)},deals:[]};}
}

// Concurrency is intentionally limited, to avoid hammering small shop sites.
export async function collectAll({extraSources=[],fetcher=fetch,includeNews=true,onProgress=()=>{}}={}) {
  const tasks=[...sourceList(extraSources).map(source=>()=>scanSource(source,fetcher)),...(includeNews?SEARCHES.map(source=>()=>scanNews(source,fetcher)):[])];
  let next=0;
  const outcomes=new Array(tasks.length);
  async function worker() {while(next<tasks.length){const i=next++;outcomes[i]=await tasks[i]();onProgress(outcomes[i].source,i,tasks.length);}}
  await Promise.all(Array.from({length:Math.min(3,tasks.length)},worker));
  const deals=[...new Map(outcomes.flatMap(o=>o.deals).map(deal=>[deal.id,deal])).values()];
  deals.sort((a,b)=>(b.discountPercent??-1)-(a.discountPercent??-1));
  return {mode:'local',scannedAt:new Date().toISOString(),deals,sources:outcomes.map(o=>o.source),summary:{successful:outcomes.filter(o=>o.source.state==='ok').length,total:outcomes.length},notice:'수집은 공개 본문 키워드/가격 추출입니다. 실시간 매장 재고·결제 성공을 확인한 것은 아닙니다.'};
}
