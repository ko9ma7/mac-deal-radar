import {mkdir,copyFile,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),output=path.join(root,'_site');
const repo=process.env.GITHUB_REPOSITORY || '';
const ownerRepo=repo.split('/');
const defaultUrl=ownerRepo.length===2?`https://${ownerRepo[0].toLowerCase()}.github.io/${ownerRepo[1]}/`:'http://localhost:8000/';
const siteUrl=(process.env.SITE_URL||defaultUrl).replace(/\/?$/,'/');
if(!/^https?:\/\//.test(siteUrl))throw Error('SITE_URL must be an absolute http(s) URL');
await rm(output,{recursive:true,force:true});await mkdir(path.join(output,'assets'),{recursive:true});
for(const name of await readdir(path.join(root,'assets')))await copyFile(path.join(root,'assets',name),path.join(output,'assets',name));
for(const name of ['index.html','404.html','site.webmanifest','.nojekyll']){
  const input=await readFile(path.join(root,name),'utf-8');
  await writeFile(path.join(output,name),input.replaceAll('__SITE_URL__',siteUrl));
}
await writeFile(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+siteUrl+'sitemap.xml\n');
await writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl.replaceAll('&','&amp;')}</loc><changefreq>weekly</changefreq></url></urlset>\n`);
console.log('Static site ready:',output,'\nCanonical:',siteUrl);
