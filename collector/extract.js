export function unescapeEntities(input='') {
  const named={nbsp:' ',amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',copy:'©',middot:'·',bull:'•',hellip:'…',times:'×',won:'₩'};
  return String(input).replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi,(whole,entity)=>{
    if(entity[0]!=='#')return named[entity.toLowerCase()]??whole;
    const hex=entity[1].toLowerCase()==='x'; const n=Number.parseInt(entity.slice(hex?2:1),hex?16:10);
    return Number.isFinite(n)&&n>0&&n<=0x10FFFF?String.fromCodePoint(n):whole;
  });
}
export function cleanHTML(html){return unescapeEntities(String(html)
  .replace(/<(script|style|noscript|svg|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<\/(?:p|div|li|h[1-6]|a|section|article|tr|td|span)>/gi,'\n')
  .replace(/<br\s*\/?\s*>/gi,'\n')
  .replace(/<[^>]*>/g,' ')
  .replace(/[ \t\u00a0]+/g,' ')
  .replace(/\n\s*\n+/g,'\n')).trim().slice(0,220000);
}
export function readTitle(html) {
  let t=html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1]
    ||html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1]
    ||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
  return unescapeEntities(t.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim().slice(0,130);
}
export function hasMacRelevance(text) { return /맥북|macbook|\bmac\s*m[1-9]\b|\bm[1-9]\s*(?:mac|전품목|max|pro)\b|mac\s*단종/i.test(text); }
export function findDiscount(text){
  const around=text.match(/(?:MacBook|맥북|Mac\s*M\d|M3\s*전품목)[^\n]{0,125}/i)?.[0]||'';
  const first=(around.match(/(\d{1,2})\s*%\s*(?:카드\s*)?할인/)||around.match(/(\d{1,2})\s*%/))?.[1];
  return first?Number(first):null;
}
export function findSnippet(text){const normalized=text.replace(/\s+/g,' ').trim();const m=/맥북|MacBook|Mac\s*M[1-9]|M3\s*전품목/i.exec(normalized);if(!m)return normalized.slice(0,240);const start=Math.max(0,m.index-45);return normalized.slice(start,start+320).trim();}
export function parseIstoreDeals(html,source,makeId){const text=cleanHTML(html).replace(/\s+/g,' ');const out=[];const start=text.indexOf('단종 제품 할인 - Mac');const slice=(start>=0?text.slice(start,start+14000):text.slice(0,14000));
  // Every price pair is accepted only when preceded by a recognizable MacBook model name.
  const pattern=/(MacBook\s+(?:Air|Pro)\s+\d{2}\s+M[1-9][^₩]{0,150}?)\s*₩\s*([\d,]{5,15})\s*₩\s*([\d,]{5,15})/gi;let match;
  while((match=pattern.exec(slice))!==null&&out.length<14){const title=match[1].replace(/\s+/g,' ').trim().slice(0,112);const original=Number(match[2].replaceAll(',',''));const price=Number(match[3].replaceAll(',',''));if(!Number.isFinite(price)||!Number.isFinite(original)||price<=0||price>original||original>20000000)continue;
  const key=title.toLowerCase().replace(/[^a-z0-9가-힣]/g,'').slice(0,65);if(out.some(r=>r.title===title))continue;
  out.push({id:makeId(source.url+key),title,store:source.store,location:source.location,category:'offer',originalPrice:original,price,discountPercent:Math.round((1-price/original)*100),status:'unknown',statusDetail:'온라인 가격표 확인, 매장/POS 재고 별도 확인',condition:'공식 단종제품 세일. 결제 시점 가격 및 재고 재확인',description:'실제 공개된 가격 2개를 추출했습니다. 결제 완료 가능 여부는 미검증.',url:source.url,sourceType:'official',sourceStatus:'live',publishedAt:null});}
  return out;
}
export function parseOfficialPage(html,source,makeId){const text=cleanHTML(html),title=readTitle(html);if(!hasMacRelevance(text+' '+title))return [];
  if(source.store==='i-Store'){const list=parseIstoreDeals(html,source,makeId);if(list.length)return list;}
  const snippet=findSnippet(text);const discount=findDiscount(text);const isExplicitMacbookSoldout=source.id==='astore-suwon'&&/맥북\s*(?:전체|제품은 모두)[^\n]{0,30}(?:품절|판매\s*완료)|MacBook\s*전체\s*품절/i.test(text);
  let condition='카드/쿠폰 및 적용 모델 조건은 원문에서 확인 필요';
  if(/신세계\s*PLUS|신세계PLUS|삼성카드/i.test(text)&&/쿠폰/i.test(text))condition='이마트 신세계PLUS 삼성카드 및 쿠폰 조건 확인 필요';
  const dealTitle=source.store==='A-STORE'&&/M3/i.test(snippet)?`${source.location} Mac M3 공식 행사 언급`:source.store==='i-Store'?'i-Store Mac 할인 상품 공지':`${source.name} 맥 제품 행사 관련 내용`;
  return [{id:makeId(source.url),title:dealTitle,store:source.store,location:source.location,category:discount!==null?'offer':'notice',price:null,originalPrice:null,discountPercent:discount,status:isExplicitMacbookSoldout?'soldout':'unknown',statusDetail:isExplicitMacbookSoldout?'수원점 맥북 전체 품절 문구 확인':'공개 페이지 읽기 성공. 실시간 재고는 미제공',condition,description:snippet.slice(0,220)||'공식 행사 페이지 확인',url:source.url,sourceType:'official',sourceStatus:'live',publishedAt:null}];
}
export function parseRSS(xml,query,makeId){const out=[];const blocks=String(xml).match(/<item>[^]*?<\/item>/gi)||[];for(const block of blocks.slice(0,25)){
  const extract=tag=>unescapeEntities((block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'))||[])[1]||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,'').trim();
  const title=extract('title'),link=extract('link'),pubDate=extract('pubDate');if(!/맥북|macbook|에이스토어/i.test(title)||!/할인|세일|대란|특가|쿠폰|품절|재고/i.test(title))continue;
  const when=Date.parse(pubDate);if(!when||Math.abs(Date.now()-when)>1000*60*60*24*45)continue;
  if(!/^https:\/\//i.test(link))continue;
  out.push({id:makeId(link),title:title.slice(0,155),store:'기타',location:query.name,category:'mention',price:null,originalPrice:null,discountPercent:null,status:'unknown',statusDetail:'뉴스·검색 결과이며 판매처 재고 정보가 아닙니다',condition:'관련 언급만 탐지. 가격과 행사 조건은 원문에서 별도 검증',description:`${query.name} 관련 공개 검색에 노출된 기사/언급입니다. 판매 행사 확정 정보로 간주하지 마세요.`,url:link,sourceType:'mention',sourceStatus:'live',publishedAt:new Date(when).toISOString()});
}return out;}
export function makeId(str){let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return 'deal-'+(h>>>0).toString(36);}
