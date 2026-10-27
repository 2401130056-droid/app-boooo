
const CACHE='boomerang-core-5358b689cd3a', OPTIONAL='boomerang-resources-5358b689cd3a';
const ROOT=new URL('./',self.location.href);
const CORE=['index.html','offline.html','manifest.webmanifest','pwa.js','logo.png','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
const EXTERNAL=[
'https://fonts.googleapis.com/css2?family=Sora:wght@600&display=swap',
'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
async function cacheExternal(url, cache, dependencies=true){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const response=await fetch(url,{mode:'cors',signal:controller.signal});if(!response.ok)return;
 const css=dependencies&&(response.headers.get('content-type')||'').includes('text/css')?await response.clone().text():'';
 await cache.put(url,response);
 if(css){const urls=[...css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)].map(m=>new URL(m[1],url)).filter(u=>isStaticExternal(u)&&u.protocol==='https:');await Promise.allSettled([...new Set(urls.map(u=>u.href))].map(u=>cacheExternal(u,cache,false)));}
 }finally{clearTimeout(timer);}
}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE.map(path=>new Request(new URL(path,ROOT),{cache:'reload'})));const optional=await caches.open(OPTIONAL);await Promise.allSettled(EXTERNAL.map(url=>cacheExternal(url,optional)));})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if((key.startsWith('boomerang-core-')||key.startsWith('boomerang-resources-'))&&key!==CACHE&&key!==OPTIONAL)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
function isStaticExternal(url){return ['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net','cdnjs.cloudflare.com'].includes(url.hostname);}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||!['http:','https:'].includes(url.protocol))return;
 // Do not cache coordinates, postal-code lookups, map tiles, payment APIs or app records.
 if(url.origin!==ROOT.origin){if(!isStaticExternal(url))return;event.respondWith((async()=>{const cache=await caches.open(OPTIONAL),saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok)event.waitUntil(cache.put(request,response.clone()).catch(()=>{}));return response;})());return;}
 if(!url.pathname.startsWith(ROOT.pathname))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);try{const response=await fetch(request,{signal:controller.signal});if(response.ok)return response;}catch(error){}finally{clearTimeout(timer);}const cache=await caches.open(CACHE);return await cache.match(new URL('index.html',ROOT))||await cache.match(new URL('offline.html',ROOT))||Response.error();})());return;
 }
 const relative=url.pathname.slice(ROOT.pathname.length);if(!CORE.includes(relative))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(new URL(relative,ROOT));return saved||fetch(request);})());
});
