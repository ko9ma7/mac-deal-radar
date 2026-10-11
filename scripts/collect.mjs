import {readFile,writeFile,mkdir,copyFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectAll} from '../collector/scan.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourcePath=path.join(root,'data/custom-sources.json');
const dest=path.join(root,'assets/deals.json');
const archiveDir=path.join(root,'backups');
async function main(){
  let config;
  try {config=JSON.parse(await readFile(sourcePath,'utf-8'));}
  catch(err){throw Error('data/custom-sources.json을 확인하세요: '+err.message);}
  if(!Array.isArray(config.sources))throw Error('custom-sources.json은 {"sources":[]} 형식이어야 합니다.');
  if(config.sources.length>35)throw Error('추가 수집 출처는 35개 이하로 제한합니다.');
  console.log('맥딜 레이더 · PC 공개 페이지 수집 시작');
  const results=await collectAll({extraSources:config.sources,includeNews:config.includeNews!==false,onProgress:(s,index,total)=>{
    console.log(`[${index+1}/${total}] ${s.state==='ok'?'성공':'실패'} - ${s.name} ${s.state==='error'?s.message:''}`);
  }});
  // Do not overwrite the previous working snapshot on a complete access outage.
  if(results.summary.successful===0)throw Error('모든 출처 수집 실패: 기존 deals.json을 보존했습니다. 네트워크/출처 차단을 확인하세요.');
  await mkdir(archiveDir,{recursive:true});
  try{await copyFile(dest,path.join(archiveDir,`deals-before-${new Date().toISOString().replaceAll(':','-')}.json`));}catch(err){if(err.code!=='ENOENT')throw err;}
  const tmp=dest+'.tmp';
  await writeFile(tmp,JSON.stringify(results,null,2)+'\n','utf-8');
  await rename(tmp,dest);
  console.log(`\n저장 완료: assets/deals.json / 항목 ${results.deals.length}개 / 성공 ${results.summary.successful}/${results.summary.total}개 출처`);
  console.log('이 결과는 매장 재고를 확인한 정보가 아닙니다.');
}
main().catch(err=>{console.error('수집 중단:',err.message);process.exitCode=1;});
